/**
 * Schnittstelle für Bank-Anbieter (Kontoumsätze automatisch holen).
 *
 * Macher OS baut keine eigene Bankanbindung (FinTS/PSD2) und kein eigenes OAuth. Ein externer
 * Integrationsanbieter (Kontoinformationsdienst) liefert die Umsätze auf zwei Wegen:
 *
 * 1. **Push (empfohlen):** Der Anbieter ruft den Webhook `/api/eingang/bank` auf. Der Server
 *    (`src/os/server/bank.ts`) legt jeden Eingang als `bankumsaetze`-Objekt mit Status `neu` an;
 *    der Abgleich übernimmt ihn beim nächsten Abgleich auf einem Gerät von Chef oder Büro.
 * 2. **Abruf:** Ein Adapter implementiert `BankAnbieter` und wird mit `setzeBankAnbieter` gesetzt.
 *    `bankAbrufen()` holt dann die Umsätze seit dem letzten Abruf und gleicht sie ab.
 */
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { heute, plusTage } from '@core/format';
import type { Cent, Datum } from '@core/objects';
import { abgleichen, einlesen, type AbgleichErgebnis } from './abgleich';

/** Ein Kontoumsatz, wie ihn ein Bank-Anbieter liefert (normalisiert) */
export interface Banktransaktion {
  /** eindeutige ID beim Anbieter/der Bank – verhindert Dubletten */
  referenz: string;
  datum: Datum;
  /** Cent, Eingänge positiv, Ausgänge negativ (Ausgänge werden ignoriert) */
  betrag: Cent;
  name?: string;
  iban?: string;
  zweck: string;
}

export interface BankAnbieter {
  id: string;
  /** Anzeigename, z. B. Name der Bank oder des Kontos */
  name: string;
  /** Umsätze ab diesem Tag holen */
  abrufen(seit: Datum): Promise<Banktransaktion[]>;
}

let anbieter: BankAnbieter | undefined;

export function setzeBankAnbieter(a: BankAnbieter | undefined) {
  anbieter = a;
}

export const bankAnbieter = () => anbieter;

const LETZTER_ABRUF = 'zahlungen.bank.letzterAbruf';

/** Umsätze beim Anbieter holen, speichern und abgleichen */
export async function bankAbrufen(): Promise<(AbgleichErgebnis & { neu: number }) | undefined> {
  if (!anbieter) return undefined;
  const seit = einstellung<string>(LETZTER_ABRUF, '') || plusTage(heute(), -30);
  const liste = await anbieter.abrufen(seit);
  const { neu } = einlesen(
    liste.filter((t) => t.betrag > 0).map((t, i) => ({ zeile: i + 1, datum: t.datum, betrag: t.betrag, name: t.name ?? '', iban: t.iban, zweck: t.zweck, referenz: `bank:${t.referenz}` })),
    'bank',
  );
  setzeEinstellung(LETZTER_ABRUF, plusTage(heute(), -2)); // Puffer für nachträglich gebuchte Umsätze
  return { ...abgleichen(), neu: neu.length };
}
