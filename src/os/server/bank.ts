/**
 * Bank-Eingang: Kontoumsätze, die ein externer Kontoinformationsdienst (Integrationsanbieter) per Webhook liefert.
 * Reine Logik ohne Netz (getestet in `bank.test.ts`); die Server-Funktion steht in `bank-eingang.ts`.
 *
 * Der Server speichert jeden Eingang als Objekt der Sammlung `bankumsaetze` (Status `neu`). Die App des Betriebs
 * gleicht ihn ab (`src/os/modules/zahlungen/abgleich.ts`) – dieselbe Logik wie beim Kontoauszug-Import.
 *
 * Akzeptiertes JSON (Feldnamen gängiger Anbieter werden erkannt):
 * ```json
 * { "transaktionen": [ { "id": "tx-1", "datum": "2026-10-02", "betrag": 119.00, "name": "Familie Hoffmann",
 *     "iban": "DE89…", "zweck": "RE 2026 42" } ] }
 * ```
 * Alternativ `transactions` / `data` mit `transactionId`, `bookingDate`, `transactionAmount.amount`,
 * `remittanceInformationUnstructured`, `debtorName`, `debtorAccount.iban` (PSD2/Berlin-Group-Stil).
 */
import type { ObjektZeile } from './supabase';

export interface EingangsTransaktion {
  referenz: string;
  /** YYYY-MM-DD */
  datum: string;
  /** Cent, nur Eingänge (> 0) */
  betrag: number;
  name?: string;
  iban?: string;
  zweck: string;
}

type Roh = Record<string, unknown>;

const text = (x: unknown): string | undefined => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : undefined);

function feld(o: Roh, ...namen: string[]): unknown {
  for (const n of namen) {
    let x: unknown = o;
    for (const teil of n.split('.')) x = x && typeof x === 'object' ? (x as Roh)[teil] : undefined;
    if (x != null && x !== '') return x;
  }
  return undefined;
}

/** Betrag in Euro (Zahl oder Text, deutsch oder englisch) → Cent */
export function centAusBetrag(x: unknown): number | undefined {
  if (typeof x === 'number') return Number.isFinite(x) ? Math.round(x * 100) : undefined;
  const s = text(x)?.trim();
  if (!s) return undefined;
  const norm = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  const n = Number(norm);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

/** Eine Transaktion lesen. `undefined` = kein Eingang oder unvollständig. */
export function transaktionLesen(o: Roh): EingangsTransaktion | undefined {
  const id = text(feld(o, 'id', 'referenz', 'transactionId', 'transaction_id', 'entryReference', 'internalTransactionId'));
  const datum = text(feld(o, 'datum', 'bookingDate', 'booking_date', 'valueDate', 'value_date'))?.slice(0, 10);
  const betragRoh = feld(o, 'betrag', 'amount.amount', 'amount', 'transactionAmount.amount');
  const waehrung = text(feld(o, 'waehrung', 'currency', 'amount.currency', 'transactionAmount.currency')) ?? 'EUR';
  let betrag = centAusBetrag(betragRoh);
  const richtung = text(feld(o, 'creditDebitIndicator', 'credit_debit_indicator', 'richtung'))?.toUpperCase();
  if (betrag != null && (richtung === 'DBIT' || richtung === 'DEBIT' || richtung === 'AUS')) betrag = -Math.abs(betrag);
  if (!id || !datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum) || betrag == null || betrag <= 0 || waehrung.toUpperCase() !== 'EUR') return undefined;
  const zweckRoh = feld(o, 'zweck', 'verwendungszweck', 'remittanceInformationUnstructured', 'remittanceInformation', 'purpose', 'description');
  const zweck = Array.isArray(zweckRoh) ? zweckRoh.map(text).filter(Boolean).join('') : text(zweckRoh) ?? '';
  const iban = text(feld(o, 'iban', 'debtorAccount.iban', 'counterpartIban', 'counterpart.iban'))?.replace(/\s+/g, '').toUpperCase();
  return {
    referenz: `bank:${id}`,
    datum,
    betrag,
    name: text(feld(o, 'name', 'debtorName', 'counterpartName', 'counterpart.name')),
    iban: iban && /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) ? iban : undefined,
    zweck: zweck.replace(/\s+/g, ' ').trim(),
  };
}

/** Webhook-Inhalt lesen: Liste der Eingänge (Ausgänge und Unvollständiges werden übersprungen) */
export function eingangLesen(body: unknown): { liste: EingangsTransaktion[]; uebersprungen: number } | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Roh;
  const roh = (Array.isArray(body) ? body : feld(b, 'transaktionen', 'transactions', 'data', 'transactions.booked')) as unknown;
  if (!Array.isArray(roh)) return undefined;
  const liste: EingangsTransaktion[] = [];
  let uebersprungen = 0;
  for (const x of roh) {
    const t = x && typeof x === 'object' ? transaktionLesen(x as Roh) : undefined;
    if (t) liste.push(t);
    else uebersprungen++;
  }
  return { liste, uebersprungen };
}

/** Objekt-Zeilen für `bankumsaetze` – ohne Umsätze, deren Referenz schon gespeichert ist */
export function umsatzZeilen(betriebId: string, liste: EingangsTransaktion[], vorhanden: Set<string>, neueId: () => string, jetzt = new Date().toISOString()): ObjektZeile[] {
  const zeilen: ObjektZeile[] = [];
  const schon = new Set(vorhanden);
  for (const t of liste) {
    if (schon.has(t.referenz)) continue;
    schon.add(t.referenz);
    const id = neueId();
    zeilen.push({
      betrieb_id: betriebId,
      sammlung: 'bankumsaetze',
      id,
      daten: { id, erstelltAm: jetzt, geaendertAm: jetzt, referenz: t.referenz, quelle: 'bank', datum: t.datum, betrag: t.betrag, name: t.name, iban: t.iban, zweck: t.zweck, status: 'neu' },
      geaendert_am: jetzt,
    });
  }
  return zeilen;
}
