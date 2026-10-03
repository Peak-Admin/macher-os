/**
 * Grundlagen der Action API: Typen und Helfer, die alle Aktionen teilen (Eingaben prüfen, Fehlerantworten,
 * Objekte schreiben). Die Aktionen selbst stehen in `aktionen.ts` und `aktionen-*.ts`.
 */
import type { Recht } from '@core/rechte';
import type { Basis, Bezug, Einheit, ID, Mitarbeiter } from '@core/objects';

export type Risiko = 'lesen' | 'schreiben' | 'kritisch';

/** Eine Zeile in `objekte` */
export interface ObjektZeile {
  sammlung: string;
  id: ID;
  daten: Record<string, unknown> & Partial<Basis>;
}

/** Wer handelt – der zugeordnete Mitarbeiter, für den der Partner spricht */
export interface Handelnder {
  mitarbeiter: Pick<Mitarbeiter, 'id' | 'vorname' | 'nachname' | 'rolle'>;
  rechte: Recht[];
}

export interface AktionsKontext {
  handelnder: Handelnder;
  jetzt: Date;
  neueId: (praefix?: string) => string;
  /** Kurzname des Partners für Texte im Verlauf („HeyLotte“) */
  partnerName: string;
  /** Öffentliche Adresse der App (für Links an Kunden), z. B. `https://macher-os.de` */
  appUrl: string;
  /** nicht erratbares Token (Kundenbereich) */
  neuesToken: () => string;
}

/** Nachricht an einen Kunden, die `dienst.ts` vor dem Schreiben verschickt – scheitert sie, wird nichts geändert */
export interface VersandAuftrag {
  kanal: 'email' | 'sms' | 'whatsapp';
  an: string;
  betreff: string;
  text: string;
  /** Link zum Kundenbereich – wird beim Versand durch einen Öffnen-Link ersetzt */
  link?: string;
  bezug: Bezug;
}

/** Geladene Objekte je Sammlung – inklusive Papierkorb (`geloeschtAm`), damit Nummern nie doppelt vergeben werden */
export type Bestand = Record<string, ObjektZeile['daten'][]>;

/** Ein Ereignis, das an den Partner zurückgeht (API-Name aus dem Ereigniskatalog, z. B. `customer.created`) */
export interface PartnerEreignis {
  typ: string;
  objekt: Bezug;
  daten: Record<string, unknown>;
}

export type Ergebnis =
  | { art: 'antwort'; status: number; antwort: Record<string, unknown> }
  | {
      art: 'geaendert';
      status: number;
      antwort: Record<string, unknown>;
      zeilen: ObjektZeile[];
      bezug: Bezug;
      /** Klartext für den Verlauf am Objekt („Kunde angelegt – über HeyLotte für Jonas Weber“) */
      verlauf: string;
      /** Standard `created`; `updated` z. B. beim Verschieben oder Senden */
      aenderung?: 'created' | 'updated';
      /** weitere Einträge im Verlauf, z. B. am Auftrag, der für ein Angebot angelegt oder weitergeschaltet wurde */
      weitereVerlaeufe?: { bezug: Bezug; text: string; aenderung: 'created' | 'updated' }[];
      ereignisse: PartnerEreignis[];
      /** erst senden, dann schreiben (z. B. Angebot an den Kunden) */
      versand?: VersandAuftrag;
    };

export interface FeldBeschreibung {
  typ: 'string' | 'number' | 'boolean' | 'object';
  pflicht?: boolean;
  beschreibung: string;
  werte?: string[];
}

export interface PartnerAktion<E = unknown> {
  /** Name in der Adresse: `POST /v1/actions/<name>` */
  name: string;
  /** dieselbe ID wie im Macher-Gateway der App */
  gateway: string;
  beschreibung: string;
  risiko: Risiko;
  rechte: Recht[];
  /** Sammlungen, die die Aktion lesen muss */
  liest: string[];
  eingabe: Record<string, FeldBeschreibung>;
  /** Eingabe prüfen und in die interne Form bringen – Fehlertext für den Menschen */
  pruefe(roh: Record<string, unknown>): { daten: E } | { fehler: string; feld?: string };
  fuehreAus(daten: E, k: AktionsKontext, bestand: Bestand): Ergebnis;
}

// ------------------------------------------------------------------ Eingaben prüfen

export const text = (roh: Record<string, unknown>, feld: string, max = 200): string | undefined => {
  const v = roh[feld];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new Eingabefehler(`„${feld}“ muss Text sein.`, feld);
  const t = v.trim();
  if (t.length > max) throw new Eingabefehler(`„${feld}“ ist zu lang (höchstens ${max} Zeichen).`, feld);
  return t || undefined;
};

export class Eingabefehler extends Error {
  constructor(
    message: string,
    readonly feld?: string,
  ) {
    super(message);
  }
}

export function pruefeMit<E>(fn: (roh: Record<string, unknown>) => E): PartnerAktion<E>['pruefe'] {
  return (roh) => {
    try {
      return { daten: fn(roh) };
    } catch (e) {
      if (e instanceof Eingabefehler) return { fehler: e.message, feld: e.feld };
      throw e;
    }
  };
}

export const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;
export const istEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const aktiv = <T extends Partial<Basis>>(liste: T[] | undefined) => (liste ?? []).filter((x) => !x.geloeschtAm);
export const nameVon = (m: Handelnder['mitarbeiter']) => [m.vorname, m.nachname].filter(Boolean).join(' ') || 'Mitarbeiter';

export const EINHEITEN: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'];

export const MAX_EURO = 10_000_000;

export const zahl = (roh: Record<string, unknown>, feld: string): number | undefined => {
  const v = roh[feld];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Eingabefehler(`„${feld}“ muss eine Zahl sein.`, feld);
  return v;
};

export const euro = (cent: number) => Math.round(cent) / 100;

export const plusTage = (datum: string, tage: number) => new Date(Date.parse(`${datum}T12:00:00Z`) + tage * 86_400_000).toISOString().slice(0, 10);

export function nichtGefunden(feld: string, message: string): Ergebnis {
  return { art: 'antwort', status: 422, antwort: { status: 'error', error: { code: 'not_found', message, field: feld } } };
}

/** undefined-Felder entfernen – so steht das Objekt genauso in `objekte` wie aus der App */
export function ohneLeere<T extends object>(o: T): ObjektZeile['daten'] {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as ObjektZeile['daten'];
}

/** Kanal aus der Adresse: E-Mail oder Telefonnummer (SMS, auf Wunsch WhatsApp) */
export function kanalFuer(an: string, wunsch?: string): VersandAuftrag['kanal'] | undefined {
  if (istEmail(an)) return wunsch && wunsch !== 'email' ? undefined : 'email';
  if (/^\+?[\d\s/()-]{6,20}$/.test(an)) return wunsch === 'whatsapp' ? 'whatsapp' : wunsch && wunsch !== 'sms' ? undefined : 'sms';
  return undefined;
}

// ------------------------------------------------------------------ Uhrzeiten (der Betrieb arbeitet in deutscher Zeit)

const ZONE = 'Europe/Berlin';
const teile = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Datum und Uhrzeit in deutscher Zeit, z. B. `{ datum: '2026-10-09', uhr: '08:00' }` */
export function berlin(d: Date): { datum: string; uhr: string } {
  const t = Object.fromEntries(teile.formatToParts(d).map((p) => [p.type, p.value]));
  return { datum: `${t.year}-${t.month}-${t.day}`, uhr: `${t.hour}:${t.minute}` };
}

/** `2026-10-09` + `08:00` deutscher Zeit → Zeitpunkt (Sommer- und Winterzeit richtig) */
export function berlinZeitpunkt(datum: string, uhr: string): Date {
  const [j, m, t] = datum.split('-').map(Number);
  const [h, min] = uhr.split(':').map(Number);
  const wunsch = Date.UTC(j, m - 1, t, h, min);
  let z = wunsch;
  for (let i = 0; i < 2; i++) {
    const b = berlin(new Date(z));
    const [bj, bm, bt] = b.datum.split('-').map(Number);
    const [bh, bmin] = b.uhr.split(':').map(Number);
    z += wunsch - Date.UTC(bj, bm - 1, bt, bh, bmin);
  }
  return new Date(z);
}

export const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;
