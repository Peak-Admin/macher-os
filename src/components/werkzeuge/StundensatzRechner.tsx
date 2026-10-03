"use client";

import { useState } from "react";
import { berechneStundensatz, euro, prozent, zahl, MWST_REGEL } from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { FeldGruppe, Schalter, useFelder, ZahlFeld, type FeldDef } from "./felder";

const s = standardwerte.stundensatz;
const TITEL = "Stundensatz-Rechner";

const felder = {
  produktiveMitarbeiter: {
    label: "Produktive Mitarbeiter",
    einheit: "Pers.",
    start: s.produktiveMitarbeiter,
    min: 0,
    max: 500,
    groesserAlsMin: true,
    hinweis: "Alle, die beim Kunden Stunden abrechnen – auch du, wenn du mitarbeitest.",
  },
  lohnkosten: {
    label: "Lohnkosten inkl. Nebenkosten",
    einheit: "€/Jahr",
    start: s.lohnkosten,
    min: 0,
    hinweis: "Bruttolöhne plus Arbeitgeberanteile, Urlaubs- und Weihnachtsgeld.",
  },
  unternehmerlohn: {
    label: "Unternehmerlohn (dein Gehalt)",
    einheit: "€/Jahr",
    start: s.unternehmerlohn,
    min: 0,
  },
  miete: { label: "Miete, Halle, Nebenkosten", einheit: "€/Jahr", start: s.miete, min: 0 },
  fahrzeuge: { label: "Fahrzeuge", einheit: "€/Jahr", start: s.fahrzeuge, min: 0, hinweis: "Leasing, Sprit, Steuer, Wartung." },
  versicherungen: { label: "Versicherungen", einheit: "€/Jahr", start: s.versicherungen, min: 0 },
  software: { label: "Software, Telefon, Büro", einheit: "€/Jahr", start: s.software, min: 0 },
  sonstigeKosten: {
    label: "Sonstige Kosten",
    einheit: "€/Jahr",
    start: s.sonstigeKosten,
    min: 0,
    hinweis: "Werkzeug, Steuerbüro, Werbung, Zinsen.",
  },
  arbeitstage: { label: "Arbeitstage Mo–Fr", einheit: "Tage", start: s.arbeitstage, min: 1, max: 366 },
  feiertage: { label: "Feiertage", einheit: "Tage", start: s.feiertage, min: 0, max: 366 },
  urlaub: { label: "Urlaub", einheit: "Tage", start: s.urlaub, min: 0, max: 366 },
  krankheit: { label: "Krankheit", einheit: "Tage", start: s.krankheit, min: 0, max: 366 },
  weiterbildung: { label: "Weiterbildung", einheit: "Tage", start: s.weiterbildung, min: 0, max: 366 },
  stundenProTag: { label: "Arbeitszeit pro Tag", einheit: "Std.", start: s.stundenProTag, min: 0, max: 24, groesserAlsMin: true },
  produktivAnteil: {
    label: "Davon abrechenbar",
    einheit: "%",
    start: s.produktivAnteil,
    min: 0,
    max: 100,
    groesserAlsMin: true,
    hinweis: "Ohne Fahrten, Material holen, Büro, Rüstzeit.",
  },
  gewinn: { label: "Gewinnaufschlag", einheit: "%", start: s.gewinn, min: 0, max: 200 },
} satisfies Record<string, FeldDef>;

export function StundensatzRechner() {
  const f = useFelder(felder);
  const [brutto, setBrutto] = useState(true);
  const w = f.werte;
  const r = f.gueltig ? berechneStundensatz({ ...w, mwst: MWST_REGEL }) : null;

  const hinweis = !f.gueltig
    ? "Bitte prüf die markierten Eingaben."
    : r === null
      ? "Mit diesen Angaben bleiben keine produktiven Stunden übrig. Prüf Arbeitstage und Ausfallzeiten."
      : null;

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/stundensatz-rechner`,
    eingaben: [
      ["Produktive Mitarbeiter", zahl(w.produktiveMitarbeiter)],
      ["Lohnkosten inkl. Nebenkosten", euro(w.lohnkosten)],
      ["Unternehmerlohn", euro(w.unternehmerlohn)],
      ["Gemeinkosten", euro(r?.gemeinkosten)],
      ["Anwesenheitstage je Mitarbeiter", zahl(r?.anwesenheitstage)],
      ["Abrechenbarer Anteil", prozent(w.produktivAnteil, 0)],
      ["Gewinnaufschlag", prozent(w.gewinn)],
    ],
    ergebnis: [
      ["Jahreskosten", euro(r?.jahreskosten)],
      ["Produktive Stunden im Jahr", `${zahl(r?.produktiveStunden)} h`],
      ["Kosten pro Stunde", euro(r?.kostensatz)],
      ["Stundensatz netto", euro(r?.netto)],
      ["Stundensatz brutto (19 % MwSt.)", euro(r?.brutto)],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={() => {
        f.zuruecksetzen();
        setBrutto(true);
      }}
      kurzErgebnis={{ label: "Stundensatz netto", wert: euro(r?.netto) }}
      eingaben={
        <>
          <FeldGruppe titel="Dein Team" spalten={1}>
            <ZahlFeld {...f.feld("produktiveMitarbeiter")} />
          </FeldGruppe>
          <FeldGruppe titel="Kosten pro Jahr" beschreibung="Am besten aus deiner letzten BWA oder Jahresabrechnung.">
            <ZahlFeld {...f.feld("lohnkosten")} />
            <ZahlFeld {...f.feld("unternehmerlohn")} />
            <ZahlFeld {...f.feld("miete")} />
            <ZahlFeld {...f.feld("fahrzeuge")} />
            <ZahlFeld {...f.feld("versicherungen")} />
            <ZahlFeld {...f.feld("software")} />
            <ZahlFeld {...f.feld("sonstigeKosten")} />
          </FeldGruppe>
          <FeldGruppe titel="Arbeitszeit je Mitarbeiter" spalten={3}>
            <ZahlFeld {...f.feld("arbeitstage")} />
            <ZahlFeld {...f.feld("feiertage")} />
            <ZahlFeld {...f.feld("urlaub")} />
            <ZahlFeld {...f.feld("krankheit")} />
            <ZahlFeld {...f.feld("weiterbildung")} />
            <ZahlFeld {...f.feld("stundenProTag")} />
          </FeldGruppe>
          <FeldGruppe titel="Abrechenbare Zeit und Gewinn">
            <ZahlFeld {...f.feld("produktivAnteil")} />
            <ZahlFeld {...f.feld("gewinn")} />
            <div className="sm:col-span-2">
              <Schalter
                label="Auch Bruttopreis mit 19 % MwSt. zeigen"
                hinweis="Für Angebote an Privatkunden."
                checked={brutto}
                onChange={setBrutto}
              />
            </div>
          </FeldGruppe>
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel="Dein Stundensatz netto"
          hauptWert={euro(r?.netto)}
          unterzeile={
            r && brutto ? (
              <>
                <span className="font-semibold text-white">{euro(r.brutto)}</span> brutto inkl. 19 % MwSt.
              </>
            ) : null
          }
          zusammenfassung={zusammenfassung}
          betreff="Mein Stundensatz – berechnet mit Handwerk OS"
          hinweis="Das Ergebnis ist eine Orientierung, keine Steuerberatung."
          meldung={hinweis}
        >
          <ErgebnisZeile label="Jahreskosten" wert={euro(r?.jahreskosten)} />
          <ErgebnisZeile
            label="Produktive Stunden im Jahr"
            zusatz={r ? `${zahl(r.stundenJeMitarbeiter)} h je Mitarbeiter` : undefined}
            wert={r ? `${zahl(r.produktiveStunden)} h` : "–"}
          />
          <ErgebnisZeile label="Kosten pro Stunde" zusatz="Darunter zahlst du drauf." wert={euro(r?.kostensatz)} betont />
          <ErgebnisZeile label="Gewinn pro Stunde" wert={euro(r?.gewinnJeStunde)} />
          <ErgebnisZeile label="Nötiger Umsatz im Jahr" wert={euro(r?.zielumsatz)} />
        </ErgebnisKarte>
      }
    />
  );
}
