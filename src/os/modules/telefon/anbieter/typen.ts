/**
 * Anschluss eines Telefon-/Voice-Anbieters (sipgate, Twilio, Vapi, Retell, ElevenLabs …) an den Telefonassistenten.
 *
 * Macher OS spricht nie direkt mit einem Anbieter. Ein Adapter (`TelefonAnbieter`) übersetzt in beide Richtungen:
 *  - hin:   die anbieterneutrale `AgentDefinition` (Ansage, Anweisung, Fragen, Ziel-Schema, Werkzeuge, Weiterleitung)
 *           in die Agent-Konfiguration des Anbieters (`einrichten`),
 *  - zurück: die Webhooks des Anbieters in normalisierte `TelefonEreignis`se (`eingangLesen`).
 *
 * Alles hinter dem Adapter (Kunde erkennen, Anfrage/Rückruf anlegen, Notfall an die Bereitschaft) ist Macher-Logik
 * und für jeden Anbieter gleich. Doku: `docs/os/KI-TELEFONIE.md`.
 *
 * Diese Datei enthält nur Typen – sie darf auch vom Server (Route `/api/telefon/eingang`) importiert werden.
 */
import type { AnrufDringlichkeit, AnrufDetails } from '@core/objects';

/** Felder, die der Assistent abfragen kann (Reihenfolge und Auswahl legt der Betrieb fest) */
export type FrageId = 'anliegen' | 'name' | 'adresse' | 'dringlichkeit' | 'rueckrufnummer' | 'erreichbarkeit';

export type TranskriptZeile = NonNullable<AnrufDetails['transkript']>[number];

/** Wann Macher rangeht */
export type Annahme = 'immer' | 'keiner' | 'ausserhalb' | 'ausserhalb_keiner';

/** Werkzeuge, die der Assistent während des Gesprächs aufrufen darf */
export type WerkzeugName = 'kunde_suchen' | 'anfrage_anlegen' | 'rueckruf_anlegen' | 'an_bereitschaft_weiterleiten';

/** Capability-Klasse nach Constitution §28 – der Telefonassistent bekommt nur READ und WRITE */
export type Capability = 'READ' | 'WRITE';

/** JSON-Schema (Teilmenge, die alle gängigen Anbieter verstehen) */
export interface JsonSchema {
  type: 'object' | 'string' | 'boolean' | 'number';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: string[];
  additionalProperties?: boolean;
}

export interface WerkzeugDef {
  name: WerkzeugName;
  beschreibung: string;
  parameter: JsonSchema;
  capability: Capability;
  /** Aktion im Macher AI Gateway, die das Werkzeug ausführt (`docs/os/KI-GATEWAY.md`) */
  aktion: string;
}

/** Was Macher dem Anbieter übergibt – anbieterneutral, vollständig aus Konfiguration + Betriebsdaten erzeugt */
export interface AgentDefinition {
  version: 1;
  sprache: 'de-DE';
  firma: string;
  /** erster Satz im Gespräch – nennt immer „digitaler Assistent“ (EU AI Act, Art. 50) */
  ansage: string;
  /** Systemprompt / Gesprächsanweisung */
  anweisung: string;
  fragen: { id: FrageId; frage: string }[];
  /** Ziel-Schema: diese Felder liefert der Anbieter am Gesprächsende in `AnrufErgebnis.felder` */
  zielSchema: JsonSchema;
  werkzeuge: WerkzeugDef[];
  notfallStichworte: string[];
  /** Live-Weiterleitung bei Notfall (Bereitschaft) */
  weiterleitung?: { nummer: string; name?: string };
  annahme: { modus: Annahme; nachSekunden: number; geschaeftszeiten: string };
  /** Gesprächsdauer begrenzen – Kosten und Missbrauch */
  maxDauerSekunden: number;
}

/**
 * Was der Adapter am Gesprächsende liefern muss (normalisiert).
 * Pflicht: `anrufId`, `anbieter`, `von`, `beginn`, `felder`. Alles andere, soweit der Anbieter es kann.
 */
export interface AnrufErgebnis {
  /** Gesprächs-ID beim Anbieter – Macher erkennt damit doppelte Zustellungen */
  anrufId: string;
  anbieter: string;
  /** Nummer des Anrufers; leer, wenn unterdrückt */
  von: string;
  /** angerufene Nummer (Betrieb) */
  an?: string;
  /** ISO-Zeitpunkt */
  beginn: string;
  dauerSekunden?: number;
  /** abgefragte Felder laut `AgentDefinition.zielSchema` */
  felder: Partial<Record<FrageId, string>>;
  zusammenfassung?: string;
  /** Einschätzung des Assistenten – ergänzend; Macher prüft Notfälle zuerst selbst über die Stichworte */
  dringlichkeit?: AnrufDringlichkeit;
  /** Vorschlag des Assistenten für den nächsten Schritt */
  ergebnis?: 'anfrage' | 'rueckruf' | 'notiz';
  /** wurde der Anruf schon im Gespräch an die Bereitschaft durchgestellt? */
  weitergeleitet?: boolean;
  transkript?: TranskriptZeile[];
}

/** Normalisierte Ereignisse aus dem Eingangs-Webhook */
export type TelefonEreignis =
  | { typ: 'anruf.begonnen'; anrufId: string; anbieter: string; von: string; an?: string; zeit: string }
  | { typ: 'anruf.beendet'; ergebnis: AnrufErgebnis }
  /** Werkzeugaufruf mitten im Gespräch (z. B. `kunde_suchen`) – Antwort über `werkzeugAntwort` */
  | { typ: 'werkzeug.aufgerufen'; anrufId: string; anbieter: string; werkzeug: WerkzeugName; argumente: Record<string, unknown> };

export interface TelefonAnbieter {
  /** z. B. `simulator`, später `sipgate`, `twilio`, `vapi`, `retell`, `elevenlabs` */
  id: string;
  name: string;
  /** Agent beim Anbieter anlegen oder aktualisieren */
  einrichten(agent: AgentDefinition): Promise<{ ok: boolean; agentId?: string; fehler?: string }>;
  /** Echtheit eines Webhooks prüfen (Signatur des Anbieters) */
  pruefeSignatur(anfrage: { kopf: Record<string, string>; rohText: string }, geheimnis: string): boolean | Promise<boolean>;
  /** Webhook-Nutzlast → normalisierte Ereignisse (unbekannte Ereignisse: leere Liste) */
  eingangLesen(nutzlast: unknown): TelefonEreignis[];
  /** Antwort auf einen Werkzeugaufruf in das Format des Anbieters bringen */
  werkzeugAntwort?(werkzeug: WerkzeugName, ergebnis: unknown): unknown;
}
