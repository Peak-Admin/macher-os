import { Icon, type IconName } from "@/components/ui";
import type { TagEintrag } from "@/content/gewerke";

const balken: Record<TagEintrag["farbe"], string> = {
  sky: "bg-sky",
  signal: "bg-signal",
  moss: "bg-moss",
  ink: "bg-ink",
};

/** Stilisierte Tagesansicht eines Betriebs – gewerkspezifisch befüllt. Rein dekorativ. */
export function GewerkTagMock({
  betrieb,
  label,
  tag,
  hinweis,
  chips,
}: {
  betrieb: string;
  label: string;
  tag: TagEintrag[];
  hinweis?: { titel: string; text: string };
  chips?: string[];
}) {
  return (
    <div
      role="img"
      aria-label={`Tagesansicht in Macher OS für ${label}: heutige Einsätze${hinweis ? " und ein Hinweis von Macher" : ""}`}
      className="rounded-xl border border-ink/10 bg-white shadow-2xl shadow-ink/10"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="home" className="size-4 text-muted" /> Heute · {betrieb}
        </span>
        <span className="rounded-md bg-moss-soft px-2 py-0.5 text-xs font-semibold text-moss">{tag.length} Einsätze</span>
      </div>
      <div className="space-y-3 bg-paper/60 p-4 sm:p-5">
        <div className="rounded-lg border border-line bg-white">
          {tag.map((t) => (
            <div key={t.zeit + t.titel} className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0">
              <span className={`h-9 w-1 shrink-0 rounded-full ${balken[t.farbe]}`} />
              <span className="w-11 shrink-0 text-xs font-semibold text-muted">{t.zeit}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.titel}</span>
                <span className="block truncate text-xs text-muted">{t.detail}</span>
              </span>
            </div>
          ))}
        </div>
        {hinweis && (
          <div className="rounded-lg border border-moss/30 bg-moss-soft p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-moss">
              <Icon name="spark" className="size-3.5" /> {hinweis.titel}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{hinweis.text}</p>
          </div>
        )}
        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink-soft ring-1 ring-line">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Stilisierte Mitarbeiter-App mit dem nächsten Einsatz – gewerkspezifisch befüllt. */
export function GewerkPhoneMock({
  einsatz,
}: {
  einsatz: { zeit: string; titel: string; kunde: string; tags: string[] };
}) {
  const aktionen: [IconName, string][] = [
    ["map", "Navigation"],
    ["camera", "Foto"],
    ["mic", "Sprechen"],
    ["box", "Material"],
  ];
  return (
    <div
      role="img"
      aria-label={`Macher OS App auf dem Handy: nächster Einsatz „${einsatz.titel}“ mit Navigation, Fotos und Unterschrift`}
      className="mx-auto w-[280px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-ink/30"
    >
      <div className="overflow-hidden rounded-[1.8rem] bg-paper">
        <div className="flex items-center justify-between bg-ink px-5 pb-3 pt-2 text-[0.65rem] text-white/80">
          <span>{einsatz.zeit}</span>
          <span className="h-4 w-16 rounded-full bg-ink-soft" />
          <span>100%</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Nächster Einsatz · {einsatz.zeit}</p>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-line">
            <p className="font-display text-base font-bold leading-tight">{einsatz.titel}</p>
            <p className="mt-1 text-xs text-muted">{einsatz.kunde}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {einsatz.tags.map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${
                    i % 2 === 0 ? "bg-moss-soft text-moss" : "bg-sky-soft text-sky"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {aktionen.map(([icon, label]) => (
              <span
                key={label}
                className="flex flex-col items-center gap-1 rounded-lg bg-white py-3 text-[0.7rem] font-semibold ring-1 ring-line"
              >
                <Icon name={icon} className="size-5 text-signal-dark" />
                {label}
              </span>
            ))}
          </div>
          <span className="flex items-center justify-center gap-2 rounded-lg bg-signal py-3 text-sm font-bold text-white">
            <Icon name="play" className="size-4" /> Auftrag starten
          </span>
          <span className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-xs font-semibold ring-1 ring-line">
            <Icon name="signature" className="size-4" /> Unterschrift & abschließen
          </span>
        </div>
      </div>
    </div>
  );
}

/** Stilisierte Einrichtung: Gewerk wählen, Macher OS richtet ein. Rein dekorativ. */
export function EinrichtungMock() {
  const gewerke = ["Elektro", "SHK", "Maler", "Fliesen", "Tischler", "Dach", "Bau", "GaLaBau"];
  const eingerichtet = [
    "Begriffe: Anlage, Wartung, Notdienst",
    "Vorlagen: Wartungsvertrag, Protokoll",
    "Checklisten: Wartung, Druckprobe",
    "Qualifikationen: Kältemittel-Sachkunde",
  ];
  return (
    <div
      role="img"
      aria-label="Einrichtung in Macher OS: Gewerk SHK gewählt, Begriffe, Vorlagen, Checklisten und Qualifikationen werden passend eingerichtet"
      className="rounded-xl border border-ink/10 bg-white shadow-2xl shadow-ink/10"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-semibold">Einrichtung · Schritt 1 von 4</span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-sand">
          <span className="block h-full w-1/4 bg-signal" />
        </span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="font-display text-lg font-bold">Was macht dein Betrieb?</p>
        <div className="grid grid-cols-4 gap-2">
          {gewerke.map((g) => (
            <span
              key={g}
              className={`rounded-md px-2 py-2 text-center text-xs font-semibold ${
                g === "SHK" ? "bg-ink text-white" : "bg-paper text-ink-soft ring-1 ring-line"
              }`}
            >
              {g}
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-moss/30 bg-moss-soft p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-moss">
            <Icon name="spark" className="size-3.5" /> Macher richtet für SHK ein:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {eingerichtet.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" /> {e}
              </li>
            ))}
          </ul>
        </div>
        <span className="flex items-center justify-center gap-2 rounded-lg bg-signal py-2.5 text-sm font-bold text-white">
          Weiter <Icon name="arrow-right" className="size-4" />
        </span>
      </div>
    </div>
  );
}
