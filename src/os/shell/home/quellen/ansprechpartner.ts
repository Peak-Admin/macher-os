/**
 * „Hilfe & Ansprechpartner“: die EINE Stelle für den persönlichen Ansprechpartner bei Mission Mittelstand.
 * Ohne Eintrag zeigt das Home einen neutralen Text mit dem allgemeinen Support-Weg – nie erfundene Namen,
 * Nummern oder Zeiten. Fotos nur, wenn sie im Bildregister von Mission Mittelstand freigegeben sind
 * (`missionMittelstandBilder` in src/content/bilder.ts), sonst Initialen.
 */
import { missionMittelstandBilder } from '@/content/bilder';
import { SUPPORT_EMAIL } from '@/content/unternehmen';

export interface AnsprechpartnerKonfig {
  name: string;
  /** z. B. „Deine Ansprechpartnerin“ */
  rolle?: string;
  telefon?: string;
  email?: string;
  /** Pfad unter public/, nur wirksam, wenn freigegeben */
  foto?: string;
}

/**
 * TODO(Betreiber): echten Ansprechpartner eintragen, sobald Name, Telefon, E-Mail und Foto freigegeben sind, z. B.
 * `{ name: '…', rolle: 'Dein Ansprechpartner', telefon: '…', email: '…', foto: '/bilder/mission-mittelstand/….webp' }`.
 * Später kommt die Zuordnung je Betrieb aus dem Backend – dann nur diese Konstante ersetzen.
 */
export const ANSPRECHPARTNER: AnsprechpartnerKonfig | null = null;

/** Allgemeiner Kontaktweg (echte Adressen und Seiten der Website) */
export const SUPPORT = {
  email: SUPPORT_EMAIL,
  /** Website-Seite „Kontakt & Support“ */
  kontakt: '/hilfe/kontakt',
  /** Anleitungen */
  hilfe: '/hilfe-center',
};

const FREIGEGEBEN = missionMittelstandBilder.map((b) => b.src);

export interface AnsprechpartnerAnzeige {
  name: string;
  rolle: string;
  initialen: string;
  foto?: string;
  telefon?: { text: string; href: string };
  email?: { text: string; href: string };
}

const initialenAus = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Konfiguration → Anzeige. Leerer Name = kein Ansprechpartner. Foto nur mit Freigabe. */
export function ansprechpartnerAnzeige(k: AnsprechpartnerKonfig | null | undefined, freigegeben: string[] = FREIGEGEBEN): AnsprechpartnerAnzeige | null {
  const name = k?.name?.trim();
  if (!k || !name) return null;
  const tel = k.telefon?.trim();
  const mail = k.email?.trim();
  return {
    name,
    rolle: k.rolle?.trim() || 'Dein Ansprechpartner bei Mission Mittelstand',
    initialen: initialenAus(name),
    foto: k.foto && freigegeben.includes(k.foto) ? k.foto : undefined,
    telefon: tel ? { text: tel, href: `tel:${tel.replace(/[^+\d]/g, '')}` } : undefined,
    email: mail ? { text: mail, href: `mailto:${mail}` } : undefined,
  };
}
