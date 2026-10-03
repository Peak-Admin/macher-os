import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, datumKurz, heute, personName, uhrzeit } from '@core/format';
import type { ID, Termin } from '@core/objects';
import { BeispielMarke, Button, Dialog, Eingabe, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { Personen } from '@ui/person';
import { regelText } from './regel';
import { abwesenheitsKonflikte, serieAktiv, serieBeenden, serien, serienTermine, terminAuslassen, termineErzeugen, terminDatum, terminVerschieben, HORIZONT_MONATE } from './daten';
import { servicevertraege } from '../servicevertraege/daten';

const STATUS: Record<Termin['status'], { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' | 'achtung' }> = {
  geplant: { text: 'Geplant', ton: 'neutral' },
  bestaetigt: { text: 'Bestätigt', ton: 'aktiv' },
  unterwegs: { text: 'Unterwegs', ton: 'aktiv' },
  vor_ort: { text: 'Vor Ort', ton: 'aktiv' },
  erledigt: { text: 'Erledigt', ton: 'erfolg' },
  abgesagt: { text: 'Abgesagt', ton: 'neutral' },
};

const Team = ({ ids }: { ids: ID[] }) => (ids.length ? <Personen ids={ids} namen /> : <>niemand eingeteilt</>);

export function SerieDetail() {
  useDatenstand();
  const { id = '' } = useParams();
  const s = serien.useOne(id);
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const [verschieben, setVerschieben] = useState<Termin | null>(null);

  if (!s || s.geloeschtAm)
    return (
      <Seite titel="Serie nicht gefunden" zurueck={{ to: '/plan/wiederkehrend', label: 'Wiederkehrende Termine' }}>
        <Leer titel="Diese Serie gibt es nicht (mehr)." icon="wiederholen" aktion={<Button to="/plan/wiederkehrend">Zur Übersicht</Button>} />
      </Seite>
    );

  const termine = serienTermine(s.id);
  const kommende = termine.filter((t) => terminDatum(t.start) >= heute());
  const vergangene = termine.filter((t) => terminDatum(t.start) < heute()).slice(-5).reverse();
  const konflikte = abwesenheitsKonflikte(heute(), 90).filter((k) => k.serieId === s.id);
  const aktiv = serieAktiv(s);
  const vertrag = servicevertraege.get(s.vertragId);
  const anlagen = (s.anlageIds ?? []).map((x) => db.anlagen.get(x)).filter(Boolean);

  const beenden = async () => {
    const ok = await fragen('Serie beenden?', 'Ab morgen entstehen keine neuen Termine mehr. Künftige, noch nicht begonnene Termine werden abgesagt (Papierkorb).', 'Serie beenden');
    if (!ok) return;
    const n = serieBeenden(s.id);
    toast(n ? `Serie beendet, ${n === 1 ? '1 Termin' : `${n} Termine`} abgesagt.` : 'Serie beendet.');
  };

  const auslassen = async (t: Termin) => {
    const ok = await fragen('Termin auslassen?', `Der Termin am ${datum(t.start)} fällt aus. Die Serie läuft danach normal weiter.`, 'Termin auslassen');
    if (!ok) return;
    const vorher = serien.get(s.id)?.ausnahmen ?? [];
    terminAuslassen(t.id);
    const neu = (serien.get(s.id)?.ausnahmen ?? []).find((d) => !vorher.includes(d)) ?? terminDatum(t.start);
    toast('Termin ausgelassen.', { aktion: { label: 'Rückgängig', onClick: () => wiederAufnehmen(neu, t.id) } });
  };

  const wiederAufnehmen = (d: string, terminId?: string) => {
    const akt = serien.get(s.id)!;
    if (terminId && db.termine.allMitGeloeschten().some((x) => x.id === terminId)) db.termine.restore(terminId);
    serien.update(s.id, { ausnahmen: akt.ausnahmen.filter((x) => x !== d), erzeugt: terminId ? akt.erzeugt : akt.erzeugt.filter((x) => x !== d) });
    if (!terminId) termineErzeugen(serien.get(s.id)!);
    toast('Termin ist wieder in der Serie.');
  };

  return (
    <Seite
      titel={s.titel}
      oberzeile="Serie"
      status={
        <>
          {aktiv ? <Status ton="erfolg">Läuft</Status> : <Status>Beendet {s.ende ? `am ${datum(s.ende)}` : ''}</Status>}
          <BeispielMarke zeigen={s.beispiel} />
        </>
      }
      untertitel={
        <>
          {regelText(s.start, s.regel)}, {s.uhrzeit} Uhr · <Team ids={s.mitarbeiterIds} />
        </>
      }
      zurueck={{ to: '/plan/wiederkehrend', label: 'Wiederkehrende Termine' }}
      aktion={aktiv ? <Button icon="stift" variante="sekundaer" to={`/plan/wiederkehrend/${s.id}/bearbeiten`}>Bearbeiten</Button> : undefined}
    >
      <ZweiSpalten
        haupt={
          <>
            {konflikte.map((k) => (
              <Meldung key={k.terminId + k.mitarbeiterId} ton="achtung" titel={`${datum(k.datum)}: ${personName(db.mitarbeiter.get(k.mitarbeiterId))} ist abwesend`}>
                {k.beantragt ? 'Abwesenheit ist beantragt.' : 'Abwesenheit ist genehmigt.'} Verschieb den Termin oder teile in der Serie jemand anderen ein.
              </Meldung>
            ))}
            <Karte titel="Nächste Termine" icon="kalender">
              <Liste
                leer={
                  <Leer
                    titel={aktiv ? 'Gerade keine kommenden Termine' : 'Serie ist beendet'}
                    text={aktiv ? `Lotte legt Termine immer ${HORIZONT_MONATE} Monate im Voraus an.` : 'Es entstehen keine neuen Termine mehr.'}
                    icon="kalender"
                  />
                }
              >
                {kommende.map((t) => {
                  const p = pfadZu({ typ: 'termine', id: t.id });
                  const auftrag = db.auftraege.get(t.auftragId);
                  return (
                    <ListenZeile
                      key={t.id}
                      titel={
                        <>
                          {datumKurz(t.start)}, {uhrzeit(t.start)}–{uhrzeit(t.ende)} Uhr{' '}
                          <Status ton={STATUS[t.status].ton} icon={false}>{STATUS[t.status].text}</Status>
                        </>
                      }
                      untertitel={
                        <>
                          <Team ids={t.mitarbeiterIds} />
                          {auftrag ? ` · Auftrag ${auftrag.nummer}` : null}
                        </>
                      }
                      rechts={
                        ['geplant', 'bestaetigt'].includes(t.status) ? (
                          <Zeile abstand={4} umbruch>
                            {p && <Button klein variante="tertiaer" to={p}>Öffnen</Button>}
                            <Button klein variante="tertiaer" onClick={() => setVerschieben(t)}>Verschieben</Button>
                            <Button klein variante="tertiaer" onClick={() => auslassen(t)}>Auslassen</Button>
                          </Zeile>
                        ) : p ? (
                          <Button klein variante="tertiaer" to={p}>Öffnen</Button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </Liste>
            </Karte>
            {vergangene.length > 0 && (
              <Karte titel="Zuletzt" icon="uhr">
                <Liste>
                  {vergangene.map((t) => (
                    <ListenZeile
                      key={t.id}
                      titel={`${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`}
                      untertitel={<Team ids={t.mitarbeiterIds} />}
                      rechts={<Status ton={STATUS[t.status].ton}>{STATUS[t.status].text}</Status>}
                    />
                  ))}
                </Liste>
              </Karte>
            )}
          </>
        }
        seite={
          <>
            <Karte titel="Details" icon="info" kompakt>
              <Stapel abstand={8}>
                <Meta>Erster Termin: {datum(s.start)}</Meta>
                <Meta>Dauer: {s.dauerMinuten} Minuten</Meta>
                {s.ende && <Meta>Endet: {datum(s.ende)}</Meta>}
                {s.kundeId && (
                  <Meta>
                    Kunde: <ObjektLink bezug={{ typ: 'kunden', id: s.kundeId }}>{db.kunden.get(s.kundeId)?.name ?? '–'}</ObjektLink>
                  </Meta>
                )}
                {s.ortId && (
                  <Meta>
                    Ort: <ObjektLink bezug={{ typ: 'orte', id: s.ortId }}>{db.orte.get(s.ortId)?.bezeichnung ?? '–'}</ObjektLink>
                  </Meta>
                )}
                {anlagen.map((a) => (
                  <Meta key={a!.id}>
                    Anlage: <ObjektLink bezug={{ typ: 'anlagen', id: a!.id }}>{a!.typ}</ObjektLink>
                  </Meta>
                ))}
                {vertrag && (
                  <Meta>
                    Servicevertrag: <Link to={`/auftraege/servicevertraege/${vertrag.id}`}>{vertrag.nummer}</Link>
                  </Meta>
                )}
                {s.notiz && <Meta>Notiz: {s.notiz}</Meta>}
              </Stapel>
            </Karte>
            {s.ausnahmen.filter((d) => d >= heute()).length > 0 && (
              <Karte titel="Ausgelassen" icon="x" kompakt>
                <Liste>
                  {s.ausnahmen
                    .filter((d) => d >= heute())
                    .sort()
                    .map((d) => (
                      <ListenZeile key={d} titel={datumKurz(d)} rechts={aktiv ? <Button klein variante="tertiaer" onClick={() => wiederAufnehmen(d)}>Wieder aufnehmen</Button> : undefined} />
                    ))}
                </Liste>
              </Karte>
            )}
            {aktiv && (
              <div>
                <Button variante="gefahr" icon="stop" onClick={beenden}>Serie beenden</Button>
              </div>
            )}
          </>
        }
      />
      <VerschiebenDialog termin={verschieben} onSchliessen={() => setVerschieben(null)} />
      {bestaetigung}
    </Seite>
  );
}

function VerschiebenDialog({ termin, onSchliessen }: { termin: Termin | null; onSchliessen: () => void }) {
  const toast = useToast();
  const [d, setD] = useState('');
  const [u, setU] = useState('');
  const [fehler, setFehler] = useState<string>();
  const offen = !!termin;
  const aktuellD = d || (termin ? terminDatum(termin.start) : '');
  const aktuellU = u || (termin ? uhrzeit(termin.start) : '');
  const schliessen = () => {
    setD('');
    setU('');
    setFehler(undefined);
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={schliessen}
      titel="Termin verschieben"
      icon="kalender"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={schliessen}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (!termin) return;
              if (!aktuellD || !/^\d{2}:\d{2}$/.test(aktuellU)) return setFehler('Wähle Datum und Uhrzeit.');
              terminVerschieben(termin.id, aktuellD, aktuellU);
              toast(`Termin auf ${datumKurz(aktuellD)}, ${aktuellU} Uhr verschoben.`);
              schliessen();
            }}
          >
            Verschieben
          </Button>
        </>
      }
    >
      <Stapel>
        <Meta>Nur dieser eine Termin wird verschoben. Die Serie läuft danach im alten Rhythmus weiter.</Meta>
        <FormRaster>
          <Eingabe label="Neues Datum" type="date" value={aktuellD} onChange={(e) => setD(e.target.value)} fehler={fehler} />
          <Eingabe label="Uhrzeit" type="time" value={aktuellU} onChange={(e) => setU(e.target.value)} />
        </FormRaster>
      </Stapel>
    </Dialog>
  );
}
