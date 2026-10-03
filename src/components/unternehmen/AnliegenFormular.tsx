"use client";

import { useId, useState, type FormEvent } from "react";
import { FeldFehler, Icon } from "@/components/ui";
import type { Anliegen } from "@/content/unternehmen";

/**
 * Kurzes Kontaktformular ohne Backend.
 * Beim Absenden öffnet sich das E-Mail-Programm mit vorbereitetem Betreff und Text.
 * Es wird nichts im Hintergrund verschickt.
 */
export function AnliegenFormular({
  anliegen,
  frage = "Worum geht es?",
  betreffPrefix = "Anfrage",
  mitBetrieb = true,
}: {
  anliegen: Anliegen[];
  frage?: string;
  betreffPrefix?: string;
  mitBetrieb?: boolean;
}) {
  const id = useId();
  const [auswahlId, setAuswahlId] = useState(anliegen[0]?.id ?? "");
  const [geoeffnet, setGeoeffnet] = useState(false);
  const [fehler, setFehler] = useState<{ name?: string; nachricht?: string }>({});
  const auswahl = anliegen.find((a) => a.id === auswahlId) ?? anliegen[0];

  function absenden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const daten = new FormData(e.currentTarget);
    const name = String(daten.get("name") ?? "").trim();
    const betrieb = String(daten.get("betrieb") ?? "").trim();
    const nachricht = String(daten.get("nachricht") ?? "").trim();

    // Eigene Prüfung statt Browser-Blasen: Meldung unter dem Feld, Fokus aufs erste fehlende Feld
    const neu = {
      name: name ? undefined : "Bitte gib deinen Namen ein.",
      nachricht: nachricht ? undefined : "Bitte schreib kurz, worum es geht.",
    };
    setFehler(neu);
    if (neu.name || neu.nachricht) {
      setGeoeffnet(false);
      const erstes = neu.name ? "name" : "nachricht";
      (e.currentTarget.elements.namedItem(erstes) as HTMLElement | null)?.focus();
      return;
    }

    const betreff = `${betreffPrefix}: ${auswahl.label}${betrieb ? ` – ${betrieb}` : ""}`;
    const text = [
      `Thema: ${auswahl.label}`,
      `Name: ${name}`,
      betrieb ? `Betrieb: ${betrieb}` : null,
      "",
      nachricht,
    ]
      .filter((z) => z !== null)
      .join("\n");

    window.location.href = `mailto:${auswahl.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
    setGeoeffnet(true);
  }

  return (
    <form onSubmit={absenden} noValidate className="rounded-2xl border border-line bg-white p-6 sm:p-8">
      <fieldset>
        <legend className="font-display text-lg font-bold">{frage}</legend>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {anliegen.map((a) => {
            const aktiv = a.id === auswahl.id;
            return (
              <label
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                  aktiv ? "bg-signal-soft ring-2 ring-signal" : "ring-line hover:ring-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="anliegen"
                  value={a.id}
                  checked={aktiv}
                  onChange={() => {
                    setAuswahlId(a.id);
                    setGeoeffnet(false);
                  }}
                  className="sr-only"
                />
                <Icon name={a.icon} className={`mt-0.5 size-5 shrink-0 ${aktiv ? "text-signal-dark" : "text-muted"}`} />
                <span>
                  <span className="block font-semibold leading-snug">{a.label}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{a.beschreibung}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={`mt-6 grid gap-4 ${mitBetrieb ? "sm:grid-cols-2" : ""}`}>
        <Feld id={`${id}-name`} label="Dein Name">
          <input
            id={`${id}-name`}
            name="name"
            required
            autoComplete="name"
            aria-invalid={fehler.name ? true : undefined}
            aria-describedby={fehler.name ? `${id}-name-fehler` : undefined}
            onChange={() => fehler.name && setFehler((f) => ({ ...f, name: undefined }))}
            className={feldKlasse}
          />
          <FeldFehler id={`${id}-name-fehler`}>{fehler.name}</FeldFehler>
        </Feld>
        {mitBetrieb && (
          <Feld id={`${id}-betrieb`} label="Betrieb" optional>
            <input id={`${id}-betrieb`} name="betrieb" autoComplete="organization" className={feldKlasse} />
          </Feld>
        )}
      </div>
      <div className="mt-4">
        <Feld id={`${id}-nachricht`} label="Deine Nachricht">
          <textarea
            id={`${id}-nachricht`}
            name="nachricht"
            required
            rows={5}
            placeholder={auswahl.platzhalter}
            aria-invalid={fehler.nachricht ? true : undefined}
            aria-describedby={fehler.nachricht ? `${id}-nachricht-fehler` : undefined}
            onChange={() => fehler.nachricht && setFehler((f) => ({ ...f, nachricht: undefined }))}
            className={`${feldKlasse} h-auto py-3`}
          />
          <FeldFehler id={`${id}-nachricht-fehler`}>{fehler.nachricht}</FeldFehler>
        </Feld>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 btn-primaer px-5"
        >
          E-Mail vorbereiten <Icon name="arrow-right" className="size-4" />
        </button>
        <p className="text-sm text-muted">
          Öffnet dein E-Mail-Programm mit einer Nachricht an{" "}
          <a href={`mailto:${auswahl.email}`} className="font-semibold text-ink underline underline-offset-2">
            {auswahl.email}
          </a>
          .
        </p>
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm">
        {geoeffnet && (
          <span className="flex items-start gap-2 rounded-lg bg-moss-soft p-3 text-moss">
            <Icon name="check" className="mt-0.5 size-4 shrink-0" />
            <span>
              Deine Nachricht ist vorbereitet. Schick sie in deinem E-Mail-Programm ab. Hat sich nichts geöffnet? Schreib
              direkt an <b>{auswahl.email}</b>.
            </span>
          </span>
        )}
      </p>
    </form>
  );
}

const feldKlasse =
  "feld";

function Feld({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="feld-label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
