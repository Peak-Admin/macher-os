"use client";

import { Icon, type IconName } from "@/components/ui";
import { berechneDeckungsbeitrag, euro, prozent, zahl, type Ampel } from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { FeldGruppe, useFelder, ZahlFeld, type FeldDef } from "./felder";

const s = standardwerte.deckungsbeitrag;
const TITEL = "Deckungsbeitrags-Rechner";

const felder = {
  umsatz: { label: "Auftragsumsatz netto", einheit: "€", start: s.umsatz, min: 0, hinweis: "Rechnungsbetrag ohne Mehrwertsteuer." },
  material: { label: "Material (Einkauf)", einheit: "€", start: s.material, min: 0 },
  fremdleistung: { label: "Fremdleistungen", einheit: "€", start: s.fremdleistung, min: 0, hinweis: "Subunternehmer, Gerüst, Entsorgung." },
  lohnstunden: { label: "Lohnstunden für den Auftrag", einheit: "Std.", start: s.lohnstunden, min: 0, max: 100000 },
  lohnkostenJeStunde: {
    label: "Lohnkosten pro Stunde",
    einheit: "€/Std.",
    start: s.lohnkostenJeStunde,
    min: 0,
    max: 1000,
    hinweis: "Lohn + Lohnnebenkosten – nicht der Verrechnungssatz.",
  },
  fixkostenJeStunde: {
    label: "Gemeinkosten pro Stunde",
    einheit: "€/Std.",
    start: s.fixkostenJeStunde,
    min: 0,
    max: 1000,
    hinweis: "Jährliche Gemeinkosten ÷ produktive Stunden.",
  },
} satisfies Record<string, FeldDef>;

const ampelText: Record<Ampel, { titel: string; text: string; icon: IconName; klasse: string }> = {
  gruen: {
    titel: "Der Auftrag deckt seine Kosten.",
    text: "Er bezahlt Material, Lohn und seinen Anteil an den Fixkosten – und bringt Gewinn.",
    icon: "check",
    klasse: "bg-signal text-white",
  },
  gelb: {
    titel: "Der Auftrag deckt seine Kosten nicht ganz.",
    text: "Die direkten Kosten sind bezahlt, aber nicht der volle Anteil an den Fixkosten.",
    icon: "bell",
    klasse: "bg-warning-soft text-warning ring-1 ring-inset ring-warning/30",
  },
  rot: {
    titel: "Der Auftrag deckt seine Kosten nicht.",
    text: "Schon Material, Fremdleistung und Lohn sind teurer als der Umsatz.",
    icon: "x",
    klasse: "bg-danger-soft text-danger ring-1 ring-inset ring-danger/30",
  },
};

const ampelReihenfolge: Ampel[] = ["rot", "gelb", "gruen"];
const ampelLabel: Record<Ampel, string> = { rot: "Rot", gelb: "Gelb", gruen: "Grün" };

export function DeckungsbeitragRechner() {
  const f = useFelder(felder);
  const w = f.werte;
  const r = f.gueltig ? berechneDeckungsbeitrag(w) : null;
  const a = r ? ampelText[r.ampel] : null;

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/deckungsbeitrags-rechner`,
    eingaben: [
      ["Auftragsumsatz netto", euro(w.umsatz)],
      ["Material", euro(w.material)],
      ["Fremdleistungen", euro(w.fremdleistung)],
      ["Lohnstunden", `${zahl(w.lohnstunden, 1)} Std.`],
      ["Lohnkosten pro Stunde", euro(w.lohnkostenJeStunde)],
      ["Gemeinkosten pro Stunde", euro(w.fixkostenJeStunde)],
    ],
    ergebnis: [
      ["Variable Kosten", euro(r?.variableKosten)],
      ["Deckungsbeitrag", `${euro(r?.db)} (${prozent(r?.dbProzent)})`],
      ["Anteilige Fixkosten", euro(r?.fixkosten)],
      ["Ergebnis des Auftrags", euro(r?.ergebnis)],
      ["Mindestpreis netto", euro(r?.mindestpreis)],
      ["Aussage", a?.titel ?? "–"],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={f.zuruecksetzen}
      kurzErgebnis={{ label: "Deckungsbeitrag", wert: euro(r?.db) }}
      eingaben={
        <>
          <FeldGruppe titel="Umsatz" spalten={2}>
            <ZahlFeld {...f.feld("umsatz")} />
          </FeldGruppe>
          <FeldGruppe titel="Direkte Kosten des Auftrags">
            <ZahlFeld {...f.feld("material")} />
            <ZahlFeld {...f.feld("fremdleistung")} />
            <ZahlFeld {...f.feld("lohnstunden")} />
            <ZahlFeld {...f.feld("lohnkostenJeStunde")} />
          </FeldGruppe>
          <FeldGruppe titel="Fixkosten-Anteil" spalten={2}>
            <ZahlFeld {...f.feld("fixkostenJeStunde")} />
          </FeldGruppe>
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel="Deckungsbeitrag"
          hauptWert={euro(r?.db)}
          unterzeile={r ? `${prozent(r.dbProzent)} vom Umsatz · ${euro(r.dbJeStunde)} je Lohnstunde` : null}
          status={
            r && a ? (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2" aria-hidden>
                  {ampelReihenfolge.map((stufe) => (
                    <span
                      key={stufe}
                      data-balken
                      className={`flex min-h-8 items-center rounded-md px-2.5 text-sm font-bold font-tagline uppercase tracking-wider ${
                        stufe === r.ampel
                          ? ampelText[stufe].klasse
                          : "bg-white/5 text-white/35 ring-1 ring-inset ring-white/10"
                      }`}
                    >
                      {ampelLabel[stufe]}
                    </span>
                  ))}
                </div>
                <div className={`flex items-start gap-2.5 rounded-lg p-3 ${a.klasse}`}>
                  <Icon name={a.icon} className="mt-0.5 size-4.5 shrink-0" />
                  <p className="text-sm">
                    <span className="sr-only">Ampel {ampelLabel[r.ampel]}: </span>
                    <span className="block font-bold">{a.titel}</span>
                    {a.text}
                  </p>
                </div>
              </div>
            ) : null
          }
          meldung={f.gueltig ? null : "Bitte prüf die markierten Eingaben."}
          zusammenfassung={zusammenfassung}
          betreff="Deckungsbeitrag meines Auftrags – berechnet mit Macher OS"
          hinweis="Das Ergebnis ist eine Orientierung, keine Steuerberatung."
        >
          <ErgebnisZeile label="Umsatz netto" wert={euro(w.umsatz)} />
          <ErgebnisZeile
            label="− Variable Kosten"
            zusatz={r ? `Material, Fremdleistung, ${euro(r.lohnkosten)} Lohn` : undefined}
            wert={euro(r?.variableKosten)}
          />
          <ErgebnisZeile label="= Deckungsbeitrag" wert={euro(r?.db)} betont />
          <ErgebnisZeile label="− Anteilige Fixkosten" wert={euro(r?.fixkosten)} />
          <ErgebnisZeile
            label="= Ergebnis des Auftrags"
            zusatz={r ? `${prozent(r.ergebnisProzent)} vom Umsatz` : undefined}
            wert={euro(r?.ergebnis)}
            betont
          />
          <ErgebnisZeile label="Mindestpreis netto" zusatz="Ab hier deckt der Auftrag alle Kosten." wert={euro(r?.mindestpreis)} />
        </ErgebnisKarte>
      }
    />
  );
}
