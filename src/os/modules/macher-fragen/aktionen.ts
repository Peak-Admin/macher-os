/**
 * Weitere Absichten, die Aktionen vorbereiten: Rechnung senden, Termin verschieben, Kunden schreiben,
 * Material reservieren, Urlaub eintragen und genehmigen, Kunde anlegen.
 *
 * Jede Absicht baut nur einen Plan aus strukturierten Aktionen (`@core/gateway`). Ausgeführt wird erst nach
 * Bestätigung – durch die Aktion des Besitzer-Moduls. Texte an Kunden schreibt Luna, wenn sie angeschlossen ist;
 * sonst eine einfache Vorlage, die der Mensch vor dem Senden ändern kann.
 */
import { db } from '@core/db';
import { datumKurz, plusTage, uhrzeit } from '@core/format';
import type { AbsichtDef, Plan } from '@core/gateway';
import type { Abwesenheit, Artikel, Datum, Kunde, Rechnung, Termin } from '@core/objects';
import type { Antwort, Kontext } from './assistent';
import { FRAGE, LAUFEND, findeAuftrag, findeKunde, findeMitarbeiter, gross, klein, planAntwort, schritte, stand } from './hilfen';
import { zeitraumAus } from './zeit';

type Def = AbsichtDef<Antwort>;

const betriebName = () => db.betrieb.get('betrieb')?.name ?? '';

/** „Familie Hoffmann“ → „Guten Tag Familie Hoffmann“; Firmen ohne Namen in der Anrede */
function anrede(k: Kunde): string {
  const ap = k.ansprechpartner?.[0];
  if (ap?.name) return `Guten Tag ${ap.name}`;
  return k.art === 'privat' ? `Guten Tag ${k.name}` : 'Guten Tag';
}

/** Einfache Vorlage, wenn kein Modell angeschlossen ist – bewusst schlicht, der Mensch kann sie ändern */
export function vorlage(k: Kunde, inhalt: string): string {
  const satz = gross(inhalt.trim().replace(/[.!\s]+$/, ''));
  return `${anrede(k)},\n\n${satz}.\n\nViele Grüße\n${betriebName()}`.trim();
}

/** „…, dass wir später kommen“ → „wir später kommen“ – der Kern der Nachricht */
function anliegen(text: string): string {
  const m = text.match(/\b(?:dass|das)\s+(.+)$/i) ?? text.match(/:\s*(.+)$/);
  return (m?.[1] ?? '').trim();
}

// ------------------------------------------------------------------ Rechnung senden

function rechnungSenden(k: Kontext, frage: string): Antwort {
  const nr = frage.match(/\bR-\d{4}-\d{3,4}\b/i);
  const kunde = findeKunde(frage);
  const r: Rechnung | undefined = nr
    ? db.rechnungen.where((x) => x.nummer.toLowerCase() === nr[0].toLowerCase())[0]
    : kunde
      ? db.rechnungen.where((x) => x.kundeId === kunde.id && x.status === 'entwurf').sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))[0]
      : undefined;
  if (!r) {
    const a = findeAuftrag(frage, ['abrechnung', 'abnahme', 'in_arbeit']);
    return {
      absicht: 'rechnung-unklar',
      text: kunde ? `Für ${kunde.name} liegt kein Rechnungsentwurf vor.` : 'Welche Rechnung soll raus? Nenn mir den Kunden oder die Rechnungsnummer.',
      folgefragen: a ? [`Mach aus dem Auftrag ${a.nummer} eine Rechnung`] : ['Welche Rechnungen sind offen?'],
    };
  }
  const empf = db.kunden.get(r.kundeId);
  const plan: Plan = {
    titel: 'Rechnung senden',
    schritte: schritte([{ aktion: 'invoice.send', absicht: 'invoice.send', daten: { rechnungId: r.id }, label: `Rechnung festschreiben und an ${empf?.email || empf?.telefon || empf?.name || 'Kunde'} senden` }]),
  };
  return planAntwort(
    'rechnung-senden',
    `${r.titel} für ${empf?.name ?? 'Kunde'}. Beim Senden bekommt die Rechnung ihre feste Nummer und ist danach nicht mehr änderbar.`,
    plan,
    `Rechnungsentwurf · ${stand(k)}`,
  );
}

// ------------------------------------------------------------------ Termin verschieben

/** „9 Uhr“, „9:30 Uhr“, „um 14“ → „09:00“ */
export function uhrAusText(text: string): string | undefined {
  const m = text.match(/\b(?:um|ab|gegen)?\s*(\d{1,2})(?::(\d{2}))?\s*uhr\b/i) ?? text.match(/\b(?:um|ab|gegen)\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  return h < 24 && min < 60 ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` : undefined;
}

const ZAHL: Record<string, number> = { einen: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };

/** Neues Datum: „um zwei Tage“, „auf Montag“, „auf den 12.10.“, „auf nächste Woche“ */
export function neuesDatum(text: string, alt: Datum, heute: Datum): Datum | undefined {
  const t = klein(text);
  const um = t.match(/\bum\s+(\d{1,2}|einen|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\s+(tage?n?|wochen?)\b/);
  if (um) {
    const n = ZAHL[um[1]] ?? Number(um[1]);
    return plusTage(alt, um[2].startsWith('woche') ? n * 7 : n);
  }
  const ab = t.search(/\b(auf|zum|nach)\b/);
  const z = zeitraumAus(ab >= 0 ? t.slice(ab) : t, heute);
  return z?.von;
}

function naechsterTermin(kundeId: string, k: Kontext): Termin | undefined {
  const jetzt = k.jetzt.toISOString();
  return db.termine
    .where((t) => t.kundeId === kundeId && t.status !== 'abgesagt' && t.status !== 'erledigt' && t.ende >= jetzt)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

function grund(text: string): string | undefined {
  return text.match(/\b(?:wegen|weil)\s+(.+?)(?:\s+(?:um|auf)\s+\S+.*)?[.!]?$/i)?.[1]?.trim();
}

/** Minimaler Kontext für Luna: nur, was die Nachricht braucht */
function verschiebenKontext(k: Kontext, text: string) {
  const kunde = findeKunde(text);
  const t = kunde ? naechsterTermin(kunde.id, k) : undefined;
  const neu = t ? neuesDatum(text, t.start.slice(0, 10), k.heute) : undefined;
  const uhr = uhrAusText(text);
  return {
    betrieb: betriebName(),
    kunde: kunde ? { name: kunde.name, art: kunde.art, ansprechpartner: kunde.ansprechpartner?.[0]?.name } : undefined,
    termin: t ? { titel: t.titel, alt: `${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`, neu: neu ? `${datumKurz(neu)}${uhr ? `, ${uhr} Uhr` : `, ${uhrzeit(t.start)} Uhr`}` : undefined } : undefined,
    grund: grund(text),
    aufgabe: 'Schreib dem Kunden eine kurze Nachricht, dass sich sein Termin verschiebt, mit altem und neuem Termin.',
  };
}

function terminVerschieben(k: Kontext, frage: string, modellText?: string): Antwort {
  const kunde = findeKunde(frage);
  const t = kunde ? naechsterTermin(kunde.id, k) : undefined;
  if (!kunde || !t) return { absicht: 'termin-unklar', text: kunde ? `Für ${kunde.name} ist kein kommender Termin geplant.` : 'Welcher Termin? Nenn mir den Kunden, z. B. „Verschieb den Termin bei Hoffmann auf Montag“.' };
  const tag = neuesDatum(frage, t.start.slice(0, 10), k.heute);
  if (!tag) return { absicht: 'termin-unklar', text: 'Auf wann? Zum Beispiel „auf Montag“, „um zwei Tage“ oder „auf den 12.10.“.' };
  const uhr = t.ganztags ? undefined : uhrAusText(frage.slice(Math.max(0, klein(frage).search(/\b(auf|um)\b/))));
  const neuText = `${datumKurz(tag)}${uhr ? `, ${uhr} Uhr` : t.ganztags ? '' : `, ${uhrzeit(t.start)} Uhr`}`;
  const w = grund(frage);
  const nachricht =
    modellText ??
    vorlage(kunde, `Ihr Termin am ${datumKurz(t.start)}${t.ganztags ? '' : ` um ${uhrzeit(t.start)} Uhr`} muss sich leider${w ? ` wegen ${w}` : ''} verschieben. Neuer Termin: ${neuText}. Bitte geben Sie kurz Bescheid, falls das nicht passt`);
  const plan: Plan = {
    titel: `Termin ${kunde.name} verschieben`,
    schritte: schritte([
      { aktion: 'appointment.reschedule', absicht: 'appointment.reschedule', daten: { terminId: t.id, tag, uhr }, label: `${t.titel || 'Termin'}: ${datumKurz(t.start)} → ${neuText}` },
      { aktion: 'message.send', absicht: 'appointment.reschedule', daten: { kundeId: kunde.id, auftragId: t.auftragId, text: nachricht }, label: `${kunde.name} informieren`, textFeld: { feld: 'text', label: 'Nachricht an den Kunden' } },
    ]),
  };
  return planAntwort(
    'termin-verschieben',
    `Ich verschiebe den Termin und bereite eine Nachricht an ${kunde.name} vor${modellText ? ' (von Luna formuliert)' : ''}. Prüf beides – erst dann passiert etwas.`,
    plan,
    `Kalender · ${stand(k)}`,
  );
}

// ------------------------------------------------------------------ Kunden schreiben

function nachrichtKontext(k: Kontext, text: string) {
  const kunde = findeKunde(text);
  const a = findeAuftrag(text, [...LAUFEND, 'angebot', 'besichtigung', 'anfrage']);
  const t = kunde ? naechsterTermin(kunde.id, k) : undefined;
  return {
    betrieb: betriebName(),
    kunde: kunde ? { name: kunde.name, art: kunde.art, ansprechpartner: kunde.ansprechpartner?.[0]?.name } : undefined,
    auftrag: a ? { titel: a.titel, nummer: a.nummer } : undefined,
    naechsterTermin: t ? `${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr` : undefined,
    anliegen: anliegen(text),
    heute: k.heute,
  };
}

function kundenSchreiben(k: Kontext, frage: string, modellText?: string): Antwort {
  const kunde = findeKunde(frage);
  if (!kunde) return { absicht: 'kunde-unklar', text: 'Wem soll ich schreiben? Nenn mir den Kunden.' };
  const inhalt = anliegen(frage);
  if (!inhalt && !modellText) return { absicht: 'nachricht-unklar', text: `Was soll ${kunde.name} erfahren? Zum Beispiel: „Schreib ${kunde.name}, dass wir gegen neun kommen“.` };
  const a = findeAuftrag(frage, [...LAUFEND, 'angebot', 'besichtigung', 'anfrage']);
  const text = modellText ?? vorlage(kunde, inhalt);
  const plan: Plan = {
    titel: `Nachricht an ${kunde.name}`,
    schritte: schritte([{ aktion: 'message.send', absicht: 'message.send', daten: { kundeId: kunde.id, auftragId: a?.id, text }, label: `An ${kunde.email || kunde.telefon || kunde.name} senden`, textFeld: { feld: 'text', label: 'Nachricht' } }]),
  };
  return planAntwort('nachricht-entwurf', `Hier ist ein Entwurf${modellText ? ' von Luna' : ''}. Ändere ihn, wenn du magst – gesendet wird erst nach deiner Bestätigung.`, plan, `Kundenakte · ${stand(k)}`);
}

// ------------------------------------------------------------------ Material reservieren

/** Artikel, dessen Namensteile am besten im Text vorkommen */
export function findeArtikel(text: string): Artikel | undefined {
  const w = new Set(klein(text).replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(Boolean));
  let best: { a: Artikel; score: number } | undefined;
  for (const a of db.artikel.where((x) => x.aktiv !== false)) {
    const teile = klein(a.name).replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter((x) => x.length >= 3);
    const score = teile.filter((x) => w.has(x) || w.has(x.replace(/e?n$/, '')) || [...w].some((y) => y.length >= 4 && x.startsWith(y))).length;
    if (score > 0 && (!best || score > best.score)) best = { a, score };
  }
  return best?.a;
}

function materialReservieren(k: Kontext, frage: string): Antwort {
  const artikel = findeArtikel(frage);
  const a = findeAuftrag(frage, [...LAUFEND, 'angebot']);
  const m = frage.match(/(\d+(?:[.,]\d+)?)/);
  const menge = m ? Number(m[1].replace(',', '.')) : undefined;
  if (!artikel) return { absicht: 'material-unklar', text: 'Welchen Artikel? Ich finde ihn nicht im Artikelstamm.' };
  if (!a) return { absicht: 'auftrag-unklar', text: 'Für welchen Auftrag? Nenn mir den Kunden oder die Auftragsnummer.' };
  if (!menge) return { absicht: 'material-unklar', text: `Wie viel ${artikel.name}?` };
  const plan: Plan = {
    titel: 'Material reservieren',
    schritte: schritte([{ aktion: 'material.reserve', absicht: 'material.reserve', daten: { auftragId: a.id, artikelId: artikel.id, menge }, label: `${menge.toLocaleString('de-DE')} ${artikel.einheit} ${artikel.name} für ${a.nummer} bereitlegen` }]),
  };
  return planAntwort('material-reservieren', `Ich lege das Material für ${a.titel} zurück. Es zählt dann im Bedarf als reserviert.`, plan, `Artikel und Lager · ${stand(k)}`);
}

// ------------------------------------------------------------------ Urlaub

/** „vom 12.10. bis 16.10.“, „nächste Woche“, „am Freitag“ → Zeitraum */
export function urlaubAus(text: string, heute: Datum): { von: Datum; bis: Datum } | undefined {
  const t = klein(text);
  const vonBis = t.match(/\b(?:vom|von|ab)\s+(.+?)\s+bis\s+(?:zum\s+)?(.+)$/);
  if (vonBis) {
    const von = zeitraumAus(vonBis[1], heute)?.von;
    const bis = von ? zeitraumAus(vonBis[2], von)?.bis : undefined;
    if (von && bis) return { von, bis };
  }
  const z = zeitraumAus(t, heute);
  if (!z) return undefined;
  // „nächste Woche“: nur Montag bis Freitag
  return z.tag ? { von: z.von, bis: z.bis } : { von: z.von, bis: plusTage(z.von, 4) };
}

function urlaubEintragen(k: Kontext, frage: string): Antwort {
  const fuer = frage.match(/\bfür\s+(\S+)/i);
  const wer = (fuer ? findeMitarbeiter(fuer[1]) : undefined) ?? k.ich;
  const z = urlaubAus(frage, k.heute);
  if (!wer) return { absicht: 'urlaub-unklar', text: 'Für wen ist der Urlaub?' };
  if (!z) return { absicht: 'urlaub-unklar', text: 'Von wann bis wann? Zum Beispiel „Urlaub vom 12.10. bis 16.10.“.' };
  const plan: Plan = {
    titel: 'Urlaub eintragen',
    schritte: schritte([{ aktion: 'vacation.create', absicht: 'vacation.create', daten: { mitarbeiterId: wer.id, von: z.von, bis: z.bis }, label: `Urlaub für ${wer.vorname}: ${datumKurz(z.von)} bis ${datumKurz(z.bis)}` }]),
  };
  return planAntwort('urlaub-entwurf', k.darf('personal') ? 'Ich trage den Urlaub direkt genehmigt ein.' : 'Ich stelle den Antrag – der Chef entscheidet.', plan, stand(k));
}

function urlaubGenehmigen(k: Kontext, frage: string): Antwort {
  const wer = findeMitarbeiter(frage);
  const offen: Abwesenheit[] = db.abwesenheiten.where((a) => a.status === 'beantragt' && (!wer || a.mitarbeiterId === wer.id)).sort((a, b) => a.von.localeCompare(b.von));
  if (!offen.length) return { absicht: 'urlaub-keiner', text: wer ? `${wer.vorname} hat gerade keinen offenen Antrag.` : 'Es gibt keinen offenen Urlaubsantrag.' };
  const plan: Plan = {
    titel: 'Urlaub genehmigen',
    schritte: schritte(
      offen.slice(0, 5).map((a) => ({
        aktion: 'vacation.approve',
        absicht: 'vacation.approve',
        daten: { abwesenheitId: a.id },
        label: `${db.mitarbeiter.get(a.mitarbeiterId)?.vorname ?? 'Mitarbeiter'}: ${datumKurz(a.von)} bis ${datumKurz(a.bis)}`,
      })),
    ),
  };
  return planAntwort('urlaub-genehmigen', `${offen.length === 1 ? 'Ein Antrag wartet' : `${offen.length} Anträge warten`}. Wähl aus, was du genehmigst – der Mitarbeiter bekommt Bescheid.`, plan, `Abwesenheiten · ${stand(k)}`);
}

// ------------------------------------------------------------------ Kunde anlegen

export function kundeAusText(text: string): { name: string; telefon?: string; email?: string } {
  const email = text.match(/[^\s@,;:]+@[^\s@,;:]+\.[^\s@,;:]+/)?.[0];
  const telefon = text.match(/(?:\+\d{2}|0)[\d\s/()-]{6,}\d/)?.[0]?.trim();
  let rest = text.includes(':') ? text.slice(text.indexOf(':') + 1) : text.replace(/^.*?\bkunden?\b\s*(an\b)?/i, '');
  for (const x of [email, telefon]) if (x) rest = rest.replace(x, ' ');
  const name = rest
    .replace(/\b(an|anlegen|neu|neuer|neuen|tel\.?|telefon|e-?mail|mail)\b/gi, ' ')
    .replace(/[,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, telefon, email };
}

function kundeAnlegen(k: Kontext, frage: string): Antwort {
  const d = kundeAusText(frage);
  if (d.name.length < 2) return { absicht: 'kunde-unklar', text: 'Wie heißt der Kunde? Zum Beispiel „Leg einen Kunden an: Familie Weber, 0171 1234567“.' };
  const plan: Plan = {
    titel: 'Kunde anlegen',
    schritte: schritte([{ aktion: 'customer.create', absicht: 'customer.create', daten: d, label: [d.name, d.telefon, d.email].filter(Boolean).join(' · ') }]),
  };
  return planAntwort('kunde-entwurf', 'Ich lege den Kunden an. Adresse und Ansprechpartner ergänzt du in der Kundenakte.', plan, stand(k));
}

// ------------------------------------------------------------------ Absichten

const SENDEN = /\b(schick|schicke|send|sende|senden|versende|versenden|raus)\b/;

export const AKTIONS_ABSICHTEN: Def[] = [
  {
    id: 'invoice.send',
    titel: 'Rechnung senden',
    risiko: 'kritisch',
    rechte: ['geld', 'veroeffentlichen'],
    erkenne: (t) => !FRAGE.test(klein(t)) && /rechnung/.test(klein(t)) && SENDEN.test(klein(t)),
    beantworte: (t, _e, k) => rechnungSenden(k, t),
  },
  {
    id: 'appointment.reschedule',
    titel: 'Termin verschieben',
    risiko: 'kritisch',
    rechte: ['planen'],
    besserMit: 2,
    kontext: (_e, k, t) => verschiebenKontext(k, t),
    erkenne: (t) => /\b(verschieb|verschiebe|verschieben|verschiebt|schieb|schiebe|verlegen|verleg)\b/.test(klein(t)) && !FRAGE.test(klein(t)),
    beantworte: (t, _e, k, h) => terminVerschieben(k, t, h.modellText),
  },
  {
    id: 'material.reserve',
    titel: 'Material reservieren',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => /\b(reservier|reserviere|reservieren|zurücklegen|leg .* zurück|bereitlegen|leg .* bereit)\b/.test(klein(t)),
    beantworte: (t, _e, k) => materialReservieren(k, t),
  },
  {
    id: 'vacation.approve',
    titel: 'Urlaub genehmigen',
    risiko: 'kritisch',
    rechte: ['personal'],
    erkenne: (t) => /\b(genehmig|genehmige|genehmigen|freigeben|gib .* frei)\b/.test(klein(t)) && /\b(urlaub|antrag|anträge|abwesenheit)/.test(klein(t)),
    beantworte: (t, _e, k) => urlaubGenehmigen(k, t),
  },
  {
    id: 'vacation.create',
    titel: 'Urlaub eintragen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => /\burlaub\b/.test(klein(t)) && /\b(trag|trage|eintragen|beantrag|beantrage|beantragen|brauche|nehme|möchte|will|hätte gern)\b/.test(klein(t)),
    beantworte: (t, _e, k) => urlaubEintragen(k, t),
  },
  {
    id: 'customer.create',
    titel: 'Kunde anlegen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => /\b(kunde|kunden|kundin)\b/.test(klein(t)) && /\b(leg|lege|anlegen|neuer|neue|neuen|erfass|erfasse)\b/.test(klein(t)) && !FRAGE.test(klein(t)),
    beantworte: (t, _e, k) => kundeAnlegen(k, t),
  },
  {
    id: 'message.send',
    titel: 'Kunden schreiben',
    risiko: 'kritisch',
    rechte: ['veroeffentlichen'],
    besserMit: 2,
    kontext: (_e, k, t) => nachrichtKontext(k, t),
    erkenne: (t) => /^\s*(schreib|schreibe|schick|schicke|sag|sage|informier|informiere|gib)\b/.test(klein(t)) && /\b(dass|nachricht|bescheid)\b|:/.test(klein(t)) && !!findeKunde(t),
    beantworte: (t, _e, k, h) => kundenSchreiben(k, t, h.modellText),
  },
];
