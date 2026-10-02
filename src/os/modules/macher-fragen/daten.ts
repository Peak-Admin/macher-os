/** Verlauf von „Macher fragen“ – eigene Sammlung `chat` (je Mitarbeiter). */
import { auditAusnehmen, defineCollection } from '@core/db';
import type { Basis, ID } from '@core/objects';
import type { Antwort } from './assistent';

export interface ChatEintrag extends Basis {
  mitarbeiterId?: ID;
  rolle: 'frage' | 'antwort' | 'fehler';
  text: string;
  antwort?: Antwort;
  /** welche Gateway-Lane bzw. welches Modell geantwortet hat */
  modell?: string;
}

export const chat = defineCollection<ChatEintrag>('chat');
// Der Chatverlauf ist selbst ein Protokoll – keine Feldänderungen im Verlauf am Objekt
auditAusnehmen('chat');
