"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { eingabeText, leseZahl, zahl } from "@/content/werkzeuge/rechnen";

/* ------------------------------------------------------------------------ */
/* Prüfung                                                                  */
/* ------------------------------------------------------------------------ */

export type FeldDef = {
  label: string;
  einheit?: string;
  start: number;
  min?: number;
  max?: number;
  /** `min` ist ausgeschlossen (z. B. Stundenlohn muss > 0 sein). */
  groesserAlsMin?: boolean;
  ganzzahl?: boolean;
  hinweis?: string;
};

export type Pruefung = { wert: number; fehler?: string };

/** Prüft eine Eingabe. Ungültige Werte werden zu `NaN` und bekommen einen Fehlertext. */
export function pruefeZahl(text: string, def: Pick<FeldDef, "min" | "max" | "ganzzahl" | "groesserAlsMin">): Pruefung {
  if (text.trim() === "") return { wert: NaN, fehler: "Bitte eine Zahl eintragen." };
  const wert = leseZahl(text);
  if (Number.isNaN(wert)) return { wert: NaN, fehler: "Bitte nur Zahlen eintragen, z. B. 12,5." };
  if (def.ganzzahl && !Number.isInteger(wert)) return { wert: NaN, fehler: "Bitte eine ganze Zahl eintragen." };
  if (def.min !== undefined) {
    if (def.groesserAlsMin ? wert <= def.min : wert < def.min) {
      return {
        wert: NaN,
        fehler: def.groesserAlsMin ? `Muss größer als ${zahl(def.min, 2)} sein.` : `Mindestens ${zahl(def.min, 2)}.`,
      };
    }
  }
  if (def.max !== undefined && wert > def.max) return { wert: NaN, fehler: `Höchstens ${zahl(def.max, 2)}.` };
  return { wert };
}

/* ------------------------------------------------------------------------ */
/* Hook für eine Gruppe von Zahlenfeldern                                   */
/* ------------------------------------------------------------------------ */

export type ZahlFeldProps = {
  id: string;
  label: string;
  einheit?: string;
  hinweis?: string;
  wert: string;
  fehler?: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
};

/**
 * Verwaltet mehrere Zahlenfelder: Rohtext je Feld, geprüfte Werte, Fehler.
 * `defs` muss außerhalb der Komponente definiert sein (stabile Referenz).
 */
export function useFelder<K extends string>(defs: Record<K, FeldDef>) {
  const basisId = useId();
  const keys = useMemo(() => Object.keys(defs) as K[], [defs]);
  const start = useCallback(
    () => Object.fromEntries(keys.map((k) => [k, eingabeText(defs[k].start)])) as Record<K, string>,
    [defs, keys],
  );
  const [roh, setRoh] = useState<Record<K, string>>(start);

  const geprueft = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, pruefeZahl(roh[k], defs[k])])) as Record<K, Pruefung>,
    [roh, defs, keys],
  );
  const werte = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, geprueft[k].wert])) as Record<K, number>,
    [geprueft, keys],
  );
  const gueltig = keys.every((k) => geprueft[k].fehler === undefined);

  const feld = (k: K): ZahlFeldProps => ({
    id: `${basisId}-${k}`,
    label: defs[k].label,
    einheit: defs[k].einheit,
    hinweis: defs[k].hinweis,
    wert: roh[k],
    fehler: geprueft[k].fehler,
    onChange: (text) => setRoh((r) => ({ ...r, [k]: text })),
    onBlur: () => {
      if (geprueft[k].fehler === undefined) setRoh((r) => ({ ...r, [k]: eingabeText(geprueft[k].wert) }));
    },
  });

  return { werte, gueltig, feld, zuruecksetzen: () => setRoh(start()) };
}

/* ------------------------------------------------------------------------ */
/* Bausteine                                                                */
/* ------------------------------------------------------------------------ */

export function ZahlFeld({
  id,
  label,
  einheit,
  hinweis,
  wert,
  fehler,
  onChange,
  onBlur,
  kompakt = false,
  labelVersteckt = false,
}: ZahlFeldProps & { kompakt?: boolean; labelVersteckt?: boolean }) {
  const beschreibung = [hinweis ? `${id}-hinweis` : null, fehler ? `${id}-fehler` : null].filter(Boolean).join(" ");
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={labelVersteckt ? "sr-only" : "feld-label text-ink"}
      >
        {label}
      </label>
      <div
        className={`flex items-stretch overflow-hidden rounded-lg bg-white ring-1 ring-inset transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-primary ${
          fehler ? "ring-danger" : "ring-line-dark hover:ring-muted"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={wert}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={fehler ? true : undefined}
          aria-describedby={beschreibung || undefined}
          className={`w-full min-w-0 bg-transparent text-right font-semibold tabular-nums text-ink focus-visible:outline-none ${
            kompakt ? "h-12 px-2.5 text-base" : "h-12 px-3 text-base"
          }`}
        />
        {einheit && (
          <span
            aria-hidden
            className={`flex shrink-0 items-center border-l border-line-dark bg-sand text-sm font-medium text-muted ${
              kompakt ? "px-2" : "px-3"
            }`}
          >
            {einheit}
          </span>
        )}
      </div>
      {einheit && <span className="sr-only">in {einheit}</span>}
      {hinweis && (
        <p id={`${id}-hinweis`} className="mt-1.5 text-sm leading-snug text-muted">
          {hinweis}
        </p>
      )}
      {fehler && (
        <p id={`${id}-fehler`} className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-danger">
          <Icon name="x" className="size-4 shrink-0" />
          {fehler}
        </p>
      )}
    </div>
  );
}

/** Gruppe von Feldern mit Überschrift. */
export function FeldGruppe({
  titel,
  beschreibung,
  children,
  spalten = 2,
}: {
  titel: string;
  beschreibung?: string;
  children: ReactNode;
  spalten?: 1 | 2 | 3;
}) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[spalten];
  return (
    <fieldset className="min-w-0 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-1 w-full font-display text-base font-bold">{titel}</legend>
      {beschreibung && <p className="clear-both mb-3 text-sm text-muted">{beschreibung}</p>}
      <div className={`clear-both grid gap-4 ${cols} ${beschreibung ? "" : "pt-2"}`}>{children}</div>
    </fieldset>
  );
}

/** Auswahl aus wenigen Möglichkeiten als Segment-Schalter (native Radiobuttons). */
export function Umschalter<T extends string>({
  label,
  name,
  wert,
  optionen,
  onChange,
}: {
  label: string;
  name: string;
  wert: T;
  optionen: { wert: T; label: string }[];
  onChange: (wert: T) => void;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="min-w-0">
      <p id={`${id}-label`} className="feld-label">
        {label}
      </p>
      {/* Heller Umschalter (UX-Spezifikation 5.2): ruhige Spur, gewählte Option weiß mit Rand – keine dunklen Balken */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-sand p-1">
        {optionen.map((o) => (
          <label
            key={o.wert}
            className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-center transition-colors duration-150 ease-out has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
              wert === o.wert ? "border-line-dark bg-white font-semibold text-signal-dark" : "border-transparent font-medium text-muted hover:bg-white"
            }`}
          >
            <input
              type="radio"
              name={`${id}-${name}`}
              value={o.wert}
              checked={wert === o.wert}
              onChange={() => onChange(o.wert)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function Schalter({
  label,
  checked,
  onChange,
  hinweis,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hinweis?: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-[var(--color-signal-dark)]"
      />
      <span>
        <span className="font-semibold">{label}</span>
        {hinweis && <span className="block text-sm text-muted">{hinweis}</span>}
      </span>
    </label>
  );
}

export function Auswahl<T extends string>({
  id,
  label,
  wert,
  optionen,
  onChange,
  labelVersteckt = false,
  kompakt = false,
}: {
  id: string;
  label: string;
  wert: T;
  optionen: { wert: T; label: string }[];
  onChange: (wert: T) => void;
  labelVersteckt?: boolean;
  kompakt?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelVersteckt ? "sr-only" : "feld-label"}>
        {label}
      </label>
      <select
        id={id}
        value={wert}
        onChange={(e) => onChange(e.target.value as T)}
        className={`feld font-semibold ${kompakt ? "px-2.5" : ""}`}
      >
        {optionen.map((o) => (
          <option key={o.wert} value={o.wert}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
