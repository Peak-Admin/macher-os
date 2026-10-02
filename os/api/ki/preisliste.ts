/**
 * Server-Funktion (Vercel, Node): eigene Preisliste aus Foto oder PDF lesen → Leistungen mit Preis und Einheit.
 * Claude-API per `fetch`, Schlüssel `ANTHROPIC_API_KEY`; ohne Schlüssel `501 { fehler: "nicht verbunden" }`.
 * Ergebnis ist ein ENTWURF – der Handwerker bestätigt im Setup, was übernommen wird.
 *
 * POST /api/ki/preisliste  { datei: { daten: base64, mime: "image/jpeg" | "application/pdf" } }
 * → 200 { leistungen: PreisErkannt[] }
 */
import { claudeJson, dateiInhalt, KiFehler, kiAntwort, type KiUmgebung } from './briefkopf';

export const EINHEITEN = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'] as const;
export type EinheitKi = (typeof EINHEITEN)[number];

export interface PreisErkannt {
  name: string;
  einheit: EinheitKi;
  /** Netto in Euro */
  preis: number;
  kategorie: string;
}

export const PREISLISTE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['leistungen'],
  properties: {
    leistungen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'einheit', 'preis', 'brutto', 'kategorie'],
        properties: {
          name: { type: 'string' },
          einheit: { type: 'string', enum: [...EINHEITEN] },
          preis: { type: 'number' },
          brutto: { type: 'boolean' },
          kategorie: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM = `Du liest die Preisliste eines deutschen Handwerksbetriebs (Foto oder PDF) und gibst jede Leistung mit Preis zurück.
Regeln:
- Nur Zeilen mit erkennbarem Preis. Nichts erfinden.
- name: kurz und wie im Dokument (z. B. "Arbeitsstunde Geselle", "Anfahrt Zone 1").
- einheit: Stk, m, m², m³, h (Stunde), Psch (Pauschale), kg, l, Pkt, km. "je Stunde"/"Std." = h, "pauschal" = Psch, "lfm" = m.
- preis: Betrag in Euro als Zahl (Komma → Punkt). brutto=true, wenn der Preis ausdrücklich inkl. MwSt. angegeben ist.
- kategorie: Überschrift/Abschnitt der Liste, sonst "Lohn", "Fahrt", "Material" oder "Leistung".`;

/** Werte säubern; Bruttopreise auf netto (19 %) umrechnen, Dubletten entfernen */
export function preiseBereinigen(roh: { leistungen?: unknown[] }): PreisErkannt[] {
  const gesehen = new Set<string>();
  const liste: PreisErkannt[] = [];
  for (const x of roh.leistungen ?? []) {
    const l = x as { name?: unknown; einheit?: unknown; preis?: unknown; brutto?: unknown; kategorie?: unknown };
    const name = typeof l.name === 'string' ? l.name.trim() : '';
    let preis = typeof l.preis === 'number' && isFinite(l.preis) ? l.preis : 0;
    if (!name || preis <= 0) continue;
    if (l.brutto === true) preis = preis / 1.19;
    const einheit = (EINHEITEN as readonly string[]).includes(l.einheit as string) ? (l.einheit as EinheitKi) : 'Stk';
    const schluessel = `${name.toLowerCase()}|${einheit}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    liste.push({ name, einheit, preis: Math.round(preis * 100) / 100, kategorie: typeof l.kategorie === 'string' && l.kategorie.trim() ? l.kategorie.trim() : 'Leistung' });
  }
  return liste;
}

export async function preislisteErkennen(eingabe: unknown, env: KiUmgebung): Promise<PreisErkannt[]> {
  if (!env.apiKey) throw new KiFehler(501, 'nicht verbunden');
  const e = (eingabe ?? {}) as { datei?: unknown };
  if (!e.datei) throw new KiFehler(400, 'Schick ein Foto oder eine PDF deiner Preisliste.');
  const roh = await claudeJson<{ leistungen?: unknown[] }>(
    [dateiInhalt(e.datei, true), { type: 'text', text: 'Lies alle Leistungen mit Preis aus dieser Preisliste aus.' }],
    SYSTEM,
    PREISLISTE_SCHEMA,
    env,
  );
  const liste = preiseBereinigen(roh);
  if (!liste.length) throw new KiFehler(422, 'In der Datei wurden keine Preise gefunden.');
  return liste;
}

export async function POST(req: Request): Promise<Response> {
  return kiAntwort(req, async (body, env) => ({ leistungen: await preislisteErkennen(body, env) }));
}
