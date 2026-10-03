/** Kalender: Tag / Woche / Monat am Rechner, Agenda-Liste am Handy. Filter nach Mitarbeiter.
 *  In Woche und Monat lassen sich Termine per Drag and Drop auf einen anderen Tag ziehen – erst nach Bestätigung wird gespeichert. */
import { Fragment, useMemo, useState, type DragEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, isoDatum, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart } from '@core/format';
import { useDarf, useIch, istBuero } from '@core/session';
import type { Datum, Termin } from '@core/objects';
import { Auswahl, Button, Dialog, IconButton, Leer, Liste, ListenZeile, Meldung, Meta, Segmente, Seite, Stapel, Status, useToast } from '@ui/index';
import { Person, Personen } from '@ui/person';
import { kontextAusDb, terminKonflikte, anwesenheit } from '../verfuegbarkeit/daten';
import { monatsAnfang, terminAmTag, termineIm, TERMINART_LABEL, TERMINSTATUS, verschoben } from './daten';
import { useSchmal } from './hooks';
import { TerminFormular } from './TerminFormular';
import { terminVerschieben } from './TerminDetail';
import './plan.css';
import { ziehBild } from '@ui/ziehen';

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

/** Ziehen und Ablegen: welcher Termin gerade gezogen wird und über welchem Tag er schwebt */
type Ziehen = {
  darf: (t: Termin) => boolean;
  zug?: string;
  ziel?: Datum;
  start: (t: Termin) => (e: DragEvent) => void;
  ende: () => void;
  tag: (d: Datum) => { onDragOver: (e: DragEvent) => void; onDragLeave: () => void; onDrop: (e: DragEvent) => void };
};

/** Nur geplante und bestätigte Termine – laufende, erledigte und abgesagte bleiben, wo sie sind */
const verschiebbar = (t: Termin) => t.status === 'geplant' || t.status === 'bestaetigt';

function useZiehen(darfPlanen: boolean, onAblegen: (t: Termin, tag: Datum) => void): Ziehen {
  const [zug, setZug] = useState<string>();
  const [ziel, setZiel] = useState<Datum>();
  const ende = () => (setZug(undefined), setZiel(undefined));
  return {
    darf: (t) => darfPlanen && verschiebbar(t),
    zug,
    ziel,
    start: (t) => (e) => {
      ziehBild(e, t.titel);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', t.titel);
      setZug(t.id);
    },
    ende,
    tag: (d) => ({
      onDragOver: (e) => {
        if (!zug) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (ziel !== d) setZiel(d);
      },
      onDragLeave: () => ziel === d && setZiel(undefined),
      onDrop: (e) => {
        e.preventDefault();
        const t = zug ? db.termine.get(zug) : undefined;
        ende();
        if (t && isoTag(t.start) !== d) onAblegen(t, d);
      },
    }),
  };
}

const isoTag = (iso: string) => isoDatum(new Date(iso));

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
  const [ablage, setAblage] = useState<{ t: Termin; tag: Datum }>();
  const ziehen = useZiehen(useDarf('planen'), (t, tag) => setAblage({ t, tag }));

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
    <Seite titel="Kalender" breit aktion={<Button icon="plus" onClick={() => setze({ neu: '1' })}>Termin planen</Button>}>
      {/* Links das Datum (wo bin ich?), rechts Ansicht und Filter (wie zeige ich es?) */}
      <div className="pl-kopfleiste">
        <div className="pl-navi">
          <IconButton icon="pfeilLinks" label="Zurück" onClick={() => setze({ datum: schritt(ansicht, datum, -1, schmal) })} />
          <Button variante="sekundaer" klein onClick={() => setze({ datum: undefined })}>
            Heute
          </Button>
          <IconButton icon="pfeilRechts" label="Weiter" onClick={() => setze({ datum: schritt(ansicht, datum, 1, schmal) })} />
          <span className="pl-zeitraum" aria-live="polite">
            {titelZeitraum}
          </span>
        </div>
        <div className="pl-kopfleiste-rechts">
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
        </div>
      </div>

      {schmal ? (
        <Agenda von={von} bis={bis} termine={termine} konflikte={konflikte} mitarbeiterId={ma} onNeu={() => setze({ neu: '1' })} />
      ) : ansicht === 'tag' ? (
        <TagListe datum={datum} termine={termine} konflikte={konflikte} mitarbeiterId={ma} onNeu={() => setze({ neu: '1' })} />
      ) : ansicht === 'woche' ? (
        <Woche von={von} termine={termine} konflikte={konflikte} ziehen={ziehen} onTag={(d) => setze({ ansicht: 'tag', datum: d })} />
      ) : (
        <Monat von={von} bis={bis} monat={datum.slice(0, 7)} termine={termine} ziehen={ziehen} onTag={(d) => setze({ ansicht: 'tag', datum: d })} />
      )}

      <TerminFormular
        offen={neu}
        onSchliessen={() => setze({ neu: undefined })}
        vorgabe={{ datum: datum < heute() ? heute() : datum, mitarbeiterIds: ma ? [ma] : undefined }}
        onGespeichert={(t) => navigate(terminPfad(t.id))}
      />
      <AblegenDialog ablage={ablage} onSchliessen={() => setAblage(undefined)} />
    </Seite>
  );
}

// ------------------------------------------------------------------ Bausteine

export function TerminKachel({ t, konflikt, zeigeTag, ziehen }: { t: Termin; konflikt?: boolean; zeigeTag?: boolean; ziehen?: Ziehen }) {
  const ma = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter((m): m is NonNullable<typeof m> => !!m);
  const kunde = db.kunden.get(t.kundeId);
  const st = TERMINSTATUS[t.status];
  return (
    <Link
      to={terminPfad(t.id)}
      className={`pl-termin ${t.status === 'abgesagt' ? 'pl-termin--abgesagt' : ''} ${konflikt ? 'pl-termin--konflikt' : ''} ${ziehen?.zug === t.id ? 'pl-termin--zug' : ''}`}
      style={{ ['--pl-farbe' as string]: ma[0]?.farbe ?? undefined }}
      draggable={ziehen?.darf(t) ?? false}
      onDragStart={ziehen?.darf(t) ? ziehen.start(t) : undefined}
      onDragEnd={ziehen?.ende}
    >
      <span className="mm-meta">
        {zeigeTag ? `${datumKurz(t.start)}, ` : ''}
        {t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}
      </span>
      <strong>{t.titel}</strong>
      {kunde && <span className="mm-meta">{kunde.name}</span>}
      {ma.length ? <Personen ids={ma} groesse={20} max={3} /> : <span className="mm-meta">Noch niemand eingeplant</span>}
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
  const text = [TERMINART_LABEL[t.art], kunde?.name, ort?.adresse.ort].filter(Boolean).join(' · ');
  return (
    <>
      {text} · {t.mitarbeiterIds.length ? <Personen ids={t.mitarbeiterIds} groesse={20} namen /> : 'Noch niemand eingeplant'}
    </>
  );
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
        aktion={<Button onClick={onNeu}>Termin planen</Button>}
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
          Nicht da:{' '}
          {abwesend.map((x, i) => (
            <Fragment key={x.m.id}>
              {i > 0 && ', '}
              <Person m={x.m} groesse={20}>{`${personName(x.m)} (${x.a.text})`}</Person>
            </Fragment>
          ))}
        </Meta>
      )}
      <Liste
        leer={<Leer titel="An diesem Tag ist nichts geplant" text="Leg einen Termin an oder wähle einen anderen Tag." icon="kalender" aktion={<Button onClick={onNeu}>Termin planen</Button>} />}
      >
        {termine.map((t) => (
          <TerminZeile key={t.id} t={t} konflikt={konflikte.has(t.id)} />
        ))}
      </Liste>
    </Stapel>
  );
}

function Woche({ von, termine, konflikte, ziehen, onTag }: { von: Datum; termine: Termin[]; konflikte: Set<string>; ziehen: Ziehen; onTag: (d: Datum) => void }) {
  const k = kontextAusDb();
  return (
    <>
      <div className="pl-woche">
        {tage(von, plusTage(von, 6)).map((d, i) => {
          const liste = termine.filter((t) => terminAmTag(t, d));
          const arbeitstag = k.arbeitstage.includes(i + 1);
          return (
            <div key={d} className={`pl-tag ${d === heute() ? 'pl-tag--heute' : ''} ${!arbeitstag ? 'pl-tag--frei' : ''} ${ziehen.ziel === d ? 'pl-ablage' : ''}`} {...ziehen.tag(d)}>
              <div className="pl-tagkopf">
                <button type="button" onClick={() => onTag(d)} aria-label={`Tagesansicht ${datumKurz(d)}`}>
                  <span className="pl-tagkopf-wochentag">{WOCHENTAGE[i]}</span>
                  <span className="pl-tagkopf-zahl" aria-current={d === heute() ? 'date' : undefined}>
                    {Number(d.slice(8, 10))}
                  </span>
                </button>
                {liste.length > 0 && <span className="pl-tagkopf-anzahl">{liste.length === 1 ? '1 Termin' : `${liste.length} Termine`}</span>}
              </div>
              {liste.map((t) => (
                <TerminKachel key={t.id} t={t} konflikt={konflikte.has(t.id)} ziehen={ziehen} />
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

function Monat({ von, bis, monat, termine, ziehen, onTag }: { von: Datum; bis: Datum; monat: string; termine: Termin[]; ziehen: Ziehen; onTag: (d: Datum) => void }) {
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
            className={`pl-monatstag ${d.slice(0, 7) !== monat ? 'pl-monatstag--fremd' : ''} ${d === heute() ? 'pl-monatstag--heute' : ''} ${ziehen.ziel === d ? 'pl-ablage' : ''}`}
            onClick={() => onTag(d)}
            {...ziehen.tag(d)}
            aria-label={`${datumKurz(d)}: ${liste.length ? `${liste.length} Termine` : 'keine Termine'}`}
          >
            <strong>{Number(d.slice(8))}</strong>
            {liste.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className={ziehen.darf(t) ? `pl-monat-termin ${ziehen.zug === t.id ? 'pl-termin--zug' : ''}` : undefined}
                draggable={ziehen.darf(t)}
                onDragStart={ziehen.darf(t) ? ziehen.start(t) : undefined}
                onDragEnd={ziehen.ende}
              >
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

// ------------------------------------------------------------------ Ablegen bestätigen

const zeitText = (t: Pick<Termin, 'start' | 'ende' | 'ganztags'>) =>
  `${datumKurz(t.start)}, ${t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`}`;

/** Nach dem Ablegen: erst fragen, dann speichern. Abbrechen lässt den Termin, wo er war. */
function AblegenDialog({ ablage, onSchliessen }: { ablage?: { t: Termin; tag: Datum }; onSchliessen: () => void }) {
  const toast = useToast();
  const t = ablage?.t;
  const neu = ablage ? verschoben(ablage.t, ablage.tag) : undefined;
  const konflikte = t && neu ? terminKonflikte({ ...t, ...neu }, kontextAusDb()) : [];
  const speichern = () => {
    if (t && neu) terminVerschieben(t, neu, toast);
    onSchliessen();
  };
  return (
    <Dialog
      offen={!!ablage}
      onSchliessen={onSchliessen}
      titel="Termin verschieben?"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>{konflikte.length ? 'Trotzdem verschieben' : 'Verschieben'}</Button>
        </>
      }
    >
      {t && neu && (
        <Stapel>
          <p style={{ margin: 0 }}>
            Du verschiebst gerade den Termin „{t.titel}“{db.kunden.get(t.kundeId) ? ` bei ${db.kunden.get(t.kundeId)!.name}` : ''}.
          </p>
          <dl className="pl-ablage-zeiten">
            <dt>Bisher</dt>
            <dd>{zeitText(t)}</dd>
            <dt>Neu</dt>
            <dd>
              <strong>{zeitText({ ...t, ...neu })}</strong>
            </dd>
          </dl>
          {konflikte.length > 0 ? (
            <Meldung ton="achtung" titel="Konflikt am neuen Tag">
              {konflikte.map((k) => (
                <div key={k.mitarbeiterId}>
                  <Person m={k.mitarbeiterId} groesse={20} />: {k.gruende.map((g) => g.text).join(', ')}
                </div>
              ))}
            </Meldung>
          ) : (
            <Meta>Die Uhrzeit bleibt gleich. Alle Eingeplanten sind an diesem Tag frei.</Meta>
          )}
        </Stapel>
      )}
    </Dialog>
  );
}
