import { beforeAll, describe, expect, it } from 'vitest';
import { db, zeitstrahl } from '@core/db';
import { on } from '@core/events';
import { offeneHinweise } from '@core/macher';
import { registriereModule } from '@core/modul';
import { setzeIch } from '@core/session';
import naechsterEinsatz from './index';
import arbeitszeiten from '../arbeitszeiten/index';
import berichteModul from '../berichte/index';
import zusatzModul from '../zusatzleistungen/index';
import { starten } from '../arbeitszeiten/daten';
import { berichte } from '../berichte/daten';
import { zusatzleistungen } from '../zusatzleistungen/daten';
import { aufbauen, TAG } from '../mein-tag/testdaten';
import { materialZuordnen, planen, problemMelden, schonUebernommen, uebernehmen, VERMERK_ABSCHLUSS, zeitPlanen, zusatzPlanen } from './abschluss';
import { berichtLesen } from './sprachbericht';

beforeAll(() => registriereModule([naechsterEinsatz, arbeitszeiten, berichteModul, zusatzModul]));

/** 13:15 am Testtag */
const SPAETER = new Date(2026, 9, 2, 13, 15);

describe('Zeit planen', () => {
  const r = { planStart: 480, planEnde: 720, jetzt: 795, heute: true };

  it('rechnet „länger“ und „kürzer“ vom Planende', () => {
    expect(zeitPlanen(r, { art: 'mehr', minuten: 60, text: '' })).toEqual({ start: 480, ende: 780 });
    expect(zeitPlanen(r, { art: 'weniger', minuten: 30, text: '' })).toEqual({ start: 480, ende: 690 });
  });

  it('nimmt den Start der Stempeluhr und „von … bis …“ wörtlich', () => {
    expect(zeitPlanen({ ...r, laufStart: 510 }, { art: 'dauer', minuten: 180, text: '' })).toEqual({ start: 510, ende: 690 });
    expect(zeitPlanen({ ...r, laufStart: 510 }, { art: 'spanne', von: 450, bis: 800, text: '' })).toEqual({ start: 450, ende: 800 });
  });

  it('ohne Angabe: Stempeluhr endet jetzt, sonst Plan – heute höchstens bis jetzt', () => {
    expect(zeitPlanen({ ...r, laufStart: 490 }, undefined)).toEqual({ start: 490, ende: 795 });
    expect(zeitPlanen(r, undefined)).toEqual({ start: 480, ende: 720 });
    expect(zeitPlanen({ ...r, jetzt: 600 }, undefined)).toEqual({ start: 480, ende: 600 });
    expect(zeitPlanen({ ...r, heute: false, laufStart: 490 }, undefined)).toEqual({ start: 490, ende: 720 });
    expect(zeitPlanen({ ...r, vorhanden: { start: 485, ende: 700 } }, undefined)).toEqual({ start: 485, ende: 700 });
  });

  it('endet nie vor dem Start und nie nach Mitternacht', () => {
    expect(zeitPlanen(r, { art: 'weniger', minuten: 600, text: '' })).toEqual({ start: 480, ende: 480 });
    expect(zeitPlanen(r, { art: 'mehr', minuten: 900, text: '' }).ende).toBe(1439);
  });
});

describe('Material und Zusatzarbeit zuordnen', () => {
  const posten = berichtLesen('3 m Kupferrohr, 2 Stück Thermostatkopf und 4 Stück Silikonkartusche verbraucht').material;

  it('nimmt zuerst geplantes Material, dann den Artikelstamm, sonst Freitext', () => {
    const plan = materialZuordnen(
      posten,
      [{ id: 'b1', text: 'Kupferrohr 15 mm', einheit: 'm', artikelId: 'a1', ek: 800 }],
      [
        { id: 'a1', name: 'Kupferrohr 15 mm', einheit: 'm', ek: 800 },
        { id: 'a2', name: 'Thermostatkopf', einheit: 'Stk', ek: 1500 },
      ],
    );
    expect(plan.map((p) => [p.buchungId, p.artikelId, p.name, p.ek])).toEqual([
      ['b1', 'a1', 'Kupferrohr 15 mm', 800],
      [undefined, 'a2', 'Thermostatkopf', 1500],
      [undefined, undefined, 'Silikonkartusche', 0],
    ]);
  });

  it('nimmt eine geplante Buchung nur einmal', () => {
    const zweimal = berichtLesen('2 m Kupferrohr und 1 m Kupferrohr').material;
    const plan = materialZuordnen(zweimal, [{ id: 'b1', text: 'Kupferrohr', einheit: 'm', ek: 800 }], []);
    expect(plan.map((p) => p.buchungId)).toEqual(['b1', undefined]);
  });

  it('rechnet Zusatzarbeit nach Katalog oder nach der Mehrzeit', () => {
    const leistungen = [{ id: 'l1', name: 'Thermostatventil tauschen', einheit: 'Stk' as const, preis: 4500 }];
    expect(zusatzPlanen(['Thermostatventil erneuert'], undefined, leistungen, 6000)).toEqual([{ text: 'Thermostatventil erneuert', berechnung: 'leistung', leistungId: 'l1', menge: 1, einheit: 'Stk', einzelpreis: 4500 }]);
    expect(zusatzPlanen(['Filter gereinigt'], { art: 'mehr', minuten: 90, text: '' }, leistungen, 6000)).toEqual([{ text: 'Filter gereinigt', berechnung: 'stunden', menge: 1.5, einheit: 'h', einzelpreis: 6000 }]);
    // zwei Zusatzarbeiten, eine Mehrzeit: nicht raten
    expect(zusatzPlanen(['Filter gereinigt', 'Klingel repariert'], { art: 'mehr', minuten: 60, text: '' }, [], 6000).map((z) => z.menge)).toEqual([undefined, undefined]);
  });
});

describe('Einsatz per Sprachbericht abschließen', () => {
  it('schreibt Zeit, Material, Nachtrag, Bericht, Doku und Zeitstrahl genau einmal und beendet den Einsatz', () => {
    const { jonas, auftrag, t } = aufbauen();
    setzeIch(jonas.id);
    const termin = t('08:00', '12:00', [jonas.id], { status: 'vor_ort' });
    const kupfer = db.artikel.create({ name: 'Kupferrohr 15 mm', einheit: 'm', ek: 800, vk: 1400, aktiv: true });
    const kopf = db.artikel.create({ name: 'Thermostatkopf', einheit: 'Stk', ek: 1500, vk: 2900, aktiv: true });
    const geplant = db.material.create({ auftragId: auftrag.id, artikelId: kupfer.id, text: 'Kupferrohr 15 mm', menge: 5, einheit: 'm', ek: 800, status: 'bereit' });
    const lauf = starten(jonas.id, { terminId: termin.id, auftragId: auftrag.id, art: 'arbeit', datum: TAG, uhr: '08:05' });

    const bericht = berichtLesen(
      'Heizkörper im Wohnzimmer getauscht. Zusätzlich das Thermostatventil erneuert, hat eine Stunde länger gedauert. Drei Meter Kupferrohr und zwei Stück Thermostatkopf verbraucht. Alles erledigt.',
    );
    const plan = planen(termin.id, bericht, SPAETER, jonas.id)!;
    expect(plan.zeit).toMatchObject({ start: 485, ende: 780, laufendId: lauf.id });

    const ereignisse: string[] = [];
    const aus = on('einsatz.*', (e) => ereignisse.push(e.typ));
    const e = uebernehmen(plan);
    aus();

    // Zeit: Stempeluhr zum genannten Ende gestoppt (Planende 12:00 + 1 Stunde)
    expect(db.zeiten.get(lauf.id)).toMatchObject({ start: '08:05', ende: '13:00' });
    expect(e.zeitId).toBe(lauf.id);
    // Material: geplantes Kupferrohr ist verbraucht, Thermostatkopf neu mit Artikel und EK
    expect(db.material.get(geplant.id)).toMatchObject({ status: 'verbraucht', menge: 3, datum: TAG });
    const neu = db.material.where((m) => m.artikelId === kopf.id);
    expect(neu).toMatchObject([{ menge: 2, einheit: 'Stk', ek: 1500, status: 'verbraucht', auftragId: auftrag.id }]);
    // Nachtrag wartet auf Freigabe, eine Stunde zum Stundensatz
    expect(zusatzleistungen.where((z) => z.auftragId === auftrag.id)).toMatchObject([{ text: 'Das Thermostatventil erneuert', berechnung: 'stunden', menge: 1, einzelpreis: 6000, status: 'offen' }]);
    // Bericht mit Tätigkeiten, Zeit und Material
    const b = berichte.get(e.berichtId)!;
    expect(b.terminId).toBe(termin.id);
    expect(b.taetigkeiten).toBe('- Heizkörper im Wohnzimmer getauscht\n- Zusätzlich: Das Thermostatventil erneuert');
    expect(b.zeitIds).toContain(lauf.id);
    expect(b.materialIds).toEqual(expect.arrayContaining(e.materialIds));
    // Baustellendokumentation am Auftrag, verknüpft mit dem Bericht
    expect(db.dokumente.get(e.dokumentId)).toMatchObject({ art: 'notiz', auftragId: auftrag.id, bezug: { typ: 'berichte', id: b.id }, tags: ['Baustellenbericht'] });
    // Einsatz beendet, Event genau einmal, Zeitstrahl am Auftrag
    expect(db.termine.get(termin.id)?.status).toBe('erledigt');
    expect(ereignisse).toEqual(['einsatz.beendet']);
    expect(zeitstrahl({ typ: 'auftraege', id: auftrag.id }).some((x) => x.typ === VERMERK_ABSCHLUSS)).toBe(true);
    expect(schonUebernommen(termin.id)).toBe(true);

    // Kein zweites Mal
    const vorher = { m: db.material.all().length, z: zusatzleistungen.all().length, d: db.dokumente.all().length, b: berichte.all().length };
    expect(() => uebernehmen(plan)).toThrow(/schon abgeschlossen/);
    expect({ m: db.material.all().length, z: zusatzleistungen.all().length, d: db.dokumente.all().length, b: berichte.all().length }).toEqual(vorher);
  });

  it('bucht ohne Stempeluhr nach Plan, meldet Probleme an Chef und Büro', () => {
    const { jonas, chef, t } = aufbauen();
    setzeIch(jonas.id);
    const termin = t('08:00', '12:00', [jonas.id], { status: 'vor_ort' });
    const plan = planen(termin.id, berichtLesen('Pumpe getauscht. Leitung im Keller undicht.'), SPAETER, jonas.id)!;
    expect(plan.status).toBe('problem');
    const e = uebernehmen(plan);
    expect(db.zeiten.get(e.zeitId)).toMatchObject({ start: '08:00', ende: '12:00', terminId: termin.id, mitarbeiterId: jonas.id, art: 'arbeit' });
    const h = offeneHinweise({ rolle: chef.rolle, mitarbeiterId: chef.id }).find((x) => x.hinweisId === e.hinweisId);
    expect(h?.titel).toBe('Problem beim Einsatz: Wartung');
    expect(h?.text).toContain('Leitung im Keller undicht');
    expect(offeneHinweise({ rolle: jonas.rolle, mitarbeiterId: jonas.id }).some((x) => x.hinweisId === e.hinweisId)).toBe(false);
  });

  it('legt bei „offen“ eine Aufgabe für die Restarbeiten an', () => {
    const { jonas, auftrag, t } = aufbauen();
    setzeIch(jonas.id);
    const termin = t('08:00', '12:00', [jonas.id], { status: 'vor_ort' });
    const e = uebernehmen(planen(termin.id, berichtLesen('Leitungen verlegt. Muss morgen nochmal kommen.'), SPAETER, jonas.id)!);
    expect(db.aufgaben.get(e.aufgabeId)).toMatchObject({ titel: 'Restarbeiten: Wartung', auftragId: auftrag.id, erledigt: false, notiz: 'Muss morgen nochmal kommen' });
  });

  it('verlangt die Stunden einer Zusatzarbeit, wenn keine gesagt wurden – vorher wird nichts geschrieben', () => {
    const { jonas, t } = aufbauen();
    setzeIch(jonas.id);
    const termin = t('08:00', '12:00', [jonas.id], { status: 'vor_ort' });
    const plan = planen(termin.id, berichtLesen('Außerdem die Klingel repariert'), SPAETER, jonas.id)!;
    expect(() => uebernehmen(plan)).toThrow(/Zusatzarbeit/);
    expect(db.zeiten.all()).toEqual([]);
    expect(schonUebernommen(termin.id)).toBe(false);
    const e = uebernehmen(plan, [0.5]);
    expect(zusatzleistungen.get(e.zusatzIds[0])?.menge).toBe(0.5);
  });

  it('meldet ein Problem direkt vom Einsatz', () => {
    const { jonas, t } = aufbauen();
    setzeIch(jonas.id);
    const termin = t('08:00', '12:00', [jonas.id]);
    expect(problemMelden(termin.id, '   ')).toBeUndefined();
    const id = problemMelden(termin.id, 'Material fehlt');
    expect(db.hinweise.get(id)).toMatchObject({ art: 'problem', fuerRollen: ['chef', 'buero'], status: 'offen' });
    expect(db.hinweise.get(id)?.text).toBe('Material fehlt (gemeldet von Jonas)');
    // dieselbe Meldung zweimal → ein Hinweis
    expect(problemMelden(termin.id, 'Material fehlt')).toBe(id);
  });
});
