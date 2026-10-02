"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { berechneFahrtkosten, euro, zahl, type FahrtkostenEingabe } from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { FeldGruppe, Schalter, Umschalter, useFelder, ZahlFeld, type FeldDef } from "./felder";

const s = standardwerte.fahrtkosten;
const TITEL = "Fahrtkosten-Rechner";
type Modus = FahrtkostenEingabe["modus"];

const felder = {
  entfernung: { label: "Entfernung zum Kunden (einfach)", einheit: "km", start: s.entfernung, min: 0, max: 5000 },
  kmSatz: {
    label: "Kosten pro Kilometer",
    einheit: "€/km",
    start: s.kmSatz,
    min: 0,
    max: 20,
    hinweis: "Alle Fahrzeugkosten im Jahr ÷ gefahrene Kilometer.",
  },
  verbrauch: { label: "Verbrauch", einheit: "l/100 km", start: s.verbrauch, min: 0, max: 100 },
  spritpreis: { label: "Spritpreis", einheit: "€/l", start: s.spritpreis, min: 0, max: 10 },
  verschleiss: {
    label: "Verschleiß und Wartung",
    einheit: "€/km",
    start: s.verschleiss,
    min: 0,
    max: 20,
    hinweis: "Reifen, Wartung, Wertverlust pro Kilometer.",
  },
  fahrzeit: { label: "Fahrzeit (einfach)", einheit: "Min.", start: s.fahrzeit, min: 0, max: 1440 },
  personen: { label: "Personen im Fahrzeug", einheit: "Pers.", start: s.personen, min: 0, max: 20, ganzzahl: true },
  stundensatz: {
    label: "Stundensatz für Fahrzeit",
    einheit: "€/Std.",
    start: s.stundensatz,
    min: 0,
    max: 1000,
    hinweis: "Je Person. Meist dein Verrechnungssatz.",
  },
  pauschale: { label: "Deine Anfahrtspauschale", einheit: "€", start: s.pauschale, min: 0, max: 100000 },
  einsaetzeProMonat: { label: "Einsätze pro Monat", einheit: "Anzahl", start: s.einsaetzeProMonat, min: 0, max: 10000 },
} satisfies Record<string, FeldDef>;

export function FahrtkostenRechner() {
  const f = useFelder(felder);
  const [modus, setModus] = useState<Modus>(s.modus);
  const [hinUndZurueck, setHinUndZurueck] = useState(s.hinUndZurueck);
  const w = f.werte;

  const benoetigt: (keyof typeof felder)[] = [
    "entfernung",
    "fahrzeit",
    "personen",
    "stundensatz",
    "pauschale",
    "einsaetzeProMonat",
    ...(modus === "kmSatz" ? (["kmSatz"] as const) : (["verbrauch", "spritpreis", "verschleiss"] as const)),
  ];
  const gueltig = benoetigt.every((k) => !Number.isNaN(w[k]));
  const r = gueltig ? berechneFahrtkosten({ ...w, modus, hinUndZurueck }) : null;
  const deckt = r ? r.differenz >= 0 : null;

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/fahrtkosten-rechner`,
    eingaben: [
      ["Entfernung einfach", `${zahl(w.entfernung, 1)} km${hinUndZurueck ? " (hin und zurück gerechnet)" : ""}`],
      ["Kosten pro km", euro(r?.kostenProKm)],
      ["Fahrzeit einfach", `${zahl(w.fahrzeit)} Min.`],
      ["Personen", zahl(w.personen)],
      ["Stundensatz Fahrzeit", euro(w.stundensatz)],
      ["Anfahrtspauschale", euro(w.pauschale)],
      ["Einsätze pro Monat", zahl(w.einsaetzeProMonat)],
    ],
    ergebnis: [
      ["Fahrzeugkosten je Einsatz", euro(r?.fahrzeugkosten)],
      ["Zeitkosten je Einsatz", euro(r?.zeitkosten)],
      ["Tatsächliche Kosten je Einsatz", euro(r?.gesamt)],
      ["Differenz zur Pauschale je Einsatz", euro(r?.differenz)],
      ["Kosten pro Monat", euro(r?.monatGesamt)],
      ["Differenz pro Monat", euro(r?.monatDifferenz)],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={() => {
        f.zuruecksetzen();
        setModus(s.modus);
        setHinUndZurueck(s.hinUndZurueck);
      }}
      kurzErgebnis={{ label: "Kosten je Einsatz", wert: euro(r?.gesamt) }}
      eingaben={
        <>
          <FeldGruppe titel="Strecke">
            <ZahlFeld {...f.feld("entfernung")} />
            <ZahlFeld {...f.feld("fahrzeit")} />
            <div className="sm:col-span-2">
              <Schalter
                label="Hin- und Rückweg rechnen"
                hinweis="Strecke und Fahrzeit werden verdoppelt."
                checked={hinUndZurueck}
                onChange={setHinUndZurueck}
              />
            </div>
          </FeldGruppe>
          <FeldGruppe titel="Fahrzeugkosten">
            <div className="sm:col-span-2">
              <Umschalter<Modus>
                label="Wie willst du die Fahrzeugkosten rechnen?"
                name="modus"
                wert={modus}
                onChange={setModus}
                optionen={[
                  { wert: "kmSatz", label: "Satz pro km" },
                  { wert: "verbrauch", label: "Verbrauch × Spritpreis" },
                ]}
              />
            </div>
            {modus === "kmSatz" ? (
              <ZahlFeld {...f.feld("kmSatz")} />
            ) : (
              <>
                <ZahlFeld {...f.feld("verbrauch")} />
                <ZahlFeld {...f.feld("spritpreis")} />
                <ZahlFeld {...f.feld("verschleiss")} />
              </>
            )}
          </FeldGruppe>
          <FeldGruppe titel="Fahrzeit bewerten">
            <ZahlFeld {...f.feld("personen")} />
            <ZahlFeld {...f.feld("stundensatz")} />
          </FeldGruppe>
          <FeldGruppe titel="Vergleich mit deiner Pauschale">
            <ZahlFeld {...f.feld("pauschale")} />
            <ZahlFeld {...f.feld("einsaetzeProMonat")} />
          </FeldGruppe>
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel="Tatsächliche Kosten je Einsatz"
          hauptWert={euro(r?.gesamt)}
          status={
            r ? (
              <p
                className={`mb-5 flex items-start gap-2.5 rounded-lg p-3 text-sm font-semibold ${
                  deckt ? "bg-moss text-white" : "bg-signal text-white"
                }`}
              >
                <Icon name={deckt ? "check" : "x"} className="mt-0.5 size-4 shrink-0" />
                {deckt
                  ? `Deine Pauschale deckt die Kosten. Plus ${euro(r.differenz)} je Einsatz.`
                  : `Deine Pauschale ist ${euro(-r.differenz)} zu niedrig je Einsatz.`}
              </p>
            ) : null
          }
          unterzeile={r ? `${zahl(r.kilometer, 1)} km und ${zahl(r.stunden * 60)} Min. Fahrzeit` : null}
          meldung={gueltig ? null : "Bitte prüf die markierten Eingaben."}
          zusammenfassung={zusammenfassung}
          betreff="Fahrtkosten – berechnet mit Macher OS"
          hinweis="Das Ergebnis ist eine Orientierung, keine Steuerberatung."
        >
          <ErgebnisZeile
            label="Fahrzeugkosten"
            zusatz={r ? `${zahl(r.kilometer, 1)} km × ${euro(r.kostenProKm)}` : undefined}
            wert={euro(r?.fahrzeugkosten)}
          />
          <ErgebnisZeile
            label="Zeitkosten"
            zusatz={r ? `${zahl(r.stunden, 2)} Std. × ${zahl(w.personen)} Pers. × ${euro(w.stundensatz)}` : undefined}
            wert={euro(r?.zeitkosten)}
          />
          <ErgebnisZeile label="Deine Pauschale" wert={euro(w.pauschale)} />
          <ErgebnisZeile label="Differenz je Einsatz" wert={euro(r?.differenz)} betont />
          <ErgebnisZeile
            label="Kosten pro Monat"
            zusatz={r ? `${zahl(w.einsaetzeProMonat)} Einsätze` : undefined}
            wert={euro(r?.monatGesamt)}
          />
          <ErgebnisZeile label="Einnahmen aus Pauschalen" wert={euro(r?.monatPauschale)} />
          <ErgebnisZeile label="Differenz pro Monat" wert={euro(r?.monatDifferenz)} betont />
        </ErgebnisKarte>
      }
    />
  );
}
