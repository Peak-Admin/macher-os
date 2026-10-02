/**
 * Kontaktwege des Ansprechpartners: nur, was als Daten wirklich da ist – keine erfundenen Nummern.
 * Reihenfolge nach Spezifikation: Anrufen (primär) · WhatsApp/Nachricht (sekundär) · Termin (darunter).
 */
import { nummerInternational } from '@modules/nachrichten/daten';
import type { ContactPerson } from '../typen';

export interface KontaktWeg {
  art: 'anrufen' | 'whatsapp' | 'nachricht' | 'termin';
  label: string;
  href: string;
}

export interface KontaktWege {
  anrufen?: KontaktWeg & { nummer: string };
  /** sekundär: WhatsApp, Nachricht (in dieser Reihenfolge) */
  schreiben: KontaktWeg[];
  termin?: KontaktWeg;
}

export function kontaktWege(p: Pick<ContactPerson, 'telefon' | 'whatsapp' | 'messageUrl' | 'bookingUrl'>): KontaktWege {
  const tel = p.telefon?.trim();
  const telDigits = tel?.replace(/[^\d+]/g, '');
  const wa = nummerInternational(p.whatsapp?.trim());
  const schreiben: KontaktWeg[] = [];
  if (wa) schreiben.push({ art: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${wa}` });
  if (p.messageUrl) schreiben.push({ art: 'nachricht', label: 'Nachricht schreiben', href: p.messageUrl });
  return {
    anrufen: tel && telDigits && /\d{4,}/.test(telDigits) ? { art: 'anrufen', label: 'Anrufen', href: `tel:${telDigits}`, nummer: tel } : undefined,
    schreiben,
    termin: p.bookingUrl ? { art: 'termin', label: 'Termin buchen', href: p.bookingUrl } : undefined,
  };
}
