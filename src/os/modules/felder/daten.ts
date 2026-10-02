/**
 * Eigene Felder & Formulare.
 *
 * - `eigeneFelder`: Feld-Definitionen („Eigenes Feld hinzufügen“) je Objektart, z. B. „Zählernummer“ am Ort
 *   oder „Dachneigung“ beim Aufmaß.
 * - `eigeneFormulare`: geordnete Feldgruppen (z. B. „Prüfprotokoll Heizung“), ausfüllbar am Objekt.
 * - `feldwerte`: ein Wert je Feld und Objekt – mit Bezug auf das Objekt, keine Kopie, keine Änderung an den
 *   Kernobjekten. Fotos, Dateien und Unterschriften liegen als `Dokument` am Objekt; der Wert ist die Dokument-ID.
 *
 * Reine Logik und Datenzugriff; die Oberfläche steht in `Felder.tsx` und `EigeneAngaben.tsx`.
 */
import { batch, db, defineCollection, vermerken } from '@core/db';
import { emit } from '@core/events';
import { datum as datumText, personName, zahl } from '@core/format';
import type { Auftrag, Basis, Bezug, ID, SammlungsName } from '@core/objects';
import { abnahmen } from '@modules/abnahme/daten';
import { aufmasse } from '@modules/aufmass/daten';

// ------------------------------------------------------------------ Objektarten

export type FeldObjekt = 'kunde' | 'ort' | 'anlage' | 'auftrag' | 'mitarbeiter' | 'termin' | 'aufmass' | 'wartung' | 'abnahme' | 'formular';

export interface FeldObjektDef {
  id: FeldObjekt;
  label: string;
  /** In welcher Detailansicht die Felder erscheinen (Sammlung des Objekts, an dem der Wert hängt) */
  sammlung?: SammlungsName;
  /** Felder nur an passenden Objekten zeigen (z. B. Wartungsfelder nur an Wartungsaufträgen) */
  passt?: (id: ID) => boolean;
  /** Überschrift der Gruppe in der Detailansicht */
  gruppe?: string;
  /** Überschrift in der Verwaltung („Am Ort / an der Baustelle“) */
  ueberschrift: string;
  text: string;
}

const auftrag = (id: ID): Auftrag | undefined => db.auftraege.get(id);

export const FELD_OBJEKTE: FeldObjektDef[] = [
  { id: 'kunde', label: 'Kunde', ueberschrift: 'Am Kunden', sammlung: 'kunden', text: 'z. B. Kundengruppe, Rabatt, Schlüssel hinterlegt' },
  { id: 'ort', label: 'Ort / Baustelle', ueberschrift: 'Am Ort / an der Baustelle', sammlung: 'orte', text: 'z. B. Zählernummer, Etage, Zugang' },
  { id: 'anlage', label: 'Anlage', ueberschrift: 'An der Anlage', sammlung: 'anlagen', text: 'z. B. Leistung in kW, Brennstoff, Kältemittel' },
  { id: 'auftrag', label: 'Auftrag', ueberschrift: 'Am Auftrag', sammlung: 'auftraege', text: 'z. B. Förderung beantragt, Gerüst nötig' },
  { id: 'mitarbeiter', label: 'Mitarbeiter', ueberschrift: 'Am Mitarbeiter', sammlung: 'mitarbeiter', text: 'z. B. Schuhgröße, Führerscheinklasse' },
  { id: 'termin', label: 'Besichtigung / Termin', ueberschrift: 'Am Termin / bei der Besichtigung', sammlung: 'termine', text: 'z. B. Ansprechpartner vor Ort, Parkplatz' },
  {
    id: 'aufmass',
    label: 'Aufmaß',
    ueberschrift: 'Beim Aufmaß',
    sammlung: 'auftraege',
    gruppe: 'Aufmaß',
    passt: (id) => aufmasse.all().some((a) => a.auftragId === id) || ['besichtigung', 'angebot'].includes(auftrag(id)?.phase ?? ''),
    text: 'z. B. Dachneigung, Deckenhöhe, Untergrund',
  },
  { id: 'wartung', label: 'Wartung', ueberschrift: 'Bei der Wartung', sammlung: 'auftraege', gruppe: 'Wartung', passt: (id) => auftrag(id)?.art === 'wartung', text: 'z. B. Abgaswerte, Druck, Filter gewechselt' },
  {
    id: 'abnahme',
    label: 'Abnahme',
    ueberschrift: 'Bei der Abnahme',
    sammlung: 'auftraege',
    gruppe: 'Abnahme',
    passt: (id) => abnahmen.all().some((a) => a.auftragId === id) || ['abnahme', 'abrechnung', 'erledigt'].includes(auftrag(id)?.phase ?? ''),
    text: 'z. B. Mängel besprochen, Einweisung erfolgt',
  },
  { id: 'formular', label: 'Nur in einem Formular', ueberschrift: 'In Formularen', text: 'Feld gehört zu einem Formular, z. B. Prüfprotokoll' },
];

export const feldObjekt = (id: FeldObjekt) => FELD_OBJEKTE.find((o) => o.id === id)!;

// ------------------------------------------------------------------ Typen

export type FeldTyp = 'text' | 'zahl' | 'auswahl' | 'janein' | 'datum' | 'foto' | 'datei' | 'unterschrift' | 'masseinheit';

export const FELD_TYPEN: { id: FeldTyp; label: string; text: string }[] = [
  { id: 'text', label: 'Text', text: 'Freier Text' },
  { id: 'zahl', label: 'Zahl', text: 'z. B. Anzahl, Stockwerk' },
  { id: 'masseinheit', label: 'Zahl mit Einheit', text: 'z. B. 12,5 m² oder 24 kW' },
  { id: 'auswahl', label: 'Auswahl', text: 'Eine von festen Möglichkeiten' },
  { id: 'janein', label: 'Ja / Nein', text: 'Zum Abhaken' },
  { id: 'datum', label: 'Datum', text: 'z. B. Baujahr, Prüfdatum' },
  { id: 'foto', label: 'Foto', text: 'Bild vom Handy' },
  { id: 'datei', label: 'Datei', text: 'PDF oder anderes Dokument' },
  { id: 'unterschrift', label: 'Unterschrift', text: 'Per Finger unterschreiben' },
];

export const feldTypLabel = (t: FeldTyp) => FELD_TYPEN.find((x) => x.id === t)?.label ?? t;

/** Typen, deren Wert ein Dokument am Objekt ist */
export const DOKUMENT_TYPEN: FeldTyp[] = ['foto', 'datei', 'unterschrift'];

export interface FeldDefinition extends Basis {
  objekt: FeldObjekt;
  /** stabiler Schlüssel (für Vorlagen, z. B. `shk.abgasverlust`) */
  schluessel: string;
  label: string;
  typ: FeldTyp;
  /** bei `masseinheit`: m², kW, bar … */
  einheit?: string;
  /** bei `auswahl` */
  optionen?: string[];
  pflicht?: boolean;
  /** kurzer Hinweis unter dem Feld */
  hilfe?: string;
  /** bei `objekt: 'formular'`: zu welchem Formular */
  formularId?: ID;
  reihenfolge: number;
  /** aus einer Gewerk-Vorlage */
  vorlage?: boolean;
}

export interface Formular extends Basis {
  name: string;
  /** an welchem Objekt das Formular ausgefüllt wird */
  objekt: Exclude<FeldObjekt, 'formular'>;
  beschreibung?: string;
}

export type FeldWert = string | number | boolean;

export interface FeldwertEintrag extends Basis {
  feldId: ID;
  bezug: Bezug;
  wert: FeldWert;
}

export const eigeneFelder = defineCollection<FeldDefinition>('eigeneFelder');
export const eigeneFormulare = defineCollection<Formular>('eigeneFormulare');
export const feldwerte = defineCollection<FeldwertEintrag>('feldwerte');

// ------------------------------------------------------------------ Validierung

export type Pruefung = { ok: true; wert: FeldWert | undefined } | { ok: false; fehler: string };

/**
 * Eingabe (meist Text aus einem Feld) prüfen und in den gespeicherten Wert umwandeln.
 * `undefined` = leer (Wert wird entfernt). Texte in Handwerkersprache.
 */
export function wertPruefen(f: Pick<FeldDefinition, 'typ' | 'label' | 'pflicht' | 'optionen'>, eingabe: unknown): Pruefung {
  const leer = eingabe == null || (typeof eingabe === 'string' && !eingabe.trim());
  if (leer) return f.pflicht && f.typ !== 'janein' ? { ok: false, fehler: `Trag „${f.label}“ ein.` } : { ok: true, wert: undefined };
  switch (f.typ) {
    case 'text': {
      const t = String(eingabe).trim();
      if (t.length > 2000) return { ok: false, fehler: `„${f.label}“ ist zu lang (höchstens 2000 Zeichen).` };
      return { ok: true, wert: t };
    }
    case 'zahl':
    case 'masseinheit': {
      const n = typeof eingabe === 'number' ? eingabe : zahlAusText(String(eingabe));
      if (n == null) return { ok: false, fehler: `„${f.label}“ muss eine Zahl sein, z. B. 12,5.` };
      return { ok: true, wert: n };
    }
    case 'auswahl': {
      const t = String(eingabe).trim();
      if (f.optionen?.length && !f.optionen.includes(t)) return { ok: false, fehler: `Wähl bei „${f.label}“ eine der Möglichkeiten.` };
      return { ok: true, wert: t };
    }
    case 'janein': {
      if (typeof eingabe === 'boolean') return { ok: true, wert: eingabe };
      const t = String(eingabe).trim().toLowerCase();
      if (['ja', 'j', 'x', 'true', '1', 'yes'].includes(t)) return { ok: true, wert: true };
      if (['nein', 'n', 'false', '0', 'no'].includes(t)) return { ok: true, wert: false };
      return { ok: false, fehler: `Bei „${f.label}“ geht nur Ja oder Nein.` };
    }
    case 'datum': {
      const t = String(eingabe).trim();
      const d = datumAusText(t);
      if (!d) return { ok: false, fehler: `„${t}“ ist kein gültiges Datum.` };
      return { ok: true, wert: d };
    }
    case 'foto':
    case 'datei':
    case 'unterschrift': {
      const id = String(eingabe);
      const d = db.dokumente.get(id);
      if (!d || d.geloeschtAm) return { ok: false, fehler: `${feldTypLabel(f.typ)} für „${f.label}“ fehlt.` };
      return { ok: true, wert: id };
    }
  }
}

function zahlAusText(t: string): number | undefined {
  let s = t.trim().replace(/[\s ]/g, '');
  if (!s) return undefined;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function datumAusText(t: string): string | undefined {
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  let j: number, mo: number, ta: number;
  if (m) [j, mo, ta] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else {
    m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(t);
    if (!m) return undefined;
    [ta, mo, j] = [Number(m[1]), Number(m[2]), m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])];
  }
  const d = new Date(Date.UTC(j, mo - 1, ta));
  if (d.getUTCFullYear() !== j || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== ta) return undefined;
  return `${j}-${String(mo).padStart(2, '0')}-${String(ta).padStart(2, '0')}`;
}

/** Definition prüfen, bevor ein Feld angelegt wird */
export function definitionPruefen(d: Pick<FeldDefinition, 'label' | 'typ' | 'objekt' | 'optionen' | 'einheit' | 'formularId'>): string | undefined {
  if (!d.label.trim()) return 'Gib dem Feld einen Namen.';
  if (d.typ === 'auswahl' && (d.optionen ?? []).filter((o) => o.trim()).length < 2) return 'Trag mindestens zwei Möglichkeiten ein.';
  if (d.typ === 'masseinheit' && !d.einheit?.trim()) return 'Trag die Einheit ein, z. B. m² oder kW.';
  if (d.objekt === 'formular' && !d.formularId) return 'Wähl das Formular, zu dem das Feld gehört.';
  return undefined;
}

/** Wert lesbar: „12,5 m²“, „Ja“, „14.03.2026“ */
export function wertText(f: Pick<FeldDefinition, 'typ' | 'einheit'>, w: FeldWert | undefined): string {
  if (w == null || w === '') return '–';
  switch (f.typ) {
    case 'janein':
      return w ? 'Ja' : 'Nein';
    case 'zahl':
      return zahl(Number(w));
    case 'masseinheit':
      return `${zahl(Number(w))} ${f.einheit ?? ''}`.trim();
    case 'datum':
      return datumText(String(w));
    case 'foto':
    case 'datei':
    case 'unterschrift':
      return db.dokumente.get(String(w))?.titel ?? feldTypLabel(f.typ);
    default:
      return String(w);
  }
}

// ------------------------------------------------------------------ Lesen

export function schluesselAus(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'feld'
  );
}

const sortiert = (l: FeldDefinition[]) => [...l].sort((a, b) => a.reihenfolge - b.reihenfolge || a.label.localeCompare(b.label, 'de'));

/** Felder einer Objektart (ohne Formularfelder) */
export function felderFuer(objekt: FeldObjekt): FeldDefinition[] {
  return sortiert(eigeneFelder.where((f) => f.objekt === objekt));
}

export function felderVonFormular(formularId: ID): FeldDefinition[] {
  return sortiert(eigeneFelder.where((f) => f.objekt === 'formular' && f.formularId === formularId));
}

/** Objektarten, die an Objekten einer Sammlung erscheinen (z. B. Auftrag + Aufmaß + Wartung an `auftraege`) */
export function objekteFuerSammlung(s: SammlungsName, id: ID): FeldObjektDef[] {
  return FELD_OBJEKTE.filter((o) => o.sammlung === s && (!o.passt || o.passt(id)));
}

/** Gibt es am Objekt überhaupt etwas zu zeigen? (sonst bleibt der Bereich unsichtbar) */
export function hatEigeneAngaben(s: SammlungsName, id: ID): boolean {
  const arten = objekteFuerSammlung(s, id).map((o) => o.id);
  if (!arten.length) return false;
  return eigeneFelder.all().some((f) => arten.includes(f.objekt)) || eigeneFormulare.all().some((x) => arten.includes(x.objekt));
}

export function wertVon(feldId: ID, bezug: Bezug): FeldwertEintrag | undefined {
  return feldwerte.all().find((w) => w.feldId === feldId && w.bezug.typ === bezug.typ && w.bezug.id === bezug.id);
}

// ------------------------------------------------------------------ Schreiben

/** Werte eines Objekts speichern (alle oder keiner). Rückgabe: Fehler je Feld-ID */
export function werteSpeichern(bezug: Bezug, eingaben: Record<ID, unknown>, opts: { formular?: Formular } = {}): Record<ID, string> {
  const felder = Object.keys(eingaben)
    .map((id) => eigeneFelder.get(id))
    .filter((f): f is FeldDefinition => !!f && !f.geloeschtAm);
  const fehler: Record<ID, string> = {};
  const neu: { f: FeldDefinition; wert: FeldWert | undefined }[] = [];
  for (const f of felder) {
    const p = wertPruefen(f, eingaben[f.id]);
    if (!p.ok) fehler[f.id] = p.fehler;
    else neu.push({ f, wert: p.wert });
  }
  if (Object.keys(fehler).length) return fehler;
  let geaendert = 0;
  batch(() => {
    for (const { f, wert } of neu) {
      const alt = wertVon(f.id, bezug);
      if (wert === undefined) {
        if (!alt) continue;
        feldwerte.remove(alt.id);
      } else if (!alt) feldwerte.create({ feldId: f.id, bezug, wert });
      else if (alt.wert !== wert) feldwerte.update(alt.id, { wert }, { text: `${f.label} geändert` });
      else continue;
      geaendert++;
    }
    if (geaendert) vermerken(bezug, opts.formular ? 'formular.ausgefuellt' : 'felder.geaendert', opts.formular ? `Formular „${opts.formular.name}“ ausgefüllt` : `Eigene Angaben geändert (${neu.map((x) => x.f.label).join(', ')})`);
  });
  if (geaendert && opts.formular) emit({ typ: 'formular.ausgefuellt', daten: { formularId: opts.formular.id, bezug } });
  return {};
}

export function feldAnlegen(d: Omit<FeldDefinition, keyof Basis | 'reihenfolge' | 'schluessel'> & { schluessel?: string }): FeldDefinition {
  const fehler = definitionPruefen(d);
  if (fehler) throw new Error(fehler);
  const gleiche = eigeneFelder.where((f) => f.objekt === d.objekt && f.formularId === d.formularId);
  const basis = d.schluessel ?? `${d.objekt}.${schluesselAus(d.label)}`;
  const vergeben = new Set(eigeneFelder.allMitGeloeschten().map((f) => f.schluessel));
  let schluessel = basis;
  for (let n = 2; vergeben.has(schluessel); n++) schluessel = `${basis}_${n}`;
  return eigeneFelder.create({
    ...d,
    label: d.label.trim(),
    optionen: d.typ === 'auswahl' ? (d.optionen ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
    einheit: d.typ === 'masseinheit' ? d.einheit?.trim() : undefined,
    schluessel,
    reihenfolge: Math.max(0, ...gleiche.map((f) => f.reihenfolge)) + 1,
  });
}

/** Feld verschieben (eine Position nach oben/unten innerhalb seiner Gruppe) */
export function feldVerschieben(id: ID, richtung: -1 | 1) {
  const f = eigeneFelder.get(id);
  if (!f) return;
  const gruppe = sortiert(eigeneFelder.where((x) => x.objekt === f.objekt && x.formularId === f.formularId));
  const i = gruppe.findIndex((x) => x.id === id);
  const j = i + richtung;
  if (j < 0 || j >= gruppe.length) return;
  batch(() => {
    gruppe.splice(j, 0, gruppe.splice(i, 1)[0]);
    gruppe.forEach((x, n) => x.reihenfolge !== n + 1 && eigeneFelder.update(x.id, { reihenfolge: n + 1 }, { leise: true }));
  });
}

/** Feld entfernen: Definition und Werte kommen in den Papierkorb (wiederherstellbar) */
export function feldEntfernen(id: ID) {
  batch(() => {
    for (const w of feldwerte.where((x) => x.feldId === id)) feldwerte.remove(w.id);
    eigeneFelder.remove(id);
  });
}

export function formularEntfernen(id: ID) {
  batch(() => {
    for (const f of eigeneFelder.where((x) => x.formularId === id)) feldEntfernen(f.id);
    eigeneFormulare.remove(id);
  });
}

// ------------------------------------------------------------------ Gewerk-Vorlagen

/** Format der Gewerk-Feldvorlagen aus `@core/gewerke` */
export interface FeldVorlage {
  objekt: string;
  schluessel: string;
  label: string;
  typ: string;
  einheit?: string;
  optionen?: string[];
}

const OBJEKT_SYNONYME: Record<string, FeldObjekt> = {
  kunde: 'kunde', kunden: 'kunde',
  ort: 'ort', orte: 'ort', baustelle: 'ort', einsatzort: 'ort',
  anlage: 'anlage', anlagen: 'anlage',
  auftrag: 'auftrag', auftraege: 'auftrag', projekt: 'auftrag',
  mitarbeiter: 'mitarbeiter',
  termin: 'termin', termine: 'termin', besichtigung: 'termin', besichtigungen: 'termin',
  aufmass: 'aufmass', aufmasse: 'aufmass', 'aufmaß': 'aufmass',
  wartung: 'wartung', wartungen: 'wartung',
  abnahme: 'abnahme', abnahmen: 'abnahme',
  formular: 'formular',
};

const TYP_SYNONYME: Record<string, FeldTyp> = {
  text: 'text', zahl: 'zahl', nummer: 'zahl', number: 'zahl',
  auswahl: 'auswahl', liste: 'auswahl', select: 'auswahl',
  janein: 'janein', ja_nein: 'janein', jaNein: 'janein', 'ja/nein': 'janein', boolean: 'janein', checkbox: 'janein',
  datum: 'datum', date: 'datum',
  foto: 'foto', bild: 'foto',
  datei: 'datei', dokument: 'datei',
  unterschrift: 'unterschrift',
  masseinheit: 'masseinheit', 'maßeinheit': 'masseinheit', einheit: 'masseinheit', mass: 'masseinheit', 'maß': 'masseinheit', messwert: 'masseinheit',
};

export const objektAus = (s: string): FeldObjekt | undefined => OBJEKT_SYNONYME[s.trim().toLowerCase()] ?? OBJEKT_SYNONYME[s.trim()];
export const typAus = (s: string): FeldTyp | undefined => TYP_SYNONYME[s.trim()] ?? TYP_SYNONYME[s.trim().toLowerCase()];

/**
 * Gewerk-Feldvorlagen übernehmen – idempotent über `schluessel`: Was es schon gibt (auch im Papierkorb, also
 * bewusst entfernt), wird nicht noch einmal angelegt. Rückgabe: angelegte und übersprungene Vorlagen.
 */
export function feldvorlagenAnwenden(vorlagen: FeldVorlage[]): { angelegt: FeldDefinition[]; uebersprungen: string[] } {
  const angelegt: FeldDefinition[] = [];
  const uebersprungen: string[] = [];
  batch(() => {
    const vorhanden = new Set(eigeneFelder.allMitGeloeschten().map((f) => f.schluessel));
    for (const v of vorlagen) {
      const objekt = objektAus(v.objekt);
      const typ = typAus(v.typ) ?? (v.einheit ? 'masseinheit' : v.optionen?.length ? 'auswahl' : undefined);
      if (!v.schluessel || vorhanden.has(v.schluessel) || !objekt || objekt === 'formular' || !typ || !v.label?.trim()) {
        uebersprungen.push(v.schluessel);
        continue;
      }
      if (definitionPruefen({ label: v.label, typ, objekt, optionen: v.optionen, einheit: v.einheit })) {
        uebersprungen.push(v.schluessel);
        continue;
      }
      angelegt.push(feldAnlegen({ objekt, typ, label: v.label, einheit: v.einheit, optionen: v.optionen, schluessel: v.schluessel, vorlage: true }));
      vorhanden.add(v.schluessel);
    }
  });
  return { angelegt, uebersprungen };
}

/** Sind das Feldvorlagen im erwarteten Format? (für Gewerk-Vorlagen, deren Form sich ändern kann) */
export function sindFeldvorlagen(x: unknown): x is FeldVorlage[] {
  return Array.isArray(x) && x.length > 0 && x.every((v) => v && typeof v === 'object' && typeof (v as FeldVorlage).schluessel === 'string' && typeof (v as FeldVorlage).label === 'string' && typeof (v as FeldVorlage).typ === 'string' && typeof (v as FeldVorlage).objekt === 'string');
}

// ------------------------------------------------------------------ Suche

/** Lesbarer Titel des Objekts, an dem ein Wert hängt */
export function objektTitel(b: Bezug): string {
  switch (b.typ) {
    case 'kunden':
      return db.kunden.get(b.id)?.name ?? 'Kunde';
    case 'orte':
      return db.orte.get(b.id)?.bezeichnung ?? 'Ort';
    case 'anlagen': {
      const a = db.anlagen.get(b.id);
      return a ? [a.typ, a.hersteller].filter(Boolean).join(' ') : 'Anlage';
    }
    case 'auftraege': {
      const a = db.auftraege.get(b.id);
      return a ? `${a.nummer} · ${a.titel}` : 'Auftrag';
    }
    case 'mitarbeiter':
      return personName(db.mitarbeiter.get(b.id)) || 'Mitarbeiter';
    case 'termine':
      return db.termine.get(b.id)?.titel ?? 'Termin';
    default:
      return 'Eintrag';
  }
}

export const SAMMLUNG_LABEL: Record<string, string> = { kunden: 'Kunde', orte: 'Ort', anlagen: 'Anlage', auftraege: 'Auftrag', mitarbeiter: 'Mitarbeiter', termine: 'Termin' };

/** Eigene Feldwerte, die zur Suche passen (nur lesbare Werte: Text, Auswahl, Zahl, Datum) */
export function feldwertTreffer(q: string, max = 8): { wert: FeldwertEintrag; feld: FeldDefinition; text: string }[] {
  const woerter = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!woerter.length) return [];
  const felder = new Map(eigeneFelder.all().map((f) => [f.id, f]));
  const treffer: { wert: FeldwertEintrag; feld: FeldDefinition; text: string }[] = [];
  for (const w of feldwerte.all()) {
    const f = felder.get(w.feldId);
    if (!f || DOKUMENT_TYPEN.includes(f.typ) || f.typ === 'janein') continue;
    const text = wertText(f, w.wert);
    const heu = `${f.label} ${text}`.toLowerCase();
    if (woerter.every((x) => heu.includes(x)) && woerter.some((x) => text.toLowerCase().includes(x))) treffer.push({ wert: w, feld: f, text });
    if (treffer.length >= max) break;
  }
  return treffer;
}
