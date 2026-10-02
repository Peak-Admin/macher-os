/**
 * Verzeichnis der Telefonanbieter. Heute nur der Simulator – ein echter Anbieter kommt als weiterer Adapter dazu
 * (eine Datei neben `simulator.ts`, ein Eintrag hier). Siehe `docs/os/KI-TELEFONIE.md`.
 */
import { simulatorAnbieter } from './simulator';
import type { TelefonAnbieter } from './typen';

export const ANBIETER: TelefonAnbieter[] = [simulatorAnbieter];

export function anbieter(id: string | undefined): TelefonAnbieter | undefined {
  return ANBIETER.find((a) => a.id === id);
}

export type { AgentDefinition, AnrufErgebnis, TelefonAnbieter, TelefonEreignis } from './typen';
