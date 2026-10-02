/**
 * Macher-Orb: zeigt, dass die KI gerade arbeitet – statt eines Spinners. Eigene, schlanke CSS-Komponente
 * (keine Abhängigkeit). Zustände und Zuordnung zu Absichten: `orb-zustand.ts`.
 *
 * Regeln: Neben dem Orb steht immer ein Statustext (`MacherArbeitet`), nie nur die Animation. Der Leuchtrand
 * (`kiGlow`) liegt nur so lange um Eingabe, Karte oder Knopf, wie die KI arbeitet. Bei `prefers-reduced-motion`
 * bleiben Orb und Rand statisch.
 */
import type { CSSProperties } from 'react';
import { orbText, type OrbZustand } from './orb-zustand';
import './orb.css';

export { ORB_ZUSTAENDE, orbFuer, orbText, type OrbZustand } from './orb-zustand';

export function MacherOrb({ zustand = 'arbeitet', groesse = 20, aufDunkel, className }: { zustand?: OrbZustand; groesse?: 20 | 64 | number; aufDunkel?: boolean; className?: string }) {
  return (
    <span
      className={`mm-orb${aufDunkel ? ' mm-orb--dunkel' : ''}${className ? ` ${className}` : ''}`}
      data-zustand={zustand}
      style={{ '--orb': `${groesse}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="mm-orb-kern" />
      <span className="mm-orb-a" />
      <span className="mm-orb-b" />
      <span className="mm-orb-c" />
    </span>
  );
}

/** Orb + Statustext („Macher sucht …“) – als Ladezustand überall dort, wo die KI arbeitet. */
export function MacherArbeitet({ zustand = 'arbeitet', text, groesse = 20, className }: { zustand?: OrbZustand; text?: string; groesse?: 20 | 64 | number; className?: string }) {
  return (
    <div className={`mm-ki-status${groesse >= 48 ? ' mm-ki-status--gross' : ''}${className ? ` ${className}` : ''}`} role="status" aria-live="polite">
      <MacherOrb zustand={zustand} groesse={groesse} />
      <span>{text ?? orbText(zustand)}</span>
    </div>
  );
}

/** Klasse für den Leuchtrand – nur solange die KI arbeitet: `className={kiGlow(laedt)}` */
export function kiGlow(an: boolean | undefined): string | undefined {
  return an ? 'mm-ki-glow' : undefined;
}

/** Die KI-Kugel (Pink → Orange) als ruhiges Zeichen für Macher, die KI – ohne Animation. */
export function KiKugel({ groesse = 24, className }: { groesse?: number; className?: string }) {
  return <span className={`mm-ki-kugel${className ? ` ${className}` : ''}`} style={{ '--kugel': `${groesse}px` } as CSSProperties} aria-hidden="true" />;
}
