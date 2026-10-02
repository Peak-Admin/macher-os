/**
 * Telefonassistent – reine Logik ohne Datenbank (auch vom Server nutzbar).
 *
 *  - Konfiguration (`AssistentKonfig`) mit Opinionated Defaults
 *  - Ansage mit Pflichthinweis „digitaler Assistent“ (EU AI Act, Art. 50)
 *  - Annahmeregel: wann Macher rangeht (Geschäftszeiten in Europe/Berlin)
 *  - Notfall-Erkennung zuerst per Regeln (Stichworte), die Einschätzung des Assistenten nur ergänzend
 *  - `agentDefinition`: anbieterneutrale Agent-Beschreibung (Ansage, Anweisung, Ziel-Schema, Werkzeuge)
 *  - `ergebnisUebersetzen`: Gesprächsergebnis des Anbieters → nächster Schritt in Macher (Anfrage, Rückruf, Notiz, Notfall)
 */
import type { AnrufDetails, AnrufDringlichkeit, Basis, Nachricht } from '@core/objects';
import type { AgentDefinition, Annahme, AnrufErgebnis, FrageId, JsonSchema, WerkzeugDef } from './anbieter/typen';

// ------------------------------------------------------------------ Fragen

export const FRAGEN: Record<FrageId, { label: string; frage: string; beschreibung: string; pflicht?: boolean }> = {
  anliegen: { label: 'Anliegen', frage: 'Worum geht es?', beschreibung: 'Was ist passiert oder was soll gemacht werden – in den Worten des Anrufers.', pflicht: true },
  name: { label: 'Name', frage: 'Wie ist Ihr Name?', beschreibung: 'Vor- und Nachname oder Firma des Anrufers.' },
  adresse: { label: 'Adresse', frage: 'Wo ist das – Straße, Hausnummer und Ort?', beschreibung: 'Adresse des Einsatzorts: Straße, Hausnummer, Postleitzahl, Ort.' },
  dringlichkeit: { label: 'Dringlichkeit', frage: 'Wie dringend ist es?', beschreibung: 'normal, dringend (heute noch) oder notfall (Gefahr, Schaden wird größer).' },
  rueckrufnummer: { label: 'Rückrufnummer', frage: 'Unter welcher Nummer erreichen wir Sie?', beschreibung: 'Telefonnummer für den Rückruf, falls sie von der Anrufernummer abweicht.', pflicht: true },
  erreichbarkeit: { label: 'Erreichbarkeit', frage: 'Wann erreichen wir Sie am besten?', beschreibung: 'Wann der Anrufer gut erreichbar ist, z. B. „ab 17 Uhr“ oder „jederzeit“.' },
};

export const FRAGEN_REIHENFOLGE: FrageId[] = ['anliegen', 'name', 'adresse', 'dringlichkeit', 'rueckrufnummer', 'erreichbarkeit'];

// ------------------------------------------------------------------ Konfiguration

export interface AssistentKonfig {
  an: boolean;
  /** Vorlage; `{firma}` wird durch den Firmennamen ersetzt */
  begruessung: string;
  annahme: Annahme;
  /** bei „wenn keiner rangeht“: nach so vielen Sekunden */
  klingelSekunden: number;
  notfallStichworte: string[];
  bereitschaft: { mitarbeiterId?: string; nummer?: string };
  /** Reihenfolge = Reihenfolge im Gespräch */
  fragen: { id: FrageId; an: boolean }[];
}

export const STANDARD_BEGRUESSUNG = 'Guten Tag, Sie sprechen mit dem digitalen Assistenten von {firma}. Ich nehme Ihr Anliegen auf und gebe es direkt an das Team weiter.';

export const STANDARD_STICHWORTE = ['Rohrbruch', 'Wasserschaden', 'Wasser läuft', 'Heizung aus', 'Heizung ausgefallen', 'Gasgeruch', 'riecht nach Gas', 'Stromausfall', 'kein Strom', 'Brandgeruch', 'Sturmschaden'];

export const ANNAHME: { wert: Annahme; label: string; text: string }[] = [
  { wert: 'keiner', label: 'Wenn keiner rangeht', text: 'Klingelt es ohne Antwort, nimmt Macher nach der eingestellten Zeit an.' },
  { wert: 'ausserhalb', label: 'Außerhalb der Geschäftszeiten', text: 'Abends, am Wochenende und an Feiertagen nimmt Macher sofort an.' },
  { wert: 'ausserhalb_keiner', label: 'Beides', text: 'Außerhalb der Geschäftszeiten sofort, sonst wenn keiner rangeht.' },
  { wert: 'immer', label: 'Immer', text: 'Macher nimmt jeden Anruf sofort an.' },
];

export const STANDARD_KONFIG: AssistentKonfig = {
  an: false,
  begruessung: STANDARD_BEGRUESSUNG,
  annahme: 'ausserhalb_keiner',
  klingelSekunden: 20,
  notfallStichworte: STANDARD_STICHWORTE,
  bereitschaft: {},
  fragen: FRAGEN_REIHENFOLGE.map((id) => ({ id, an: true })),
};

/** Gespeicherte (evtl. ältere oder unvollständige) Konfiguration auf den aktuellen Stand bringen */
export function konfigNormalisieren(roh: Partial<AssistentKonfig> | undefined): AssistentKonfig {
  const k = { ...STANDARD_KONFIG, ...(roh ?? {}) };
  const bekannt = (k.fragen ?? []).filter((f, i, alle) => f.id in FRAGEN && alle.findIndex((x) => x.id === f.id) === i);
  const fehlend = FRAGEN_REIHENFOLGE.filter((id) => !bekannt.some((f) => f.id === id)).map((id) => ({ id, an: true }));
  return {
    ...k,
    klingelSekunden: Math.min(60, Math.max(5, Math.round(Number(k.klingelSekunden) || STANDARD_KONFIG.klingelSekunden))),
    notfallStichworte: (k.notfallStichworte ?? []).map((s) => s.trim()).filter(Boolean),
    bereitschaft: { ...(k.bereitschaft ?? {}) },
    // Pflichtfragen lassen sich nicht abschalten
    fragen: [...bekannt, ...fehlend].map((f) => ({ id: f.id, an: FRAGEN[f.id].pflicht ? true : f.an !== false })),
  };
}

/** Frage in der Liste um eine Position verschieben (Knöpfe „nach oben“/„nach unten“ – kein Drag-and-drop) */
export function frageVerschieben(fragen: AssistentKonfig['fragen'], id: FrageId, richtung: -1 | 1): AssistentKonfig['fragen'] {
  const i = fragen.findIndex((f) => f.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= fragen.length) return fragen;
  const neu = [...fragen];
  [neu[i], neu[j]] = [neu[j], neu[i]];
  return neu;
}

/** Stichworte aus einem Textfeld (eine Zeile oder Komma je Stichwort) */
export function stichworteAus(text: string): string[] {
  return [...new Set(text.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean))];
}

// ------------------------------------------------------------------ Ansage (Transparenz)

const OFFENGELEGT = /digital|künstlich|ki-|\bki\b|automatisch|virtuell/i;

/**
 * Erster Satz im Gespräch. Der Hinweis, dass hier ein digitaler Assistent spricht, ist Pflicht (EU AI Act, Art. 50)
 * und wird ergänzt, wenn er in einer geänderten Begrüßung fehlt.
 */
export function ansageText(vorlage: string, firma: string): string {
  const name = firma.trim() || 'unserem Betrieb';
  const text = (vorlage.trim() || STANDARD_BEGRUESSUNG).replace(/\{firma\}/g, name).replace(/\s+/g, ' ').trim();
  return OFFENGELEGT.test(text) ? text : `Sie sprechen mit dem digitalen Assistenten von ${name}. ${text}`;
}

// ------------------------------------------------------------------ Geschäftszeiten und Annahme

export interface Geschaeftszeiten {
  /** "07:00" */
  beginn: string;
  ende: string;
  /** Wochentage 1 = Mo … 7 = So */
  tage: number[];
  /** Arbeitstag inkl. Feiertage (aus `@core/kalender`); ohne Angabe nur die Wochentage */
  istArbeitstag?: (datum: string) => boolean;
}

/** Datum und Minuten des Tages in Deutschland – unabhängig von der Zeitzone des Servers */
export function berlinZeit(jetzt: Date): { datum: string; minuten: number; wochentag: number } {
  const teile = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(jetzt)
      .map((t) => [t.type, t.value]),
  );
  const datum = `${teile.year}-${teile.month}-${teile.day}`;
  const tag = new Date(`${datum}T12:00:00Z`).getUTCDay();
  return { datum, minuten: Number(teile.hour) * 60 + Number(teile.minute), wochentag: tag === 0 ? 7 : tag };
}

const minuten = (uhr: string) => {
  const [h, m] = uhr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function inGeschaeftszeit(jetzt: Date, z: Geschaeftszeiten): boolean {
  const b = berlinZeit(jetzt);
  const arbeitstag = z.istArbeitstag ? z.istArbeitstag(b.datum) : z.tage.includes(b.wochentag);
  return arbeitstag && b.minuten >= minuten(z.beginn) && b.minuten < minuten(z.ende);
}

const TAG_KURZ = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** "Mo–Fr, 07:00–16:00 Uhr" */
export function geschaeftszeitenText(z: Pick<Geschaeftszeiten, 'beginn' | 'ende' | 'tage'>): string {
  const t = [...z.tage].sort((a, b) => a - b);
  const zusammenhaengend = t.length > 2 && t.every((x, i) => i === 0 || x === t[i - 1] + 1);
  const tage = !t.length ? 'keine Tage' : zusammenhaengend ? `${TAG_KURZ[t[0]]}–${TAG_KURZ[t[t.length - 1]]}` : t.map((x) => TAG_KURZ[x]).join(', ');
  return `${tage}, ${z.beginn}–${z.ende} Uhr`;
}

export type AnnahmeEntscheidung = { annehmen: false; grund: string } | { annehmen: true; nachSekunden: number; grund: string };

/** Nimmt Macher diesen Anruf an – und nach wie vielen Sekunden Klingeln? */
export function nimmtAn(k: Pick<AssistentKonfig, 'an' | 'annahme' | 'klingelSekunden'>, jetzt: Date, z: Geschaeftszeiten): AnnahmeEntscheidung {
  if (!k.an) return { annehmen: false, grund: 'Der Telefonassistent ist aus.' };
  const offen = inGeschaeftszeit(jetzt, z);
  switch (k.annahme) {
    case 'immer':
      return { annehmen: true, nachSekunden: 0, grund: 'Macher nimmt jeden Anruf an.' };
    case 'keiner':
      return { annehmen: true, nachSekunden: k.klingelSekunden, grund: `Wenn nach ${k.klingelSekunden} Sekunden keiner rangeht.` };
    case 'ausserhalb':
      return offen ? { annehmen: false, grund: 'Während der Geschäftszeiten gehst du selbst ran.' } : { annehmen: true, nachSekunden: 0, grund: 'Außerhalb der Geschäftszeiten.' };
    case 'ausserhalb_keiner':
      return offen
        ? { annehmen: true, nachSekunden: k.klingelSekunden, grund: `In den Geschäftszeiten, wenn nach ${k.klingelSekunden} Sekunden keiner rangeht.` }
        : { annehmen: true, nachSekunden: 0, grund: 'Außerhalb der Geschäftszeiten.' };
  }
}

// ------------------------------------------------------------------ Notfall (Regeln zuerst)

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');

/**
 * Erstes Notfall-Stichwort, das im Text vorkommt. Mehrwortige Stichworte („Heizung aus“) zählen, wenn alle Wörter im
 * selben Satz als Wortanfang vorkommen („Die Heizung ist ausgefallen“).
 */
export function notfallTreffer(text: string, stichworte: string[]): string | undefined {
  const saetze = norm(text)
    .split(/[.!?\n]+/)
    .map((s) => s.split(/[^a-z0-9]+/).filter(Boolean));
  return stichworte.find((s) => {
    const worte = norm(s).split(/[^a-z0-9]+/).filter(Boolean);
    return worte.length > 0 && saetze.some((satz) => worte.every((w) => satz.some((x) => x.startsWith(w))));
  });
}

// ------------------------------------------------------------------ Agent-Definition

export const WERKZEUGE: WerkzeugDef[] = [
  {
    name: 'kunde_suchen',
    beschreibung: 'Prüft, ob der Anrufer schon Kunde ist. Liefert nur „bekannt ja/nein“ und die Zahl offener Aufträge – keine Kundendaten.',
    parameter: { type: 'object', properties: { telefon: { type: 'string', description: 'Nummer des Anrufers' } }, required: ['telefon'], additionalProperties: false },
    capability: 'READ',
    aktion: 'call.customer_lookup',
  },
  {
    name: 'anfrage_anlegen',
    beschreibung: 'Legt nach dem Gespräch eine Anfrage an (neuer Auftrag, Schaden, Angebotswunsch).',
    parameter: { type: 'object', properties: { anliegen: { type: 'string' }, dringlichkeit: { type: 'string', enum: ['normal', 'dringend', 'notfall'] } }, required: ['anliegen'], additionalProperties: false },
    capability: 'WRITE',
    aktion: 'call.request_create',
  },
  {
    name: 'rueckruf_anlegen',
    beschreibung: 'Trägt einen Rückruf ein (Frage zu Rechnung, Termin, laufendem Auftrag).',
    parameter: { type: 'object', properties: { anliegen: { type: 'string' }, erreichbarkeit: { type: 'string' } }, required: ['anliegen'], additionalProperties: false },
    capability: 'WRITE',
    aktion: 'call.callback_create',
  },
  {
    name: 'an_bereitschaft_weiterleiten',
    beschreibung: 'Nur bei Notfall: meldet den Notfall sofort an die Bereitschaft und verbindet den Anrufer, wenn eine Weiterleitungsnummer hinterlegt ist.',
    parameter: { type: 'object', properties: { grund: { type: 'string', description: 'kurz, z. B. „Rohrbruch im Keller“' } }, required: ['grund'], additionalProperties: false },
    capability: 'WRITE',
    aktion: 'call.emergency_forward',
  },
];

export function zielSchema(fragen: FrageId[]): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  for (const id of fragen) {
    properties[id] = id === 'dringlichkeit' ? { type: 'string', enum: ['normal', 'dringend', 'notfall'], description: FRAGEN[id].beschreibung } : { type: 'string', description: FRAGEN[id].beschreibung };
  }
  return {
    type: 'object',
    properties: {
      felder: { type: 'object', properties, required: fragen.filter((id) => FRAGEN[id].pflicht && id !== 'rueckrufnummer'), additionalProperties: false },
      zusammenfassung: { type: 'string', description: 'Ein bis zwei Sätze für den Handwerker: Wer, was, wo, wie dringend.' },
      dringlichkeit: { type: 'string', enum: ['normal', 'dringend', 'notfall'] },
      ergebnis: { type: 'string', enum: ['anfrage', 'rueckruf', 'notiz'], description: 'anfrage = neue Arbeit; rueckruf = Frage, die ein Mensch beantworten muss; notiz = nur zur Info' },
    },
    required: ['felder', 'zusammenfassung'],
    additionalProperties: false,
  };
}

export interface BetriebKurz {
  name: string;
  telefon?: string;
}

/**
 * Anbieterneutrale Agent-Definition aus Konfiguration und Betriebsdaten. Ein Adapter übersetzt sie in die
 * Konfiguration seines Anbieters (`TelefonAnbieter.einrichten`).
 */
export function agentDefinition(k: AssistentKonfig, betrieb: BetriebKurz, z: Pick<Geschaeftszeiten, 'beginn' | 'ende' | 'tage'>, bereitschaftName?: string): AgentDefinition {
  const firma = betrieb.name.trim() || 'unser Betrieb';
  const fragen = k.fragen.filter((f) => f.an).map((f) => ({ id: f.id, frage: FRAGEN[f.id].frage }));
  const nummer = k.bereitschaft.nummer?.trim();
  const zeiten = geschaeftszeitenText(z);
  const anweisung = [
    `Du bist der digitale Telefonassistent von ${firma}, einem Handwerksbetrieb. Du sprichst Deutsch, siezt den Anrufer, bist freundlich, ruhig und knapp.`,
    `Sag gleich am Anfang, dass du ein digitaler Assistent bist. Gib dich nie als Mensch aus. Fragt jemand nach einem Menschen, sag, dass sich das Team schnell meldet.`,
    `Deine Aufgabe: das Anliegen aufnehmen. Frag nacheinander, jeweils eine Frage: ${fragen.map((f) => FRAGEN[f.id].label).join(', ')}. Was der Anrufer schon gesagt hat, fragst du nicht noch einmal.`,
    `Mach keine Zusagen zu Preisen, Terminen oder Ankunftszeiten und gib keine Auskünfte aus Kundendaten oder Rechnungen. Sag stattdessen, dass sich jemand aus dem Team meldet.`,
    `Notfall ist, was einen Schaden schnell größer macht oder Menschen gefährdet, zum Beispiel: ${k.notfallStichworte.join(', ') || 'Rohrbruch, Gasgeruch'}.`,
    `Bei Gasgeruch, Brandgeruch oder Gefahr für Menschen sagst du zuerst: „Bitte verlassen Sie das Gebäude und rufen Sie den Notruf 112 oder den Notdienst Ihres Gasversorgers.“`,
    nummer
      ? `Bei einem Notfall rufst du das Werkzeug an_bereitschaft_weiterleiten auf und verbindest mit der Bereitschaft${bereitschaftName ? ` (${bereitschaftName})` : ''}.`
      : `Bei einem Notfall sagst du, dass die Meldung sofort als Notfall an den Betrieb geht.`,
    `Geschäftszeiten: ${zeiten}. Am Ende fasst du kurz zusammen, was du aufgenommen hast, und verabschiedest dich.`,
  ].join('\n');
  return {
    version: 1,
    sprache: 'de-DE',
    firma,
    ansage: ansageText(k.begruessung, firma),
    anweisung,
    fragen,
    zielSchema: zielSchema(fragen.map((f) => f.id)),
    werkzeuge: WERKZEUGE,
    notfallStichworte: k.notfallStichworte,
    weiterleitung: nummer ? { nummer, name: bereitschaftName } : undefined,
    annahme: { modus: k.annahme, nachSekunden: k.annahme === 'immer' || k.annahme === 'ausserhalb' ? 0 : k.klingelSekunden, geschaeftszeiten: zeiten },
    maxDauerSekunden: 300,
  };
}

// ------------------------------------------------------------------ Ergebnis übersetzen

export type Schritt = 'anfrage' | 'rueckruf' | 'notiz';

export interface Uebersetzung {
  schritt: Schritt;
  dringlichkeit: AnrufDringlichkeit;
  notfall: boolean;
  notfallGrund?: string;
  /** Text für Anfrage/Rückruf: Anliegen plus Adresse, Erreichbarkeit, Rückrufnummer */
  anliegen: string;
  name?: string;
  /** beste Nummer für den Rückruf */
  nummer: string;
  /** Gateway-Aktionen in Reihenfolge */
  aktionen: string[];
  details: AnrufDetails;
}

export const SCHRITT_AKTION: Record<Schritt, string> = {
  anfrage: 'call.request_create',
  rueckruf: 'call.callback_create',
  notiz: 'call.note_create',
};

const DRINGEND = /\b(dringend|eilig|sofort|schnellstm|heute noch|so schnell wie)/i;
const RUECKRUF = /zur(ü|ue)ckruf|r(ü|ue)ckruf|ruf\w* .*zur(ü|ue)ck|melden sie sich/i;

/**
 * Gesprächsergebnis (strukturierte Felder vom Anbieter) → nächster Schritt in Macher.
 *
 * Reihenfolge: 1. Notfall per Stichwort (Regel), 2. Einschätzung des Assistenten (ergänzend), 3. Vorschlag des
 * Assistenten für den Schritt, 4. Standard: mit Anliegen → Anfrage, sonst Rückruf. Ein bekannter Kunde mit offenem
 * Auftrag und ohne neues Anliegen wird zum Rückruf.
 */
export function ergebnisUebersetzen(e: AnrufErgebnis, k: Pick<AssistentKonfig, 'notfallStichworte'>, kontext: { kundeName?: string; offeneAuftraege?: number } = {}): Uebersetzung {
  const f = e.felder ?? {};
  const kern = (f.anliegen ?? '').trim() || (e.zusammenfassung ?? '').trim();
  const anruferText = [kern, e.zusammenfassung, f.dringlichkeit, ...(e.transkript ?? []).filter((z) => z.wer === 'anrufer').map((z) => z.text)].filter(Boolean).join('\n');

  const stichwort = notfallTreffer(anruferText, k.notfallStichworte);
  const kiNotfall = e.dringlichkeit === 'notfall' || /notfall/i.test(f.dringlichkeit ?? '');
  const notfall = !!stichwort || kiNotfall;
  const notfallGrund = stichwort ? `Stichwort „${stichwort}“` : kiNotfall ? 'Einschätzung des Assistenten' : undefined;
  const dringlichkeit: AnrufDringlichkeit = notfall ? 'notfall' : e.dringlichkeit === 'dringend' || /dringend/i.test(f.dringlichkeit ?? '') || DRINGEND.test(kern) ? 'dringend' : 'normal';

  let schritt: Schritt;
  if (notfall) schritt = 'anfrage';
  else if (e.ergebnis) schritt = e.ergebnis;
  else if (!kern) schritt = 'rueckruf';
  else if (RUECKRUF.test(kern) || (kontext.kundeName && (kontext.offeneAuftraege ?? 0) > 0 && kern.length < 80 && /\?|frage|stand|termin|rechnung/i.test(kern))) schritt = 'rueckruf';
  else schritt = 'anfrage';

  const nummer = (f.rueckrufnummer ?? '').trim() || e.von.trim();
  const zusatz = [
    f.adresse?.trim() ? `Adresse: ${f.adresse.trim()}` : null,
    f.erreichbarkeit?.trim() ? `Erreichbar: ${f.erreichbarkeit.trim()}` : null,
    f.rueckrufnummer?.trim() && f.rueckrufnummer.trim() !== e.von.trim() ? `Rückrufnummer: ${f.rueckrufnummer.trim()}` : null,
  ].filter(Boolean);
  const anliegen = [kern || 'Anruf ohne Anliegen – bitte zurückrufen.', ...zusatz].join('\n');

  const details: AnrufDetails = {
    quelle: 'ki-assistent',
    anrufId: e.anrufId,
    anbieter: e.anbieter,
    nummer: e.von || undefined,
    beginn: e.beginn,
    dauerSekunden: e.dauerSekunden,
    zusammenfassung: e.zusammenfassung?.trim() || undefined,
    felder: Object.fromEntries(Object.entries(f).filter(([, v]) => typeof v === 'string' && v.trim())) as Record<string, string>,
    dringlichkeit,
    notfallGrund,
    ergebnis: notfall ? 'weitergeleitet' : schritt,
    transkript: e.transkript?.length ? e.transkript : undefined,
    durchgestellt: e.weitergeleitet || undefined,
    status: 'neu',
  };
  return {
    schritt,
    dringlichkeit,
    notfall,
    notfallGrund,
    anliegen,
    name: f.name?.trim() || undefined,
    nummer,
    aktionen: [SCHRITT_AKTION[schritt], ...(notfall ? ['call.emergency_forward'] : [])],
    details,
  };
}

/**
 * Rohe Nachricht, wie der Eingangs-Webhook sie ablegt (`anruf.status: 'neu'`). Die App übersetzt sie danach über die
 * Automation „Anrufe vom Telefonassistenten eintragen“ in Anfrage oder Rückruf (`ergebnisAusDetails` → `ergebnisUebersetzen`).
 */
export function rohNachricht(e: AnrufErgebnis): Omit<Nachricht, keyof Basis> {
  const wer = e.felder?.name?.trim() || e.von.trim() || 'Unbekannt';
  return {
    kanal: 'telefon',
    richtung: 'ein',
    betreff: `Anruf von ${wer}`,
    text: (e.felder?.anliegen ?? e.zusammenfassung ?? '').trim() || 'Anruf ohne Anliegen',
    gelesen: false,
    anruf: {
      quelle: 'ki-assistent',
      anrufId: e.anrufId,
      anbieter: e.anbieter,
      nummer: e.von || undefined,
      beginn: e.beginn,
      dauerSekunden: e.dauerSekunden,
      zusammenfassung: e.zusammenfassung,
      felder: e.felder as Record<string, string>,
      dringlichkeit: e.dringlichkeit ?? 'normal',
      ergebnis: e.ergebnis,
      transkript: e.transkript,
      durchgestellt: e.weitergeleitet || undefined,
      status: 'neu',
    },
  };
}

/** Umkehrung von `rohNachricht`: das Gesprächsergebnis aus einer abgelegten Nachricht */
export function ergebnisAusDetails(d: AnrufDetails): AnrufErgebnis {
  return {
    anrufId: d.anrufId ?? '',
    anbieter: d.anbieter ?? 'unbekannt',
    von: d.nummer ?? '',
    beginn: d.beginn,
    dauerSekunden: d.dauerSekunden,
    felder: (d.felder ?? {}) as AnrufErgebnis['felder'],
    zusammenfassung: d.zusammenfassung,
    dringlichkeit: d.dringlichkeit,
    ergebnis: d.ergebnis === 'weitergeleitet' ? undefined : d.ergebnis,
    weitergeleitet: d.durchgestellt,
    transkript: d.transkript,
  };
}

/** „Ahornweg 5, 34117 Kassel“ → { strasse, plz, ort } – nur wenn eine Hausnummer erkennbar ist */
export function adresseZerlegen(text: string | undefined): { strasse: string; plz: string; ort: string } | undefined {
  const m = (text ?? '').trim().match(/^(.+?\d+\s*[a-zA-Z]?)\s*(?:,\s*|\s+)(?:(\d{5})\s*)?([^\d,][^,]*)?$/);
  if (!m) return /\d/.test(text ?? '') ? { strasse: (text ?? '').trim(), plz: '', ort: '' } : undefined;
  return { strasse: m[1].trim(), plz: m[2] ?? '', ort: (m[3] ?? '').trim() };
}

export const DRINGLICHKEIT_TEXT: Record<AnrufDringlichkeit, string> = { normal: 'Normal', dringend: 'Dringend', notfall: 'Notfall' };

export const ERGEBNIS_TEXT: Record<NonNullable<AnrufDetails['ergebnis']>, string> = {
  anfrage: 'Anfrage angelegt',
  rueckruf: 'Rückruf eingetragen',
  notiz: 'Notiz',
  weitergeleitet: 'An Bereitschaft weitergegeben',
};
