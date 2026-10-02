/**
 * Integrations-Anfragen: Will jemand etwas verbinden, das Macher OS noch nicht kann, wird daraus eine Anfrage.
 * Es gibt keine „Kommt“-Phase – wir prüfen die Anfrage intern und bauen die Verbindung dann direkt
 * (Bauplan: `docs/os/INTEGRATIONEN.md`).
 *
 * Jede Anfrage existiert genau einmal je Integration (ID = Connector-ID) und landet als Ereignis
 * `integrationsanfragen.created` in der Timeline. Versand: per E-Mail an das Integrationsteam.
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
