/**
 * Kurzlebige Zugriffstoken für Partner (OAuth 2.0 Client Credentials).
 *
 * Der Partner tauscht `client_id` (Zugang) + `client_secret` (API-Schlüssel `hos_…`) gegen ein Token `hot_…`,
 * das 15 Minuten gilt. So muss der dauerhafte Schlüssel nicht bei jedem Aufruf mitgeschickt werden.
 *
 * Aufbau: `hot_<zugangId>.<ablauf in s>.<HMAC-SHA256(geheimnis, "<zugangId>.<ablauf>")>` – zustandslos, nichts in der
 * Datenbank. Widerruf des Zugangs wirkt sofort, weil `bearbeite` den Zugang bei jedem Aufruf neu lädt.
 */
import { gleich, hmacSha256Hex } from '@/os/server/signatur';

export const TOKEN_PRAEFIX = 'hot_';
/** Gültigkeit in Sekunden */
export const TOKEN_DAUER = 15 * 60;

export async function tokenAusstellen(zugangId: string, geheimnis: string, jetzt = new Date(), dauer = TOKEN_DAUER): Promise<{ token: string; ablauf: number }> {
  const ablauf = Math.floor(jetzt.getTime() / 1000) + dauer;
  const sig = await hmacSha256Hex(geheimnis, `${zugangId}.${ablauf}`);
  return { token: `${TOKEN_PRAEFIX}${zugangId}.${ablauf}.${sig}`, ablauf };
}

/** Zugang-ID, wenn das Token echt und nicht abgelaufen ist */
export async function tokenPruefen(token: string, geheimnis: string, jetzt = new Date()): Promise<string | undefined> {
  if (!token.startsWith(TOKEN_PRAEFIX)) return undefined;
  const [zugangId, ablaufText, sig] = token.slice(TOKEN_PRAEFIX.length).split('.');
  const ablauf = Number(ablaufText);
  if (!zugangId || !sig || !Number.isInteger(ablauf)) return undefined;
  if (ablauf <= Math.floor(jetzt.getTime() / 1000)) return undefined;
  return gleich(sig, await hmacSha256Hex(geheimnis, `${zugangId}.${ablauf}`)) ? zugangId : undefined;
}

/** Geheimnis für die Token: eigene Variable, sonst abgeleitet vom Service-Key (bleibt auf dem Server) */
export async function tokenGeheimnis(serviceKey: string, eigenes?: string): Promise<string> {
  return eigenes || hmacSha256Hex(serviceKey, 'handwerk-os/partner-token/v1');
}
