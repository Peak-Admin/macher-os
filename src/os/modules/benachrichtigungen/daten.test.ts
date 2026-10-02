import { beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, zuruecksetzen } from '@core/db';
import { emit } from '@core/events';
import type { Benachrichtigung } from '@core/objects';
import { archivieren, benachrichtigenAutomation, fuerMich, meldungsGruppen, zurueckholen } from './daten';
import abwesenheitenModul from '@modules/abwesenheiten/index';

describe('Benachrichtigungen', () => {
  let stopp: () => void = () => {};
  let chef: ReturnType<typeof db.mitarbeiter.create>;
  let jonas: ReturnType<typeof db.mitarbeiter.create>;
  let kundeId: string;

  beforeEach(() => {
    stopp();
    zuruecksetzen();
    setAktuellerNutzer(undefined);
    chef = db.mitarbeiter.create({ vorname: 'Max', nachname: 'Macher', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    kundeId = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [] }).id;
    stopp = benachrichtigenAutomation.start();
  });

  const fuer = (id: string) => db.benachrichtigungen.where((b) => b.fuerMitarbeiterId === id);

  it('meldet neue Anfragen und Kundennachrichten an Chef/Büro, nicht an Monteure', () => {
    db.auftraege.create({ nummer: 'A-1', titel: 'Steckdose defekt', art: 'kundendienst', phase: 'anfrage', kundeId });
    db.nachrichten.create({ kanal: 'email', richtung: 'ein', kundeId, text: 'Wann kommen Sie?', gelesen: false });
    db.nachrichten.create({ kanal: 'intern', richtung: 'intern', text: 'Intern', gelesen: false });
    expect(fuer(chef.id).map((b) => b.titel)).toEqual(['Neue Anfrage: Steckdose defekt', 'Nachricht von Familie Hoffmann']);
    expect(fuer(jonas.id)).toHaveLength(0);
  });

  it('meldet nicht bei jeder Änderung und nicht dem Auslöser', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'beauftragt', kundeId });
    db.auftraege.update(a.id, { titel: 'Bad neu' });
    expect(db.benachrichtigungen.all()).toHaveLength(0);
    setAktuellerNutzer(chef.id);
    db.auftraege.create({ nummer: 'A-2', titel: 'Selbst angelegt', art: 'kundendienst', phase: 'anfrage', kundeId });
    expect(db.benachrichtigungen.all()).toHaveLength(0);
  });

  it('meldet Angebot angenommen nur einmal, auch bei doppeltem Ereignis', () => {
    const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'angebot', kundeId, verantwortlichId: jonas.id });
    const an = db.angebote.create({ nummer: 'AN-1', auftragId: auftrag.id, kundeId, titel: 'Bad', positionen: [], status: 'versendet', datum: '2026-10-01', gueltigBis: '2026-10-30', version: 1 });
    const neu = db.angebote.update(an.id, { status: 'angenommen' })!;
    emit({ typ: 'angebot.angenommen', objekt: neu });
    db.angebote.update(an.id, { titel: 'Bad 2' });
    expect(fuer(chef.id)).toHaveLength(1);
    expect(fuer(jonas.id)).toHaveLength(1);
  });

  it('meldet Urlaubsantrag an Chef; Bescheid und Krankmeldung kommen genau einmal (vom Modul Abwesenheiten)', () => {
    const aus = (abwesenheitenModul.automationen ?? []).map((a) => a.start());
    const ab = db.abwesenheiten.create({ mitarbeiterId: jonas.id, art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'beantragt' });
    expect(fuer(chef.id).map((b) => b.titel)).toEqual(['Urlaub beantragt: Jonas Becker']);
    db.abwesenheiten.update(ab.id, { status: 'genehmigt' });
    expect(fuer(jonas.id)).toHaveLength(1);
    db.abwesenheiten.create({ mitarbeiterId: jonas.id, art: 'krank', von: '2026-10-20', bis: '2026-10-20', status: 'genehmigt' });
    expect(fuer(chef.id)).toHaveLength(2);
    aus.forEach((f) => f?.());
  });

  it('meldet Zahlungseingang an Leute mit Geld-Recht und neue Aufgaben an den Zuständigen', () => {
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId, titel: 'x', positionen: [], status: 'versendet', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    db.zahlungen.create({ rechnungId: r.id, betrag: 12345, datum: '2026-10-02', art: 'ueberweisung' });
    expect(fuer(chef.id)[0].titel).toBe('Zahlung eingegangen: 123,45 €');
    setAktuellerNutzer(chef.id);
    db.aufgaben.create({ titel: 'Leiter prüfen', zustaendigId: jonas.id, erledigt: false, prioritaet: 'normal' });
    expect(fuer(jonas.id)[0].titel).toBe('Neue Aufgabe für dich: Leiter prüfen');
  });

  it('filtert für mich und sortiert neueste zuerst', () => {
    db.benachrichtigungen.create({ titel: 'alt', gelesen: false, fuerMitarbeiterId: jonas.id });
    db.benachrichtigungen.create({ titel: 'alle', gelesen: false });
    db.benachrichtigungen.create({ titel: 'chef', gelesen: false, fuerMitarbeiterId: chef.id });
    expect(fuerMich(db.benachrichtigungen.all(), jonas.id).map((b) => b.titel).sort()).toEqual(['alle', 'alt']);
  });

  it('gruppiert Meldungen zum selben Objekt zu einem Eintrag mit Zähler, neueste zuerst', () => {
    const bezug = { typ: 'auftraege' as const, id: 'a1' };
    const b = (titel: string, zeit: string, extra: Partial<Benachrichtigung> = {}): Benachrichtigung => ({ id: titel, titel, gelesen: true, erstelltAm: `2026-10-01T${zeit}:00.000Z`, geaendertAm: '', ...extra });
    const liste = [b('eins', '08:00', { bezug }), b('zwei', '09:00', { bezug, gelesen: false }), b('drei', '07:00', { bezug, wichtig: true }), b('ohne Objekt', '10:00')];
    const g = meldungsGruppen(liste, 'posteingang');
    expect(g.map((x) => [x.neueste.titel, x.eintraege.length])).toEqual([['ohne Objekt', 1], ['zwei', 3]]);
    expect(g[1]).toMatchObject({ ungelesen: true, wichtig: true });
    expect(g[0].ungelesen).toBe(false);
  });

  it('zeigt beim Öffnen Neues weiter als neu, obwohl es schon gelesen gespeichert ist', () => {
    const b = db.benachrichtigungen.create({ titel: 'x', gelesen: true });
    expect(meldungsGruppen([b], 'posteingang', new Set([b.id]))[0].ungelesen).toBe(true);
  });

  it('archiviert (gilt als gelesen) und holt zurück', () => {
    const bezug = { typ: 'kunden' as const, id: 'k1' };
    db.benachrichtigungen.create({ titel: 'a', gelesen: false, bezug });
    db.benachrichtigungen.create({ titel: 'b', gelesen: false, bezug });
    const [g] = meldungsGruppen(db.benachrichtigungen.all(), 'posteingang');
    archivieren(g.eintraege);
    expect(meldungsGruppen(db.benachrichtigungen.all(), 'posteingang')).toHaveLength(0);
    const archiv = meldungsGruppen(db.benachrichtigungen.all(), 'archiv');
    expect(archiv[0].eintraege).toHaveLength(2);
    expect(db.benachrichtigungen.all().every((x) => x.gelesen)).toBe(true);
    zurueckholen(archiv[0].eintraege);
    expect(meldungsGruppen(db.benachrichtigungen.all(), 'posteingang')[0].eintraege).toHaveLength(2);
  });
});
