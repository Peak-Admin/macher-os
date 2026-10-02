/**
 * Server-Funktion: Kundenliste aus einem Foto oder einer PDF lesen (handschriftliche Liste, Ausdruck aus dem
 * alten Programm, Kartei). Claude-API per `fetch`, Schlüssel `ANTHROPIC_API_KEY`; ohne Schlüssel 501.
 * Ergebnis ist ein ENTWURF – der Handwerker sieht die Kunden vor dem Übernehmen und kann die Liste leeren.
 *
 * POST /api/ki/kundenliste  { datei: { daten: base64, mime } }  →  200 { kunden: KundeErkannt[] }
 */
import { claudeJson, dateiInhalt, KiFehler, kiAntwort, type KiUmgebung } from './briefkopf';

export interface KundeErkannt {
  name: string;
  firma: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
}

const S = { type: 'string' } as const;
const FELDER = ['name', 'firma', 'telefon', 'email', 'strasse', 'plz', 'ort'] as const;

export const KUNDENLISTE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['kunden'],
  properties: {
    kunden: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: [...FELDER], properties: Object.fromEntries(FELDER.map((f) => [f, S])) },
    },
  },
};

const SYSTEM = `Du liest eine Kundenliste eines deutschen Handwerksbetriebs (Foto oder PDF: Tabelle, Ausdruck, Karteikarten, handschriftlich).
Gib jeden Kunden genau einmal zurück. Regeln:
- Nur übernehmen, was wirklich dasteht. Nichts erfinden. Unbekannt = leerer Text.
- name: Person oder Firma, wie sie angesprochen wird ("Familie Hoffmann", "Bäckerei Sommer"). firma: nur bei Firmen der Firmenname.
- strasse inkl. Hausnummer; plz fünfstellig; telefon wie geschrieben.
- Unleserliche Einträge weglassen statt raten.`;

export function kundenBereinigen(roh: { kunden?: unknown[] }): KundeErkannt[] {
  const liste: KundeErkannt[] = [];
  for (const x of roh.kunden ?? []) {
    const k = (x ?? {}) as Record<string, unknown>;
    const t = (f: string) => (typeof k[f] === 'string' ? (k[f] as string).trim() : '');
    const name = t('name') || t('firma');
    if (!name) continue;
    const plz = t('plz').replace(/\D/g, '');
    liste.push({ name, firma: t('firma'), telefon: t('telefon'), email: t('email').toLowerCase(), strasse: t('strasse'), plz: plz.length === 5 ? plz : '', ort: t('ort') });
  }
  return liste.slice(0, 2000);
}

export async function kundenlisteErkennen(eingabe: unknown, env: KiUmgebung): Promise<KundeErkannt[]> {
  if (!env.apiKey) throw new KiFehler(501, 'nicht verbunden');
  const e = (eingabe ?? {}) as { datei?: unknown };
  if (!e.datei) throw new KiFehler(400, 'Schick ein Foto oder eine PDF deiner Kundenliste.');
  const roh = await claudeJson<{ kunden?: unknown[] }>(
    [dateiInhalt(e.datei, true), { type: 'text', text: 'Lies alle Kunden aus dieser Liste aus.' }],
    SYSTEM,
    KUNDENLISTE_SCHEMA,
    env,
  );
  const liste = kundenBereinigen(roh);
  if (!liste.length) throw new KiFehler(422, 'Auf dem Foto wurden keine Kunden gefunden.');
  return liste;
}

export async function POST(req: Request): Promise<Response> {
  return kiAntwort(req, async (body, env) => ({ kunden: await kundenlisteErkennen(body, env) }));
}
