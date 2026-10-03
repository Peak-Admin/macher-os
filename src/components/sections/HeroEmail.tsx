"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * E-Mail-Einstieg im Hero (auf dunkler Bühne). Eigene Prüfung statt Browser-Blase:
 * leer oder ungültig → Meldung unter dem Feld, sonst geht das Formular normal ab.
 */
export function HeroEmail({ action }: { action: string }) {
  const [fehler, setFehler] = useState<string>();

  function absenden(e: FormEvent<HTMLFormElement>) {
    const feld = e.currentTarget.elements.namedItem("email") as HTMLInputElement | null;
    const wert = feld?.value.trim() ?? "";
    const meldung = !wert
      ? "Bitte gib deine E-Mail-Adresse ein."
      : !EMAIL.test(wert)
        ? "Bitte prüf deine E-Mail-Adresse, z. B. name@betrieb.de."
        : undefined;
    setFehler(meldung);
    if (meldung) {
      e.preventDefault();
      feld?.focus();
    }
  }

  return (
    <form action={action} method="get" noValidate onSubmit={absenden}>
      <label htmlFor="hero-email" className="mb-2 block text-base font-medium text-white">
        Deine E-Mail-Adresse
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="hero-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="name@betrieb.de"
          aria-invalid={fehler ? true : undefined}
          aria-describedby={fehler ? "hero-email-fehler" : undefined}
          onChange={() => fehler && setFehler(undefined)}
          className="h-12 w-full min-w-0 rounded-lg border border-white/40 bg-white px-4 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent aria-[invalid=true]:border-danger sm:flex-1"
        />
        <button type="submit" className="btn-primaer min-h-12 shrink-0 px-6">
          Kostenlos testen
        </button>
      </div>
      {fehler && (
        <p
          id="hero-email-fehler"
          role="alert"
          className="mt-2 flex items-start gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"
        >
          <Icon name="achtung" className="mt-0.5 size-4 shrink-0" />
          {fehler}
        </p>
      )}
    </form>
  );
}
