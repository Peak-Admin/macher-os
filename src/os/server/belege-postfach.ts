/**
 * Belege-Postfach: reine Logik für Eingangsrechnungen per E-Mail (ohne Netz, getestet in `belege-postfach.test.ts`).
 *
 * Jeder Betrieb hat neben `anfragen@<betrieb>.macher-os.de` (Anfrage-Postfach, `postfach.ts`) die Adresse
 * `belege@<betrieb>.macher-os.de`. Leitet das Büro eine Lieferantenrechnung dorthin weiter, legt der Server je Anhang
 * (PDF, JPG, PNG) einen Beleg mit Status „neu“ und Quelle „E-Mail“ an – der Absender wird zum Lieferanten-Vorschlag.
 *
 * Wird vom Server (`belege-eingang.ts`, Route `src/app/api/eingang/email`) und von der App (Anzeige der Adresse) genutzt –
 * deshalb hier keine Node-Module.
 */
import { POSTFACH_DOMAIN, betreffBereinigt, betriebSlug, emailAus, nameAus, type EingehendeMail } from './postfach';

export const BELEGE_LOKALTEIL = 'belege';

export function belegePostfachAdresse(betriebName: string | undefined): string {
  return `${BELEGE_LOKALTEIL}@${betriebSlug(betriebName)}.${POSTFACH_DOMAIN}`;
}

/** Slug aus `belege@<slug>.macher-os.de` (auch `belege+x@…`), sonst undefined */
export function slugAusBelegeAdresse(adresse: string | undefined): string | undefined {
  const mail = emailAus(adresse);
  const domain = POSTFACH_DOMAIN.replace(/\./g, '\\.');
  const m = mail?.match(new RegExp(`^${BELEGE_LOKALTEIL}(?:\\+[^@]*)?@([a-z0-9-]+)\\.${domain}$`));
  return m?.[1];
}

// ---------------------------------------------------------------- Anhänge

export interface Anhang {
  name: string;
  mime: string;
  /** Inhalt als Base64 (Postmark, allgemeines Format) */
  inhalt?: string;
  /** Download-Link, wenn der Mail-Dienst den Inhalt nicht mitschickt */
  url?: string;
  /** Größe in Bytes (geschätzt aus Base64, wenn nicht angegeben) */
  bytes: number;
  /** im Text eingebettet (Logo, Signatur) */
  eingebettet: boolean;
}

type Roh = Record<string, unknown>;
const str = (x: unknown) => (typeof x === 'string' && x.trim() ? x.trim() : undefined);
const zahl = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && /^\d+$/.test(x) ? Number(x) : undefined);

/** Bytes aus Base64-Länge (ohne Zeilenumbrüche und Füllzeichen) */
export function base64Bytes(b64: string): number {
  const sauber = b64.replace(/\s+/g, '');
  const fuell = sauber.endsWith('==') ? 2 : sauber.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((sauber.length * 3) / 4) - fuell);
}

/**
 * Anhänge aus dem Webhook lesen – Postmark (`Attachments: [{ Name, Content, ContentType, ContentLength, ContentID }]`),
 * Resend/allgemein (`attachments: [{ filename, content_type, content, size, download_url, content_id, content_disposition }]`).
 */
export function anhaengeLesen(body: unknown): Anhang[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as Roh;
  const d = (b.type && typeof b.data === 'object' && b.data ? b.data : b) as Roh;
  const roh = (Array.isArray(d.Attachments) ? d.Attachments : Array.isArray(d.attachments) ? d.attachments : []) as unknown[];
  const liste: Anhang[] = [];
  for (const x of roh) {
    if (!x || typeof x !== 'object') continue;
    const a = x as Roh;
    const name = str(a.Name) ?? str(a.filename) ?? str(a.name) ?? 'anhang';
    const mime = (str(a.ContentType) ?? str(a.content_type) ?? str(a.contentType) ?? str(a.type) ?? '').toLowerCase().split(';')[0].trim();
    const inhalt = str(a.Content) ?? str(a.content);
    const url = str(a.download_url) ?? str(a.downloadUrl) ?? str(a.url);
    const bytes = zahl(a.ContentLength) ?? zahl(a.size) ?? zahl(a.content_length) ?? (inhalt ? base64Bytes(inhalt) : 0);
    const disposition = (str(a.content_disposition) ?? str(a.disposition) ?? '').toLowerCase();
    const eingebettet = !!(str(a.ContentID) ?? str(a.content_id) ?? str(a.cid)) || disposition === 'inline';
    liste.push({ name, mime, inhalt, url, bytes, eingebettet });
  }
  return liste;
}

const ENDUNG_MIME: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
export const BELEG_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
/** größter Anhang, der als Beleg übernommen wird */
export const MAX_ANHANG_BYTES = 10 * 1024 * 1024;
/** höchstens so viele Belege aus einer Mail */
export const MAX_ANHAENGE = 10;
/** kleine eingebettete Bilder sind fast immer Logos oder Signaturen */
const MAX_LOGO_BYTES = 50 * 1024;

/** Dateityp aus Content-Type, sonst aus der Endung (manche Dienste schicken `application/octet-stream`) */
export function belegMime(a: Pick<Anhang, 'name' | 'mime'>): string | undefined {
  const m = a.mime === 'image/jpg' || a.mime === 'image/pjpeg' ? 'image/jpeg' : a.mime;
  if (BELEG_MIMES.includes(m)) return m;
  const endung = a.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return endung && (!m || m === 'application/octet-stream' || m === 'binary/octet-stream') ? ENDUNG_MIME[endung] : undefined;
}

export interface AnhangAuswahl {
  passend: (Anhang & { mime: string })[];
  uebersprungen: { name: string; grund: string }[];
}

/** Welche Anhänge werden Belege? PDF/JPG/PNG, nicht zu groß, keine eingebetteten Logos. */
export function belegAnhaenge(anhaenge: Anhang[]): AnhangAuswahl {
  const passend: AnhangAuswahl['passend'] = [];
  const uebersprungen: AnhangAuswahl['uebersprungen'] = [];
  for (const a of anhaenge) {
    const mime = belegMime(a);
    if (!mime) uebersprungen.push({ name: a.name, grund: 'kein PDF, JPG oder PNG' });
    else if (!a.inhalt && !a.url) uebersprungen.push({ name: a.name, grund: 'ohne Inhalt geliefert' });
    else if (a.bytes > MAX_ANHANG_BYTES) uebersprungen.push({ name: a.name, grund: 'größer als 10 MB' });
    else if (mime !== 'application/pdf' && a.eingebettet && a.bytes < MAX_LOGO_BYTES) uebersprungen.push({ name: a.name, grund: 'Logo oder Signatur' });
    else if (passend.length >= MAX_ANHAENGE) uebersprungen.push({ name: a.name, grund: `mehr als ${MAX_ANHAENGE} Anhänge` });
    else passend.push({ ...a, mime });
  }
  return { passend, uebersprungen };
}

// ---------------------------------------------------------------- Absender → Lieferant

export interface LieferantZeile {
  id: string;
  name?: string;
  email?: string;
  website?: string;
  geloeschtAm?: string;
}

/** Postfächer von Privatleuten – deren Domain sagt nichts über den Lieferanten */
const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'web.de', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 't-online.de', 'outlook.com', 'outlook.de',
  'hotmail.com', 'hotmail.de', 'live.de', 'live.com', 'yahoo.com', 'yahoo.de', 'icloud.com', 'me.com', 'aol.com', 'aol.de',
  'freenet.de', 'arcor.de', 'posteo.de', 'mailbox.org', 'online.de', '1und1.de', 'ionos.de', 'proton.me', 'protonmail.com',
]);

/** Absender-Namen, die nichts über den Lieferanten sagen */
const ALLGEMEIN = /^(no-?reply|noreply|do-?not-?reply|rechnung(en)?|invoice(s)?|buchhaltung|billing|info|service|kontakt|mail|post|office|vertrieb|accounting)$/i;

/** Haupt-Domain: „rechnung.shop.sonepar.de“ → „sonepar.de“ (einfach: die letzten zwei Teile, `co.uk` & Co. mit drei) */
export function hauptDomain(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const teile = host.toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
  if (teile.length < 2) return undefined;
  const zweistufig = /^(co|com|org|net|gv|ac)$/.test(teile[teile.length - 2]) && teile.length >= 3;
  return teile.slice(zweistufig ? -3 : -2).join('.');
}

const domainVonMail = (mail: string | undefined) => hauptDomain(mail?.split('@')[1]);
function domainVonWebsite(w: string | undefined): string | undefined {
  if (!w) return undefined;
  try {
    return hauptDomain(new URL(/^https?:\/\//i.test(w) ? w : `https://${w}`).hostname);
  } catch {
    return undefined;
  }
}

/** „sonepar-deutschland.de“ → „Sonepar Deutschland“ */
export function nameAusDomain(domain: string | undefined): string | undefined {
  const kern = domain?.split('.')[0];
  if (!kern) return undefined;
  return kern
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const normName = (s: string | undefined) => (s ?? '').toLowerCase().replace(/\b(gmbh|co|kg|ag|ug|ohg|e\.?\s?k\.?)\b/g, '').replace(/[^a-z0-9äöüß]+/g, ' ').trim();

export interface LieferantVorschlag {
  lieferantId?: string;
  lieferantName?: string;
  grund?: string;
}

/**
 * Absender → Lieferant: bekannte E-Mail-Adresse, sonst gleiche Firmen-Domain (E-Mail oder Website des Lieferanten),
 * sonst gleicher Name. Ohne Treffer ein Namensvorschlag (Absendername oder Domain) – das Büro bestätigt ihn beim Prüfen.
 */
export function lieferantVorschlagen(lieferanten: LieferantZeile[], von: { email?: string; name?: string }): LieferantVorschlag {
  const aktiv = lieferanten.filter((l) => !l.geloeschtAm);
  const email = von.email?.toLowerCase();
  if (email) {
    const l = aktiv.find((x) => x.email?.trim().toLowerCase() === email);
    if (l) return { lieferantId: l.id, grund: 'Absender ist als Lieferant bekannt' };
  }
  const domain = domainVonMail(email);
  const firmenDomain = domain && !FREEMAIL.has(domain) ? domain : undefined;
  if (firmenDomain) {
    const l = aktiv.find((x) => domainVonMail(x.email) === firmenDomain || domainVonWebsite(x.website) === firmenDomain);
    if (l) return { lieferantId: l.id, grund: `Absender-Domain ${firmenDomain} passt` };
  }
  const name = von.name && !ALLGEMEIN.test(von.name.trim()) ? von.name.trim() : undefined;
  const kandidaten = [name, nameAusDomain(firmenDomain)].filter(Boolean) as string[];
  for (const k of kandidaten) {
    const n = normName(k);
    const l = n ? aktiv.find((x) => normName(x.name) === n || (normName(x.name).length >= 4 && n.includes(normName(x.name)))) : undefined;
    if (l) return { lieferantId: l.id, grund: 'Name des Absenders passt' };
  }
  const vorschlag = firmenDomain ? (nameAusDomain(firmenDomain) ?? name) : (name ?? undefined);
  return vorschlag ? { lieferantName: vorschlag.slice(0, 80), grund: 'aus dem Absender übernommen' } : {};
}

/**
 * Weitergeleitete Mail (WG:/Fwd:)? Dann steht der eigentliche Absender im Text („Von: …“ / „From: …“).
 * Liefert den ursprünglichen Absender, sonst undefined.
 */
export function urspruenglicherAbsender(mail: Pick<EingehendeMail, 'betreff' | 'text'>): { email?: string; name?: string } | undefined {
  if (!/^\s*(wg|fw|fwd)\s*:/i.test(mail.betreff) && !/(weitergeleitete nachricht|forwarded message)/i.test(mail.text)) return undefined;
  const zeile = mail.text.match(/^\s*[>*]*\s*(?:von|from)\s*:\s*\**\s*(.+)$/im)?.[1]?.trim();
  if (!zeile) return undefined;
  const email = emailAus(zeile) ?? emailAus(zeile.match(/[^\s<>()"]+@[^\s<>()"]+/)?.[0]);
  const name = nameAus(zeile) ?? (email ? undefined : zeile.replace(/["*]/g, '').trim() || undefined);
  return email || name ? { email, name } : undefined;
}

/** Rechnungsnummer aus dem Betreff („Ihre Rechnung Nr. RE-2026-0815“) – nur, wenn eine Ziffer darin steckt */
export function rechnungsnummerAus(betreff: string | undefined): string | undefined {
  const b = betreffBereinigt(betreff);
  const m = b.match(/\b(?:rechnung(?:snummer)?|rg\.?|re\.?|invoice)\s*(?:nr\.?|nummer|no\.?)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9/_.-]{2,30})/i);
  const nr = m?.[1]?.replace(/[.]+$/, '');
  return nr && /\d/.test(nr) ? nr : undefined;
}

/** Datum in Deutschland (YYYY-MM-DD) – der Server läuft in UTC */
export function datumInDeutschland(jetzt: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(jetzt);
}

// ---------------------------------------------------------------- Plan

export interface BelegZeile {
  id: string;
  eingangId?: string;
  geloeschtAm?: string;
}

export interface BelegPlan {
  belege: { id: string; daten: Record<string, unknown> }[];
  dokumente: { id: string; daten: Record<string, unknown>; anhang: AnhangAuswahl['passend'][number] }[];
  uebersprungen: AnhangAuswahl['uebersprungen'];
  lieferant: LieferantVorschlag;
  /** Mail schon verarbeitet (gleiche Message-ID) */
  doppelt: boolean;
}

/** eindeutige Kennung je Anhang – für Dubletten, wenn der Mail-Dienst doppelt zustellt */
export const eingangKennung = (nachrichtId: string | undefined, i: number) => (nachrichtId ? `${nachrichtId}#${i + 1}` : undefined);

/**
 * Was aus einer Mail entsteht: je passendem Anhang ein Dokument und ein Beleg (Status „neu“, Quelle „email“).
 * Rein – IDs, Zeit und die Datei-Links kommen von außen (`url` wird nach dem Hochladen gesetzt).
 */
export function belegePlanen(
  mail: EingehendeMail,
  anhaenge: Anhang[],
  bestand: { lieferanten: LieferantZeile[]; belege: BelegZeile[] },
  neu: { id: () => string; jetzt: Date },
): BelegPlan {
  const doppelt = !!mail.nachrichtId && bestand.belege.some((b) => b.eingangId?.startsWith(`${mail.nachrichtId}#`));
  const { passend, uebersprungen } = belegAnhaenge(anhaenge);
  const absender = urspruenglicherAbsender(mail) ?? { email: mail.vonEmail, name: mail.vonName };
  const lieferant = lieferantVorschlagen(bestand.lieferanten, absender);
  if (doppelt) return { belege: [], dokumente: [], uebersprungen, lieferant, doppelt };

  const zeit = neu.jetzt.toISOString();
  const basis = (id: string) => ({ id, erstelltAm: zeit, geaendertAm: zeit });
  const nummer = passend.length === 1 ? rechnungsnummerAus(mail.betreff) : undefined;
  const betreff = betreffBereinigt(mail.betreff).slice(0, 160) || undefined;
  const belege: BelegPlan['belege'] = [];
  const dokumente: BelegPlan['dokumente'] = [];
  passend.forEach((a, i) => {
    const belegId = neu.id();
    const dokumentId = neu.id();
    dokumente.push({
      id: dokumentId,
      anhang: a,
      daten: {
        ...basis(dokumentId),
        art: a.mime === 'application/pdf' ? 'pdf' : 'foto',
        titel: a.name.slice(0, 120),
        mime: a.mime,
        groesse: a.bytes || undefined,
        bezug: { typ: 'belege', id: belegId },
        tags: ['beleg', 'email'],
      },
    });
    belege.push({
      id: belegId,
      daten: {
        ...basis(belegId),
        art: 'eingangsrechnung',
        lieferantId: lieferant.lieferantId,
        lieferantName: lieferant.lieferantId ? undefined : lieferant.lieferantName,
        nummer,
        datum: datumInDeutschland(neu.jetzt),
        netto: 0,
        ust: 0,
        status: 'neu',
        dokumentId,
        quelle: 'email',
        eingangVon: absender.email ?? mail.vonEmail,
        eingangBetreff: betreff,
        eingangId: eingangKennung(mail.nachrichtId, i),
        lieferantGrund: lieferant.grund,
      },
    });
  });
  return { belege, dokumente, uebersprungen, lieferant, doppelt: false };
}
