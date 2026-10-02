"use client";

import { Icon } from "@/components/ui";

/** Öffnet den Druckdialog des Browsers (auch „Als PDF speichern“). */
export function DruckenButton({ label = "Kostenlos nutzen / Drucken", className = "" }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex min-h-13 max-w-full items-center justify-center gap-2 btn-primaer px-5 text-center sm:px-7 sm:whitespace-nowrap ${className}`}
    >
      <Icon name="download" className="size-5" />
      {label}
    </button>
  );
}

/**
 * Druck-CSS für Seiten mit druckbarer Vorlage: Header, Footer und alles mit
 * `print:hidden` verschwinden, nur der Bereich `#druckbereich` bleibt sichtbar.
 */
export function DruckStyles() {
  return (
    <style>{`
@media print {
  @page { size: A4; margin: 12mm 12mm 14mm; }
  html, body { background: white !important; }
  body > header, body > footer, body > a[href="#inhalt"] { display: none !important; }
  #druckbereich { box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; }
  #druckbereich * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #druckbereich table, #druckbereich .vorlage-block { break-inside: avoid; }
  #druckbereich tr { break-inside: avoid; }
}
`}</style>
  );
}
