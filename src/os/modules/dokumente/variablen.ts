/**
 * Dokumenten-Engine: dynamische Variablen für alle Geschäftsdokumente.
 *
 * `{kunde.name}`, `{auftrag.titel}`, `{dokument.nummer}`, `{summe}`, `{offen}`, `{faellig}` … – gelesen aus den
 * Objekten (nichts kopiert). Ersetzt wird mit der Platzhalter-Logik aus „Vorlagen“ (Textbausteine), damit es
 * genau ein Variablensystem gibt. Die alten Namen (`{kunde}`, `{betrag}` …) gelten weiter.
 */
import { db } from '@core/db';
import { datum, euro } from '@core/format';
import type { Bezug, ID } from '@core/objects';
import { angebotSummen, ustSatz } from '@modules/angebote/daten';
import { artLabel } from '@modules/berichte/daten';
import { berichte } from '@modules/berichte/daten';
import { abnahmen } from '@modules/abnahme/daten';
import { mahnungen, STUFE_LABEL } from '@modules/mahnungen/daten';
import { ART_LABEL, offenerBetrag, rechnungsSummen } from '@modules/rechnungen/logik';
import { rechnungX } from '@modules/rechnungen/typen';
import { fehlendePlatzhalter, kontextAus, mitPunktNamen, platzhalterErsetzen, standardKontext, vorlageFinden, type Kontext } from '@modules/vorlagen/daten';
import { ausfuehrungAus, geschaeftsdokumentErstellen, geschaeftsdokumente, GESCHAEFTS_LABEL, summeVon, type GeschaeftsArt, type Geschaeftsdokument } from './daten';

export type { Kontext };

/** Geldwerte einer Summe als Variablen */
function summenVariablen(zahlbar: number, netto: number, ust: number, brutto: number): Kontext {
  return { summe: euro(zahlbar), betrag: euro(zahlbar), 'summe.netto': euro(netto), 'summe.ust': euro(ust), 'summe.brutto': euro(brutto) };
}

/** Artikel für Sätze wie „anbei erhalten Sie unseren Lieferschein“ */
const UNSER: Record<string, string> = {
  Angebot: 'unser',
  Abnahmeprotokoll: 'unser',
  Prüfprotokoll: 'unser',
  Lieferschein: 'unseren',
  Rapport: 'unseren',
  Arbeitsbericht: 'unseren',
  Baustellenbericht: 'unseren',
};

function dokumentVariablen(art: string, nummer: string | undefined, d: string | undefined, titel?: string): Kontext {
  return {
    'dokument.art': art,
    'dokument.nummer': nummer || undefined,
    'dokument.datum': d ? datum(d) : undefined,
    'dokument.titel': titel,
    'dokument.bezeichnung': `${UNSER[art] ?? 'unsere'} ${art}${nummer ? ` ${nummer}` : ''}`,
  };
}

/**
 * Für den Versand: Zeilen, in denen noch eine Variable ohne Wert steht, fallen weg (statt „{betrieb.telefon}“ beim Kunden).
 * Gibt den bereinigten Text und die fehlenden Variablen zurück.
 */
export function ohneLuecken(text: string): { text: string; fehlend: string[] } {
  const fehlend = [...text.matchAll(/\{([a-zA-Z0-9_.äöüÄÖÜß]+)\}/g)].map((m) => m[1]);
  if (!fehlend.length) return { text, fehlend };
  const zeilen = text.split('\n').filter((z) => !/\{[a-zA-Z0-9_.äöüÄÖÜß]+\}/.test(z));
  return { text: zeilen.join('\n').replace(/\n{3,}/g, '\n\n').trim(), fehlend: [...new Set(fehlend)] };
}

/** Bezeichnung eines Dokuments für Texte, z. B. „Schlussrechnung“ oder „2. Mahnung“ */
export function dokumentLabel(bezug: Bezug): string {
  switch (bezug.typ) {
    case 'rechnungen': {
      const r = rechnungX(bezug.id);
      return r ? (r.stornoFuerId ? 'Stornorechnung' : ART_LABEL[r.art]) : 'Rechnung';
    }
    case 'angebote':
      return 'Angebot';
    case 'mahnungen': {
      const m = mahnungen.get(bezug.id);
      return m ? STUFE_LABEL[m.stufe] : 'Mahnung';
    }
    case 'berichte': {
      const b = berichte.get(bezug.id);
      return b ? artLabel(b.art) : 'Bericht';
    }
    case 'abnahmen':
      return 'Abnahmeprotokoll';
    case 'geschaeftsdokumente': {
      const g = geschaeftsdokumente.get(bezug.id);
      return g ? GESCHAEFTS_LABEL[g.art] : 'Dokument';
    }
  }
  return 'Dokument';
}

/**
 * Alle Variablen zu einem Dokument (oder Auftrag/Kunden). Werte werden gelesen, nicht gespeichert.
 * Beträge sind immer die des Dokuments selbst – bei der Schlussrechnung also der Zahlbetrag nach Abzügen.
 */
export function variablenFuer(bezug: Bezug): Kontext {
  let k: Kontext = {};
  const label = dokumentLabel(bezug);
  switch (bezug.typ) {
    case 'rechnungen': {
      const r = rechnungX(bezug.id);
      if (!r) break;
      const s = rechnungsSummen(r);
      k = {
        ...kontextAus({ rechnungId: r.id }),
        ...dokumentVariablen(label, r.nummer, r.datum, r.titel),
        ...summenVariablen(s.zahlbetrag, s.netto, s.ust, s.brutto),
        offen: euro(r.status === 'entwurf' ? s.zahlbetrag : offenerBetrag(r)),
        faellig: datum(r.faelligAm),
        rechnungsnummer: r.nummer || undefined,
        leistungszeitraum: r.leistungszeitraum,
      };
      break;
    }
    case 'angebote': {
      const a = db.angebote.get(bezug.id);
      if (!a) break;
      const s = angebotSummen(a);
      k = { ...kontextAus({ angebotId: a.id }), ...dokumentVariablen(label, a.nummer, a.datum, a.titel), ...summenVariablen(s.brutto, s.netto, s.ust, s.brutto), gueltig_bis: datum(a.gueltigBis) };
      break;
    }
    case 'mahnungen': {
      const m = mahnungen.get(bezug.id);
      const r = rechnungX(m?.rechnungId);
      if (!m || !r) break;
      const gesamt = m.offen + m.gebuehr + m.zinsen;
      k = {
        ...kontextAus({ rechnungId: r.id }),
        ...dokumentVariablen(label, r.nummer, m.datum),
        summe: euro(gesamt),
        offen: euro(m.offen),
        gebuehr: euro(m.gebuehr),
        zinsen: euro(m.zinsen),
        faellig: datum(m.frist),
        rechnungsnummer: r.nummer,
      };
      break;
    }
    case 'geschaeftsdokumente': {
      const g = geschaeftsdokumente.get(bezug.id);
      if (!g) break;
      k = { ...kontextAus({ auftragId: g.auftragId }), ...dokumentVariablen(label, g.nummer, g.datum, g.titel), ausfuehrung: g.ausfuehrung };
      if (g.art === 'auftragsbestaetigung') {
        const s = summeVon(g, ustSatz());
        k = { ...k, ...summenVariablen(s.brutto, s.netto, s.ust, s.brutto), angebotsnummer: db.angebote.get(g.angebotId)?.nummer };
      }
      break;
    }
    case 'berichte': {
      const b = berichte.get(bezug.id);
      if (b) k = { ...kontextAus({ auftragId: b.auftragId }), ...dokumentVariablen(label, b.nummer, b.datum) };
      break;
    }
    case 'abnahmen': {
      const a = abnahmen.get(bezug.id);
      if (a) k = { ...kontextAus({ auftragId: a.auftragId }), ...dokumentVariablen(label, undefined, a.datum) };
      break;
    }
    case 'auftraege':
      k = { ...kontextAus({ auftragId: bezug.id }), ausfuehrung: ausfuehrungAus(bezug.id) };
      break;
    case 'kunden':
      k = kontextAus({ kundeId: bezug.id });
      break;
  }
  return mitPunktNamen({ ...standardKontext(), ...k });
}

/** Text mit allen Variablen eines Dokuments. Fehlende bleiben als `{name}` stehen – so fällt die Lücke auf. */
export function textFuer(text: string, bezug: Bezug, extra: Kontext = {}): string {
  return platzhalterErsetzen(text, { ...variablenFuer(bezug), ...extra });
}

/** Welche Variablen im Text haben für dieses Dokument keinen Wert? */
export function fehlendeVariablen(text: string, bezug: Bezug, extra: Kontext = {}): string[] {
  return fehlendePlatzhalter(text, { ...variablenFuer(bezug), ...extra });
}

/**
 * Textbaustein aus „Vorlagen“ (über den Schlüssel) mit Variablen. Gibt es den Baustein (noch) nicht,
 * gilt der mitgegebene Standardtext – bestehende Betriebe brauchen nichts nachzupflegen.
 */
export function textbaustein(schluessel: string, standard: string, bezug: Bezug, extra: Kontext = {}): { text: string; betreff?: string } {
  const v = vorlageFinden(schluessel);
  const kontext = { ...variablenFuer(bezug), ...extra };
  return { text: platzhalterErsetzen(v?.text ?? standard, kontext), betreff: v?.betreff ? platzhalterErsetzen(v.betreff, kontext) : undefined };
}

// ------------------------------------------------------------------ Auftragsbestätigung & Lieferschein mit Textbausteinen

const STANDARD_TEXTE: Record<GeschaeftsArt, { text: string; schluss?: string }> = {
  auftragsbestaetigung: {
    text: '{kunde.anrede},\n\nvielen Dank für Ihren Auftrag „{auftrag.titel}“. Hiermit bestätigen wir Ihnen die folgenden Leistungen:',
    schluss: 'Ausführung: {ausfuehrung}. Den genauen Termin stimmen wir rechtzeitig mit Ihnen ab.\n\nMit freundlichen Grüßen\n{betrieb.name}',
  },
  lieferschein: {
    text: 'Für „{auftrag.titel}“ haben wir folgendes Material geliefert. Bitte prüfen Sie die Lieferung und bestätigen Sie den Empfang mit Ihrer Unterschrift.',
  },
};

/** Auftragsbestätigung oder Lieferschein anlegen – Texte aus den Textbausteinen, Variablen gefüllt */
export function geschaeftsdokumentMitTexten(auftragId: ID, art: GeschaeftsArt): Geschaeftsdokument | undefined {
  const bezug: Bezug = { typ: 'auftraege', id: auftragId };
  const std = STANDARD_TEXTE[art];
  const ausfuehrung = ausfuehrungAus(auftragId) ?? 'nach Absprache';
  const text = textbaustein(`${art}.text`, std.text, bezug, { ausfuehrung }).text;
  const schluss = std.schluss ? textbaustein(`${art}.schluss`, std.schluss, bezug, { ausfuehrung }).text : undefined;
  return geschaeftsdokumentErstellen(auftragId, art, { text, schluss });
}
