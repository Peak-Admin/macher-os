"use client";

import { useId, useState, type FormEvent } from "react";
import { Auswahl, FeldFehler, Icon } from "@/components/ui";

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
  const [gewerk, setGewerk] = useState("");
  const [nameFehler, setNameFehler] = useState<string>();
  const id = useId();

  function absenden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // Eigene Prüfung statt Browser-Blase
    if (!String(data.get("name") ?? "").trim()) {
      setNameFehler("Bitte gib deinen Namen ein.");
      setGeoeffnet(false);
      (e.currentTarget.elements.namedItem("name") as HTMLElement | null)?.focus();
      return;
    }
    setNameFehler(undefined);
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
    "feld";

  return (
    <form onSubmit={absenden} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="feld-label">
            Dein Name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            required
            autoComplete="name"
            aria-invalid={nameFehler ? true : undefined}
            aria-describedby={nameFehler ? `${id}-name-fehler` : undefined}
            onChange={() => nameFehler && setNameFehler(undefined)}
            className={feld}
          />
          <FeldFehler id={`${id}-name-fehler`}>{nameFehler}</FeldFehler>
        </div>
        <div>
          <label htmlFor={`${id}-betrieb`} className="feld-label">
            Betrieb <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id={`${id}-betrieb`} name="betrieb" autoComplete="organization" className={feld} />
        </div>
      </div>
      <Auswahl
        id={`${id}-gewerk`}
        name="gewerk"
        label={
          <>
            Gewerk <span className="font-normal text-muted">(optional)</span>
          </>
        }
        wert={gewerk}
        onChange={setGewerk}
        knopfKlasse="font-normal"
        optionen={[
          { wert: "", label: "Bitte wählen" },
          ...gewerke.map((g) => ({ wert: g.titel, label: g.titel })),
          { wert: "Anderes Gewerk", label: "Anderes Gewerk" },
        ]}
      />
      <div>
        <label htmlFor={`${id}-nachricht`} className="feld-label">
          Frage oder Wunsch <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${id}-nachricht`}
          name="nachricht"
          rows={3}
          className="feld h-auto py-3"
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
