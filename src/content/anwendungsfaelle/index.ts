/**
 * Inhalte der Anwendungsfall-Seiten (`/funktionen/[slug]`), die je einem Modul
 * von Handwerk OS (`src/os/modules`) entsprechen. Gleicher Aufbau wie die
 * Funktionsseiten in `../funktionen.ts`; nach Bereichen auf Dateien verteilt.
 */
import { teil1 } from "./teil1";
import { teil2 } from "./teil2";
import { teil3 } from "./teil3";
import { teil4 } from "./teil4";
import { teil5 } from "./teil5";
import { teil6 } from "./teil6";
import { teil7 } from "./teil7";
import { teil8 } from "./teil8";
import { teil9 } from "./teil9";

export const anwendungsfaelle = { ...teil1, ...teil2, ...teil3, ...teil4, ...teil5, ...teil6, ...teil7, ...teil8, ...teil9 };
