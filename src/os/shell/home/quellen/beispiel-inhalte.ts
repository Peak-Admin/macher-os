/**
 * BEISPIELINHALTE – nicht aus einem echten System. Getrennt vom Datenweg (`inhalte.ts`), damit sie sich mit
 * einer Zeile (`setzeHomeInhalte(...)`) durch die echte Quelle ersetzen lassen. Alles ist als `beispiel`
 * markiert und wird in der Oberfläche als „Beispiel“ gekennzeichnet. Keine echten Personen, keine Fotos.
 */
import type { Ankuendigung, ContactPerson, NewsItem } from '../typen';
import type { HomeInhalte } from './inhalte';
import { fuerRolle } from './filter';

const verzoegert = <T>(wert: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(wert), ms));

export const BEISPIEL_ANSPRECHPARTNER: ContactPerson = {
  id: 'beispiel-ansprechpartner',
  name: 'Julia Muster',
  role: 'Deine Ansprechpartnerin',
  company: 'Mission Mittelstand',
  zitat: 'Ich helfe dir bei allen Fragen rund um deine Software.',
  messageUrl: '/kontakt',
  bookingUrl: '/demo',
  supportUrl: '/hilfe-center',
  beispiel: true,
};

export const BEISPIEL_NEUIGKEITEN: NewsItem[] = [
  {
    id: 'workshop-top-mitarbeiter',
    type: 'workshop',
    title: 'So findest und führst du echte Top-Mitarbeiter',
    description: 'Live-Online-Workshop für Inhaber und Büro.',
    publishedAt: '2026-09-20',
    eventDate: '2026-10-08',
    targetAudience: ['chef', 'buero'],
    actionLabel: 'Jetzt anmelden',
    actionUrl: '/kontakt',
    extern: true,
    beispiel: true,
  },
  {
    id: 'angebot-per-sprache',
    type: 'product_update',
    title: 'Neu: Angebote per Sprache vorbereiten',
    description: 'Sag, was du machen willst – Lotte schreibt die Positionen.',
    publishedAt: '2026-09-15',
    targetAudience: ['chef', 'buero'],
    actionLabel: 'Ausprobieren',
    actionUrl: '/start/angebot',
    beispiel: true,
  },
  {
    id: 'vorlagen',
    type: 'template',
    title: 'Vorlagen für Angebote und Berichte',
    description: 'Einmal einrichten, bei jedem Auftrag nutzen.',
    publishedAt: '2026-09-01',
    actionLabel: 'Ansehen',
    actionUrl: '/betrieb/vorlagen',
    beispiel: true,
  },
  {
    id: 'wissen',
    type: 'guide',
    title: 'Anleitungen fürs Team sammeln',
    description: 'Wissen aus dem Betrieb, direkt am Auftrag.',
    publishedAt: '2026-08-20',
    actionLabel: 'Zum Wissen',
    actionUrl: '/betrieb/wissen',
    beispiel: true,
  },
];

export const BEISPIEL_ANKUENDIGUNGEN: Ankuendigung[] = [
  {
    id: 'workshop-2026-10-08',
    oberzeile: 'Live Online Workshop · 08.10.2026',
    titel: 'So findest und führst du echte Top-Mitarbeiter',
    actionLabel: 'Jetzt anmelden',
    actionUrl: '/kontakt',
    extern: true,
    bis: '2026-10-08',
    targetAudience: ['chef', 'buero'],
    beispiel: true,
  },
];

export const beispielInhalte: HomeInhalte = {
  ansprechpartner: () => verzoegert(BEISPIEL_ANSPRECHPARTNER),
  neuigkeiten: (rolle) => verzoegert(fuerRolle(BEISPIEL_NEUIGKEITEN, rolle).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))),
  ankuendigungen: (rolle) => verzoegert(fuerRolle(BEISPIEL_ANKUENDIGUNGEN, rolle), 0),
};
