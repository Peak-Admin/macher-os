/**
 * Webhooks: andere Programme bei fachlichen Ereignissen benachrichtigen (z. B. „Rechnung bezahlt“).
 *
 * Die Oberfläche (`Webhooks.tsx`) arbeitet nur gegen `WebhookQuelle`. Standard ist `kernQuelle`, ein Adapter auf
 * den Kern (`@core/ereignisse`): Katalog = `ereignisKatalog()`, Abos = Sammlung `webhooks`, Zustellung über die
 * Warteschlange `webhook_auslieferungen`. Es gibt genau eine Abo-Sammlung. Ältere Abos aus der Einstellung
 * `schnittstellen.webhooks` übernimmt `alteAbosUebernehmen()` einmal beim Start (Modul-`init`).
 *
 * Nutzlast und Kopfzeilen jeder Zustellung: `webhookNutzlast` im Kern
 * (`{ id, type, event, created_at, source, actor, object: { type, id, data }, data }`).
 * Kopfzeilen: `x-macher-ereignis: <API-Name>` (z. B. `invoice.paid`),
 * `x-macher-signatur: sha256=<HMAC-SHA256(geheimnis, body) hex>` (`webhookSignatur` in `src/os/server/signatur.ts`).
 */
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { cloudAktiv } from '@core/cloud';
import {
  apiName,
  ereignisAbonniert,
  ereignisGruppe,
  ereignisKatalog,
  webhookAnlegen,
  webhooks as kernWebhooks,
  webhookUrlPruefen,
  webhookVersandAktiv,
  type Webhook,
} from '@core/ereignisse';
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

/** Was die Oberfläche braucht – `kernQuelle` bildet es auf `@core/ereignisse` ab */
export interface WebhookQuelle {
  katalog(): EreignisTyp[];
  abos(): WebhookAbo[];
  /** legt das Abo an und gibt das Signatur-Geheimnis EINMAL zurück */
  anlegen(neu: NeuesAbo): { abo: WebhookAbo; geheimnis: string };
  aendern(id: ID, patch: Partial<Pick<WebhookAbo, 'url' | 'ereignisse' | 'aktiv' | 'beschreibung'>>): void;
  entfernen(id: ID): void;
  /** werden Webhooks gerade wirklich zugestellt (Versender angebunden)? */
  zustellungAktiv(): boolean;
}

/** Alte Ablage der Abos (vor dem Kern-Adapter) – wird beim Start einmal in den Kern übernommen */
const ALT_SCHLUESSEL = 'schnittstellen.webhooks';
/**
 * Signatur-Geheimnisse je Webhook-ID. Sie stehen nicht im Webhook selbst (der landet im Verlauf, im Datenexport und in
 * der Nutzlast-Kurzfassung), sondern in den Einstellungen – ohne Feldprotokoll und ohne Export. Die Zustellung liest
 * sie über `webhookGeheimnis(id)`.
 */
const GEHEIMNIS_SCHLUESSEL = 'schnittstellen.webhook-geheimnisse';

/** Zufälliges Signatur-Geheimnis (hex, 32 Byte) */
export function neuesGeheimnis(): string {
  const b = new Uint8Array(32);
  globalThis.crypto.getRandomValues(b);
  return `whsec_${[...b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Ziel-Adresse prüfen (strenger als der Kern: keine Zugangsdaten, nur aus dem Internet erreichbar).
 * Gibt einen Satz zurück, wenn etwas nicht passt.
 */
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

/** Passt ein Ereignis zu einem Abo? (`*` = alle, `rechnung.*` = alle zur Rechnung) – dieselbe Regel wie im Kern */
export function abonniert(abo: Pick<WebhookAbo, 'ereignisse' | 'aktiv'>, typ: string): boolean {
  return abo.aktiv && ereignisAbonniert(abo.ereignisse, { typ, api: apiName(typ) });
}

/** Signatur-Geheimnis eines Webhooks (für die Zustellung, nie für die Oberfläche) */
export function webhookGeheimnis(id: ID): string | undefined {
  return einstellung<Record<ID, string>>(GEHEIMNIS_SCHLUESSEL, {})[id];
}

function geheimnisMerken(id: ID, geheimnis: string | undefined) {
  const alle = { ...einstellung<Record<ID, string>>(GEHEIMNIS_SCHLUESSEL, {}) };
  if (geheimnis) alle[id] = geheimnis;
  else delete alle[id];
  setzeEinstellung(GEHEIMNIS_SCHLUESSEL, alle);
}

const hostVon = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

function alsAbo(w: Webhook): WebhookAbo {
  return {
    id: w.id,
    url: w.url,
    ereignisse: w.ereignisse,
    aktiv: w.aktiv,
    beschreibung: w.name && w.name !== hostVon(w.url) ? w.name : undefined,
    angelegtAm: w.erstelltAm,
    geheimnisEnde: w.geheimnisEnde ?? '',
    letzteZustellung: w.letzterFehler ? { am: w.geaendertAm, ok: false, fehler: w.letzterFehler } : w.zuletztZugestelltAm ? { am: w.zuletztZugestelltAm, ok: true } : undefined,
  };
}

/** Katalog des Kerns für die Auswahl – eine Quelle für alle Ereignisnamen */
export function katalogAusKern(): EreignisTyp[] {
  return ereignisKatalog().map((a) => ({ typ: a.typ, titel: a.titel, gruppe: ereignisGruppe(a.typ) }));
}

/** Adapter auf den Kern: Abos sind die Sammlung `webhooks`, zugestellt wird über `webhook_auslieferungen` */
export const kernQuelle: WebhookQuelle = {
  katalog: katalogAusKern,
  abos: () => kernWebhooks.all().map(alsAbo),
  anlegen(neu) {
    const geheimnis = neuesGeheimnis();
    const url = neu.url.trim();
    const w = webhookAnlegen({ name: neu.beschreibung?.trim() || hostVon(url), url, ereignisse: neu.ereignisse, geheimnisEnde: geheimnis.slice(-4) });
    geheimnisMerken(w.id, geheimnis);
    return { abo: alsAbo(w), geheimnis };
  },
  aendern(id, patch) {
    const w = kernWebhooks.get(id);
    if (!w) return;
    const p: Partial<Webhook> = {};
    if (patch.url !== undefined) {
      const fehler = webhookUrlPruefen(patch.url);
      if (fehler) throw new Error(fehler);
      p.url = patch.url.trim();
    }
    if (patch.ereignisse !== undefined) p.ereignisse = patch.ereignisse;
    if (patch.aktiv !== undefined) p.aktiv = patch.aktiv;
    if (patch.beschreibung !== undefined) p.name = patch.beschreibung.trim() || hostVon(p.url ?? w.url);
    kernWebhooks.update(id, p);
  },
  entfernen(id) {
    kernWebhooks.remove(id);
    geheimnisMerken(id, undefined);
  },
  zustellungAktiv: webhookVersandAktiv,
};

/**
 * Einmalige Übernahme: Abos, die vor dem Kern-Adapter als Einstellung gespeichert wurden, in die Kern-Sammlung
 * `webhooks` übernehmen (gleiche ID, das Geheimnis bleibt gültig). Idempotent. Gibt die Anzahl übernommener Abos zurück.
 */
export function alteAbosUebernehmen(): number {
  const alt = einstellung<(WebhookAbo & { geheimnis?: string })[]>(ALT_SCHLUESSEL, []);
  if (!Array.isArray(alt) || !alt.length) return 0;
  let n = 0;
  const offen: typeof alt = [];
  for (const a of alt) {
    try {
      if (!kernWebhooks.allMitGeloeschten().some((w) => w.id === a.id)) {
        webhookAnlegen({ id: a.id, name: a.beschreibung || hostVon(a.url), url: a.url, ereignisse: a.ereignisse, aktiv: a.aktiv, geheimnisEnde: a.geheimnisEnde || a.geheimnis?.slice(-4) });
        n++;
      }
      if (a.geheimnis && !webhookGeheimnis(a.id)) geheimnisMerken(a.id, a.geheimnis);
    } catch {
      // z. B. Lesemodus oder ungültige Adresse – bleibt in der alten Ablage, nächster Start versucht es erneut
      offen.push(a);
    }
  }
  setzeEinstellung(ALT_SCHLUESSEL, offen);
  return n;
}

let quelle: WebhookQuelle = kernQuelle;

/** Andere Quelle anschließen (Tests, Server) – Standard ist der Kern-Adapter */
export function setzeWebhookQuelle(q: WebhookQuelle) {
  quelle = q;
}

export const webhookQuelle = () => quelle;

/** Text zum Zustand der Zustellung */
export function zustellungText(q: WebhookQuelle = quelle): string {
  if (q.zustellungAktiv()) return 'Wird zugestellt';
  return cloudAktiv() ? 'Zustellung wird gerade eingerichtet' : 'Wird zugestellt, sobald Handwerk OS mit der Cloud verbunden ist';
}
