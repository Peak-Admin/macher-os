import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, datum, euro, heute, telLink } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, IconButton, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, ZweiSpalten, Zeile, useBestaetigen, useToast } from '@ui/index';
import { Zeitstrahl } from '@ui/objekt';
import { EINSATZ_STATUS, NACHWEIS_ARTEN, freistellungFehlt, kostenSumme, nachweisStatus, offeneEinsaetze, subunternehmer, type SubEinsatz } from './daten';
import { EinsatzDialog, NachweisDialog } from './Dialoge';

const NACHWEIS_TON = { gueltig: 'erfolg', laeuft_ab: 'aktiv', abgelaufen: 'achtung', ohne_datum: 'neutral' } as const;
const NACHWEIS_TEXT = { gueltig: 'Gültig', laeuft_ab: 'Läuft bald ab', abgelaufen: 'Abgelaufen', ohne_datum: 'Ohne Ablaufdatum' } as const;

export function SubDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const geld = useDarf('geld');
  const darfLoeschen = useDarf('loeschen');
  const s = subunternehmer.useOne(id);
  const l = db.lieferanten.useOne(s?.lieferantId);
  const belege = db.belege.use((b) => !!s && b.lieferantId === s.lieferantId, [s?.lieferantId]);
  const [nachweisOffen, setNachweisOffen] = useState(false);
  const [einsatzDialog, setEinsatzDialog] = useState<{ einsatz?: SubEinsatz } | null>(null);
  const zurueck = { to: '/betrieb/subunternehmer', label: 'Subunternehmer' };
  if (!s || s.geloeschtAm)
    return (
      <Seite titel="Subunternehmer nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diesen Subunternehmer gibt es nicht (mehr)." icon="team" />
      </Seite>
    );
  const t = heute();
  const name = l?.name ?? 'Unbekannte Firma';
  const offen = offeneEinsaetze(s);
  const einsaetze = [...s.einsaetze].sort((a, b) => b.von.localeCompare(a.von));
  const nachweise = [...s.nachweise].sort((a, b) => (b.gueltigBis ?? '').localeCompare(a.gueltigBis ?? ''));

  const nachweisEntfernen = async (nid: string) => {
    if (!(await fragen('Nachweis entfernen?', 'Der Nachweis wird aus der Liste entfernt. Die Datei bleibt unter Dateien erhalten.', 'Entfernen'))) return;
    subunternehmer.update(s.id, { nachweise: s.nachweise.filter((n) => n.id !== nid) }, { text: 'Nachweis entfernt' });
    toast('Nachweis entfernt.');
  };
  const loeschen = async () => {
    if (!(await fragen('Subunternehmer löschen?', `„${name}“ kommt in den Papierkorb. Die Firma bleibt als Lieferant erhalten, damit Eingangsrechnungen zugeordnet bleiben.`, 'In den Papierkorb'))) return;
    subunternehmer.remove(s.id);
    toast('Subunternehmer liegt im Papierkorb.', { aktion: { label: 'Rückgängig', onClick: () => subunternehmer.restore(s.id) } });
    navigate('/betrieb/subunternehmer');
  };

  return (
    <Seite
      titel={name}
      oberzeile={s.gewerk}
      status={
        <>
          <BeispielMarke zeigen={s.beispiel} />
          {!s.aktiv && <Status>Inaktiv</Status>}
        </>
      }
      zurueck={zurueck}
      aktion={<Button icon="plus" onClick={() => setEinsatzDialog({})}>Einsatz anlegen</Button>}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {offen.length > 0 && freistellungFehlt(s, t) && (
              <Meldung ton="achtung" titel="Freistellungsbescheinigung fehlt oder ist abgelaufen" aktion={<Button variante="sekundaer" klein onClick={() => setNachweisOffen(true)}>Nachweis erfassen</Button>}>
                {NACHWEIS_ARTEN[0].text}
              </Meldung>
            )}
            {geld && (
              <Raster min={180}>
                <Kennzahl label="Stundensatz" wert={s.stundensatz ? euro(s.stundensatz) : '–'} hinweis={s.stundensatz ? 'netto' : 'nicht hinterlegt'} />
                <Kennzahl label="Kosten offene Einsätze" wert={offen.length ? euro(kostenSumme(offen)) : '–'} hinweis={offen.length ? 'vereinbart' : 'keine offenen'} />
                <Kennzahl label="Eingangsrechnungen" wert={belege.length ? euro(belege.reduce((x, b) => x + b.netto, 0)) : '–'} hinweis={belege.length ? `${belege.length} netto` : 'noch keine'} />
              </Raster>
            )}
            <Karte titel="Einsätze" icon="auftraege">
              <Liste leer={<Leer titel="Noch keine Einsätze" text="Leg fest, an welchem Auftrag die Firma was macht." icon="auftraege" />}>
                {einsaetze.map((e) => {
                  const a = db.auftraege.get(e.auftragId);
                  return (
                    <ListenZeile
                      key={e.id}
                      onClick={() => setEinsatzDialog({ einsatz: e })}
                      titel={e.leistung}
                      untertitel={[a ? `${a.nummer} · ${a.titel}` : 'Auftrag gelöscht', `${datum(e.von)}${e.bis ? ` – ${datum(e.bis)}` : ''}`].join(' · ')}
                      rechts={
                        <Zeile abstand={8}>
                          {geld && e.kosten != null && <span className="mm-number">{euro(e.kosten)}</span>}
                          <Status ton={e.status === 'erledigt' ? 'erfolg' : e.status === 'laeuft' ? 'aktiv' : 'neutral'}>{EINSATZ_STATUS.find((x) => x.wert === e.status)?.label}</Status>
                        </Zeile>
                      }
                    />
                  );
                })}
              </Liste>
            </Karte>
            <Karte titel="Nachweise" icon="schild" aktion={<Button variante="sekundaer" klein icon="plus" onClick={() => setNachweisOffen(true)}>Nachweis erfassen</Button>}>
              <Liste leer={<Leer skizze titel="Noch keine Nachweise" text="Erfasse mindestens die Freistellungsbescheinigung nach § 48b EStG – mit Ablaufdatum." icon="schild" />}>
                {nachweise.map((n) => {
                  const st = nachweisStatus(n, t);
                  const doc = db.dokumente.get(n.dokumentId);
                  return (
                    <ListenZeile
                      key={n.id}
                      titel={NACHWEIS_ARTEN.find((a) => a.id === n.art)?.label ?? 'Nachweis'}
                      untertitel={
                        <>
                          {n.gueltigBis ? `gültig bis ${datum(n.gueltigBis)}` : 'ohne Ablaufdatum'}
                          {doc?.url && (
                            <>
                              {' · '}
                              <a href={doc.url} target="_blank" rel="noreferrer" download={doc.mime === 'application/pdf' ? `${doc.titel}.pdf` : undefined}>
                                Dokument ansehen
                              </a>
                            </>
                          )}
                        </>
                      }
                      rechts={
                        <Zeile abstand={4} umbruch={false}>
                          <Status ton={NACHWEIS_TON[st]}>{NACHWEIS_TEXT[st]}</Status>
                          <IconButton icon="x" label="Nachweis entfernen" onClick={() => nachweisEntfernen(n.id)} />
                        </Zeile>
                      }
                    />
                  );
                })}
              </Liste>
            </Karte>
            <Karte titel="Verlauf" icon="uhr">
              <Zeitstrahl bezug={{ typ: 'subunternehmer', id: s.id }} max={10} />
            </Karte>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Kontakt" icon="telefon" kompakt aktion={<Button variante="tertiaer" klein icon="stift" to={`/betrieb/subunternehmer/${s.id}/bearbeiten`}>Bearbeiten</Button>}>
              <Stapel abstand={8}>
                {s.ansprechpartner && <Meta>{s.ansprechpartner}</Meta>}
                {l?.telefon && <a href={telLink(l.telefon)}>{l.telefon}</a>}
                {l?.email && <a href={`mailto:${l.email}`}>{l.email}</a>}
                {l?.adresse && <Meta>{adresseText(l.adresse)}</Meta>}
                {!l?.telefon && !l?.email && !l?.adresse && <Meta>Noch keine Kontaktdaten.</Meta>}
              </Stapel>
            </Karte>
            {s.notiz && (
              <Karte titel="Notiz" icon="notiz" kompakt>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.notiz}</p>
              </Karte>
            )}
            {darfLoeschen && (
              <div>
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Subunternehmer löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      <NachweisDialog offen={nachweisOffen} onSchliessen={() => setNachweisOffen(false)} subId={s.id} />
      {einsatzDialog && <EinsatzDialog offen onSchliessen={() => setEinsatzDialog(null)} subId={s.id} einsatz={einsatzDialog.einsatz} />}
      {dialog}
    </Seite>
  );
}
