import { Icon, type IconName } from "@/components/ui";
import type { TagEintrag } from "@/content/gewerke";
import { HandyRahmen } from "@/components/mocks/AppFenster";
import { GlasIcon } from "@/os/ui/glas";

/** Kleiner Punkt je Einsatzart – wie „Heute im Betrieb“ in der Software (kein Streifen an der Kante) */
const punkt: Record<TagEintrag["farbe"], string> = {
  sky: "bg-line-dark",
  signal: "bg-primary",
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
      aria-label={`Tagesansicht in Handwerk OS für ${label}: heutige Einsätze${hinweis ? " und ein Hinweis von Macher" : ""}`}
      className="vorschau-fenster overflow-hidden border border-line bg-app-canvas p-3 text-ink sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <GlasIcon name="sonne" size={28} className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold">Heute im Betrieb</span>
            <span className="block truncate text-[11px] text-muted">{betrieb}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
      </div>
      <div className="space-y-3">
        <div className="app-lift divide-y divide-app-linie overflow-hidden rounded-xl border border-app-linie bg-white">
          {tag.map((t) => (
            <div key={t.zeit + t.titel} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-11 shrink-0 font-display text-sm font-bold tabular-nums">{t.zeit}</span>
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${punkt[t.farbe]}`} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{t.titel}</span>
                <span className="block truncate text-[11px] text-muted">{t.detail}</span>
              </span>
            </div>
          ))}
        </div>
        {hinweis && (
          <div className="rounded-xl bg-signal-soft p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-signal-dark">
              <Icon name="spark" className="size-3.5" /> {hinweis.titel}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-ink">{hinweis.text}</p>
          </div>
        )}
        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink ring-1 ring-app-linie">
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
    <HandyRahmen
      role="img"
      aria-label={`Handwerk OS App auf dem Handy: nächster Einsatz „${einsatz.titel}“ mit Navigation, Fotos und Unterschrift`}
      zeit={einsatz.zeit}
      kopf={`Nächster Einsatz · ${einsatz.zeit}`}
    >
      <div className="app-lift rounded-2xl border border-app-linie bg-white p-4">
        <p className="font-display text-base font-bold leading-tight text-ink">{einsatz.titel}</p>
        <p className="mt-1 text-xs text-muted">{einsatz.kunde}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {einsatz.tags.map((t) => (
            <span key={t} className="rounded bg-app-ruhig px-2 py-0.5 text-[0.65rem] font-semibold text-muted">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {aktionen.map(([icon, label]) => (
          <span
            key={label}
            className="app-lift flex flex-col items-center gap-1 rounded-xl border border-app-linie bg-white py-3 text-[0.7rem] font-semibold text-ink"
          >
            <Icon name={icon} className="size-5 text-signal-dark" />
            {label}
          </span>
        ))}
      </div>
      <span className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white">
        <Icon name="play" className="size-4" /> Auftrag starten
      </span>
      <span className="flex items-center justify-center gap-2 rounded-xl border border-app-linie bg-white py-2.5 text-xs font-semibold text-ink">
        <Icon name="signature" className="size-4" /> Unterschrift & abschließen
      </span>
    </HandyRahmen>
  );
}

/** Stilisierte Einrichtung: Gewerk wählen, Handwerk OS richtet ein. Rein dekorativ. */
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
      aria-label="Einrichtung in Handwerk OS: Gewerk SHK gewählt, Begriffe, Vorlagen, Checklisten und Qualifikationen werden passend eingerichtet"
      className="vorschau-fenster overflow-hidden border border-line bg-app-canvas p-3 text-ink sm:p-4"
    >
      <div className="app-lift space-y-4 rounded-xl border border-app-linie bg-white p-4 sm:p-5">
        <p className="text-[13px] font-semibold text-muted">Einrichtung · eine Frage</p>
        <p className="font-display text-lg font-bold">Welcher Betrieb bist du?</p>
        <div className="grid grid-cols-4 gap-2">
          {gewerke.map((g) => (
            <span
              key={g}
              className={`rounded-md px-2 py-2 text-center text-xs font-semibold ${
                g === "SHK" ? "bg-signal-soft text-signal-dark ring-2 ring-primary" : "bg-white text-ink ring-1 ring-line-dark"
              }`}
            >
              {g}
            </span>
          ))}
        </div>
        <div className="rounded-xl bg-signal-soft p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-signal-dark">
            <Icon name="spark" className="size-3.5" /> Macher richtet für SHK ein:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {eingerichtet.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" /> {e}
              </li>
            ))}
          </ul>
        </div>
        <span className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white">
          Weiter <Icon name="arrow-right" className="size-4" />
        </span>
      </div>
    </div>
  );
}
