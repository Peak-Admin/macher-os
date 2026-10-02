/**
 * Beispielrechnungen mit echten Zahlen. Sie nutzen dieselben Funktionen und
 * Startwerte wie die Rechner – Beispiel und Rechner zeigen also immer
 * dasselbe Ergebnis.
 */
import type { WerkzeugSlug } from "@/content/registry";
import {
  berechneAngebot,
  berechneDeckungsbeitrag,
  berechneFahrtkosten,
  berechneMaterial,
  berechneStundensatz,
  berechneVerrechnungssatz,
  euro,
  positionsTypen,
  prozent,
  zahl,
} from "./rechnen";
import { standardwerte } from "./standardwerte";

export type BeispielZeile = {
  label: string;
  rechnung?: string;
  wert: string;
  /** Zwischen- oder Endergebnis hervorheben. */
  betont?: boolean;
};

export type Beispiel = { zeilen: BeispielZeile[]; fazit: string };

function stundensatz(): Beispiel {
  const e = standardwerte.stundensatz;
  const r = berechneStundensatz(e)!;
  return {
    zeilen: [
      { label: "Lohnkosten (2 Gesellen inkl. Nebenkosten)", wert: euro(e.lohnkosten) },
      { label: "Unternehmerlohn (Chef)", wert: euro(e.unternehmerlohn) },
      {
        label: "Gemeinkosten",
        rechnung: "Miete, Fahrzeuge, Versicherungen, Software, Sonstiges",
        wert: euro(r.gemeinkosten),
      },
      { label: "Jahreskosten", wert: euro(r.jahreskosten), betont: true },
      {
        label: "Anwesenheitstage",
        rechnung: `${e.arbeitstage} − ${e.feiertage} − ${e.urlaub} − ${e.krankheit} − ${e.weiterbildung}`,
        wert: `${zahl(r.anwesenheitstage)} Tage`,
      },
      {
        label: "Produktive Stunden",
        rechnung: `${zahl(r.anwesenheitstage)} × ${e.stundenProTag} h × ${e.produktivAnteil} % × ${e.produktiveMitarbeiter}`,
        wert: `${zahl(r.produktiveStunden)} h`,
      },
      {
        label: "Kosten pro Stunde",
        rechnung: `${euro(r.jahreskosten)} ÷ ${zahl(r.produktiveStunden)} h`,
        wert: euro(r.kostensatz),
      },
      { label: "Stundensatz netto", rechnung: `+ ${e.gewinn} % Gewinn`, wert: euro(r.netto), betont: true },
      { label: "Stundensatz brutto", rechnung: `+ ${e.mwst} % MwSt.`, wert: euro(r.brutto) },
    ],
    fazit: `Unter ${euro(r.kostensatz)} pro Stunde zahlt dieser Betrieb bei jeder Stunde drauf. Mit ${euro(r.netto)} netto bleibt ein Gewinn von ${euro(r.gewinnJeStunde)} pro Stunde.`,
  };
}

function verrechnungssatz(): Beispiel {
  const e = standardwerte.verrechnungssatz;
  const r = berechneVerrechnungssatz(e)!;
  return {
    zeilen: [
      { label: "Bruttostundenlohn", wert: euro(r.lohn) },
      { label: "Lohnnebenkosten", rechnung: `${e.lohnnebenkosten} % von ${euro(r.lohn)}`, wert: euro(r.lohnnebenkosten) },
      { label: "Lohnkosten", wert: euro(r.lohnkosten), betont: true },
      { label: "Gemeinkosten", rechnung: `${e.gemeinkosten} % von ${euro(r.lohnkosten)}`, wert: euro(r.gemeinkosten) },
      { label: "Selbstkosten", wert: euro(r.selbstkosten), betont: true },
      { label: "Wagnis und Gewinn", rechnung: `${e.wagnisGewinn} % von ${euro(r.selbstkosten)}`, wert: euro(r.wagnisGewinn) },
      { label: "Verrechnungssatz netto", wert: euro(r.netto), betont: true },
      { label: "Verrechnungssatz brutto", rechnung: `+ ${e.mwst} % MwSt.`, wert: euro(r.brutto) },
    ],
    fazit: `Aus ${euro(r.lohn)} Stundenlohn werden ${euro(r.netto)} netto. Der Kalkulationsfaktor liegt bei ${zahl(r.faktor, 2)}.`,
  };
}

function angebot(): Beispiel {
  const e = standardwerte.angebot;
  const r = berechneAngebot(e)!;
  return {
    zeilen: [
      ...e.positionen.map((p, i) => {
        const typ = positionsTypen[p.typ];
        const aufschlag = p.typ === "material" || p.typ === "fremd" ? ` + ${p.aufschlag} %` : "";
        return {
          label: `${typ.titel}: ${p.bezeichnung}`,
          rechnung: `${zahl(p.menge, 2)} ${typ.einheit} × ${euro(p.preis)}${aufschlag}`,
          wert: euro(r.positionen[i].gesamt),
        };
      }),
      { label: "Summe Positionen", wert: euro(r.zwischensumme), betont: true },
      { label: "Rabatt", rechnung: `${e.rabatt} %`, wert: `− ${euro(r.rabatt)}` },
      { label: "Netto", wert: euro(r.netto), betont: true },
      { label: "Mehrwertsteuer", rechnung: `${e.mwst} %`, wert: euro(r.mwst) },
      { label: "Endpreis brutto", wert: euro(r.brutto), betont: true },
    ],
    fazit: `Der Rabatt von ${e.rabatt} % kostet hier ${euro(r.rabatt)} – das geht komplett vom Gewinn ab.`,
  };
}

function material(): Beispiel {
  const e = standardwerte.material;
  const r = berechneMaterial(e)!;
  return {
    zeilen: [
      { label: "Einkaufspreis je Stück", wert: euro(r.ek) },
      { label: "Aufschlag", rechnung: `${e.aufschlag} % von ${euro(r.ek)}`, wert: euro(r.rohertrag) },
      { label: "Verkaufspreis je Stück netto", wert: euro(r.vk), betont: true },
      { label: "Marge (Handelsspanne)", rechnung: `${euro(r.rohertrag)} ÷ ${euro(r.vk)}`, wert: prozent(r.marge) },
      { label: "Einkauf gesamt", rechnung: `${zahl(e.menge)} Stück`, wert: euro(r.ekGesamt) },
      { label: "Verkauf gesamt netto", rechnung: `${zahl(e.menge)} Stück`, wert: euro(r.vkGesamt), betont: true },
      { label: "Rohertrag gesamt", wert: euro(r.rohertragGesamt), betont: true },
    ],
    fazit: `${e.aufschlag} % Aufschlag sind nur ${prozent(r.marge)} Marge. Wer das verwechselt, kalkuliert zu knapp.`,
  };
}

function fahrtkosten(): Beispiel {
  const e = standardwerte.fahrtkosten;
  const r = berechneFahrtkosten(e)!;
  return {
    zeilen: [
      { label: "Strecke", rechnung: `${zahl(e.entfernung)} km × 2`, wert: `${zahl(r.kilometer)} km` },
      { label: "Fahrzeugkosten", rechnung: `${zahl(r.kilometer)} km × ${euro(r.kostenProKm)}`, wert: euro(r.fahrzeugkosten) },
      {
        label: "Fahrzeit",
        rechnung: `${zahl(e.fahrzeit * 2)} min × ${e.personen} Person × ${euro(e.stundensatz)}/h`,
        wert: euro(r.zeitkosten),
      },
      { label: "Kosten je Einsatz", wert: euro(r.gesamt), betont: true },
      { label: "Deine Pauschale", wert: euro(e.pauschale) },
      { label: "Differenz je Einsatz", wert: euro(r.differenz), betont: true },
      { label: "Hochgerechnet pro Monat", rechnung: `${e.einsaetzeProMonat} Einsätze`, wert: euro(r.monatDifferenz), betont: true },
    ],
    fazit:
      r.differenz < 0
        ? `Die Pauschale ist ${euro(-r.differenz)} zu niedrig. Bei ${e.einsaetzeProMonat} Einsätzen fehlen jeden Monat ${euro(-r.monatDifferenz)}.`
        : `Die Pauschale deckt die Kosten und bringt ${euro(r.differenz)} je Einsatz.`,
  };
}

function deckungsbeitrag(): Beispiel {
  const e = standardwerte.deckungsbeitrag;
  const r = berechneDeckungsbeitrag(e)!;
  return {
    zeilen: [
      { label: "Umsatz netto", wert: euro(e.umsatz) },
      { label: "Material", wert: `− ${euro(e.material)}` },
      { label: "Fremdleistung", wert: `− ${euro(e.fremdleistung)}` },
      {
        label: "Direkte Lohnkosten",
        rechnung: `${zahl(e.lohnstunden)} h × ${euro(e.lohnkostenJeStunde)}`,
        wert: `− ${euro(r.lohnkosten)}`,
      },
      { label: "Deckungsbeitrag", rechnung: prozent(r.dbProzent), wert: euro(r.db), betont: true },
      {
        label: "Anteilige Fixkosten",
        rechnung: `${zahl(e.lohnstunden)} h × ${euro(e.fixkostenJeStunde)}`,
        wert: `− ${euro(r.fixkosten)}`,
      },
      { label: "Ergebnis des Auftrags", rechnung: prozent(r.ergebnisProzent), wert: euro(r.ergebnis), betont: true },
    ],
    fazit: `Der Auftrag deckt seine Kosten und bringt ${euro(r.ergebnis)} Gewinn. Unter ${euro(r.mindestpreis)} netto hätte er sich nicht gelohnt.`,
  };
}

export const beispiele: Record<WerkzeugSlug, () => Beispiel> = {
  "stundensatz-rechner": stundensatz,
  "stundenverrechnungssatz-rechner": verrechnungssatz,
  "angebots-rechner": angebot,
  "materialaufschlag-rechner": material,
  "fahrtkosten-rechner": fahrtkosten,
  "deckungsbeitrags-rechner": deckungsbeitrag,
};
