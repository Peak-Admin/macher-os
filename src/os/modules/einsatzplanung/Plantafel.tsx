/**
 * Plantafel: oben die Projekte, darunter das Team – jeweils als durchgehende Balken über die Tage.
 * Zoom mit − / +, Mitarbeiter frei anordnen, Projekte mit Bild, Emoji, Icon oder Farbe kennzeichnen.
 * Fährt man über einen freien Tag eines Mitarbeiters, erscheint „+“ für einen neuen Termin.
 */
import { useMemo, useState, type CSSProperties, type DragEvent, type HTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart, zahl } from '@core/format';
import type { Abwesenheit, Auftrag, Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, Icon, IconButton, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, useToast } from '@ui/index';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import { terminAmTag, termineIm, TERMINSTATUS } from '../kalender/daten';
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
import { laeufe, spuren, zusammenfassen, ZOOM, ZOOM_STANDARD, type Spanne } from './zeitleiste';
import '../kalender/plan.css';
import './plantafel.css';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;
const abwesenheitPfad = (id: string) => `/betrieb/abwesenheiten/${id}`;
const wtag = (d: Datum) => WOCHENTAGE[(new Date(`${d}T12:00:00`).getDay() + 6) % 7];
const monatsTitel = (d: Datum) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const aktiveTermine = (liste: Termin[]) => liste.filter((t) => t.status !== 'abgesagt');

function abwesenheitText(a: Abwesenheit, m: Mitarbeiter) {
  const art = darfTeamDaten(m.id) ? ART_LABEL[a.art] : 'Abwesend';
  return `${art}${a.halbtags ? ' (halber Tag)' : ''}${a.status === 'beantragt' ? ' · beantragt' : ''}`;
}

/** Terminkarte fürs Handy: Zeit, Titel, Kunde und die Gesichter aller Eingeplanten */
function TerminKarte({ t, m, gruende }: { t: Termin; m: Mitarbeiter; gruende?: Grund[] }) {
  const ma = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
  const kunde = db.kunden.get(t.kundeId);
  const blockiert = gruende?.filter((g) => g.blockiert) ?? [];
  const st = TERMINSTATUS[t.status];
  return (
    <Link
      to={terminPfad(t.id)}
      className={`pl-balken ${t.status === 'abgesagt' ? 'pl-balken--abgesagt' : ''} ${blockiert.length ? 'pl-balken--konflikt' : ''}`}
      style={{ ['--pl-farbe' as string]: m.farbe ?? undefined, background: t.auftragId ? projektFarbe(t.auftragId) : undefined }}
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
  titel,
  klasse,
  stil,
  ziehen,
}: {
  spanne: Spanne;
  spur: number;
  offen?: { links?: boolean; rechts?: boolean };
  children: ReactNode;
  to?: string;
  titel: string;
  klasse?: string;
  stil?: CSSProperties;
  ziehen?: (e: DragEvent) => void;
}) {
  const style: CSSProperties = { gridColumn: `${spanne.von + 1} / ${spanne.bis + 2}`, gridRow: spur + 1, ...stil };
  const cls = `pt2-balken ${offen?.links ? 'pt2-balken--links-offen' : ''} ${offen?.rechts ? 'pt2-balken--rechts-offen' : ''} ${klasse ?? ''}`;
  return to ? (
    <Link to={to} className={cls} style={style} title={titel} draggable={!!ziehen} onDragStart={ziehen}>
      {children}
    </Link>
  ) : (
    <span className={cls} style={style} title={titel}>
      {children}
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
  const [zu, setZu] = useState<{ projekte?: boolean; team?: boolean }>({});
  const [aussehenId, setAussehenId] = useState<ID>();
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

  const von = ab;
  const bis = plusTage(ab, zoom.tage - 1);
  const sichtbareTage = tage(von, bis);
  const n = sichtbareTage.length;
  const termineZeitraum = aktiveTermine(termineIm(k.termine, von, bis));
  const frei = (i: number) => !arbeitstagIm(k, sichtbareTage[i]);

  /** Tage (Index) eines Termins im sichtbaren Zeitraum; offen = läuft über den Rand hinaus */
  const spanneVon = (t: Termin): Spanne | undefined => {
    const idx = sichtbareTage.map((d, i) => (terminAmTag(t, d) ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return undefined;
    const vorher = terminAmTag(t, plusTage(von, -1));
    const nachher = terminAmTag(t, plusTage(bis, 1));
    return { von: vorher ? -1 : idx[0], bis: nachher ? n : idx[idx.length - 1] };
  };
  const sichtbar = (s: Spanne): Spanne => ({ von: Math.max(0, s.von), bis: Math.min(n - 1, s.bis) });

  const konflikte = useMemo(() => {
    const m = new Map<ID, Map<ID, Grund[]>>();
    for (const t of termineZeitraum) m.set(t.id, new Map(terminKonflikte(t, k).map((x) => [x.mitarbeiterId, x.gruende])));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termineZeitraum.map((t) => t.id + t.geaendertAm).join(), k.abwesenheiten.length]);
  const blockiert = (t: Termin, maId: ID) => konflikte.get(t.id)?.get(maId)?.filter((g) => g.blockiert) ?? [];

  // ---------------------------------------------------------------- Auftrag einplanen
  const offen = offenEinzuplanen(db.auftraege.all(), k.termine);
  const offenIds = new Set(offen.map((e) => e.auftrag.id));
  const weitere = db.auftraege.where((a) => ['anfrage', 'besichtigung', 'beauftragt', 'in_arbeit', 'abnahme'].includes(a.phase) && !offenIds.has(a.id));
  const auftragLabel = (a: Auftrag) => `${a.nummer} · ${a.titel} (${db.kunden.get(a.kundeId)?.name ?? '–'})`;
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

  // ---------------------------------------------------------------- Projekte (Zeilen)
  const projekte = (() => {
    const nachAuftrag = new Map<ID, Termin[]>();
    for (const t of termineZeitraum) if (t.auftragId && db.auftraege.get(t.auftragId)) nachAuftrag.set(t.auftragId, [...(nachAuftrag.get(t.auftragId) ?? []), t]);
    const zeilen = [...nachAuftrag.entries()].map(([id, liste]) => {
      const teile = liste.map((t) => ({ ...spanneVon(t)!, schluessel: id, t })).filter((x) => x.von != null);
      return { auftrag: db.auftraege.get(id)!, segmente: zusammenfassen(teile, frei) };
    });
    zeilen.sort((a, b) => Math.min(...a.segmente.map((s) => s.von)) - Math.min(...b.segmente.map((s) => s.von)) || a.auftrag.nummer.localeCompare(b.auftrag.nummer));
    if (auftrag && !nachAuftrag.has(auftrag.id)) zeilen.unshift({ auftrag, segmente: [] });
    return zeilen;
  })();

  const schritt = Math.max(7, Math.round(zoom.tage / 4 / 7) * 7);

  // ---------------------------------------------------------------- Bausteine der Tafel
  const tagKlasse = (d: Datum, i: number) => `${frei(i) ? 'pt2-tag--frei' : ''} ${d === heute() ? 'pt2-tag--heute' : ''}`;

  const kopf = (
    <div className="pt2-zeile pt2-zeile--kopf">
      <div className="pt2-name pt2-name--kopf" />
      <div className="pt2-spur pt2-spur--kopf" style={{ gridTemplateRows: 'auto auto auto' }}>
        {laeufe(sichtbareTage, (d) => d.slice(0, 7)).map((l) => (
          <div key={l.schluessel} className="pt2-monat" style={{ gridColumn: `${l.von + 1} / ${l.bis + 2}`, gridRow: 1 }}>
            {monatsTitel(sichtbareTage[l.von])}
          </div>
        ))}
        {laeufe(sichtbareTage, (d) => `KW ${kalenderwoche(d)}`).map((l) => (
          <div key={`${l.schluessel}-${l.von}`} className="pt2-kw" style={{ gridColumn: `${l.von + 1} / ${l.bis + 2}`, gridRow: 2 }}>
            {l.bis - l.von >= 2 || zoom.breite >= 40 ? l.schluessel : ''}
          </div>
        ))}
        {sichtbareTage.map((d, i) => (
          <div key={d} className={`pt2-tagkopf ${tagKlasse(d, i)}`} style={{ gridColumn: i + 1, gridRow: 3 }} role="columnheader" aria-label={datumKurz(d)}>
            <span className="pt2-tagkopf-wtag">{zoom.breite >= 26 ? wtag(d) : wtag(d)[0]}</span>
            <span className="pt2-tagkopf-zahl">{Number(d.slice(8, 10))}</span>
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

  const abschnitt = (schluessel: 'projekte' | 'team', titel: string, anzahl: number, aktion?: ReactNode) => (
    <div className="pt2-zeile pt2-zeile--abschnitt">
      <div className="pt2-name pt2-name--abschnitt">
        <button type="button" className="pt2-auf" aria-expanded={!zu[schluessel]} onClick={() => setZu({ ...zu, [schluessel]: !zu[schluessel] })}>
          <Icon name={zu[schluessel] ? 'weiter' : 'runter'} size={18} />
          <span>{titel}</span>
          <span className="pt-kopf-anzahl">{anzahl}</span>
        </button>
        {aktion}
      </div>
      <div className="pt2-spur pt2-spur--abschnitt" />
    </div>
  );

  const projektZeile = (z: (typeof projekte)[number]) => {
    const a = z.auftrag;
    const farbe = projektFarbe(a.id);
    const verteilt = spuren(z.segmente);
    const anzahl = Math.max(1, ...verteilt.map((v) => v.spur + 1));
    return (
      <div key={a.id} className="pt2-zeile" role="row">
        <div className="pt2-name" role="rowheader">
          <button type="button" className="pt2-projekt" style={{ background: farbe }} onClick={() => setAussehenId(a.id)} title={`${a.titel} – Aussehen und Einplanen`}>
            <ProjektMarke auftragId={a.id} groesse={22} />
            <span className="pt2-projekt-titel">{a.titel}</span>
          </button>
        </div>
        <div className="pt2-spur" style={{ gridTemplateRows: `repeat(${anzahl}, var(--pt2-reihe))` }}>
          {hintergrund()}
          {verteilt.map(({ eintrag: s, spur }, i) => {
            const leute = [...new Set(s.teile.flatMap((x) => x.t.mitarbeiterIds))].map((id) => db.mitarbeiter.get(id)).filter((x): x is Mitarbeiter => !!x);
            const konflikt = s.teile.some((x) => x.t.mitarbeiterIds.some((mid) => blockiert(x.t, mid).length));
            const sv = sichtbar(s);
            return (
              <Balken
                key={i}
                spanne={sv}
                spur={spur}
                offen={{ links: s.von < 0, rechts: s.bis >= n }}
                to={auftragPfad(a.id)}
                titel={`${a.titel} · ${datumKurz(sichtbareTage[sv.von])} – ${datumKurz(sichtbareTage[sv.bis])}${konflikt ? ' · Konflikt' : ''}`}
                klasse={konflikt ? 'pt2-balken--konflikt' : ''}
                stil={{ background: farbe }}
              >
                {konflikt && <Icon name="achtung" size={16} />}
                <span className="pt2-balken-text">{a.titel}</span>
                {(sv.bis - sv.von + 1) * zoom.breite >= 180 && (
                  <span className="pt2-balken-leute">
                    {leute.slice(0, 3).map((m) => (
                      <Personenbild key={m.id} m={m} groesse={20} />
                    ))}
                  </span>
                )}
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
    // Abwesenheiten als eigene Balken
    const abw = new Map<ID, { a: Abwesenheit; von: number; bis: number }>();
    sichtbareTage.forEach((d, j) => {
      const a = abwesenheitAm(m.id, d, k);
      if (!a) return;
      const e = abw.get(a.id);
      if (e) e.bis = j;
      else abw.set(a.id, { a, von: j, bis: j });
    });
    const alle: (Spanne & { art: 'termin'; s: (typeof segmente)[number] } | Spanne & { art: 'abw'; x: { a: Abwesenheit } })[] = [
      ...[...abw.values()].map((x) => ({ von: x.von, bis: x.bis, art: 'abw' as const, x })),
      ...segmente.map((s) => ({ von: Math.max(0, s.von), bis: Math.min(n - 1, s.bis), art: 'termin' as const, s })),
    ];
    const verteilt = spuren(alle);
    const anzahl = Math.max(1, ...verteilt.map((v) => v.spur + 1)) + (darfPlanen ? 1 : 0);
    const ueberlastet = geplanteStunden(m.id, von, bis, k) > verfuegbareStunden(m.id, von, bis, k);

    return (
      <div key={m.id} className="pt2-zeile" role="row">
        <div
          className={`pt2-name pt2-name--person ${reiheZiel === m.id && reiheZug !== m.id ? 'pt-name--ziel' : ''} ${reiheZug === m.id ? 'pt-name--zieht' : ''} ${darfOrdnen ? 'pt-name--ziehbar' : ''}`}
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
          <Personenbild m={m} groesse={32} />
          <span className="pt2-person">
            <Link to={`/betrieb/mitarbeiter/${m.id}`} className="pt-name-link" draggable={false}>
              {personName(m)}
            </Link>
            {ueberlastet && <span className="pt2-ueberlastet">Überlastet</span>}
          </span>
          {sortieren && (
            <span className="pt-ordnen">
              <IconButton icon="hoch" label={`${personName(m)} nach oben`} disabled={i === 0} onClick={() => ordne(m.id, i - 1)} />
              <IconButton icon="runter" label={`${personName(m)} nach unten`} disabled={i === mitarbeiter.length - 1} onClick={() => ordne(m.id, i + 1)} />
            </span>
          )}
        </div>
        <div className="pt2-spur" style={{ gridTemplateRows: `repeat(${anzahl}, var(--pt2-reihe))` }}>
          {hintergrund(
            (d) =>
              darfPlanen && d >= heute() ? (
                <button
                  type="button"
                  className={`pt2-plus ${auftrag ? 'pt2-plus--immer' : ''}`}
                  onClick={() => zelleOeffnen(m, d)}
                  aria-label={`${auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}: ${personName(m)}, ${datumKurz(d)}`}
                >
                  <Icon name="plus" size={18} />
                </button>
              ) : null,
            (d) => {
              const schluessel = `${m.id}|${d}`;
              const a = anwesenheit(m.id, d, k);
              return {
                className: `${a.status === 'frei' || a.status === 'inaktiv' ? 'pt2-tag--frei' : ''} ${ziel === schluessel ? 'pt2-tag--ziel' : ''}`,
                onDragOver: (e: DragEvent<HTMLDivElement>) => {
                  if (!zug) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (ziel !== schluessel) setZiel(schluessel);
                },
                onDragLeave: () => ziel === schluessel && setZiel(undefined),
                onDrop: fallenLassen(m, d),
              };
            },
          )}
          {verteilt.map(({ eintrag: e, spur }, j) => {
            if (e.art === 'abw') {
              const a = e.x.a;
              const text = abwesenheitText(a, m);
              return (
                <Balken
                  key={`a${j}`}
                  spanne={e}
                  spur={spur}
                  offen={{ links: e.von === 0 && abwesenheitAm(m.id, plusTage(von, -1), k)?.id === a.id, rechts: e.bis === n - 1 && abwesenheitAm(m.id, plusTage(bis, 1), k)?.id === a.id }}
                  to={darfTeamDaten(m.id) ? abwesenheitPfad(a.id) : undefined}
                  titel={`${personName(m)}: ${text}`}
                  klasse={`pt2-abw pl-abw--${a.art} ${a.status === 'beantragt' ? 'pl-abw--beantragt' : ''}`}
                >
                  <span className="pt2-balken-text">{text}</span>
                </Balken>
              );
            }
            const s = e.s;
            const einzel = s.teile.length === 1 ? s.teile[0].t : undefined;
            const a = s.schluessel ? db.auftraege.get(s.schluessel) : undefined;
            const gruende = s.teile.flatMap((x) => blockiert(x.t, m.id));
            const titel = a?.titel ?? einzel?.titel ?? 'Termin';
            const zeit = einzel && !einzel.ganztags && s.von === s.bis ? `${uhrzeit(einzel.start)}–${uhrzeit(einzel.ende)}` : '';
            return (
              <Balken
                key={`t${j}`}
                spanne={e}
                spur={spur}
                offen={{ links: s.von < 0, rechts: s.bis >= n }}
                to={einzel ? terminPfad(einzel.id) : a ? auftragPfad(a.id) : undefined}
                titel={`${titel}${zeit ? ` · ${zeit}` : ''}${gruende.length ? ` · Konflikt: ${[...new Set(gruende.map((g) => g.text))].join(', ')}` : ''}`}
                klasse={`${gruende.length ? 'pt2-balken--konflikt' : ''} ${einzel?.status === 'geplant' || !einzel ? '' : 'pt2-balken--status'}`}
                stil={{ background: a ? projektFarbe(a.id) : undefined }}
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
                {gruende.length > 0 && <Icon name="achtung" size={16} />}
                {a && (e.bis - e.von + 1) * zoom.breite >= 72 && <ProjektMarke auftragId={a.id} groesse={18} />}
                <span className="pt2-balken-text">
                  {titel}
                  {zeit && (e.bis - e.von + 1) * zoom.breite >= 200 ? <span className="pt2-balken-zeit"> · {zeit}</span> : null}
                  {gruende.length > 0 && <span className="sr-only"> – Konflikt</span>}
                </span>
              </Balken>
            );
          })}
        </div>
      </div>
    );
  };

  const einplanenFeld = darfPlanen ? (
    <div className="pt2-einplanen">
      <Auswahl label="Projekt einplanen" value={auftragId} onChange={(e) => setze({ auftrag: e.target.value })} leer={optionen.length ? 'Projekt wählen' : 'Keine offenen Aufträge'} optionen={optionen} />
    </div>
  ) : null;

  const werkzeugleiste = (
    <div className="pt2-leiste">
      {einplanenFeld ?? <span />}
      <div className="pt2-steuerung">
        <span className="pt2-zeitraum">
          {datumKurz(von)} – {datumKurz(bis)}
        </span>
        <span className="pt2-gruppe">
          <IconButton icon="pfeilLinks" label="Früher" onClick={() => setze({ ab: plusTage(ab, -schritt), woche: undefined })} />
          <IconButton icon="pfeilRechts" label="Später" onClick={() => setze({ ab: plusTage(ab, schritt), woche: undefined })} />
        </span>
        <Button variante="sekundaer" onClick={() => setze({ ab: undefined, woche: undefined })}>
          Heute
        </Button>
        <span className="pt2-gruppe">
          <IconButton icon="minus" label="Mehr Tage zeigen" disabled={zoomStufe === 0} onClick={() => setze({ zoom: String(zoomStufe - 1) })} />
          <IconButton icon="plus" label="Weniger Tage, größer zeigen" disabled={zoomStufe === ZOOM.length - 1} onClick={() => setze({ zoom: String(zoomStufe + 1) })} />
        </span>
      </div>
    </div>
  );

  return (
    <Seite
      titel="Plantafel"
      untertitel="Wer arbeitet wann an welchem Projekt – und wer ist weg."
      breit
      aktion={
        <Button variante="sekundaer" icon="kalender" to="/betrieb/abwesenheiten">
          Urlaub eintragen
        </Button>
      }
    >
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
          Tipp bei Mitarbeiter und Tag auf „+“ – Macher schlägt die erste freie Zeit vor.
        </Meldung>
      )}

      {!mitarbeiter.length ? (
        <Leer titel="Noch keine Mitarbeiter" text="Leg dein Team an, dann kannst du hier Einsätze verteilen." icon="team" />
      ) : schmal ? (
        <Stapel>
          {einplanenFeld}
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
                  {liste.map((t) => (
                    <TerminKarte key={t.id} t={t} m={m} gruende={konflikte.get(t.id)?.get(m.id)} />
                  ))}
                  {!liste.length && <Meta>{a.status === 'da' ? 'Noch nichts geplant.' : 'Nicht verplanen.'}</Meta>}
                  {darfPlanen && tag >= heute() && (
                    <button type="button" className="pl-einplanen" onClick={() => zelleOeffnen(m, tag)}>
                      + {auftrag ? 'Hier einplanen' : 'Termin'}
                    </button>
                  )}
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
          <div className="pt2-rahmen">
            <div className={`pt2-tafel ${zoom.breite < 40 ? 'pt2-tafel--eng' : ''}`} role="grid" aria-label={`Plantafel ${datumKurz(von)} bis ${datumKurz(bis)}`} style={{ ['--pt2-tage' as string]: n, ['--pt2-breite' as string]: `${zoom.breite}px` }}>
              {kopf}
              {abschnitt(
                'projekte',
                'Projekte',
                projekte.length,
                <IconButton icon="plus" label="Auftrag anlegen" className="pt2-mini" onClick={() => navigate('/auftraege/auftraege/neu')} />,
              )}
              {!zu.projekte &&
                (projekte.length ? (
                  projekte.map(projektZeile)
                ) : (
                  <div className="pt2-zeile">
                    <div className="pt2-name pt2-leer">Keine Projekte in diesem Zeitraum</div>
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
        titel={auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}
        onGespeichert={() => {
          const r = auftrag ? restStunden(auftrag, db.termine.all()) : undefined;
          if (auftrag && (r == null || r <= 0)) setze({ auftrag: undefined });
        }}
      />
    </Seite>
  );
}
