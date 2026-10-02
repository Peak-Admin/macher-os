/** Termin-Detail: wann, wer, wo – plus Prüfungen anderer Pakete (Qualifikation, Material, Werkzeug, Fahrt) über ObjektPanels. */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, useDatenstand, vermerken } from '@core/db';
import { adresseText, datum as datumText, datumKurz, isoDatum, mapsLink, personName, plusTage, telLink, uhrzeit } from '@core/format';
import { useDarf } from '@core/session';
import { pfadZu } from '@core/modul';
import {
  BeispielMarke,
  Button,
  Dialog,
  Eingabe,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Seite,
  Stapel,
  Status,
  Textfeld,
  Zeile,
  ZweiSpalten,
  useToast,
} from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { kontextAusDb, terminKonflikte } from '../verfuegbarkeit/daten';
import { icsDateiname, terminAlsIcs, TERMINART_LABEL, TERMINSTATUS, verschoben } from './daten';
import { herunterladen } from './hooks';
import { TerminFormular } from './TerminFormular';

export function TerminDetail() {
  useDatenstand();
  const { id = '' } = useParams();
  const t = db.termine.get(id);
  const toast = useToast();
  const darfPlanen = useDarf('planen');
  const [bearbeiten, setBearbeiten] = useState(false);
  const [verschieben, setVerschieben] = useState(false);
  const [absagen, setAbsagen] = useState(false);

  if (!t || t.geloeschtAm)
    return (
      <Seite titel="Termin nicht gefunden" zurueck={{ to: '/plan/kalender', label: 'Kalender' }}>
        <Leer titel="Diesen Termin gibt es nicht (mehr)." text="Vielleicht wurde er gelöscht. Im Kalender siehst du alle aktuellen Termine." icon="kalender" aktion={<Button to="/plan/kalender">Zum Kalender</Button>} />
      </Seite>
    );

  const auftrag = db.auftraege.get(t.auftragId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId);
  const ort = db.orte.get(t.ortId ?? auftrag?.ortId);
  const ma = t.mitarbeiterIds.map((x) => db.mitarbeiter.get(x)).filter((m): m is NonNullable<typeof m> => !!m);
  const konflikte = terminKonflikte(t, kontextAusDb());
  const st = TERMINSTATUS[t.status];
  const vorbei = new Date(t.ende) < new Date();
  const aktiv = t.status !== 'abgesagt' && t.status !== 'erledigt';

  const ics = () => {
    const text = [auftrag ? `Auftrag ${auftrag.nummer}` : '', kunde?.name, kunde?.telefon, ort?.hinweise, t.notiz].filter(Boolean).join('\n');
    herunterladen(icsDateiname(t), terminAlsIcs(t, { ort: ort ? adresseText(ort.adresse) : kunde?.adresse ? adresseText(kunde.adresse) : undefined, beschreibung: text, betrieb: db.betrieb.get('betrieb')?.name }));
    toast('Kalenderdatei heruntergeladen.');
  };

  const bestaetigen = () => {
    db.termine.update(t.id, { status: 'bestaetigt' }, { text: 'Bestätigt' });
    toast('Termin bestätigt.');
  };

  const wiederAufnehmen = () => {
    db.termine.update(t.id, { status: 'geplant' }, { text: 'Wieder aufgenommen' });
    toast('Termin ist wieder geplant.');
  };

  return (
    <Seite
      titel={t.titel}
      oberzeile={TERMINART_LABEL[t.art]}
      status={
        <>
          <Status ton={st.ton}>{st.label}</Status>
          {t.selbstGebucht && <Status ton="aktiv">Vom Kunden gebucht</Status>}
          <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      untertitel={`${datumText(t.start)} · ${t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`}`}
      zurueck={{ to: `/plan/kalender?datum=${isoDatum(new Date(t.start))}`, label: 'Kalender' }}
      aktion={
        darfPlanen && aktiv ? (
          t.status === 'geplant' ? (
            <Button icon="check" onClick={bestaetigen}>
              Termin bestätigen
            </Button>
          ) : (
            <Button icon="kalender" variante="sekundaer" onClick={() => setVerschieben(true)}>
              Verschieben
            </Button>
          )
        ) : undefined
      }
    >
      {t.status === 'abgesagt' && (
        <Meldung ton="achtung" titel="Dieser Termin ist abgesagt." aktion={darfPlanen ? <Button variante="sekundaer" klein onClick={wiederAufnehmen}>Wieder aufnehmen</Button> : undefined} />
      )}
      {aktiv && konflikte.length > 0 && (
        <Meldung ton="achtung" titel="Konflikt in der Planung" aktion={darfPlanen ? <Button variante="sekundaer" klein onClick={() => setBearbeiten(true)}>Umplanen</Button> : undefined}>
          {konflikte.map((k) => (
            <div key={k.mitarbeiterId}>
              {personName(db.mitarbeiter.get(k.mitarbeiterId))}: {k.gruende.map((g) => (g.terminId ? `${g.text} mit „${db.termine.get(g.terminId)?.titel ?? 'anderem Termin'}“` : g.text)).join(', ')}
            </div>
          ))}
        </Meldung>
      )}
      {aktiv && !ma.length && <Meldung ton="achtung" titel="Noch niemand eingeplant." aktion={darfPlanen ? <Button variante="sekundaer" klein onClick={() => setBearbeiten(true)}>Mitarbeiter wählen</Button> : undefined} />}
      {aktiv && vorbei && t.status !== 'vor_ort' && <Meta>Dieser Termin liegt in der Vergangenheit.</Meta>}

      <ZweiSpalten
        haupt={
          <ObjektTabs
            objekt="termine"
            id={t.id}
            eigene={[
              {
                id: 'ueberblick',
                titel: 'Überblick',
                inhalt: (
                  <Stapel>
                    <Karte titel="Wer" kompakt>
                      <Liste leer={<Meta>Noch niemand eingeplant.</Meta>}>
                        {ma.map((m) => (
                          <ListenZeile key={m.id} to={pfadZu({ typ: 'mitarbeiter', id: m.id })} titel={personName(m)} untertitel={m.telefon} />
                        ))}
                      </Liste>
                    </Karte>
                    {t.notiz && (
                      <Karte titel="Notiz" kompakt>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{t.notiz}</p>
                      </Karte>
                    )}
                    {darfPlanen && (
                      <Zeile>
                        <Button variante="sekundaer" icon="stift" onClick={() => setBearbeiten(true)}>
                          Bearbeiten
                        </Button>
                        {aktiv && t.status === 'geplant' && (
                          <Button variante="sekundaer" icon="kalender" onClick={() => setVerschieben(true)}>
                            Verschieben
                          </Button>
                        )}
                        <Button variante="tertiaer" icon="download" onClick={ics}>
                          In meinen Kalender (ICS)
                        </Button>
                        {aktiv && (
                          <Button variante="gefahr" icon="x" onClick={() => setAbsagen(true)}>
                            Absagen
                          </Button>
                        )}
                      </Zeile>
                    )}
                    {!darfPlanen && (
                      <div>
                        <Button variante="sekundaer" icon="download" onClick={ics}>
                          In meinen Kalender (ICS)
                        </Button>
                      </div>
                    )}
                  </Stapel>
                ),
              },
              { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'termine', id: t.id }} /> },
            ]}
          />
        }
        seite={
          <>
            {(kunde || ort) && (
              <Karte titel="Wo" kompakt>
                <Stapel abstand={8}>
                  {kunde && <ObjektLink bezug={{ typ: 'kunden', id: kunde.id }}>{kunde.name}</ObjektLink>}
                  {ort && (
                    <a href={mapsLink(ort.adresse)} target="_blank" rel="noreferrer">
                      {adresseText(ort.adresse)}
                    </a>
                  )}
                  {!ort && kunde?.adresse && (
                    <a href={mapsLink(kunde.adresse)} target="_blank" rel="noreferrer">
                      {adresseText(kunde.adresse)}
                    </a>
                  )}
                  {ort?.hinweise && <Meta>{ort.hinweise}</Meta>}
                  {(ort?.telefonVorOrt || kunde?.telefon) && <a href={telLink(ort?.telefonVorOrt ?? kunde?.telefon)}>Anrufen: {ort?.telefonVorOrt ?? kunde?.telefon}</a>}
                </Stapel>
              </Karte>
            )}
            {auftrag && (
              <Karte titel="Auftrag" kompakt>
                <Stapel abstand={4}>
                  <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>
                    {auftrag.nummer} · {auftrag.titel}
                  </ObjektLink>
                  {auftrag.beschreibung && <Meta>{auftrag.beschreibung}</Meta>}
                </Stapel>
              </Karte>
            )}
            <ObjektPanels objekt="termine" id={t.id} />
          </>
        }
      />

      <TerminFormular offen={bearbeiten} onSchliessen={() => setBearbeiten(false)} termin={t} />
      <VerschiebenDialog offen={verschieben} onSchliessen={() => setVerschieben(false)} terminId={t.id} />
      <AbsagenDialog offen={absagen} onSchliessen={() => setAbsagen(false)} terminId={t.id} />
    </Seite>
  );
}

function VerschiebenDialog({ offen, onSchliessen, terminId }: { offen: boolean; onSchliessen: () => void; terminId: string }) {
  const t = db.termine.get(terminId)!;
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Termin verschieben">
      <VerschiebenInhalt t={t} onFertig={onSchliessen} />
    </Dialog>
  );
}

function VerschiebenInhalt({ t, onFertig }: { t: NonNullable<ReturnType<typeof db.termine.get>>; onFertig: () => void }) {
  const toast = useToast();
  const [tag, setTag] = useState(isoDatum(new Date(t.start)));
  const [uhr, setUhr] = useState(uhrzeit(t.start));
  const [fehler, setFehler] = useState<string>();
  const neu = tag ? verschoben(t, tag, t.ganztags ? undefined : uhr) : undefined;
  const konflikte = neu ? terminKonflikte({ ...t, ...neu }, kontextAusDb()) : [];

  const speichern = (ziel = neu) => {
    if (!ziel) return setFehler('Wähle ein Datum.');
    const alt = { start: t.start, ende: t.ende };
    db.termine.update(t.id, ziel, { text: `Verschoben auf ${datumKurz(ziel.start)}, ${uhrzeit(ziel.start)} Uhr` });
    if (t.auftragId) vermerken({ typ: 'auftraege', id: t.auftragId }, 'termin.verschoben', `Termin „${t.titel}“ verschoben auf ${datumKurz(ziel.start)}`);
    toast(`Verschoben auf ${datumKurz(ziel.start)}.`, { aktion: { label: 'Rückgängig', onClick: () => db.termine.update(t.id, alt, { text: 'Verschieben rückgängig gemacht' }) } });
    onFertig();
  };

  return (
    <Stapel>
      <Zeile>
        <Button variante="sekundaer" klein onClick={() => setTag(plusTage(tag, 1))}>
          + 1 Tag
        </Button>
        <Button variante="sekundaer" klein onClick={() => setTag(plusTage(tag, 7))}>
          + 1 Woche
        </Button>
      </Zeile>
      <Eingabe label="Neues Datum" type="date" value={tag} onChange={(e) => setTag(e.target.value)} fehler={fehler} />
      {!t.ganztags && <Eingabe label="Neuer Beginn" type="time" step={900} value={uhr} onChange={(e) => setUhr(e.target.value)} hilfe="Die Dauer bleibt gleich." />}
      {konflikte.length > 0 ? (
        <Meldung ton="achtung" titel="Konflikt am neuen Termin">
          {konflikte.map((k) => `${personName(db.mitarbeiter.get(k.mitarbeiterId))}: ${k.gruende.map((g) => g.text).join(', ')}`).join(' · ')}
        </Meldung>
      ) : neu ? (
        <Meldung ton="erfolg">Alle Eingeplanten sind zu dieser Zeit frei.</Meldung>
      ) : null}
      <Zeile zwischen>
        <Button variante="tertiaer" onClick={onFertig}>
          Abbrechen
        </Button>
        <Button onClick={() => speichern()}>{konflikte.length ? 'Trotzdem verschieben' : 'Verschieben'}</Button>
      </Zeile>
    </Stapel>
  );
}

function AbsagenDialog({ offen, onSchliessen, terminId }: { offen: boolean; onSchliessen: () => void; terminId: string }) {
  const toast = useToast();
  const [grund, setGrund] = useState('');
  const t = db.termine.get(terminId)!;
  const absagen = () => {
    const text = grund.trim() ? `Abgesagt: ${grund.trim()}` : 'Abgesagt';
    db.termine.update(t.id, { status: 'abgesagt' }, { text });
    if (t.auftragId) vermerken({ typ: 'auftraege', id: t.auftragId }, 'termin.abgesagt', `Termin „${t.titel}“ am ${datumKurz(t.start)} abgesagt${grund.trim() ? ` – ${grund.trim()}` : ''}`);
    toast('Termin abgesagt.', { ton: 'neutral', aktion: { label: 'Rückgängig', onClick: () => db.termine.update(t.id, { status: t.status }, { text: 'Absage rückgängig gemacht' }) } });
    setGrund('');
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Termin absagen?"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Nicht absagen
          </Button>
          <Button variante="gefahr" onClick={absagen}>
            Termin absagen
          </Button>
        </>
      }
    >
      <p>
        „{t.titel}“ am {datumKurz(t.start)} wird abgesagt. Der Auftrag taucht danach wieder unter „Offen einzuplanen“ auf.
      </p>
      <Textfeld label="Grund" optional value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z. B. Kunde krank, Material fehlt" />
    </Dialog>
  );
}
