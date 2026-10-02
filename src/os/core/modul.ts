/**
 * Modul-Registry.
 *
 * Jedes Modul liegt in `src/modules/<id>/index.ts(x)` und exportiert `default defineModul({...})`.
 * Die Registry findet Module automatisch – niemand muss eine zentrale Datei ändern.
 *
 * Ein Modul ist eine SICHT auf die gemeinsamen Objekte. Es kann:
 * - eigene Routen unter `/<bereich>/<id>` anbieten,
 * - ein Widget auf der Bereichsseite (Hub) zeigen,
 * - Tabs in Detailansichten anderer Objekte einhängen (z. B. „Fotos“ in der Auftragsakte),
 * - Hinweise für „Braucht dich“ liefern (Exception-First),
 * - Automationen registrieren (laufen über Events, protokollieren in „Erledigt“),
 * - Absichten und Aktionen für den zentralen AI Gateway anmelden,
 * - Suchtreffer, Erfassungsformulare (direkt aus dem Kontext geöffnet) und Beispieldaten beisteuern.
 *
 * WO ein Modul in der Oberfläche erscheint, bestimmt allein `src/shell/struktur.ts`
 * (Heute · Aufträge · Planen · Betrieb, je Ebene höchstens vier Ziele).
 */
import type { ComponentType } from 'react';
import type { GatewayBeitrag } from './gateway';
import type { Bezug, ID, Rolle, SammlungsName } from './objects';

export type Bereich = 'heute' | 'auftraege' | 'plan' | 'betrieb' | 'macher';
export type BetriebGruppe = 'team' | 'material' | 'werkzeuge' | 'geld' | 'unternehmen';

export const BEREICHE: { id: Exclude<Bereich, 'macher'>; titel: string; pfad: string }[] = [
  { id: 'heute', titel: 'Heute', pfad: '/heute' },
  { id: 'auftraege', titel: 'Aufträge', pfad: '/auftraege' },
  { id: 'plan', titel: 'Plan', pfad: '/plan' },
  { id: 'betrieb', titel: 'Betrieb', pfad: '/betrieb' },
];

export const BETRIEB_GRUPPEN: { id: BetriebGruppe; titel: string }[] = [
  { id: 'team', titel: 'Team' },
  { id: 'material', titel: 'Material & Einkauf' },
  { id: 'werkzeuge', titel: 'Werkzeuge & Fahrzeuge' },
  { id: 'geld', titel: 'Geld' },
  { id: 'unternehmen', titel: 'Unternehmen' },
];

/** Vorschlag für „Braucht dich“ – live berechnet, nicht gespeichert */
export interface HinweisVorschlag {
  /** stabiler Schlüssel, z. B. `rechnung-ueberfaellig:<id>` */
  schluessel: string;
  art: 'entscheidung' | 'freigabe' | 'problem' | 'info';
  titel: string;
  text?: string;
  bezug?: Bezug;
  /** Pain-Score 1–100 (Frequenz × Intensität). Bestimmt Reihenfolge. */
  gewicht: number;
  fuerRollen?: Rolle[];
  fuerMitarbeiterId?: ID;
  faellig?: string;
  /** Aktionen: `aktion` ist eine in `aktionen` eines Moduls registrierte ID */
  aktionen?: { aktion: string; label: string; primaer?: boolean; payload?: unknown }[];
  /** Pfad, den „Öffnen“ ansteuert */
  pfad?: string;
  /** Akute Sicherheitswarnung (z. B. Gerät mit überfälliger Prüfung: nicht verwenden). Zählt nie gegen ein Mengenlimit. */
  sicherheit?: boolean;
}

export interface Automation {
  id: string;
  titel: string;
  /** Ein Satz: Was passiert automatisch? */
  beschreibung: string;
  /** standardmäßig eingeschaltet? (Opinionated Defaults) */
  standardAn: boolean;
  /** geschätzte gesparte Minuten je Ausführung (wird als Schätzung angezeigt) */
  minuten?: number;
  /** Registriert Event-Handler. Gibt eine Aufräumfunktion zurück. */
  start: () => () => void;
  /** Optional: periodische Prüfung (z. B. täglich überfällige Rechnungen) */
  pruefen?: () => void;
}

export interface Treffer {
  titel: string;
  untertitel?: string;
  pfad: string;
  typ: string; // "Kunde", "Auftrag" …
  /** höhere Werte zuerst */
  relevanz?: number;
}

export interface ObjektTab {
  objekt: SammlungsName;
  titel: string;
  component: ComponentType<{ id: ID }>;
  /** Pain-Gewicht: wichtigere Tabs zuerst */
  gewicht?: number;
  /** z. B. Anzahl Fotos – wird im Tab angezeigt */
  zaehler?: (id: ID) => number | undefined;
  /** Tab nur zeigen, wenn relevant (Progressive Disclosure) */
  sichtbar?: (id: ID) => boolean;
}

/** Kompakter Block in der rechten Spalte / Kopf einer Detailansicht */
export interface ObjektPanel {
  objekt: SammlungsName;
  component: ComponentType<{ id: ID }>;
  gewicht?: number;
}

export interface SchnellAktion {
  id: string;
  label: string;
  icon?: string;
  /** Formular, das ein kontextueller Knopf (`oeffne('schnell', { aktion: id, auftragId })`) direkt öffnet. */
  component: ComponentType<{ fertig: () => void; auftragId?: ID }>;
  gewicht?: number;
}

export interface ModulDef {
  id: string;
  titel: string;
  bereich: Bereich;
  gruppe?: BetriebGruppe;
  /**
   * Eigener Startpfad statt `/<bereich>/<id>` (z. B. `/betrieb/katalog/material`). `routen` sind dann relativ dazu.
   * Frühere Adressen leitet das Modul selbst weiter (`routen` mit absolutem Pfad und `<Navigate>`).
   */
  basisPfad?: string;
  /** Ein Satz in Handwerkersprache */
  beschreibung: string;
  icon?: string;
  /** Pain-Score des Moduls 1–100 – bestimmt Position in Navigation und Hub */
  gewicht?: number;
  /**
   * Ohne Wirkung auf die Navigation: Wo ein Modul erscheint, legt `src/shell/struktur.ts` fest.
   * Bleibt als Hinweis für die Suche erhalten (`versteckt` = technische Seite, nicht als Funktion vorschlagen).
   */
  navigation?: 'haupt' | 'hub' | 'versteckt';
  /** Routen relativ zu `/<bereich>/<id>` – `''` ist die Startansicht. Pfade mit `/` am Anfang sind absolut. */
  routen?: { pfad: string; element: ComponentType }[];
  /** Routen ohne App-Rahmen (Onboarding, Kundenbereich, Terminbuchung für Kunden). Absolute Pfade. */
  vollbildRouten?: { pfad: string; element: ComponentType }[];
  /** Altfeld: wird nicht angezeigt. Widgets fürs Home: `registriereWidget()` (src/os/shell/home/registry.ts, docs/os/HOME.md) */
  hubWidget?: ComponentType;
  /** Kurzer Status, z. B. „3 Prüfungen fällig“; mit `ton: 'achtung'` ggf. als Hinweis auf der Betrieb-Kachel */
  kurzinfo?: () => { text: string; ton?: Ton } | undefined;
  /** Detailansicht eines Objekttyps gehört diesem Modul */
  detail?: { objekt: SammlungsName; pfad: (id: ID) => string }[];
  tabs?: ObjektTab[];
  panels?: ObjektPanel[];
  hinweise?: () => HinweisVorschlag[];
  /** Aktionen für Hinweis-Buttons. Rückgabe: optionaler Pfad zum Navigieren */
  aktionen?: Record<string, (payload: unknown) => string | void>;
  automationen?: Automation[];
  /** Absichten und Aktionen für den Macher AI Gateway (`@core/gateway`) – Module sprechen nie selbst mit einem Modell */
  gateway?: GatewayBeitrag;
  suche?: (q: string) => Treffer[];
  schnell?: SchnellAktion[];
  /** Erstellungsabläufe des Moduls (Verzeichnis, kein Menü). Der Knopf steht im Arbeitskontext. */
  erstellen?: { label: string; pfad: string; gewicht?: number }[];
  /** Global gerenderte Komponente (Overlays, Tastenkürzel …) */
  global?: ComponentType;
  /** Kompakte Zeile oben im Inhalt, im normalen Layoutfluss (z. B. Hinweis „Spielwiese“) – nie schwebend über Daten */
  leiste?: ComponentType;
  /** Beispieldaten für eigene Sammlungen nach dem Onboarding */
  seed?: () => void;
  /** Nur für diese Rollen in der Navigation */
  rollen?: Rolle[];
  /** Einmalige Initialisierung beim App-Start */
  init?: () => void;
}

/** Status-Töne. `gefahr` nur für eine tatsächliche Sperre oder Gefahr („Nicht verwenden“) – immer mit eindeutigem Text. */
export type Ton = 'neutral' | 'aktiv' | 'erfolg' | 'achtung' | 'gefahr';

export function defineModul(def: ModulDef): ModulDef {
  return { gewicht: 50, navigation: 'haupt', ...def };
}

// ------------------------------------------------------------------ Registry

let module: ModulDef[] = [];

export function registriereModule(liste: ModulDef[]) {
  const ids = new Set<string>();
  for (const m of liste) {
    if (ids.has(m.id)) throw new Error(`Modul-ID "${m.id}" ist doppelt.`);
    ids.add(m.id);
  }
  module = [...liste].sort((a, b) => (b.gewicht ?? 50) - (a.gewicht ?? 50));
}

export function alleModule(): ModulDef[] {
  return module;
}

export function modul(id: string): ModulDef | undefined {
  return module.find((m) => m.id === id);
}

export function moduleIn(bereich: Bereich, gruppe?: BetriebGruppe): ModulDef[] {
  return module.filter((m) => m.bereich === bereich && (!gruppe || m.gruppe === gruppe));
}

export function modulPfad(m: ModulDef, unterpfad = ''): string {
  const basis = m.basisPfad ?? (m.bereich === 'macher' ? `/macher/${m.id}` : `/${m.bereich}/${m.id}`);
  return unterpfad ? `${basis}/${unterpfad.replace(/^\//, '')}` : basis;
}

/** Link zu einem beliebigen Objekt – das Modul, das die Detailansicht besitzt, entscheidet. */
export function pfadZu(b: Bezug | undefined): string | undefined {
  if (!b) return undefined;
  for (const m of module) {
    const d = m.detail?.find((x) => x.objekt === b.typ);
    if (d) return d.pfad(b.id);
  }
  return undefined;
}

export function tabsFuer(objekt: SammlungsName): ObjektTab[] {
  return module
    .flatMap((m) => m.tabs ?? [])
    .filter((t) => t.objekt === objekt)
    .sort((a, b) => (b.gewicht ?? 50) - (a.gewicht ?? 50));
}

export function panelsFuer(objekt: SammlungsName): ObjektPanel[] {
  return module
    .flatMap((m) => m.panels ?? [])
    .filter((t) => t.objekt === objekt)
    .sort((a, b) => (b.gewicht ?? 50) - (a.gewicht ?? 50));
}

export function alleSchnellAktionen(): SchnellAktion[] {
  return module.flatMap((m) => m.schnell ?? []).sort((a, b) => (b.gewicht ?? 50) - (a.gewicht ?? 50));
}

/** Eine bestimmte Erfassungsaktion (für kontextuelle Knöpfe wie „Foto hinzufügen“) */
export function schnellAktion(id: string): SchnellAktion | undefined {
  return module.flatMap((m) => m.schnell ?? []).find((s) => s.id === id);
}

/**
 * @deprecated Es gibt kein globales „Neu“-Menü mehr. Die Einträge dokumentieren nur noch, welche
 * Erstellungsabläufe ein Modul anbietet; der Einstieg steht als beschrifteter Knopf im Arbeitskontext.
 */
export function alleErstellen() {
  return module.flatMap((m) => m.erstellen ?? []).sort((a, b) => (b.gewicht ?? 50) - (a.gewicht ?? 50));
}

export function alleAutomationen(): (Automation & { modulId: string })[] {
  return module.flatMap((m) => (m.automationen ?? []).map((a) => ({ ...a, modulId: m.id })));
}

/** Ist eine Aktion registriert? (keine toten Knöpfe anzeigen) */
export function aktionVorhanden(aktion: string): boolean {
  return module.some((m) => !!m.aktionen?.[aktion]);
}

export function aktionAusfuehren(aktion: string, payload: unknown): string | void {
  for (const m of module) {
    const fn = m.aktionen?.[aktion];
    if (fn) return fn(payload);
  }
  console.warn(`Aktion "${aktion}" ist nicht registriert.`);
}

export function sucheUeberall(q: string): Treffer[] {
  if (!q.trim()) return [];
  return module
    .flatMap((m) => {
      try {
        return m.suche?.(q) ?? [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => (b.relevanz ?? 0) - (a.relevanz ?? 0));
}

/** Alle live berechneten Hinweise aller Module */
export function alleHinweisVorschlaege(): HinweisVorschlag[] {
  return module.flatMap((m) => {
    try {
      return m.hinweise?.() ?? [];
    } catch (e) {
      console.error(`Hinweise von Modul ${m.id} fehlgeschlagen`, e);
      return [];
    }
  });
}
