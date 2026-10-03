"use client";

import { useState } from "react";
import { berechneVerrechnungssatz, euro, prozent, zahl, MWST_REGEL } from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { FeldGruppe, Umschalter, useFelder, ZahlFeld, type FeldDef } from "./felder";

const s = standardwerte.verrechnungssatz;
const TITEL = "Stundenverrechnungssatz-Rechner";

type Basis = "lohnkosten" | "lohn";

const felder = {
  stundenlohn: {
    label: "Bruttostundenlohn",
    einheit: "€/Std.",
    start: s.stundenlohn,
    min: 0,
    max: 1000,
    groesserAlsMin: true,
    hinweis: "Was der Mitarbeiter laut Vertrag brutto pro Stunde bekommt.",
  },
  lohnnebenkosten: {
    label: "Lohnnebenkosten",
    einheit: "%",
    start: s.lohnnebenkosten,
    min: 0,
    max: 300,
    hinweis: "Sozialversicherung, bezahlte Ausfallzeiten, Berufsgenossenschaft.",
  },
  gemeinkosten: {
    label: "Gemeinkostenzuschlag",
    einheit: "%",
    start: s.gemeinkosten,
    min: 0,
    max: 500,
    hinweis: "Miete, Fahrzeuge, Büro, Versicherungen im Verhältnis zu den Lohnkosten.",
  },
  wagnisGewinn: {
    label: "Wagnis und Gewinn",
    einheit: "%",
    start: s.wagnisGewinn,
    min: 0,
    max: 200,
    hinweis: "Auf die Selbstkosten.",
  },
} satisfies Record<string, FeldDef>;

const teile = [
  { key: "lohn", label: "Bruttolohn", farbe: "bg-ink" },
  { key: "lohnnebenkosten", label: "Lohnnebenkosten", farbe: "bg-sky" },
  { key: "gemeinkosten", label: "Gemeinkosten", farbe: "bg-moss" },
  { key: "wagnisGewinn", label: "Wagnis und Gewinn", farbe: "bg-signal" },
] as const;

export function VerrechnungssatzRechner() {
  const f = useFelder(felder);
  const [basis, setBasis] = useState<Basis>(s.gemeinkostenBasis);
  const w = f.werte;
  const r = f.gueltig ? berechneVerrechnungssatz({ ...w, gemeinkostenBasis: basis, mwst: MWST_REGEL }) : null;

  const basisText = basis === "lohnkosten" ? "auf Lohn + Lohnnebenkosten" : "nur auf den Bruttolohn";

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/stundenverrechnungssatz-rechner`,
    eingaben: [
      ["Bruttostundenlohn", euro(w.stundenlohn)],
      ["Lohnnebenkosten", prozent(w.lohnnebenkosten)],
      ["Gemeinkostenzuschlag", `${prozent(w.gemeinkosten)} ${basisText}`],
      ["Wagnis und Gewinn", prozent(w.wagnisGewinn)],
    ],
    ergebnis: [
      ["Lohnkosten je Stunde", euro(r?.lohnkosten)],
      ["Gemeinkosten je Stunde", euro(r?.gemeinkosten)],
      ["Selbstkosten je Stunde", euro(r?.selbstkosten)],
      ["Wagnis und Gewinn je Stunde", euro(r?.wagnisGewinn)],
      ["Verrechnungssatz netto", euro(r?.netto)],
      ["Verrechnungssatz brutto (19 % MwSt.)", euro(r?.brutto)],
      ["Kalkulationsfaktor", zahl(r?.faktor, 2)],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={() => {
        f.zuruecksetzen();
        setBasis(s.gemeinkostenBasis);
      }}
      kurzErgebnis={{ label: "Verrechnungssatz netto", wert: euro(r?.netto) }}
      eingaben={
        <>
          <FeldGruppe titel="Lohn">
            <ZahlFeld {...f.feld("stundenlohn")} />
            <ZahlFeld {...f.feld("lohnnebenkosten")} />
          </FeldGruppe>
          <FeldGruppe titel="Zuschläge">
            <ZahlFeld {...f.feld("gemeinkosten")} />
            <ZahlFeld {...f.feld("wagnisGewinn")} />
            <div className="sm:col-span-2">
              <Umschalter<Basis>
                label="Gemeinkostenzuschlag rechnen auf …"
                name="basis"
                wert={basis}
                onChange={setBasis}
                optionen={[
                  { wert: "lohnkosten", label: "Lohn + Lohnnebenkosten" },
                  { wert: "lohn", label: "nur Bruttolohn" },
                ]}
              />
            </div>
          </FeldGruppe>
          {r && (
            <div className="border-t border-line pt-5">
              <p className="mb-3 font-display text-base font-bold">So setzt sich der Satz zusammen</p>
              <div
                data-balken
                className="flex h-9 w-full overflow-hidden rounded-md ring-1 ring-line"
                role="img"
                aria-label={teile
                  .map((t) => `${t.label} ${euro(r[t.key])}`)
                  .join(", ")
                  .concat(`, zusammen ${euro(r.netto)} netto`)}
              >
                {teile.map((t) => {
                  const anteil = r.netto > 0 ? (r[t.key] / r.netto) * 100 : 0;
                  return anteil > 0 ? (
                    <div key={t.key} data-balken className={`${t.farbe} h-full`} style={{ width: `${anteil}%` }} />
                  ) : null;
                })}
              </div>
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">Aufschlüsselung des Verrechnungssatzes je Stunde</caption>
                <thead>
                  <tr className="text-left text-sm font-tagline uppercase tracking-wider text-muted">
                    <th scope="col" className="pb-2 font-semibold">Baustein</th>
                    <th scope="col" className="pb-2 text-right font-semibold">je Stunde</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Anteil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {teile.map((t) => (
                    <tr key={t.key}>
                      <th scope="row" className="py-2 text-left font-medium">
                        <span className="flex items-center gap-2">
                          <span data-balken aria-hidden className={`size-3 shrink-0 rounded-sm ${t.farbe}`} />
                          {t.label}
                        </span>
                      </th>
                      <td className="py-2 text-right tabular-nums font-semibold">{euro(r[t.key])}</td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {prozent(r.netto > 0 ? (r[t.key] / r.netto) * 100 : null)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="py-2 text-left font-bold">Verrechnungssatz netto</th>
                    <td className="py-2 text-right tabular-nums font-bold">{euro(r.netto)}</td>
                    <td className="py-2 text-right tabular-nums text-muted">100 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel="Verrechnungssatz netto"
          hauptWert={euro(r?.netto)}
          unterzeile={
            r ? (
              <>
                <span className="font-semibold text-white">{euro(r.brutto)}</span> brutto inkl. 19 % MwSt.
              </>
            ) : null
          }
          meldung={f.gueltig ? null : "Bitte prüf die markierten Eingaben."}
          zusammenfassung={zusammenfassung}
          betreff="Mein Stundenverrechnungssatz – berechnet mit Handwerk OS"
          hinweis="Das Ergebnis ist eine Orientierung, keine Steuerberatung."
        >
          <ErgebnisZeile label="Bruttolohn" wert={euro(r?.lohn)} />
          <ErgebnisZeile label="+ Lohnnebenkosten" wert={euro(r?.lohnnebenkosten)} />
          <ErgebnisZeile label="= Lohnkosten" wert={euro(r?.lohnkosten)} betont />
          <ErgebnisZeile label="+ Gemeinkosten" zusatz={basisText} wert={euro(r?.gemeinkosten)} />
          <ErgebnisZeile label="= Selbstkosten" zusatz="Darunter zahlst du drauf." wert={euro(r?.selbstkosten)} betont />
          <ErgebnisZeile label="+ Wagnis und Gewinn" wert={euro(r?.wagnisGewinn)} />
          <ErgebnisZeile
            label="Kalkulationsfaktor"
            zusatz={r ? `${prozent(r.gesamtzuschlag)} Zuschlag auf den Lohn` : undefined}
            wert={zahl(r?.faktor, 2)}
          />
        </ErgebnisKarte>
      }
    />
  );
}
