"use client";

import { useMemo, useState, type ReactNode } from "react";
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

function Heute({ gehe }: { gehe: (a: Ansicht) => void }) {
  const [eingeplant, setEingeplant] = useState(false);
  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg font-bold text-ink">Servus, Max</p>
        <p className="text-[12px] text-muted">Hier ist das Wichtigste für dich. · Freitag, 2. Oktober</p>
      </div>
      <div className="space-y-1.5">
        <p className="text-[13px] font-semibold text-ink">Braucht deine Entscheidung</p>
        {eingeplant ? (
          <Hinweis>Eingeplant: Jonas Becker, Mo., 12:00–13:30 Uhr</Hinweis>
        ) : (
          <div className="rounded-xl border border-line bg-white p-3 shadow-[inset_4px_0_0_var(--color-warning)]">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">Dringend einplanen: Sicherung fliegt raus</span>
                <span className="block text-[11px] text-muted">Vorschlag: Jonas Becker, Mo., 12:00–13:30 Uhr</span>
              </span>
              <Status ton="warnung">Problem</Status>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEingeplant(true)}
                className="rounded-md border border-line-dark bg-white px-2 py-1 text-[12px] font-semibold text-signal-dark transition-colors duration-150 hover:bg-signal-soft"
              >
                So einplanen
              </button>
              <button type="button" onClick={() => gehe("auftraege")} className="text-[12px] font-semibold text-signal-dark hover:underline">
                Öffnen
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <p className="text-[13px] font-semibold text-ink">Heute im Betrieb</p>
        <Liste>
          {woche[4].termine.map((t) => (
            <Zeile
              key={t.zeit}
              titel={`${t.zeit} · ${t.titel}`}
              unter={t.zeit === "07:00" ? "Hausverwaltung Nord GmbH · Jonas, Lukas" : t.zeit === "13:00" ? "Familie Hoffmann · Jonas" : "Thomas Richter · Max"}
              rechts={t.ton && <Status ton={t.ton}>{t.label}</Status>}
              onClick={() => gehe("planen")}
            />
          ))}
        </Liste>
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

function Planen() {
  const [reiter, setReiter] = useState<(typeof planReiter)[number]>("Kalender");
  const [uebernommen, setUebernommen] = useState(false);
  return (
    <div className="space-y-3">
      <Reiter werte={planReiter} aktiv={reiter} setzen={setReiter} />
      {reiter === "Kalender" && (
        <>
          <Kopf titel="Kalender" aktion="Termin planen" onAktion={() => setReiter("Einplanen")} />
          <div className="grid grid-cols-5 gap-1.5">
            {woche.map((t) => (
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
      className={`overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[0_30px_60px_-30px_rgb(16_44_33/0.55)] ${className}`}
    >
      <div className="grid h-full sm:grid-cols-[11.5rem_1fr]">
        {/* Sidebar wie in der Software */}
        <aside className="flex min-w-0 flex-col gap-2 border-b border-line bg-white p-2.5 sm:border-r sm:border-b-0">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary font-display text-[13px] font-black text-white">M</span>
            <span className="font-display text-[15px] text-ink">
              Macher <b className="font-black">OS</b>
            </span>
            <span className="ml-auto rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-line px-2 py-1.5 sm:flex">
            <span className="inline-flex size-5 items-center justify-center rounded bg-signal-dark text-[10px] font-bold text-white">M</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[12px] font-bold">Musterbetrieb</span>
              <span className="block truncate text-[10px] text-muted">Spielwiese</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAnsicht("suche")}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors duration-150 ${
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
        <div className="min-w-0 overflow-hidden bg-paper p-3 sm:p-4">
          <div key={ansicht} className="vorschau-ein">
            {ansicht === "heute" && <Heute gehe={setAnsicht} />}
            {ansicht === "auftraege" && <Auftraege />}
            {ansicht === "angebote" && <Auftraege start="Angebote" />}
            {ansicht === "planen" && <Planen />}
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
