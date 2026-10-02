/**
 * Messung der Phasen Setup → First Value → Activation → Habit → Paid.
 * Datensparsam: keine Cookies, keine personenbezogenen Inhalte, nur Ereignisname + grobe Daten.
 * Ohne Backend werden Ereignisse lokal gesammelt (für die eigene Auswertung/Tests).
 * Das Paket Fundament hängt über `setzeMessziel()` den Server an.
 */
export type MessEreignis =
  | 'setup.gestartet'
  | 'setup.schritt'
  | 'setup.fertig'
  | 'erstwert.gewaehlt'
  | 'erstwert.dokument_versendet'
  | 'erstwert.dokument_geoeffnet'
  | 'aktivierung.erreicht'
  | 'team.eingeladen'
  | 'team.beigetreten'
  | 'gewohnheit.tagesbrief_geoeffnet'
  | 'gewohnheit.aktion_aus_benachrichtigung'
  | 'bezahlen.gestartet'
  | 'bezahlen.fertig'
  | 'bezahlen.gekuendigt'
  | (string & {});

export interface Messpunkt {
  ereignis: MessEreignis;
  zeit: string;
  daten?: Record<string, string | number | boolean>;
}

const puffer: Messpunkt[] = [];
let ziel: ((p: Messpunkt) => void) | undefined;

export function messen(ereignis: MessEreignis, daten?: Messpunkt['daten']) {
  const p = { ereignis, zeit: new Date().toISOString(), daten };
  puffer.push(p);
  if (puffer.length > 500) puffer.shift();
  try {
    ziel?.(p);
  } catch {
    /* Messung darf nie die App stören */
  }
}

export function setzeMessziel(fn: ((p: Messpunkt) => void) | undefined) {
  ziel = fn;
}

export function messpunkte(): readonly Messpunkt[] {
  return puffer;
}
