"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";

export type AuswahlOption<T extends string = string> = { wert: T; label: string };

/**
 * Eigene Auswahlliste statt nativem <select> (WAI-ARIA „Select-Only Combobox“).
 * Knopf im Stil von `.feld`, darunter eine weiße Liste (16 px Radius, Popover-Schatten).
 * Tastatur: ↑ ↓ Pos1 Ende Bild↑ Bild↓, Enter/Leertaste wählen, Esc schließt, Tab übernimmt, Tippen springt zum Eintrag.
 * Mit `name` wird der Wert über ein verstecktes Feld mit dem Formular abgeschickt.
 */
export function Auswahl<T extends string>({
  id,
  label,
  wert,
  optionen,
  onChange,
  name,
  labelVersteckt = false,
  labelKlasse = "feld-label",
  knopfKlasse = "font-semibold",
  kompakt = false,
}: {
  id?: string;
  label: ReactNode;
  wert: T;
  optionen: readonly AuswahlOption<T>[];
  onChange: (wert: T) => void;
  /** Feldname für Formulare (verstecktes Feld). */
  name?: string;
  labelVersteckt?: boolean;
  labelKlasse?: string;
  knopfKlasse?: string;
  kompakt?: boolean;
}) {
  const eigeneId = useId();
  const knopfId = id ?? `${eigeneId}-knopf`;
  const labelId = `${knopfId}-label`;
  const listeId = `${knopfId}-liste`;
  const optionId = (i: number) => `${knopfId}-option-${i}`;

  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const [nachOben, setNachOben] = useState(false);
  /** Ring um den aktiven Eintrag nur bei Tastaturbedienung – mit der Maus reicht die Fläche. */
  const [tastatur, setTastatur] = useState(false);
  const wurzel = useRef<HTMLDivElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const suche = useRef({ text: "", zeit: 0 });

  const gewaehlt = Math.max(
    0,
    optionen.findIndex((o) => o.wert === wert),
  );
  const aktuell = optionen[gewaehlt];

  function oeffnen(start = gewaehlt) {
    const rect = knopf.current?.getBoundingClientRect();
    if (rect) {
      const unten = window.innerHeight - rect.bottom;
      setNachOben(unten < 280 && rect.top > unten);
    }
    setAktiv(Math.min(Math.max(start, 0), optionen.length - 1));
    setOffen(true);
  }

  function schliessen() {
    setOffen(false);
  }

  function waehlen(i: number) {
    const o = optionen[i];
    if (o && o.wert !== wert) onChange(o.wert);
    setOffen(false);
    knopf.current?.focus();
  }

  // Klick außerhalb schließt die Liste
  useEffect(() => {
    if (!offen) return;
    const weg = (e: PointerEvent) => {
      if (!wurzel.current?.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("pointerdown", weg);
    return () => document.removeEventListener("pointerdown", weg);
  }, [offen]);

  // Aktiven Eintrag sichtbar halten
  useEffect(() => {
    if (!offen) return;
    const el = liste.current?.querySelector<HTMLElement>(`[data-index="${aktiv}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [offen, aktiv]);

  /** Type-ahead: Buchstaben sammeln (500 ms) und den nächsten passenden Eintrag finden. */
  function tippen(zeichen: string): number | null {
    const jetzt = Date.now();
    const s = suche.current;
    s.text = jetzt - s.zeit > 500 ? zeichen : s.text + zeichen;
    s.zeit = jetzt;
    const text = s.text.toLocaleLowerCase("de");
    const start = offen ? aktiv : gewaehlt;
    const gleich = text.split("").every((c) => c === text[0]);
    // Gleiche Taste mehrfach: durch die Einträge mit diesem Anfangsbuchstaben blättern
    const muster = gleich && text.length > 1 ? text[0] : text;
    const versatz = muster.length === 1 ? 1 : 0;
    for (let k = 0; k < optionen.length; k++) {
      const i = (start + versatz + k) % optionen.length;
      if (optionen[i].label.toLocaleLowerCase("de").startsWith(muster)) return i;
    }
    return null;
  }

  function taste(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "Tab") setTastatur(true);
    const letzter = optionen.length - 1;
    const tippt = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    const laufendeSuche = Date.now() - suche.current.zeit < 500 && suche.current.text !== "";

    if (!offen) {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          e.preventDefault();
          oeffnen();
          return;
        case "Home":
          e.preventDefault();
          oeffnen(0);
          return;
        case "End":
          e.preventDefault();
          oeffnen(letzter);
          return;
      }
      if (tippt) {
        e.preventDefault();
        const i = tippen(e.key);
        oeffnen(i ?? gewaehlt);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setAktiv((a) => Math.min(a + 1, letzter));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) waehlen(aktiv);
        else setAktiv((a) => Math.max(a - 1, 0));
        return;
      case "Home":
        e.preventDefault();
        setAktiv(0);
        return;
      case "End":
        e.preventDefault();
        setAktiv(letzter);
        return;
      case "PageDown":
        e.preventDefault();
        setAktiv((a) => Math.min(a + 10, letzter));
        return;
      case "PageUp":
        e.preventDefault();
        setAktiv((a) => Math.max(a - 10, 0));
        return;
      case "Escape":
        e.preventDefault();
        schliessen();
        return;
      case "Enter":
        e.preventDefault();
        waehlen(aktiv);
        return;
      case "Tab":
        // Wert übernehmen, Fokus wandert normal weiter
        if (optionen[aktiv] && optionen[aktiv].wert !== wert) onChange(optionen[aktiv].wert);
        schliessen();
        return;
      case " ":
        if (!laufendeSuche) {
          e.preventDefault();
          waehlen(aktiv);
          return;
        }
    }
    if (tippt) {
      e.preventDefault();
      const i = tippen(e.key);
      if (i !== null) setAktiv(i);
    }
  }

  return (
    <div className="min-w-0">
      <label id={labelId} htmlFor={knopfId} className={labelVersteckt ? "sr-only" : labelKlasse}>
        {label}
      </label>
      <div ref={wurzel} className="relative">
        <button
          ref={knopf}
          id={knopfId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={offen}
          aria-controls={listeId}
          aria-labelledby={labelId}
          aria-activedescendant={offen ? optionId(aktiv) : undefined}
          onClick={() => {
            setTastatur(false);
            if (offen) schliessen();
            else oeffnen();
          }}
          onKeyDown={taste}
          onBlur={(e) => {
            if (!wurzel.current?.contains(e.relatedTarget as Node | null)) setOffen(false);
          }}
          className={`feld flex cursor-pointer items-center gap-2 text-left ${kompakt ? "px-2.5" : ""} ${knopfKlasse}`}
        >
          <span className="min-w-0 flex-1 truncate">{aktuell?.label}</span>
          <Icon
            name="chevron-down"
            className={`size-5 shrink-0 text-muted transition-transform duration-150 ease-out ${offen ? "rotate-180" : ""}`}
          />
        </button>
        {name && <input type="hidden" name={name} value={wert} />}
        <ul
          ref={liste}
          id={listeId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          hidden={!offen}
          onMouseDown={(e) => e.preventDefault()}
          className={`mega-auf absolute left-0 z-40 max-h-72 w-full min-w-40 overflow-y-auto overscroll-contain rounded-3xl bg-white p-1.5 text-base text-ink shadow-popover ring-1 ring-line ${
            nachOben ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {optionen.map((o, i) => {
            const istGewaehlt = i === gewaehlt;
            const istAktiv = i === aktiv;
            return (
              <li
                key={o.wert}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={istGewaehlt}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => {
                  setTastatur(false);
                  if (aktiv !== i) setAktiv(i);
                }}
                onClick={() => waehlen(i)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 leading-snug transition-colors duration-150 ease-out ${
                  istGewaehlt ? "bg-signal-soft font-semibold text-signal-dark" : istAktiv ? "bg-sand" : ""
                } ${istAktiv && tastatur ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {istGewaehlt && <Icon name="check" className="size-5 shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
