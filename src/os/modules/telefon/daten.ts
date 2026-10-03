/**
 * Telefon & Empfang: Anrufe als `nachrichten` mit `kanal: 'telefon'`.
 * Aus einem Anruf wird eine Anfrage, ein Rückruf (Aufgabe) oder nur eine Notiz.
 */
import { db } from '@core/db';
import { heute } from '@core/format';
import type { Adresse, AnrufDetails, Auftrag, ID, Kunde, Nachricht } from '@core/objects';
import { anfrageAnlegen, findeKunden, normTelefon } from '@modules/anfragen/daten';

export type Dringlichkeit = 'normal' | 'heute' | 'notfall';
export type AnrufSchritt = 'anfrage' | 'rueckruf' | 'notiz';

export const DRINGLICHKEIT: { wert: Dringlichkeit; label: string }[] = [
  { wert: 'normal', label: 'Normal' },
  { wert: 'heute', label: 'Heute noch' },
  { wert: 'notfall', label: 'Notfall' },
];

export const SCHRITT_TEXT: Record<AnrufSchritt, string> = {
  anfrage: 'Neue Anfrage',
  rueckruf: 'Rückruf',
  notiz: 'Nur notieren',
};

/** Nächster Schritt als Strich-Icon im Umschalter */
export const SCHRITT_ICON: Record<AnrufSchritt, string> = {
  anfrage: 'plus',
  rueckruf: 'telefon',
  notiz: 'notiz',
};

const offen = (a: Auftrag) => !['erledigt', 'verloren'].includes(a.phase);

/** Anrufer per Nummer erkennen – nur sichere Treffer (gleiche Nummer) */
export function erkenneAnrufer(nummer: string, kunden: Kunde[] = db.kunden.all()): Kunde | undefined {
  if (normTelefon(nummer).length < 6) return undefined;
  const t = findeKunden({ telefon: nummer }, kunden).find((k) => k.grund === 'telefon');
  if (t) return t.kunde;
  // Telefon vor Ort (Hausmeister, Mieter) gehört zum Kunden des Orts
  const n = normTelefon(nummer);
  const ort = db.orte.all().find((o) => normTelefon(o.telefonVorOrt) === n);
  return ort ? db.kunden.get(ort.kundeId) : undefined;
}

export function offeneAuftraegeVon(kundeId: ID | undefined): Auftrag[] {
  if (!kundeId) return [];
  return db.auftraege.where((a) => a.kundeId === kundeId && offen(a)).sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
}

export interface NeuerAnruf {
  nummer: string;
  name?: string;
  kundeId?: ID;
  auftragId?: ID;
  anliegen: string;
  dringlichkeit: Dringlichkeit;
  schritt: AnrufSchritt;
  /** Rückruf: wer und bis wann */
  zustaendigId?: ID;
  faellig?: string;
  /** Adresse für einen neuen Kunden (Anfrage von Unbekannt) */
  adresse?: Adresse;
  /** Gesprächsdaten, z. B. vom Telefonassistenten */
  anruf?: AnrufDetails;
  /** vorhandene (vom Eingang abgelegte) Nachricht ergänzen statt eine neue anzulegen */
  nachrichtId?: ID;
  /** Standard: gelesen (von Hand notiert) */
  gelesen?: boolean;
}

export function betreffFuer(n: Pick<NeuerAnruf, 'name' | 'nummer' | 'dringlichkeit'>, kunde?: Kunde): string {
  const wer = kunde?.name || n.name?.trim() || n.nummer.trim() || 'Unbekannt';
  const d = n.dringlichkeit === 'notfall' ? ' · Notfall' : n.dringlichkeit === 'heute' ? ' · heute noch' : '';
  return `Anruf von ${wer}${d}`;
}

/** Auftragstitel aus dem Anliegen: erster Satz, an einer Wortgrenze gekürzt */
export function kurztitel(anliegen: string, max = 60): string {
  const satz = anliegen.trim().split('\n')[0].split(/(?<=[.!?:])\s/)[0].replace(/[.:]$/, '');
  if (satz.length <= max) return satz;
  const schnitt = satz.slice(0, max);
  return `${schnitt.slice(0, schnitt.lastIndexOf(' ') > 20 ? schnitt.lastIndexOf(' ') : max).replace(/[,;\s]+$/, '')} …`;
}

export function anrufErfassen(n: NeuerAnruf): { nachricht: Nachricht; auftrag?: Auftrag; kundeNeu?: boolean } {
  if (!n.anliegen.trim()) throw new Error('Ohne Anliegen kein Anruf.');
  let kunde = db.kunden.get(n.kundeId);
  let auftrag = db.auftraege.get(n.auftragId);
  let kundeNeu = false;
  const dringend = n.dringlichkeit !== 'normal';

  if (n.schritt === 'anfrage') {
    const r = anfrageAnlegen({
      kundeId: kunde?.id,
      neuerKunde: kunde ? undefined : { name: n.name?.trim() || `Anrufer ${n.nummer}`.trim(), telefon: n.nummer, adresse: n.adresse },
      titel: kurztitel(n.anliegen),
      beschreibung: n.anliegen,
      quelle: 'telefon',
      dringend,
    });
    kunde = r.kunde;
    auftrag = r.auftrag;
    kundeNeu = r.kundeNeu;
  }

  const unbekannt = !kunde;
  const felder = {
    kanal: 'telefon' as const,
    richtung: 'ein' as const,
    kundeId: kunde?.id,
    auftragId: auftrag?.id,
    betreff: betreffFuer(n, kunde),
    text: unbekannt && n.nummer ? `${n.anliegen.trim()}\nRückrufnummer: ${n.nummer.trim()}` : n.anliegen.trim(),
    gelesen: n.gelesen ?? true,
    ...(n.anruf ? { anruf: n.anruf } : {}),
  };
  const vorhanden = db.nachrichten.get(n.nachrichtId);
  const nachricht = (vorhanden && db.nachrichten.update(vorhanden.id, felder)) || db.nachrichten.create(felder);

  if (n.schritt === 'rueckruf') {
    db.aufgaben.create({
      titel: `Rückruf: ${kunde?.name || n.name?.trim() || n.nummer.trim()}`,
      notiz: unbekannt && n.nummer ? `${n.anliegen.trim()}\nNummer: ${n.nummer.trim()}` : n.anliegen.trim(),
      auftragId: auftrag?.id,
      bezug: kunde ? { typ: 'kunden', id: kunde.id } : { typ: 'nachrichten', id: nachricht.id },
      zustaendigId: n.zustaendigId,
      faellig: n.faellig ?? heute(),
      erledigt: false,
      prioritaet: dringend ? 'hoch' : 'normal',
      quelle: 'rueckruf',
    });
  }
  return { nachricht, auftrag, kundeNeu };
}

/** Telefonnummer, unter der man den Rückruf erreicht */
export function rueckrufNummer(aufgabe: { notiz?: string; auftragId?: ID; bezug?: { typ: string; id: ID } }): string | undefined {
  const kundeId = aufgabe.bezug?.typ === 'kunden' ? aufgabe.bezug.id : db.auftraege.get(aufgabe.auftragId)?.kundeId;
  const k = db.kunden.get(kundeId);
  if (k?.telefon) return k.telefon;
  const m = aufgabe.notiz?.match(/Nummer:\s*([+\d][\d\s/()-]{4,})/);
  return m?.[1].trim();
}

export function istUeberfaellig(a: { faellig?: string; erledigt: boolean }, tag = heute()): boolean {
  return !a.erledigt && !!a.faellig && a.faellig < tag;
}
