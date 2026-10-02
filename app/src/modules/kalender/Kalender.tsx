/** Kalender: Tag / Woche / Monat am Rechner, Agenda-Liste am Handy. Filter nach Mitarbeiter. */
import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, initialen, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart } from '@core/format';
import { useIch, istBuero } from '@core/session';
import type { Datum, Termin } from '@core/objects';
import { Auswahl, Button, IconButton, Leer, Liste, ListenZeile, Meta, Segmente, Seite, Stapel, Status } from '@ui/index';
import { kontextAusDb, terminKonflikte, anwesenheit } from '../verfuegbarkeit/daten';
import { monatsAnfang, terminAmTag, termineIm, TERMINART_LABEL, TERMINSTATUS } from './daten';
import { useSchmal } from './hooks';
import { TerminFormular } from './TerminFormular';
import './plan.css';

type Ansicht = 'tag' | 'woche' | 'monat';

const monatFmt = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const tagFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;

function zeitraum(ansicht: Ansicht, datum: Datum, schmal: boolean): { von: Datum; bis: Datum } {
  if (schmal) return { von: datum, bis: plusTage(datum, 13) };
  if (ansicht === 'tag') return { von: datum, bis: datum };
  if (ansicht === 'woche') return { von: wochenStart(datum), bis: plusTage(wochenStart(datum), 6) };
  const von = wochenStart(monatsAnfang(datum));
  const bis = plusTage(wochenStart(plusTage(monatsAnfang(datum, 1), -1)), 6);
  return { von, bis };
}

function schritt(ansicht: Ansicht, datum: Datum, richtung: 1 | -1, schmal: boolean): Datum {
  if (schmal) return plusTage(datum, 14 * richtung);
  if (ansicht === 'tag') return plusTage(datum, richtung);
  if (ansicht === 'woche') return plusTage(datum, 7 * richtung);
  return monatsAnfang(datum, richtung);
}

export function Kalender() {
  useDatenstand();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const schmal = useSchmal();
  const ich = useIch();
  const ansicht = (['tag', 'woche', 'monat'].includes(sp.get('ansicht') ?? '') ? sp.get('ansicht') : 'woche') as Ansicht;
  const datum = sp.get('datum') || heute();
  const ma = sp.has('ma') ? sp.get('ma')! : ich && !istBuero(ich) ? ich.id : '';
  const neu = sp.get('neu') === '1';
  const mitarbeiter = db.mitarbeiter.all().filter((m) => m.aktiv);

  const setze = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) v == null ? n.delete(k) : n.set(k, v);
    setSp(n, { replace: true });
  };

  const { von, bis } = zeitraum(ansicht, datum, schmal);
  const termine = termineIm(db.termine.all(), von, bis, { mitarbeiterId: ma || undefined, mitAbgesagten: ansicht === 'tag' && !schmal });
  const konflikte = useMemo(() => {
    const k = kontextAusDb();
    return new Set(termine.filter((t) => terminKonflikte(t, k).length).map((t) => t.id));
    // termine ändern sich mit dem Datenstand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termine.map((t) => t.id + t.geaendertAm).join()]);

  const titelZeitraum = schmal
    ? `${datumKurz(von)} – ${datumKurz(bis)}`
    : ansicht === 'tag'
      ? tagFmt.format(new Date(`${datum}T12:00:00`))
      : ansicht === 'woche'
        ? `KW ${kalenderwoche(von)} · ${datumKurz(von)} – ${datumKurz(bis)}`
        : monatFmt.format(new Date(`${datum}T12:00:00`));

  return (
    <Seite titel="Kalender" breit aktion={<Button icon="plus" onClick={() => setze({ neu: '1' })}>Termin anlegen</Button>}>
      <div className="pl-kopfleiste">
        {!schmal && (
          <Segmente<Ansicht>
            label="Ansicht"
            wert={ansicht}
            onChange={(v) => setze({ ansicht: v })}
            optionen={[
              { wert: 'tag', label: 'Tag' },
              { wert: 'woche', label: 'Woche' },
              { wert: 'monat', label: 'Monat' },
            ]}
          />
        )}
        <Auswahl
          label="Mitarbeiter"
          value={ma}
          onChange={(e) => setze({ ma: e.target.value })}
          leer="Alle Mitarbeiter"
          optionen={mitarbeiter.map((m) => ({ wert: m.id, label: personName(m) }))}
        />
        <div className="pl-navi">
          <IconButton icon="pfeilLinks" label="Zurück" onClick={() => setze({ datum: schritt(ansicht, datum, -1, schmal) })} />
          <Button variante="tertiaer" onClick={() => setze({ datum: undefined })}>
            Heute
          </Button>
          <IconButton icon="pfeilRechts" label="Weiter" onClick={() => setze({ datum: schritt(ansicht, datum, 1, schmal) })} />
          <span className="pl-zeitraum" aria-live="polite">
            {titelZeitraum}
          </span>
        </div>
      </div>

      {schmal ? (
        <Agenda von={von} bis={bis} termine={termine} konflikte={konflikte} mitarbeiterId={ma} onNeu={() => setze({ neu: '1' })} />
      ) : ansicht === 'tag' ? (
        <TagListe datum={datum} termine={termine} konflikte={konflikte} mitarbeiterId={ma} onNeu={() => setze({ neu: '1' })} />
      ) : ansicht === 'woche' ? (
        <Woche von={von} termine={termine} konflikte={konflikte} onTag={(d) => setze({ ansicht: 'tag', datum: d })} />
      ) : (
        <Monat von={von} bis={bis} monat={datum.slice(0, 7)} termine={termine} onTag={(d) => setze({ ansicht: 'tag', datum: d })} />
      )}

      <TerminFormular
        offen={neu}
        onSchliessen={() => setze({ neu: undefined })}
        vorgabe={{ datum: datum < heute() ? heute() : datum, mitarbeiterIds: ma ? [ma] : undefined }}
        onGespeichert={(t) => navigate(terminPfad(t.id))}
      />
    </Seite>
  );
}

// ------------------------------------------------------------------ Bausteine

export function TerminKachel({ t, konflikt, zeigeTag }: { t: Termin; konflikt?: boolean; zeigeTag?: boolean }) {
  const ma = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter(Boolean);
  const kunde = db.kunden.get(t.kundeId);
  const st = TERMINSTATUS[t.status];
  return (
    <Link
      to={terminPfad(t.id)}
      className={`pl-termin ${t.status === 'abgesagt' ? 'pl-termin--abgesagt' : ''} ${konflikt ? 'pl-termin--konflikt' : ''}`}
      style={{ ['--pl-farbe' as string]: ma[0]?.farbe ?? undefined }}
    >
      <span className="mm-meta">
        {zeigeTag ? `${datumKurz(t.start)}, ` : ''}
        {t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}
      </span>
      <strong>{t.titel}</strong>
      {kunde && <span className="mm-meta">{kunde.name}</span>}
      <span className="mm-meta">{ma.length ? ma.map((m) => initialen(m)).join(', ') : 'Noch niemand eingeplant'}</span>
      {(konflikt || t.status !== 'geplant' || t.selbstGebucht) && (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {konflikt && <Status ton="achtung">Konflikt</Status>}
          {t.status !== 'geplant' && <Status ton={st.ton}>{st.label}</Status>}
          {t.selbstGebucht && t.status === 'geplant' && <Status ton="aktiv">Bitte bestätigen</Status>}
        </span>
      )}
    </Link>
  );
}

function terminUntertitel(t: Termin) {
  const kunde = db.kunden.get(t.kundeId);
  const ort = db.orte.get(t.ortId);
  const ma = t.mitarbeiterIds.map((id) => personName(db.mitarbeiter.get(id)));
  return [TERMINART_LABEL[t.art], kunde?.name, ort?.adresse.ort, ma.length ? ma.join(', ') : 'Noch niemand eingeplant'].filter(Boolean).join(' · ');
}

function TerminZeile({ t, konflikt }: { t: Termin; konflikt?: boolean }) {
  const st = TERMINSTATUS[t.status];
  return (
    <ListenZeile
      to={terminPfad(t.id)}
      links={<strong className="mm-number">{t.ganztags ? 'Ganzer Tag' : uhrzeit(t.start)}</strong>}
      titel={t.titel}
      untertitel={terminUntertitel(t)}
      rechts={
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
          {konflikt && <Status ton="achtung">Konflikt</Status>}
          {t.selbstGebucht && t.status === 'geplant' ? <Status ton="aktiv">Bitte bestätigen</Status> : <Status ton={st.ton}>{st.label}</Status>}
        </span>
      }
    />
  );
}

function Agenda({ von, bis, termine, konflikte, mitarbeiterId, onNeu }: { von: Datum; bis: Datum; termine: Termin[]; konflikte: Set<string>; mitarbeiterId: string; onNeu: () => void }) {
  if (!termine.length)
    return (
      <Leer
        titel="Keine Termine in diesen 2 Wochen"
        text={mitarbeiterId ? 'Für diesen Mitarbeiter ist nichts geplant.' : 'Leg einen Termin an oder plane offene Aufträge ein.'}
        icon="kalender"
        aktion={<Button onClick={onNeu}>Termin anlegen</Button>}
      />
    );
  const k = kontextAusDb();
  return (
    <Stapel abstand={24}>
      {tage(von, bis).map((d) => {
        const liste = termine.filter((t) => terminAmTag(t, d));
        const ab = mitarbeiterId ? anwesenheit(mitarbeiterId, d, k) : undefined;
        if (!liste.length && !(ab && ab.status === 'abwesend')) return null;
        return (
          <section key={d} className="mm-stapel" style={{ gap: 8 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>
              {d === heute() ? 'Heute, ' : d === plusTage(heute(), 1) ? 'Morgen, ' : ''}
              {tagFmt.format(new Date(`${d}T12:00:00`))}
            </h2>
            {ab && ab.status === 'abwesend' && <Status ton="achtung">{ab.text}</Status>}
            {liste.length > 0 && (
              <Liste>
                {liste.map((t) => (
                  <TerminZeile key={t.id} t={t} konflikt={konflikte.has(t.id)} />
                ))}
              </Liste>
            )}
          </section>
        );
      })}
    </Stapel>
  );
}

function TagListe({ datum, termine, konflikte, mitarbeiterId, onNeu }: { datum: Datum; termine: Termin[]; konflikte: Set<string>; mitarbeiterId: string; onNeu: () => void }) {
  const k = kontextAusDb();
  const abwesend = k.mitarbeiter
    .filter((m) => m.aktiv && (!mitarbeiterId || m.id === mitarbeiterId))
    .map((m) => ({ m, a: anwesenheit(m.id, datum, k) }))
    .filter((x) => x.a.status === 'abwesend' || x.a.status === 'beantragt');
  return (
    <Stapel>
      {abwesend.length > 0 && (
        <Meta>
          Nicht da: {abwesend.map((x) => `${personName(x.m)} (${x.a.text})`).join(', ')}
        </Meta>
      )}
      <Liste
        leer={<Leer titel="An diesem Tag ist nichts geplant" text="Leg einen Termin an oder wähle einen anderen Tag." icon="kalender" aktion={<Button onClick={onNeu}>Termin anlegen</Button>} />}
      >
        {termine.map((t) => (
          <TerminZeile key={t.id} t={t} konflikt={konflikte.has(t.id)} />
        ))}
      </Liste>
    </Stapel>
  );
}

function Woche({ von, termine, konflikte, onTag }: { von: Datum; termine: Termin[]; konflikte: Set<string>; onTag: (d: Datum) => void }) {
  const k = kontextAusDb();
  return (
    <>
      <div className="pl-woche">
        {tage(von, plusTage(von, 6)).map((d, i) => {
          const liste = termine.filter((t) => terminAmTag(t, d));
          const arbeitstag = k.arbeitstage.includes(i + 1);
          return (
            <div key={d} className={`pl-tag ${d === heute() ? 'pl-tag--heute' : ''} ${!arbeitstag ? 'pl-tag--frei' : ''}`}>
              <div className="pl-tagkopf">
                <button type="button" onClick={() => onTag(d)} aria-label={`Tagesansicht ${datumKurz(d)}`}>
                  <strong>{WOCHENTAGE[i]}</strong> {datumKurz(d).split(', ')[1] ?? datumKurz(d)}
                </button>
                {liste.length > 0 && <span className="mm-meta">{liste.length}</span>}
              </div>
              {liste.map((t) => (
                <TerminKachel key={t.id} t={t} konflikt={konflikte.has(t.id)} />
              ))}
              {!liste.length && arbeitstag && <span className="mm-meta">Frei</span>}
            </div>
          );
        })}
      </div>
      {!termine.length && <Meta>Diese Woche ist noch nichts geplant. Offene Aufträge findest du unter „Offen einzuplanen“.</Meta>}
    </>
  );
}

function Monat({ von, bis, monat, termine, onTag }: { von: Datum; bis: Datum; monat: string; termine: Termin[]; onTag: (d: Datum) => void }) {
  return (
    <div className="pl-monat">
      {WOCHENTAGE.map((w) => (
        <div key={w} className="pl-monat-kopf">
          {w}
        </div>
      ))}
      {tage(von, bis).map((d) => {
        const liste = termine.filter((t) => terminAmTag(t, d));
        return (
          <button
            key={d}
            type="button"
            className={`pl-monatstag ${d.slice(0, 7) !== monat ? 'pl-monatstag--fremd' : ''} ${d === heute() ? 'pl-monatstag--heute' : ''}`}
            onClick={() => onTag(d)}
            aria-label={`${datumKurz(d)}: ${liste.length ? `${liste.length} Termine` : 'keine Termine'}`}
          >
            <strong>{Number(d.slice(8))}</strong>
            {liste.slice(0, 3).map((t) => (
              <span key={t.id}>
                {t.ganztags ? '' : uhrzeit(t.start) + ' '}
                {t.titel}
              </span>
            ))}
            {liste.length > 3 && <span className="mm-meta">+ {liste.length - 3} weitere</span>}
          </button>
        );
      })}
    </div>
  );
}
