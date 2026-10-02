/** Rollen & Rechte: verständliche Texte und Regeln für die Rechte-Matrix aus `core/session.ts`. */
import type { Rolle } from '@core/objects';
import type { Recht } from '@core/session';

export type Matrix = Record<Rolle, Recht[]>;

export const RECHT_TEXT: Record<Recht, { kann: string; kannNicht: string }> = {
  lesen: { kann: 'Aufträge, Kunden, Termine und Dokumente ansehen', kannNicht: 'Sieht keine Aufträge, Kunden und Termine' },
  schreiben: { kann: 'Fotos, Notizen, Aufgaben, Zeiten und Material erfassen und ändern', kannNicht: 'Kann nichts erfassen oder ändern, nur ansehen' },
  planen: { kann: 'Einsätze für andere planen und verschieben', kannNicht: 'Sieht nur die eigene Planung, kann andere nicht einplanen' },
  geld: { kann: 'Preise, Kosten, Rechnungen und Ertrag sehen und ändern', kannNicht: 'Sieht keine Preise, Kosten, Rechnungen und Ertrag' },
  veroeffentlichen: { kann: 'Angebote, Rechnungen und Nachrichten an Kunden senden', kannNicht: 'Kann nichts an Kunden senden' },
  personal: { kann: 'Lohn, Stundenkonten und Abwesenheiten anderer sehen', kannNicht: 'Sieht nur eigene Zeiten und Abwesenheiten' },
  loeschen: { kann: 'Dinge in den Papierkorb legen', kannNicht: 'Kann nichts löschen' },
  admin: { kann: 'Einstellungen, Rollen und Schnittstellen ändern', kannNicht: 'Kann Einstellungen und Rechte nicht ändern' },
};

/** Der Chef behält immer alle Rechte – sonst kann sich niemand mehr selbst helfen. */
export const FESTE_ROLLE: Rolle = 'chef';

/**
 * Ein Recht für eine Rolle an- oder ausschalten. Regeln:
 * - Chef-Rechte sind nicht entziehbar.
 * - Ohne „Ansehen“ geht nichts: Wer „Ansehen“ verliert, verliert alles; wer etwas anderes bekommt, bekommt „Ansehen“ dazu.
 */
export function rechtSetzen(matrix: Matrix, rolle: Rolle, recht: Recht, an: boolean): Matrix {
  if (rolle === FESTE_ROLLE) return matrix;
  const alt = matrix[rolle] ?? [];
  let neu: Recht[];
  if (an) {
    neu = [...new Set<Recht>([...alt, recht, 'lesen'])];
  } else {
    neu = recht === 'lesen' ? [] : alt.filter((r) => r !== recht);
  }
  return { ...matrix, [rolle]: neu };
}

/** Chef bekommt immer alle Rechte – auch wenn eine alte Einstellung etwas anderes sagt */
export function bereinigen(matrix: Matrix, alleRechte: Recht[]): Matrix {
  return { ...matrix, [FESTE_ROLLE]: [...alleRechte] };
}

export function gleich(a: Matrix, b: Matrix): boolean {
  const rollen = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<Rolle>;
  for (const r of rollen) {
    const x = [...(a[r] ?? [])].sort().join();
    const y = [...(b[r] ?? [])].sort().join();
    if (x !== y) return false;
  }
  return true;
}
