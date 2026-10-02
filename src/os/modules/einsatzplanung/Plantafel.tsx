/**
 * Plantafel: Mitarbeiter (Zeilen, frei anordenbar) × Tage (Woche oder Monat).
 * Auftrag wählen → in Zelle einplanen. Termine per Drag & Drop umsetzen. Urlaub und Krankheit als durchgehende Balken.
 */
import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart, zahl } from '@core/format';
import type { Abwesenheit, Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, IconButton, Karte, Leer, Meldung, Meta, Seite, Segmente, Stapel, Status, Zeile, useToast } from '@ui/index';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import { monatsAnfang, terminAmTag, termineIm, TERMINSTATUS } from '../kalender/daten';
import { useSchmal } from '../kalender/hooks';
import { abwesenheitAm, anwesenheit, geplanteStunden, kontextAusDb, restStunden, terminKonflikte, verfuegbareStunden, type Grund, type PlanKontext } from '../verfuegbarkeit/daten';
import { offenEinzuplanen } from '../offen/daten';
import { ART_LABEL } from '../abwesenheiten/daten';
import { Personenbild } from '../mitarbeiter/profilbild';
import { darfTeamDaten, ROLLE_LABEL } from '../mitarbeiter/team';
import { aufZelleVerschieben, vorbelegung } from './daten';
import { geordnet, gespeicherteReihe, planReihen, reiheSpeichern, reiheZuruecksetzen, verschoben } from './reihenfolge';
import '../kalender/plan.css';
import './plantafel.css';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
type Ansicht = 'woche' | 'monat';
const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;
const abwesenheitPfad = (id: string) => `/betrieb/abwesenheiten/${id}`;
const wtag = (d: Datum) => WOCHENTAGE[(new Date(`${d}T12:00:00`).getDay() + 6) % 7];
const tagZahl = (d: Datum) => d.slice(8, 10);
const monatsTitel = (d: Datum) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

function abwesenheitText(a: Abwesenheit, m: Mitarbeiter) {
  const art = darfTeamDaten(m.id) ? ART_LABEL[a.art] : 'Abwesend';
  return `${art}${a.halbtags ? ' (halber Tag)' : ''}${a.status === 'beantragt' ? ' · beantragt' : ''}`;
}

/** Durchgehender Balken für Urlaub, Krankheit, Schule … – über mehrere Tage verbunden */
function AbwesenheitBalken({ a, m, start, ende, kompakt, laenge = 1 }: { a: Abwesenheit; m: Mitarbeiter; start: boolean; ende: boolean; kompakt?: boolean; laenge?: number }) {
  const text = abwesenheitText(a, m);
  const klasse = `pl-abw pl-abw--${a.art} ${a.status === 'beantragt' ? 'pl-abw--beantragt' : ''} ${start ? 'pl-abw--start' : ''} ${ende ? 'pl-abw--ende' : ''} ${kompakt ? 'pl-abw--kompakt' : ''}`;
  const inhalt = start ? (
    <span className="pl-abw-text" style={{ ['--laenge' as string]: laenge }}>
      {text}
    </span>
  ) : <span className="sr-only">{text}</span>;
  return darfTeamDaten(m.id) ? (
    <Link to={abwesenheitPfad(a.id)} className={klasse} title={`${personName(m)}: ${text}`}>
      {inhalt}
    </Link>
  ) : (
    <span className={klasse} title={`${personName(m)}: ${text}`}>
      {inhalt}
    </span>
  );
}

/** Terminbalken in der Wochenansicht: Zeit, Titel, Kunde und die Gesichter aller Eingeplanten */
function TerminBalken({ t, m, gruende }: { t: Termin; m: Mitarbeiter; gruende?: Grund[] }) {
  const ma = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
  const kunde = db.kunden.get(t.kundeId);
  const blockiert = gruende?.filter((g) => g.blockiert) ?? [];
  const st = TERMINSTATUS[t.status];
  return (
    <Link
      to={terminPfad(t.id)}
      className={`pl-balken ${t.status === 'abgesagt' ? 'pl-balken--abgesagt' : ''} ${blockiert.length ? 'pl-balken--konflikt' : ''} ${t.art === 'besichtigung' ? 'pl-balken--ruhig' : ''}`}
      style={{ ['--pl-farbe' as string]: m.farbe ?? undefined }}
    >
      <span className="pl-balken-zeit">{t.ganztags ? 'Ganzer Tag' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}</span>
      <strong>{t.titel}</strong>
      {kunde && <span className="pl-balken-meta">{kunde.name}</span>}
      <span className="pl-balken-fuss">
        <span className="pl-gesichter" aria-label={`Eingeplant: ${ma.map((x) => personName(x)).join(', ')}`}>
          {ma.slice(0, 4).map((x) => (
            <Personenbild key={x.id} m={x} groesse={24} />
          ))}
          {ma.length > 4 && <span className="pl-gesichter-mehr">+{ma.length - 4}</span>}
        </span>
        {t.status !== 'geplant' && <Status ton={st.ton}>{st.label}</Status>}
        {t.selbstGebucht && t.status === 'geplant' && <Status ton="aktiv">Bitte bestätigen</Status>}
      </span>
      {blockiert.length > 0 && (
        <span className="pl-balken-konflikt">
          <Status ton="achtung">Konflikt</Status> {blockiert.map((g) => g.text).join(', ')}
        </span>
      )}
    </Link>
  );
}

/** Auslastung als ruhiger Balken + Text (nie nur Farbe) */
function Auslastung({ geplant, verfuegbar, kompakt }: { geplant: number; verfuegbar: number; kompakt?: boolean }) {
  const anteil = verfuegbar > 0 ? Math.min(1, geplant / verfuegbar) : geplant > 0 ? 1 : 0;
  const ueber = geplant > verfuegbar;
  return (
    <span className="pl-last">
      <span className="pl-last-spur" aria-hidden>
        <span className={`pl-last-wert ${ueber ? 'pl-last-wert--ueber' : ''}`} style={{ width: `${Math.round(anteil * 100)}%` }} />
      </span>
      <span className="pl-last-text">
        {kompakt ? `${zahl(Math.round(geplant))} / ${zahl(Math.round(verfuegbar))} h` : `${zahl(geplant)} von ${zahl(verfuegbar)} h`}
        {ueber ? ' · überlastet' : ''}
      </span>
    </span>
  );
}

/** Abwesenheit am Tag und ob der Balken dort beginnt/endet (bezogen auf die sichtbaren Tage) */
function abwesenheitsSegment(m: Mitarbeiter, tageListe: Datum[], i: number, k: PlanKontext) {
  const a = abwesenheitAm(m.id, tageListe[i], k);
  if (!a) return undefined;
  const vorher = i > 0 ? abwesenheitAm(m.id, tageListe[i - 1], k) : undefined;
  const nachher = i < tageListe.length - 1 ? abwesenheitAm(m.id, tageListe[i + 1], k) : undefined;
  let laenge = 1;
  while (i + laenge < tageListe.length && abwesenheitAm(m.id, tageListe[i + laenge], k)?.id === a.id) laenge++;
  return { a, start: vorher?.id !== a.id, ende: nachher?.id !== a.id, laenge };
}

export function Plantafel() {
  useDatenstand();
  planReihen.use();
  const [sp, setSp] = useSearchParams();
  const schmal = useSchmal();
  const toast = useToast();
  const darfPlanen = useDarf('planen');
  const auftragId = sp.get('auftrag') ?? '';
  const auftrag = db.auftraege.get(auftragId || undefined);
  const ansicht: Ansicht = sp.get('ansicht') === 'monat' ? 'monat' : 'woche';
  const basis = sp.get('woche') ?? heute();
  const woche = wochenStart(basis);
  const monat = monatsAnfang(basis);
  const tag = sp.get('tag') ?? (woche === wochenStart(heute()) ? heute() : woche);
  const [wochenende, setWochenende] = useState(false);
  const [sortieren, setSortieren] = useState(false);
  const [vorgabe, setVorgabe] = useState<TerminVorgabe>();
  const [zug, setZug] = useState<{ terminId: ID; vonMa: ID }>();
  const [ziel, setZiel] = useState<string>();
  const [reiheZug, setReiheZug] = useState<ID>();
  const [reiheZiel, setReiheZiel] = useState<ID>();

  const setze = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) v == null || v === '' ? n.delete(k) : n.set(k, v);
    setSp(n, { replace: true });
  };

  const k = kontextAusDb();
  const eigeneReihe = gespeicherteReihe();
  const mitarbeiter = geordnet(
    k.mitarbeiter.filter((m) => m.aktiv),
    eigeneReihe,
  );
  const darfOrdnen = darfPlanen && !schmal;

  const von = ansicht === 'monat' ? monat : woche;
  const bis = ansicht === 'monat' ? plusTage(monatsAnfang(monat, 1), -1) : plusTage(woche, 6);
  const alleTage = tage(von, bis);
  const termineZeitraum = termineIm(k.termine, von, bis);
  const wochenendeBelegt = ansicht === 'woche' && termineZeitraum.some((t) => alleTage.slice(5).some((d) => terminAmTag(t, d)));
  const zeigeWochenende = ansicht === 'monat' || wochenende || wochenendeBelegt;
  const sichtbareTage = alleTage.filter((d) => zeigeWochenende || k.arbeitstage.includes(((new Date(`${d}T12:00:00`).getDay() + 6) % 7) + 1));

  const konflikte = useMemo(() => {
    const m = new Map<ID, Map<ID, Grund[]>>();
    for (const t of termineZeitraum) m.set(t.id, new Map(terminKonflikte(t, k).map((x) => [x.mitarbeiterId, x.gruende])));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termineZeitraum.map((t) => t.id + t.geaendertAm).join(), k.abwesenheiten.length]);

  const offen = offenEinzuplanen(db.auftraege.all(), k.termine);
  const offenIds = new Set(offen.map((e) => e.auftrag.id));
  const weitere = db.auftraege.where((a) => ['anfrage', 'besichtigung', 'beauftragt', 'in_arbeit', 'abnahme'].includes(a.phase) && !offenIds.has(a.id));
  const auftragLabel = (a: (typeof weitere)[number]) => `${a.nummer} · ${a.titel} (${db.kunden.get(a.kundeId)?.name ?? '–'})`;
  const optionen = [
    ...offen.map((e) => ({ wert: e.auftrag.id, label: `Ohne Termin: ${auftragLabel(e.auftrag)}` })),
    ...weitere.sort((a, b) => a.nummer.localeCompare(b.nummer)).map((a) => ({ wert: a.id, label: auftragLabel(a) })),
  ];
  const rest = auftrag ? restStunden(auftrag, k.termine) : undefined;

  const zelleOeffnen = (m: Mitarbeiter, d: Datum) => {
    const v = vorbelegung(auftrag, m.id, d, k);
    setVorgabe({ auftragId: auftrag?.id, mitarbeiterIds: [m.id], datum: d, von: v.von, bis: v.bis });
  };

  // ---------------------------------------------------------------- Reihenfolge
  const ids = mitarbeiter.map((m) => m.id);
  const ordne = (id: ID, nach: number) => {
    const neu = verschoben(ids, id, nach);
    if (neu.join() !== ids.join()) reiheSpeichern(neu);
  };
  const reiheFallen = (zielId: ID) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/x-reihe') || reiheZug;
    setReiheZug(undefined);
    setReiheZiel(undefined);
    if (!id || id === zielId) return;
    ordne(id, ids.indexOf(zielId));
  };

  // ---------------------------------------------------------------- Termine umsetzen
  const fallenLassen = (m: Mitarbeiter, d: Datum) => (e: DragEvent) => {
    e.preventDefault();
    setZiel(undefined);
    const terminId = e.dataTransfer.getData('text/x-termin') || zug?.terminId;
    const vonMa = e.dataTransfer.getData('text/x-mitarbeiter') || zug?.vonMa;
    setZug(undefined);
    const t = db.termine.get(terminId);
    if (!t || !vonMa) return;
    const neu = aufZelleVerschieben(t, vonMa, m.id, d);
    if (neu.start === t.start && neu.mitarbeiterIds.join() === t.mitarbeiterIds.join()) return;
    const alt = { start: t.start, ende: t.ende, mitarbeiterIds: t.mitarbeiterIds };
    db.termine.update(t.id, neu, { text: `Umgeplant: ${personName(m)}, ${datumKurz(neu.start)}` });
    const konflikt = terminKonflikte({ ...t, ...neu }, kontextAusDb()).find((x) => x.mitarbeiterId === m.id);
    toast(konflikt ? `Umgeplant – Achtung: ${konflikt.gruende[0].text}.` : `Umgeplant auf ${personName(m)}, ${datumKurz(neu.start)}`, {
      ton: konflikt ? 'achtung' : 'erfolg',
      aktion: { label: 'Rückgängig', onClick: () => db.termine.update(t.id, alt, { text: 'Umplanung rückgängig gemacht' }) },
    });
  };

  const ziehbar = (t: Termin, m: Mitarbeiter, inhalt: ReactNode, klasse?: string) => (
    <div
      key={t.id}
      className={klasse}
      draggable={darfPlanen && !schmal}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/x-termin', t.id);
        e.dataTransfer.setData('text/x-mitarbeiter', m.id);
        e.dataTransfer.effectAllowed = 'move';
        setZug({ terminId: t.id, vonMa: m.id });
      }}
      onDragEnd={() => (setZug(undefined), setZiel(undefined))}
    >
      {inhalt}
    </div>
  );

  const kachel = (t: Termin, m: Mitarbeiter) => ziehbar(t, m, <TerminBalken t={t} m={m} gruende={konflikte.get(t.id)?.get(m.id)} />);

  const miniKachel = (t: Termin, m: Mitarbeiter) => {
    const konflikt = !!konflikte.get(t.id)?.get(m.id)?.some((x) => x.blockiert);
    const zeit = t.ganztags ? 'ganzer Tag' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`;
    return ziehbar(
      t,
      m,
      <Link
        to={terminPfad(t.id)}
        className={`pl-mini ${konflikt ? 'pl-mini--konflikt' : ''} ${t.status === 'abgesagt' ? 'pl-mini--abgesagt' : ''}`}
        style={{ ['--pl-farbe' as string]: m.farbe ?? undefined }}
        title={`${t.titel} · ${zeit}${konflikt ? ' · Konflikt' : ''}`}
        aria-label={`${t.titel}, ${datumKurz(t.start)}, ${zeit}${konflikt ? ', Konflikt' : ''}`}
      />,
      'pl-mini-griff',
    );
  };

  const einplanenKnopf = (m: Mitarbeiter, d: Datum) =>
    darfPlanen && d >= heute() ? (
      <button type="button" className="pl-einplanen" onClick={() => zelleOeffnen(m, d)} aria-label={`${auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}: ${personName(m)}, ${datumKurz(d)}`}>
        + {auftrag ? 'Hier einplanen' : 'Termin'}
      </button>
    ) : null;

  const vor = (n: number) => (ansicht === 'monat' ? monatsAnfang(monat, n) : plusTage(woche, 7 * n));
  const zeitraumText =
    ansicht === 'monat' ? monatsTitel(monat) : `KW ${kalenderwoche(woche)} · ${datumKurz(woche)} – ${datumKurz(plusTage(woche, 6))}`;

  const werkzeugleiste = (
    <div className="pt-leiste">
      <div className="pl-navi">
        <IconButton icon="pfeilLinks" label={ansicht === 'monat' ? 'Voriger Monat' : 'Vorige Woche'} onClick={() => setze({ woche: vor(-1), tag: undefined })} />
        <Button variante="tertiaer" onClick={() => setze({ woche: undefined, tag: undefined })}>
          {ansicht === 'monat' ? 'Dieser Monat' : 'Diese Woche'}
        </Button>
        <IconButton icon="pfeilRechts" label={ansicht === 'monat' ? 'Nächster Monat' : 'Nächste Woche'} onClick={() => setze({ woche: vor(1), tag: undefined })} />
        <span className="pl-zeitraum">{zeitraumText}</span>
      </div>
      <div className="pt-leiste-rechts">
        {ansicht === 'woche' && !wochenendeBelegt && (
          <Button variante="tertiaer" klein onClick={() => setWochenende(!wochenende)}>
            {wochenende ? 'Wochenende ausblenden' : 'Wochenende zeigen'}
          </Button>
        )}
        {darfOrdnen && (
          <Button variante={sortieren ? 'sekundaer' : 'tertiaer'} klein icon={sortieren ? 'check' : 'liste'} onClick={() => setSortieren(!sortieren)}>
            {sortieren ? 'Reihenfolge fertig' : 'Reihenfolge ändern'}
          </Button>
        )}
        <Segmente
          label="Zeitraum"
          wert={ansicht}
          optionen={[
            { wert: 'woche', label: 'Woche' },
            { wert: 'monat', label: 'Monat' },
          ]}
          onChange={(v) => setze({ ansicht: v === 'monat' ? 'monat' : undefined })}
        />
      </div>
    </div>
  );

  const nameZelle = (m: Mitarbeiter, i: number) => {
    const geplant = geplanteStunden(m.id, von, bis, k);
    const verf = verfuegbareStunden(m.id, von, bis, k);
    const unter = [ROLLE_LABEL[m.rolle], m.team].filter(Boolean).join(' · ');
    return (
      <div
        key={m.id}
        className={`pt-name ${reiheZiel === m.id && reiheZug !== m.id ? 'pt-name--ziel' : ''} ${reiheZug === m.id ? 'pt-name--zieht' : ''} ${darfOrdnen ? 'pt-name--ziehbar' : ''}`}
        role="rowheader"
        draggable={darfOrdnen}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/x-reihe', m.id);
          e.dataTransfer.effectAllowed = 'move';
          setReiheZug(m.id);
        }}
        onDragEnd={() => (setReiheZug(undefined), setReiheZiel(undefined))}
        onDragOver={(e) => {
          if (!reiheZug) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (reiheZiel !== m.id) setReiheZiel(m.id);
        }}
        onDrop={reiheFallen(m.id)}
      >
        <Personenbild m={m} groesse={ansicht === 'monat' ? 32 : 40} />
        <span className="pt-name-text">
          <Link to={`/betrieb/mitarbeiter/${m.id}`} className="pt-name-link" draggable={false}>
            {personName(m)}
          </Link>
          {ansicht === 'woche' && unter && <span className="pt-name-unter">{unter}</span>}
          <Auslastung geplant={geplant} verfuegbar={verf} kompakt={ansicht === 'monat'} />
        </span>
        {sortieren && (
          <span className="pt-ordnen">
            <IconButton icon="hoch" label={`${personName(m)} nach oben`} disabled={i === 0} onClick={() => ordne(m.id, i - 1)} />
            <IconButton icon="runter" label={`${personName(m)} nach unten`} disabled={i === mitarbeiter.length - 1} onClick={() => ordne(m.id, i + 1)} />
          </span>
        )}
      </div>
    );
  };

  const kopfZelle = (d: Datum) => {
    const frei = !k.arbeitstage.includes(((new Date(`${d}T12:00:00`).getDay() + 6) % 7) + 1);
    const klasse = `pt-kopf ${d === heute() ? 'pt-kopf--heute' : ''} ${frei ? 'pt-kopf--frei' : ''}`;
    const inhalt = (
      <>
        <span className="pt-kopf-wtag">{ansicht === 'monat' ? wtag(d).slice(0, 2) : wtag(d)}</span>
        <span className="pt-kopf-zahl">{tagZahl(d)}</span>
      </>
    );
    return ansicht === 'monat' ? (
      <button key={d} type="button" className={klasse} role="columnheader" onClick={() => setze({ ansicht: undefined, woche: d })} aria-label={`Woche ab ${datumKurz(d)} öffnen`}>
        {inhalt}
      </button>
    ) : (
      <div key={d} className={klasse} role="columnheader">
        {inhalt}
      </div>
    );
  };

  const tagesZelle = (m: Mitarbeiter, d: Datum, i: number) => {
    const a = anwesenheit(m.id, d, k);
    const liste = termineIm(k.termine, d, d, { mitarbeiterId: m.id });
    const seg = abwesenheitsSegment(m, sichtbareTage, i, k);
    const schluessel = `${m.id}|${d}`;
    const frei = a.status === 'frei' || a.status === 'inaktiv';
    const monatlich = ansicht === 'monat';
    return (
      <div
        key={schluessel}
        role="gridcell"
        className={`pt-zelle ${monatlich ? 'pt-zelle--monat' : ''} ${frei ? 'pt-zelle--frei' : ''} ${d === heute() ? 'pt-zelle--heute' : ''} ${ziel === schluessel ? 'pt-zelle--ziel' : ''}`}
        onDragOver={(e) => {
          if (!zug) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (ziel !== schluessel) setZiel(schluessel);
        }}
        onDragLeave={() => ziel === schluessel && setZiel(undefined)}
        onDrop={fallenLassen(m, d)}
      >
        {seg && <AbwesenheitBalken a={seg.a} m={m} start={seg.start} ende={seg.ende} laenge={seg.laenge} kompakt={monatlich} />}
        {!monatlich && a.status === 'inaktiv' && <span className="pt-zelle-hinweis">{a.text}</span>}
        {!monatlich && a.status === 'frei' && !liste.length && !seg && <span className="pt-zelle-hinweis">{a.text}</span>}
        {monatlich ? (
          <>
            {liste.slice(0, 3).map((t) => miniKachel(t, m))}
            {liste.length > 3 && <span className="pt-mehr">+{liste.length - 3}</span>}
            {auftrag && darfPlanen && d >= heute() && (
              <button type="button" className="pt-mini-neu" onClick={() => zelleOeffnen(m, d)} aria-label={`${auftrag.titel} einplanen: ${personName(m)}, ${datumKurz(d)}`}>
                +
              </button>
            )}
          </>
        ) : (
          <>
            {liste.map((t) => kachel(t, m))}
            {einplanenKnopf(m, d)}
          </>
        )}
      </div>
    );
  };

  const legende = (
    <div className="pt-legende" aria-label="Legende">
      <span className="pt-legende-eintrag">
        <span className="pl-abw pl-abw--urlaub pl-abw--start pl-abw--ende pt-legende-probe" /> Urlaub
      </span>
      <span className="pt-legende-eintrag">
        <span className="pl-abw pl-abw--krank pl-abw--start pl-abw--ende pt-legende-probe" /> Krank
      </span>
      <span className="pt-legende-eintrag">
        <span className="pl-abw pl-abw--schule pl-abw--start pl-abw--ende pt-legende-probe" /> Schule, Schulung, frei
      </span>
      <span className="pt-legende-eintrag">
        <span className="pl-abw pl-abw--urlaub pl-abw--beantragt pl-abw--start pl-abw--ende pt-legende-probe" /> Beantragt
      </span>
      <span className="pt-legende-eintrag">
        <span className="pt-legende-frei" /> Wochenende, Feiertag
      </span>
    </div>
  );

  return (
    <Seite
      titel="Einsatzplanung"
      untertitel="Wer macht was – und wer ist wann weg. Konflikte siehst du sofort."
      breit
      aktion={
        <Button variante="sekundaer" icon="kalender" to="/betrieb/abwesenheiten">
          Urlaub eintragen
        </Button>
      }
    >
      {darfPlanen && (
        <div className="pl-kopfleiste">
          <Auswahl label="Auftrag einplanen" value={auftragId} onChange={(e) => setze({ auftrag: e.target.value })} leer={optionen.length ? 'Auftrag wählen' : 'Keine offenen Aufträge'} optionen={optionen} />
        </div>
      )}
      {auftrag && (
        <Meldung
          ton="aktiv"
          titel={`${auftrag.titel} einplanen`}
          aktion={
            <Button variante="sekundaer" klein onClick={() => setze({ auftrag: undefined })}>
              Fertig
            </Button>
          }
        >
          {rest != null ? (rest > 0 ? `Noch ${zahl(rest)} h einzuplanen. ` : 'Die geschätzten Stunden sind verplant. ') : ''}
          Tipp bei Mitarbeiter und Tag auf {ansicht === 'monat' ? '„+“' : '„Hier einplanen“'} – Macher schlägt die erste freie Zeit vor.
        </Meldung>
      )}

      {!mitarbeiter.length ? (
        <Leer titel="Noch keine Mitarbeiter" text="Leg dein Team an, dann kannst du hier Einsätze verteilen." icon="team" />
      ) : schmal ? (
        <Stapel>
          <div className="pl-navi">
            <IconButton icon="pfeilLinks" label="Vortag" onClick={() => setze({ tag: plusTage(tag, -1), woche: wochenStart(plusTage(tag, -1)) })} />
            <Button variante="tertiaer" onClick={() => setze({ tag: undefined, woche: undefined })}>
              Heute
            </Button>
            <IconButton icon="pfeilRechts" label="Nächster Tag" onClick={() => setze({ tag: plusTage(tag, 1), woche: wochenStart(plusTage(tag, 1)) })} />
            <span className="pl-zeitraum">{datumKurz(tag)}</span>
          </div>
          {mitarbeiter.map((m) => {
            const a = anwesenheit(m.id, tag, k);
            const ab = abwesenheitAm(m.id, tag, k);
            const liste = termineIm(k.termine, tag, tag, { mitarbeiterId: m.id });
            return (
              <Karte
                key={m.id}
                kompakt
                titel={
                  <span className="pt-karte-person">
                    <Personenbild m={m} groesse={40} />
                    {personName(m)}
                  </span>
                }
                aktion={a.status === 'da' ? <Status ton="erfolg">Da</Status> : <Status ton={a.status === 'abwesend' ? 'achtung' : 'neutral'}>{a.text}</Status>}
              >
                <Stapel abstand={8}>
                  {ab && <AbwesenheitBalken a={ab} m={m} start ende />}
                  {liste.map((t) => kachel(t, m))}
                  {!liste.length && <Meta>{a.status === 'da' ? 'Noch nichts geplant.' : 'Nicht verplanen.'}</Meta>}
                  {einplanenKnopf(m, tag)}
                </Stapel>
              </Karte>
            );
          })}
        </Stapel>
      ) : (
        <Stapel abstand={12}>
          {werkzeugleiste}
          {sortieren && (
            <Meldung
              ton="neutral"
              titel="Reihenfolge ändern"
              aktion={
                eigeneReihe ? (
                  <Button variante="tertiaer" klein onClick={reiheZuruecksetzen}>
                    Standard wiederherstellen
                  </Button>
                ) : undefined
              }
            >
              Mit den Pfeilen nach oben oder unten schieben – oder einen Namen auf einen anderen ziehen. Die Reihenfolge gilt für dein ganzes Team.
            </Meldung>
          )}
          <div className="pt-rahmen">
            <div
              className={`pt-tafel ${ansicht === 'monat' ? 'pt-tafel--monat' : ''}`}
              style={{
                gridTemplateColumns:
                  ansicht === 'monat' ? `minmax(196px, 216px) repeat(${sichtbareTage.length}, minmax(32px, 1fr))` : `minmax(220px, 248px) repeat(${sichtbareTage.length}, minmax(140px, 1fr))`,
              }}
              role="grid"
              aria-label={`Plantafel ${zeitraumText}`}
            >
              <div className="pt-kopf pt-kopf--team" role="columnheader">
                Team <span className="pt-kopf-anzahl">{mitarbeiter.length}</span>
              </div>
              {sichtbareTage.map(kopfZelle)}
              {mitarbeiter.map((m, i) => (
                <div key={m.id} className="pt-reihe" role="row">
                  {nameZelle(m, i)}
                  {sichtbareTage.map((d, j) => tagesZelle(m, d, j))}
                </div>
              ))}
            </div>
          </div>
          {legende}
          {darfPlanen && <Meta>Tipp: Termine kannst du mit der Maus auf einen anderen Mitarbeiter oder Tag ziehen. In der Monatsansicht öffnet ein Tipp auf den Tag die Woche.</Meta>}
        </Stapel>
      )}

      <TerminFormular
        offen={!!vorgabe}
        onSchliessen={() => setVorgabe(undefined)}
        vorgabe={vorgabe}
        titel={auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}
        onGespeichert={() => {
          const r = auftrag ? restStunden(auftrag, db.termine.all()) : undefined;
          if (auftrag && (r == null || r <= 0)) setze({ auftrag: undefined });
        }}
      />
    </Seite>
  );
}
