/**
 * Integrations-Anfragen: Will jemand etwas verbinden, das Macher OS noch nicht kann, wird daraus eine Anfrage.
 * Es gibt keine „Kommt“-Phase – wir prüfen die Anfrage intern und bauen die Verbindung dann direkt
 * (Bauplan: `docs/os/INTEGRATIONEN.md`).
 *
 * Jede Anfrage existiert genau einmal je Integration (ID = Connector-ID) und landet als Ereignis
 * `integrationsanfragen.created` in der Timeline. Versand: direkt aus der App über `/api/integrationen/anfrage`
 * (Resend, fester Empfänger); ist der Versand nicht eingerichtet, öffnet sich das Mail-Programm (`anfrageMailto`).
 */
import { db, defineCollection } from '@core/db';
import type { Basis } from '@core/objects';

/** Postfach des Integrationsteams (wie „Schnittstelle anfragen“ auf der Website) */
export const INTEGRATION_EMAIL = 'partner@macher-os.de';

export interface Integrationsanfrage extends Basis {
  /** Name der Integration, z. B. „Gmail“ */
  titel: string;
  /** was der Betrieb damit vorhat (optional) */
  notiz?: string;
}

export const integrationsanfragen = defineCollection<Integrationsanfrage>('integrationsanfragen');

export function anfrage(connectorId: string): Integrationsanfrage | undefined {
  return integrationsanfragen.get(connectorId);
}

/** Anfrage speichern (eine je Integration – erneutes Senden aktualisiert die Notiz) */
export function anfrageSpeichern(connectorId: string, titel: string, notiz?: string): Integrationsanfrage {
  const n = notiz?.trim() || undefined;
  if (integrationsanfragen.get(connectorId)) integrationsanfragen.update(connectorId, { titel, notiz: n }, { text: `Erneut angefragt: ${titel}` });
  else integrationsanfragen.create({ id: connectorId, titel, notiz: n });
  return integrationsanfragen.get(connectorId)!;
}

/** Fertige E-Mail an das Integrationsteam – mit Betrieb und Wunsch, ohne weitere Daten */
export function anfrageMailto(titel: string, notiz?: string): string {
  const b = db.betrieb.get('betrieb');
  const betreff = `Integration anfragen: ${titel}`;
  const text = [
    `Hallo Macher-Team,`,
    ``,
    `wir möchten ${titel} mit Macher OS verbinden.`,
    notiz?.trim() ? `\nWofür: ${notiz.trim()}` : '',
    ``,
    `Betrieb: ${b?.name ?? '–'}`,
    b?.email ? `E-Mail: ${b.email}` : '',
    b?.telefon ? `Telefon: ${b.telefon}` : '',
  ]
    .filter((z, i, a) => z !== '' || a[i - 1] !== '')
    .join('\n');
  return `mailto:${INTEGRATION_EMAIL}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}

export type VersandErgebnis = { ok: true } | { ok: false; mailto: string; fehler?: string };

/** Anfrage direkt senden; ohne eingerichteten Versand (501) oder bei Netzfehler: Mail-Programm als Rückfall */
export async function anfrageSenden(titel: string, notiz?: string, f: typeof fetch = globalThis.fetch): Promise<VersandErgebnis> {
  const b = db.betrieb.get('betrieb');
  const mailto = anfrageMailto(titel, notiz);
  try {
    const r = await f('/api/integrationen/anfrage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ integration: titel, notiz: notiz?.trim() || undefined, betrieb: { name: b?.name, email: b?.email, telefon: b?.telefon } }),
    });
    if (r.ok) return { ok: true };
    const d = (await r.json().catch(() => ({}))) as { fehler?: string };
    return { ok: false, mailto, fehler: r.status === 501 ? undefined : d.fehler };
  } catch {
    return { ok: false, mailto };
  }
}
