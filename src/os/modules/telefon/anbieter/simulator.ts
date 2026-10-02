/**
 * Simulator – ein Telefonanbieter ohne Telefon. Für Tests, die Demo und den „Probeanruf“ in den Einstellungen.
 *
 * Statt Sprache bekommt er einen Text („Was sagt der Anrufer?“) und zieht die Felder mit einfachen Regeln heraus
 * (Lane 0, kein Modell). Ein echter Anbieter liefert dieselben Felder aus seinem Sprachmodell – das Format
 * (`AnrufErgebnis`) ist identisch. Der Webhook-Eingang akzeptiert die normalisierten Ereignisse direkt.
 */
import type { AgentDefinition, AnrufErgebnis, FrageId, TelefonAnbieter, TelefonEreignis, TranskriptZeile } from './typen';

const NAME = /(?:[Ii]ch bin|[Mm]ein [Nn]ame ist|[Hh]ier (?:ist|spricht))\s+((?:Frau|Herr)\s+)?([A-ZÄÖÜ][a-zäöüß-]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)?)/;
const ADRESSE = /([A-ZÄÖÜ][\wäöüß.-]*(?:straße|strasse|str\.|weg|platz|allee|gasse|ring|damm|ufer)\s*\d+\s*[a-zA-Z]?\b)(?:,?\s*(\d{5})?\s*([A-ZÄÖÜ][\wäöüß-]+))?/;
const TELEFON = /(?:\+49|0049|0)[\d\s/()-]{6,18}\d/;
const ERREICHBAR = /(jederzeit|den ganzen tag|(?:ab|bis|nach|vor|zwischen)\s+\d{1,2}(?:[:.]\d{2})?\s*(?:uhr)?(?:\s*(?:und|bis)\s*\d{1,2}(?:[:.]\d{2})?\s*uhr)?|(?:heute|morgen)\s+(?:vormittag|nachmittag|abend))/i;
const DRINGEND = /\b(dringend|eilig|sofort|heute noch|so schnell wie)/i;
const RUECKRUF = /zur(ü|ue)ckruf|r(ü|ue)ckruf|ruf\w* .*zur(ü|ue)ck/i;

const saetze = (t: string) =>
  t
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Felder aus dem, was der Anrufer sagt (einfache Regeln – nur für Simulator und Probeanruf) */
export function felderAusText(text: string, von = ''): AnrufErgebnis['felder'] {
  const f: AnrufErgebnis['felder'] = {};
  const name = text.match(NAME);
  if (name) f.name = `${name[1] ?? ''}${name[2]}`.trim();
  const adr = text.match(ADRESSE);
  if (adr) f.adresse = [adr[1].trim(), [adr[2], adr[3]].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const tel = text.match(TELEFON);
  if (tel) f.rueckrufnummer = tel[0].replace(/\s+/g, ' ').trim();
  else if (von.trim()) f.rueckrufnummer = von.trim();
  const erreichbar = text.match(ERREICHBAR);
  if (erreichbar) f.erreichbarkeit = erreichbar[1].trim();
  if (DRINGEND.test(text)) f.dringlichkeit = 'dringend';
  // Anliegen: alles, was nicht nur Name, Nummer oder Erreichbarkeit ist
  const anliegen = saetze(text).filter((s) => {
    const rest = s.replace(NAME, '').replace(TELEFON, '').replace(ERREICHBAR, '').replace(/[^\wäöüß]+/gi, ' ').trim();
    return rest.split(' ').filter((w) => w.length > 2 && !/^(guten|tag|hallo|bitte|unter|erreichbar|erreichen|nummer|meine|mich|sie|ich|bin|der|die|das|und|ist)$/i.test(w)).length > 0;
  });
  if (anliegen.length) f.anliegen = anliegen.join(' ');
  return f;
}

/** Ein Probegespräch: was der Assistent sagt und fragt, und was der Anrufer antwortet */
export function probeanruf(
  text: string,
  agent: Pick<AgentDefinition, 'ansage' | 'fragen'>,
  opt: { von?: string; jetzt?: Date; anrufId?: string } = {},
): AnrufErgebnis {
  const von = opt.von?.trim() ?? '';
  const felder = felderAusText(text, von);
  const transkript: TranskriptZeile[] = [{ wer: 'assistent', text: agent.ansage }];
  const erste = agent.fragen[0];
  if (erste) transkript.push({ wer: 'assistent', text: erste.frage });
  transkript.push({ wer: 'anrufer', text: text.trim() });
  // Nachfragen für Felder, die noch fehlen (im echten Gespräch beantwortet der Anrufer sie)
  for (const f of agent.fragen.slice(1)) if (!felder[f.id as FrageId]) transkript.push({ wer: 'assistent', text: f.frage });
  transkript.push({ wer: 'assistent', text: 'Danke, ich habe alles aufgenommen und gebe es an das Team weiter. Auf Wiederhören.' });
  return {
    anrufId: opt.anrufId ?? `probe-${(opt.jetzt ?? new Date()).getTime()}`,
    anbieter: 'simulator',
    von,
    beginn: (opt.jetzt ?? new Date()).toISOString(),
    dauerSekunden: Math.min(300, 30 + Math.round(text.length / 4)),
    felder,
    zusammenfassung: felder.anliegen ? `${felder.name ? `${felder.name}: ` : ''}${felder.anliegen.split(/(?<=[.!?])\s/)[0]}` : undefined,
    dringlichkeit: felder.dringlichkeit === 'dringend' ? 'dringend' : undefined,
    ergebnis: RUECKRUF.test(text) ? 'rueckruf' : undefined,
    transkript,
  };
}

/** Ist das ein normalisiertes Ereignis? (Simulator-Webhook nimmt genau dieses Format) */
function istEreignis(x: unknown): x is TelefonEreignis {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  if (e.typ === 'anruf.beendet') {
    const r = e.ergebnis as Record<string, unknown> | undefined;
    return !!r && typeof r.anrufId === 'string' && typeof r.beginn === 'string' && typeof r.von === 'string' && typeof r.felder === 'object' && r.felder !== null;
  }
  if (e.typ === 'anruf.begonnen') return typeof e.anrufId === 'string' && typeof e.von === 'string';
  if (e.typ === 'werkzeug.aufgerufen') return typeof e.anrufId === 'string' && typeof e.werkzeug === 'string';
  return false;
}

export const simulatorAnbieter: TelefonAnbieter = {
  id: 'simulator',
  name: 'Simulator (ohne Telefon)',
  async einrichten() {
    return { ok: true, agentId: 'simulator' };
  },
  pruefeSignatur({ kopf }, geheimnis) {
    return !!geheimnis && (kopf['x-macher-signatur'] ?? kopf['X-Macher-Signatur']) === geheimnis;
  },
  eingangLesen(nutzlast) {
    const liste = Array.isArray(nutzlast) ? nutzlast : [nutzlast];
    return liste.filter(istEreignis);
  },
  werkzeugAntwort(_werkzeug, ergebnis) {
    return { ergebnis };
  },
};
