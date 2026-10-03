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

/** Auftragsart → einfaches Strich-Icon (wie `ART_ICON` in der Software) */
type Art = "kundendienst" | "projekt" | "wartung" | "reklamation";
const artIcon: Record<Art, IconName> = { kundendienst: "wrench", projekt: "home", wartung: "clock", reklamation: "achtung" };
const artLabel: Record<Art, string> = { kundendienst: "Kundendienst", projekt: "Projekt", wartung: "Wartung", reklamation: "Reklamation" };

const auftraege: { titel: string; kunde: string; nr: string; art: Art; schritt: string; erledigt: string; status: [Ton, string] }[] = [
  { titel: "Nacharbeit: Abdeckung lose", kunde: "Familie Hoffmann", nr: "2610-010", art: "reklamation", schritt: "Einsatz einplanen", erledigt: "Eingeplant: Mo., 08:00 · Jonas", status: ["gefahr", "Dringend"] },
  { titel: "Störung: Sicherung fliegt raus", kunde: "Petra Schulz", nr: "2610-001", art: "kundendienst", schritt: "Annehmen und einplanen", erledigt: "Angenommen und für heute 14:00 eingeplant", status: ["gefahr", "Dringend"] },
  { titel: "Wartung: Unterverteilung", kunde: "Hausverwaltung Nord GmbH", nr: "2610-012", art: "wartung", schritt: "Einsatz einplanen", erledigt: "Eingeplant: Do., 07:00 · Mehmet", status: ["neutral", "Beauftragt"] },
  { titel: "Sanierung Wohnanlage, Haus 24", kunde: "Hausverwaltung Nord GmbH", nr: "2610-004", art: "projekt", schritt: "Rechnung fertigstellen", erledigt: "Rechnung vorbereitet – du prüfst und schickst ab", status: ["neutral", "Abrechnung"] },
];

/** Auftragsart als einfaches Strich-Icon auf ruhiger Kachel */
function TypIcon({ art }: { art: Art }) {
  return (
    <span title={artLabel[art]} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-app-ruhig text-signal-dark ring-1 ring-inset ring-app-linie">
      <Icon name={artIcon[art]} className="size-4" />
      <span className="sr-only">{artLabel[art]}: </span>
    </span>
  );
}

/** Kundenbild wie in der Software: Logo der Website oder Initialen in ruhiger Kennfarbe */
const kundenFarben = ["bg-ink", "bg-moss", "bg-sky", "bg-primary-hover", "bg-signal-dark"];
function KundenBild({ name }: { name: string }) {
  const worte = name.split(/\s+/).filter((w) => !/^(familie|gmbh|ug|ag|kg)$/i.test(w));
  const kuerzel = (worte.length > 1 ? worte[0][0] + worte[worte.length - 1][0] : (worte[0]?.[0] ?? "?")).toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span aria-hidden className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${kundenFarben[h % kundenFarben.length]}`}>
      {kuerzel}
    </span>
  );
}

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
  return <div className="app-lift divide-y divide-app-linie overflow-hidden rounded-xl border border-app-linie bg-white">{children}</div>;
}

/** Profilbild aus dem Beispielteam der Spielwiese (public/bilder/os/team) */
function Gesicht({ datei, name }: { datei: string; name: string }) {
  return <Image src={`/bilder/os/team/${datei}.webp`} alt={name} width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />;
}

function Zeile({ titel, unter, links, rechts, onClick }: { titel: string; unter: string; links?: ReactNode; rechts?: ReactNode; onClick?: () => void }) {
  const inhalt = (
    <>
      {links}
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
      <div className="vorschau-ein app-lift flex items-center gap-3 rounded-2xl border border-app-linie bg-white p-4">
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
    <div
      key={z.schritt}
      className="vorschau-ein relative overflow-hidden rounded-2xl bg-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_20px_40px_-22px_rgb(16_44_33/0.6)]"
      style={{ backgroundImage: "radial-gradient(70% 90% at 100% 0%, rgb(105 175 68 / 0.28), transparent 65%), linear-gradient(155deg, var(--color-primary), var(--color-primary-hover) 60%, var(--color-ink))" }}
    >
      <div className="relative flex gap-3 p-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-signal-dark shadow-[0_8px_20px_-10px_rgb(0_0_0/0.45)]">
          <Icon name={e.icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-on-dark">{e.ueberzeile}</p>
          <p className="mt-0.5 font-display text-[17px] font-bold leading-snug">{e.titel}</p>
          <p className="text-[12px] text-on-dark">{e.unter}</p>
          {z.offen === "auswahl" ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.optionen.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => waehlen(o)}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-left text-ink shadow-[0_8px_18px_-12px_rgb(0_0_0/0.5)] transition-colors duration-150 hover:bg-signal-soft"
                >
                  <span className="block text-[12px] font-semibold">{o.label}</span>
                  <span className="block text-[10px] text-muted">{o.unter}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, offen: null }))}
                className="px-2 text-[12px] font-semibold text-on-dark hover:text-white"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, offen: "auswahl" }))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-signal-dark shadow-[0_8px_20px_-10px_rgb(0_0_0/0.5)] transition-colors duration-150 hover:bg-signal-soft"
              >
                <Icon name="arrow-right" className="size-4" /> {e.aktion}
              </button>
              <button
                type="button"
                onClick={() => setZ((alt) => ({ ...alt, aufgeklappt: e.icon === "route" ? "neubau" : "haus24" }))}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/50 hover:bg-white/10"
              >
                Details
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
            <span className="absolute -right-1 -top-1 rounded bg-primary px-1.5 text-[10px] font-bold text-white">
              <span className="sr-only">Offene Entscheidungen: </span>
              {offen}
            </span>
          )}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[14px] font-semibold text-ink">Dein nächster Schritt</p>
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
        <div className="app-lift divide-y divide-app-linie overflow-hidden rounded-2xl border border-app-linie bg-white">
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
  const [offen, setOffen] = useState<string | null>(null);
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  const [aufgaben, setAufgaben] = useState<Record<string, boolean>>({});
  const [angenommen, setAngenommen] = useState<Record<string, boolean>>({});
  const kunden = ["Hausverwaltung Nord GmbH", "Familie Hoffmann", "Thomas Richter", "Petra Schulz"];
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
              auftraege.map((a) => {
                const auf = offen === a.nr;
                const fertig = erledigt[a.nr];
                return (
                  <div key={a.nr}>
                    <Zeile
                      titel={a.titel}
                      unter={`#${a.nr} · ${a.kunde}`}
                      links={<TypIcon art={a.art} />}
                      rechts={fertig ? <Status ton="erfolg">Erledigt</Status> : <Status ton={a.status[0]}>{a.status[1]}</Status>}
                      onClick={() => setOffen(auf ? null : a.nr)}
                    />
                    {auf && (
                      <div className="vorschau-ein flex flex-wrap items-center gap-2 bg-app-canvas px-3 pb-3 pt-1 text-[12px] sm:pl-14">
                        {fertig ? (
                          <Hinweis>{a.erledigt}</Hinweis>
                        ) : (
                          <>
                            <span className="text-muted">Nächster Schritt:</span>
                            <button
                              type="button"
                              onClick={() => setErledigt((e) => ({ ...e, [a.nr]: true }))}
                              className="rounded-lg bg-primary px-2.5 py-1.5 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
                            >
                              {a.schritt}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            {sicht === "Angebote" &&
              angebote.map((a) => <Zeile key={a.titel} titel={a.titel} unter={a.kunde} links={<KundenBild name={a.kunde} />} rechts={<Status ton={a.status[0]}>{a.status[1]}</Status>} />)}
            {sicht === "Aufgaben" &&
              ["Material für Haus 24 bestellen", "Rückruf Familie Petersen", "Fotos Wartung hochladen"].map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-hover">
                  <input type="checkbox" checked={!!aufgaben[t]} onChange={(e) => setAufgaben((x) => ({ ...x, [t]: e.target.checked }))} className="size-4 accent-primary" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[13px] font-semibold ${aufgaben[t] ? "text-muted line-through" : "text-ink"}`}>{t}</span>
                    <span className="block text-[11px] text-muted">Max Macher · diese Woche</span>
                  </span>
                </label>
              ))}
          </Liste>
          {sicht === "Aufträge" && !offen && <p className="text-[11px] text-muted">Tipp: Klick auf einen Auftrag.</p>}
        </>
      )}
      {reiter === "Eingang" && (
        <>
          <Kopf titel="Eingang" />
          <Liste>
            {[
              { id: "keller", titel: "Anfrage: Steckdosen im Keller", unter: "Anruf · Petra Schulz · heute, 08:12" },
              { id: "wallbox", titel: "Anfrage: Wallbox nachrüsten", unter: "Formular · Familie Petersen · gestern" },
            ].map((e) => (
              <Zeile
                key={e.id}
                titel={e.titel}
                unter={angenommen[e.id] ? "Auftrag angelegt · Vorschlag: Di., 10:00 Uhr" : e.unter}
                rechts={
                  angenommen[e.id] ? (
                    <Status ton="erfolg">Angenommen</Status>
                  ) : (
                    <span className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white">Annehmen</span>
                  )
                }
                onClick={() => setAngenommen((x) => ({ ...x, [e.id]: true }))}
              />
            ))}
          </Liste>
        </>
      )}
      {reiter === "Kunden" && (
        <>
          <Kopf titel="Kunden" aktion="Kunde anlegen" />
          <Liste>
            {kunden.map((k) => {
              const n = auftraege.filter((a) => a.kunde === k).length;
              return (
                <Zeile
                  key={k}
                  titel={k}
                  unter="Kassel"
                  links={<KundenBild name={k} />}
                  rechts={n ? <Status ton="neutral">{n === 1 ? "1 offener Auftrag" : `${n} offene Aufträge`}</Status> : undefined}
                />
              );
            })}
          </Liste>
        </>
      )}
      {reiter === "Service" && (
        <>
          <Kopf titel="Wartung & Service" />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-warning/30 bg-warning-soft p-3">
              <p className="text-[11px] font-semibold text-warning">Überfällig</p>
              <p className="font-display text-2xl font-bold text-warning">1</p>
            </div>
            <div className="app-lift rounded-xl border border-app-linie bg-white p-3">
              <p className="text-[11px] font-semibold text-ink">Diesen Monat</p>
              <p className="font-display text-2xl font-bold text-ink">1</p>
            </div>
          </div>
          <Liste>
            <Zeile titel="Unterverteilung · Hausverwaltung Nord GmbH" unter="überfällig seit 17.09. · jährlich" links={<TypIcon art="wartung" />} rechts={<Status ton="warnung">Überfällig</Status>} />
            <Zeile titel="Wallbox · Thomas Richter" unter="fällig im Oktober · jährlich" links={<TypIcon art="wartung" />} />
          </Liste>
        </>
      )}
    </div>
  );
}

const planReiter = ["Kalender", "Einplanen", "Kapazität"] as const;

const personen = ["Alle", "Jonas", "Lukas", "Max"] as const;

function Planen({ heute }: { heute: Termin[] }) {
  const [reiter, setReiter] = useState<(typeof planReiter)[number]>("Kalender");
  const [uebernommen, setUebernommen] = useState(false);
  const [woche2, setWoche2] = useState(0);
  const [person, setPerson] = useState<(typeof personen)[number]>("Alle");
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [darstellung, setDarstellung] = useState<"Woche" | "Liste">("Woche");
  const passt = (unter?: string) => person === "Alle" || !!unter?.includes(person);
  const tage = woche.map((t, i) => {
    const termine = woche2 !== 0 ? [] : t.tag.startsWith("Fr") ? [...heute].sort((a, b) => a.zeit.localeCompare(b.zeit)) : t.termine.map((e) => ({ ...e, id: e.zeit + e.titel, unter: "Hausverwaltung Nord GmbH · Jonas, Lukas" }));
    return { ...t, nr: 28 + i + woche2 * 7, termine: (termine as { id?: string; zeit: string; titel: string; unter?: string; ton?: Ton; label?: string }[]).filter((e) => passt(e.unter)) };
  });
  const tagNr = (n: number) => (n > 30 ? n - 30 : n);
  const auswahl = tage.flatMap((t) => t.termine).find((e) => (e.id ?? e.zeit + e.titel) === gewaehlt);
  return (
    <div className="space-y-3">
      <Reiter werte={planReiter} aktiv={reiter} setzen={setReiter} />
      {reiter === "Kalender" && (
        <>
          <Kopf titel="Kalender" aktion="Termin planen" onAktion={() => setReiter("Einplanen")} />
          {/* Wie in der Software: links Datum und Blättern, rechts Ansicht und Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Vorige Woche" onClick={() => setWoche2((w) => w - 1)} className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-hover">
                <Icon name="chevron-left" className="size-4" />
              </button>
              <button type="button" onClick={() => setWoche2(0)} className="rounded-lg border border-line-dark bg-white px-2 py-1 text-[11px] font-semibold text-signal-dark">
                Heute
              </button>
              <button type="button" aria-label="Nächste Woche" onClick={() => setWoche2((w) => w + 1)} className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-hover">
                <Icon name="chevron-right" className="size-4" />
              </button>
              <span className="ml-1 font-display text-[15px] font-bold tabular-nums text-ink">KW {40 + woche2}</span>
            </div>
            <div className="flex items-center gap-2">
              <Umschalter werte={["Woche", "Liste"] as const} aktiv={darstellung} setzen={setDarstellung} />
              <button
                type="button"
                onClick={() => setPerson((p) => personen[(personen.indexOf(p) + 1) % personen.length])}
                className="inline-flex items-center gap-1 rounded-lg border border-line-dark bg-white px-2 py-1 text-[11px] font-semibold text-ink"
              >
                {person === "Alle" ? "Alle Mitarbeiter" : person} <Icon name="chevron-down" className="size-3.5" />
              </button>
            </div>
          </div>
          {darstellung === "Liste" && (
            <Liste>
              {tage.flatMap((t) => t.termine.map((e) => ({ ...e, tag: t.tag }))).length === 0 ? (
                <Zeile titel="Nichts geplant" unter="In dieser Woche ist noch nichts geplant." />
              ) : (
                tage.flatMap((t) =>
                  t.termine.map((e) => (
                    <Zeile
                      key={t.tag + e.zeit + e.titel}
                      titel={`${t.tag.slice(0, 2)}, ${e.zeit} · ${e.titel}`}
                      unter={e.unter ?? ""}
                      rechts={e.ton && e.label ? <Status ton={e.ton}>{e.label}</Status> : undefined}
                    />
                  )),
                )
              )}
            </Liste>
          )}
          <div className={`grid grid-cols-5 gap-1.5 ${darstellung === "Liste" ? "hidden" : ""}`}>
            {tage.map((t) => {
              const heuteTag = woche2 === 0 && t.tag.startsWith("Fr");
              return (
                <div
                  key={t.tag}
                  className={`min-h-40 rounded-lg border p-1.5 ${heuteTag ? "border-primary bg-[linear-gradient(180deg,var(--color-signal-soft),white_4rem)]" : "app-lift border-app-linie bg-white"}`}
                >
                  <p className="flex items-center gap-1 border-b border-app-linie pb-1 text-[10px] font-semibold text-muted">
                    {t.tag.slice(0, 2)}
                    <span className={`inline-flex size-6 items-center justify-center rounded-full font-display text-[13px] font-bold tabular-nums ${heuteTag ? "bg-primary text-white" : "text-ink"}`}>
                      {tagNr(t.nr)}
                    </span>
                  </p>
                  {t.termine.length === 0 && <p className="mt-1 text-[11px] text-muted">Frei</p>}
                  <div className="mt-1 space-y-1">
                    {t.termine.map((e) => {
                      const id = e.id ?? e.zeit + e.titel;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setGewaehlt(gewaehlt === id ? null : id)}
                          aria-pressed={gewaehlt === id}
                          className={`block w-full rounded-md border p-1 text-left transition-colors duration-150 ${
                            e.ton === "warnung" ? "border-danger/50 bg-danger-soft/40" : "border-primary/20 bg-signal-soft/50 hover:bg-signal-soft"
                          } ${gewaehlt === id ? "ring-2 ring-primary" : ""}`}
                        >
                          <span className="flex items-center gap-1 text-[10px] text-muted">
                            <span className="size-1.5 rounded-full bg-primary" />
                            {e.zeit}
                          </span>
                          <span className="block truncate text-[11px] font-semibold text-ink">{e.titel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {woche2 !== 0 && darstellung === "Woche" && <p className="text-[11px] text-muted">In dieser Woche ist noch nichts geplant.</p>}
          {auswahl && (
            <div className="vorschau-ein app-lift flex items-center gap-3 rounded-xl border border-app-linie bg-white p-3 text-[12px]">
              <span className="font-display text-[15px] font-bold tabular-nums">{auswahl.zeit}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{auswahl.titel}</span>
                <span className="block truncate text-muted">{auswahl.unter}</span>
              </span>
              {auswahl.ton && auswahl.label && <Status ton={auswahl.ton}>{auswahl.label}</Status>}
            </div>
          )}
        </>
      )}
      {reiter === "Einplanen" && (
        <>
          <Kopf titel="Einplanen" />
          {uebernommen ? (
            <Hinweis>Vorschlag übernommen: Tom, Fr. 08:00 Uhr</Hinweis>
          ) : (
            <div className="app-lift rounded-xl border border-app-linie bg-white p-3">
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
            <Zeile titel="Nacharbeit: Abdeckung lose" unter="Familie Hoffmann · noch kein Termin" links={<TypIcon art="reklamation" />} rechts={<Status ton="gefahr">Dringend</Status>} />
            <Zeile titel="Wartung: Unterverteilung" unter="Hausverwaltung Nord GmbH · noch kein Termin" links={<TypIcon art="wartung" />} />
          </Liste>
        </>
      )}
      {reiter === "Kapazität" && (
        <>
          <Kopf titel={`Kapazität · KW ${40 + woche2}`} />
          <Liste>
            {[
              ["Jonas Becker", "Geselle", "3 Einsätze", "jonas-becker"],
              ["Lukas Wagner", "Azubi", "1 Einsatz", "lukas-wagner"],
              ["Max Macher", "Meister", "1 Besichtigung", "max-macher"],
              ["Mehmet Yılmaz", "Geselle", "Urlaub bis Do.", "mehmet-yilmaz"],
            ].map(([n, r, w, d]) => (
              <Zeile key={n} titel={n} unter={r} links={<Gesicht datei={d} name={n} />} rechts={<span className="text-[12px] font-semibold text-muted">{w}</span>} />
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
            className="app-lift flex items-start gap-2.5 rounded-xl border border-app-linie bg-white p-3 text-left transition-colors duration-150 hover:border-primary"
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
      <figure className="app-lift rounded-xl border border-app-linie bg-white p-3">
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

const vorschlaege = ["Welche Rechnungen sind offen?", "Was ist heute dringend?", "Wer hat heute Termine?"];

/** Regelbasierte Antwort aus den Beispieldaten – wie Macher: erst Regeln, nichts erfunden */
function macherAntwort(frage: string, heute: Termin[]): { text: string; ziel?: Ansicht } {
  const q = frage.toLowerCase();
  if (/rechnung|offen|geld|zahl/.test(q)) {
    const offen = rechnungen.filter((r) => r.status[1] !== "Bezahlt");
    return { text: `${offen.length} Rechnungen sind offen: ${offen.map((r) => `${r.nr} (${r.kunde}, ${r.betrag}${r.status[1] === "Überfällig" ? ", überfällig" : ""})`).join(" und ")}.`, ziel: "rechnungen" };
  }
  if (/dringend|wichtig|zuerst/.test(q)) {
    const d = auftraege.filter((a) => a.status[1] === "Dringend");
    return { text: `${d.length} Aufträge sind dringend: ${d.map((a) => `${a.titel} (${a.kunde})`).join(" und ")}.`, ziel: "auftraege" };
  }
  if (/termin|heute|wer|plan/.test(q)) {
    const t = [...heute].sort((a, b) => a.zeit.localeCompare(b.zeit));
    return { text: `Heute stehen ${t.length} Termine an: ${t.map((x) => `${x.zeit} ${x.titel}`).join(", ")}.`, ziel: "planen" };
  }
  return { text: "In dieser Vorschau kenne ich nur die Beispieldaten. Frag zum Beispiel: „Welche Rechnungen sind offen?“" };
}

function Suche({ gehe, heute }: { gehe: (a: Ansicht) => void; heute: Termin[] }) {
  const [text, setText] = useState("");
  const [antwort, setAntwort] = useState<{ frage: string; text: string; ziel?: Ansicht } | null>(null);
  const treffer = useMemo(() => {
    const q = text.trim().toLowerCase();
    const alle = [
      ...auftraege.map((a) => ({ titel: a.titel, unter: a.kunde, ziel: "auftraege" as Ansicht })),
      ...rechnungen.map((r) => ({ titel: r.nr, unter: r.kunde, ziel: "rechnungen" as Ansicht })),
      ...angebote.map((a) => ({ titel: a.titel, unter: `Angebot · ${a.kunde}`, ziel: "angebote" as Ansicht })),
    ];
    return q ? alle.filter((t) => `${t.titel} ${t.unter}`.toLowerCase().includes(q)) : [];
  }, [text]);
  const fragen = (f: string) => {
    setText(f);
    setAntwort({ frage: f, ...macherAntwort(f, heute) });
  };
  return (
    <div className="space-y-3">
      <p className="font-display text-lg font-bold text-ink">Suchen oder fragen</p>
      {/* KI-Leiste wie in der Software: Verlaufsrand, KI-Kugel */}
      <form
        className="ki-leiste"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) fragen(text.trim());
        }}
      >
        <label className="flex items-center gap-2.5 rounded-[10px] bg-white px-3 py-2.5">
          <span className="ki-kugel size-5" aria-hidden />
          <span className="sr-only">Macher fragen oder suchen</span>
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setAntwort(null);
            }}
            placeholder="Frag Macher oder such etwas …"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          />
        </label>
      </form>
      {!text.trim() && (
        <div className="flex flex-wrap gap-1.5">
          {vorschlaege.map((v) => (
            <button key={v} type="button" onClick={() => fragen(v)} className="rounded-lg border border-line-dark bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors duration-150 hover:bg-signal-soft">
              {v}
            </button>
          ))}
        </div>
      )}
      {antwort && (
        <div className="vorschau-ein app-lift rounded-xl border border-app-linie bg-white p-3">
          <p className="flex items-center gap-2 text-[11px] font-semibold text-muted">
            <span className="ki-kugel size-4" aria-hidden /> Macher · aus deinen Beispieldaten
          </p>
          <p role="status" className="mt-1.5 text-[13px] leading-relaxed text-ink">{antwort.text}</p>
          {antwort.ziel && (
            <button type="button" onClick={() => gehe(antwort.ziel!)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-signal-dark hover:underline">
              Ansehen <Icon name="arrow-right" className="size-3.5" />
            </button>
          )}
        </div>
      )}
      {text.trim() && !antwort && (
        <Liste>
          <Zeile titel={`Macher fragen: „${text.trim()}“`} unter="Antwort aus deinen Daten" links={<span className="ki-kugel size-6" aria-hidden />} onClick={() => fragen(text.trim())} />
          {treffer.map((t) => (
            <Zeile key={t.titel} titel={t.titel} unter={t.unter} onClick={() => gehe(t.ziel)} />
          ))}
        </Liste>
      )}
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
      className={`vorschau-fenster overflow-hidden border border-line bg-app-canvas text-ink ${className}`}
    >
      <div className="grid h-full gap-0 sm:grid-cols-[12.5rem_1fr] sm:gap-2 sm:p-2">
        {/* Seitenleiste wie in der Software: schwebend, runde Ecken, aufgelegt */}
        <aside className="flex min-w-0 flex-col gap-2 border-b border-app-linie bg-white p-2.5 sm:app-lift sm:rounded-2xl sm:border sm:border-app-linie">
          <div className="flex items-center gap-2 px-1">
            <Image src="/marke/zeichen.png" alt="" width={24} height={24} className="size-6 shrink-0" />
            <span className="font-display text-[15px] text-ink">
              Macher <b className="font-black">OS</b>
            </span>
            <span className="ml-auto rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
          </div>
          <div className="app-lift hidden items-center gap-2 rounded-lg border border-app-linie bg-white px-2 py-1.5 sm:flex">
            <span className="inline-flex size-5 items-center justify-center rounded bg-signal-dark text-[10px] font-bold text-white">M</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[12px] font-bold">Musterbetrieb</span>
              <span className="block truncate text-[10px] text-muted">Spielwiese</span>
            </span>
          </div>
          {/* Eine Fläche: Lupe, „Suchen“, Kürzel – die KI-Kugel erst in der KI-Leiste */}
          <button
            type="button"
            onClick={() => setAnsicht("suche")}
            className={`app-lift flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-[12px] transition-colors duration-150 ${
              ansicht === "suche" ? "border-primary text-ink" : "border-app-linie text-ink hover:border-primary"
            }`}
          >
            <Icon name="search" className="size-3.5" />
            <span className="flex-1 text-left">Suchen</span>
            <kbd className="rounded border border-app-linie bg-app-ruhig px-1 font-sans text-[10px] font-semibold text-muted">⌘K</kbd>
          </button>
          <nav aria-label="Bereiche der Vorschau" className="grid grid-cols-2 gap-1 sm:mt-1 sm:grid-cols-1">
            {bereiche.map((b) => navKnopf(b))}
          </nav>
          <div className="hidden border-t border-app-linie pt-2 sm:block">
            <p className="px-2.5 pb-1 text-[11px] font-semibold text-muted">Favoriten</p>
            {favoriten.map((f) => navKnopf(f, true))}
          </div>
          <div className="mt-auto hidden items-center gap-2 border-t border-app-linie px-1 pt-2 sm:flex">
            <Image src="/bilder/os/team/max-macher.webp" alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
            <span className="text-[12px] font-semibold">Max Macher</span>
          </div>
        </aside>

        {/* Inhalt auf dem beigen Canvas */}
        <div className="min-h-0 min-w-0 overflow-y-auto p-3 sm:p-4">
          <div key={ansicht} className="vorschau-ein">
            {ansicht === "heute" && <Heute gehe={setAnsicht} z={heute} setZ={setHeute} />}
            {ansicht === "auftraege" && <Auftraege />}
            {ansicht === "angebote" && <Auftraege start="Angebote" />}
            {ansicht === "planen" && <Planen heute={heute.termine} />}
            {ansicht === "betrieb" && <Betrieb gehe={setAnsicht} />}
            {ansicht === "rechnungen" && <Rechnungen />}
            {ansicht === "auswertung" && <Auswertung />}
            {ansicht === "suche" && <Suche gehe={setAnsicht} heute={heute.termine} />}
          </div>
        </div>
      </div>
    </section>
  );
}
