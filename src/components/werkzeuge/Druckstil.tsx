/**
 * Druckansicht für die Rechner: Gedruckt wird nur der Bereich mit
 * `data-druck` (Eingaben + Ergebnis), schwarz auf weiß.
 */
const css = `
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden; }
  [data-druck], [data-druck] * { visibility: visible; }
  [data-druck] {
    position: absolute; inset: 0 auto auto 0; width: 100%;
    display: block !important;
  }
  [data-druck] > * { margin-bottom: 8mm; position: static !important; }
  [data-druck] *:not([data-balken]) {
    color: var(--color-ink) !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  [data-druck] [data-balken] { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  [data-druck] section, [data-druck] form { border: 1px solid var(--color-line) !important; break-inside: avoid; }
  [data-druck] input, [data-druck] select { border: 0 !important; }
}
`;

export function Druckstil() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
