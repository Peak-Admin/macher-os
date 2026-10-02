/**
 * POST /api/ki/positionen – Positionen aus gesprochenem Text mit Claude erkennen (Next.js Route Handler, Node).
 *
 * Eingabe:  { text: string, katalog: { id, name, einheit }[] }
 * Ausgabe:  { positionen: { leistungId, text, menge, einheit }[] }  (leistungId "" = nicht im Katalog)
 *
 * Preise schickt der Browser nicht mit und die KI erfindet keine: Der Katalogpreis wird im Browser über
 * `leistungId` gesetzt. Ohne `ANTHROPIC_API_KEY` antwortet die Funktion mit 501 – der Browser nimmt dann
 * den lokalen Parser (`src/os/modules/start/sprache.ts`).
 */

const EINHEITEN = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'];

const SCHEMA = {
  type: 'object',
  properties: {
    positionen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          leistungId: { type: 'string', description: 'id aus dem Katalog, leer wenn nichts passt' },
          text: { type: 'string', description: 'kurze Positionsbeschreibung auf Deutsch' },
          menge: { type: 'number' },
          einheit: { type: 'string', enum: EINHEITEN },
        },
        required: ['leistungId', 'text', 'menge', 'einheit'],
        additionalProperties: false,
      },
    },
  },
  required: ['positionen'],
  additionalProperties: false,
};

const SYSTEM = [
  'Du wandelst diktierte Angebotspositionen eines deutschen Handwerksbetriebs in strukturierte Positionen um.',
  'Ordne jede genannte Leistung der passenden Katalog-Leistung zu (leistungId). Passt nichts, lass leistungId leer und formuliere einen kurzen Positionstext.',
  'Mengen stehen oft als Zahlwort („zwei“, „zehn Meter“, „eineinhalb Stunden“). Ohne Mengenangabe gilt 1.',
  'Nimm bei Katalog-Treffern die Einheit aus dem Katalog. Erfinde keine Positionen, die nicht genannt wurden.',
].join(' ');

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function POST(req: Request): Promise<Response> {
  const schluessel = process.env.ANTHROPIC_API_KEY;
  if (!schluessel) return json(501, { fehler: 'nicht verbunden' });

  let eingabe: { text?: unknown; katalog?: unknown };
  try {
    eingabe = await req.json();
  } catch {
    return json(400, { fehler: 'Ungültige Anfrage' });
  }
  const text = typeof eingabe.text === 'string' ? eingabe.text.trim().slice(0, 2000) : '';
  const katalog = Array.isArray(eingabe.katalog)
    ? (eingabe.katalog as { id?: unknown; name?: unknown; einheit?: unknown }[])
        .filter((k) => typeof k?.id === 'string' && typeof k?.name === 'string')
        .slice(0, 400)
        .map((k) => ({ id: String(k.id), name: String(k.name).slice(0, 200), einheit: String(k.einheit ?? '') }))
    : [];
  if (!text) return json(400, { fehler: 'Kein Text' });

  const antwort = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': schluessel,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Leistungskatalog (JSON):\n${JSON.stringify(katalog)}\n\nDiktat:\n${text}` }],
    }),
  }).catch(() => undefined);

  if (!antwort?.ok) return json(502, { fehler: 'KI nicht erreichbar' });
  const daten = (await antwort.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
  if (daten.stop_reason === 'refusal' || daten.stop_reason === 'max_tokens') return json(422, { fehler: 'Keine Erkennung' });
  const block = daten.content?.find((b) => b.type === 'text')?.text;
  try {
    const ergebnis = JSON.parse(block ?? '') as { positionen?: { leistungId: string; text: string; menge: number; einheit: string }[] };
    const ids = new Set(katalog.map((k) => k.id));
    const positionen = (ergebnis.positionen ?? []).map((p) => ({
      leistungId: ids.has(p.leistungId) ? p.leistungId : null,
      text: String(p.text ?? '').slice(0, 300),
      menge: Number.isFinite(p.menge) && p.menge > 0 ? p.menge : 1,
      einheit: EINHEITEN.includes(p.einheit) ? p.einheit : 'Stk',
    }));
    return json(200, { positionen });
  } catch {
    return json(422, { fehler: 'Keine Erkennung' });
  }
}
