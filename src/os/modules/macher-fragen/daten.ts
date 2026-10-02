/** Verlauf von „Macher fragen“ – eigene Sammlung `chat` (je Mitarbeiter). */
import { defineCollection } from '@core/db';
import type { Basis, ID } from '@core/objects';
import type { Antwort } from './assistent';

export interface ChatEintrag extends Basis {
  mitarbeiterId?: ID;
  rolle: 'frage' | 'antwort' | 'fehler';
  text: string;
  antwort?: Antwort;
  /** welches Sprachmodell geantwortet hat */
  modell?: string;
}

export const chat = defineCollection<ChatEintrag>('chat');
