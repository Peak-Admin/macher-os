"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { Icon, IconTile, type IconName } from "@/components/ui/Icon";

/**
 * Klickbare Vorschau von Macher OS – nachgebaut nach der echten Oberfläche (Spielwiese, Oktober 2026):
 * Sidebar mit Betrieb, „Suchen oder fragen“, den vier Bereichen und Favoriten; Bereichsnavigation als unterstrichene
 * Reihe, Unteransichten als heller Umschalter. Alle Daten sind Beispieldaten aus der Spielwiese und so gekennzeichnet.
 * Nichts wird gespeichert; jede Aktion ändert nur diese Vorschau.
 */

type Ansicht = "heute" | "auftraege" | "planen" | "betrieb" | "angebote" | "rechnungen" | "auswertung" | "suche";

const bereiche: { id: Ansicht; label: string; icon: IconName; zahl?: string }[] = [
  { id: "heute", label: "Heute", icon: "spark" },
  { id: "auftraege", label: "Aufträge", icon: "clipboard", zahl: "9+" },
  { id: "planen", label: "Planen", icon: "calendar" },
  { id: "betrieb", label: "Betrieb", icon: "home" },
];

const favoriten: { id: Ansicht; label: string; icon: IconName }[] = [
  { id: "angebote", label: "Angebote", icon: "file" },
  { id: "rechnungen", label: "Rechnungen", icon: "euro" },
  { id: "auswertung", label: "Auswertung", icon: "chart" },
];

type Ton = "warnung" | "neutral" | "erfolg" | "gefahr";
const toene: Record<Ton, string> = {
  warnung: "bg-warning-soft text-warning",
  neutral: "bg-sand text-muted",
  erfolg: "bg-signal-soft text-moss",
  gefahr: "bg-danger-soft text-danger",
};

function Status({ ton, children }: { ton: Ton; children: ReactNode }) {
  const icon: IconName = ton === "erfolg" ? "check" : ton === "neutral" ? "clock" : "achtung";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${toene[ton]}`}>
      <Icon name={icon} className="size-3" />
      {children}
    </span>
  );
}

const auftraege: { titel: string; kunde: string; schritt: string; status: [Ton, string] }[] = [
  { titel: "Nacharbeit: Abdeckung lose", kunde: "Familie Hoffmann · A-2026-0010", schritt: "Einsatz einplanen", status: ["warnung", "Dringend"] },
  { titel: "Störung: Sicherung fliegt raus", kunde: "Petra Schulz · A-2026-0001", schritt: "Annehmen und einplanen", status: ["warnung", "Dringend"] },
  { titel: "Wartung: Unterverteilung", kunde: "Hausverwaltung Nord GmbH · A-2026-0012", schritt: "Einsatz einplanen", status: ["neutral", "Beauftragt"] },
  { titel: "Wallbox: Abrechnung September", kunde: "Thomas Richter · A-2026-0008", schritt: "Rechnung fertigstellen", status: ["neutral", "Abrechnung"] },
];

const angebote: { titel: string; kunde: string; status: [Ton, string] }[] = [
  { titel: "Unterverteilung erneuern", kunde: "Hausverwaltung Nord GmbH", status: ["neutral", "Entwurf"] },
  { titel: "PV-Anlage mit Speicher", kunde: "Familie Petersen", status: ["neutral", "Verschickt"] },
  { titel: "Badsanierung Elektro", kunde: "Thomas Richter", status: ["erfolg", "Angenommen"] },
];

const rechnungen: { nr: string; kunde: string; betrag: string; status: [Ton, string] }[] = [
  { nr: "R-2026-0002", kunde: "Petra Schulz", betrag: "1.240,00 €", status: ["gefahr", "Überfällig"] },
  { nr: "R-2026-0004", kunde: "Hausverwaltung Nord GmbH", betrag: "3.758,00 €", status: ["neutral", "Offen"] },
  { nr: "R-2026-0001", kunde: "Familie Hoffmann", betrag: "486,50 €", status: ["erfolg", "Bezahlt"] },
];

const woche: { tag: string; termine: { zeit: string; titel: string; ton?: Ton; label?: string }[] }[] = [
  { tag: "Mo 28.09.", termine: [] },
  { tag: "Di 29.09.", termine: [] },
  { tag: "Mi 30.09.", termine: [] },
  { tag: "Do 01.10.", termine: [{ zeit: "07:00", titel: "Sanierung Haus 24", ton: "erfolg", label: "Erledigt" }] },
  {
    tag: "Fr 02.10.",
    termine: [
      { zeit: "07:00", titel: "Sanierung Haus 24", ton: "erfolg", label: "Bestätigt" },
      { zeit: "13:00", titel: "Jährliche Wartung" },
      { zeit: "15:30", titel: "Besichtigung Neubau", ton: "warnung", label: "Konflikt" },
    ],
  },
];

/** Unterstrichene Bereichsnavigation (wie in der Software) */
function Reiter<T extends string>({ werte, aktiv, setzen }: { werte: readonly T[]; aktiv: T; setzen: (w: T) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto border-b border-line text-[13px]">
      {werte.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => setzen(w)}
          aria-pressed={w === aktiv}
          className={`-mb-px shrink-0 border-b-2 py-2 font-semibold transition-colors duration-150 ${
            w === aktiv ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

/** Heller Umschalter für Unteransichten */
function Umschalter<T extends string>({ werte, aktiv, setzen }: { werte: readonly T[]; aktiv: T; setzen: (w: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-sand p-1 text-[12px]">
      {werte.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => setzen(w)}
          aria-pressed={w === aktiv}
          className={`rounded-md px-3 py-1 font-semibold transition-colors duration-150 ${
            w === aktiv ? "bg-white text-ink ring-1 ring-line-dark" : "text-muted hover:text-ink"
          }`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

function Liste({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">{children}</div>;
}

function Zeile({ titel, unter, rechts, onClick }: { titel: string; unter: string; rechts?: ReactNode; onClick?: () => void }) {
  const inhalt = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{titel}</span>
        <span className="block truncate text-[11px] text-muted">{unter}</span>
      </span>
      {rechts}
    </>
  );
  const klasse = "flex w-full items-center gap-3 px-3 py-2 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${klasse} transition-colors duration-150 hover:bg-hover`}>
      {inhalt}
    </button>
  ) : (
    <div className={klasse}>{inhalt}</div>
  );
}

function Kopf({ titel, aktion, onAktion }: { titel: string; aktion?: string; onAktion?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-display text-lg font-bold text-ink">{titel}</p>
      {aktion && (
        <button
          type="button"
          onClick={onAktion}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
        >
          <Icon name="plus" className="size-3.5" /> {aktion}
        </button>
      )}
    </div>
  );
}

function Hinweis({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="vorschau-ein flex items-center gap-2 rounded-lg bg-signal-soft px-3 py-2 text-[12px] font-semibold text-moss">
      <Icon name="check" className="size-3.5" /> {children}
    </p>
  );
}

// ---------------------------------------------------------------- Ansichten

type Termin = {
  id: string;
  zeit: string;
  titel: string;
  unter: string;
  ort: string;
  material: string[];
  ton?: Ton;
  label?: string;
};

/** Zustand von „Heute“ – liegt in der Vorschau, damit er beim Wechsel der Bereiche erhalten bleibt. */
type HeuteZustand = {
  schritt: number;
  offen: "auswahl" | null;
  erledigt: string[];
  termine: Termin[];
  aufgeklappt: string | null;
  abgehakt: Record<string, boolean>;
};

const startTermine: Termin[] = [
  {
    id: "haus24",
    zeit: "07:00",
    titel: "Sanierung Haus 24",
    unter: "Hausverwaltung Nord GmbH · Jonas, Lukas",
    ort: "Lindenstraße 24, Kassel",
    material: ["Sicherungsautomaten B16 (6 Stück)", "FI-Schalter 40 A", "NYM-J 3×2,5 (50 m)"],
    ton: "erfolg",
    label: "Bestätigt",
  },
  {
    id: "wartung",
    zeit: "13:00",
    titel: "Jährliche Wartung",
    unter: "Familie Hoffmann · Jonas",
    ort: "Am Weinberg 7, Kassel",
    material: ["Wartungsprotokoll", "Prüfgerät"],
  },
  {
    id: "neubau",
    zeit: "15:30",
    titel: "Besichtigung Neubau",
    unter: "Thomas Richter · Max",
    ort: "Rothenbergstraße 51, Kassel",
    material: ["Laser-Entfernungsmesser", "Angebotsvorlage Neubau"],
    ton: "warnung",
    label: "Konflikt",
  },
];

const startHeute: HeuteZustand = { schritt: 0, offen: null, erledigt: [], termine: startTermine, aufgeklappt: null, abgehakt: {} };

type Entscheidung = {
  ueberzeile: string;
  titel: string;
  unter: string;
  aktion: string;
  icon: IconName;
  bild: { src: string; alt: string; position: string };
  optionen: { label: string; unter: string; ergebnis: string; anwenden?: (z: HeuteZustand) => HeuteZustand }[];
};

const entscheidungen: Entscheidung[] = [
  {
    ueberzeile: "Dringend einplanen",
    titel: "Sicherung fehlt für Sanierung Haus 24",
    unter: "Jonas braucht sie morgen bis 12:00 Uhr.",
    aktion: "Einplanen",
    icon: "calendar",
    bild: { src: "/bilder/gewerke/elektriker.jpg", alt: "Geöffneter Verteilerschrank mit Leitungen", position: "70% 55%" },
    optionen: [
      {
        label: "Heute, 16:30 · Lukas",
        unter: "holt sie beim Großhandel ab",
        ergebnis: "Eingeplant: Lukas holt die Sicherung heute um 16:30 ab.",
        anwenden: (z) => ({
          ...z,
          termine: [
            ...z.termine,
            {
              id: "abholung",
              zeit: "16:30",
              titel: "Sicherung abholen",
              unter: "Großhandel · Lukas",
              ort: "Großhandel, Sandershäuser Straße, Kassel",
              material: ["Abholschein"],
              ton: "erfolg",
              label: "Bestätigt",
            },
          ],
        }),
      },
      { label: "Morgen, 07:00 · Jonas", unter: "nimmt sie vor Baustart mit", ergebnis: "Eingeplant: Jonas holt die Sicherung morgen um 07:00 ab." },
      { label: "Lieferung morgen", unter: "Großhandel, bis 10:00 Uhr", ergebnis: "Lieferung morgen bis 10:00 Uhr vorgemerkt." },
    ],
  },
  {
    ueberzeile: "Wartet auf dich",
    titel: "Angebot Familie Berger ist seit 6 Tagen offen",
    unter: "Badsanierung Elektro. Eine kurze Nachfrage hilft oft.",
    aktion: "Nachfassen",
    icon: "phone",
    bild: { src: "/bilder/objekte/klemmbrett.webp", alt: "Klemmbrett mit Stift", position: "60% 50%" },
    optionen: [
      { label: "Heute anrufen", unter: "Aufgabe für dich, 11:00 Uhr", ergebnis: "Aufgabe angelegt: Familie Berger heute um 11:00 anrufen." },
      { label: "Nachricht vorbereiten", unter: "du schickst sie selbst ab", ergebnis: "Nachricht an Familie Berger vorbereitet." },
    ],
  },
  {
    ueberzeile: "Konflikt heute",
    titel: "Max ist um 15:30 doppelt geplant",
    unter: "Besichtigung Neubau und Aufmaß Bäckerei Krämer.",
    aktion: "Konflikt lösen",
    icon: "route",
    bild: { src: "/bilder/objekte/zollstock.webp", alt: "Zollstock", position: "45% 40%" },
    optionen: [
      {
        label: "Besichtigung auf 16:30",
        unter: "Max hat danach frei",
        ergebnis: "Besichtigung Neubau auf 16:30 verschoben.",
        anwenden: (z) => ({
          ...z,
          termine: z.termine.map((t) => (t.id === "neubau" ? { ...t, zeit: "16:30", ton: "erfolg", label: "Bestätigt" } : t)),
        }),
      },
      {
        label: "Aufmaß an Lukas",
        unter: "Lukas ist ab 15:00 frei",
        ergebnis: "Aufmaß Bäckerei Krämer an Lukas übergeben.",
        anwenden: (z) => ({
          ...z,
          termine: z.termine.map((t) => (t.id === "neubau" ? { ...t, ton: "erfolg", label: "Bestätigt" } : t)),
        }),
      },
    ],
  },
];

const punkt: Record<Ton, string> = { erfolg: "bg-primary", warnung: "bg-warning", neutral: "bg-line-dark", gefahr: "bg-danger" };

function EntscheidungsKarte({ z, setZ }: { z: HeuteZustand; setZ: (f: (z: HeuteZustand) => HeuteZustand) => void }) {
  const e = entscheidungen[z.schritt];
  if (!e) {
    return (
      <div className="vorschau-ein flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <IconTile name="check" className="size-11" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">Nichts wartet mehr auf dich.</span>
          <span className="block text-[12px] text-muted">Neue Entscheidungen landen hier, sobald sie anfallen.</span>
        </span>
        <button
          type="button"
          onClick={() => setZ(() => startHeute)}
          className="shrink-0 rounded-lg border border-line-dark bg-white px-2.5 py-1.5 text-[12px] font-semibold text-signal-dark transition-colors duration-150 hover:bg-signal-soft"
        >
          Von vorn
        </button>
      </div>
    );
  }
  const waehlen = (o: Entscheidung["optionen"][number]) =>
    setZ((alt) => {
      const neu = o.anwenden ? o.anwenden(alt) : alt;
      return { ...neu, schritt: alt.schritt + 1, offen: null, erledigt: [...alt.erledigt, o.ergebnis] };
    });
  return (
    <div key={z.schritt} className="vorschau-ein relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_36px_-26px_rgb(16_44_33/0.45)]">
      {/* Ein Objekt pro Karte – rechts, weich ausgeblendet, nie hinter Text */}
      <div aria-hidden="true" className="relative h-24 sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[38%]">
        <Image src={e.bild.src} alt="" fill sizes="(min-width: 640px) 240px, 100vw" className="object-cover" style={{ objectPosition: e.bild.position }} />
        <span className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent sm:bg-gradient-to-r sm:from-white sm:via-white/40" />
      </div>
      <div className="relative flex gap-3 p-3.5 sm:w-[70%] sm:p-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <Icon name="achtung" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-warning">{e.ueberzeile}</p>
          <p className="mt-0.5 font-display text-[16px] font-bold leading-snug text-ink">{e.titel}</p>
          <p className="text-[12px] text-muted">{e.unter}</p>
          {z.offen === "auswahl" ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {e.optionen.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => waehlen(o)}
                  className="rounded-lg border border-line-dark bg-white px-2.5 py-1.5 text-left transition-colors duration-150 hover:border-primary hover:bg-signal-soft"
                >
                  <span className="block text-[12px] font-semibold text-ink">{o.label}</span>
                  <span className="block text-[10px] text-muted">{o.unter}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, offen: null }))}
                className="px-2 text-[12px] font-semibold text-muted hover:text-ink"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, offen: "auswahl" }))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-colors duration-150 hover:bg-primary-hover"
              >
                <Icon name={e.icon} className="size-4" /> {e.aktion}
              </button>
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, aufgeklappt: e.icon === "route" ? "neubau" : "haus24" }))}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal-dark hover:underline"
              >
                Details <Icon name="arrow-right" className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Heute({ gehe, z, setZ }: { gehe: (a: Ansicht) => void; z: HeuteZustand; setZ: (f: (z: HeuteZustand) => HeuteZustand) => void }) {
  const termine = [...z.termine].sort((a, b) => a.zeit.localeCompare(b.zeit));
  const offen = entscheidungen.length - z.schritt;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[26px] font-bold leading-tight text-ink">Servus, Max</p>
          <p className="text-[12px] text-muted">Hier ist das Wichtigste für dich · Freitag, 2. Oktober</p>
        </div>
        <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink">
          <Icon name="bell" className="size-4" />
          {offen > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              <span className="sr-only">Offene Entscheidungen: </span>
              {offen}
            </span>
          )}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[14px] font-semibold text-ink">Braucht deine Entscheidung</p>
          {offen > 0 && <span className="text-[11px] tabular-nums text-muted">{z.schritt + 1} von {entscheidungen.length}</span>}
        </div>
        {z.erledigt.length > 0 && <Hinweis>{z.erledigt[z.erledigt.length - 1]}</Hinweis>}
        <EntscheidungsKarte z={z} setZ={setZ} />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[14px] font-semibold text-ink">Heute im Betrieb</p>
          <button type="button" onClick={() => gehe("planen")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal-dark hover:underline">
            Alle Termine ansehen <Icon name="arrow-right" className="size-3.5" />
          </button>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {termine.map((t) => {
            const auf = z.aufgeklappt === t.id;
            return (
              <div key={t.id}>
                <button
                  type="button"
                  aria-expanded={auf}
                  onClick={() => setZ((alt) => ({ ...alt, aufgeklappt: auf ? null : t.id }))}
                  className="grid w-full grid-cols-[3rem_0.5rem_minmax(0,1fr)_auto_1rem] items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-hover"
                >
                  <span className="font-display text-[15px] font-bold tabular-nums text-ink">{t.zeit}</span>
                  <span aria-hidden="true" className={`size-2 rounded-full ${punkt[t.ton ?? "neutral"]}`} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-snug text-ink sm:truncate">{t.titel}</span>
                    <span className="block truncate text-[11px] text-muted">{t.unter}</span>
                  </span>
                  {t.ton && t.label ? <Status ton={t.ton}>{t.label}</Status> : <span />}
                  <Icon name="chevron-right" className={`size-4 text-line-dark transition-transform duration-150 ${auf ? "rotate-90" : ""}`} />
                </button>
                {auf && (
                  <div className="vorschau-ein grid gap-3 bg-paper/60 px-3 pb-3 pt-1 text-[12px] sm:grid-cols-2 sm:pl-[4.5rem]">
                    <div>
                      <p className="text-[11px] text-muted">Adresse</p>
                      <p className="font-semibold text-ink">{t.ort}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Material</p>
                      {t.material.map((m) => {
                        const schluessel = `${t.id}:${m}`;
                        return (
                          <label key={m} className="flex cursor-pointer items-center gap-2 py-0.5">
                            <input
                              type="checkbox"
                              checked={!!z.abgehakt[schluessel]}
                              onChange={(ev) => {
                                const wert = ev.target.checked;
                                setZ((alt) => ({ ...alt, abgehakt: { ...alt.abgehakt, [schluessel]: wert } }));
                              }}
                              className="size-3.5 accent-primary"
                            />
                            <span className={z.abgehakt[schluessel] ? "text-muted line-through" : "text-ink"}>{m}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const auftragsReiter = ["Übersicht", "Eingang", "Kunden", "Service"] as const;
const auftragsSicht = ["Aufträge", "Angebote", "Aufgaben"] as const;

function Auftraege({ start = "Aufträge" }: { start?: (typeof auftragsSicht)[number] }) {
  const [reiter, setReiter] = useState<(typeof auftragsReiter)[number]>("Übersicht");
  const [sicht, setSicht] = useState<(typeof auftragsSicht)[number]>(start);
  const [angelegt, setAngelegt] = useState(false);
  return (
    <div className="space-y-3">
      <Reiter werte={auftragsReiter} aktiv={reiter} setzen={setReiter} />
      {reiter === "Übersicht" && (
        <>
          <Umschalter werte={auftragsSicht} aktiv={sicht} setzen={setSicht} />
          <Kopf titel={sicht} aktion={sicht === "Aufträge" ? "Auftrag anlegen" : undefined} onAktion={() => setAngelegt(true)} />
          {angelegt && sicht === "Aufträge" && <Hinweis>Neuer Auftrag angelegt (nur in dieser Vorschau)</Hinweis>}
          <Liste>
            {sicht === "Aufträge" &&
              auftraege.map((a) => (
                <Zeile key={a.titel} titel={a.titel} unter={`${a.kunde} · ${a.schritt}`} rechts={<Status ton={a.status[0]}>{a.status[1]}</Status>} />
              ))}
            {sicht === "Angebote" &&
              angebote.map((a) => <Zeile key={a.titel} titel={a.titel} unter={a.kunde} rechts={<Status ton={a.status[0]}>{a.status[1]}</Status>} />)}
            {sicht === "Aufgaben" &&
              ["Material für Haus 24 bestellen", "Rückruf Familie Petersen", "Fotos Wartung hochladen"].map((t) => (
                <Zeile key={t} titel={t} unter="Max Macher · diese Woche" />
              ))}
          </Liste>
        </>
      )}
      {reiter === "Eingang" && (
        <>
          <Kopf titel="Eingang" />
          <Liste>
            <Zeile titel="Anfrage: Steckdosen im Keller" unter="Anruf · Petra Schulz · heute, 08:12" rechts={<Status ton="neutral">Neu</Status>} />
            <Zeile titel="Anfrage: Wallbox nachrüsten" unter="Formular · Familie Petersen · gestern" rechts={<Status ton="neutral">Neu</Status>} />
          </Liste>
        </>
      )}
      {reiter === "Kunden" && (
        <>
          <Kopf titel="Kunden" />
          <Liste>
            {["Hausverwaltung Nord GmbH", "Familie Hoffmann", "Thomas Richter", "Petra Schulz"].map((k) => (
              <Zeile key={k} titel={k} unter="Kassel" />
            ))}
          </Liste>
        </>
      )}
      {reiter === "Service" && (
        <>
          <Kopf titel="Service" />
          <Liste>
            <Zeile titel="Wartungsvertrag Unterverteilung" unter="Hausverwaltung Nord GmbH · jährlich" rechts={<Status ton="warnung">Fällig</Status>} />
            <Zeile titel="Servicevertrag Wallbox" unter="Thomas Richter · monatlich" />
          </Liste>
        </>
      )}
    </div>
  );
}

const planReiter = ["Kalender", "Einplanen", "Kapazität"] as const;

function Planen({ heute }: { heute: Termin[] }) {
  const tage = woche.map((t) =>
    t.tag.startsWith("Fr") ? { ...t, termine: [...heute].sort((a, b) => a.zeit.localeCompare(b.zeit)) } : t,
  );
  const [reiter, setReiter] = useState<(typeof planReiter)[number]>("Kalender");
  const [uebernommen, setUebernommen] = useState(false);
  return (
    <div className="space-y-3">
      <Reiter werte={planReiter} aktiv={reiter} setzen={setReiter} />
      {reiter === "Kalender" && (
        <>
          <Kopf titel="Kalender" aktion="Termin planen" onAktion={() => setReiter("Einplanen")} />
          <div className="grid grid-cols-5 gap-1.5">
            {tage.map((t) => (
              <div key={t.tag} className={`min-h-36 rounded-lg border bg-white p-1.5 ${t.tag.startsWith("Fr") ? "border-primary" : "border-line"}`}>
                <p className="text-[11px] font-semibold text-ink">{t.tag}</p>
                {t.termine.length === 0 && <p className="mt-1 text-[11px] text-muted">Frei</p>}
                <div className="mt-1 space-y-1">
                  {t.termine.map((e) => (
                    <div
                      key={e.zeit + e.titel}
                      className={`rounded-md border bg-white p-1 ${e.ton === "warnung" ? "border-danger/50" : "border-line"} shadow-[inset_2px_0_0_var(--color-primary)]`}
                    >
                      <p className="text-[10px] text-muted">{e.zeit}</p>
                      <p className="truncate text-[11px] font-semibold text-ink">{e.titel}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {reiter === "Einplanen" && (
        <>
          <Kopf titel="Einplanen" />
          {uebernommen ? (
            <Hinweis>Vorschlag übernommen: Tom, Fr. 08:00 Uhr</Hinweis>
          ) : (
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[13px] font-semibold text-ink">Kundendienst Fr. Weber</p>
              <p className="text-[11px] text-muted">Vorschlag: Tom, Freitag 08:00 Uhr – frei, 12 Min. entfernt, Material im Wagen</p>
              <button
                type="button"
                onClick={() => setUebernommen(true)}
                className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
              >
                Vorschlag übernehmen
              </button>
            </div>
          )}
          <Liste>
            <Zeile titel="Nacharbeit: Abdeckung lose" unter="Familie Hoffmann · noch kein Termin" rechts={<Status ton="warnung">Dringend</Status>} />
            <Zeile titel="Wartung: Unterverteilung" unter="Hausverwaltung Nord GmbH · noch kein Termin" />
          </Liste>
        </>
      )}
      {reiter === "Kapazität" && (
        <>
          <Kopf titel="Kapazität · KW 40" />
          <Liste>
            {[
              ["Jonas Becker", "Geselle", "3 Einsätze"],
              ["Lukas Weber", "Geselle", "1 Einsatz"],
              ["Max Macher", "Meister", "1 Besichtigung"],
              ["Tom Schuster", "Geselle", "Urlaub bis Do."],
            ].map(([n, r, w]) => (
              <Zeile key={n} titel={n} unter={r} rechts={<span className="text-[12px] font-semibold text-muted">{w}</span>} />
            ))}
          </Liste>
        </>
      )}
    </div>
  );
}

function Betrieb({ gehe }: { gehe: (a: Ansicht) => void }) {
  const karten: { titel: string; unter: string; icon: IconName; hinweis: string; ziel?: Ansicht }[] = [
    { titel: "Geld", unter: "Rechnungen & Belege", icon: "euro", hinweis: "1 Rechnung überfällig", ziel: "rechnungen" },
    { titel: "Team", unter: "Menschen & Zeiten", icon: "users", hinweis: "2 Zeiten zur Freigabe" },
    { titel: "Ausstattung", unter: "Material & Geräte", icon: "wrench", hinweis: "1 Lieferung überfällig" },
    { titel: "Unternehmen", unter: "Grundlagen & Regeln", icon: "shield", hinweis: "Fehlt: Anschrift" },
  ];
  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg font-bold text-ink">Betrieb</p>
        <p className="text-[12px] text-muted">Alles, was dein Betrieb dauerhaft braucht.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {karten.map((k) => (
          <button
            key={k.titel}
            type="button"
            onClick={() => k.ziel && gehe(k.ziel)}
            className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3 text-left transition-colors duration-150 hover:border-line-dark"
          >
            <IconTile name={k.icon} className="size-8" />
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-bold text-ink">{k.titel}</span>
              <span className="block text-[11px] text-muted">{k.unter}</span>
              <span className="mt-1 inline-block">
                <Status ton="warnung">{k.hinweis}</Status>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Rechnungen() {
  const [erinnert, setErinnert] = useState(false);
  return (
    <div className="space-y-3">
      <Kopf titel="Rechnungen" aktion="Rechnung schreiben" />
      {erinnert && <Hinweis>Zahlungserinnerung an Petra Schulz vorbereitet</Hinweis>}
      <Liste>
        {rechnungen.map((r) => (
          <Zeile
            key={r.nr}
            titel={`${r.nr} · ${r.betrag}`}
            unter={r.kunde}
            rechts={<Status ton={r.status[0]}>{r.status[1]}</Status>}
            onClick={r.status[1] === "Überfällig" ? () => setErinnert(true) : undefined}
          />
        ))}
      </Liste>
      {!erinnert && <p className="text-[11px] text-muted">Tipp: Klick auf die überfällige Rechnung.</p>}
    </div>
  );
}

function Auswertung() {
  const phasen: [string, number][] = [
    ["Anfrage", 2],
    ["Angebot", 3],
    ["Beauftragt", 4],
    ["Abrechnung", 2],
  ];
  const max = Math.max(...phasen.map(([, n]) => n));
  return (
    <div className="space-y-3">
      <Kopf titel="Auswertung" />
      <figure className="rounded-xl border border-line bg-white p-3">
        <figcaption className="text-[12px] font-semibold text-ink">Die meisten Aufträge sind beauftragt und warten auf einen Termin.</figcaption>
        <div className="mt-3 space-y-2">
          {phasen.map(([p, n]) => (
            <div key={p} className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-2 text-[11px]">
              <span className="text-muted">{p}</span>
              <span className="h-2 rounded-full bg-sand">
                <span className="block h-2 rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums text-ink">{n}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted">Gezählt aus den aktiven Beispielaufträgen der Spielwiese.</p>
      </figure>
    </div>
  );
}

function Suche({ gehe }: { gehe: (a: Ansicht) => void }) {
  const [text, setText] = useState("");
  const treffer = useMemo(() => {
    const q = text.trim().toLowerCase();
    const alle = [
      ...auftraege.map((a) => ({ titel: a.titel, unter: a.kunde, ziel: "auftraege" as Ansicht })),
      ...rechnungen.map((r) => ({ titel: r.nr, unter: r.kunde, ziel: "rechnungen" as Ansicht })),
      ...angebote.map((a) => ({ titel: a.titel, unter: `Angebot · ${a.kunde}`, ziel: "angebote" as Ansicht })),
    ];
    return q ? alle.filter((t) => `${t.titel} ${t.unter}`.toLowerCase().includes(q)) : alle.slice(0, 4);
  }, [text]);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">In der Vorschau suchen</span>
        <span className="flex items-center gap-2 rounded-lg border border-line-dark bg-white px-3 py-2">
          <Icon name="search" className="size-4 text-muted" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Kunde, Auftrag, Rechnung …"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </span>
      </label>
      <Liste>
        {treffer.length === 0 ? (
          <Zeile titel="Nichts gefunden" unter="Probier „Hoffmann“ oder „Wallbox“." />
        ) : (
          treffer.map((t) => <Zeile key={t.titel} titel={t.titel} unter={t.unter} onClick={() => gehe(t.ziel)} />)
        )}
      </Liste>
    </div>
  );
}

// ---------------------------------------------------------------- Rahmen

export function AppVorschau({ className = "", start = "heute" }: { className?: string; start?: Ansicht }) {
  const [ansicht, setAnsicht] = useState<Ansicht>(start);
  const [heute, setHeute] = useState<HeuteZustand>(startHeute);
  const aktivBereich: Ansicht = ansicht === "angebote" ? "auftraege" : ansicht === "rechnungen" ? "betrieb" : ansicht;

  const navKnopf = (b: { id: Ansicht; label: string; icon: IconName; zahl?: string }, klein = false) => {
    const aktiv = klein ? ansicht === b.id : aktivBereich === b.id;
    return (
      <button
        key={b.id}
        type="button"
        onClick={() => setAnsicht(b.id)}
        aria-current={aktiv ? "page" : undefined}
        className={`flex w-full shrink-0 items-center gap-2 rounded-lg px-2.5 text-left transition-colors duration-150 ${
          klein ? "py-1.5 text-[12px]" : "py-2 text-[13px]"
        } ${aktiv ? "bg-signal-soft font-semibold text-signal-dark" : "font-medium text-ink hover:bg-hover"}`}
      >
        <Icon name={b.icon} className="size-4 shrink-0" />
        <span className="flex-1">{b.label}</span>
        {b.zahl && <span className="rounded bg-signal-dark px-1.5 text-[10px] font-bold text-white">{b.zahl}</span>}
      </button>
    );
  };

  return (
    <section
      aria-label="Klickbare Vorschau von Macher OS mit Beispieldaten"
      className={`vorschau-fenster overflow-hidden border border-line bg-white text-ink ${className}`}
    >
      <div className="grid h-full sm:grid-cols-[11.5rem_1fr]">
        {/* Sidebar wie in der Software */}
        <aside className="flex min-w-0 flex-col gap-2 border-b border-line bg-paper p-2.5 sm:border-r sm:border-b-0">
          <div className="flex items-center gap-2 px-1">
            <Image src="/marke/zeichen.png" alt="" width={24} height={24} className="size-6 shrink-0" />
            <span className="font-display text-[15px] text-ink">
              Macher <b className="font-black">OS</b>
            </span>
            <span className="ml-auto rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 sm:flex">
            <span className="inline-flex size-5 items-center justify-center rounded bg-signal-dark text-[10px] font-bold text-white">M</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[12px] font-bold">Musterbetrieb</span>
              <span className="block truncate text-[10px] text-muted">Spielwiese</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAnsicht("suche")}
            className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-[12px] transition-colors duration-150 ${
              ansicht === "suche" ? "border-primary text-ink" : "border-line-dark text-muted hover:text-ink"
            }`}
          >
            <Icon name="search" className="size-3.5" /> Suchen oder fragen
          </button>
          <nav aria-label="Bereiche der Vorschau" className="grid grid-cols-2 gap-1 sm:mt-1 sm:grid-cols-1">
            {bereiche.map((b) => navKnopf(b))}
          </nav>
          <div className="hidden border-t border-line pt-2 sm:block">
            <p className="px-2.5 pb-1 text-[11px] font-semibold text-muted">Favoriten</p>
            {favoriten.map((f) => navKnopf(f, true))}
          </div>
          <div className="mt-auto hidden items-center gap-2 border-t border-line px-1 pt-2 sm:flex">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">MM</span>
            <span className="text-[12px] font-semibold">Max Macher</span>
          </div>
        </aside>

        {/* Inhalt */}
        <div className="min-h-0 min-w-0 overflow-y-auto bg-white p-3 sm:p-5">
          <div key={ansicht} className="vorschau-ein">
            {ansicht === "heute" && <Heute gehe={setAnsicht} z={heute} setZ={setHeute} />}
            {ansicht === "auftraege" && <Auftraege />}
            {ansicht === "angebote" && <Auftraege start="Angebote" />}
            {ansicht === "planen" && <Planen heute={heute.termine} />}
            {ansicht === "betrieb" && <Betrieb gehe={setAnsicht} />}
            {ansicht === "rechnungen" && <Rechnungen />}
            {ansicht === "auswertung" && <Auswertung />}
            {ansicht === "suche" && <Suche gehe={setAnsicht} />}
          </div>
        </div>
      </div>
    </section>
  );
}
