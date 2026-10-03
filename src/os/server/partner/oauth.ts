/**
 * POST /v1/oauth/token – OAuth 2.0 Client Credentials (RFC 6749 §4.4).
 *
 *   grant_type=client_credentials & client_id=<Zugang-ID> & client_secret=<hos_…>
 *   (als Formular, JSON oder per HTTP Basic) → { access_token: "hot_…", token_type: "Bearer", expires_in: 900 }
 *
 * Fehler im OAuth-Format: `{ error: "invalid_client" | "invalid_request" | "unsupported_grant_type" }`.
 */
import { sha256Hex, SCHLUESSEL_PRAEFIX, type PartnerSpeicher } from './dienst';
import { tokenAusstellen, TOKEN_DAUER } from './token';

export interface TokenAntwort {
  status: number;
  body: Record<string, unknown>;
}

const fehler = (status: number, error: string, error_description: string): TokenAntwort => ({ status, body: { error, error_description } });

/** Felder aus Formular, JSON oder `Authorization: Basic` lesen */
export function tokenFelder(inhalt: string, contentType: string | null, autorisierung: string | null): Record<string, string> {
  const felder: Record<string, string> = {};
  if (contentType?.includes('application/json')) {
    try {
      const j = JSON.parse(inhalt) as unknown;
      if (j && typeof j === 'object' && !Array.isArray(j)) for (const [k, v] of Object.entries(j)) if (typeof v === 'string') felder[k] = v;
    } catch {
      /* leer lassen → invalid_request */
    }
  } else for (const [k, v] of new URLSearchParams(inhalt)) felder[k] = v;
  const basic = autorisierung?.match(/^basic\s+(.+)$/i)?.[1];
  if (basic) {
    try {
      const [id, ...rest] = atob(basic.trim()).split(':');
      felder.client_id ??= decodeURIComponent(id);
      felder.client_secret ??= decodeURIComponent(rest.join(':'));
    } catch {
      /* ungültiges Basic → wie ohne */
    }
  }
  return felder;
}

export async function tokenAnfrage(
  felder: Record<string, string>,
  s: Pick<PartnerSpeicher, 'zugangNachHash'>,
  geheimnis: string,
  jetzt = new Date(),
): Promise<TokenAntwort> {
  if (!felder.grant_type) return fehler(400, 'invalid_request', 'grant_type fehlt.');
  if (felder.grant_type !== 'client_credentials') return fehler(400, 'unsupported_grant_type', 'Nur client_credentials wird unterstützt.');
  const id = felder.client_id?.trim();
  const geheim = felder.client_secret?.trim();
  if (!id || !geheim) return fehler(400, 'invalid_request', 'client_id und client_secret angeben.');
  const zugang = geheim.startsWith(SCHLUESSEL_PRAEFIX) ? await s.zugangNachHash(await sha256Hex(geheim)) : undefined;
  if (!zugang || zugang.id !== id || zugang.widerrufen_am) return fehler(401, 'invalid_client', 'Zugang unbekannt, widerrufen oder Schlüssel falsch.');
  const { token } = await tokenAusstellen(zugang.id, geheimnis, jetzt);
  return { status: 200, body: { access_token: token, token_type: 'Bearer', expires_in: TOKEN_DAUER } };
}
