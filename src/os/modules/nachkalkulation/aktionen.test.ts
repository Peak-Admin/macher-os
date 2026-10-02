import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { minutenAnpassen, starteNachkalkulationsAutomation } from './aktionen';

describe('Automation: Nachkalkulation bei erledigt', () => {
  it('legt einen Hinweis an und protokolliert in „Erledigt“', () => {
    const m = db.mitarbeiter.create({ vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 4000, aktiv: true });
    const a = db.auftraege.create({ nummer: 'A-T-1', titel: 'Test', art: 'projekt', phase: 'in_arbeit', kundeId: 'k', geplanteStunden: 4 });
    db.zeiten.create({ mitarbeiterId: m.id, auftragId: a.id, datum: '2026-09-01', start: '07:00', ende: '13:00', pauseMinuten: 0, art: 'arbeit' });
    const stopp = starteNachkalkulationsAutomation();
    db.auftraege.update(a.id, { phase: 'erledigt' });
    db.auftraege.update(a.id, { titel: 'Test 2' }); // kein zweiter Hinweis
    stopp();
    const h = db.hinweise.where((x) => x.schluessel === `nachkalkulation:${a.id}`);
    expect(h).toHaveLength(1);
    expect(h[0].titel).toContain('Über Plan');
    expect(h[0].text).toContain('6 h gebraucht, geplant waren 4 h');
    expect(db.erledigungen.where((e) => e.bezug?.id === a.id)).toHaveLength(1);
  });

  it('meldet fehlende Daten statt Zahlen zu erfinden', () => {
    const a = db.auftraege.create({ nummer: 'A-T-2', titel: 'Leer', art: 'kundendienst', phase: 'abrechnung', kundeId: 'k' });
    const stopp = starteNachkalkulationsAutomation();
    db.auftraege.update(a.id, { phase: 'erledigt' });
    stopp();
    expect(db.hinweise.where((x) => x.schluessel === `nachkalkulation:${a.id}`)[0].titel).toContain('nicht möglich');
  });
});

describe('Lerneffekt anwenden', () => {
  it('passt die Minuten der Leistung an', () => {
    const l = db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, minuten: 30, aktiv: true });
    minutenAnpassen({ leistungId: l.id, minuten: 39 });
    expect(db.leistungen.get(l.id)?.minuten).toBe(39);
    minutenAnpassen({ leistungId: l.id, minuten: 0 });
    expect(db.leistungen.get(l.id)?.minuten).toBe(39);
  });
});
