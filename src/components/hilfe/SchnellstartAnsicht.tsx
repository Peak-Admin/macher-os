import { Icon } from "@/components/ui";
import type { SchnellstartAnsicht as Ansicht } from "@/content/hilfe/schnellstart";

/** Kleine, stilisierte Ansicht je Schnellstart-Schritt. Rein dekorativ, keine Screenshots. */
export function SchnellstartAnsicht({ ansicht }: { ansicht: Ansicht }) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border border-line bg-white shadow-lg shadow-ink/5"
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-paper px-3 py-2">
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="ml-2 text-[0.65rem] font-semibold text-muted">Handwerk OS</span>
      </div>
      <div className="p-4 text-sm">{inhalt[ansicht]}</div>
    </div>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="mb-2.5">
      <p className="mb-1 text-[0.7rem] font-semibold text-muted">{label}</p>
      <p className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-xs">{wert}</p>
    </div>
  );
}

function Knopf({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-signal py-2 text-xs font-bold text-white">
      {children}
    </span>
  );
}

const inhalt: Record<Ansicht, React.ReactNode> = {
  konto: (
    <>
      <p className="mb-3 font-display font-bold">Kostenlos starten</p>
      <Zeile label="Konto" wert="nicht nötig" />
      <Zeile label="Passwort" wert="nicht nötig" />
      <Knopf>Kostenlos testen</Knopf>
    </>
  ),
  gewerk: (
    <>
      <p className="mb-3 font-display font-bold">Welcher Betrieb bist du?</p>
      <Zeile label="Website" wert="elektro-meier.de" />
      <Knopf>Betrieb übernehmen</Knopf>
      <p className="mt-2 text-center text-xs font-semibold text-signal-dark">Keine Website? Gewerk auswählen</p>
    </>
  ),
  mitarbeiter: (
    <>
      <p className="mb-3 font-display font-bold">Dein Team</p>
      <ul className="space-y-1.5">
        {[
          ["Lukas", "Monteur", "eingeladen"],
          ["Ali", "Meister", "aktiv"],
          ["Mia", "Azubi", "eingeladen"],
        ].map(([n, r, s]) => (
          <li key={n} className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-xs">
            <Icon name="user" className="size-4 text-muted" />
            <span className="font-semibold">{n}</span>
            <span className="text-muted">{r}</span>
            <span className={`ml-auto font-semibold ${s === "aktiv" ? "text-moss" : "text-sky"}`}>{s}</span>
          </li>
        ))}
      </ul>
      <Knopf>
        <Icon name="plus" className="size-3.5" /> Mitarbeiter hinzufügen
      </Knopf>
    </>
  ),
  auftrag: (
    <>
      <p className="mb-3 font-display font-bold">Neuer Auftrag</p>
      <Zeile label="Kunde" wert="Fam. Petersen" />
      <Zeile label="Ort" wert="Lindenstr. 12" />
      <Zeile label="Was ist zu tun?" wert="Wallbox montieren" />
      <Knopf>Speichern & einplanen</Knopf>
    </>
  ),
  app: (
    <div className="flex items-center gap-4">
      <div className="w-24 shrink-0 rounded-xl border-4 border-ink bg-paper p-1.5">
        <p className="text-[0.55rem] font-semibold text-muted">Nächster Einsatz</p>
        <p className="mt-1 rounded bg-white p-1 text-[0.6rem] font-bold ring-1 ring-line">Wallbox montieren</p>
        <p className="mt-1 rounded bg-signal py-1 text-center text-[0.55rem] font-bold text-white">Starten</p>
      </div>
      <ul className="space-y-1.5 text-xs">
        {(
          [
            ["camera", "Kamera erlauben"],
            ["map", "Standort erlauben"],
            ["bell", "Mitteilungen erlauben"],
          ] as const
        ).map(([i, l]) => (
          <li key={l} className="flex items-center gap-1.5">
            <Icon name={i} className="size-3.5 text-signal-dark" /> {l}
          </li>
        ))}
      </ul>
    </div>
  ),
  planung: (
    <>
      <p className="mb-3 font-display font-bold">Plan · Diese Woche</p>
      <div className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] gap-1 text-[0.65rem]">
        <span />
        {["Mo", "Di", "Mi"].map((d) => (
          <span key={d} className="text-center font-semibold text-muted">
            {d}
          </span>
        ))}
        <span className="font-semibold">Lukas</span>
        <span className="col-span-2 rounded bg-sky px-1 py-1 font-semibold text-white">Neubau</span>
        <span className="rounded border border-dashed border-signal bg-signal-soft px-1 py-1 font-semibold text-signal-dark">
          Wallbox
        </span>
        <span className="font-semibold">Ali</span>
        <span className="rounded bg-moss px-1 py-1 font-semibold text-white">Service</span>
        <span className="col-span-2 rounded bg-sand px-1 py-1 text-muted">Urlaub</span>
      </div>
      <p className="mt-3 rounded-md bg-signal-soft px-2.5 py-1.5 text-[0.7rem]">
        <b>Vorschlag:</b> Lukas, Mittwoch – frei und in der Nähe
      </p>
    </>
  ),
};
