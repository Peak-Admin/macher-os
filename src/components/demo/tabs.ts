import type { KeyboardEvent } from "react";

/**
 * Tastatursteuerung für Tab-Listen (WAI-ARIA Tabs-Muster):
 * Pfeiltasten (waagerecht und senkrecht) wechseln, Pos1/Ende springen an den Anfang/das Ende.
 */
export function tabKeyHandler(index: number, count: number, select: (i: number) => void) {
  return (e: KeyboardEvent<HTMLButtonElement>) => {
    let target: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (index + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = (index - 1 + count) % count;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = count - 1;
    if (target === null) return;
    e.preventDefault();
    select(target);
    const tabs = e.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[target]?.focus();
  };
}
