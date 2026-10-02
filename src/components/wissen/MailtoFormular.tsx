"use client";

import { useId, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";

/**
 * Formular ohne Backend: Beim Absenden öffnet sich das E-Mail-Programm mit
 * vorbereiteter Nachricht an `email`. Es wird nichts im Hintergrund verschickt.
 */
export function MailtoFormular({
  email,
  betreff,
  einleitung,
  buttonLabel,
  gewerke,
}: {
  email: string;
  betreff: string;
  /** Erster Satz im E-Mail-Text. */
  einleitung: string;
  buttonLabel: string;
  gewerke: { slug: string; titel: string }[];
}) {
  const [geoeffnet, setGeoeffnet] = useState(false);
  const id = useId();

  function absenden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const zeilen = [
      einleitung,
      "",
      `Name: ${data.get("name") ?? ""}`,
      `Betrieb: ${data.get("betrieb") || "–"}`,
      `Gewerk: ${data.get("gewerk") || "–"}`,
    ];
    const nachricht = String(data.get("nachricht") ?? "").trim();
    if (nachricht) zeilen.push("", `Nachricht: ${nachricht}`);
    const href = `mailto:${email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(zeilen.join("\n"))}`;
    window.location.href = href;
    setGeoeffnet(true);
  }

  const feld =
    "h-11 w-full rounded-lg border border-line bg-white px-3 outline-none focus:border-ink/40 focus:ring-2 focus:ring-signal/40";

  return (
    <form onSubmit={absenden} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-semibold">
            Dein Name
          </label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={feld} />
        </div>
        <div>
          <label htmlFor={`${id}-betrieb`} className="mb-1.5 block text-sm font-semibold">
            Betrieb <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id={`${id}-betrieb`} name="betrieb" autoComplete="organization" className={feld} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-gewerk`} className="mb-1.5 block text-sm font-semibold">
          Gewerk <span className="font-normal text-muted">(optional)</span>
        </label>
        <select id={`${id}-gewerk`} name="gewerk" className={feld} defaultValue="">
          <option value="">Bitte wählen</option>
          {gewerke.map((g) => (
            <option key={g.slug} value={g.titel}>
              {g.titel}
            </option>
          ))}
          <option value="Anderes Gewerk">Anderes Gewerk</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-nachricht`} className="mb-1.5 block text-sm font-semibold">
          Frage oder Wunsch <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${id}-nachricht`}
          name="nachricht"
          rows={3}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-ink/40 focus:ring-2 focus:ring-signal/40"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 btn-primaer px-6"
      >
        <Icon name="bell" className="size-5" />
        {buttonLabel}
      </button>
      <p className="text-sm text-muted">
        Beim Absenden öffnet sich dein E-Mail-Programm mit einer vorbereiteten Nachricht an{" "}
        <a href={`mailto:${email}`} className="font-semibold text-ink underline underline-offset-2">
          {email}
        </a>
        . Erst wenn du sie dort abschickst, erreicht sie uns.
      </p>
      {geoeffnet && (
        <p role="status" className="rounded-md bg-moss-soft px-4 py-3 text-sm text-ink">
          Dein E-Mail-Programm sollte sich jetzt geöffnet haben. Falls nicht, schreib uns direkt an {email} mit dem
          Betreff „{betreff}“.
        </p>
      )}
    </form>
  );
}
