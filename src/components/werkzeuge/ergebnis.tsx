"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";

/**
 * Grundaufbau jedes Rechners: links die Eingaben, rechts das Ergebnis
 * (auf großen Bildschirmen mitlaufend). Auf dem Handy erscheint unten eine
 * kleine Ergebnisleiste, solange man in den Eingaben ist.
 */
export function RechnerRahmen({
  titel,
  eingaben,
  ergebnis,
  kurzErgebnis,
  onZuruecksetzen,
}: {
  titel: string;
  eingaben: ReactNode;
  ergebnis: ReactNode;
  /** Kurzform für die Leiste auf dem Handy, z. B. „Stundensatz netto: 85,14 €“. */
  kurzErgebnis: { label: string; wert: string };
  onZuruecksetzen: () => void;
}) {
  return (
    <div data-druck className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <p className="hidden print:block print:text-lg print:font-bold">Macher OS – {titel}</p>
      <form
        aria-label={`Eingaben ${titel}`}
        onSubmit={(e) => e.preventDefault()}
        className="relative grid gap-6 rounded-2xl border border-line bg-white p-5 sm:p-7"
      >
        {eingaben}
        <div className="flex justify-end border-t border-line pt-4 print:hidden">
          <button
            type="button"
            onClick={onZuruecksetzen}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            Beispielwerte wiederherstellen
          </button>
        </div>
        <div
          aria-hidden
          className="sticky bottom-3 -mx-2 flex items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3 text-white shadow-lg lg:hidden print:hidden"
        >
          <span className="text-sm text-white/75">{kurzErgebnis.label}</span>
          <span className="font-display text-lg font-extrabold tabular-nums">{kurzErgebnis.wert}</span>
        </div>
      </form>
      <div className="lg:sticky lg:top-24">{ergebnis}</div>
    </div>
  );
}

export function ErgebnisKarte({
  hauptLabel,
  hauptWert,
  unterzeile,
  status,
  children,
  zusammenfassung,
  betreff,
  hinweis,
  meldung,
}: {
  hauptLabel: string;
  hauptWert: string;
  unterzeile?: ReactNode;
  /** Optionale Aussage über dem Hauptwert (z. B. Ampel). */
  status?: ReactNode;
  children?: ReactNode;
  /** Klartext für Kopieren und E-Mail. */
  zusammenfassung: string;
  betreff: string;
  hinweis?: string;
  /** Hinweis bei ungültigen oder unpassenden Eingaben. */
  meldung?: string | null;
}) {
  return (
    <section aria-label="Ergebnis" className="overflow-hidden rounded-2xl bg-ink text-white">
      <div className="p-6 sm:p-7">
        <div role="status" aria-live="polite" aria-atomic="true">
          {status}
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/60">{hauptLabel}</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl">
            {hauptWert}
          </p>
        </div>
        {unterzeile && <div className="mt-2 text-sm text-white/70">{unterzeile}</div>}
        {meldung && <EingabeHinweis>{meldung}</EingabeHinweis>}
        {children && <dl className="mt-6 divide-y divide-white/10 border-t border-white/10">{children}</dl>}
        {hinweis && <p className="mt-5 text-xs leading-relaxed text-white/55">{hinweis}</p>}
      </div>
      <ErgebnisAktionen text={zusammenfassung} betreff={betreff} />
    </section>
  );
}

export function ErgebnisZeile({
  label,
  wert,
  betont = false,
  zusatz,
}: {
  label: ReactNode;
  wert: string;
  betont?: boolean;
  zusatz?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={`text-sm ${betont ? "font-semibold text-white" : "text-white/70"}`}>
        {label}
        {zusatz && <span className="block text-xs text-white/50">{zusatz}</span>}
      </dt>
      <dd className={`shrink-0 text-right tabular-nums ${betont ? "font-display text-lg font-bold" : "font-semibold"}`}>
        {wert}
      </dd>
    </div>
  );
}

/** Hinweis, wenn Eingaben fehlen oder nicht zusammenpassen. */
export function EingabeHinweis({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-sm text-white/85">
      <Icon name="bell" className="mt-0.5 size-4 shrink-0 text-signal" />
      <span>{children}</span>
    </p>
  );
}

/** Kopieren, Drucken, per E-Mail senden. */
export function ErgebnisAktionen({ text, betreff }: { text: string; betreff: string }) {
  const [meldung, setMeldung] = useState("");

  async function kopieren() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const feld = document.createElement("textarea");
        feld.value = text;
        feld.setAttribute("readonly", "");
        feld.style.position = "fixed";
        feld.style.opacity = "0";
        document.body.appendChild(feld);
        feld.select();
        document.execCommand("copy");
        feld.remove();
      }
      setMeldung("Zusammenfassung kopiert.");
    } catch {
      setMeldung("Kopieren hat nicht geklappt. Bitte markiere den Text von Hand.");
    }
    window.setTimeout(() => setMeldung(""), 3500);
  }

  const mailHref = `mailto:?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
  const knopf =
    "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors";

  return (
    <div className="border-t border-white/10 bg-white/5 p-4 print:hidden">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Ergebnis speichern oder senden</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={kopieren} className={`${knopf} bg-signal text-white hover:bg-signal-dark`}>
          <Icon name="clipboard" className="size-4" /> Kopieren
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className={`${knopf} bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20`}
        >
          <Icon name="download" className="size-4" /> Drucken / PDF
        </button>
        <a
          href={mailHref}
          className={`${knopf} bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20`}
        >
          <Icon name="chat" className="size-4" /> Per E-Mail
        </a>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-white/80">
        {meldung}
      </p>
    </div>
  );
}

/** Baut den Klartext für Kopieren und E-Mail. */
export function baueZusammenfassung({
  titel,
  eingaben,
  ergebnis,
  hinweis,
  url,
}: {
  titel: string;
  eingaben: [string, string][];
  ergebnis: [string, string][];
  hinweis?: string;
  url: string;
}): string {
  const zeile = ([l, w]: [string, string]) => `${l}: ${w}`.replace(/ /g, " ");
  return [
    `${titel} – Ergebnis`,
    "",
    "Eingaben",
    ...eingaben.map(zeile),
    "",
    "Ergebnis",
    ...ergebnis.map(zeile),
    "",
    hinweis ?? "Das Ergebnis ist eine Orientierung, keine Steuerberatung.",
    `Berechnet mit dem kostenlosen ${titel} von Macher OS: ${url}`,
  ].join("\n");
}
