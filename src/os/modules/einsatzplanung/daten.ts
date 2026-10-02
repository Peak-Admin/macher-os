/** Einsatzplanung: reine Logik für die Plantafel (Vorbelegung, Verschieben per Drag & Drop, Reststunden, Auftragsbalken). */
import { isoDatum, minutenAus, minutenVon, uhrAus } from '@core/format';
import type { Ton } from '@core/modul';
import { PHASEN, type Auftrag, type Datum, type ID, type Termin } from '@core/objects';
import { freieSlots, restStunden, type PlanKontext } from '../verfuegbarkeit/daten';
import { verschoben } from '../kalender/daten';

/**
 * Vorbelegung, wenn man einen Auftrag in eine Zelle (Mitarbeiter × Tag) setzt:
 * erste freie Zeit an dem Tag, so lang wie die Reststunden (höchstens bis Feierabend).
 */
export function vorbelegung(
  a: Pick<Auftrag, 'id' | 'geplanteStunden'> | undefined,
  mitarbeiterId: ID,
  tag: Datum,
  k: PlanKontext,
): { von: string; bis: string; frei: boolean } {
  const beginn = minutenAus(k.arbeitsbeginn);
  const schluss = minutenAus(k.arbeitsende);
  const rest = a ? restStunden(a, k.termine) : undefined;
  const wunsch = Math.round(((rest && rest > 0 ? rest : a?.geplanteStunden) ?? 2) * 60);
  // längstes Stück, das an diesem Tag noch passt – erst die volle Dauer, dann kürzer
  for (let dauer = Math.min(wunsch, schluss - beginn); dauer >= 30; dauer -= 30) {
    const slot = freieSlots({ von: tag, bis: tag, dauerMinuten: dauer, mitarbeiterIds: [mitarbeiterId], kontext: k, ab: new Date(0), max: 1 })[0];
    if (slot) {
      const d = slot.start;
      const e = slot.ende;
      return { von: uhrAus(minutenVon(d)), bis: uhrAus(minutenVon(e)), frei: true };
    }
  }
  return { von: k.arbeitsbeginn, bis: uhrAus(Math.min(beginn + Math.max(60, Math.min(wunsch, schluss - beginn)), schluss)), frei: false };
}

/** Termin per Drag & Drop in eine andere Zelle ziehen: Tag wechselt, Uhrzeit bleibt, Mitarbeiter wird getauscht */
export function aufZelleVerschieben(t: Pick<Termin, 'start' | 'ende' | 'mitarbeiterIds'>, vonMitarbeiterId: ID, zuMitarbeiterId: ID, zuTag: Datum): { start: string; ende: string; mitarbeiterIds: ID[] } {
  const zeit = isoDatum(new Date(t.start)) === zuTag ? { start: t.start, ende: t.ende } : verschoben(t, zuTag);
  let ids = t.mitarbeiterIds;
  if (vonMitarbeiterId !== zuMitarbeiterId) {
    ids = ids.filter((x) => x !== vonMitarbeiterId);
    if (!ids.includes(zuMitarbeiterId)) ids = [...ids, zuMitarbeiterId];
  }
  return { ...zeit, mitarbeiterIds: ids };
}

// ------------------------------------------------------------------ Aufträge über der Plantafel

/** Eine Zeile der Gruppe „Aufträge“: Zeitraum aus den geplanten Terminen – nichts wird am Auftrag gespeichert. */
export interface AuftragsBalken {
  auftrag: Auftrag;
  /** erster und letzter Tag aller nicht abgesagten Termine des Auftrags (auch außerhalb des Zeitraums) */
  start?: Datum;
  ende?: Datum;
  /** Balken in den sichtbaren Spalten (0-basiert, einschließlich); -1, wenn noch kein Termin da ist */
  spalteVon: number;
  spalteBis: number;
  /** Der Zeitraum geht links bzw. rechts über die sichtbaren Tage hinaus */
  beginntFrueher: boolean;
  endetSpaeter: boolean;
  /** Termine je sichtbarem Tag (nur Tage mit mindestens einem Termin) */
  proTag: Record<Datum, number>;
  /** Termine im sichtbaren Zeitraum */
  terminIds: ID[];
  /** Status als Text – Phase des Auftrags */
  status: { text: string; ton: Ton };
}

const tagVon = (iso: string) => isoDatum(new Date(iso));
/** letzter belegter Tag – ein Termin bis 00:00 endet am Vortag */
const letzterTag = (t: Pick<Termin, 'start' | 'ende'>) => {
  const s = tagVon(t.start);
  const e = isoDatum(new Date(new Date(t.ende).getTime() - 1));
  return e < s ? s : e;
};

/**
 * Leitet die Auftragsbalken für die sichtbaren Tage ab: alle Aufträge, deren Zeitraum (erster bis letzter
 * geplanter Termin) die Tage berührt, nach Start sortiert. Danach Aufträge aus `ohneTermin` (z. B. beauftragt,
 * aber noch nicht eingeplant) ohne Balken. Abgesagte und gelöschte Termine zählen nicht.
 */
export function auftragsBalken(auftraege: Auftrag[], termine: Termin[], sichtbareTage: Datum[], ohneTermin: ID[] = []): AuftragsBalken[] {
  if (!sichtbareTage.length) return [];
  const erster = sichtbareTage[0];
  const letzter = sichtbareTage[sichtbareTage.length - 1];
  const nachAuftrag = new Map<ID, Termin[]>();
  for (const t of termine) {
    if (!t.auftragId || t.geloeschtAm || t.status === 'abgesagt') continue;
    const liste = nachAuftrag.get(t.auftragId);
    if (liste) liste.push(t);
    else nachAuftrag.set(t.auftragId, [t]);
  }
  const status = (a: Auftrag) => ({
    text: PHASEN.find((p) => p.id === a.phase)?.label ?? a.phase,
    ton: (a.phase === 'erledigt' ? 'erfolg' : 'neutral') as Ton,
  });
  const sichtbar = (a: Auftrag) => !a.geloeschtAm && a.phase !== 'verloren';

  const mitBalken: AuftragsBalken[] = [];
  for (const a of auftraege) {
    const liste = nachAuftrag.get(a.id);
    if (!liste?.length || !sichtbar(a)) continue;
    let start = tagVon(liste[0].start);
    let ende = letzterTag(liste[0]);
    for (const t of liste) {
      const s = tagVon(t.start);
      const e = letzterTag(t);
      if (s < start) start = s;
      if (e > ende) ende = e;
    }
    if (start > letzter || ende < erster) continue;
    const spalteVon = sichtbareTage.findIndex((d) => d >= start);
    let spalteBis = -1;
    for (let i = sichtbareTage.length - 1; i >= 0; i--)
      if (sichtbareTage[i] <= ende) {
        spalteBis = i;
        break;
      }
    // Zeitraum liegt ganz auf ausgeblendeten Tagen
    if (spalteVon < 0 || spalteBis < spalteVon) continue;
    const proTag: Record<Datum, number> = {};
    const terminIds: ID[] = [];
    for (const t of liste) {
      const s = tagVon(t.start);
      const e = letzterTag(t);
      let drin = false;
      for (const d of sichtbareTage) {
        if (d < s || d > e) continue;
        proTag[d] = (proTag[d] ?? 0) + 1;
        drin = true;
      }
      if (drin) terminIds.push(t.id);
    }
    mitBalken.push({
      auftrag: a,
      start,
      ende,
      spalteVon,
      spalteBis,
      beginntFrueher: start < erster,
      endetSpaeter: ende > letzter,
      proTag,
      terminIds,
      status: status(a),
    });
  }
  mitBalken.sort((x, y) => x.start!.localeCompare(y.start!) || x.ende!.localeCompare(y.ende!) || x.auftrag.nummer.localeCompare(y.auftrag.nummer));

  const schonDa = new Set(mitBalken.map((b) => b.auftrag.id));
  const ohne: AuftragsBalken[] = [];
  for (const id of ohneTermin) {
    const a = auftraege.find((x) => x.id === id);
    if (!a || schonDa.has(id) || !sichtbar(a)) continue;
    schonDa.add(id);
    ohne.push({
      auftrag: a,
      spalteVon: -1,
      spalteBis: -1,
      beginntFrueher: false,
      endetSpaeter: false,
      proTag: {},
      terminIds: [],
      status: status(a),
    });
  }
  return [...mitBalken, ...ohne];
}
