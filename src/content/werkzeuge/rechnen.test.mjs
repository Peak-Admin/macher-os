// Testskript für die Rechenlogik der Werkzeuge.
// Ausführen: node --experimental-strip-types src/content/werkzeuge/rechnen.test.mjs
// (ab Node 22.18 reicht `node src/content/werkzeuge/rechnen.test.mjs`)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aufschlagZuMarge,
  berechneAngebot,
  berechneDeckungsbeitrag,
  berechneFahrtkosten,
  berechneMaterial,
  berechneStundensatz,
  berechneVerrechnungssatz,
  euro,
  leseZahl,
  margeZuAufschlag,
  prozent,
  rundeCent,
} from "./rechnen.ts";
import { standardwerte } from "./standardwerte.ts";

const nah = (ist, soll, toleranz = 0.005) =>
  assert.ok(Math.abs(ist - soll) <= toleranz, `erwartet ${soll}, erhalten ${ist}`);

test("leseZahl versteht deutsches Zahlenformat", () => {
  assert.equal(leseZahl("1.234,56"), 1234.56);
  assert.equal(leseZahl("0,65"), 0.65);
  assert.equal(leseZahl("165.000"), 165000);
  assert.equal(leseZahl("12.5"), 12.5);
  assert.equal(leseZahl("22"), 22);
  assert.equal(leseZahl(" 19 % "), 19);
  assert.equal(leseZahl("45 €"), 45);
  assert.ok(Number.isNaN(leseZahl("")));
  assert.ok(Number.isNaN(leseZahl("abc")));
  assert.ok(Number.isNaN(leseZahl("1,2,3")));
});

test("Formatierung zeigt nie NaN oder Infinity", () => {
  assert.equal(euro(NaN), "–");
  assert.equal(euro(Infinity), "–");
  assert.equal(euro(null), "–");
  assert.equal(prozent(NaN), "–");
  assert.equal(euro(1234.5).replace(/\s/g, " "), "1.234,50 €");
  assert.equal(euro(-0.001).replace(/\s/g, " "), "0,00 €");
});

test("Stundensatz: Standardwerte", () => {
  const r = berechneStundensatz(standardwerte.stundensatz);
  assert.ok(r);
  // 261 − 10 − 30 − 10 − 3 = 208 Tage; 208 × 8 × 75 % = 1.248 h; × 3 = 3.744 h
  assert.equal(r.anwesenheitstage, 208);
  nah(r.stundenJeMitarbeiter, 1248);
  nah(r.produktiveStunden, 3744);
  assert.equal(r.jahreskosten, 289800);
  nah(r.kostensatz, 289800 / 3744);
  nah(rundeCent(r.netto), 85.14);
  nah(rundeCent(r.brutto), 101.32);
});

test("Stundensatz: keine produktiven Stunden → null statt Infinity", () => {
  assert.equal(berechneStundensatz({ ...standardwerte.stundensatz, produktiveMitarbeiter: 0 }), null);
  assert.equal(berechneStundensatz({ ...standardwerte.stundensatz, urlaub: 300 }), null);
  assert.equal(berechneStundensatz({ ...standardwerte.stundensatz, produktivAnteil: 0 }), null);
});

test("Stundenverrechnungssatz: Zuschlagskalkulation", () => {
  const r = berechneVerrechnungssatz(standardwerte.verrechnungssatz);
  assert.ok(r);
  // 22 + 75 % = 38,50; + 70 % GK = 65,45; + 10 % = 71,995
  nah(r.lohnkosten, 38.5);
  nah(r.gemeinkosten, 26.95);
  nah(r.selbstkosten, 65.45);
  nah(r.netto, 71.995);
  nah(r.brutto, 71.995 * 1.19);
  nah(r.faktor, 71.995 / 22, 1e-9);
  // Summe der Bausteine ergibt den Netto-Satz
  nah(r.lohn + r.lohnnebenkosten + r.gemeinkosten + r.wagnisGewinn, r.netto, 1e-9);
});

test("Stundenverrechnungssatz: Gemeinkosten nur auf Lohn", () => {
  const r = berechneVerrechnungssatz({ ...standardwerte.verrechnungssatz, gemeinkostenBasis: "lohn" });
  nah(r.gemeinkosten, 22 * 0.7);
  assert.equal(berechneVerrechnungssatz({ ...standardwerte.verrechnungssatz, stundenlohn: 0 }), null);
});

test("Angebot: Positionen, Rabatt, MwSt", () => {
  const r = berechneAngebot({
    positionen: standardwerte.angebot.positionen,
    rabatt: standardwerte.angebot.rabatt,
    mwst: standardwerte.angebot.mwst,
  });
  assert.ok(r);
  // 12 × 68 = 816; 850 × 1,2 = 1.020; 180 × 1,1 = 198; 3 × 35 = 105
  nah(r.jeTyp.lohn, 816);
  nah(r.jeTyp.material, 1020);
  nah(r.jeTyp.fremd, 198);
  nah(r.jeTyp.anfahrt, 105);
  nah(r.zwischensumme, 2139);
  nah(r.rabatt, 64.17);
  nah(r.netto, 2074.83);
  nah(r.mwst, 394.2177);
  nah(r.brutto, 2469.0477);
  nah(r.einkauf, 1030);
});

test("Angebot: leere Liste ergibt 0 €", () => {
  const r = berechneAngebot({ positionen: [], rabatt: 0, mwst: 19 });
  assert.equal(r.brutto, 0);
});

test("Material: Aufschlag ist nicht gleich Marge", () => {
  nah(aufschlagZuMarge(25), 20);
  nah(margeZuAufschlag(20), 25);
  nah(aufschlagZuMarge(100), 50);
  assert.equal(margeZuAufschlag(100), null);

  const a = berechneMaterial(standardwerte.material);
  nah(a.vk, 50);
  nah(a.marge, 20);
  nah(a.vkGesamt, 600);
  nah(a.rohertragGesamt, 120);
  nah(a.vkBrutto, 59.5);

  const b = berechneMaterial({ ...standardwerte.material, modus: "vk", vk: 60 });
  nah(b.aufschlag, 50);
  nah(b.marge, 100 / 3);

  const c = berechneMaterial({ ...standardwerte.material, modus: "marge", marge: 20 });
  nah(c.vk, 50);
  nah(c.aufschlag, 25);
  assert.equal(berechneMaterial({ ...standardwerte.material, modus: "marge", marge: 100 }), null);
  assert.equal(berechneMaterial({ ...standardwerte.material, ek: 0 }), null);
});

test("Fahrtkosten: km-Satz und Fahrzeit", () => {
  const r = berechneFahrtkosten(standardwerte.fahrtkosten);
  assert.ok(r);
  // 2 × 18 km = 36 km × 0,65 = 23,40; 2 × 25 min = 50 min × 62 €/h = 51,67
  nah(r.kilometer, 36);
  nah(r.fahrzeugkosten, 23.4);
  nah(r.zeitkosten, (50 / 60) * 62);
  nah(r.gesamt, 23.4 + (50 / 60) * 62);
  nah(r.differenz, 59 - r.gesamt);
  nah(r.monatDifferenz, r.differenz * 20);
});

test("Fahrtkosten: Verbrauch × Spritpreis + Verschleiß", () => {
  const r = berechneFahrtkosten({ ...standardwerte.fahrtkosten, modus: "verbrauch", hinUndZurueck: false });
  nah(r.kostenProKm, (9.5 / 100) * 1.75 + 0.25, 1e-9);
  nah(r.kilometer, 18);
});

test("Deckungsbeitrag: Ampel", () => {
  const r = berechneDeckungsbeitrag(standardwerte.deckungsbeitrag);
  assert.ok(r);
  // 8.500 − 2.600 − 900 − 64 × 38,50 (2.464) = 2.536
  nah(r.db, 2536);
  nah(r.dbProzent, (2536 / 8500) * 100);
  nah(r.fixkosten, 64 * 27);
  nah(r.ergebnis, 2536 - 1728);
  nah(r.mindestpreis, 8500 - 808);
  assert.equal(r.ampel, "gruen");

  const gelb = berechneDeckungsbeitrag({ ...standardwerte.deckungsbeitrag, umsatz: 7000 });
  assert.equal(gelb.ampel, "gelb");
  const rot = berechneDeckungsbeitrag({ ...standardwerte.deckungsbeitrag, umsatz: 5000 });
  assert.equal(rot.ampel, "rot");
  const ohneUmsatz = berechneDeckungsbeitrag({ ...standardwerte.deckungsbeitrag, umsatz: 0 });
  assert.equal(ohneUmsatz.dbProzent, null);
});
