import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db, useDatenstand, vermerken } from '@core/db';
import { datum, datumVon, heute, personName, plusTage, uhrzeit, zeitpunkt } from '@core/format';
import type { ID } from '@core/objects';
import { istBuero, useIch } from '@core/session';
import { Auswahl, BeispielMarke, Button, Checkbox, Eingabe, Filter, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { Zeitstrahl } from '@ui/objekt';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { unterweisungen } from '@modules/unterweisungen/daten';
import { STATUS_LABEL, schulungen, vorschlaege, type Schulung } from './daten';
import type { Ton } from '@core/modul';

const statusTon: Record<Schulung['status'], Ton> = { geplant: 'aktiv', abgeschlossen: 'erfolg', abgesagt: 'neutral' };

export function useVorschlaege() {
  useDatenstand();
  return vorschlaege({
    heute: heute(),
    qualifikationen: db.qualifikationen.all(),
    mitarbeiter: db.mitarbeiter.all(),
    nachweise: db.nachweise.all(),
    schulungen: schulungen.all(),
    termine: db.termine.all(),
    ohneQualiIds: new Set(unterweisungen.all().map((u) => u.qualifikationId).filter(Boolean) as ID[]),
  });
}

function SchulungZeile({ s }: { s: Schulung }) {
  const t = db.termine.get(s.terminId);
  const q = db.qualifikationen.get(s.qualifikationId);
  const n = t?.mitarbeiterIds.length ?? 0;
  return (
    <ListenZeile
      to={`/betrieb/schulungen/${s.id}`}
      titel={
        <>
          {t?.titel ?? 'Schulung'} <BeispielMarke zeigen={s.beispiel} />
        </>
      }
      untertitel={[t ? `${datum(t.start)}, ${uhrzeit(t.start)}` : undefined, n === 1 ? '1 Teilnehmer' : `${n} Teilnehmer`, q?.name, s.anbieter].filter(Boolean).join(' · ')}
      rechts={<Status ton={statusTon[s.status]}>{STATUS_LABEL[s.status]}</Status>}
    />
  );
}

/** Startansicht: wer muss als Nächstes, geplante und vergangene Schulungen */
export function SchulungenSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'geplant' | 'vergangen'>('geplant');
  const vs = useVorschlaege();
  const alle = schulungen
    .all()
    .filter((s) => buero || db.termine.get(s.terminId)?.mitarbeiterIds.includes(ich?.id ?? ''))
    .map((s) => ({ s, t: db.termine.get(s.terminId) }))
    .sort((a, b) => (a.t?.start ?? '').localeCompare(b.t?.start ?? ''));
  const geplant = alle.filter((x) => x.s.status === 'geplant');
  const vergangen = alle.filter((x) => x.s.status !== 'geplant').reverse();

  return (
    <Seite titel="Schulungen" untertitel="Planen, durchführen, Nachweis kommt automatisch." aktion={buero ? <Button icon="plus" to="/betrieb/schulungen/neu">Schulung planen</Button> : undefined}>
      {buero && vs.length > 0 && (
        <Karte titel="Wer muss als Nächstes?" oberzeile="Vorschlag von Macher">
          <Liste>
            {vs.slice(0, 5).map((v) => (
              <ListenZeile
                key={v.qualifikation.id}
                titel={v.qualifikation.name}
                untertitel={v.personen
                  .slice(0, 4)
                  .map((p) => `${p.mitarbeiter.vorname} (${p.grund})`)
                  .join(', ')}
                rechts={
                  <Button klein variante="sekundaer" onClick={() => navigate(`/betrieb/schulungen/neu?quali=${v.qualifikation.id}&ma=${v.personen.map((p) => p.mitarbeiter.id).join(',')}`)}>
                    Planen
                  </Button>
                }
              />
            ))}
          </Liste>
        </Karte>
      )}
      <Filter
        label="Schulungen"
        wert={filter}
        onChange={setFilter}
        optionen={[
          { wert: 'geplant', label: 'Geplant', zaehler: geplant.length },
          { wert: 'vergangen', label: 'Abgeschlossen & abgesagt', zaehler: vergangen.length },
        ]}
      />
      <Liste
        leer={
          <Leer
            titel={filter === 'geplant' ? 'Keine Schulung geplant' : 'Noch keine abgeschlossenen Schulungen'}
            text={filter === 'geplant' ? 'Plane Erste Hilfe, Herstellerschulungen oder interne Einweisungen. Die Termine stehen dann im Kalender.' : undefined}
            icon="wissen"
            aktion={buero && filter === 'geplant' ? <Button to="/betrieb/schulungen/neu">Schulung planen</Button> : undefined}
          />
        }
      >
        {(filter === 'geplant' ? geplant : vergangen).map(({ s }) => (
          <SchulungZeile key={s.id} s={s} />
        ))}
      </Liste>
    </Seite>
  );
}

/** Schulung planen: legt einen Termin (`art: 'schulung'`) und die Schulung an */
export function SchulungNeu() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qualis = db.qualifikationen.use();
  const team = sortiert(db.mitarbeiter.use((m) => istAktiv(m)));
  const vorQ = params.get('quali') ?? '';
  const [f, setF] = useState({
    qualifikationId: vorQ,
    titel: db.qualifikationen.get(vorQ)?.name ?? '',
    datum: plusTage(heute(), 14),
    von: '08:00',
    bis: '16:00',
    anbieter: '',
    inhalte: '',
  });
  const [teilnehmer, setTeilnehmer] = useState<ID[]>((params.get('ma') ?? '').split(',').filter(Boolean));
  const [fehler, setFehler] = useState<string>();

  const speichern = () => {
    if (!f.titel.trim()) return setFehler('Gib der Schulung einen Titel.');
    if (!teilnehmer.length) return setFehler('Wähle mindestens einen Teilnehmer.');
    if (!f.datum || !f.von || !f.bis || f.bis <= f.von) return setFehler('Prüf Datum und Uhrzeit.');
    const t = db.termine.create({
      art: 'schulung',
      titel: f.titel.trim(),
      start: zeitpunkt(f.datum, f.von),
      ende: zeitpunkt(f.datum, f.bis),
      mitarbeiterIds: teilnehmer,
      status: 'geplant',
      notiz: f.anbieter.trim() ? `Anbieter: ${f.anbieter.trim()}` : undefined,
    });
    const s = schulungen.create({
      terminId: t.id,
      qualifikationId: f.qualifikationId || undefined,
      anbieter: f.anbieter.trim() || undefined,
      inhalte: f.inhalte.trim() || undefined,
      status: 'geplant',
    });
    toast('Schulung geplant. Der Termin steht im Kalender.');
    navigate(`/betrieb/schulungen/${s.id}`, { replace: true });
  };

  return (
    <Seite titel="Schulung planen" zurueck={{ to: '/betrieb/schulungen', label: 'Schulungen' }}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <FormRaster>
            <Auswahl
              label="Für welche Qualifikation"
              optional
              value={f.qualifikationId}
              leer="Keine – interne Einweisung"
              onChange={(e) => setF({ ...f, qualifikationId: e.target.value, titel: f.titel || db.qualifikationen.get(e.target.value)?.name || '' })}
              optionen={qualis.map((q) => ({ wert: q.id, label: q.name }))}
              hilfe="Nach dem Abschluss trägt Macher den Nachweis automatisch ein."
            />
            <Eingabe label="Titel" value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} />
            <Eingabe label="Datum" type="date" value={f.datum} onChange={(e) => setF({ ...f, datum: e.target.value })} />
            <FormRaster spalten={2}>
              <Eingabe label="Von" type="time" value={f.von} onChange={(e) => setF({ ...f, von: e.target.value })} />
              <Eingabe label="Bis" type="time" value={f.bis} onChange={(e) => setF({ ...f, bis: e.target.value })} />
            </FormRaster>
            <Eingabe label="Anbieter / Ort" optional value={f.anbieter} onChange={(e) => setF({ ...f, anbieter: e.target.value })} placeholder="z. B. DRK Kreisverband, Hersteller, intern" />
          </FormRaster>
          <Stapel abstand={8}>
            <span className="mm-label">Teilnehmer</span>
            {team.map((m) => (
              <Checkbox key={m.id} label={personName(m)} checked={teilnehmer.includes(m.id)} onChange={(an) => setTeilnehmer(an ? [...teilnehmer, m.id] : teilnehmer.filter((x) => x !== m.id))} />
            ))}
          </Stapel>
          <Textfeld label="Inhalte" optional rows={4} value={f.inhalte} onChange={(e) => setF({ ...f, inhalte: e.target.value })} placeholder="Was wird geschult? Ein Punkt pro Zeile." />
          {fehler && (
            <Meldung ton="achtung" titel="Bitte prüfen">
              {fehler}
            </Meldung>
          )}
          <div>
            <Button type="submit">Schulung planen</Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}

export function SchulungDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const s = schulungen.get(id);
  const t = db.termine.get(s?.terminId);
  const [dabei, setDabei] = useState<ID[] | null>(null);
  const zurueck = { to: '/betrieb/schulungen', label: 'Schulungen' };
  if (!s || s.geloeschtAm || !t)
    return (
      <Seite titel="Schulung nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Schulung gibt es nicht (mehr)." icon="wissen" />
      </Seite>
    );
  const q = db.qualifikationen.get(s.qualifikationId);
  const teilnehmer = t.mitarbeiterIds.map((x) => db.mitarbeiter.get(x)).filter(Boolean) as NonNullable<ReturnType<typeof db.mitarbeiter.get>>[];
  const vorbei = datumVon(t.start) <= heute();
  const auswahl = dabei ?? s.teilgenommenIds ?? t.mitarbeiterIds;

  const abschliessen = () => {
    schulungen.update(s.id, { status: 'abgeschlossen', teilgenommenIds: auswahl, abgeschlossenAm: new Date().toISOString() }, { text: 'Abgeschlossen' });
    db.termine.update(t.id, { status: 'erledigt' }, { text: 'Schulung abgeschlossen' });
    for (const maId of auswahl) vermerken({ typ: 'mitarbeiter', id: maId }, 'schulung.teilgenommen', `An Schulung „${t.titel}“ teilgenommen`);
    toast(q ? `Abgeschlossen. ${auswahl.length === 1 ? 'Der Nachweis ist' : 'Die Nachweise sind'} eingetragen.` : 'Schulung abgeschlossen.');
  };
  const absagen = async () => {
    if (!(await fragen('Schulung absagen?', 'Der Termin wird abgesagt und verschwindet aus dem Kalender der Teilnehmer.', 'Absagen'))) return;
    schulungen.update(s.id, { status: 'abgesagt' }, { text: 'Abgesagt' });
    db.termine.update(t.id, { status: 'abgesagt' }, { text: 'Schulung abgesagt' });
    toast('Schulung abgesagt.');
  };

  return (
    <Seite
      titel={t.titel}
      oberzeile={`${datum(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}
      status={
        <>
          <Status ton={statusTon[s.status]}>{STATUS_LABEL[s.status]}</Status>
          <BeispielMarke zeigen={s.beispiel} />
        </>
      }
      zurueck={zurueck}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {s.status === 'geplant' && buero && vorbei && (
              <Meldung ton="achtung" titel="Wer war dabei?">
                Hak ab, wer teilgenommen hat, und schließ die Schulung ab. {q ? 'Den Nachweis trägt Macher dann automatisch ein.' : ''}
              </Meldung>
            )}
            <Stapel abstand={8}>
              <strong>Teilnehmer</strong>
              {s.status === 'geplant' && buero ? (
                <Stapel abstand={8}>
                  {teilnehmer.map((m) => (
                    <Checkbox key={m.id} label={personName(m)} checked={auswahl.includes(m.id)} onChange={(an) => setDabei(an ? [...auswahl, m.id] : auswahl.filter((x) => x !== m.id))} />
                  ))}
                  <Meta>Beim Abschließen zählen nur die angehakten Personen.</Meta>
                </Stapel>
              ) : (
                <Liste leer={<Meta>Keine Teilnehmer.</Meta>}>
                  {teilnehmer.map((m) => (
                    <ListenZeile
                      key={m.id}
                      to={`/betrieb/mitarbeiter/${m.id}`}
                      titel={personName(m)}
                      rechts={s.status === 'abgeschlossen' ? s.teilgenommenIds?.includes(m.id) ? <Status ton="erfolg">Teilgenommen</Status> : <Status>Nicht dabei</Status> : undefined}
                    />
                  ))}
                </Liste>
              )}
            </Stapel>
            {s.inhalte && (
              <Stapel abstand={8}>
                <strong>Inhalte</strong>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {s.inhalte.split('\n').filter(Boolean).map((z, i) => (
                    <li key={i}>{z}</li>
                  ))}
                </ul>
              </Stapel>
            )}
            <Stapel abstand={8}>
              <strong>Verlauf</strong>
              <Zeitstrahl bezug={{ typ: 'termine', id: t.id }} max={10} />
            </Stapel>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Details" kompakt>
              <Stapel abstand={4}>
                <Meta>Qualifikation: {q ? q.name : 'keine (interne Einweisung)'}</Meta>
                {s.anbieter && <Meta>Anbieter / Ort: {s.anbieter}</Meta>}
                {s.abgeschlossenAm && <Meta>Abgeschlossen am {datum(s.abgeschlossenAm)}</Meta>}
              </Stapel>
            </Karte>
            {s.status === 'geplant' && buero && (
              <Zeile>
                <Button icon="check" disabled={!auswahl.length} onClick={abschliessen}>
                  Abschließen
                </Button>
                <Button variante="tertiaer" onClick={absagen}>
                  Absagen
                </Button>
              </Zeile>
            )}
          </>
        }
      />
      {bestaetigenElement}
    </Seite>
  );
}

/** Tab „Schulungen“ am Mitarbeiter */
export function MitarbeiterSchulungenTab({ id }: { id: ID }) {
  useDatenstand();
  const liste = schulungen
    .all()
    .filter((s) => db.termine.get(s.terminId)?.mitarbeiterIds.includes(id))
    .sort((a, b) => (db.termine.get(b.terminId)?.start ?? '').localeCompare(db.termine.get(a.terminId)?.start ?? ''));
  return (
    <Liste leer={<Leer titel="Noch keine Schulungen" text="Geplante und abgeschlossene Schulungen erscheinen hier." icon="wissen" />}>
      {liste.map((s) => (
        <SchulungZeile key={s.id} s={s} />
      ))}
    </Liste>
  );
}
