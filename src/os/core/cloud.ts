/**
 * Cloud-Vertrag: alles, was ein Backend braucht (Konto, Versand, Push, öffentliche Links, Dateien).
 *
 * Solange kein Backend verbunden ist (`cloudAktiv() === false`), gelten ehrliche lokale Rückfälle:
 * Versand öffnet das Mail-/SMS-Programm, Push wird zur In-App-Benachrichtigung, öffentliche Links
 * funktionieren nur im selben Browser. Das Paket „Fundament“ ersetzt die Implementierung über
 * `setzeCloud()` – alle anderen Pakete rufen NUR diese Funktionen auf, nie einen Anbieter direkt.
 */
import type { ID } from './objects';

export interface Versand {
  an: string; // E-Mail-Adresse oder Telefonnummer
  kanal: 'email' | 'sms' | 'whatsapp';
  betreff?: string;
  text: string;
  /** optional gestaltete Fassung für E-Mail (Text bleibt der Rückfall) */
  html?: string;
  /** Absender aus Sicht des Kunden: Name des Betriebs, Antworten gehen an den Betrieb */
  absender?: { name?: string; antwortAn?: string };
  /** Link, der mitgeschickt wird (z. B. Kundenbereich) */
  link?: string;
  /** Anhänge als URL (Storage) oder Data-URL */
  anhaenge?: { name: string; url: string; mime?: string }[];
  /** Bezug für Zeitstrahl und Öffnen-Status */
  bezug?: { typ: string; id: ID };
}

export interface VersandErgebnis {
  /** 'gesendet' = wirklich verschickt; 'geoeffnet' = lokales Programm geöffnet (kein Nachweis) */
  status: 'gesendet' | 'geoeffnet' | 'fehler';
  id?: string;
  fehler?: string;
}

export interface PushNachricht {
  anMitarbeiterId: ID;
  titel: string;
  text?: string;
  /** Pfad in der App, der beim Tippen öffnet */
  pfad?: string;
  /** Aktionen direkt in der Benachrichtigung, z. B. Urlaub genehmigen */
  aktionen?: { aktion: string; label: string; payload?: unknown }[];
}

export interface Konto {
  nutzerId: string;
  email?: string;
  telefon?: string;
  betriebId?: string;
}

export interface Cloud {
  aktiv(): boolean;
  /** angemeldetes Konto oder undefined */
  konto(): Konto | undefined;
  /** Anmeldung ohne Passwort: Link per E-Mail oder Code per SMS */
  anmelden(ziel: { email?: string; telefon?: string }): Promise<{ ok: boolean; fehler?: string }>;
  codeBestaetigen(telefon: string, code: string): Promise<{ ok: boolean; fehler?: string }>;
  abmelden(): Promise<void>;
  /** Mitarbeiter einladen (SMS/E-Mail mit Link) */
  einladen(mitarbeiterId: ID, ziel: { email?: string; telefon?: string }): Promise<VersandErgebnis>;
  senden(v: Versand): Promise<VersandErgebnis>;
  push(n: PushNachricht): Promise<void>;
  /** öffentlich lesbares Objekt hinter einem Token (Kundenbereich, Terminbuchung) */
  oeffentlichLesen<T = unknown>(art: 'portal' | 'buchung', token: string): Promise<T | undefined>;
  /**
   * Was ein Endkunde über einen öffentlichen Link tut (geöffnet, Nachricht, Angebot annehmen, Termin buchen) an den Betrieb
   * schicken. Optional: fehlt es, nutzt der Kundenbereich die Server-Funktion `/api/oeffentlich/aktion`.
   */
  oeffentlichSenden?(e: { art: 'portal' | 'buchung'; token: string; typ: 'geoeffnet' | 'nachricht' | 'angebot' | 'buchung'; daten: Record<string, unknown> }): Promise<{ ok: true } | { ok: false; fehler: string }>;
  /** Datei ablegen, liefert URL */
  dateiAblegen(datei: Blob, name: string): Promise<string>;
}

const lokal: Cloud = {
  aktiv: () => false,
  konto: () => undefined,
  anmelden: async () => ({ ok: false, fehler: 'Konten sind noch nicht verbunden.' }),
  codeBestaetigen: async () => ({ ok: false, fehler: 'Konten sind noch nicht verbunden.' }),
  abmelden: async () => {},
  einladen: async () => ({ status: 'fehler', fehler: 'Einladen braucht ein verbundenes Konto.' }),
  senden: async (v) => {
    const text = [v.text, v.link].filter(Boolean).join('\n\n');
    const url =
      v.kanal === 'email'
        ? `mailto:${encodeURIComponent(v.an)}?subject=${encodeURIComponent(v.betreff ?? '')}&body=${encodeURIComponent(text)}`
        : v.kanal === 'sms'
          ? `sms:${v.an}?&body=${encodeURIComponent(text)}`
          : `https://wa.me/${v.an.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
    try {
      globalThis.open?.(url, '_self');
    } catch {
      /* egal */
    }
    return { status: 'geoeffnet' };
  },
  push: async () => {},
  oeffentlichLesen: async () => undefined,
  dateiAblegen: async (datei) =>
    new Promise((ok, fehler) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.onerror = () => fehler(r.error);
      r.readAsDataURL(datei);
    }),
};

let aktuell: Cloud = lokal;

export function cloud(): Cloud {
  return aktuell;
}

export function cloudAktiv(): boolean {
  return aktuell.aktiv();
}

/** Vom Paket Fundament beim Start gesetzt, wenn Backend-Schlüssel vorhanden sind */
export function setzeCloud(c: Cloud) {
  aktuell = c;
}

export const LOKALE_CLOUD = lokal;
