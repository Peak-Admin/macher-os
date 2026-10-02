import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { abwesenheitAm, aufgabenFuer, betriebHeute, lageVon, termineAm, zeitText } from './logik';
import { tagesplanVerschicken } from './automationen';
import { aufbauen, JETZT, TAG } from './testdaten';

describe('Mein Tag', () => {
  it('zeigt nur eigene, nicht abgesagte Termine des Tages, nach Uhrzeit', () => {
    const { jonas, lukas, t } = aufbauen();
    t('13:00', '14:00', [jonas.id]);
    t('07:00', '09:00', [jonas.id, lukas.id]);
    t('10:00', '11:00', [jonas.id], { status: 'abgesagt' });
    t('08:00', '09:00', [jonas.id], {}, '2026-10-03');
    const liste = termineAm(TAG, jonas.id);
    expect(liste.map((x) => zeitText(x))).toEqual(['07:00–09:00', '13:00–14:00']);
    expect(termineAm(TAG, lukas.id)).toHaveLength(1);
    expect(termineAm(TAG)).toHaveLength(2);
  });

  it('sammelt eigene fällige Aufgaben und offene Aufgaben der heutigen Aufträge', () => {
    const { jonas, lukas, auftrag, t } = aufbauen();
    t('07:00', '09:00', [jonas.id]);
    const neu = (titel: string, x: object) => db.aufgaben.create({ titel, erledigt: false, prioritaet: 'normal', ...x });
    neu('überfällig', { zustaendigId: jonas.id, faellig: '2026-09-30' });
    neu('heute', { zustaendigId: jonas.id, faellig: TAG });
    neu('morgen', { zustaendigId: jonas.id, faellig: '2026-10-03' });
    neu('am Auftrag ohne Zuständigen', { auftragId: auftrag.id });
    neu('für Lukas', { zustaendigId: lukas.id, faellig: TAG });
    neu('erledigt', { zustaendigId: jonas.id, faellig: TAG, erledigt: true });
    expect(aufgabenFuer(jonas.id, TAG).map((a) => a.titel)).toEqual(['überfällig', 'heute', 'am Auftrag ohne Zuständigen']);
  });

  it('erkennt die Lage: vor Ort, geplant, fertig, frei, abwesend', () => {
    const { chef, jonas, lukas, t } = aufbauen();
    const a = t('09:00', '12:00', [jonas.id], { status: 'vor_ort' });
    expect(lageVon(jonas, JETZT).art).toBe('vor_ort');
    db.termine.update(a.id, { status: 'erledigt' });
    t('13:00', '14:00', [jonas.id]);
    expect(lageVon(jonas, JETZT).art).toBe('geplant');
    expect(lageVon(chef, JETZT).art).toBe('frei');
    db.abwesenheiten.create({ mitarbeiterId: lukas.id, art: 'schule', von: TAG, bis: TAG, status: 'genehmigt' });
    db.abwesenheiten.create({ mitarbeiterId: chef.id, art: 'urlaub', von: TAG, bis: TAG, status: 'beantragt' });
    expect(abwesenheitAm(chef.id, TAG)).toBeUndefined();
    expect(lageVon(lukas, JETZT)).toMatchObject({ art: 'abwesend', text: 'Berufsschule' });
    expect(betriebHeute(JETZT).map((x) => x.lage.art)).toEqual(['geplant', 'frei', 'abwesend']);
  });

  it('schickt den Tagesplan einmal am Tag und protokolliert die Schätzung', () => {
    const { jonas, lukas, t } = aufbauen();
    t('07:00', '09:00', [jonas.id, lukas.id]);
    expect(tagesplanVerschicken(new Date(2026, 9, 2, 4, 0))).toBe(0); // zu früh
    expect(tagesplanVerschicken(JETZT)).toBe(2);
    expect(tagesplanVerschicken(JETZT)).toBe(0);
    expect(db.benachrichtigungen.where((b) => b.fuerMitarbeiterId === jonas.id)).toHaveLength(1);
    const e = db.erledigungen.all();
    expect(e).toHaveLength(1);
    expect(e[0].minutenGespart).toBe(4);
  });
});
