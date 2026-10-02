/**
 * /api/ki/gateway – die Modell-Lanes des Macher AI Gateway (`src/os/core/gateway.ts`) auf dem Server.
 * Der Browser hält keinen Schlüssel; er schickt nur die Aufgabe und den minimalen Kontext der Absicht.
 *
 * GET  → { lanes: { 1: boolean, 2: boolean, 3: boolean } }   welche Lanes sind eingerichtet?
 * POST { lane: 1, aufgabe: 'erkennen', text, absichten: { id, titel }[] }
 *        → { absicht, sicherheit, werte, kostenCent, modell }
 * POST { lane: 2 | 3, aufgabe: 'schreiben', text, kontext }
 *        → { text, kostenCent, modell }
 *        kontext.format = 'angebot.positionen' → text ist JSON { positionen: [{ katalogId, text, menge, einheit, preisEuro }] }
 *
 * Umgebungsvariablen:
 *   ANTHROPIC_API_KEY     Pflicht. Ohne Schlüssel antwortet die Funktion 501 – der Gateway bleibt bei Regeln (Lane 0).
 *   KI_MODELL_JEV         Lane 1, Absicht erkennen  (Standard: claude-haiku-4-5)
 *   KI_MODELL_LUNA        Lane 2, Texte schreiben   (Standard: claude-sonnet-5-5)
 *   KI_MODELL_STARK       Lane 3, nur wenn nötig    (Standard: claude-opus-5-5)
 *   KI_LANES              optional, z. B. "1,2" – nur diese Lanes freigeben
 *
 * Schutz, solange es noch keine Anmeldung gibt: nur dieselbe Seite (Origin), Mengenbegrenzung je IP, Größenlimits.
 */
import Anthropic from '@anthropic-ai/sdk';
import { kostenCent, laneFrei, modellFuer, type Lane } from './lanes';

const LIMIT_JE_STUNDE = 120;
const MAX_TEXT = 2000;
const MAX_KONTEXT = 12_000;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const zaehler = new Map<string, { anzahl: number; seit: number }>();
function zuViele(ip: string): boolean {
  const jetzt = Date.now();
  const z = zaehler.get(ip);
  if (!z || jetzt - z.seit > 3_600_000) {
    zaehler.set(ip, { anzahl: 1, seit: jetzt });
    return false;
  }
  z.anzahl++;
  return z.anzahl > LIMIT_JE_STUNDE;
}

const SYSTEM_ERKENNEN = [
  'Du ordnest Sätze aus einem deutschen Handwerksbetrieb genau einer Absicht aus der gegebenen Liste zu.',
  'Wähle nur IDs aus der Liste. Passt keine, nimm "unbekannt" mit niedriger Sicherheit.',
  'sicherheit ist deine Einschätzung zwischen 0 und 1. Erfinde keine Namen oder Zahlen; werte enthält nur, was im Satz steht (z. B. kunde, mitarbeiter, datum, dauer).',
].join(' ');

const SYSTEM_SCHREIBEN = [
  'Du schreibst kurze Texte für einen deutschen Handwerksbetrieb an seine Kunden oder sein Team.',
  'Nutze nur Fakten aus dem mitgegebenen Kontext. Erfinde keine Termine, Preise oder Zusagen.',
  'Ton: freundlich, direkt, kurze Sätze. Kunden siezen, außer der Kontext sagt etwas anderes. Keine Floskeln, kein Markdown.',
  'Gib nur den fertigen Text zurück – ohne Betreff, ohne Erklärung.',
].join(' ');

/** Format `angebot.positionen` (Absicht `offer.positions.suggest`): Positionen als JSON statt Fließtext */
const SYSTEM_POSITIONEN = [
  'Du machst aus einer kurzen Beschreibung eines deutschen Handwerksbetriebs Angebotspositionen.',
  'Nimm Leistungen und Material aus dem Katalog im Kontext (katalogId), wenn sie passen; sonst katalogId leer und ein kurzer Positionstext.',
  'Mengen und Einheiten nur aus der Beschreibung; genannte Tage sind Arbeitsstunden (stundenJeTag). Ohne Menge gilt 1.',
  'preisEuro nur, wenn der Betrag wörtlich in der Beschreibung steht, sonst 0. Erfinde keine Positionen, Mengen oder Preise.',
  'Der Kontext enthält unter "regeln" einen Vorschlag ohne KI – verbessere ihn, statt neu zu raten.',
].join(' ');

const SCHEMA_POSITIONEN = {
  type: 'object',
  properties: {
    positionen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          katalogId: { type: 'string' },
          text: { type: 'string' },
          menge: { type: 'number' },
          einheit: { type: 'string', enum: ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'] },
          preisEuro: { type: 'number' },
        },
        required: ['katalogId', 'text', 'menge', 'einheit', 'preisEuro'],
        additionalProperties: false,
      },
    },
  },
  required: ['positionen'],
  additionalProperties: false,
};

function schemaErkennen(ids: string[]) {
  return {
    type: 'object',
    properties: {
      absicht: { type: 'string', enum: [...ids, 'unbekannt'] },
      sicherheit: { type: 'number' },
      werte: {
        type: 'object',
        properties: {
          kunde: { type: 'string' },
          mitarbeiter: { type: 'string' },
          datum: { type: 'string' },
          dauer: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    required: ['absicht', 'sicherheit', 'werte'],
    additionalProperties: false,
  };
}

/** Ist echte KI je Lane eingerichtet? */
export function GET() {
  return json(200, { lanes: { 1: laneFrei(1), 2: laneFrei(2), 3: laneFrei(3) } });
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json(501, { fehler: 'nicht verbunden' });

  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return json(403, { fehler: 'Nicht erlaubt' });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  if (zuViele(ip)) return json(429, { fehler: 'Zu viele Anfragen in kurzer Zeit.' });

  const roh = await req.text();
  if (roh.length > MAX_KONTEXT + MAX_TEXT + 20_000) return json(413, { fehler: 'Zu groß' });
  let e: { lane?: unknown; aufgabe?: unknown; text?: unknown; absichten?: unknown; kontext?: unknown };
  try {
    e = JSON.parse(roh);
  } catch {
    return json(400, { fehler: 'Ungültige Anfrage' });
  }
  const lane = e.lane === 1 || e.lane === 2 || e.lane === 3 ? (e.lane as Lane) : undefined;
  const text = typeof e.text === 'string' ? e.text.trim().slice(0, MAX_TEXT) : '';
  if (!lane || !text) return json(400, { fehler: 'Ungültige Anfrage' });
  if (!laneFrei(lane)) return json(501, { fehler: 'Lane nicht freigegeben' });

  const modell = modellFuer(lane);
  const client = new Anthropic();
  // Serverseitige Ausweichmodelle bei einer Ablehnung – nur für Sonnet/Opus, nicht für Haiku
  const ausweich = /^claude-(sonnet|opus|fable)-5/.test(modell) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {};
  const aufwand = /^claude-(sonnet|opus|fable)-/.test(modell) ? { effort: 'low' as const } : {};

  try {
    if (e.aufgabe === 'erkennen') {
      const absichten = Array.isArray(e.absichten)
        ? (e.absichten as { id?: unknown; titel?: unknown }[])
            .filter((a) => typeof a?.id === 'string' && typeof a?.titel === 'string')
            .slice(0, 200)
            .map((a) => ({ id: String(a.id).slice(0, 80), titel: String(a.titel).slice(0, 200) }))
        : [];
      if (!absichten.length) return json(400, { fehler: 'Keine Absichten' });
      const r = await client.beta.messages.create({
        model: modell,
        max_tokens: 1024,
        ...ausweich,
        output_config: { ...aufwand, format: { type: 'json_schema', schema: schemaErkennen(absichten.map((a) => a.id)) } },
        system: SYSTEM_ERKENNEN,
        messages: [{ role: 'user', content: `Absichten (JSON):\n${JSON.stringify(absichten)}\n\nSatz:\n${text}` }],
      });
      const kosten = kostenCent(modell, r.usage.input_tokens, r.usage.output_tokens);
      if (r.stop_reason === 'refusal' || r.stop_reason === 'max_tokens') return json(422, { fehler: 'Keine Erkennung', kostenCent: kosten });
      const block = r.content.find((b) => b.type === 'text');
      const daten = JSON.parse(block?.type === 'text' ? block.text : '') as { absicht?: string; sicherheit?: number; werte?: Record<string, string> };
      const absicht = absichten.some((a) => a.id === daten.absicht) ? daten.absicht : undefined;
      const sicherheit = typeof daten.sicherheit === 'number' ? Math.max(0, Math.min(1, daten.sicherheit)) : 0;
      return json(200, { absicht, sicherheit: absicht ? sicherheit : 0, werte: daten.werte ?? {}, kostenCent: kosten, modell: r.model });
    }

    if (e.aufgabe === 'schreiben') {
      const kontext = JSON.stringify(e.kontext ?? {}).slice(0, MAX_KONTEXT);
      const positionen = (e.kontext as { format?: unknown } | undefined)?.format === 'angebot.positionen';
      const r = await client.beta.messages.create({
        model: modell,
        max_tokens: 2000,
        ...ausweich,
        ...(positionen ? { output_config: { ...aufwand, format: { type: 'json_schema' as const, schema: SCHEMA_POSITIONEN } } } : Object.keys(aufwand).length ? { output_config: aufwand } : {}),
        system: positionen ? SYSTEM_POSITIONEN : SYSTEM_SCHREIBEN,
        messages: [{ role: 'user', content: `Kontext (JSON):\n${kontext}\n\nAuftrag:\n${text}` }],
      });
      const kosten = kostenCent(modell, r.usage.input_tokens, r.usage.output_tokens);
      if (r.stop_reason === 'refusal') return json(422, { fehler: 'Kein Text', kostenCent: kosten });
      const ausgabe = r.content
        .flatMap((b) => (b.type === 'text' ? [b.text] : []))
        .join('\n')
        .trim();
      if (!ausgabe) return json(422, { fehler: 'Kein Text', kostenCent: kosten });
      return json(200, { text: ausgabe.slice(0, 4000), kostenCent: kosten, modell: r.model });
    }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json(429, { fehler: 'KI ist gerade ausgelastet.' });
    if (err instanceof Anthropic.APIError) return json(502, { fehler: 'KI nicht erreichbar' });
    if (err instanceof SyntaxError) return json(422, { fehler: 'Keine Erkennung' });
    throw err;
  }
  return json(400, { fehler: 'Unbekannte Aufgabe' });
}
