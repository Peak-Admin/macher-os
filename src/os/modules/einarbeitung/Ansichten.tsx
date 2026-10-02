import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, neueId, useDatenstand } from '@core/db';
import { datum, heute, personName } from '@core/format';
import type { ID } from '@core/objects';
import { istBuero, useIch } from '@core/session';
import { Auswahl, BeispielMarke, Button, Checkbox, Dialog, Eingabe, Filter, Fortschritt, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, ZweiSpalten, useToast } from '@ui/index';
import { Person, Personenbild } from '@ui/person';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { unterweisungen } from '@modules/unterweisungen/daten';
import { ART_LABEL, einarbeitungen, faelligAm, fortschritt, phase, planFuer, ueberfaellig, type Einarbeitung, type SchrittArt } from './daten';

export function planStarten(maId: ID, start = heute()): Einarbeitung | undefined {
  const m = db.mitarbeiter.get(maId);
  if (!m) return undefined;
  return einarbeitungen.create({ mitarbeiterId: m.id, start, schritte: planFuer(m.rolle, unterweisungen.all()) });
}

/** Schritt abhaken; sind alle erledigt, ist die Einarbeitung abgeschlossen */
export function schrittSetzen(e: Einarbeitung, schrittId: ID, erledigt: boolean) {
  const schritte = e.schritte.map((s) => (s.id === schrittId ? { ...s, erledigt, erledigtAm: erledigt ? new Date().toISOString() : undefined } : s));
  const fertig = schritte.every((s) => s.erledigt);
  einarbeitungen.update(e.id, { schritte, abgeschlossenAm: fertig ? e.abgeschlossenAm ?? new Date().toISOString() : undefined }, { text: erledigt ? 'Schritt erledigt' : 'Schritt wieder offen' });
  return fertig;
}

export function EinarbeitungenSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState<'laufend' | 'fertig'>('laufend');
  const [starten, setStarten] = useState(false);
  const [maId, setMaId] = useState<ID>('');
  const alle = einarbeitungen.all().filter((e) => buero || e.mitarbeiterId === ich?.id);
  const laufend = alle.filter((e) => !e.abgeschlossenAm);
  const fertig = alle.filter((e) => e.abgeschlossenAm);
  const ohnePlan = sortiert(db.mitarbeiter.where((m) => istAktiv(m) && !einarbeitungen.all().some((e) => e.mitarbeiterId === m.id)));
  const t = heute();

  return (
    <Seite
      titel="Mitarbeiter einarbeiten"
      untertitel="Neue Leute bekommen automatisch einen Plan je Rolle – du hakst nur ab."
      aktion={buero && ohnePlan.length ? <Button variante="sekundaer" icon="plus" onClick={() => setStarten(true)}>Einarbeitung starten</Button> : undefined}
    >
      {fertig.length > 0 && (
        <Filter
          label="Einarbeitungen"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'laufend', label: 'Laufend', zaehler: laufend.length },
            { wert: 'fertig', label: 'Abgeschlossen', zaehler: fertig.length },
          ]}
        />
      )}
      <Liste
        leer={
          <Leer
            titel={filter === 'laufend' ? 'Gerade wird niemand eingearbeitet' : 'Noch keine abgeschlossen'}
            text="Legst du einen neuen Mitarbeiter an, erstellt Macher den Einarbeitungsplan automatisch."
            icon="team"
            aktion={buero ? <Button to="/betrieb/mitarbeiter/neu">Mitarbeiter anlegen</Button> : undefined}
          />
        }
      >
        {(filter === 'laufend' ? laufend : fertig).map((e) => {
          const m = db.mitarbeiter.get(e.mitarbeiterId);
          const f = fortschritt(e);
          const ueber = ueberfaellig(e, t).length;
          return (
            <ListenZeile
              key={e.id}
              to={`/betrieb/einarbeitung/${e.id}`}
              links={<Personenbild m={m} groesse={40} />}
              titel={
                <>
                  {personName(m)} <BeispielMarke zeigen={e.beispiel} />
                </>
              }
              untertitel={`seit ${datum(e.start)} · ${f.fertig} von ${f.gesamt} Schritten`}
              rechts={e.abgeschlossenAm ? <Status ton="erfolg">Abgeschlossen</Status> : ueber ? <Status ton="gefahr">{`${ueber} überfällig`}</Status> : <Status ton="aktiv">{`${Math.round((f.fertig / Math.max(1, f.gesamt)) * 100)} %`}</Status>}
            />
          );
        })}
      </Liste>
      <Dialog
        offen={starten}
        onSchliessen={() => setStarten(false)}
        titel="Einarbeitung starten"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setStarten(false)}>
              Abbrechen
            </Button>
            <Button
              disabled={!maId}
              onClick={() => {
                const e = planStarten(maId);
                setStarten(false);
                if (e) {
                  toast('Einarbeitungsplan angelegt.');
                  navigate(`/betrieb/einarbeitung/${e.id}`);
                }
              }}
            >
              Plan anlegen
            </Button>
          </>
        }
      >
        <Auswahl label="Für" value={maId} leer="Mitarbeiter wählen" onChange={(e) => setMaId(e.target.value)} optionen={ohnePlan.map((m) => ({ wert: m.id, label: personName(m) }))} />
        <Meta>Der Plan richtet sich nach der Rolle und enthält Unterlagen, Ausstattung, Zugänge und Pflicht-Unterweisungen.</Meta>
      </Dialog>
    </Seite>
  );
}

export function EinarbeitungDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const toast = useToast();
  const [neuerSchritt, setNeuerSchritt] = useState('');
  const e = einarbeitungen.get(id);
  const zurueck = { to: '/betrieb/einarbeitung', label: 'Einarbeitung' };
  if (!e || e.geloeschtAm)
    return (
      <Seite titel="Einarbeitung nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diesen Plan gibt es nicht (mehr)." icon="team" />
      </Seite>
    );
  const m = db.mitarbeiter.get(e.mitarbeiterId);
  const darf = buero || ich?.id === e.mitarbeiterId;
  const f = fortschritt(e);
  const t = heute();
  const gruppen = [...new Set(e.schritte.map((s) => phase(s.tag)))];

  const abhaken = (sId: ID, an: boolean) => {
    const fertig = schrittSetzen(e, sId, an);
    if (fertig) toast(`Einarbeitung von ${m?.vorname} abgeschlossen. Stark!`);
  };
  const hinzufuegen = () => {
    if (!neuerSchritt.trim()) return;
    einarbeitungen.update(e.id, { schritte: [...e.schritte, { id: neueId('s'), titel: neuerSchritt.trim(), art: 'praxis' as SchrittArt, tag: Math.max(0, Math.min(31, Math.round((Date.now() - new Date(e.start + 'T12:00:00').getTime()) / 86_400_000))), erledigt: false }], abgeschlossenAm: undefined }, { text: 'Schritt ergänzt' });
    setNeuerSchritt('');
    toast('Schritt ergänzt.');
  };

  return (
    <Seite
      titel={`Einarbeitung ${personName(m)}`}
      oberzeile={`Start ${datum(e.start)}`}
      status={
        <>
          {e.abgeschlossenAm ? <Status ton="erfolg">Abgeschlossen</Status> : <Status ton="aktiv">Läuft</Status>}
          <BeispielMarke zeigen={e.beispiel} />
        </>
      }
      zurueck={zurueck}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Fortschritt wert={f.fertig} max={f.gesamt} label={`${f.fertig} von ${f.gesamt} Schritten erledigt`} />
            {gruppen.map((g) => (
              <Stapel key={g} abstand={8}>
                <strong>{g}</strong>
                {e.schritte
                  .filter((s) => phase(s.tag) === g)
                  .map((s) => {
                    const faellig = faelligAm(e, s);
                    const ueber = !s.erledigt && faellig < t;
                    return (
                      <Zeile key={s.id} zwischen umbruch={false}>
                        <Checkbox label={s.titel} checked={s.erledigt} disabled={!darf || (s.art === 'unterweisung' && !buero)} onChange={(an) => abhaken(s.id, an)} />
                        <Zeile abstand={4}>
                          {s.art === 'unterweisung' && s.unterweisungId && !s.erledigt && (
                            <Button klein variante="tertiaer" to={`/betrieb/unterweisungen/${s.unterweisungId}`}>
                              Öffnen
                            </Button>
                          )}
                          {ueber ? <Status ton="achtung">{`seit ${datum(faellig)}`}</Status> : <Status>{ART_LABEL[s.art]}</Status>}
                        </Zeile>
                      </Zeile>
                    );
                  })}
              </Stapel>
            ))}
            {buero && (
              <form
                onSubmit={(ev) => {
                  ev.preventDefault();
                  hinzufuegen();
                }}
              >
                <Zeile>
                  <div style={{ flex: '1 1 240px' }}>
                    <Eingabe label="Eigener Schritt" value={neuerSchritt} onChange={(ev) => setNeuerSchritt(ev.target.value)} placeholder="z. B. Baustelle Haus 24 zeigen" />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <Button type="submit" variante="sekundaer" icon="plus" disabled={!neuerSchritt.trim()}>
                      Hinzufügen
                    </Button>
                  </div>
                </Zeile>
              </form>
            )}
          </Stapel>
        }
        seite={
          <Karte titel={m ? <Person m={m} groesse={32} /> : 'Mitarbeiter'} kompakt>
            <Stapel abstand={8}>
              <Meta>Unterweisungs-Schritte hakt Macher selbst ab, sobald {m?.vorname ?? 'der Mitarbeiter'} am Handy bestätigt.</Meta>
              {m && (
                <Button klein variante="tertiaer" to={`/betrieb/mitarbeiter/${m.id}`}>
                  Zum Mitarbeiter
                </Button>
              )}
              {ueberfaellig(e, t).length > 0 && <Meldung ton="achtung">{`${ueberfaellig(e, t).length} Schritte sind überfällig.`}</Meldung>}
            </Stapel>
          </Karte>
        }
      />
    </Seite>
  );
}

/** Tab „Einarbeitung“ am Mitarbeiter (nur wenn es einen Plan gibt) */
export function MitarbeiterEinarbeitungTab({ id }: { id: ID }) {
  useDatenstand();
  const e = einarbeitungen.all().find((x) => x.mitarbeiterId === id);
  if (!e) return <Leer titel="Kein Einarbeitungsplan" icon="team" />;
  const f = fortschritt(e);
  const offen = e.schritte.filter((s) => !s.erledigt).slice(0, 5);
  return (
    <Stapel abstand={16}>
      <Fortschritt wert={f.fertig} max={f.gesamt} label={`${f.fertig} von ${f.gesamt} Schritten`} />
      {offen.length ? (
        <Liste>
          {offen.map((s) => (
            <ListenZeile key={s.id} titel={s.titel} untertitel={`${phase(s.tag)} · ${ART_LABEL[s.art]}`} />
          ))}
        </Liste>
      ) : (
        <Meldung ton="erfolg">Alles erledigt.</Meldung>
      )}
      <div>
        <Button variante="sekundaer" to={`/betrieb/einarbeitung/${e.id}`}>
          Plan öffnen
        </Button>
      </div>
    </Stapel>
  );
}
