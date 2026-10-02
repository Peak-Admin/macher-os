import type { ObjektSchluessel } from '@/lib/objekte';
/**
 * Datenmodell des Home-Screens („Heute“). Bewusst generisch: Widgets, Aktionen und Arbeitsposten kommen aus
 * verschiedenen Quellen (Kernobjekte, Macher-Hinweise, Inhalte von Mission Mittelstand) und werden hier nur
 * beschrieben – nie kopiert. Jeder Posten verweist über `bezug`/`actionUrl` auf sein Original.
 */
import type { ComponentType } from 'react';
import type { Bezug, ID, Mitarbeiter, Rolle } from '@core/objects';
import type { Recht } from '@core/session';
import type { IconName } from '@ui/index';

// ------------------------------------------------------------------ Dein nächster Schritt

export type NextActionTyp = 'onboarding' | 'anfragen' | 'angebot_versenden' | 'angebot_nachfassen' | 'rechnung_erstellen' | 'rechnung_ueberfaellig' | 'entscheidung' | 'einsatz' | 'aufgabe';

export interface NextAction {
  id: string;
  type: NextActionTyp;
  title: string;
  description: string;
  /** Pain-Score 1–100 (Frequenz × Intensität). Höher = weiter vorn. */
  priority: number;
  icon: IconName;
  /** z. B. Einrichtung: 3 von 4 Schritten */
  progress?: { erledigt: number; gesamt: number; schritte?: { titel: string; erledigt: boolean }[] };
  actionLabel: string;
  actionUrl: string;
  completed: boolean;
  bezug?: Bezug;
}

// ------------------------------------------------------------------ Deine Arbeit

export type WorkItemTyp = 'aufgabe' | 'freigabe' | 'entscheidung' | 'angebot' | 'vertretung' | 'anfrage';
export type WorkItemStatus = 'to_do' | 'in_progress' | 'waiting' | 'ready' | 'completed';

export interface WorkItem {
  id: string;
  type: WorkItemTyp;
  title: string;
  description: string;
  status: WorkItemStatus;
  /** Pain-Score 1–100 */
  priority: number;
  /** ISO-Zeitpunkt der letzten Änderung */
  updatedAt: string;
  projectId?: ID;
  assignedTo?: ID;
  actionLabel: string;
  actionUrl: string;
  ueberfaellig?: boolean;
  beispiel?: boolean;
}

// ------------------------------------------------------------------ Inhalte von Mission Mittelstand

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  company: string;
  /** echtes Foto, sonst Initialen – nie ein Stockfoto */
  avatarUrl?: string;
  zitat?: string;
  messageUrl?: string;
  bookingUrl?: string;
  supportUrl?: string;
  telefon?: string;
  /** Beispielinhalt, bis die echte Zuordnung aus dem Backend kommt */
  beispiel?: boolean;
}

export type NewsTyp = 'news' | 'workshop' | 'product_update' | 'template' | 'guide';

export interface NewsItem {
  id: string;
  type: NewsTyp;
  title: string;
  description: string;
  imageUrl?: string;
  /** YYYY-MM-DD */
  publishedAt: string;
  /** Workshop-Termin (YYYY-MM-DD) */
  eventDate?: string;
  targetAudience?: Rolle[];
  actionLabel: string;
  /** Pfad in der Software (`/…`) oder – mit `extern` – Website/fremde Seite */
  actionUrl: string;
  extern?: boolean;
  beispiel?: boolean;
}

/** Schmaler Banner über dem Home – immer höchstens eine Botschaft */
export interface Ankuendigung {
  id: string;
  oberzeile: string;
  titel: string;
  bildUrl?: string;
  actionLabel: string;
  actionUrl: string;
  extern?: boolean;
  /** sichtbar bis einschließlich (YYYY-MM-DD) */
  bis?: string;
  targetAudience?: Rolle[];
  beispiel?: boolean;
}

// ------------------------------------------------------------------ Widgets & Layout

/** klein = eine Spalte, groß = volle Breite (beide Spalten) */
export type WidgetGroesse = 'klein' | 'gross';
export type Spalte = 'links' | 'rechts';

export type WidgetKategorie = 'kern' | 'tag' | 'eingang' | 'geld' | 'team' | 'werkzeuge';

export const KATEGORIE_TITEL: Record<WidgetKategorie, string> = {
  kern: 'Das Wichtigste',
  tag: 'Tag & Planung',
  eingang: 'Eingang & Entscheidungen',
  geld: 'Geld',
  team: 'Team & Betrieb',
  werkzeuge: 'Abkürzungen',
};

export interface WidgetProps {
  groesse: WidgetGroesse;
  ich: Mitarbeiter;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  /** Kleines Werkzeug-Objekt im Kopf (docs/design/visual-assets.md) – nur bei wenigen, wichtigen Widgets */
  objekt?: ObjektSchluessel;
  kategorie: WidgetKategorie;
  component: ComponentType<WidgetProps>;
  availableSizes: WidgetGroesse[];
  defaultSize: WidgetGroesse;
  /** Standardspalte, wenn das Widget hinzugefügt wird */
  defaultSpalte?: Spalte;
  /** nur für diese Rollen */
  roles?: Rolle[];
  /** nötige Rechte (alle) */
  permissions?: Recht[];
  /** nur, wenn dieses Modul installiert ist */
  modul?: string;
  /** Link unter dem Widget („Alle ansehen →“) */
  alle?: { label: string; pfad: string };
  /** eigener Kopf statt Titelzeile (z. B. Einsatz) */
  ohneTitel?: boolean;
}

export interface WidgetEintrag {
  widgetId: string;
  visible: boolean;
  order: number;
  size: WidgetGroesse;
  spalte: Spalte;
}

export interface HomeLayout {
  userId: ID;
  /** Version des Formats – für spätere Migrationen */
  version: 1;
  widgets: WidgetEintrag[];
  /** vom Nutzer gespeichert (sonst Standard der Rolle) */
  angepasst?: boolean;
}
