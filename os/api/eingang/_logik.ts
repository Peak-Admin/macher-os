/**
 * Reine Logik für das Anfrage-Postfach (ohne Netz, getestet in `_email.test.ts`).
 * Wird vom Server (`email.ts`) und von der App (Anzeige der Adresse) genutzt.
 * Dateien mit `_` am Anfang sind auf Vercel keine eigenen Funktionen.
 */

export const POSTFACH_DOMAIN = 'macher-os.de';

/** „Müller Elektro GmbH & Co. KG“ → „mueller-elektro“ */
export function betriebSlug(name: string | undefined): string {
  const s = (name ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(gmbh|co|kg|ug|ag|ohg|gbr|e\s?k|haftungsbeschraenkt|inh)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return s || 'betrieb';
}

export function postfachAdresse(betriebName: string | undefined): string {
  return `anfragen@${betriebSlug(betriebName)}.${POSTFACH_DOMAIN}`;
}

/** Slug aus einer Empfängeradresse (`anfragen@<slug>.macher-os.de`, auch `anfragen+x@…`) */
export function slugAusAdresse(adresse: string | undefined): string | undefined {
  const mail = emailAus(adresse);
  const m = mail?.match(/^anfragen(?:\+[^@]*)?@([a-z0-9-]+)\.macher-os\.de$/);
  return m?.[1];
}

/** „Max Muster <max@example.de>“ → „max@example.de“ */
export function emailAus(roh: string | undefined): string | undefined {
  if (!roh) return undefined;
  const m = roh.match(/<([^>]+)>/);
  const mail = (m ? m[1] : roh).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail : undefined;
}

/** „Max Muster <max@example.de>“ → „Max Muster“ */
export function nameAus(roh: string | undefined): string | undefined {
  if (!roh) return undefined;
  const m = roh.match(/^\s*"?([^"<]+?)"?\s*</);
  return m?.[1]?.trim() || undefined;
}

export function normTelefon(t: string | undefined): string {
  const d = (t ?? '').replace(/[^\d+]/g, '').replace(/^\+49/, '0').replace(/^0049/, '0');
  return d.length >= 6 ? d : '';
}

/** Erste Telefonnummer im Text (z. B. aus der Signatur) */
export function telefonAusText(text: string | undefined): string | undefined {
  const m = (text ?? '').match(/(?:\+49|0049|0)[\d\s/()-]{6,18}\d/);
  return m ? m[0].replace(/\s+/g, ' ').trim() : undefined;
}

/** „AW: Re: Fwd: Steckdose“ → „Steckdose“ */
export function betreffBereinigt(betreff: string | undefined): string {
  return (betreff ?? '')
    .replace(/^\s*((re|aw|wg|fw|fwd|antw)\s*:\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface EingehendeMail {
  vonEmail?: string;
  vonName?: string;
  an: string[];
  betreff: string;
  text: string;
  /** für Dubletten bei doppelter Zustellung */
  nachrichtId?: string;
}

type Roh = Record<string, unknown>;
const str = (x: unknown) => (typeof x === 'string' ? x : undefined);
const liste = (x: unknown): string[] =>
  Array.isArray(x) ? x.flatMap((e) => (typeof e === 'string' ? [e] : str((e as Roh)?.Email) ?? str((e as Roh)?.email) ?? str((e as Roh)?.address) ?? [])) : typeof x === 'string' ? x.split(',').map((s) => s.trim()) : [];

function htmlZuText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Eingangs-Webhook lesen – Postmark (Inbound JSON), Resend (`{ type: 'email.received', data }`)
 * und einfache Formate (`from`, `to`, `subject`, `text`).
 */
export function mailLesen(body: unknown): EingehendeMail | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Roh;
  const d = (b.type && typeof b.data === 'object' && b.data ? b.data : b) as Roh;
  // Postmark
  if (d.FromFull || d.From || d.TextBody !== undefined) {
    const vonFull = d.FromFull as Roh | undefined;
    const vonEmail = emailAus(str(vonFull?.Email) ?? str(d.From));
    return {
      vonEmail,
      vonName: str(vonFull?.Name) || str(d.FromName) || nameAus(str(d.From)),
      an: [...liste(d.ToFull), ...liste(d.To), ...liste(d.OriginalRecipient), ...liste(d.CcFull)].map((x) => x.toLowerCase()),
      betreff: str(d.Subject) ?? '',
      text: (str(d.StrippedTextReply) || str(d.TextBody) || htmlZuText(str(d.HtmlBody) ?? '')).trim(),
      nachrichtId: str(d.MessageID),
    };
  }
  // Resend / allgemein
  const von = d.from as unknown;
  const vonRoh = typeof von === 'string' ? von : str((von as Roh)?.email) ?? str((von as Roh)?.address);
  const vonName = typeof von === 'object' && von ? str((von as Roh).name) : nameAus(vonRoh);
  const text = str(d.text) ?? str(d.plain) ?? htmlZuText(str(d.html) ?? '');
  if (!vonRoh && !text) return undefined;
  return {
    vonEmail: emailAus(vonRoh),
    vonName: vonName || undefined,
    an: [...liste(d.to), ...liste(d.cc)].map((x) => x.toLowerCase()),
    betreff: str(d.subject) ?? '',
    text: (text ?? '').trim(),
    nachrichtId: str(d.message_id) ?? str(d.messageId) ?? str(d.email_id) ?? str(d.id),
  };
}

// ---------------------------------------------------------------- Kunde und Anfrage

export interface KundeZeile {
  id: string;
  name?: string;
  email?: string;
  telefon?: string;
  ansprechpartner?: { email?: string; telefon?: string }[];
  geloeschtAm?: string;
}

export interface AuftragZeile {
  id: string;
  nummer?: string;
  titel?: string;
  kundeId?: string;
  phase?: string;
  erstelltAm?: string;
  eingangId?: string;
  geloeschtAm?: string;
}

/** Bestehenden Kunden erkennen: E-Mail (auch Ansprechpartner), sonst Telefonnummer aus der Mail */
export function kundeFinden(kunden: KundeZeile[], mail: Pick<EingehendeMail, 'vonEmail' | 'text'>): KundeZeile | undefined {
  const aktiv = kunden.filter((k) => !k.geloeschtAm);
  const email = mail.vonEmail?.toLowerCase();
  if (email) {
    const k = aktiv.find((x) => x.email?.trim().toLowerCase() === email || x.ansprechpartner?.some((a) => a.email?.trim().toLowerCase() === email));
    if (k) return k;
  }
  const tel = normTelefon(telefonAusText(mail.text));
  if (tel) return aktiv.find((x) => normTelefon(x.telefon) === tel || x.ansprechpartner?.some((a) => normTelefon(a.telefon) === tel));
  return undefined;
}

/**
 * Gehört die Mail zu einer offenen Anfrage desselben Kunden (gleicher Betreff, letzte 14 Tage)?
 * Dann wird sie als Nachricht angehängt statt eine zweite Anfrage anzulegen.
 */
export function offeneAnfrageFinden(auftraege: AuftragZeile[], kundeId: string, betreff: string, jetzt = new Date()): AuftragZeile | undefined {
  const b = betreffBereinigt(betreff).toLowerCase();
  const grenze = new Date(jetzt.getTime() - 14 * 86_400_000).toISOString();
  return auftraege
    .filter((a) => !a.geloeschtAm && a.kundeId === kundeId && a.phase === 'anfrage' && (a.erstelltAm ?? '') >= grenze)
    .sort((x, y) => (y.erstelltAm ?? '').localeCompare(x.erstelltAm ?? ''))
    .find((a) => !b || (a.titel ?? '').toLowerCase().includes(b) || b.includes((a.titel ?? '').toLowerCase()));
}

/** Nächste Auftragsnummer A-<Jahr>-<lfd> (wie `naechsteNummer('auftrag')` in der App) */
export function naechsteAuftragsnummer(nummern: (string | undefined)[], jahr = new Date().getFullYear()): string {
  const start = `A-${jahr}-`;
  const max = nummern
    .filter((n): n is string => !!n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(4, '0')}`;
}

export function titelAus(mail: Pick<EingehendeMail, 'betreff' | 'text'>): string {
  const b = betreffBereinigt(mail.betreff);
  if (b) return b.slice(0, 80);
  const zeile = mail.text.split('\n').map((z) => z.trim()).find((z) => z.length > 3);
  return zeile ? zeile.slice(0, 60) : 'Anfrage per E-Mail';
}

export interface Plan {
  kunde: { neu: boolean; id: string; daten?: Record<string, unknown> };
  auftrag?: { id: string; daten: Record<string, unknown> };
  nachricht: { id: string; daten: Record<string, unknown> };
  /** an bestehende Anfrage angehängt */
  angehaengtAn?: string;
}

/**
 * Was aus einer Mail entsteht: Kunde (neu oder erkannt) · Anfrage (Auftrag in Phase „anfrage“) · Nachricht mit dem Text.
 * Rein – IDs und Zeit kommen von außen.
 */
export function anfragePlanen(
  mail: EingehendeMail,
  bestand: { kunden: KundeZeile[]; auftraege: AuftragZeile[] },
  neu: { id: () => string; jetzt: Date },
): Plan {
  const zeit = neu.jetzt.toISOString();
  const basis = (id: string) => ({ id, erstelltAm: zeit, geaendertAm: zeit });
  const erkannt = kundeFinden(bestand.kunden, mail);
  const kundeId = erkannt?.id ?? neu.id();
  const kunde: Plan['kunde'] = erkannt
    ? { neu: false, id: erkannt.id }
    : {
        neu: true,
        id: kundeId,
        daten: {
          ...basis(kundeId),
          art: 'privat',
          name: mail.vonName || (mail.vonEmail ? mail.vonEmail.split('@')[0] : 'Unbekannt (E-Mail)'),
          email: mail.vonEmail,
          telefon: telefonAusText(mail.text),
          ansprechpartner: [],
          quelle: 'email',
        },
      };
  const offen = erkannt ? offeneAnfrageFinden(bestand.auftraege, erkannt.id, mail.betreff, neu.jetzt) : undefined;
  const text = mail.text.slice(0, 8000) || '(ohne Text)';
  let auftrag: Plan['auftrag'];
  if (!offen) {
    const id = neu.id();
    auftrag = {
      id,
      daten: {
        ...basis(id),
        nummer: naechsteAuftragsnummer(bestand.auftraege.map((a) => a.nummer), neu.jetzt.getFullYear()),
        titel: titelAus(mail),
        art: 'kundendienst',
        phase: 'anfrage',
        kundeId,
        beschreibung: text.slice(0, 4000),
        quelle: 'email',
        eingangId: mail.nachrichtId,
      },
    };
  }
  const nachrichtId = neu.id();
  return {
    kunde,
    auftrag,
    angehaengtAn: offen?.id,
    nachricht: {
      id: nachrichtId,
      daten: {
        ...basis(nachrichtId),
        kanal: 'email',
        richtung: 'ein',
        kundeId,
        auftragId: auftrag?.id ?? offen?.id,
        betreff: mail.betreff || 'E-Mail-Anfrage',
        text,
        gelesen: false,
        eingangId: mail.nachrichtId,
      },
    },
  };
}
