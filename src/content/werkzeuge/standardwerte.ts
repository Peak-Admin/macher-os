/**
 * Startwerte der Rechner. Sie sind gleichzeitig die Zahlen der
 * „Beispiel“-Abschnitte – Rechner, Beispiel und Tests rechnen so
 * garantiert mit denselben Werten.
 */
import type {
  AngebotsPosition,
  DeckungsbeitragEingabe,
  FahrtkostenEingabe,
  MaterialEingabe,
  StundensatzEingabe,
  VerrechnungssatzEingabe,
} from "./rechnen";

export const standardwerte = {
  stundensatz: {
    produktiveMitarbeiter: 3,
    lohnkosten: 165000,
    unternehmerlohn: 60000,
    miete: 18000,
    fahrzeuge: 21000,
    versicherungen: 6000,
    software: 4800,
    sonstigeKosten: 15000,
    arbeitstage: 261,
    feiertage: 10,
    urlaub: 30,
    krankheit: 10,
    weiterbildung: 3,
    stundenProTag: 8,
    produktivAnteil: 75,
    gewinn: 10,
    mwst: 19,
  } satisfies StundensatzEingabe,

  verrechnungssatz: {
    stundenlohn: 22,
    lohnnebenkosten: 75,
    gemeinkosten: 70,
    gemeinkostenBasis: "lohnkosten",
    wagnisGewinn: 10,
    mwst: 19,
  } satisfies VerrechnungssatzEingabe as VerrechnungssatzEingabe,

  angebot: {
    positionen: [
      { typ: "lohn", bezeichnung: "Monteur", menge: 12, preis: 68, aufschlag: 0 },
      { typ: "material", bezeichnung: "Material laut Liste", menge: 1, preis: 850, aufschlag: 20 },
      { typ: "fremd", bezeichnung: "Entsorgung", menge: 1, preis: 180, aufschlag: 10 },
      { typ: "anfahrt", bezeichnung: "Anfahrt", menge: 3, preis: 35, aufschlag: 0 },
    ] satisfies (AngebotsPosition & { bezeichnung: string })[] as (AngebotsPosition & { bezeichnung: string })[],
    rabatt: 3,
    mwst: 19,
  },

  material: {
    modus: "aufschlag",
    ek: 40,
    aufschlag: 25,
    vk: 50,
    marge: 20,
    menge: 12,
    mwst: 19,
  } satisfies MaterialEingabe as MaterialEingabe,

  fahrtkosten: {
    entfernung: 18,
    hinUndZurueck: true,
    modus: "kmSatz",
    kmSatz: 0.65,
    verbrauch: 9.5,
    spritpreis: 1.75,
    verschleiss: 0.25,
    fahrzeit: 25,
    personen: 1,
    stundensatz: 62,
    pauschale: 59,
    einsaetzeProMonat: 20,
  } satisfies FahrtkostenEingabe as FahrtkostenEingabe,

  deckungsbeitrag: {
    umsatz: 8500,
    material: 2600,
    fremdleistung: 900,
    lohnstunden: 64,
    lohnkostenJeStunde: 38.5,
    fixkostenJeStunde: 27,
  } satisfies DeckungsbeitragEingabe,
};
