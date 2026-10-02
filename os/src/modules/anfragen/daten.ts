/**
 * Anfragen = Aufträge in Phase `anfrage`. Hier liegt die reine Logik:
 * Kunden wiedererkennen (Dubletten), Anfrage anlegen, Anfrage qualifizieren.
 */
import { db, vermerken } from '@core/db';
import { emit } from '@core/events';
import { heute, plusTage } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import { aktionAusfuehren, pfadZu } from '@core/modul';
import type { Adresse, Auftrag, ID, Kanal, Kunde } from '@core/objects';

// ------------------------------------------------------------------ Kunden wiedererkennen

/** Telefonnummer vergleichbar machen: nur Ziffern, +49/0049 → 0 */
export function normTelefon(t: string | undefined): string {
  if (!t) return '';
  let z = t.replace(/[^\d+]/g, '');
  if (z.startsWith('+49')) z = '0' + z.slice(3);
  else if (z.startsWith('0049')) z = '0' + z.slice(4);
  return z.replace(/\D/g, '');
}

export function normEmail(e: string | undefined): string {
  return (e ?? '').trim().toLowerCase();
}

const FUELLWOERTER = new Set(['familie', 'fam', 'herr', 'frau', 'hr', 'fr', 'dr', 'gmbh', 'kg', 'ag', 'ug', 'gbr', 'und', 'co', 'e', 'k']);

/** Name in vergleichbare Wörter zerlegen (ohne Anrede, Rechtsform, Satzzeichen) */
export function nameWoerter(n: string | undefined): string[] {
  return (n ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\d\s-]/gu, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length >= 2 && !FUELLWOERTER.has(w));
}

export interface KundenKandidat {
  kunde: Kunde;
  grund: 'telefon' | 'email' | 'name';
  /** 100 = sicher derselbe, 60 = wahrscheinlich */
  sicherheit: number;
}

/**
 * Findet bestehende Kunden zu Telefon, E-Mail oder Name.
 * Telefon und E-Mail sind starke Treffer, ein Namens-Treffer ist nur ein Vorschlag.
 */
export function findeKunden(e: { name?: string; telefon?: string; email?: string }, kunden: Kunde[]): KundenKandidat[] {
  const tel = normTelefon(e.telefon);
  const mail = normEmail(e.email);
  const woerter = nameWoerter(e.name);
  const treffer: KundenKandidat[] = [];
  for (const k of kunden) {
    const nummern = [k.telefon, ...k.ansprechpartner.map((a) => a.telefon)].map(normTelefon).filter(Boolean);
    const mails = [k.email, ...k.ansprechpartner.map((a) => a.email)].map(normEmail).filter(Boolean);
    if (tel.length >= 6 && nummern.includes(tel)) {
      treffer.push({ kunde: k, grund: 'telefon', sicherheit: 100 });
      continue;
    }
    if (mail.includes('@') && mails.includes(mail)) {
      treffer.push({ kunde: k, grund: 'email', sicherheit: 100 });
      continue;
    }
    if (woerter.length) {
      const kw = new Set([...nameWoerter(k.name), ...nameWoerter(k.firma), ...k.ansprechpartner.flatMap((a) => nameWoerter(a.name))]);
      const gemeinsam = woerter.filter((w) => w.length >= 3 && kw.has(w)).length;
      if (gemeinsam > 0 && (gemeinsam === woerter.length || gemeinsam >= 2)) {
        treffer.push({ kunde: k, grund: 'name', sicherheit: gemeinsam === woerter.length && woerter.length > 1 ? 80 : 60 });
      }
    }
  }
  return treffer.sort((a, b) => b.sicherheit - a.sicherheit).slice(0, 5);
}

export const GRUND_TEXT: Record<KundenKandidat['grund'], string> = {
  telefon: 'gleiche Telefonnummer',
  email: 'gleiche E-Mail',
  name: 'ähnlicher Name',
};

// ------------------------------------------------------------------ Anfrage anlegen

export interface NeueAnfrage {
  /** bestehender Kunde – sonst wird `neuerKunde` angelegt */
  kundeId?: ID;
  neuerKunde?: { name: string; telefon?: string; email?: string; adresse?: Adresse; art?: Kunde['art'] };
  titel: string;
  beschreibung?: string;
  quelle: Kanal;
  dringend?: boolean;
  wunschtermin?: string;
  ortId?: ID;
}

export function anfrageAnlegen(n: NeueAnfrage): { auftrag: Auftrag; kunde: Kunde; kundeNeu: boolean } {
  let kunde = db.kunden.get(n.kundeId);
  let kundeNeu = false;
  let ortId = n.ortId;
  if (!kunde) {
    if (!n.neuerKunde?.name.trim()) throw new Error('Ohne Kunde geht keine Anfrage.');
    const k = n.neuerKunde;
    kunde = db.kunden.create({
      art: k.art ?? 'privat',
      name: k.name.trim(),
      telefon: k.telefon?.trim() || undefined,
      email: k.email?.trim() || undefined,
      adresse: k.adresse && (k.adresse.strasse || k.adresse.ort) ? k.adresse : undefined,
      ansprechpartner: [],
      quelle: n.quelle,
    });
    kundeNeu = true;
    if (kunde.adresse && !ortId) {
      ortId = db.orte.create({ kundeId: kunde.id, bezeichnung: 'Hauptadresse', art: 'haus', adresse: kunde.adresse }).id;
    }
  }
  if (!ortId) {
    const orte = db.orte.where((o) => o.kundeId === kunde!.id);
    if (orte.length === 1) ortId = orte[0].id;
  }
  const auftrag = db.auftraege.create({
    nummer: naechsteNummer('auftrag'),
    titel: n.titel.trim() || 'Neue Anfrage',
    art: 'kundendienst',
    phase: 'anfrage',
    kundeId: kunde.id,
    ortId,
    beschreibung: n.beschreibung?.trim() || undefined,
    quelle: n.quelle,
    dringend: n.dringend || undefined,
    wunschtermin: n.wunschtermin?.trim() || undefined,
  });
  emit({ typ: 'anfrage.eingegangen', sammlung: 'auftraege', objekt: auftrag });
  return { auftrag, kunde, kundeNeu };
}

// ------------------------------------------------------------------ Anfragen bewerten

export const KANAL_TEXT: Record<Kanal, string> = {
  telefon: 'Telefon',
  email: 'E-Mail',
  website: 'Website',
  whatsapp: 'WhatsApp',
  empfehlung: 'Empfehlung',
  portal: 'Portal',
  vor_ort: 'Vor Ort',
  sonstiges: 'Sonstiges',
};

/** Stunden seit Eingang */
export function alterStunden(a: Pick<Auftrag, 'erstelltAm'>, jetzt = new Date()): number {
  return Math.max(0, (jetzt.getTime() - new Date(a.erstelltAm).getTime()) / 3_600_000);
}

export function alterText(a: Pick<Auftrag, 'erstelltAm'>, jetzt = new Date()): string {
  const h = alterStunden(a, jetzt);
  if (h < 1) return 'gerade eingegangen';
  if (h < 24) return `seit ${Math.floor(h)} Std.`;
  const t = Math.floor(h / 24);
  return t === 1 ? 'seit 1 Tag' : `seit ${t} Tagen`;
}

/** Gibt es schon einen geplanten nächsten Schritt (offene Aufgabe oder Termin)? */
export function hatNaechstenSchritt(auftragId: ID): boolean {
  return (
    db.aufgaben.all().some((x) => x.auftragId === auftragId && !x.erledigt) ||
    db.termine.all().some((t) => t.auftragId === auftragId && t.status !== 'abgesagt')
  );
}

/** Unbearbeitet = noch Anfrage, älter als `stunden` und kein nächster Schritt geplant */
export function istUnbearbeitet(a: Auftrag, naechsterSchritt: boolean, jetzt = new Date(), stunden = 24): boolean {
  return a.phase === 'anfrage' && !naechsterSchritt && alterStunden(a, jetzt) > stunden;
}

export function offeneAnfragen(): Auftrag[] {
  return db.auftraege
    .where((a) => a.phase === 'anfrage')
    .sort((a, b) => Number(!!b.dringend) - Number(!!a.dringend) || a.erstelltAm.localeCompare(b.erstelltAm));
}

// ------------------------------------------------------------------ Qualifizieren

export type NaechsterSchritt = 'rueckruf' | 'besichtigung' | 'angebot' | 'termin' | 'absagen';

export const SCHRITTE: { wert: NaechsterSchritt; label: string; text: string; icon: string }[] = [
  { wert: 'rueckruf', label: 'Rückruf', text: 'Erst noch mal mit dem Kunden sprechen.', icon: 'telefon' },
  { wert: 'besichtigung', label: 'Besichtigung', text: 'Vor Ort ansehen, dann anbieten.', icon: 'ort' },
  { wert: 'angebot', label: 'Direkt Angebot', text: 'Alles klar – Angebot schreiben.', icon: 'dokument' },
  { wert: 'termin', label: 'Termin', text: 'Kleiner Auftrag – direkt einplanen.', icon: 'kalender' },
  { wert: 'absagen', label: 'Absagen', text: 'Passt nicht – mit Grund ablegen.', icon: 'x' },
];

export const ABSAGE_GRUENDE = ['Keine Kapazität', 'Passt nicht zu unseren Leistungen', 'Zu weit weg', 'Kunde nicht erreichbar', 'Kunde hat abgesagt', 'Sonstiges'];

export interface QualiOptionen {
  grund?: string;
  faellig?: string;
  zustaendigId?: ID;
  notiz?: string;
}

/**
 * Anfrage in einem Schritt weiterbringen. Gibt den Pfad zurück, zu dem es weitergeht
 * (z. B. Besichtigung planen, Angebotsentwurf) – oder nichts, wenn man bleiben kann.
 */
export function qualifizieren(auftragId: ID, schritt: NaechsterSchritt, o: QualiOptionen = {}): string | undefined {
  const a = db.auftraege.get(auftragId);
  if (!a) return undefined;
  const bezug = { typ: 'auftraege' as const, id: a.id };
  const kunde = db.kunden.get(a.kundeId);
  switch (schritt) {
    case 'rueckruf': {
      db.aufgaben.create({
        titel: `Rückruf: ${kunde?.name ?? 'Kunde'}`,
        notiz: o.notiz || a.beschreibung,
        auftragId: a.id,
        zustaendigId: o.zustaendigId,
        faellig: o.faellig ?? heute(),
        erledigt: false,
        prioritaet: a.dringend ? 'hoch' : 'normal',
        quelle: 'rueckruf',
      });
      vermerken(bezug, 'anfrage.rueckruf', 'Rückruf geplant');
      return undefined;
    }
    case 'besichtigung':
      db.auftraege.update(a.id, { phase: 'besichtigung' }, { text: 'Weiter zur Besichtigung' });
      return (aktionAusfuehren('besichtigung.planen', { auftragId: a.id }) as string | undefined) ?? pfadZu(bezug);
    case 'angebot':
      db.auftraege.update(a.id, { phase: 'angebot' }, { text: 'Weiter zum Angebot' });
      return (aktionAusfuehren('angebot.erstellen', { auftragId: a.id }) as string | undefined) ?? pfadZu(bezug);
    case 'termin':
      db.auftraege.update(a.id, { phase: 'beauftragt' }, { text: 'Direkt beauftragt – wird eingeplant' });
      return (aktionAusfuehren('plan.einplanen', { auftragId: a.id }) as string | undefined) ?? pfadZu(bezug);
    case 'absagen':
      db.auftraege.update(
        a.id,
        { phase: 'verloren', verlorenGrund: o.grund || 'Ohne Angabe', abgeschlossenAm: new Date().toISOString() },
        { text: `Abgesagt: ${o.grund || 'ohne Angabe'}` },
      );
      // offene Rückrufe zur Anfrage sind damit erledigt
      db.aufgaben
        .where((x) => x.auftragId === a.id && !x.erledigt && x.quelle === 'rueckruf')
        .forEach((x) => db.aufgaben.update(x.id, { erledigt: true, erledigtAm: new Date().toISOString() }));
      return undefined;
  }
}

/** Standard-Fälligkeit für einen Rückruf: dringend heute, sonst morgen */
export function rueckrufFaellig(dringend?: boolean): string {
  return dringend ? heute() : plusTage(heute(), 1);
}
