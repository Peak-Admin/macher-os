"use client";

import { useState } from "react";
import {
  aufschlagZuMarge,
  berechneMaterial,
  euro,
  prozent,
  zahl,
  MWST_REGEL,
  type MaterialModus,
} from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { FeldGruppe, Umschalter, useFelder, ZahlFeld, type FeldDef } from "./felder";

const s = standardwerte.material;
const TITEL = "Materialaufschlag-Rechner";

const felder = {
  ek: {
    label: "Einkaufspreis je Einheit (netto)",
    einheit: "€",
    start: s.ek,
    min: 0,
    groesserAlsMin: true,
  },
  aufschlag: {
    label: "Aufschlag auf den Einkaufspreis",
    einheit: "%",
    start: s.aufschlag,
    min: 0,
    max: 1000,
  },
  vk: { label: "Verkaufspreis je Einheit (netto)", einheit: "€", start: s.vk, min: 0, groesserAlsMin: true },
  marge: {
    label: "Gewünschte Marge vom Verkaufspreis",
    einheit: "%",
    start: s.marge,
    min: 0,
    max: 99.9,
    hinweis: "Auch Handelsspanne genannt. Muss unter 100 % liegen.",
  },
  menge: { label: "Menge", einheit: "Stk.", start: s.menge, min: 0, max: 1000000 },
} satisfies Record<string, FeldDef>;

const modi: { wert: MaterialModus; label: string }[] = [
  { wert: "aufschlag", label: "Aufschlag → Preis" },
  { wert: "vk", label: "Preis → Aufschlag" },
  { wert: "marge", label: "Marge → Preis" },
];

export function MaterialRechner() {
  const f = useFelder(felder);
  const [modus, setModus] = useState<MaterialModus>(s.modus);
  const w = f.werte;

  // Nur die Felder des gewählten Wegs müssen gültig sein.
  const benoetigt: (keyof typeof felder)[] = [
    "ek",
    "menge",
    modus === "aufschlag" ? "aufschlag" : modus === "vk" ? "vk" : "marge",
  ];
  const gueltig = benoetigt.every((k) => !Number.isNaN(w[k]));
  const r = gueltig ? berechneMaterial({ ...w, modus, mwst: MWST_REGEL }) : null;

  const meldung = !gueltig
    ? "Bitte prüf die markierten Eingaben."
    : r === null
      ? "Der Verkaufspreis muss größer als null sein."
      : r.rohertrag < 0
        ? "Achtung: Der Verkaufspreis liegt unter dem Einkaufspreis. Du verkaufst mit Verlust."
        : null;

  const hauptLabel = modus === "vk" ? "Dein Aufschlag" : "Verkaufspreis je Einheit netto";
  const hauptWert = modus === "vk" ? prozent(r?.aufschlag) : euro(r?.vk);

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/materialaufschlag-rechner`,
    eingaben: [
      ["Einkaufspreis je Einheit", euro(w.ek)],
      modus === "aufschlag"
        ? ["Aufschlag", prozent(w.aufschlag)]
        : modus === "vk"
          ? ["Verkaufspreis je Einheit", euro(w.vk)]
          : ["Gewünschte Marge", prozent(w.marge)],
      ["Menge", zahl(w.menge, 2)],
    ],
    ergebnis: [
      ["Verkaufspreis je Einheit netto", euro(r?.vk)],
      ["Verkaufspreis je Einheit brutto (19 % MwSt.)", euro(r?.vkBrutto)],
      ["Aufschlag auf den Einkauf", prozent(r?.aufschlag)],
      ["Marge vom Verkaufspreis", prozent(r?.marge)],
      ["Einkauf gesamt", euro(r?.ekGesamt)],
      ["Verkauf gesamt netto", euro(r?.vkGesamt)],
      ["Rohertrag gesamt", euro(r?.rohertragGesamt)],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={() => {
        f.zuruecksetzen();
        setModus(s.modus);
      }}
      kurzErgebnis={{ label: hauptLabel, wert: hauptWert }}
      eingaben={
        <>
          <Umschalter<MaterialModus> label="Was willst du berechnen?" name="modus" wert={modus} onChange={setModus} optionen={modi} />
          <FeldGruppe titel="Preise">
            <ZahlFeld {...f.feld("ek")} />
            {modus === "aufschlag" && <ZahlFeld {...f.feld("aufschlag")} />}
            {modus === "vk" && <ZahlFeld {...f.feld("vk")} />}
            {modus === "marge" && <ZahlFeld {...f.feld("marge")} />}
          </FeldGruppe>
          <FeldGruppe titel="Menge" spalten={2}>
            <ZahlFeld {...f.feld("menge")} />
          </FeldGruppe>
          <div className="rounded-xl bg-sky-soft p-4 text-sm leading-relaxed text-ink">
            <p className="font-semibold">Aufschlag ist nicht gleich Marge</p>
            <p className="mt-1 text-ink/80">
              Der Aufschlag bezieht sich auf den Einkaufspreis, die Marge auf den Verkaufspreis.{" "}
              {[10, 25, 50]
                .map((a) => `${zahl(a)} % Aufschlag = ${prozent(aufschlagZuMarge(a))} Marge`)
                .join(" · ")}
              .
            </p>
          </div>
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel={hauptLabel}
          hauptWert={hauptWert}
          unterzeile={
            r ? (
              modus === "vk" ? (
                <>
                  Das sind <span className="font-semibold text-white">{prozent(r.marge)}</span> Marge vom Verkaufspreis.
                </>
              ) : (
                <>
                  <span className="font-semibold text-white">{euro(r.vkBrutto)}</span> brutto inkl. 19 % MwSt.
                </>
              )
            ) : null
          }
          meldung={meldung}
          zusammenfassung={zusammenfassung}
          betreff="Materialpreis – berechnet mit Handwerk OS"
          hinweis="Alle Preise netto, also ohne Mehrwertsteuer. Das Ergebnis ist eine Orientierung, keine Steuerberatung."
        >
          <ErgebnisZeile label="Verkaufspreis je Einheit" wert={euro(r?.vk)} />
          <ErgebnisZeile label="Aufschlag auf den Einkauf" wert={prozent(r?.aufschlag)} />
          <ErgebnisZeile label="Marge vom Verkaufspreis" wert={prozent(r?.marge)} />
          <ErgebnisZeile label="Rohertrag je Einheit" wert={euro(r?.rohertrag)} />
          <ErgebnisZeile label="Einkauf gesamt" zusatz={r ? `${zahl(w.menge, 2)} Einheiten` : undefined} wert={euro(r?.ekGesamt)} />
          <ErgebnisZeile label="Verkauf gesamt netto" wert={euro(r?.vkGesamt)} betont />
          <ErgebnisZeile label="Verkauf gesamt brutto" wert={euro(r?.vkGesamtBrutto)} />
          <ErgebnisZeile label="Rohertrag gesamt" wert={euro(r?.rohertragGesamt)} betont />
        </ErgebnisKarte>
      }
    />
  );
}
