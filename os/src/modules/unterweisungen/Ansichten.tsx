import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { benachrichtigen } from '@core/macher';
import { datum, heute, personName } from '@core/format';
import type { ID, Rolle } from '@core/objects';
import { ROLLEN, istBuero, useIch } from '@core/session';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Tabelle, Textfeld, Zeile, ZweiSpalten, useToast } from '@ui/index';
import { Zeitstrahl } from '@ui/objekt';
import { sortiert } from '@modules/mitarbeiter/team';
import { bestaetigen, brauchtBestaetigung, offeneFuer, stand, standAnzeige, unterweisungen, zielgruppe, type Unterweisung } from './daten';

function Inhalt({ text }: { text: string }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
      {text
        .split('\n')
        .filter((z) => z.trim())
        .map((z, i) => (
          <li key={i}>{z}</li>
        ))}
    </ul>
  );
}

/** Erinnert alle, die noch bestätigen müssen. Gibt die Anzahl zurück. */
export function erinnern(u: Unterweisung): number {
  const t = heute();
  const offen = zielgruppe(u, db.mitarbeiter.all()).filter((m) => brauchtBestaetigung(stand(u, m.id, t)));
  for (const m of offen) benachrichtigen(`Unterweisung „${u.titel}“ bestätigen`, { text: 'Kurz lesen und am Handy bestätigen – dauert zwei Minuten.', fuer: m.id, wichtig: true });
  return offen.length;
}

/** Startansicht: „Für dich“ zum Bestätigen, darunter alle Unterweisungen mit Stand */
export function UnterweisungenSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const [neu, setNeu] = useState(false);
  const t = heute();
  const alle = unterweisungen.all().sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
  const meine = ich ? offeneFuer(ich, alle, t) : [];
  const team = db.mitarbeiter.all();
  return (
    <Seite titel="Unterweisungen" untertitel="Jährliche Pflicht – lesen, am Handy bestätigen, Nachweis ist fertig." aktion={buero ? <Button icon="plus" onClick={() => setNeu(true)}>Unterweisung anlegen</Button> : undefined}>
      {meine.length > 0 ? (
        <Stapel abstand={8}>
          <strong>Für dich zu bestätigen</strong>
          {meine.map((u) => (
            <Karte key={u.id} kompakt titel={u.titel} to={`/betrieb/unterweisungen/${u.id}`} aktion={<Status ton="achtung">{standAnzeige(stand(u, ich!.id, t)).text}</Status>}>
              <Meta>Tippen, lesen, bestätigen.</Meta>
            </Karte>
          ))}
        </Stapel>
      ) : (
        ich && alle.some((u) => u.rollen.includes(ich.rolle)) && <Meldung ton="erfolg">Du bist bei allen Unterweisungen auf dem aktuellen Stand.</Meldung>
      )}
      <Liste leer={<Leer titel="Noch keine Unterweisungen" text="Lege die Pflichtthemen deines Betriebs an – Arbeitsschutz, Leitern, Fahrzeug …" icon="schild" aktion={buero ? <Button onClick={() => setNeu(true)}>Unterweisung anlegen</Button> : undefined} />}>
        {alle.map((u) => {
          const ziel = zielgruppe(u, team);
          const aktuell = ziel.filter((m) => !brauchtBestaetigung(stand(u, m.id, t))).length;
          const offen = ziel.length - aktuell;
          return (
            <ListenZeile
              key={u.id}
              to={`/betrieb/unterweisungen/${u.id}`}
              titel={u.titel}
              untertitel={`${u.intervallMonate === 12 ? 'jährlich' : `alle ${u.intervallMonate} Monate`} · ${aktuell} von ${ziel.length} aktuell${u.aktiv ? '' : ' · pausiert'}`}
              rechts={!u.aktiv ? <Status>Pausiert</Status> : offen ? <Status ton="achtung">{`${offen} offen`}</Status> : <Status ton="erfolg">Alle aktuell</Status>}
            />
          );
        })}
      </Liste>
      <UnterweisungDialog offen={neu} onSchliessen={() => setNeu(false)} />
    </Seite>
  );
}

export function UnterweisungDialog({ offen, onSchliessen, u }: { offen: boolean; onSchliessen: () => void; u?: Unterweisung }) {
  const toast = useToast();
  const navigate = useNavigate();
  const qualis = db.qualifikationen.use();
  const [f, setF] = useState({ titel: '', inhalt: '', intervall: '12', qualifikationId: '', aktiv: true });
  const [rollen, setRollen] = useState<Rolle[]>(['monteur', 'azubi']);
  const [fehler, setFehler] = useState<string>();
  useEffect(() => {
    if (!offen) return;
    setF({ titel: u?.titel ?? '', inhalt: u?.inhalt ?? '', intervall: String(u?.intervallMonate ?? 12), qualifikationId: u?.qualifikationId ?? '', aktiv: u?.aktiv ?? true });
    setRollen(u?.rollen ?? ['chef', 'monteur', 'azubi']);
    setFehler(undefined);
  }, [offen, u]);
  const speichern = () => {
    if (!f.titel.trim()) return setFehler('Gib der Unterweisung einen Titel.');
    if (!f.inhalt.trim()) return setFehler('Schreib rein, was unterwiesen wird – ein Punkt pro Zeile.');
    if (!rollen.length) return setFehler('Wähle, für wen sie gilt.');
    const daten = { titel: f.titel.trim(), inhalt: f.inhalt.trim(), intervallMonate: Math.max(1, Number(f.intervall) || 12), rollen, qualifikationId: f.qualifikationId || undefined, aktiv: f.aktiv };
    if (u) {
      unterweisungen.update(u.id, daten, { text: 'Inhalt geändert' });
      toast('Unterweisung gespeichert.');
    } else {
      const x = unterweisungen.create({ ...daten, bestaetigungen: [] });
      toast('Unterweisung angelegt. Die Mitarbeiter sehen sie jetzt unter „Braucht dich“.');
      navigate(`/betrieb/unterweisungen/${x.id}`);
    }
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={u ? 'Unterweisung bearbeiten' : 'Unterweisung anlegen'}
      breit
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Eingabe label="Titel" value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} placeholder="z. B. Arbeiten in Kellern und Schächten" />
      <Textfeld label="Inhalt" rows={8} value={f.inhalt} onChange={(e) => setF({ ...f, inhalt: e.target.value })} hilfe="Ein Punkt pro Zeile. Kurz und konkret – so liest es der Monteur am Handy." />
      <Eingabe label="Wiederholen alle … Monate" inputMode="numeric" value={f.intervall} onChange={(e) => setF({ ...f, intervall: e.target.value.replace(/\D/g, '') })} />
      <Stapel abstand={8}>
        <span className="mm-label">Gilt für</span>
        <Zeile>
          {ROLLEN.map((r) => (
            <Checkbox key={r.id} label={r.label} checked={rollen.includes(r.id)} onChange={(an) => setRollen(an ? [...rollen, r.id] : rollen.filter((x) => x !== r.id))} />
          ))}
        </Zeile>
      </Stapel>
      <Auswahl
        label="Nachweis fortschreiben für Qualifikation"
        optional
        value={f.qualifikationId}
        leer="Keine"
        onChange={(e) => setF({ ...f, qualifikationId: e.target.value })}
        optionen={qualis.map((q) => ({ wert: q.id, label: q.name }))}
        hilfe="Bestätigt jemand, wird der Nachweis in der Qualifikations-Matrix automatisch verlängert."
      />
      {u && <Checkbox label="Aktiv (wird abgefragt)" checked={f.aktiv} onChange={(v) => setF({ ...f, aktiv: v })} />}
      {fehler && (
        <Meldung ton="achtung" titel="Bitte prüfen">
          {fehler}
        </Meldung>
      )}
    </Dialog>
  );
}

export function UnterweisungDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const toast = useToast();
  const [gelesen, setGelesen] = useState(false);
  const [bearbeiten, setBearbeiten] = useState(false);
  const u = unterweisungen.get(id);
  const zurueck = { to: '/betrieb/unterweisungen', label: 'Unterweisungen' };
  if (!u || u.geloeschtAm)
    return (
      <Seite titel="Unterweisung nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Unterweisung gibt es nicht (mehr)." icon="schild" />
      </Seite>
    );
  const t = heute();
  const meinStand = ich ? stand(u, ich.id, t) : undefined;
  const fuerMich = !!ich && u.aktiv && u.rollen.includes(ich.rolle);
  const ziel = sortiert(zielgruppe(u, db.mitarbeiter.all()));
  const offen = ziel.filter((m) => brauchtBestaetigung(stand(u, m.id, t)));
  const q = db.qualifikationen.get(u.qualifikationId);

  const ichBestaetige = () => {
    if (!ich) return;
    bestaetigen(u.id, ich.id);
    setGelesen(false);
    toast('Danke! Deine Bestätigung ist gespeichert.');
  };
  const eintragen = (maId: ID) => {
    bestaetigen(u.id, maId, ich?.id);
    toast(`Für ${db.mitarbeiter.get(maId)?.vorname} eingetragen.`);
  };

  return (
    <Seite
      titel={u.titel}
      oberzeile={u.intervallMonate === 12 ? 'Jährliche Unterweisung' : `Alle ${u.intervallMonate} Monate`}
      zurueck={zurueck}
      status={!u.aktiv ? <Status>Pausiert</Status> : undefined}
      aktion={buero ? <Button variante="sekundaer" icon="stift" onClick={() => setBearbeiten(true)}>Bearbeiten</Button> : undefined}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte titel="Inhalt">
              <Inhalt text={u.inhalt} />
            </Karte>
            {fuerMich && meinStand && (
              <Karte titel={brauchtBestaetigung(meinStand) ? 'Bestätigen' : 'Deine Bestätigung'}>
                {brauchtBestaetigung(meinStand) ? (
                  <Stapel abstand={16}>
                    <Checkbox label="Ich habe die Unterweisung gelesen und verstanden. Fragen habe ich mit dem Chef geklärt." checked={gelesen} onChange={setGelesen} />
                    <div>
                      <Button icon="unterschrift" disabled={!gelesen} onClick={ichBestaetige}>
                        Jetzt bestätigen
                      </Button>
                    </div>
                  </Stapel>
                ) : (
                  <Meldung ton="erfolg" titel={`Bestätigt am ${datum(meinStand.letzte)}`}>
                    Nächste Unterweisung bis {datum(meinStand.naechste)}.
                  </Meldung>
                )}
              </Karte>
            )}
            {buero && (
              <Stapel abstand={8}>
                <Zeile zwischen>
                  <strong>Nachweisliste</strong>
                  {offen.length > 0 && (
                    <Button
                      klein
                      variante="sekundaer"
                      icon="glocke"
                      onClick={() => {
                        const n = erinnern(u);
                        toast(n === 1 ? '1 Person erinnert.' : `${n} Personen erinnert.`);
                      }}
                    >
                      Offene erinnern
                    </Button>
                  )}
                </Zeile>
                <Tabelle
                  zeilen={ziel}
                  schluessel={(m) => m.id}
                  leer={<Leer titel="Niemand in dieser Zielgruppe" text="Prüf, für welche Rollen die Unterweisung gilt." icon="team" />}
                  spalten={[
                    { titel: 'Mitarbeiter', wert: (m) => personName(m), sortierWert: (m) => m.vorname },
                    {
                      titel: 'Stand',
                      wert: (m) => {
                        const s = standAnzeige(stand(u, m.id, t));
                        return <Status ton={s.ton}>{s.text}</Status>;
                      },
                    },
                    { titel: 'Zuletzt', wert: (m) => datum(stand(u, m.id, t).letzte), nebensaechlich: true },
                    { titel: 'Nächste bis', wert: (m) => datum(stand(u, m.id, t).naechste), nebensaechlich: true },
                    {
                      titel: '',
                      wert: (m) =>
                        brauchtBestaetigung(stand(u, m.id, t)) ? (
                          <Button klein variante="tertiaer" onClick={() => eintragen(m.id)}>
                            Unterwiesen
                          </Button>
                        ) : null,
                    },
                  ]}
                />
                <Meta>„Unterwiesen“ trägst du ein, wenn du persönlich unterwiesen hast und die Unterschrift auf Papier vorliegt.</Meta>
              </Stapel>
            )}
            <Stapel abstand={8}>
              <strong>Verlauf</strong>
              <Zeitstrahl bezug={{ typ: 'unterweisungen', id: u.id }} max={10} />
            </Stapel>
          </Stapel>
        }
        seite={
          <Karte titel="Details" kompakt>
            <Stapel abstand={4}>
              <Meta>Gilt für: {u.rollen.map((r) => ROLLEN.find((x) => x.id === r)?.label).join(', ')}</Meta>
              <Meta>{q ? `Schreibt den Nachweis „${q.name}“ fort.` : 'Keine Qualifikation verknüpft.'}</Meta>
              <Meta>
                {ziel.length - offen.length} von {ziel.length} aktuell
              </Meta>
            </Stapel>
          </Karte>
        }
      />
      <UnterweisungDialog offen={bearbeiten} onSchliessen={() => setBearbeiten(false)} u={u} />
    </Seite>
  );
}

/** Tab „Unterweisungen“ am Mitarbeiter */
export function MitarbeiterUnterweisungenTab({ id }: { id: ID }) {
  useDatenstand();
  const m = db.mitarbeiter.get(id);
  if (!m) return null;
  const t = heute();
  const liste = unterweisungen.where((u) => u.aktiv && u.rollen.includes(m.rolle));
  return (
    <Liste leer={<Leer titel="Keine Unterweisungen für diese Rolle" icon="schild" />}>
      {liste.map((u) => {
        const s = stand(u, id, t);
        const a = standAnzeige(s);
        return (
          <ListenZeile
            key={u.id}
            to={`/betrieb/unterweisungen/${u.id}`}
            titel={u.titel}
            untertitel={s.letzte ? `bestätigt ${datum(s.letzte)} · nächste bis ${datum(s.naechste)}` : 'noch nicht bestätigt'}
            rechts={<Status ton={a.ton}>{a.text}</Status>}
          />
        );
      })}
    </Liste>
  );
}
