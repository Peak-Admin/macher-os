/**
 * Plantafel: oben was noch einzuplanen ist und die Projekte, darunter das Team – jeweils als durchgehende Balken über die Tage.
 * Probleme zuerst (Konflikte, ohne Termin, überlastet). Offene Aufträge auf Person und Tag ziehen oder antippen.
 * Überfahren zeigt eine Infokarte, Klick öffnet die Seite. Spaltenbreiten lassen sich ziehen.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart, zahl } from '@core/format';
import type { Abwesenheit, Auftrag, Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Icon, IconButton, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, useToast } from '@ui/index';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import { terminAmTag, termineIm, TERMINSTATUS, verschoben as zeitVerschoben } from '../kalender/daten';
import { useSchmal } from '../kalender/hooks';
import { abwesenheitAm, anwesenheit, arbeitstagIm, geplanteStunden, kontextAusDb, restStunden, terminKonflikte, verfuegbareStunden, type Grund } from '../verfuegbarkeit/daten';
import { offenEinzuplanen } from '../offen/daten';
import { ART_LABEL } from '../abwesenheiten/daten';
import { auftragPfad } from '../auftraege/daten';
import { Personenbild } from '../mitarbeiter/profilbild';
import { darfTeamDaten } from '../mitarbeiter/team';
import { aufZelleVerschieben, vorbelegung } from './daten';
import { geordnet, gespeicherteReihe, planReihen, reiheSpeichern, reiheZuruecksetzen, verschoben } from './reihenfolge';
import { AussehenDialog, ProjektMarke, projektAussehen, projektFarbe } from './aussehen';
import { useInfokarte } from './infokarte';
import { MitMacherVorbereiten } from '@modules/macher-fragen/MitMacher';
import { laeufe, spuren, zusammenfassen, ZOOM, ZOOM_STANDARD, type Spanne } from './zeitleiste';
import '../kalender/plan.css';
import './plantafel.css';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;
const abwesenheitPfad = (id: string) => `/betrieb/abwesenheiten/${id}`;
const wtagIndex = (d: Datum) => (new Date(`${d}T12:00:00`).getDay() + 6) % 7;
const wtag = (d: Datum) => WOCHENTAGE[wtagIndex(d)];
const monatsTitel = (d: Datum) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });
const aktiveTermine = (liste: Termin[]) => liste.filter((t) => t.status !== 'abgesagt');
const zeitText = (t: Termin) => (t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`);
const tagDesTermins = (t: Termin) => new Date(t.start).toLocaleDateString('sv-SE');

const NAME_SPEICHER = 'macher-os:plantafel:namensspalte';
const NAME_MIN = 168;
const NAME_MAX = 440;
const leseZahl = (schluessel: string) => {
  try {
    const v = Number(globalThis.localStorage?.getItem(schluessel));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  } catch {
    return undefined;
  }
};
const schreibeZahl = (schluessel: string, wert: number) => {
  try {
    globalThis.localStorage?.setItem(schluessel, String(Math.round(wert)));
  } catch {
    /* privates Fenster o. Ä. – dann eben nur für diese Sitzung */
  }
};

function abwesenheitText(a: Abwesenheit, m: Mitarbeiter) {
  const art = darfTeamDaten(m.id) ? ART_LABEL[a.art] : 'Abwesend';
  return `${art}${a.halbtags ? ' (halber Tag)' : ''}${a.status === 'beantragt' ? ' · beantragt' : ''}`;
}

/** Terminkarte fürs Handy: Zeit, Titel, Kunde und die Gesichter aller Eingeplanten */
function TerminKarte({ t, gruende }: { t: Termin; gruende?: Grund[] }) {
  const ma = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
  const kunde = db.kunden.get(t.kundeId);
  const blockiert = gruende?.filter((g) => g.blockiert) ?? [];
  const st = TERMINSTATUS[t.status];
  return (
    <Link
      to={terminPfad(t.id)}
      className={`pl-balken ${t.status === 'abgesagt' ? 'pl-balken--abgesagt' : ''} ${blockiert.length ? 'pl-balken--konflikt' : ''}`}
      style={{
        background: t.auftragId ? projektFarbe(t.auftragId) : undefined,
      }}
    >
      <span className="pl-balken-zeit">{t.ganztags ? 'Ganzer Tag' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}</span>
      <strong className="pt-karte-titel">
        {t.auftragId && <ProjektMarke auftragId={t.auftragId} groesse={20} />}
        {t.titel}
      </strong>
      {kunde && <span className="pl-balken-meta">{kunde.name}</span>}
      <span className="pl-balken-fuss">
        <span className="pl-gesichter" aria-label={`Eingeplant: ${ma.map((x) => personName(x)).join(', ')}`}>
          {ma.slice(0, 4).map((x) => (
            <Personenbild key={x.id} m={x} groesse={24} />
          ))}
        </span>
        {t.status !== 'geplant' && <Status ton={st.ton}>{st.label}</Status>}
      </span>
      {blockiert.length > 0 && (
        <span className="pl-balken-konflikt">
          <Status ton="achtung">Konflikt</Status> {blockiert.map((g) => g.text).join(', ')}
        </span>
      )}
    </Link>
  );
}

/** Ein Balken in der Zeitleiste, platziert über Spalte (Tage) und Zeile (Spur). Offene Enden laufen über den Rand hinaus. */
function Balken({
  spanne,
  spur,
  offen,
  children,
  to,
  label,
  klasse,
  stil,
  ziehen,
  extra,
}: {
  spanne: Spanne;
  spur: number;
  offen?: { links?: boolean; rechts?: boolean };
  children: ReactNode;
  to?: string;
  label: string;
  klasse?: string;
  stil?: CSSProperties;
  ziehen?: (e: DragEvent) => void;
  extra?: HTMLAttributes<HTMLElement>;
}) {
  const style: CSSProperties = {
    gridColumn: `${spanne.von + 1} / ${spanne.bis + 2}`,
    gridRow: spur + 1,
    ...stil,
  };
  const cls = `pt2-balken ${offen?.links ? 'pt2-balken--links-offen' : ''} ${offen?.rechts ? 'pt2-balken--rechts-offen' : ''} ${klasse ?? ''}`;
  return to ? (
    <Link
      to={to}
      className={cls}
      style={style}
      aria-label={label}
      draggable={!!ziehen}
      {...extra}
      onDragStart={(e) => {
        extra?.onDragStart?.(e);
        ziehen?.(e);
      }}
    >
      {children}
    </Link>
  ) : (
    <span className={cls} style={style} aria-label={label} tabIndex={0} {...extra}>
      {children}
    </span>
  );
}

/** Griff zum Ziehen einer Spaltenbreite (Maus/Touch ziehen, Tastatur ← →) */
function BreitenGriff({
  label,
  wert,
  min,
  max,
  onWert,
  faktor = 1,
  schritt = 16,
  tab = true,
}: {
  label: string;
  wert: number;
  min: number;
  max: number;
  onWert: (v: number) => void;
  faktor?: number;
  schritt?: number;
  tab?: boolean;
}) {
  const start = useRef<{ x: number; w: number }>(undefined);
  const setze = (v: number) => onWert(Math.max(min, Math.min(max, v)));
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(wert)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={tab ? 0 : -1}
      className="pt2-griff"
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, w: wert };
      }}
      onPointerMove={(e) => start.current && setze(start.current.w + (e.clientX - start.current.x) / faktor)}
      onPointerUp={() => (start.current = undefined)}
      onPointerCancel={() => (start.current = undefined)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        setze(wert + (e.key === 'ArrowLeft' ? -schritt : schritt));
      }}
    />
  );
}

/** Konflikt: Schild mit Text, schmal nur „!“ (Text für Screenreader steht im Label des Balkens) */
function KonfliktMarke({ breit }: { breit: boolean }) {
  return breit ? (
    <span className="pt2-konflikt">
      <Icon name="achtung" size={12} /> Konflikt
    </span>
  ) : (
    <span className="pt2-konflikt pt2-konflikt--rund" aria-hidden>
      !
    </span>
  );
}

export function Plantafel() {
  useDatenstand();
  planReihen.use();
  projektAussehen.use();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const schmal = useSchmal();
  const toast = useToast();
  const darfPlanen = useDarf('planen');
  const auftragId = sp.get('auftrag') ?? '';
  const auftrag = db.auftraege.get(auftragId || undefined);
  const zoomStufe = Math.max(0, Math.min(ZOOM.length - 1, Number(sp.get('zoom') ?? ZOOM_STANDARD) || ZOOM_STANDARD));
  const zoom = ZOOM[zoomStufe];
  const ab = wochenStart(sp.get('ab') ?? sp.get('woche') ?? heute());
  const tag = sp.get('tag') ?? heute();
  const [sortieren, setSortieren] = useState(false);
  const [zu, setZu] = useState<{
    offen?: boolean;
    projekte?: boolean;
    team?: boolean;
  }>({});
  const [alleOffenen, setAlleOffenen] = useState(false);
  const [aussehenId, setAussehenId] = useState<ID>();
  const [vorgabe, setVorgabe] = useState<TerminVorgabe>();
  const [zug, setZug] = useState<{
    terminId?: ID;
    vonMa?: ID;
    auftragId?: ID;
  }>();
  const [ziel, setZiel] = useState<string>();
  const [reiheZug, setReiheZug] = useState<ID>();
  const [reiheZiel, setReiheZiel] = useState<ID>();
  const [nameBreite, setNameBreite] = useState(() => leseZahl(NAME_SPEICHER) ?? 240);
  const [eigeneBreite, setEigeneBreite] = useState<number>();
  const [markiert, setMarkiert] = useState<string>();
  const info = useInfokarte();
  const rahmen = useRef<HTMLDivElement>(null);
  const tagBreite = eigeneBreite ?? zoom.breite;

  useEffect(() => schreibeZahl(NAME_SPEICHER, nameBreite), [nameBreite]);
  useEffect(() => {
    if (!markiert) return;
    const t = window.setTimeout(() => setMarkiert(undefined), 1800);
    return () => window.clearTimeout(t);
  }, [markiert]);

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

  const von = ab;
  const bis = plusTage(ab, zoom.tage - 1);
  const sichtbareTage = tage(von, bis);
  const n = sichtbareTage.length;
  const termineZeitraum = aktiveTermine(termineIm(k.termine, von, bis));
  const freiListe = sichtbareTage.map((d) => !arbeitstagIm(k, d));
  const frei = (i: number) => freiListe[i];
  const spalten = freiListe.map((f) => (f ? 'minmax(calc(var(--pt2-breite) * 0.55), 0.55fr)' : 'minmax(var(--pt2-breite), 1fr)')).join(' ');
  const tafelBreite = nameBreite + freiListe.reduce((s, f) => s + (f ? tagBreite * 0.55 : tagBreite), 0);

  /** Tage (Index) eines Termins im sichtbaren Zeitraum; offen = läuft über den Rand hinaus */
  const spanneVon = (t: Termin): Spanne | undefined => {
    const idx = sichtbareTage.map((d, i) => (terminAmTag(t, d) ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return undefined;
    const vorher = terminAmTag(t, plusTage(von, -1));
    const nachher = terminAmTag(t, plusTage(bis, 1));
    return {
      von: vorher ? -1 : idx[0],
      bis: nachher ? n : idx[idx.length - 1],
    };
  };
  const sichtbar = (s: Spanne): Spanne => ({
    von: Math.max(0, s.von),
    bis: Math.min(n - 1, s.bis),
  });
  const pixel = (s: Spanne) => {
    let p = 0;
    for (let i = Math.max(0, s.von); i <= Math.min(n - 1, s.bis); i++) p += frei(i) ? tagBreite * 0.55 : tagBreite;
    return p;
  };

  const konflikte = useMemo(() => {
    const m = new Map<ID, Map<ID, Grund[]>>();
    for (const t of termineZeitraum) m.set(t.id, new Map(terminKonflikte(t, k).map((x) => [x.mitarbeiterId, x.gruende])));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termineZeitraum.map((t) => t.id + t.geaendertAm).join(), k.abwesenheiten.length]);
  const blockiert = (t: Termin, maId: ID) =>
    konflikte
      .get(t.id)
      ?.get(maId)
      ?.filter((g) => g.blockiert) ?? [];

  // ---------------------------------------------------------------- Noch einzuplanen
  const offen = offenEinzuplanen(db.auftraege.all(), k.termine);
  const rest = auftrag ? restStunden(auftrag, k.termine) : undefined;

  const zelleOeffnen = (m: Mitarbeiter, d: Datum, fuer: Auftrag | undefined = auftrag) => {
    const v = vorbelegung(fuer, m.id, d, k);
    setVorgabe({
      auftragId: fuer?.id,
      mitarbeiterIds: [m.id],
      datum: d,
      von: v.von,
      bis: v.bis,
    });
  };

  // ---------------------------------------------------------------- Reihenfolge
  const ids = mitarbeiter.map((m) => m.id);
  const ordne = (id: ID, nach: number) => {
    const neu = verschoben(ids, id, nach);
    if (neu.join() !== ids.join()) reiheSpeichern(neu);
  };

  // ---------------------------------------------------------------- Termine ändern (mit Rückgängig)
  const aendern = (t: Termin, neu: Partial<Termin>, text: string) => {
    const alt = Object.fromEntries(Object.keys(neu).map((x) => [x, t[x as keyof Termin]])) as Partial<Termin>;
    db.termine.update(t.id, neu, { text });
    info.schliessen();
    toast(text, {
      aktion: {
        label: 'Rückgängig',
        onClick: () => db.termine.update(t.id, alt, { text: 'Rückgängig gemacht' }),
      },
    });
  };
  const naechsterArbeitstag = (d: Datum, richtung = 1) => {
    let x = plusTage(d, richtung);
    for (let i = 0; i < 14 && !arbeitstagIm(k, x); i++) x = plusTage(x, richtung);
    return x;
  };
  const duplizieren = (t: Termin) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, erstelltAm, geaendertAm, geloeschtAm, erstelltVon, beispiel, ...daten } = t;
    const tagNeu = naechsterArbeitstag(tagDesTermins(t));
    const neu = db.termine.create({
      ...daten,
      ...zeitVerschoben(t, tagNeu),
      status: 'geplant',
      selbstGebucht: false,
    });
    info.schliessen();
    toast(`Dupliziert auf ${datumKurz(tagNeu)}`, {
      aktion: { label: 'Rückgängig', onClick: () => db.termine.remove(neu.id) },
    });
  };

  const fallenLassen = (m: Mitarbeiter, d: Datum) => (e: DragEvent) => {
    e.preventDefault();
    setZiel(undefined);
    const neuerAuftrag = e.dataTransfer.getData('text/x-auftrag') || zug?.auftragId;
    const terminId = e.dataTransfer.getData('text/x-termin') || zug?.terminId;
    const vonMa = e.dataTransfer.getData('text/x-mitarbeiter') || zug?.vonMa;
    setZug(undefined);
    if (neuerAuftrag) {
      const a = db.auftraege.get(neuerAuftrag);
      if (!a) return;
      if (d < heute())
        return toast('Vergangene Tage kannst du nicht mehr einplanen.', {
          ton: 'achtung',
        });
      return zelleOeffnen(m, d, a);
    }
    const t = db.termine.get(terminId);
    if (!t || !vonMa) return;
    const neu = aufZelleVerschieben(t, vonMa, m.id, d);
    if (neu.start === t.start && neu.mitarbeiterIds.join() === t.mitarbeiterIds.join()) return;
    const alt = {
      start: t.start,
      ende: t.ende,
      mitarbeiterIds: t.mitarbeiterIds,
    };
    db.termine.update(t.id, neu, {
      text: `Umgeplant: ${personName(m)}, ${datumKurz(neu.start)}`,
    });
    const konflikt = terminKonflikte({ ...t, ...neu }, kontextAusDb()).find((x) => x.mitarbeiterId === m.id);
    toast(konflikt ? `Umgeplant – Achtung: ${konflikt.gruende[0].text}.` : `Umgeplant auf ${personName(m)}, ${datumKurz(neu.start)}`, {
      ton: konflikt ? 'achtung' : 'erfolg',
      aktion: {
        label: 'Rückgängig',
        onClick: () =>
          db.termine.update(t.id, alt, {
            text: 'Umplanung rückgängig gemacht',
          }),
      },
    });
  };

  // ---------------------------------------------------------------- Projekte (Zeilen)
  const projekte = (() => {
    const nachAuftrag = new Map<ID, Termin[]>();
    for (const t of termineZeitraum) if (t.auftragId && db.auftraege.get(t.auftragId)) nachAuftrag.set(t.auftragId, [...(nachAuftrag.get(t.auftragId) ?? []), t]);
    const zeilen = [...nachAuftrag.entries()].map(([id, liste]) => {
      const teile = liste.map((t) => ({ ...spanneVon(t)!, schluessel: id, t })).filter((x) => x.von != null);
      return {
        auftrag: db.auftraege.get(id)!,
        segmente: zusammenfassen(teile, frei),
      };
    });
    zeilen.sort((a, b) => Math.min(...a.segmente.map((s) => s.von)) - Math.min(...b.segmente.map((s) => s.von)) || a.auftrag.nummer.localeCompare(b.auftrag.nummer));
    return zeilen;
  })();

  // ---------------------------------------------------------------- Probleme zuerst
  const konfliktPaare = termineZeitraum.flatMap((t) => t.mitarbeiterIds.filter((mid) => blockiert(t, mid).length).map((mid) => ({ t, mid })));
  const ueberlastet = mitarbeiter.filter((m) => geplanteStunden(m.id, von, bis, k) > verfuegbareStunden(m.id, von, bis, k));
  const hinspringen = (selektor: string, schluessel?: string) => {
    window.setTimeout(() => {
      const el = rahmen.current?.querySelector<HTMLElement>(selektor);
      if (!el) return;
      el.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      el.focus({ preventScroll: true });
      if (schluessel) setMarkiert(schluessel);
    }, 0);
  };

  const schritt = Math.max(7, Math.round(zoom.tage / 4 / 7) * 7);

  // ---------------------------------------------------------------- Infokarten
  const leuteListe = (idsListe: ID[]) => {
    const leute = [...new Set(idsListe)].map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
    return leute.length ? (
      <div className="pt2-info-leute">
        {leute.map((m) => (
          <span key={m.id} className="pt2-info-person">
            <Personenbild m={m} groesse={24} />
            {personName(m)}
          </span>
        ))}
      </div>
    ) : (
      <p className="pt2-info-meta">Noch niemand eingeplant</p>
    );
  };

  const terminInfo = (t: Termin, m?: Mitarbeiter) => {
    const kunde = db.kunden.get(t.kundeId);
    const ort = db.orte.get(t.ortId);
    const a = db.auftraege.get(t.auftragId);
    const gruende = m ? blockiert(t, m.id) : [];
    const st = TERMINSTATUS[t.status];
    const darf = darfPlanen && t.status !== 'erledigt';
    return (
      <>
        <div className="pt2-info-kopf">
          {a && <ProjektMarke auftragId={a.id} groesse={28} />}
          <div>
            <strong>{t.titel}</strong>
            {a && a.titel !== t.titel && <p className="pt2-info-meta">{a.titel}</p>}
          </div>
        </div>
        <dl className="pt2-info-liste">
          <dt>Wann</dt>
          <dd>
            {datumKurz(t.start)}, {zeitText(t)}
          </dd>
          {kunde && (
            <>
              <dt>Kunde</dt>
              <dd>{kunde.name}</dd>
            </>
          )}
          {ort && (
            <>
              <dt>Wo</dt>
              <dd>{[ort.adresse.strasse, `${ort.adresse.plz} ${ort.adresse.ort}`.trim()].filter(Boolean).join(', ')}</dd>
            </>
          )}
          <dt>Status</dt>
          <dd>
            <Status ton={st.ton}>{st.label}</Status>
          </dd>
        </dl>
        {leuteListe(t.mitarbeiterIds)}
        {gruende.length > 0 && (
          <p className="pt2-info-konflikt">
            <Icon name="achtung" size={16} /> Konflikt: {[...new Set(gruende.map((g) => g.text))].join(', ')}
          </p>
        )}
        {t.notiz && <p className="pt2-info-meta">{t.notiz}</p>}
        {darf && (
          <div className="pt2-info-aktionen">
            <Button klein variante="tertiaer" onClick={() => aendern(t, zeitVerschoben(t, naechsterArbeitstag(tagDesTermins(t), -1)), `${t.titel}: einen Arbeitstag früher`)}>
              Früher
            </Button>
            <Button klein variante="tertiaer" onClick={() => aendern(t, zeitVerschoben(t, naechsterArbeitstag(tagDesTermins(t))), `${t.titel}: einen Arbeitstag später`)}>
              Später
            </Button>
            <Button klein variante="tertiaer" onClick={() => duplizieren(t)}>
              Duplizieren
            </Button>
            <Button klein variante="tertiaer" onClick={() => aendern(t, { status: 'abgesagt' }, `${t.titel} abgesagt`)}>
              Absagen
            </Button>
          </div>
        )}
        <p className="pt2-info-hinweis">Klick öffnet den Termin.</p>
      </>
    );
  };

  const mehrereInfo = (titel: string, a: Auftrag | undefined, liste: Termin[], m: Mitarbeiter) => (
    <>
      <div className="pt2-info-kopf">
        {a && <ProjektMarke auftragId={a.id} groesse={28} />}
        <div>
          <strong>{titel}</strong>
          <p className="pt2-info-meta">
            {liste.length} Termine · {personName(m)}
          </p>
        </div>
      </div>
      <ul className="pt2-info-termine">
        {liste
          .slice()
          .sort((x, y) => x.start.localeCompare(y.start))
          .map((t) => (
            <li key={t.id}>
              <span>{datumKurz(t.start)}</span>
              <span>{zeitText(t)}</span>
              {blockiert(t, m.id).length > 0 && <Status ton="achtung">Konflikt</Status>}
            </li>
          ))}
      </ul>
      <p className="pt2-info-hinweis">Klick öffnet den Auftrag.</p>
    </>
  );

  const projektInfo = (a: Auftrag, liste: Termin[], hinweis = 'Klick öffnet den Auftrag.') => {
    const kunde = db.kunden.get(a.kundeId);
    const r = restStunden(a, k.termine);
    const sortiert = liste.slice().sort((x, y) => x.start.localeCompare(y.start));
    return (
      <>
        <div className="pt2-info-kopf">
          <ProjektMarke auftragId={a.id} groesse={28} />
          <div>
            <strong>{a.titel}</strong>
            <p className="pt2-info-meta">
              {a.nummer}
              {kunde ? ` · ${kunde.name}` : ''}
            </p>
          </div>
        </div>
        <dl className="pt2-info-liste">
          {sortiert.length > 0 && (
            <>
              <dt>Zeitraum</dt>
              <dd>
                {datumKurz(sortiert[0].start)} – {datumKurz(sortiert[sortiert.length - 1].ende)}
              </dd>
              <dt>Termine</dt>
              <dd>{sortiert.length}</dd>
            </>
          )}
          {a.wunschtermin?.trim() && (
            <>
              <dt>Wunsch</dt>
              <dd>{a.wunschtermin}</dd>
            </>
          )}
          {r != null && (
            <>
              <dt>Offen</dt>
              <dd>{r > 0 ? `${zahl(r)} h einzuplanen` : 'Stunden verplant'}</dd>
            </>
          )}
        </dl>
        {sortiert.length > 0 && leuteListe(sortiert.flatMap((t) => t.mitarbeiterIds))}
        <p className="pt2-info-hinweis">{hinweis}</p>
      </>
    );
  };

  // ---------------------------------------------------------------- Bausteine der Tafel
  const tagKlasse = (d: Datum, i: number) => `${frei(i) ? `pt2-tag--frei ${!frei(i - 1) ? 'pt2-frei-start' : ''} ${!frei(i + 1) ? 'pt2-frei-ende' : ''}` : ''} ${d === heute() ? 'pt2-tag--heute' : ''} ${wtagIndex(d) === 0 && i > 0 ? 'pt2-tag--woche' : ''}`;

  const datumKurzOhneTag = (d: Datum) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
  const navigation = (
    <div className="pt2-navi">
      <div className="pt2-navi-zeile">
        <IconButton icon="pfeilLinks" label="Früher" className="pt2-navi-pfeil" onClick={() => setze({ ab: plusTage(ab, -schritt), woche: undefined })} />
        <span className="pt2-navi-datum" aria-live="polite">
          {datumKurzOhneTag(von)} – {datumKurzOhneTag(bis)}
        </span>
        <IconButton icon="pfeilRechts" label="Später" className="pt2-navi-pfeil" onClick={() => setze({ ab: plusTage(ab, schritt), woche: undefined })} />
      </div>
      <button type="button" className="pt2-heute" onClick={() => setze({ ab: undefined, woche: undefined })}>
        Heute
      </button>
    </div>
  );

  const kopf = (
    <div className="pt2-zeile pt2-zeile--kopf">
      <div className="pt2-name pt2-name--kopf">
        {navigation}
        <BreitenGriff label="Breite der Namensspalte" wert={nameBreite} min={NAME_MIN} max={NAME_MAX} onWert={setNameBreite} />
      </div>
      <div className="pt2-spur pt2-spur--kopf" style={{ gridTemplateRows: 'auto auto auto' }}>
        {laeufe(sichtbareTage, (d) => d.slice(0, 7)).map((l) => (
          <div key={l.schluessel} className="pt2-monat" style={{ gridColumn: `${l.von + 1} / ${l.bis + 2}`, gridRow: 1 }}>
            <span>{monatsTitel(sichtbareTage[l.von])}</span>
          </div>
        ))}
        {laeufe(sichtbareTage, (d) => `KW ${kalenderwoche(d)}`).map((l) => (
          <div key={`${l.schluessel}-${l.von}`} className="pt2-kw" style={{ gridColumn: `${l.von + 1} / ${l.bis + 2}`, gridRow: 2 }}>
            {pixel(l) >= 56 ? l.schluessel : ''}
          </div>
        ))}
        {sichtbareTage.map((d, i) => (
          <div key={d} className={`pt2-tagkopf ${tagKlasse(d, i)}`} style={{ gridColumn: i + 1, gridRow: 3 }} role="columnheader" aria-label={datumKurz(d)}>
            <span className="pt2-tagkopf-wtag">{tagBreite * (frei(i) ? 0.55 : 1) >= 26 ? wtag(d) : wtag(d)[0]}</span>
            <span className="pt2-tagkopf-zahl">{Number(d.slice(8, 10))}</span>
            <BreitenGriff label="Tagesbreite" wert={tagBreite} min={14} max={260} schritt={8} faktor={i + 1} tab={i === 0} onWert={setEigeneBreite} />
          </div>
        ))}
      </div>
    </div>
  );

  const hintergrund = (inhalt?: (d: Datum, i: number) => ReactNode, extra?: (d: Datum, i: number) => HTMLAttributes<HTMLDivElement>) =>
    sichtbareTage.map((d, i) => {
      const x = extra?.(d, i) ?? {};
      return (
        <div key={d} {...x} className={`pt2-tag ${tagKlasse(d, i)} ${x.className ?? ''}`} style={{ gridColumn: i + 1, gridRow: '1 / -1' }}>
          {inhalt?.(d, i)}
        </div>
      );
    });

  const abschnitt = (schluessel: 'offen' | 'projekte' | 'team', titel: string, anzahl: number, aktion?: ReactNode) => (
    <div className="pt2-zeile pt2-zeile--abschnitt" data-abschnitt={schluessel}>
      <div className="pt2-name pt2-name--abschnitt">
        <button type="button" className="pt2-auf" aria-expanded={!zu[schluessel]} onClick={() => setZu({ ...zu, [schluessel]: !zu[schluessel] })}>
          <Icon name={zu[schluessel] ? 'weiter' : 'runter'} size={16} />
          <span>{titel}</span>
          <span className="pt-kopf-anzahl">{anzahl}</span>
        </button>
        {aktion}
      </div>
      <div className="pt2-spur pt2-spur--abschnitt" />
    </div>
  );

  const offenChips = () => {
    const liste = alleOffenen ? offen : offen.slice(0, 12);
    return (
      <div className="pt2-offen">
        {liste.map((e) => {
          const a = e.auftrag;
          const kunde = db.kunden.get(a.kundeId);
          const r = restStunden(a, k.termine);
          const gewaehlt = a.id === auftragId;
          return (
            <button
              key={a.id}
              type="button"
              className={`pt2-chip ${gewaehlt ? 'pt2-chip--gewaehlt' : ''}`}
              style={{ ['--balken' as string]: projektFarbe(a.id) }}
              aria-pressed={gewaehlt}
              disabled={!darfPlanen}
              draggable={darfPlanen}
              {...info.ausloeser(`offen-${a.id}`, () => projektInfo(a, [], darfPlanen ? 'Ziehen oder antippen zum Einplanen.' : ''))}
              onDragStart={(ev) => {
                ev.dataTransfer.setData('text/x-auftrag', a.id);
                ev.dataTransfer.effectAllowed = 'copy';
                setZug({ auftragId: a.id });
                info.schliessen();
              }}
              onDragEnd={() => (setZug(undefined), setZiel(undefined))}
              onClick={() => setze({ auftrag: gewaehlt ? undefined : a.id })}
            >
              <ProjektMarke auftragId={a.id} groesse={20} />
              <span className="pt2-chip-text">
                <span className="pt2-chip-titel">{a.titel}</span>
                <span className="pt2-chip-meta">{[e.grund === 'besichtigung' ? 'Besichtigung' : null, kunde?.name, r != null && r > 0 ? `${zahl(r)} h` : null].filter(Boolean).join(' · ')}</span>
              </span>
              {a.dringend && <span className="pt2-chip-dringend">Dringend</span>}
            </button>
          );
        })}
        {offen.length > 12 && (
          <button type="button" className="pt2-mehr-knopf" onClick={() => setAlleOffenen(!alleOffenen)}>
            {alleOffenen ? 'Weniger zeigen' : `${offen.length - 12} weitere`}
          </button>
        )}
      </div>
    );
  };

  const offenZeile = () => (
    <div className="pt2-zeile pt2-zeile--offen">
      <div className="pt2-name pt2-name--hinweis">{darfPlanen ? 'Auf Person und Tag ziehen – oder antippen und dann „+“' : 'Diese Aufträge haben noch keinen Termin'}</div>
      {offenChips()}
    </div>
  );

  const projektZeile = (z: (typeof projekte)[number]) => {
    const a = z.auftrag;
    const farbe = projektFarbe(a.id);
    const verteilt = spuren(z.segmente);
    const anzahl = Math.max(1, ...verteilt.map((v) => v.spur + 1));
    const alleTermine = z.segmente.flatMap((s) => s.teile.map((x) => x.t));
    return (
      <div key={a.id} className="pt2-zeile" role="row">
        <div className="pt2-name" role="rowheader">
          <button
            type="button"
            className="pt2-projekt"
            style={{ ['--balken' as string]: farbe }}
            onClick={() => setAussehenId(a.id)}
            {...info.ausloeser(`pk-${a.id}`, () => projektInfo(a, alleTermine, 'Klick: Aussehen ändern und einplanen.'))}
          >
            <ProjektMarke auftragId={a.id} groesse={20} />
            <span className="pt2-projekt-titel">{a.titel}</span>
          </button>
        </div>
        <div className="pt2-spur" style={{ gridTemplateRows: `repeat(${anzahl}, var(--pt2-reihe))` }}>
          {hintergrund()}
          {verteilt.map(({ eintrag: s, spur }, i) => {
            const liste = s.teile.map((x) => x.t);
            const leute = [...new Set(liste.flatMap((t) => t.mitarbeiterIds))].map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
            const konflikt = liste.some((t) => t.mitarbeiterIds.some((mid) => blockiert(t, mid).length));
            const sv = sichtbar(s);
            const breite = pixel(sv);
            return (
              <Balken
                key={i}
                spanne={sv}
                spur={spur}
                offen={{ links: s.von < 0, rechts: s.bis >= n }}
                to={auftragPfad(a.id)}
                label={`${a.titel}, ${datumKurz(sichtbareTage[sv.von])} bis ${datumKurz(sichtbareTage[sv.bis])}${konflikt ? ', Konflikt' : ''}`}
                klasse={konflikt ? 'pt2-balken--konflikt' : ''}
                stil={{ ['--balken' as string]: farbe }}
                extra={info.ausloeser(`p-${a.id}-${i}`, () => projektInfo(a, liste))}
              >
                {breite >= 64 && leute.length > 0 && (
                  <span className="pt2-balken-leute">
                    {leute.slice(0, breite >= 160 ? 3 : 1).map((m) => (
                      <Personenbild key={m.id} m={m} groesse={18} />
                    ))}
                  </span>
                )}
                <span className="pt2-balken-text">{a.titel}</span>
                {konflikt && <KonfliktMarke breit={breite >= 160} />}
              </Balken>
            );
          })}
        </div>
      </div>
    );
  };

  const mitarbeiterZeile = (m: Mitarbeiter, i: number) => {
    const eigene = termineZeitraum.filter((t) => t.mitarbeiterIds.includes(m.id));
    const teile = eigene.map((t) => ({ ...spanneVon(t)!, schluessel: t.auftragId, t })).filter((x) => x.von != null);
    const segmente = zusammenfassen(teile, frei);
    const abw = new Map<ID, { a: Abwesenheit; von: number; bis: number }>();
    sichtbareTage.forEach((d, j) => {
      const a = abwesenheitAm(m.id, d, k);
      if (!a) return;
      const e = abw.get(a.id);
      if (e) e.bis = j;
      else abw.set(a.id, { a, von: j, bis: j });
    });
    type Eintrag = (Spanne & { art: 'termin'; s: (typeof segmente)[number] }) | (Spanne & { art: 'abw'; a: Abwesenheit });
    const alle: Eintrag[] = [
      ...[...abw.values()].map((x) => ({
        von: x.von,
        bis: x.bis,
        art: 'abw' as const,
        a: x.a,
      })),
      ...segmente.map((s) => ({
        von: Math.max(0, s.von),
        bis: Math.min(n - 1, s.bis),
        art: 'termin' as const,
        s,
      })),
    ];
    const verteilt = spuren(alle);
    const anzahl = Math.max(1, ...verteilt.map((v) => v.spur + 1));
    const istUeberlastet = ueberlastet.includes(m);
    const tagesLast = (d: Datum) => {
      const verf = verfuegbareStunden(m.id, d, d, k);
      if (verf <= 0) return undefined;
      return geplanteStunden(m.id, d, d, k) / verf;
    };

    return (
      <div key={m.id} className={`pt2-zeile ${markiert === `m-${m.id}` ? 'pt2-zeile--markiert' : ''}`} role="row" data-person={m.id}>
        <div
          className={`pt2-name pt2-name--person ${reiheZiel === m.id && reiheZug !== m.id ? 'pt-name--ziel' : ''} ${reiheZug === m.id ? 'pt-name--zieht' : ''} ${darfOrdnen ? 'pt-name--ziehbar' : ''}`}
          role="rowheader"
          tabIndex={-1}
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
            if (reiheZiel !== m.id) setReiheZiel(m.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/x-reihe') || reiheZug;
            setReiheZug(undefined);
            setReiheZiel(undefined);
            if (id && id !== m.id) ordne(id, ids.indexOf(m.id));
          }}
        >
          <Personenbild m={m} groesse={28} />
          <span className="pt2-person">
            <Link to={`/betrieb/mitarbeiter/${m.id}`} className="pt-name-link" draggable={false}>
              {personName(m)}
            </Link>
            {istUeberlastet && <span className="pt2-ueberlastet">Überlastet</span>}
          </span>
          {sortieren && (
            <span className="pt-ordnen">
              <IconButton icon="hoch" label={`${personName(m)} nach oben`} disabled={i === 0} onClick={() => ordne(m.id, i - 1)} />
              <IconButton icon="runter" label={`${personName(m)} nach unten`} disabled={i === mitarbeiter.length - 1} onClick={() => ordne(m.id, i + 1)} />
            </span>
          )}
        </div>
        <div
          className="pt2-spur"
          style={{
            gridTemplateRows: `repeat(${anzahl}, var(--pt2-reihe))${darfPlanen ? ' 8px' : ''}`,
          }}
        >
          {hintergrund(
            (d, j) => {
              const last = frei(j) ? undefined : tagesLast(d);
              return (
                <>
                  {last != null && last > 0 && <span className={`pt2-last ${last > 1 ? 'pt2-last--ueber' : ''}`} style={{ ['--last' as string]: Math.min(1, last) }} aria-hidden />}
                  {darfPlanen && d >= heute() && (
                    <button
                      type="button"
                      className={`pt2-plus ${auftrag ? 'pt2-plus--immer' : ''}`}
                      onClick={() => zelleOeffnen(m, d)}
                      aria-label={`${auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}: ${personName(m)}, ${datumKurz(d)}`}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  )}
                </>
              );
            },
            (d, j) => {
              const schluessel = `${m.id}|${d}`;
              const a = anwesenheit(m.id, d, k);
              return {
                className: `${(a.status === 'frei' || a.status === 'inaktiv') && !frei(j) ? 'pt2-tag--frei pt2-frei-start pt2-frei-ende' : ''} ${ziel === schluessel ? 'pt2-tag--ziel' : ''}`,
                onDragOver: (e: DragEvent<HTMLDivElement>) => {
                  if (!zug) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = zug.auftragId ? 'copy' : 'move';
                  if (ziel !== schluessel) setZiel(schluessel);
                },
                onDragLeave: () => ziel === schluessel && setZiel(undefined),
                onDrop: fallenLassen(m, d),
              };
            },
          )}
          {verteilt.map(({ eintrag: e, spur }, j) => {
            if (e.art === 'abw') {
              const a = e.a;
              const text = abwesenheitText(a, m);
              return (
                <Balken
                  key={`a${j}`}
                  spanne={e}
                  spur={spur}
                  offen={{
                    links: e.von === 0 && abwesenheitAm(m.id, plusTage(von, -1), k)?.id === a.id,
                    rechts: e.bis === n - 1 && abwesenheitAm(m.id, plusTage(bis, 1), k)?.id === a.id,
                  }}
                  to={darfTeamDaten(m.id) ? abwesenheitPfad(a.id) : undefined}
                  label={`${personName(m)}: ${text}`}
                  klasse={`pt2-abw pl-abw--${a.art} ${a.status === 'beantragt' ? 'pl-abw--beantragt' : ''}`}
                  extra={info.ausloeser(`a-${a.id}`, () => (
                    <>
                      <div className="pt2-info-kopf">
                        <Personenbild m={m} groesse={28} />
                        <div>
                          <strong>{text}</strong>
                          <p className="pt2-info-meta">{personName(m)}</p>
                        </div>
                      </div>
                      <dl className="pt2-info-liste">
                        <dt>Zeitraum</dt>
                        <dd>
                          {datumKurz(a.von)} – {datumKurz(a.bis)}
                        </dd>
                        <dt>Status</dt>
                        <dd>
                          <Status ton={a.status === 'genehmigt' ? 'erfolg' : 'aktiv'}>{a.status === 'genehmigt' ? 'Genehmigt' : 'Beantragt'}</Status>
                        </dd>
                      </dl>
                    </>
                  ))}
                >
                  <span className="pt2-balken-text">{text}</span>
                </Balken>
              );
            }
            const s = e.s;
            const liste = s.teile.map((x) => x.t);
            const einzel = liste.length === 1 ? liste[0] : undefined;
            const a = s.schluessel ? db.auftraege.get(s.schluessel) : undefined;
            const gruende = liste.flatMap((t) => blockiert(t, m.id));
            const titel = a?.titel ?? einzel?.titel ?? 'Termin';
            const breite = pixel(e);
            const zeit = einzel && !einzel.ganztags && s.von === s.bis ? `${uhrzeit(einzel.start)}–${uhrzeit(einzel.ende)}` : '';
            const schluessel = `t-${m.id}-${j}`;
            return (
              <Balken
                key={`t${j}`}
                spanne={e}
                spur={spur}
                offen={{ links: s.von < 0, rechts: s.bis >= n }}
                to={einzel ? terminPfad(einzel.id) : a ? auftragPfad(a.id) : undefined}
                label={`${titel}${zeit ? `, ${zeit}` : ''}${gruende.length ? ', Konflikt' : ''}`}
                klasse={`${gruende.length ? 'pt2-balken--konflikt' : ''} ${einzel && einzel.status !== 'geplant' && einzel.status !== 'bestaetigt' ? 'pt2-balken--status' : ''} ${markiert === schluessel ? 'pt2-balken--markiert' : ''}`}
                stil={{
                  ['--balken' as string]: a ? projektFarbe(a.id) : 'var(--mm-surface-subtle)',
                }}
                extra={{
                  ...info.ausloeser(schluessel, () => (einzel ? terminInfo(einzel, m) : mehrereInfo(titel, a, liste, m))),
                  ...({
                    'data-schluessel': schluessel,
                  } as HTMLAttributes<HTMLElement>),
                }}
                ziehen={
                  einzel && darfPlanen
                    ? (ev) => {
                        ev.dataTransfer.setData('text/x-termin', einzel.id);
                        ev.dataTransfer.setData('text/x-mitarbeiter', m.id);
                        ev.dataTransfer.effectAllowed = 'move';
                        setZug({ terminId: einzel.id, vonMa: m.id });
                      }
                    : undefined
                }
              >
                {a && breite >= 72 && <ProjektMarke auftragId={a.id} groesse={18} />}
                <span className="pt2-balken-text">
                  {titel}
                  {zeit && breite >= 200 ? <span className="pt2-balken-zeit"> · {zeit}</span> : null}
                </span>
                {gruende.length > 0 && <KonfliktMarke breit={breite >= 160} />}
              </Balken>
            );
          })}
        </div>
      </div>
    );
  };

  const problemZeile = (
    <div className="pt2-probleme" aria-label="Was Aufmerksamkeit braucht">
      {konfliktPaare.length > 0 && (
        <button
          type="button"
          className="pt2-problem pt2-problem--gefahr"
          onClick={() => {
            setZu({ ...zu, team: false });
            window.setTimeout(() => {
              const el = rahmen.current?.querySelector<HTMLElement>('.pt2-balken--konflikt[data-schluessel]');
              if (el?.dataset.schluessel) hinspringen(`[data-schluessel="${el.dataset.schluessel}"]`, el.dataset.schluessel);
            }, 0);
          }}
        >
          <Icon name="achtung" size={16} /> {konfliktPaare.length === 1 ? '1 Konflikt' : `${konfliktPaare.length} Konflikte`}
        </button>
      )}
      {offen.length > 0 && (
        <button type="button" className="pt2-problem" onClick={() => (setZu({ ...zu, offen: false }), hinspringen('[data-abschnitt="offen"] .pt2-auf'))}>
          <Icon name="kalender" size={16} /> {offen.length === 1 ? '1 Auftrag ohne Termin' : `${offen.length} Aufträge ohne Termin`}
        </button>
      )}
      {ueberlastet.map((m) => (
        <button key={m.id} type="button" className="pt2-problem pt2-problem--achtung" onClick={() => (setZu({ ...zu, team: false }), hinspringen(`[data-person="${m.id}"] .pt2-name`, `m-${m.id}`))}>
          <Personenbild m={m} groesse={20} /> {personName(m)} überlastet
        </button>
      ))}
      {!konfliktPaare.length && !offen.length && !ueberlastet.length && (
        <span className="pt2-problem pt2-problem--gut">
          <Icon name="check" size={16} /> Alles eingeplant, keine Konflikte
        </span>
      )}
    </div>
  );

  const steuerung = (
    <div className="pt2-steuerung">
      <span className="pt2-gruppe">
        <IconButton icon="minus" label="Mehr Tage zeigen" disabled={zoomStufe === 0} onClick={() => (setEigeneBreite(undefined), setze({ zoom: String(zoomStufe - 1) }))} />
        <IconButton icon="plus" label="Weniger Tage, größer zeigen" disabled={zoomStufe === ZOOM.length - 1} onClick={() => (setEigeneBreite(undefined), setze({ zoom: String(zoomStufe + 1) }))} />
      </span>
    </div>
  );

  return (
    <Seite
      titel="Plantafel"
      breit
      aktion={
        <Button variante="sekundaer" icon="kalender" to="/betrieb/abwesenheiten">
          Urlaub eintragen
        </Button>
      }
    >
      {!mitarbeiter.length ? (
        <Leer titel="Noch keine Mitarbeiter" text="Leg dein Team an, dann kannst du hier Einsätze verteilen." icon="team" />
      ) : schmal ? (
        <div ref={rahmen}>
          <Stapel>
            {problemZeile}
            {offen.length > 0 && (
              <div className="pt2-offen-schmal" data-abschnitt="offen">
                <button type="button" className="pt2-auf" aria-expanded={!zu.offen} onClick={() => setZu({ ...zu, offen: !zu.offen })}>
                  <Icon name={zu.offen ? 'weiter' : 'runter'} size={16} />
                  <span>Noch einzuplanen</span>
                  <span className="pt-kopf-anzahl">{offen.length}</span>
                </button>
                {!zu.offen && offenChips()}
              </div>
            )}
            <div className="pl-navi">
              <IconButton icon="pfeilLinks" label="Vortag" onClick={() => setze({ tag: plusTage(tag, -1) })} />
              <Button variante="tertiaer" onClick={() => setze({ tag: undefined })}>
                Heute
              </Button>
              <IconButton icon="pfeilRechts" label="Nächster Tag" onClick={() => setze({ tag: plusTage(tag, 1) })} />
              <span className="pl-zeitraum">{datumKurz(tag)}</span>
            </div>
            {mitarbeiter.map((m) => {
              const a = anwesenheit(m.id, tag, k);
              const liste = termineIm(k.termine, tag, tag, {
                mitarbeiterId: m.id,
              });
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
                    {liste.map((t) => (
                      <TerminKarte key={t.id} t={t} gruende={konflikte.get(t.id)?.get(m.id)} />
                    ))}
                    {!liste.length && <Meta>{a.status === 'da' ? 'Noch nichts geplant.' : 'Nicht verplanen.'}</Meta>}
                    {darfPlanen && tag >= heute() && (
                      <button type="button" className="pl-einplanen" onClick={() => zelleOeffnen(m, tag)}>
                        + {auftrag ? `${auftrag.titel} hier einplanen` : 'Termin'}
                      </button>
                    )}
                  </Stapel>
                </Karte>
              );
            })}
          </Stapel>
        </div>
      ) : (
        <Stapel abstand={12}>
          <div className="pt2-leiste">
            {problemZeile}
            {steuerung}
          </div>
          {auftrag && (
            <Meldung
              ton="aktiv"
              titel={`${auftrag.titel} einplanen`}
              aktion={
                <>
                  <MitMacherVorbereiten bezug={{ typ: 'auftraege', id: auftrag.id }} zweck="einplanen" klein />
                  <Button variante="sekundaer" klein onClick={() => setze({ auftrag: undefined })}>
                    Fertig
                  </Button>
                </>
              }
            >
              {rest != null ? (rest > 0 ? `Noch ${zahl(rest)} h einzuplanen. ` : 'Die geschätzten Stunden sind verplant. ') : ''}
              Tipp bei Mitarbeiter und Tag auf „+“ – Macher schlägt die erste freie Zeit vor.
            </Meldung>
          )}
          {sortieren && (
            <Meldung
              ton="neutral"
              titel="Reihenfolge ändern"
              aktion={
                <>
                  {eigeneReihe && (
                    <Button variante="tertiaer" klein onClick={reiheZuruecksetzen}>
                      Standard wiederherstellen
                    </Button>
                  )}
                  <Button variante="sekundaer" klein onClick={() => setSortieren(false)}>
                    Fertig
                  </Button>
                </>
              }
            >
              Mit den Pfeilen schieben – oder einen Namen auf einen anderen ziehen. Gilt für dein ganzes Team.
            </Meldung>
          )}
          <div className="pt2-rahmen" ref={rahmen}>
            <div
              className={`pt2-tafel ${tagBreite < 40 ? 'pt2-tafel--eng' : ''}`}
              role="grid"
              aria-label={`Plantafel ${datumKurz(von)} bis ${datumKurz(bis)}`}
              style={{
                ['--pt2-breite' as string]: `${tagBreite}px`,
                ['--pt2-name' as string]: `${nameBreite}px`,
                ['--pt2-spalten' as string]: spalten,
                minWidth: tafelBreite,
              }}
            >
              {kopf}
              {offen.length > 0 && abschnitt('offen', 'Noch einzuplanen', offen.length)}
              {offen.length > 0 && !zu.offen && offenZeile()}
              {abschnitt('projekte', 'Projekte', projekte.length, <IconButton icon="plus" label="Auftrag anlegen" className="pt2-mini" onClick={() => navigate('/auftraege/auftraege/neu')} />)}
              {!zu.projekte &&
                (projekte.length ? (
                  projekte.map(projektZeile)
                ) : (
                  <div className="pt2-zeile">
                    <div className="pt2-name pt2-name--hinweis">Keine Projekte in diesem Zeitraum</div>
                    <div className="pt2-spur" style={{ gridTemplateRows: 'var(--pt2-reihe)' }}>
                      {hintergrund()}
                    </div>
                  </div>
                ))}
              {abschnitt(
                'team',
                'Mitarbeiter',
                mitarbeiter.length,
                darfOrdnen ? <IconButton icon="mehr" label="Reihenfolge ändern" className="pt2-mini" aria-pressed={sortieren} onClick={() => setSortieren(!sortieren)} /> : undefined,
              )}
              {!zu.team && mitarbeiter.map(mitarbeiterZeile)}
            </div>
          </div>
        </Stapel>
      )}
      {info.element}

      <AussehenDialog
        key={aussehenId}
        auftrag={db.auftraege.get(aussehenId)}
        onSchliessen={() => setAussehenId(undefined)}
        onEinplanen={
          darfPlanen
            ? (id) => {
                setAussehenId(undefined);
                setze({ auftrag: id });
              }
            : undefined
        }
      />
      <TerminFormular
        offen={!!vorgabe}
        onSchliessen={() => setVorgabe(undefined)}
        vorgabe={vorgabe}
        titel={vorgabe?.auftragId ? `${db.auftraege.get(vorgabe.auftragId)?.titel ?? 'Auftrag'} einplanen` : 'Termin anlegen'}
        onGespeichert={() => {
          const r = auftrag ? restStunden(auftrag, db.termine.all()) : undefined;
          if (auftrag && (r == null || r <= 0)) setze({ auftrag: undefined });
        }}
      />
    </Seite>
  );
}
