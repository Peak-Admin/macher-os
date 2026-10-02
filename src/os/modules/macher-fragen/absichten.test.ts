/**
 * Die sechs Sätze der früheren Action Engine – jetzt über den Macher AI Gateway:
 * erkennen → Plan (Vorschau) → Bestätigung → Aktion des Besitzer-Moduls (als Macher) → Rückgängig über das Audit.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, zeitstrahl, zuruecksetzen } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import { on } from '@core/events';
import { frage, fuehreAus, fuehrePlanAus, kiProtokoll, nimmZurueck, type GatewayKontext, type Plan } from '@core/gateway';
import type { Recht } from '@core/session';
import { ladeModule } from '../../shell/module';
import { beantworte, type Antwort } from './assistent';
import { anredeAusText, hauptsatz, nachrichtSatz } from './aktionen';
import { findeKunde, findeMitarbeiter } from './hilfen';
import { mahnungen } from '../mahnungen/daten';
import { bestellungen } from '../bestellungen/daten';

const HEUTE = '2026-10-02'; // Freitag; morgen ist Feiertag (Tag der Deutschen Einheit)
const ALLE: Recht[] = ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'personal', 'loeschen', 'admin'];

beforeAll(() => ladeModule());

function welt() {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Elektro Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: 'Hauptstr. 1', plz: '34117', ort: 'Kassel' }, telefon: '', email: 'info@test.example', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  const chef = db.mitarbeiter.create({ vorname: 'Anna', nachname: 'Chef', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const mueller = db.kunden.create({ art: 'privat', name: 'Frau Müller', ansprechpartner: [], email: 'mueller@test.example', telefon: '0171 1234567' });
  const schneider = db.kunden.create({ art: 'privat', name: 'Familie Schneider', ansprechpartner: [], telefon: '0172 7654321' });
  const wagner = db.kunden.create({ art: 'firma', name: 'Wagner Bau GmbH', ansprechpartner: [] });
  const aMueller = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Bad Elektrik', art: 'projekt', phase: 'abrechnung', kundeId: mueller.id });
  const aSchneider = db.auftraege.create({ nummer: 'A-2026-0002', titel: 'Wallbox', art: 'kundendienst', phase: 'beauftragt', kundeId: schneider.id, geplanteStunden: 3 });
  const aWagner = db.auftraege.create({ nummer: 'A-2026-0003', titel: 'Baustelle Wagner Rohbau', art: 'projekt', phase: 'in_arbeit', kundeId: wagner.id });
  db.zeiten.create({ mitarbeiterId: jonas.id, auftragId: aMueller.id, datum: '2026-09-30', start: '07:00', ende: '11:00', pauseMinuten: 0, art: 'arbeit' });
  db.material.create({ auftragId: aWagner.id, text: 'NYM-J 3x1,5', menge: 100, einheit: 'm', ek: 50, status: 'geplant' });
  setAktuellerNutzer(chef.id);
  return { chef, jonas, mueller, schneider, wagner, aMueller, aSchneider, aWagner };
}

const kontext = (rechte: Recht[] = ALLE): GatewayKontext => ({ heute: HEUTE, jetzt: new Date(`${HEUTE}T10:00:00`), ich: db.mitarbeiter.all()[0], darf: (r) => rechte.includes(r) });

/** Plan aus der Antwort – wie ihn der Chat als Vorschau zeigt */
function planVon(a: Antwort): Plan {
  const v = a.vorschlaege?.[0];
  if (v?.art !== 'plan') throw new Error(`kein Plan: ${a.absicht} – ${a.text}`);
  return v.plan;
}

beforeEach(() => welt());

describe('Erkennen – ein Weg über den Gateway', () => {
  it('ordnet die Beispielsätze den Absichten zu', async () => {
    const id = async (t: string) => (await frage(t, kontext())).absicht?.id;
    expect(await id('Mach Müller die Rechnung fertig')).toBe('invoice.create_draft');
    expect(await id('Plane Jonas morgen bei Schneider ein')).toBe('employee.schedule');
    expect(await id('Was fehlt noch für die Baustelle Wagner?')).toBe('job.missing');
    expect(await id('Bestell das fehlende Material')).toBe('order.create_draft');
    expect(await id('Erinnere alle Kunden, deren Rechnung länger als 14 Tage offen ist')).toBe('invoice.remind');
    expect(await id('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen')).toBe('message.send');
    // jede Frage steht im KI-Protokoll – nicht noch einmal im Ereignisprotokoll
    expect(kiProtokoll.all()).toHaveLength(6);
    expect(db.ereignisse.all().filter((e) => e.typ.startsWith('ki.'))).toHaveLength(0);
  });

  it('lässt Fragen und Aufgaben in Ruhe', async () => {
    const id = async (t: string) => (await frage(t, kontext())).absicht?.id;
    expect(await id('Welche Rechnungen sind offen?')).toBe('invoice.list');
    expect(await id('Was steht morgen an?')).toBe('appointment.list');
    expect(await id('Wer hat nächste Woche Zeit?')).toBe('employee.availability');
    expect(await id('Erinnere mich morgen daran, Familie Hartmann anzurufen')).toBe('reminder.create');
    expect(await id('Leg eine Aufgabe für Jonas an: Material bestellen bis Freitag')).toBe('task.create');
  });

  it('findet Namen auch ohne Umlaute', () => {
    expect(findeKunde('Mach Mueller die Rechnung fertig')?.name).toBe('Frau Müller');
    expect(findeKunde('Plane Jonas bei Schneider ein', { ohne: ['Jonas', 'Becker'] })?.name).toBe('Familie Schneider');
    expect(findeMitarbeiter('Plane JONAS morgen ein')?.vorname).toBe('Jonas');
  });
});

describe('Rechte und Bestätigung', () => {
  it('zeigt ohne Recht keine Vorschau', async () => {
    const g = await frage('Mach Müller die Rechnung fertig', kontext(['lesen', 'schreiben']));
    expect(g).toMatchObject({ verweigert: 'rechte', fehlendeRechte: ['geld'] });
    const p = await frage('Plane Jonas am Montag bei Schneider ein', kontext(['lesen', 'schreiben']));
    expect(p).toMatchObject({ verweigert: 'rechte', fehlendeRechte: ['planen'] });
  });

  it('führt nichts ohne Bestätigung aus – kritisch auch nicht mit „direkt ausführen“', async () => {
    const plan = planVon(beantworte('Mach Müller die Rechnung fertig', kontext()));
    const s = plan.schritte[0];
    expect(await fuehreAus(s, kontext())).toMatchObject({ ok: false, grund: 'bestaetigung' });
    expect(db.rechnungen.all()).toHaveLength(0);
    // Rechte werden beim Ausführen erneut geprüft
    expect(await fuehreAus(s, kontext(['lesen', 'schreiben']), { bestaetigt: true })).toMatchObject({ ok: false, grund: 'rechte' });
    setzeEinstellung('ki.schreiben.direkt', true);
    const r = db.rechnungen.create({ nummer: 'R-2026-0001', art: 'rechnung', kundeId: db.kunden.all()[0].id, titel: 'Bad', positionen: [{ id: 'p', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100_000 }], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0 });
    expect(await fuehreAus({ aktion: 'invoice.remind', daten: { rechnungId: r.id } }, kontext())).toMatchObject({ ok: false, grund: 'bestaetigung' });
  });
});

describe('Die sechs Sätze', () => {
  it('macht die Rechnung fertig – als Macher protokolliert und rückgängig zu machen', async () => {
    const a = beantworte('Mach Müller die Rechnung fertig', kontext());
    expect(a.absicht).toBe('rechnung-entwurf');
    expect(a.eintraege?.[0].titel).toBe('A-2026-0001 · Bad Elektrik');
    expect(a.eintraege?.[1].titel).toMatch(/Position/);
    const ereignisse: unknown[] = [];
    const aus = on('macher.aktion_ausgefuehrt', (e) => void ereignisse.push(e));
    const [s] = await fuehrePlanAus(planVon(a), kontext(), { bestaetigt: true });
    aus();
    if (s.status !== 'ausgefuehrt') throw new Error(JSON.stringify(s));
    const rechnung = db.rechnungen.all()[0];
    expect(rechnung).toMatchObject({ status: 'entwurf', kundeId: db.kunden.all()[0].id });
    const verlauf = zeitstrahl({ typ: 'rechnungen', id: rechnung.id }).find((e) => e.aenderung === 'created');
    expect(verlauf).toMatchObject({ quelle: 'ai', akteurId: 'macher', vonMitarbeiterId: db.mitarbeiter.all()[0].id });
    expect(verlauf?.text).toBe('Angelegt – durch Macher');
    expect(s.ergebnis.eintraege.length).toBeGreaterThan(0);
    expect(ereignisse).toHaveLength(1);
    // zweiter Versuch: Entwurf liegt schon – kein zweiter
    expect(beantworte('Mach Müller die Rechnung fertig', kontext()).absicht).toBe('rechnung-entwurf-da');
    const z = nimmZurueck(s.ergebnis.eintraege, kontext());
    expect(z.ok).toBeGreaterThan(0);
    expect(db.rechnungen.all()).toHaveLength(0);
    expect(kiProtokoll.all().some((p) => p.ergebnis === 'zurueckgenommen')).toBe(true);
  });

  it('sagt, wenn es noch nichts abzurechnen gibt', () => {
    db.auftraege.update(db.auftraege.all()[0].id, { phase: 'angebot' });
    expect(beantworte('Mach Müller die Rechnung fertig', kontext()).absicht).toBe('rechnung-zu-frueh');
  });

  it('plant Jonas ein – aber nicht am Feiertag', async () => {
    expect(beantworte('Plane Jonas morgen bei Schneider ein', kontext()).text).toMatch(/kein Arbeitstag/);
    const a = beantworte('Plane Jonas am Montag um 8 Uhr bei Schneider ein', kontext());
    const plan = planVon(a);
    expect((plan.schritte[0].daten as { vorschlag: { bloecke: unknown[] } }).vorschlag.bloecke[0]).toEqual({ datum: '2026-10-05', von: 480, bis: 660 });
    const [s] = await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    if (s.status !== 'ausgefuehrt') throw new Error(JSON.stringify(s));
    expect(db.termine.all()[0]).toMatchObject({ auftragId: db.auftraege.all()[1].id, mitarbeiterIds: [db.mitarbeiter.all()[1].id] });
    nimmZurueck(s.ergebnis.eintraege, kontext());
    expect(db.termine.all()).toHaveLength(0);
  });

  it('sagt, was für die Baustelle fehlt', () => {
    const a = beantworte('Was fehlt noch für die Baustelle Wagner?', kontext());
    expect(a.absicht).toBe('was-fehlt');
    expect(a.text).toMatch(/Baustelle Wagner Rohbau/);
    const titel = a.eintraege?.map((z) => z.titel) ?? [];
    expect(titel).toContain('Material: NYM-J 3x1,5');
    expect(titel).toContain('Noch kein Einsatz geplant');
    expect(a.folgefragen).toContain('Bestell das fehlende Material');
    expect(a.vorschlaege).toBeUndefined();
  });

  it('bestellt fehlendes Material als Entwurf', async () => {
    db.termine.create({ art: 'einsatz', titel: 'Rohbau', start: '2026-10-06T07:00:00', ende: '2026-10-06T15:00:00', auftragId: db.auftraege.all()[2].id, mitarbeiterIds: [], status: 'geplant' });
    const a = beantworte('Bestell das fehlende Material', kontext());
    expect(a.eintraege?.[0].titel).toBe('NYM-J 3x1,5');
    const [s] = await fuehrePlanAus(planVon(a), kontext(), { bestaetigt: true });
    if (s.status !== 'ausgefuehrt') throw new Error(JSON.stringify(s));
    expect(s.ergebnis.bezug?.typ).toBe('bestellungen');
    expect(bestellungen.all()).toHaveLength(1);
  });

  it('erinnert Kunden mit lange offenen Rechnungen erst nach Freigabe', async () => {
    const kunde = db.kunden.all()[0];
    const r = db.rechnungen.create({ nummer: 'R-2026-0001', art: 'rechnung', kundeId: kunde.id, titel: 'Bad', positionen: [{ id: 'p', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100_000 }], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0 });
    db.rechnungen.create({ nummer: 'R-2026-0002', art: 'rechnung', kundeId: kunde.id, titel: 'Neu', positionen: [{ id: 'p', art: 'pauschal', text: 'x', menge: 1, einheit: 'Psch', einzelpreis: 5000 }], status: 'versendet', datum: '2026-09-28', faelligAm: '2026-10-12', mahnstufe: 0 });
    const plan = planVon(beantworte('Erinnere alle Kunden, deren Rechnung länger als 14 Tage offen ist', kontext()));
    expect(plan.schritte.map((s) => s.daten)).toEqual([{ rechnungId: r.id }]);
    expect((await fuehrePlanAus(plan, kontext()))[0].status).toBe('fehler');
    expect(mahnungen.all()).toHaveLength(0);
    const [s] = await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    if (s.status !== 'ausgefuehrt') throw new Error(JSON.stringify(s));
    expect(mahnungen.all()[0]).toMatchObject({ rechnungId: r.id, stufe: 1, status: 'versendet' });
    expect(db.rechnungen.get(r.id)?.mahnstufe).toBe(1);
    expect(s.ergebnis.oeffnen?.[0].url).toMatch(/^mailto:/);
    expect(s.ergebnis.endgueltig).toMatch(/nicht zurückholen/);
  });

  it('schreibt dem Kunden – Text in Ordnung und vor dem Senden änderbar', () => {
    expect(hauptsatz('wir morgen um 8 Uhr kommen')).toBe('wir kommen morgen um 8 Uhr');
    expect(nachrichtSatz('wir morgen um 8 Uhr kommen', HEUTE)).toBe('wir kommen morgen (Sa., 03.10.) um 8:00 Uhr');
    expect(anredeAusText('Schreib Frau Müller, dass …')).toBe('Guten Tag Frau Müller');
    const plan = planVon(beantworte('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen', kontext()));
    const s = plan.schritte[0];
    expect(s.aktion).toBe('message.send');
    expect(s.textFeld).toMatchObject({ feld: 'text' });
    const text = (s.daten as { text: string }).text;
    expect(text).toMatch(/^Guten Tag Frau Müller,/);
    expect(text).toMatch(/Wir kommen morgen \(Sa\., 03\.10\.\) um 8:00 Uhr\./);
  });
});
