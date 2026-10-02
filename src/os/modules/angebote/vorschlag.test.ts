import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { frage, kiProtokoll, registriereGateway, registriereModell, type GatewayKontext } from '@core/gateway';
import type { Artikel, Leistung } from '@core/objects';
import type { Recht } from '@core/session';
import { ANGEBOT_ABSICHTEN } from './gateway';
import { genanntePreise, POSITIONEN_VORSCHLAGEN, preisAusText, vorschlagAusModell, vorschlagAusRegeln, type PositionsVorschlag } from './vorschlag';

const kontext = (rechte: Recht[] = ['lesen', 'schreiben', 'geld']): GatewayKontext => ({ heute: '2026-10-02', jetzt: new Date('2026-10-02T10:00:00'), darf: (r) => rechte.includes(r), kostenAnteil: 0 });

let leistungen: Leistung[];
let artikel: Artikel[];
let aus: (() => void)[] = [];

beforeEach(() => {
  zuruecksetzen();
  const l = (name: string, einheit: Leistung['einheit'], preis: number, kategorie?: string) => db.leistungen.create({ name, einheit, preis, kategorie, aktiv: true });
  leistungen = [
    l('Arbeitsstunde Geselle', 'h', 6000, 'Lohn'),
    l('Bodenfliesen verlegen', 'm²', 5800, 'Verlegung'),
    l('Wandfliesen verlegen', 'm²', 6400, 'Verlegung'),
    l('Altbelag entfernen', 'm²', 2200, 'Rückbau'),
    l('Fliese tauschen (Einzelschaden)', 'Stk', 8900, 'Service'),
    l('Silikonfuge erneuern', 'm', 950, 'Service'),
  ];
  artikel = [db.artikel.create({ name: 'Fliesenkreuze 3 mm', einheit: 'Stk', ek: 250, vk: 490, aktiv: true }), db.artikel.create({ name: 'Flexkleber 25 kg', einheit: 'Stk', ek: 1400, vk: 2600, aktiv: true })];
  aus = [registriereGateway({ absichten: ANGEBOT_ABSICHTEN })];
});
afterEach(() => aus.forEach((f) => f()));

describe('Positionen vorschlagen – Regeln (ohne KI)', () => {
  it('Bad 8 m² fliesen, alte Fliesen raus, 2 Tage, Material ca. 900 €', () => {
    const p = vorschlagAusRegeln('Bad 8 m² fliesen, alte Fliesen raus, 2 Tage, Material ca. 900 €', leistungen, artikel);
    expect(p.map(({ text, menge, einheit, einzelpreis, art }) => ({ text, menge, einheit, einzelpreis, art }))).toEqual([
      { text: 'Bodenfliesen verlegen', menge: 8, einheit: 'm²', einzelpreis: 5800, art: 'leistung' },
      { text: 'Altbelag entfernen', menge: 8, einheit: 'm²', einzelpreis: 2200, art: 'leistung' },
      { text: 'Arbeitsstunde Geselle', menge: 16, einheit: 'h', einzelpreis: 6000, art: 'lohn' },
      { text: 'Material', menge: 1, einheit: 'Psch', einzelpreis: 90000, art: 'material' },
    ]);
  });

  it('ohne Katalog: freie Positionen, Preise nur aus dem Satz', () => {
    const p = vorschlagAusRegeln('Bad 8 m² fliesen, alte Fliesen raus, 2 Tage, Anfahrt 45 €', [], []);
    expect(p.map(({ text, menge, einheit, einzelpreis }) => ({ text, menge, einheit, einzelpreis }))).toEqual([
      { text: 'Bad fliesen', menge: 8, einheit: 'm²', einzelpreis: 0 },
      { text: 'Alte Fliesen entfernen', menge: 8, einheit: 'm²', einzelpreis: 0 },
      { text: 'Arbeitszeit', menge: 16, einheit: 'h', einzelpreis: 0 },
      { text: 'Anfahrt', menge: 1, einheit: 'Psch', einzelpreis: 4500 },
    ]);
  });

  it('Einheit entscheidet mit: Stückpreis passt nicht zu m²', () => {
    expect(vorschlagAusRegeln('3 Fliesen tauschen', leistungen, artikel)[0]).toMatchObject({ text: 'Fliese tauschen (Einzelschaden)', menge: 3 });
    expect(vorschlagAusRegeln('zehn Meter Silikonfuge', leistungen, artikel)[0]).toMatchObject({ text: 'Silikonfuge erneuern', menge: 10, einheit: 'm' });
    expect(vorschlagAusRegeln('2 Flexkleber', leistungen, artikel)[0]).toMatchObject({ artikelId: artikel[1].id, menge: 2, einzelpreis: 2600 });
  });

  it('liest Beträge', () => {
    expect(preisAusText('Material ca. 900 €')?.cent).toBe(90000);
    expect(preisAusText('1.250,5 Euro')?.cent).toBe(125050);
    expect(preisAusText('8 m² fliesen')).toBeUndefined();
    expect(genanntePreise('Material ca. 900 €, Anfahrt 45 EUR')).toEqual([90000, 4500]);
  });
});

describe('Positionen vorschlagen – Modell nur als Verbesserung', () => {
  const satz = 'Bad 8 m² fliesen, alte Fliesen raus, Material ca. 900 €';

  it('Katalogpreis gilt, freie Preise nur, wenn sie im Satz stehen', () => {
    const p = vorschlagAusModell(
      JSON.stringify({
        positionen: [
          { katalogId: leistungen[1].id, text: 'egal', menge: 8, einheit: 'Stk', preisEuro: 1 },
          { katalogId: '', text: 'Material', menge: 1, einheit: 'Psch', preisEuro: 900 },
          { katalogId: '', text: 'Entsorgung', menge: 1, einheit: 'Psch', preisEuro: 250 },
        ],
      }),
      satz,
      leistungen,
      artikel,
    );
    expect(p?.map(({ text, menge, einheit, einzelpreis }) => ({ text, menge, einheit, einzelpreis }))).toEqual([
      { text: 'Bodenfliesen verlegen', menge: 8, einheit: 'm²', einzelpreis: 5800 },
      { text: 'Material', menge: 1, einheit: 'Psch', einzelpreis: 90000 },
      { text: 'Entsorgung', menge: 1, einheit: 'Psch', einzelpreis: 0 },
    ]);
    expect(vorschlagAusModell('Gerne! Hier ist …', satz, leistungen, artikel)).toBeUndefined();
    expect(vorschlagAusModell('{"positionen":[]}', satz, leistungen, artikel)).toBeUndefined();
  });

  it('über den Gateway: ohne Modell Regeln (Lane 0), mit Luna verbessert – nur als Vorschlag', async () => {
    const ohne = await frage<PositionsVorschlag>(satz, kontext(), { absicht: POSITIONEN_VORSCHLAGEN });
    expect(ohne).toMatchObject({ lane: 0, ergebnis: { quelle: 'regeln' } });
    expect(ohne.ergebnis?.positionen).toHaveLength(3);
    expect(kiProtokoll.get(ohne.protokollId)?.ergebnis).toBe('vorgeschlagen');

    let gesehen: unknown;
    aus.push(
      registriereModell({
        lane: 2,
        name: 'Luna',
        verfuegbar: () => true,
        schreibe: async (_t, k) => {
          gesehen = k;
          return JSON.stringify({ positionen: [{ katalogId: leistungen[2].id, text: 'Wandfliesen', menge: 8, einheit: 'm²', preisEuro: 0 }] });
        },
      }),
    );
    const mit = await frage<PositionsVorschlag>(satz, kontext(), { absicht: POSITIONEN_VORSCHLAGEN });
    expect(mit).toMatchObject({ lane: 2, modell: 'Luna', ergebnis: { quelle: 'ki', positionen: [{ text: 'Wandfliesen verlegen', einzelpreis: 6400 }] } });
    // Minimaler Kontext: Katalog ohne Preise
    expect(JSON.stringify(gesehen)).not.toContain('5800');
    expect(gesehen).toMatchObject({ format: 'angebot.positionen' });
    // Nichts geändert: kein Angebot entstanden
    expect(db.angebote.all()).toHaveLength(0);
  });

  it('Modell fällt aus oder liefert Unsinn → Regeln', async () => {
    aus.push(registriereModell({ lane: 2, name: 'Luna', verfuegbar: () => true, schreibe: async () => 'kein JSON' }));
    expect((await frage<PositionsVorschlag>(satz, kontext(), { absicht: POSITIONEN_VORSCHLAGEN })).ergebnis?.quelle).toBe('regeln');
  });

  it('ohne Geld-Recht kein Vorschlag', async () => {
    expect((await frage(satz, kontext(['lesen']), { absicht: POSITIONEN_VORSCHLAGEN })).verweigert).toBe('rechte');
  });
});
