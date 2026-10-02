import { beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, vermerken, zeitstrahl, zuruecksetzen } from './db';
import {
  aufgabeEinstufen,
  aufraeumen,
  digest,
  kontext,
  melden,
  posteingang,
  pushErlaubt,
  REGELN,
  schliessen,
  setzePushVersand,
  spaeter,
  spaeterAm,
  spaeterOptionen,
  starteAufmerksamkeit,
  zustand,
  type PushAuftrag,
} from './aufmerksamkeit';
import { setzeEinstellung } from './einstellungen';
import type { Benachrichtigung, Mitarbeiter } from './objects';

const T0 = new Date('2026-10-05T08:00:00.000Z');
const plus = (h: number) => new Date(T0.getTime() + h * 3_600_000);

describe('Aufmerksamkeit (Inbox-Engine)', () => {
  let chef: Mitarbeiter;
  let buero: Mitarbeiter;
  let monteur: Mitarbeiter;
  let kundeId: string;
  let stopp: () => void = () => {};

  beforeEach(() => {
    stopp();
    zuruecksetzen();
    setAktuellerNutzer(undefined);
    setzePushVersand(undefined);
    const m = (vorname: string, rolle: Mitarbeiter['rolle']) => db.mitarbeiter.create({ vorname, nachname: 'Test', rolle, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    chef = m('Max', 'chef');
    buero = m('Bea', 'buero');
    monteur = m('Jonas', 'monteur');
    kundeId = db.kunden.create({ art: 'privat', name: 'Müller', ansprechpartner: [] }).id;
    stopp = starteAufmerksamkeit();
  });

  const inbox = (ich: Mitarbeiter, jetzt = T0) => posteingang({ meldungen: db.benachrichtigungen.all(), ich, jetzt });
  const urlaub = () => db.abwesenheiten.create({ mitarbeiterId: monteur.id, art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'beantragt' });

  // ---------------------------------------------------------------- Stufen und Lebensdauer

  it('info verfällt nach der Lebensdauer der Art, Aktivität nach Standard (12 h) – ohne Hintergrundjob (auch nach Offline-Zeit)', () => {
    const [info] = melden('Zahlung eingegangen', { art: 'zahlung.eingegangen', fuer: chef.id, jetzt: T0 });
    const [akt] = melden('Status geändert', { art: 'auftrag.schritt', fuer: chef.id, jetzt: T0 });
    expect(info.ablaufAm).toBe(plus(REGELN['zahlung.eingegangen'].ttlStunden!).toISOString());
    expect(zustand(info, plus(47))).toBe('aktiv');
    expect(zustand(info, plus(48))).toBe('abgelaufen');
    expect(zustand(akt, plus(11))).toBe('aktiv');
    expect(zustand(akt, plus(12))).toBe('abgelaufen');
    // Tage später geöffnet: einfach weg
    expect(inbox(chef, plus(24 * 5)).info).toHaveLength(0);
  });

  it('Aktion und Jetzt verschwinden nicht wegen ihres Alters', () => {
    const ab = urlaub();
    const [b] = melden('Urlaub beantragt', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab.id }, fuer: chef.id, jetzt: T0 });
    expect(b).toMatchObject({ stufe: 'aktion', bisGeloest: true, ablaufAm: undefined });
    expect(zustand(b, plus(24 * 60))).toBe('aktiv');
  });

  it('ausdrückliches Ende der Relevanz gilt auch für Aktionen (Material fehlt – Einsatz vorbei)', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'beauftragt', kundeId });
    const [b] = melden('Material fehlt', { art: 'material.fehlt', bezug: { typ: 'auftraege', id: a.id }, ablaufAm: plus(24).toISOString(), jetzt: T0 });
    expect(b.stufe).toBe('jetzt');
    expect(zustand(b, plus(23))).toBe('aktiv');
    expect(zustand(b, plus(25))).toBe('abgelaufen');
  });

  // ---------------------------------------------------------------- Zustand schlägt Zeit

  it('gelöster Zustand entfernt die Meldung sofort – bei allen, die dieselbe Freigabe hatten', () => {
    const ab = urlaub();
    melden('Urlaub beantragt', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab.id }, jetzt: T0 });
    expect(inbox(chef).zaehler).toBe(1);
    expect(inbox(buero).zaehler).toBe(1);
    setAktuellerNutzer(buero.id);
    db.abwesenheiten.update(ab.id, { status: 'genehmigt' });
    expect(inbox(chef).zaehler).toBe(0);
    expect(inbox(buero).zaehler).toBe(0);
    // ereignisgetrieben festgehalten – andere Geräte sehen `geloestAm`
    expect(db.benachrichtigungen.all().every((b) => !!b.geloestAm)).toBe(true);
  });

  it('Zustand schon gelöst, bevor die Meldung entsteht → keine Meldung', () => {
    const ab = db.abwesenheiten.create({ mitarbeiterId: monteur.id, art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'genehmigt' });
    expect(melden('Urlaub beantragt', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab.id }, fuer: chef.id })).toHaveLength(0);
  });

  it('Objekt gelöscht oder Termin abgesagt → Meldung weg', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Anfrage', art: 'kundendienst', phase: 'anfrage', kundeId });
    const [b] = melden('Neue Anfrage', { art: 'anfrage.neu', bezug: { typ: 'auftraege', id: a.id }, fuer: chef.id, jetzt: T0 });
    db.auftraege.remove(a.id);
    expect(zustand(db.benachrichtigungen.get(b.id)!, T0)).toBe('geloest');
    const t = db.termine.create({ titel: 'Online', art: 'besichtigung', start: plus(48).toISOString(), ende: plus(49).toISOString(), mitarbeiterIds: [], status: 'geplant' } as never);
    const [tb] = melden('Online gebucht', { art: 'termin.online_gebucht', bezug: { typ: 'termine', id: t.id }, fuer: chef.id, jetzt: T0 });
    expect(zustand(tb, T0)).toBe('aktiv');
    db.termine.update(t.id, { status: 'abgesagt' });
    expect(zustand(db.benachrichtigungen.get(tb.id)!, T0)).toBe('geloest');
  });

  it('Stufe folgt dem Zustand: zugewiesene Aufgabe erst zur Kenntnis, überfällig Aktion, kritisch Jetzt – und verfällt dann nicht', () => {
    const a = db.aufgaben.create({ titel: 'Leiter', zustaendigId: monteur.id, erledigt: false, prioritaet: 'normal', faellig: '2026-10-06' });
    const [b] = melden('Neue Aufgabe', { art: 'aufgabe.zugewiesen', bezug: { typ: 'aufgaben', id: a.id }, fuer: monteur.id, jetzt: T0 });
    expect(inbox(monteur).info).toHaveLength(1);
    expect(inbox(monteur).zaehler).toBe(0);
    // vier Tage später: Info-Lebensdauer wäre vorbei, aber die Aufgabe ist überfällig → Aktion
    expect(zustand(b, plus(96))).toBe('aktiv');
    expect(inbox(monteur, plus(96)).aktion).toHaveLength(1);
    db.aufgaben.update(a.id, { prioritaet: 'hoch' });
    expect(inbox(monteur, plus(96)).jetzt).toHaveLength(1);
    db.aufgaben.update(a.id, { erledigt: true });
    expect(inbox(monteur, plus(96)).zaehler).toBe(0);
  });

  it('Aufgaben-Einstufung nach Regelwerk', () => {
    const k = kontext(T0);
    const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'x', art: 'projekt', phase: 'in_arbeit', kundeId, dringend: true });
    expect(aufgabeEinstufen({ erledigt: false, prioritaet: 'normal' }, k)).toBe('aktivitaet');
    expect(aufgabeEinstufen({ erledigt: false, prioritaet: 'normal', faellig: k.heute }, k)).toBe('info');
    expect(aufgabeEinstufen({ erledigt: false, prioritaet: 'normal', faellig: '2026-10-01' }, k)).toBe('aktion');
    expect(aufgabeEinstufen({ erledigt: false, prioritaet: 'normal', faellig: '2026-10-01', auftragId: auftrag.id }, k)).toBe('jetzt');
    expect(aufgabeEinstufen({ erledigt: true, prioritaet: 'hoch', faellig: '2026-10-01' }, k)).toBe('ignorieren');
  });

  // ---------------------------------------------------------------- Später

  it('Später: weg aus Inbox und Zähler, kommt wieder – aber nur, wenn der Grund noch besteht', () => {
    const ab = urlaub();
    const ab2 = db.abwesenheiten.create({ mitarbeiterId: monteur.id, art: 'urlaub', von: '2026-11-02', bis: '2026-11-03', status: 'beantragt' });
    const [b1] = melden('Antrag 1', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab.id }, fuer: chef.id, jetzt: T0 });
    const [b2] = melden('Antrag 2', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab2.id }, fuer: chef.id, jetzt: T0 });
    spaeter([b1.id, b2.id], plus(1).toISOString());
    expect(inbox(chef).zaehler).toBe(0);
    expect(inbox(chef).spaeter).toHaveLength(2);
    // währenddessen erledigt jemand Antrag 2
    db.abwesenheiten.update(ab2.id, { status: 'abgelehnt' });
    const danach = inbox(chef, plus(2));
    expect(danach.zaehler).toBe(1);
    expect(danach.aktion[0].eintraege[0].titel).toBe('Antrag 1');
    expect(danach.spaeter).toHaveLength(0);
  });

  it('Später-Zeitpunkte', () => {
    const vormittag = new Date(2026, 9, 5, 9, 30); // Montag
    const o = spaeterOptionen(vormittag);
    expect(o.map((x) => x.id)).toEqual(['stunde', 'nachmittag', 'morgen', 'woche']);
    expect(new Date(o[1].bis).getHours()).toBe(15);
    expect(new Date(o[2].bis).getDate()).toBe(6);
    expect(new Date(o[3].bis).getDay()).toBe(1);
    expect(new Date(o[3].bis).getDate()).toBe(12);
    expect(spaeterOptionen(new Date(2026, 9, 5, 16)).map((x) => x.id)).not.toContain('nachmittag');
    expect(new Date(spaeterAm('2026-10-20')).getHours()).toBe(7);
  });

  // ---------------------------------------------------------------- Zähler, Bündel, Inbox

  it('Zähler = aktuell relevante Einträge, nicht Ereignisse: 47 Aktivitäten + 2 Aktionen → 2', () => {
    for (let i = 0; i < 47; i++) melden(`Feld ${i} geändert`, { art: 'auftrag.schritt', fuer: chef.id, schluessel: `x${i}`, jetzt: T0 });
    const a1 = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'anfrage', kundeId });
    melden('Neue Anfrage', { art: 'anfrage.neu', bezug: { typ: 'auftraege', id: a1.id }, fuer: chef.id, jetzt: T0 });
    melden('Urlaub', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: urlaub().id }, fuer: chef.id, jetzt: T0 });
    const i = inbox(chef);
    expect(i.zaehler).toBe(2);
    expect(i.aktivitaet).toHaveLength(47);
    expect(i.info).toHaveLength(0);
  });

  it('bündelt viele Updates zum selben Objekt und hebt die Aktion hervor', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Müller', art: 'projekt', phase: 'beauftragt', kundeId });
    const g = { typ: 'auftraege' as const, id: a.id };
    melden('Lisa hat kommentiert', { art: 'kommentar.neu', stufe: 'info', gruppe: g, fuer: chef.id, schluessel: 'k1', jetzt: T0 });
    melden('Max hat kommentiert', { art: 'kommentar.neu', stufe: 'info', gruppe: g, fuer: chef.id, schluessel: 'k2', jetzt: T0 });
    melden('Plan.pdf hochgeladen', { art: 'datei.hochgeladen', stufe: 'info', gruppe: g, fuer: chef.id, jetzt: T0 });
    melden('Zum Einplanen', { art: 'auftrag.einplanen', bezug: g, fuer: chef.id, jetzt: T0 });
    const i = inbox(chef);
    expect(i.aktion).toHaveLength(1);
    expect(i.info).toHaveLength(0);
    expect(i.aktion[0]).toMatchObject({ titel: 'Auftrag Müller', zusammenfassung: '1 Auftrag zum Einplanen · 2 Kommentare · 1 Datei' });
    expect(i.aktion[0].aktion?.titel).toBe('Zum Einplanen');
    expect(i.zaehler).toBe(1);
  });

  it('Live-Hinweis und Meldung zum selben Objekt: nur eine Aktion', () => {
    const ab = urlaub();
    melden('Urlaub beantragt', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: ab.id }, fuer: chef.id, jetzt: T0 });
    const i = posteingang({
      meldungen: db.benachrichtigungen.all(),
      hinweise: [{ schluessel: `urlaub:${ab.id}`, art: 'freigabe', titel: 'Urlaub freigeben', bezug: { typ: 'abwesenheiten', id: ab.id }, gewicht: 80 }],
      ich: chef,
      jetzt: T0,
    });
    expect(i.zaehler).toBe(1);
    expect(i.aktion[0].eintraege[0].quelle.typ).toBe('hinweis');
  });

  it('Meldung ohne Objekt und gleichlautender Hinweis: nur einmal', () => {
    melden('5 Unterweisungen bestätigen', { art: 'unterweisung.bestaetigen', fuer: chef.id, jetzt: T0 });
    const i = posteingang({ meldungen: db.benachrichtigungen.all(), hinweise: [{ schluessel: 'u', art: 'entscheidung', titel: '5 Unterweisungen bestätigen', gewicht: 40, fuerMitarbeiterId: chef.id }], ich: chef, jetzt: T0 });
    expect(i.zaehler).toBe(1);
  });

  it('Live-Hinweise: Später je Person, Sicherheitsproblem ist „Jetzt“', () => {
    const hinweise = [
      { schluessel: 'h1', art: 'entscheidung' as const, titel: 'Variante B bestellen?', gewicht: 75 },
      { schluessel: 'h2', art: 'problem' as const, titel: 'Nicht verwenden: Leiter', gewicht: 50, sicherheit: true },
    ];
    expect(posteingang({ meldungen: [], hinweise, ich: chef, jetzt: T0 })).toMatchObject({ zaehler: 2 });
    setzeEinstellung(`aufmerksamkeit.spaeter.${chef.id}`, { h1: plus(2).toISOString() });
    const i = posteingang({ meldungen: [], hinweise, ich: chef, jetzt: T0 });
    expect(i.jetzt.map((g) => g.titel)).toEqual(['Nicht verwenden: Leiter']);
    expect(i.zaehler).toBe(1);
    expect(posteingang({ meldungen: [], hinweise, ich: buero, jetzt: T0 }).zaehler).toBe(2);
  });

  it('Team-Hinweise nur mit Grund und begrenzt – der Rest bleibt in „Braucht dich“', () => {
    const team = Array.from({ length: 30 }, (_, i) => ({ schluessel: `t${i}`, art: 'entscheidung' as const, titel: `Team ${i}`, gewicht: i < 10 ? 80 : 40 }));
    const meins = { schluessel: 'm', art: 'freigabe' as const, titel: 'Nur für dich', gewicht: 20, fuerMitarbeiterId: chef.id };
    const i = posteingang({ meldungen: [], hinweise: [...team, meins], ich: chef, jetzt: T0 });
    expect(i.zaehler).toBe(6);
    expect(i.weitereHinweise).toBe(25);
    expect(i.aktion.flatMap((g) => g.eintraege.map((e) => e.titel))).toContain('Nur für dich');
  });

  // ---------------------------------------------------------------- Deduplizierung und Idempotenz

  it('gleiche Quelle zweimal (Retry, doppelte Zustellung) → eine Meldung; gleiche Art + Objekt → zusammengefasst', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'beauftragt', kundeId });
    const n = db.nachrichten.create({ kanal: 'email', richtung: 'ein', kundeId, auftragId: a.id, text: 'Hallo', gelesen: false });
    const opts = { art: 'nachricht.kunde', bezug: { typ: 'nachrichten' as const, id: n.id }, fuer: chef.id, quelleId: `nachricht:${n.id}`, jetzt: T0 };
    melden('Nachricht', opts);
    melden('Nachricht', opts);
    melden('Nachricht', opts);
    expect(db.benachrichtigungen.all()).toHaveLength(1);
    // auch nach „Erledigt“ kommt dieselbe Quelle nicht wieder
    schliessen([db.benachrichtigungen.all()[0].id]);
    melden('Nachricht', opts);
    expect(db.benachrichtigungen.all()).toHaveLength(1);
    // gleiche Art + Objekt ohne Quelle: ein Eintrag mit Zähler
    melden('Zahlung', { art: 'zahlung.eingegangen', fuer: chef.id, schluessel: 'z', jetzt: T0 });
    melden('Zahlung 2', { art: 'zahlung.eingegangen', fuer: chef.id, schluessel: 'z', jetzt: T0 });
    const z = db.benachrichtigungen.where((b) => b.schluessel === 'z');
    expect(z).toHaveLength(1);
    expect(z[0].anzahl).toBe(2);
  });

  it('nur echte Empfänger: nie der Auslöser, ohne Angabe Chef und Büro (je eine eigene Meldung mit Grund)', () => {
    melden('Etwas', { stufe: 'info', ausloeser: chef.id, jetzt: T0 });
    const alle = db.benachrichtigungen.all();
    expect(alle.map((b) => b.fuerMitarbeiterId)).toEqual([buero.id]);
    expect(alle[0].grund).toBe('Du bist im Büro zuständig.');
  });

  // ---------------------------------------------------------------- Rechte

  it('Rechte gelten beim Lesen: Geld-Meldungen nur mit Geld-Recht, inaktive Nutzer sehen nichts, Rollenwechsel zählt sofort', () => {
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId, titel: 'x', positionen: [], status: 'versendet', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 } as never);
    expect(melden('Zahlung', { art: 'zahlung.eingegangen', bezug: { typ: 'rechnungen', id: r.id }, fuer: monteur.id, jetzt: T0 })).toHaveLength(0);
    melden('Zahlung', { art: 'zahlung.eingegangen', bezug: { typ: 'rechnungen', id: r.id }, fuer: buero.id, jetzt: T0 });
    expect(inbox(buero).info).toHaveLength(1);
    // Rolle wechselt zu Monteur → kein Geld-Recht mehr
    const herabgestuft = db.mitarbeiter.update(buero.id, { rolle: 'monteur' })!;
    expect(inbox(herabgestuft).info).toHaveLength(0);
    const inaktiv = db.mitarbeiter.update(buero.id, { rolle: 'buero', aktiv: false })!;
    expect(inbox(inaktiv).info).toHaveLength(0);
  });

  it('nicht mehr zuständig (z. B. Gerät abgegeben) → Meldung weg', () => {
    const g = db.betriebsmittel.create({ name: 'Leiter', art: 'werkzeug', mitarbeiterId: monteur.id, status: 'im_einsatz', naechstePruefung: '2026-09-01' } as never);
    const [b] = melden('Nicht verwenden: Leiter', { art: 'pruefung.ueberfaellig', bezug: { typ: 'betriebsmittel', id: g.id }, fuer: monteur.id, jetzt: T0 });
    expect(b.stufe).toBe('jetzt');
    db.betriebsmittel.update(g.id, { mitarbeiterId: undefined } as never);
    expect(zustand(db.benachrichtigungen.get(b.id)!, T0)).toBe('geloest');
  });

  // ---------------------------------------------------------------- Push

  it('Push nur bei Jetzt oder zeitkritischer Aktion – nie bei Info oder Aktivität', () => {
    const gesendet: PushAuftrag[] = [];
    setzePushVersand((p) => gesendet.push(p));
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Notfall', art: 'kundendienst', phase: 'anfrage', kundeId, dringend: true });
    melden('Dringende Anfrage', { art: 'anfrage.neu', bezug: { typ: 'auftraege', id: a.id }, fuer: chef.id, jetzt: T0 });
    melden('Zahlung', { art: 'zahlung.eingegangen', fuer: chef.id, jetzt: T0 });
    melden('Datei', { art: 'datei.hochgeladen', fuer: chef.id, jetzt: T0 });
    melden('Urlaub', { art: 'abwesenheit.beantragt', bezug: { typ: 'abwesenheiten', id: urlaub().id }, fuer: chef.id, jetzt: T0 });
    expect(gesendet.map((p) => [p.titel, p.stufe])).toEqual([['Dringende Anfrage', 'jetzt']]);
    expect(pushErlaubt('aktion', REGELN['termine.umplanen'])).toBe(true);
    expect(pushErlaubt('info')).toBe(false);
  });

  // ---------------------------------------------------------------- Aufräumen, Audit, Digest

  it('Aufräumen entfernt alte erledigte Meldungen – der Zeitstrahl des Objekts bleibt vollständig', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'anfrage', kundeId });
    vermerken({ typ: 'auftraege', id: a.id }, 'notiz', 'Kunde angerufen');
    const verlauf = zeitstrahl({ typ: 'auftraege', id: a.id }).length;
    const [b] = melden('Neue Anfrage', { art: 'anfrage.neu', bezug: { typ: 'auftraege', id: a.id }, fuer: chef.id, jetzt: T0 });
    db.auftraege.update(a.id, { phase: 'angebot' });
    expect(db.benachrichtigungen.get(b.id)?.geloestAm).toBeTruthy();
    aufraeumen(new Date(Date.now() + 15 * 86_400_000));
    expect(db.benachrichtigungen.get(b.id)).toBeUndefined();
    expect(zeitstrahl({ typ: 'auftraege', id: a.id }).length).toBeGreaterThan(verlauf);
  });

  it('Digest bündelt Nicht-Dringendes: „2 Zahlungen · 1 neue Anfrage“', () => {
    melden('Zahlung 1', { art: 'zahlung.eingegangen', fuer: chef.id, schluessel: 'a', jetzt: T0 });
    melden('Zahlung 2', { art: 'zahlung.eingegangen', fuer: chef.id, schluessel: 'b', jetzt: T0 });
    melden('Info', { stufe: 'info', fuer: chef.id, jetzt: T0 });
    const d = digest(db.benachrichtigungen.all(), '2000-01-01T00:00:00.000Z');
    expect(d.zeilen).toEqual(['2 Zahlungen', '1 Meldung']);
    expect(d.aktionNoetig).toBe(0);
  });

  it('Bestandsdaten aus dem alten Gelesen-Modell: archiviert = geschlossen, gelesen = zur Kenntnis, verfällt', () => {
    const alt = (x: Partial<Benachrichtigung>) => db.benachrichtigungen.create({ titel: 'alt', fuerMitarbeiterId: chef.id, ...x });
    alt({ gelesen: true, archiviert: true });
    alt({ gelesen: false, wichtig: true });
    alt({ gelesen: true, wichtig: true });
    const jetzt = new Date();
    const i = posteingang({ meldungen: db.benachrichtigungen.all(), ich: chef, jetzt });
    expect(i.zaehler).toBe(1);
    expect(i.info).toHaveLength(1);
    expect(posteingang({ meldungen: db.benachrichtigungen.all(), ich: chef, jetzt: new Date(jetzt.getTime() + 49 * 3_600_000) }).info).toHaveLength(0);
  });
});
