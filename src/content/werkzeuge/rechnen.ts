/**
 * Rechenlogik der kostenlosen Werkzeuge.
 *
 * Reine Funktionen ohne Abhängigkeiten – damit sie im Browser, auf dem Server
 * und im Testskript (`node src/content/werkzeuge/rechnen.test.mjs`) gleich
 * rechnen. Ungültige Eingaben führen nie zu NaN/Infinity in der Anzeige:
 * Ergebnisse, die sich nicht sinnvoll berechnen lassen, sind `null`.
 */

export const MWST_REGEL = 19;

/** Rundet kaufmännisch auf Cent (für Vergleiche und Tests). */
export function rundeCent(wert: number): number {
  return Math.round((wert + Number.EPSILON) * 100) / 100;
}

function endlich(wert: number): boolean {
  return typeof wert === "number" && Number.isFinite(wert);
}

/** Teilt nur, wenn das Ergebnis sinnvoll ist – sonst `null`. */
function teile(zaehler: number, nenner: number): number | null {
  if (!endlich(zaehler) || !endlich(nenner) || nenner === 0) return null;
  const ergebnis = zaehler / nenner;
  return endlich(ergebnis) ? ergebnis : null;
}

function summe(werte: number[]): number {
  return werte.reduce((a, b) => a + (endlich(b) ? b : 0), 0);
}

/* ------------------------------------------------------------------------ */
/* Eingaben lesen und Zahlen formatieren                                    */
/* ------------------------------------------------------------------------ */

/**
 * Liest eine Zahl im deutschen Format („1.234,56“, „0,65“, „12“).
 * Ein Punkt ohne Komma gilt als Tausendertrenner, wenn danach genau drei
 * Ziffern folgen („1.500“), sonst als Dezimaltrenner („12.5“).
 * Gibt `NaN` zurück, wenn der Text keine Zahl ist.
 */
export function leseZahl(text: string): number {
  const t = text.trim().replace(/\s| |€|%/g, "");
  if (t === "") return NaN;
  let normal: string;
  if (t.includes(",")) {
    normal = t.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    normal = t.replace(/\./g, "");
  } else {
    normal = t;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normal)) return NaN;
  const zahl = Number(normal);
  return endlich(zahl) ? zahl : NaN;
}

const euroFormat = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** „1.234,56 €“ – oder „–“, wenn keine gültige Zahl vorliegt. */
export function euro(wert: number | null | undefined): string {
  if (wert === null || wert === undefined || !endlich(wert)) return "–";
  return euroFormat.format(rundeCent(wert) === 0 ? 0 : wert);
}

/** „12,5 %“ – oder „–“. */
export function prozent(wert: number | null | undefined, stellen = 1): string {
  if (wert === null || wert === undefined || !endlich(wert)) return "–";
  return `${zahl(wert, stellen)} %`;
}

/** Zahl mit deutschem Trennzeichen, z. B. „1.248“ oder „0,42“. */
export function zahl(wert: number | null | undefined, stellen = 0): string {
  if (wert === null || wert === undefined || !endlich(wert)) return "–";
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: stellen,
  }).format(wert);
}

/** Formatiert einen Startwert für ein Eingabefeld („165.000“, „0,65“). */
export function eingabeText(wert: number): string {
  if (!endlich(wert)) return "";
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(wert);
}

/* ------------------------------------------------------------------------ */
/* 1. Stundensatz-Rechner                                                   */
/* ------------------------------------------------------------------------ */

export type StundensatzEingabe = {
  /** Produktive Köpfe, die Stunden beim Kunden abrechnen (inkl. Chef, wenn er mitarbeitet). */
  produktiveMitarbeiter: number;
  /** Lohnkosten der produktiven Mitarbeiter pro Jahr inkl. Lohnnebenkosten. */
  lohnkosten: number;
  /** Kalkulatorischer Unternehmerlohn pro Jahr. */
  unternehmerlohn: number;
  miete: number;
  fahrzeuge: number;
  versicherungen: number;
  software: number;
  sonstigeKosten: number;
  /** Arbeitstage Mo–Fr im Jahr (meist 260 oder 261). */
  arbeitstage: number;
  feiertage: number;
  urlaub: number;
  krankheit: number;
  weiterbildung: number;
  stundenProTag: number;
  /** Anteil der Anwesenheit, der beim Kunden abgerechnet werden kann (in %). */
  produktivAnteil: number;
  /** Gewinnaufschlag auf die Selbstkosten (in %). */
  gewinn: number;
  mwst: number;
};

export type StundensatzErgebnis = {
  gemeinkosten: number;
  jahreskosten: number;
  anwesenheitstage: number;
  stundenJeMitarbeiter: number;
  produktiveStunden: number;
  kostensatz: number;
  gewinnJeStunde: number;
  netto: number;
  brutto: number;
  zielumsatz: number;
} | null;

export function berechneStundensatz(e: StundensatzEingabe): StundensatzErgebnis {
  const gemeinkosten = summe([e.miete, e.fahrzeuge, e.versicherungen, e.software, e.sonstigeKosten]);
  const jahreskosten = summe([e.lohnkosten, e.unternehmerlohn]) + gemeinkosten;
  const anwesenheitstage = e.arbeitstage - e.feiertage - e.urlaub - e.krankheit - e.weiterbildung;
  if (!endlich(anwesenheitstage) || anwesenheitstage <= 0) return null;
  const stundenJeMitarbeiter = anwesenheitstage * e.stundenProTag * (e.produktivAnteil / 100);
  const produktiveStunden = stundenJeMitarbeiter * e.produktiveMitarbeiter;
  const kostensatz = teile(jahreskosten, produktiveStunden);
  if (kostensatz === null || produktiveStunden <= 0) return null;
  const netto = kostensatz * (1 + e.gewinn / 100);
  if (!endlich(netto)) return null;
  return {
    gemeinkosten,
    jahreskosten,
    anwesenheitstage,
    stundenJeMitarbeiter,
    produktiveStunden,
    kostensatz,
    gewinnJeStunde: netto - kostensatz,
    netto,
    brutto: netto * (1 + e.mwst / 100),
    zielumsatz: netto * produktiveStunden,
  };
}

/* ------------------------------------------------------------------------ */
/* 2. Stundenverrechnungssatz-Rechner (Zuschlagskalkulation)                */
/* ------------------------------------------------------------------------ */

export type VerrechnungssatzEingabe = {
  stundenlohn: number;
  /** Lohnnebenkosten in % vom Bruttostundenlohn. */
  lohnnebenkosten: number;
  /** Gemeinkostenzuschlag in %. */
  gemeinkosten: number;
  /** Worauf sich der Gemeinkostenzuschlag bezieht. */
  gemeinkostenBasis: "lohnkosten" | "lohn";
  /** Wagnis und Gewinn in % auf die Selbstkosten. */
  wagnisGewinn: number;
  mwst: number;
};

export type VerrechnungssatzErgebnis = {
  lohn: number;
  lohnnebenkosten: number;
  lohnkosten: number;
  gemeinkosten: number;
  selbstkosten: number;
  wagnisGewinn: number;
  netto: number;
  mwst: number;
  brutto: number;
  /** Gesamtzuschlag auf den Bruttostundenlohn in % (Kalkulationsfaktor − 1). */
  gesamtzuschlag: number;
  /** Netto-Verrechnungssatz ÷ Bruttostundenlohn. */
  faktor: number;
} | null;

export function berechneVerrechnungssatz(e: VerrechnungssatzEingabe): VerrechnungssatzErgebnis {
  if (!endlich(e.stundenlohn) || e.stundenlohn <= 0) return null;
  const lohn = e.stundenlohn;
  const lohnnebenkosten = lohn * (e.lohnnebenkosten / 100);
  const lohnkosten = lohn + lohnnebenkosten;
  const basis = e.gemeinkostenBasis === "lohn" ? lohn : lohnkosten;
  const gemeinkosten = basis * (e.gemeinkosten / 100);
  const selbstkosten = lohnkosten + gemeinkosten;
  const wagnisGewinn = selbstkosten * (e.wagnisGewinn / 100);
  const netto = selbstkosten + wagnisGewinn;
  const mwst = netto * (e.mwst / 100);
  const faktor = teile(netto, lohn);
  if (!endlich(netto) || !endlich(mwst) || faktor === null) return null;
  return {
    lohn,
    lohnnebenkosten,
    lohnkosten,
    gemeinkosten,
    selbstkosten,
    wagnisGewinn,
    netto,
    mwst,
    brutto: netto + mwst,
    gesamtzuschlag: (faktor - 1) * 100,
    faktor,
  };
}

/* ------------------------------------------------------------------------ */
/* 3. Angebots-Rechner                                                      */
/* ------------------------------------------------------------------------ */

export type PositionsTyp = "lohn" | "material" | "fremd" | "anfahrt";

export const positionsTypen: Record<PositionsTyp, { titel: string; einheit: string; preisLabel: string }> = {
  lohn: { titel: "Lohn", einheit: "Std.", preisLabel: "Stundensatz" },
  material: { titel: "Material", einheit: "Stk.", preisLabel: "Einkaufspreis" },
  fremd: { titel: "Fremdleistung", einheit: "psch.", preisLabel: "Einkaufspreis" },
  anfahrt: { titel: "Anfahrt", einheit: "x", preisLabel: "Pauschale" },
};

/** Material und Fremdleistungen werden mit Aufschlag weiterberechnet. */
export function hatAufschlag(typ: PositionsTyp): boolean {
  return typ === "material" || typ === "fremd";
}

export type AngebotsPosition = {
  typ: PositionsTyp;
  menge: number;
  /** Stundensatz, Einkaufspreis oder Pauschale je Einheit (netto). */
  preis: number;
  /** Aufschlag in % – nur bei Material und Fremdleistung. */
  aufschlag: number;
};

export type AngebotsEingabe = {
  positionen: AngebotsPosition[];
  /** Rabatt in % auf die Summe der Positionen. */
  rabatt: number;
  mwst: number;
};

export type AngebotsErgebnis = {
  positionen: { einzelpreis: number; gesamt: number }[];
  jeTyp: Record<PositionsTyp, number>;
  /** Einkaufswert von Material und Fremdleistung (ohne Aufschlag). */
  einkauf: number;
  zwischensumme: number;
  rabatt: number;
  netto: number;
  mwst: number;
  brutto: number;
} | null;

export function verkaufspreisPosition(p: AngebotsPosition): number {
  return hatAufschlag(p.typ) ? p.preis * (1 + p.aufschlag / 100) : p.preis;
}

export function berechneAngebot(e: AngebotsEingabe): AngebotsErgebnis {
  const jeTyp: Record<PositionsTyp, number> = { lohn: 0, material: 0, fremd: 0, anfahrt: 0 };
  let einkauf = 0;
  const positionen = e.positionen.map((p) => {
    const einzelpreis = verkaufspreisPosition(p);
    const gesamt = p.menge * einzelpreis;
    return { einzelpreis, gesamt, p };
  });
  if (positionen.some((x) => !endlich(x.gesamt))) return null;
  for (const x of positionen) {
    jeTyp[x.p.typ] += x.gesamt;
    if (hatAufschlag(x.p.typ)) einkauf += x.p.menge * x.p.preis;
  }
  const zwischensumme = summe(positionen.map((x) => x.gesamt));
  const rabatt = zwischensumme * (e.rabatt / 100);
  const netto = zwischensumme - rabatt;
  const mwst = netto * (e.mwst / 100);
  if (!endlich(netto) || !endlich(mwst)) return null;
  return {
    positionen: positionen.map(({ einzelpreis, gesamt }) => ({ einzelpreis, gesamt })),
    jeTyp,
    einkauf,
    zwischensumme,
    rabatt,
    netto,
    mwst,
    brutto: netto + mwst,
  };
}

/* ------------------------------------------------------------------------ */
/* 4. Materialaufschlag-Rechner                                             */
/* ------------------------------------------------------------------------ */

/** Aufschlag (auf den EK) → Marge/Handelsspanne (vom VK), beides in %. */
export function aufschlagZuMarge(aufschlag: number): number | null {
  const m = teile(aufschlag, 100 + aufschlag);
  return m === null ? null : m * 100;
}

/** Marge/Handelsspanne (vom VK) → Aufschlag (auf den EK), beides in %. */
export function margeZuAufschlag(marge: number): number | null {
  if (!endlich(marge) || marge >= 100) return null;
  const a = teile(marge, 100 - marge);
  return a === null ? null : a * 100;
}

export type MaterialModus = "aufschlag" | "vk" | "marge";

export type MaterialEingabe = {
  modus: MaterialModus;
  ek: number;
  /** Aufschlag in % (Modus „aufschlag“). */
  aufschlag: number;
  /** Verkaufspreis netto (Modus „vk“). */
  vk: number;
  /** Gewünschte Marge in % (Modus „marge“). */
  marge: number;
  menge: number;
  mwst: number;
};

export type MaterialErgebnis = {
  ek: number;
  vk: number;
  vkBrutto: number;
  aufschlag: number;
  marge: number;
  rohertrag: number;
  ekGesamt: number;
  vkGesamt: number;
  vkGesamtBrutto: number;
  rohertragGesamt: number;
} | null;

export function berechneMaterial(e: MaterialEingabe): MaterialErgebnis {
  if (!endlich(e.ek) || e.ek <= 0 || !endlich(e.menge)) return null;
  let vk: number;
  if (e.modus === "aufschlag") {
    vk = e.ek * (1 + e.aufschlag / 100);
  } else if (e.modus === "vk") {
    vk = e.vk;
  } else {
    if (!endlich(e.marge) || e.marge >= 100) return null;
    vk = e.ek / (1 - e.marge / 100);
  }
  if (!endlich(vk) || vk <= 0) return null;
  const rohertrag = vk - e.ek;
  const aufschlag = (rohertrag / e.ek) * 100;
  const marge = (rohertrag / vk) * 100;
  const faktorMwst = 1 + e.mwst / 100;
  return {
    ek: e.ek,
    vk,
    vkBrutto: vk * faktorMwst,
    aufschlag,
    marge,
    rohertrag,
    ekGesamt: e.ek * e.menge,
    vkGesamt: vk * e.menge,
    vkGesamtBrutto: vk * e.menge * faktorMwst,
    rohertragGesamt: rohertrag * e.menge,
  };
}

/* ------------------------------------------------------------------------ */
/* 5. Fahrtkosten-Rechner                                                   */
/* ------------------------------------------------------------------------ */

export type FahrtkostenEingabe = {
  /** Entfernung einfache Strecke in km. */
  entfernung: number;
  hinUndZurueck: boolean;
  modus: "kmSatz" | "verbrauch";
  /** Kosten pro km (Modus „kmSatz“). */
  kmSatz: number;
  /** Verbrauch in l/100 km (Modus „verbrauch“). */
  verbrauch: number;
  /** Spritpreis in €/l (Modus „verbrauch“). */
  spritpreis: number;
  /** Verschleiß, Wartung, Reifen in €/km (Modus „verbrauch“). */
  verschleiss: number;
  /** Fahrzeit einfache Strecke in Minuten. */
  fahrzeit: number;
  personen: number;
  /** Stundensatz für die Fahrzeit je Person. */
  stundensatz: number;
  /** Was du je Einsatz für die Anfahrt berechnest. */
  pauschale: number;
  einsaetzeProMonat: number;
};

export type FahrtkostenErgebnis = {
  kilometer: number;
  kostenProKm: number;
  fahrzeugkosten: number;
  stunden: number;
  zeitkosten: number;
  gesamt: number;
  /** Pauschale minus tatsächliche Kosten (negativ = Pauschale zu niedrig). */
  differenz: number;
  monatGesamt: number;
  monatPauschale: number;
  monatDifferenz: number;
} | null;

export function berechneFahrtkosten(e: FahrtkostenEingabe): FahrtkostenErgebnis {
  const faktor = e.hinUndZurueck ? 2 : 1;
  const kilometer = e.entfernung * faktor;
  const kostenProKm =
    e.modus === "kmSatz" ? e.kmSatz : (e.verbrauch / 100) * e.spritpreis + e.verschleiss;
  const fahrzeugkosten = kilometer * kostenProKm;
  const stunden = (e.fahrzeit * faktor) / 60;
  const zeitkosten = stunden * e.personen * e.stundensatz;
  const gesamt = fahrzeugkosten + zeitkosten;
  if (![kilometer, kostenProKm, fahrzeugkosten, stunden, zeitkosten, gesamt].every(endlich)) return null;
  const differenz = e.pauschale - gesamt;
  return {
    kilometer,
    kostenProKm,
    fahrzeugkosten,
    stunden,
    zeitkosten,
    gesamt,
    differenz,
    monatGesamt: gesamt * e.einsaetzeProMonat,
    monatPauschale: e.pauschale * e.einsaetzeProMonat,
    monatDifferenz: differenz * e.einsaetzeProMonat,
  };
}

/* ------------------------------------------------------------------------ */
/* 6. Deckungsbeitrags-Rechner                                              */
/* ------------------------------------------------------------------------ */

export type DeckungsbeitragEingabe = {
  umsatz: number;
  material: number;
  fremdleistung: number;
  lohnstunden: number;
  /** Direkte Lohnkosten je Stunde (Lohn + Lohnnebenkosten, ohne Gemeinkosten). */
  lohnkostenJeStunde: number;
  /** Fixkosten/Gemeinkosten je Lohnstunde – für den Anteil des Auftrags. */
  fixkostenJeStunde: number;
};

export type Ampel = "gruen" | "gelb" | "rot";

export type DeckungsbeitragErgebnis = {
  lohnkosten: number;
  variableKosten: number;
  db: number;
  dbProzent: number | null;
  dbJeStunde: number | null;
  fixkosten: number;
  ergebnis: number;
  ergebnisProzent: number | null;
  /** Preis, ab dem der Auftrag alle Kosten deckt (netto). */
  mindestpreis: number;
  ampel: Ampel;
} | null;

export function berechneDeckungsbeitrag(e: DeckungsbeitragEingabe): DeckungsbeitragErgebnis {
  const lohnkosten = e.lohnstunden * e.lohnkostenJeStunde;
  const variableKosten = e.material + e.fremdleistung + lohnkosten;
  const db = e.umsatz - variableKosten;
  const fixkosten = e.lohnstunden * e.fixkostenJeStunde;
  const ergebnis = db - fixkosten;
  if (![lohnkosten, variableKosten, db, fixkosten, ergebnis].every(endlich)) return null;
  const dbProzent = teile(db * 100, e.umsatz);
  const ergebnisProzent = teile(ergebnis * 100, e.umsatz);
  const ampel: Ampel = db <= 0 ? "rot" : ergebnis < 0 ? "gelb" : "gruen";
  return {
    lohnkosten,
    variableKosten,
    db,
    dbProzent,
    dbJeStunde: teile(db, e.lohnstunden),
    fixkosten,
    ergebnis,
    ergebnisProzent,
    mindestpreis: variableKosten + fixkosten,
    ampel,
  };
}
