"use client";

import { Icon } from "./Icon";

/**
 * Eigener Knopf zum Leeren eines Suchfelds (das „X“ des Browsers ist in globals.css ausgeblendet).
 * Liegt rechts im Feld – das Feld braucht dafür `pr-14`. Danach steht der Fokus wieder im Feld.
 */
export function SucheLeeren({ feldId, onLeeren }: { feldId: string; onLeeren: () => void }) {
  return (
    <button
      type="button"
      aria-label="Suche leeren"
      onClick={() => {
        onLeeren();
        document.getElementById(feldId)?.focus();
      }}
      className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:bg-sand hover:text-ink"
    >
      <Icon name="x" className="size-5" />
    </button>
  );
}
