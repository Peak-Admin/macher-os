/** Rechnungsarten in Cent: Abschlag, Teil, Schluss (Abzug gezahlter Abschläge), Einbehalt, Gutschrift, Storno, Nummernkreise. */
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute } from '@core/format';
import { setzeEinstellung } from '@core/einstellungen';
import {
  festschreiben,
  freieRechnung,
  offenerBetrag,
  offenePosten,
  optionenSetzen,
  passendeArt,
  rechnungErstellen,
  rechnungsSummen,
  rechnungsVorschau,
  statusText,
  stornieren,
  summenZeilen,
  verrechnetIn,
} from './logik';
import { rechnungAendern, rechnungX, type RechnungX } from './typen';
import { testBetrieb, vorTagen } from './testdaten';
import { xrechnungFuer } from './xrechnung';
import { NUMMERN_KEY } from '@modules/dokumente/nummern';

let t: ReturnType<typeof testBetrieb>;

/** Angebot über 10.000,00 € netto (11.900,00 € brutto) */
function angebot() {
  return db.angebote.create({
    nummer: 'AN-2026-0001',
    auftragId: t.auftrag.id,
    kundeId: t.kunde.id,
    titel: 'Bad',
    positionen: [{ id: 'a', art: 'leistung', text: 'Bad komplett', menge: 1, einheit: 'Psch', einzelpreis: 1_000_000 }],
    status: 'angenommen',
    datum: vorTagen(30),
    gueltigBis: heute(),
    version: 1,
  });
}

function fest(r: RechnungX | undefined): RechnungX {
  rechnungAendern(r!.id, { leistungszeitraum: '01.09.2026 – 30.09.2026' }, { leise: true });
  const e = festschreiben(r!.id);
  expect(e.ok, JSON.stringify(e.maengel)).toBe(true);
  return e.rechnung!;
}

const zahlen = (rechnungId: string, betrag: number) => db.zahlungen.create({ rechnungId, betrag, datum: heute(), art: 'ueberweisung' });

beforeEach(() => {
  t = testBetrieb();
  angebot();
});

describe('Abschlag, Teil und Schluss', () => {
  it('Abschlag 30 % vom Angebot: 3.000,00 € netto, 3.570,00 € brutto', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    const s = rechnungsSummen(ab);
    expect([s.netto, s.ust, s.brutto, s.zahlbetrag]).toEqual([300_000, 57_000, 357_000, 357_000]);
    expect(passendeArt(t.auftrag.id)).toBe('schluss');
  });

  it('Schluss: voll bezahlte Abschläge werden abgezogen', () => {
    const ab1 = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab1.id, 357_000);
    const ab2 = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab2.id, 357_000);
    const schluss = rechnungErstellen(t.auftrag.id, 'schluss')!;
    const s = rechnungsSummen(schluss);
    expect(s.brutto).toBe(1_190_000);
    expect(s.abzugNetto).toBe(600_000);
    expect(s.abzugUst).toBe(114_000);
    expect(s.abzugGezahlt).toBe(714_000);
    expect(s.offenAusAbzuegen).toBe(0);
    expect(s.zahlbetrag).toBe(476_000);
  });

  it('Schluss: nicht bezahlter Abschlag steckt im Zahlbetrag und gilt danach als verrechnet', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab.id, 100_000); // nur teilweise bezahlt
    const v = rechnungsVorschau(t.auftrag.id, 'schluss');
    expect(v.hinweise.join(' ')).toMatch(/nicht ganz bezahlt/);
    const schluss = fest(rechnungErstellen(t.auftrag.id, 'schluss'));
    const s = rechnungsSummen(schluss);
    expect(s.abzugGezahlt).toBe(100_000);
    expect(s.offenAusAbzuegen).toBe(257_000);
    expect(s.zahlbetrag).toBe(1_090_000);
    // Abschlag ist verrechnet: nicht mehr offen, nicht mehr in den offenen Posten (keine Mahnung)
    expect(verrechnetIn(rechnungX(ab.id)!)?.id).toBe(schluss.id);
    expect(offenerBetrag(rechnungX(ab.id)!)).toBe(0);
    expect(statusText(rechnungX(ab.id)!).text).toMatch(/Verrechnet/);
    expect(offenePosten().map((r) => r.id)).toEqual([schluss.id]);
    // Summe, die der Kunde insgesamt zahlt = Gesamtbetrag
    expect(100_000 + s.zahlbetrag).toBe(s.brutto);
  });

  it('festgeschriebene Schlussrechnung ändert ihren Betrag nicht, wenn danach noch Geld auf den Abschlag kommt', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    const schluss = fest(rechnungErstellen(t.auftrag.id, 'schluss'));
    expect(rechnungsSummen(schluss).zahlbetrag).toBe(1_190_000);
    zahlen(ab.id, 357_000);
    expect(rechnungsSummen(rechnungX(schluss.id)!).zahlbetrag).toBe(1_190_000);
    expect(rechnungX(schluss.id)!.abzugStand).toEqual({ [ab.id]: 0 });
  });

  it('Teilrechnung nach Aufwand und Schluss ziehen gezahlte Teilrechnung ab', () => {
    db.zeiten.create({ mitarbeiterId: 'm1', auftragId: t.auftrag.id, datum: vorTagen(3), start: '07:00', ende: '11:00', pauseMinuten: 0, art: 'arbeit' });
    const teil = fest(rechnungErstellen(t.auftrag.id, 'teil', { nachAufwand: true }));
    expect(rechnungsSummen(teil).netto).toBe(4 * 6000);
    zahlen(teil.id, rechnungsSummen(teil).brutto);
    const s = rechnungsSummen(rechnungErstellen(t.auftrag.id, 'schluss')!);
    expect(s.abzugGezahlt).toBe(28_560);
    expect(s.zahlbetrag).toBe(1_190_000 - 28_560);
  });

  it('Sicherheitseinbehalt 5 % mindert den Zahlbetrag, auch nach Abzügen', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab.id, 357_000);
    const schluss = rechnungErstellen(t.auftrag.id, 'schluss', { einbehaltProzent: 5 })!;
    const s = rechnungsSummen(schluss);
    expect(s.einbehalt).toBe(59_500);
    expect(s.zahlbetrag).toBe(1_190_000 - 357_000 - 59_500);
    const zeilen = summenZeilen(s);
    expect(zeilen.map((z) => z.label)).toEqual(['Summe netto', 'zzgl. USt 19 %', 'Gesamtbetrag', expect.stringMatching(/^abzüglich gezahlt auf R-/), 'abzüglich Sicherheitseinbehalt 5 %', 'Zahlbetrag']);
    expect(zeilen[zeilen.length - 1].wert).toBe(s.zahlbetrag);
  });

  it('XRechnung: Zahlbetrag = Brutto − gezahlte Abschläge (BR-CO-16)', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab.id, 357_000);
    const schluss = fest(rechnungErstellen(t.auftrag.id, 'schluss'));
    const xml = xrechnungFuer(schluss);
    expect(xml).toContain('<cbc:PrepaidAmount currencyID="EUR">3570.00</cbc:PrepaidAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">8330.00</cbc:PayableAmount>');
  });
});

describe('Gutschrift und Storno', () => {
  it('Gutschrift: negativer Betrag, nichts offen', () => {
    const g = rechnungErstellen(t.auftrag.id, 'gutschrift')!;
    rechnungAendern(g.id, { positionen: [{ id: 'g', art: 'pauschal', text: 'Kulanz', menge: -1, einheit: 'Psch', einzelpreis: 10_000 }] });
    const f = fest(rechnungX(g.id));
    expect(rechnungsSummen(f).zahlbetrag).toBe(-11_900);
    expect(offenerBetrag(f)).toBe(0);
  });

  it('Storno einer Schlussrechnung: alles mit umgekehrtem Vorzeichen, Abschlag wieder offen', () => {
    const ab = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 }));
    zahlen(ab.id, 100_000);
    const schluss = fest(rechnungErstellen(t.auftrag.id, 'schluss', { einbehaltProzent: 5 }));
    const vorher = rechnungsSummen(schluss);
    let gemeldet = 0;
    const aus = on('rechnung.storniert', () => gemeldet++);
    const storno = stornieren(schluss.id, 'falsche Menge')!;
    aus();
    const s = rechnungsSummen(storno);
    expect(s.brutto).toBe(-vorher.brutto);
    expect(s.abzugGezahlt).toBe(-vorher.abzugGezahlt);
    expect(s.einbehalt).toBe(-vorher.einbehalt);
    expect(s.zahlbetrag).toBe(-vorher.zahlbetrag);
    expect(gemeldet).toBe(1);
    // Schluss storniert → Abschlag ist nicht mehr verrechnet und wieder offen
    expect(verrechnetIn(rechnungX(ab.id)!)).toBeUndefined();
    expect(offenerBetrag(rechnungX(ab.id)!)).toBe(257_000);
  });
});

describe('Nummernkreise und Events', () => {
  it('teilt standardmäßig den Kreis R, eigenes Kürzel je Art oder je Rechnung', () => {
    const r1 = fest(rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 10 }));
    expect(r1.nummer).toMatch(/^R-\d{4}-0001$/);
    setzeEinstellung(NUMMERN_KEY, { gutschrift: 'GS' });
    const g = rechnungErstellen(t.auftrag.id, 'gutschrift')!;
    rechnungAendern(g.id, { positionen: [{ id: 'g', art: 'pauschal', text: 'Kulanz', menge: -1, einheit: 'Psch', einzelpreis: 100 }] });
    expect(fest(rechnungX(g.id)).nummer).toMatch(/^GS-\d{4}-0001$/);
    const frei = freieRechnung(t.firma.id);
    rechnungAendern(frei.id, { positionen: [{ id: 'x', art: 'leistung', text: 'Wartung', menge: 1, einheit: 'Psch', einzelpreis: 5000 }] });
    optionenSetzen(frei.id, { nummernkreis: 'wa' });
    expect(fest(rechnungX(frei.id)).nummer).toMatch(/^WA-\d{4}-0001$/);
  });

  it('meldet rechnung.erstellt für neue Entwürfe, nicht für vorhandene', () => {
    const typen: string[] = [];
    const aus = on('rechnung.erstellt', (e) => typen.push((e.daten as { art: string }).art));
    rechnungErstellen(t.auftrag.id, 'rechnung');
    rechnungErstellen(t.auftrag.id, 'rechnung');
    freieRechnung(t.kunde.id);
    aus();
    expect(typen).toEqual(['rechnung', 'rechnung']);
  });

  it('Weitere Optionen: Zahlungsziel, § 13b und Einbehalt nur am Entwurf', () => {
    const r = rechnungErstellen(t.auftrag.id, 'rechnung')!;
    const o = optionenSetzen(r.id, { zielTage: 30, reverseCharge: true, einbehaltProzent: 5 })!;
    expect(o.reverseCharge).toBe(true);
    expect(o.einbehaltProzent).toBe(5);
    expect(o.faelligAm > r.faelligAm).toBe(true);
    expect(rechnungsSummen(o).ust).toBe(0);
  });
});
