import { beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, zuruecksetzen } from '@core/db';
import { emit } from '@core/events';
import { meinPosteingang } from '@core/macher';
import { starteAufmerksamkeit } from '@core/aufmerksamkeit';
import { benachrichtigenAutomation, faelligeAufgaben } from './daten';
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
    const a = benachrichtigenAutomation.start();
    const b = starteAufmerksamkeit();
    stopp = () => (a(), b());
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

  it('Angebot angenommen: verschwindet, sobald der Auftrag eingeplant ist – ohne dass jemand die Inbox öffnet', () => {
    const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'angebot', kundeId });
    const an = db.angebote.create({ nummer: 'AN-1', auftragId: auftrag.id, kundeId, titel: 'Bad', positionen: [], status: 'versendet', datum: '2026-10-01', gueltigBis: '2026-10-30', version: 1 });
    db.angebote.update(an.id, { status: 'angenommen' });
    expect(meinPosteingang(chef).zaehler).toBe(1);
    db.termine.create({ titel: 'Bad', art: 'einsatz', auftragId: auftrag.id, start: '2026-10-12T07:00:00.000Z', ende: '2026-10-12T15:00:00.000Z', mitarbeiterIds: [jonas.id], status: 'geplant' } as never);
    expect(meinPosteingang(chef).zaehler).toBe(0);
    expect(fuer(chef.id)[0].geloestAm).toBeTruthy();
  });

  it('Kundennachricht: gelesen = weg; mehrere Nachrichten zum Auftrag werden gebündelt', () => {
    const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'Bad Müller', art: 'projekt', phase: 'beauftragt', kundeId });
    const n1 = db.nachrichten.create({ kanal: 'email', richtung: 'ein', kundeId, auftragId: auftrag.id, text: 'Frage 1', gelesen: false });
    db.nachrichten.create({ kanal: 'email', richtung: 'ein', kundeId, auftragId: auftrag.id, text: 'Frage 2', gelesen: false });
    const inbox = meinPosteingang(chef);
    expect(inbox.aktion).toHaveLength(1);
    expect(inbox.aktion[0]).toMatchObject({ titel: 'Auftrag Bad Müller', zusammenfassung: '2 Kundennachrichten' });
    db.nachrichten.update(n1.id, { gelesen: true });
    expect(meinPosteingang(chef).zaehler).toBe(1);
  });

  it('Aufgabe delegiert: der alte Eintrag verschwindet, der neue Zuständige bekommt ihn', () => {
    const lisa = db.mitarbeiter.create({ vorname: 'Lisa', nachname: 'Klein', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    setAktuellerNutzer(chef.id);
    const a = db.aufgaben.create({ titel: 'Leiter prüfen', zustaendigId: jonas.id, erledigt: false, prioritaet: 'normal', faellig: '2026-01-01' });
    expect(meinPosteingang(jonas).zaehler).toBe(1);
    db.aufgaben.update(a.id, { zustaendigId: lisa.id });
    expect(meinPosteingang(jonas).zaehler).toBe(0);
    expect(meinPosteingang(lisa).zaehler).toBe(1);
  });

  it('überfällige Aufgaben einmal je Fälligkeit – auch bei wiederholter Prüfung', () => {
    db.aufgaben.create({ titel: 'Eigene Aufgabe', zustaendigId: jonas.id, erledigt: false, prioritaet: 'hoch', faellig: '2026-01-01' });
    db.benachrichtigungen.all().forEach((b) => db.benachrichtigungen.purge(b.id));
    expect(faelligeAufgaben()).toBe(1);
    expect(faelligeAufgaben()).toBe(0);
    expect(meinPosteingang(jonas).jetzt).toHaveLength(1);
  });
});
