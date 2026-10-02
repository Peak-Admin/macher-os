/**
 * Webhooks: andere Programme bei fachlichen Ereignissen benachrichtigen (z. B. „Rechnung bezahlt“).
 *
 * ┌─ Vertrag zum Zusammenführen ──────────────────────────────────────────────────────────────────────┐
 * │ Die Oberfläche (`Webhooks.tsx`) arbeitet NUR gegen `WebhookQuelle`. Der Kern bekommt einen          │
 * │ Event-Katalog (`src/os/core/ereignisse.ts`) und eine Webhook-Abo-Sammlung. Beim Zusammenführen      │
 * │ genügt ein Adapter, der diese auf `WebhookQuelle` abbildet, und ein Aufruf                          │
 * │   `setzeWebhookQuelle(kernAdapter)` (z. B. im `init` dieses Moduls).                                │
 * │ Bis dahin speichert `lokaleQuelle` die Abos als Einstellung und liefert einen Katalog mit den        │
 * │ vereinbarten Ereignisnamen. Zugestellt wird erst serverseitig (signiert, siehe `webhookSignatur`). │
 * └───────────────────────────────────────────────────────────────────────────────────────────────────┘
 */
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { cloudAktiv } from '@core/cloud';
import { neueId } from '@core/db';
import type { ID, Zeitpunkt } from '@core/objects';

/** Ein Eintrag im Ereignis-Katalog */
export interface EreignisTyp {
  /** `<objekt>.<partizip>`, z. B. `rechnung.bezahlt` */
  typ: string;
  /** für Menschen, z. B. „Rechnung bezahlt“ */
  titel: string;
  /** Gruppe für die Auswahl, z. B. „Geld“ */
  gruppe: string;
}

export interface Zustellung {
  am: Zeitpunkt;
  ok: boolean;
  /** HTTP-Status der Gegenseite */
  status?: number;
  fehler?: string;
}

export interface WebhookAbo {
  id: ID;
  /** Ziel – nur https */
  url: string;
  /** abonnierte Ereignis-Typen; `*` = alle */
  ereignisse: string[];
  aktiv: boolean;
  beschreibung?: string;
  angelegtAm: Zeitpunkt;
  /** letzte vier Zeichen des Geheimnisses – zum Wiedererkennen, nie das ganze */
  geheimnisEnde: string;
  letzteZustellung?: Zustellung;
}

export interface NeuesAbo {
  url: string;
  ereignisse: string[];
  beschreibung?: string;
}

/** Was die Oberfläche braucht – der Kern liefert später einen Adapter dafür */
export interface WebhookQuelle {
  katalog(): EreignisTyp[];
  abos(): WebhookAbo[];
  /** legt das Abo an und gibt das Signatur-Geheimnis EINMAL zurück */
  anlegen(neu: NeuesAbo): { abo: WebhookAbo; geheimnis: string };
  aendern(id: ID, patch: Partial<Pick<WebhookAbo, 'url' | 'ereignisse' | 'aktiv' | 'beschreibung'>>): void;
  entfernen(id: ID): void;
  /** werden Webhooks gerade wirklich zugestellt (Server verbunden)? */
  zustellungAktiv(): boolean;
}

/**
 * Nutzlast jeder Zustellung (JSON, POST). Kopfzeilen:
 * `x-macher-ereignis: <typ>`, `x-macher-signatur: sha256=<HMAC-SHA256(geheimnis, body) hex>`.
 */
export interface WebhookNutzlast {
  /** eindeutige Zustell-ID (für Dubletten auf der Gegenseite) */
  id: string;
  typ: string;
  zeitpunkt: Zeitpunkt;
  betriebId?: ID;
  objekt?: { typ: string; id: ID };
  daten?: unknown;
}

/** Vereinbarte Ereignisnamen (Briefing) – Rückfall, bis der Kern-Katalog angeschlossen ist */
export const STANDARD_KATALOG: EreignisTyp[] = [
  { typ: 'anfrage.eingegangen', titel: 'Anfrage eingegangen', gruppe: 'Vertrieb' },
  { typ: 'angebot.versendet', titel: 'Angebot versendet', gruppe: 'Vertrieb' },
  { typ: 'angebot.angenommen', titel: 'Angebot angenommen', gruppe: 'Vertrieb' },
  { typ: 'auftrag.angelegt', titel: 'Auftrag angelegt', gruppe: 'Aufträge' },
  { typ: 'auftrag.eingeplant', titel: 'Auftrag eingeplant', gruppe: 'Aufträge' },
  { typ: 'auftrag.schritt_gewechselt', titel: 'Auftrag im nächsten Schritt', gruppe: 'Aufträge' },
  { typ: 'auftrag.abgeschlossen', titel: 'Auftrag abgeschlossen', gruppe: 'Aufträge' },
  { typ: 'einsatz.gestartet', titel: 'Einsatz gestartet', gruppe: 'Aufträge' },
  { typ: 'einsatz.beendet', titel: 'Einsatz beendet', gruppe: 'Aufträge' },
  { typ: 'abnahme.unterschrieben', titel: 'Abnahme unterschrieben', gruppe: 'Aufträge' },
  { typ: 'rechnung.erstellt', titel: 'Rechnung erstellt', gruppe: 'Geld' },
  { typ: 'rechnung.versendet', titel: 'Rechnung versendet', gruppe: 'Geld' },
  { typ: 'rechnung.bezahlt', titel: 'Rechnung bezahlt', gruppe: 'Geld' },
  { typ: 'rechnung.ueberfaellig', titel: 'Rechnung überfällig', gruppe: 'Geld' },
  { typ: 'zahlung.eingegangen', titel: 'Zahlung eingegangen', gruppe: 'Geld' },
  { typ: 'mitarbeiter.abwesend', titel: 'Mitarbeiter abwesend', gruppe: 'Team' },
  { typ: 'material.knapp', titel: 'Material knapp', gruppe: 'Material' },
  { typ: 'import.abgeschlossen', titel: 'Import abgeschlossen', gruppe: 'Daten' },
];

const SCHLUESSEL = 'schnittstellen.webhooks';

/** Zufälliges Signatur-Geheimnis (hex, 32 Byte) */
export function neuesGeheimnis(): string {
  const b = new Uint8Array(32);
  globalThis.crypto.getRandomValues(b);
  return `whsec_${[...b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** Ziel-Adresse prüfen. Gibt einen Satz zurück, wenn etwas nicht passt. */
export function urlPruefen(url: string): string | undefined {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return 'Trag eine vollständige Adresse ein, z. B. https://example.de/macher.';
  }
  if (u.protocol !== 'https:') return 'Die Adresse muss mit https:// beginnen – sonst sind deine Daten unterwegs lesbar.';
  if (u.username || u.password) return 'Zugangsdaten gehören nicht in die Adresse.';
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) return 'Die Adresse muss aus dem Internet erreichbar sein.';
  return undefined;
}

export function ereignissePruefen(ereignisse: string[], katalog: EreignisTyp[]): string | undefined {
  if (!ereignisse.length) return 'Wähl mindestens ein Ereignis.';
  const bekannt = new Set(katalog.map((k) => k.typ));
  const fremd = ereignisse.filter((e) => e !== '*' && !bekannt.has(e));
  return fremd.length ? `Unbekannte Ereignisse: ${fremd.join(', ')}` : undefined;
}

/** Passt ein Ereignis zu einem Abo? (`*` = alle, `rechnung.*` = alle zur Rechnung) */
export function abonniert(abo: Pick<WebhookAbo, 'ereignisse' | 'aktiv'>, typ: string): boolean {
  if (!abo.aktiv) return false;
  return abo.ereignisse.some((e) => e === '*' || e === typ || (e.endsWith('.*') && typ.startsWith(e.slice(0, -1))));
}

type Gespeichert = WebhookAbo & { geheimnis: string };

/** Abo ohne Geheimnis (für die Oberfläche) */
function ohneGeheimnis(a: Gespeichert): WebhookAbo {
  const kopie: Partial<Gespeichert> = { ...a };
  delete kopie.geheimnis;
  return kopie as WebhookAbo;
}

/** Rückfall ohne Kern-Sammlung: Abos als Einstellung (Geheimnis bleibt für die spätere Zustellung gespeichert) */
export const lokaleQuelle: WebhookQuelle = {
  katalog: () => STANDARD_KATALOG,
  abos: () => einstellung<Gespeichert[]>(SCHLUESSEL, []).map(ohneGeheimnis),
  anlegen(neu) {
    const geheimnis = neuesGeheimnis();
    const abo: Gespeichert = {
      id: neueId('wh'),
      url: neu.url.trim(),
      ereignisse: neu.ereignisse,
      beschreibung: neu.beschreibung?.trim() || undefined,
      aktiv: true,
      angelegtAm: new Date().toISOString(),
      geheimnisEnde: geheimnis.slice(-4),
      geheimnis,
    };
    setzeEinstellung(SCHLUESSEL, [...einstellung<Gespeichert[]>(SCHLUESSEL, []), abo]);
    return { abo: ohneGeheimnis(abo), geheimnis };
  },
  aendern(id, patch) {
    setzeEinstellung(
      SCHLUESSEL,
      einstellung<Gespeichert[]>(SCHLUESSEL, []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  },
  entfernen(id) {
    setzeEinstellung(
      SCHLUESSEL,
      einstellung<Gespeichert[]>(SCHLUESSEL, []).filter((a) => a.id !== id),
    );
  },
  // Die Zustellung braucht den Server; bis der Kern sie anbietet, ist sie aus
  zustellungAktiv: () => false,
};

let quelle: WebhookQuelle = lokaleQuelle;

/** Kern-Adapter anschließen (beim Zusammenführen) */
export function setzeWebhookQuelle(q: WebhookQuelle) {
  quelle = q;
}

export const webhookQuelle = () => quelle;

/** Text zum Zustand der Zustellung */
export function zustellungText(q: WebhookQuelle = quelle): string {
  if (q.zustellungAktiv()) return 'Wird zugestellt';
  return cloudAktiv() ? 'Zustellung wird gerade eingerichtet' : 'Wird zugestellt, sobald Macher OS mit der Cloud verbunden ist';
}
