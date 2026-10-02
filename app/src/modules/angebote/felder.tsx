/** Zahlenfelder für Positionen, Aufmaß und Kalkulation – deutsche Schreibweise, mobil mit Zahlentastatur. */
import { useEffect, useRef, useState } from 'react';
import { centAlsEingabe, centAus } from '@core/format';
import { Eingabe } from '@ui/index';

/** "12,5" → 12.5; leer/ungültig → undefined */
export function zahlAus(eingabe: string): number | undefined {
  const t = eingabe.trim().replace(/\s/g, '');
  if (!t) return undefined;
  // 1.234,5 → 1234.5 ; 12.5 bleibt 12.5 (wenn kein Komma)
  const norm = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  const n = Number(norm);
  return Number.isFinite(n) ? n : undefined;
}

export const zahlAlsEingabe = (n: number | undefined) => (n == null ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','));

/**
 * Zahl eingeben. Hält den Text lokal, damit „12,“ tippbar ist, und meldet gültige Werte sofort.
 * `cent`: Wert ist in Cent, Eingabe in Euro.
 */
export function ZahlEingabe({
  label,
  wert,
  onWert,
  cent,
  optional,
  hilfe,
  fehler,
  disabled,
  platzhalter,
}: {
  label: string;
  wert: number | undefined;
  onWert: (n: number | undefined) => void;
  cent?: boolean;
  optional?: boolean;
  hilfe?: string;
  fehler?: string;
  disabled?: boolean;
  platzhalter?: string;
}) {
  const format = (w: number | undefined) => (cent ? centAlsEingabe(w) : zahlAlsEingabe(w));
  const [text, setText] = useState(format(wert));
  const fokus = useRef(false);
  useEffect(() => {
    if (!fokus.current) setText(format(wert));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert]);
  return (
    <Eingabe
      label={label}
      value={text}
      inputMode="decimal"
      optional={optional}
      hilfe={hilfe}
      fehler={fehler}
      disabled={disabled}
      placeholder={platzhalter}
      onFocus={(e) => {
        fokus.current = true;
        e.target.select();
      }}
      onBlur={() => {
        fokus.current = false;
        setText(format(wert));
      }}
      onChange={(e) => {
        setText(e.target.value);
        const v = e.target.value.trim();
        if (!v) return onWert(undefined);
        if (cent) onWert(centAus(v));
        else {
          const n = zahlAus(v);
          if (n != null) onWert(n);
        }
      }}
    />
  );
}
