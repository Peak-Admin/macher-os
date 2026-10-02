import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, zeitstrahl, zuruecksetzen } from '@core/db';
import { befehlAusfuehren, befehlRueckgaengig, befehlVorbereiten, erkenneBefehl, fehlendeRechte, freigabeStufe, FreigabeFehlt, type BefehlEntwurf, type BefehlKontext } from '@core/aktionen';
import type { Recht } from '@core/session';
import { ladeModule } from '../../shell/module';
import { beantworte } from './assistent';
import { einplanen, hauptsatz, kundenErinnern, kundenSchreiben, materialBestellen, nachrichtAusText, rechnungFertig, wasFehlt } from './befehle';
import { mahnungen } from '../mahnungen/daten';

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

const kontext = (eingabe: string, ich = db.mitarbeiter.all()[0], rechte: Recht[] = ALLE): BefehlKontext => ({ eingabe, heute: HEUTE, jetzt: new Date(`${HEUTE}T10:00:00`), ich, darf: (r) => rechte.includes(r) });

beforeEach(() => welt());

describe('Absicht erkennen', () => {
  it('erkennt die Beispielsätze', () => {
    expect(erkenneBefehl('Mach Müller die Rechnung fertig')?.befehl.id).toBe('rechnung.fertig');
    expect(erkenneBefehl('Plane Jonas morgen bei Schneider ein')?.befehl.id).toBe('einsatz.einplanen');
    expect(erkenneBefehl('Was fehlt noch für die Baustelle Wagner?')?.befehl.id).toBe('auftrag.was-fehlt');
    expect(erkenneBefehl('Bestell das fehlende Material')?.befehl.id).toBe('material.bestellen');
    expect(erkenneBefehl('Erinnere alle Kunden, deren Rechnung länger als 14 Tage offen ist')?.befehl.id).toBe('rechnungen.erinnern');
    expect(erkenneBefehl('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen')?.befehl.id).toBe('nachricht.schreiben');
  });

  it('lässt Fragen und Aufgaben in Ruhe', () => {
    for (const f of ['Welche Rechnungen sind offen?', 'Was steht morgen an?', 'Wer hat nächste Woche Zeit?', 'Erinnere mich morgen daran, Familie Hartmann anzurufen', 'Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag', 'Wo ist Familie Hoffmann?'])
      expect(erkenneBefehl(f), f).toBeUndefined();
    const k = { heute: HEUTE, jetzt: new Date(`${HEUTE}T10:00:00`), ich: db.mitarbeiter.all()[0], darf: () => true };
    expect(beantworte('Erinnere mich morgen daran, Familie Hartmann anzurufen', k).absicht).toBe('aufgabe-entwurf');
    expect(beantworte('Mach Müller die Rechnung fertig', k).vorschlaege?.[0]).toMatchObject({ art: 'befehl', befehlId: 'rechnung.fertig', freigabe: 'freigeben' });
  });
});

describe('Freigabe', () => {
  it('stuft nach Fähigkeitsklasse ab', () => {
    expect(freigabeStufe(['READ'])).toBe('sofort');
    expect(freigabeStufe(['WRITE'])).toBe('bestaetigen');
    expect(freigabeStufe(['WRITE', 'MONEY'])).toBe('freigeben');
    expect(freigabeStufe(['PUBLICATION'])).toBe('freigeben');
    expect(freigabeStufe(['DESTRUCTIVE'])).toBe('freigeben');
    expect(fehlendeRechte(['WRITE', 'MONEY'], (r) => r !== 'geld')).toEqual(['geld']);
  });

  it('zeigt ohne Recht keine Vorschau', () => {
    const v = befehlVorbereiten(rechnungFertig, kontext('Mach Müller die Rechnung fertig', undefined, ['lesen', 'schreiben']));
    expect(v.ergebnis.art).toBe('antwort');
    expect((v.ergebnis as { text: string }).text).toMatch(/Preise & Geld/);
    const p = befehlVorbereiten(einplanen, kontext('Plane Jonas am Montag bei Schneider ein', undefined, ['lesen', 'schreiben']));
    expect((p.ergebnis as { text: string }).text).toMatch(/Einsätze planen/);
  });

  it('führt nichts ohne Bestätigung bzw. Freigabe aus', () => {
    const k = kontext('Mach Müller die Rechnung fertig');
    const v = befehlVorbereiten(rechnungFertig, k);
    const e = v.ergebnis as BefehlEntwurf<{ auftragId: string }>;
    expect(() => befehlAusfuehren(rechnungFertig, e.parameter, k, { bestaetigt: true })).toThrow(FreigabeFehlt);
    expect(db.rechnungen.all()).toHaveLength(0);
    const m = befehlVorbereiten(materialBestellen, kontext('Bestell das fehlende Material'));
    expect(m.freigabe).toBe('bestaetigen');
    expect(() => befehlAusfuehren(materialBestellen, undefined, kontext('x'))).toThrow(FreigabeFehlt);
    // Rechte werden beim Ausführen erneut geprüft
    expect(() => befehlAusfuehren(rechnungFertig, e.parameter, kontext('x', undefined, ['lesen', 'schreiben']), { freigegeben: true })).toThrow(/Preise & Geld/);
  });
});

describe('Befehle', () => {
  it('macht die Rechnung fertig – als Macher protokolliert und rückgängig zu machen', () => {
    const k = kontext('Mach Müller die Rechnung fertig');
    const v = befehlVorbereiten(rechnungFertig, k);
    const e = v.ergebnis as BefehlEntwurf<{ auftragId: string }>;
    expect(e.art).toBe('entwurf');
    expect(e.titel).toBe('Rechnung für Frau Müller');
    const r = befehlAusfuehren(rechnungFertig, e.parameter, k, { freigegeben: true });
    const rechnung = db.rechnungen.all()[0];
    expect(rechnung).toMatchObject({ status: 'entwurf', kundeId: db.kunden.all()[0].id });
    const verlauf = zeitstrahl({ typ: 'rechnungen', id: rechnung.id })[0];
    expect(verlauf).toMatchObject({ quelle: 'ai', akteurId: 'macher', vonMitarbeiterId: k.ich?.id });
    expect(verlauf.text).toBe('Angelegt – durch Macher');
    expect(r.eintraege.length).toBeGreaterThan(0);
    // zweiter Versuch: Entwurf liegt schon
    expect(befehlVorbereiten(rechnungFertig, k).ergebnis.art).toBe('antwort');
    const z = befehlRueckgaengig(r.eintraege);
    expect(z.ok).toBeGreaterThan(0);
    expect(db.rechnungen.all()).toHaveLength(0);
  });

  it('plant Jonas ein – aber nicht am Feiertag', () => {
    expect((befehlVorbereiten(einplanen, kontext('Plane Jonas morgen bei Schneider ein')).ergebnis as { text: string }).text).toMatch(/kein Arbeitstag/);
    const k = kontext('Plane Jonas am Montag um 8 Uhr bei Schneider ein');
    const v = befehlVorbereiten(einplanen, k);
    const e = v.ergebnis as BefehlEntwurf<Parameters<typeof einplanen.ausfuehren>[0]>;
    expect(e.art).toBe('entwurf');
    expect(e.parameter.vorschlag.bloecke[0]).toEqual({ datum: '2026-10-05', von: 480, bis: 660 });
    const r = befehlAusfuehren(einplanen, e.parameter, k, { bestaetigt: true });
    const t = db.termine.all()[0];
    expect(t).toMatchObject({ auftragId: db.auftraege.all()[1].id, mitarbeiterIds: [db.mitarbeiter.all()[1].id] });
    befehlRueckgaengig(r.eintraege);
    expect(db.termine.all()).toHaveLength(0);
  });

  it('sagt, was für die Baustelle fehlt', () => {
    const v = befehlVorbereiten(wasFehlt, kontext('Was fehlt noch für die Baustelle Wagner?'));
    expect(v.ergebnis.art).toBe('antwort');
    const a = v.ergebnis as { text: string; zeilen: { titel: string }[]; folgefragen?: string[] };
    expect(a.text).toMatch(/Baustelle Wagner Rohbau/);
    expect(a.zeilen.map((z) => z.titel)).toContain('Material: NYM-J 3x1,5');
    expect(a.zeilen.map((z) => z.titel)).toContain('Noch kein Einsatz geplant');
    expect(a.folgefragen).toContain('Bestell das fehlende Material');
  });

  it('bestellt fehlendes Material als Entwurf', () => {
    db.termine.create({ art: 'einsatz', titel: 'Rohbau', start: '2026-10-06T07:00:00', ende: '2026-10-06T15:00:00', auftragId: db.auftraege.all()[2].id, mitarbeiterIds: [], status: 'geplant' });
    const k = kontext('Bestell das fehlende Material');
    const v = befehlVorbereiten(materialBestellen, k);
    expect(v.ergebnis.art).toBe('entwurf');
    const r = befehlAusfuehren(materialBestellen, undefined, k, { bestaetigt: true });
    expect(r.pfad).toMatch(/bestellungen/);
  });

  it('erinnert Kunden mit lange offenen Rechnungen erst nach Freigabe', () => {
    const kunde = db.kunden.all()[0];
    const r = db.rechnungen.create({ nummer: 'R-2026-0001', art: 'rechnung', kundeId: kunde.id, titel: 'Bad', positionen: [{ id: 'p', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100_000 }], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0 });
    db.rechnungen.create({ nummer: 'R-2026-0002', art: 'rechnung', kundeId: kunde.id, titel: 'Neu', positionen: [{ id: 'p', art: 'pauschal', text: 'x', menge: 1, einheit: 'Psch', einzelpreis: 5000 }], status: 'versendet', datum: '2026-09-28', faelligAm: '2026-10-12', mahnstufe: 0 });
    const k = kontext('Erinnere alle Kunden, deren Rechnung länger als 14 Tage offen ist');
    const v = befehlVorbereiten(kundenErinnern, k);
    const e = v.ergebnis as BefehlEntwurf<{ rechnungIds: string[] }>;
    expect(v.freigabe).toBe('freigeben');
    expect(e.parameter.rechnungIds).toEqual([r.id]);
    expect(() => befehlAusfuehren(kundenErinnern, e.parameter, k, { bestaetigt: true })).toThrow(FreigabeFehlt);
    const x = befehlAusfuehren(kundenErinnern, e.parameter, k, { freigegeben: true });
    expect(mahnungen.all()[0]).toMatchObject({ rechnungId: r.id, stufe: 1, status: 'versendet' });
    expect(db.rechnungen.get(r.id)?.mahnstufe).toBe(1);
    expect(x.oeffnen?.[0].url).toMatch(/^mailto:/);
  });

  it('schreibt dem Kunden – Text in Ordnung, Versand nur über die App', () => {
    expect(hauptsatz('wir morgen um 8 Uhr kommen')).toBe('wir kommen morgen um 8 Uhr');
    const text = nachrichtAusText('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen', db.kunden.all()[0], HEUTE, 'Anna');
    expect(text).toMatch(/^Guten Tag Frau Müller,/);
    expect(text).toMatch(/wir kommen morgen \(Sa\., 03\.10\.\) um 8:00 Uhr\./);
    const k = kontext('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen');
    const v = befehlVorbereiten(kundenSchreiben, k);
    const e = v.ergebnis as BefehlEntwurf<{ kanal: string; text: string }>;
    expect(v.freigabe).toBe('freigeben');
    expect(e.parameter.kanal).toBe('email');
    const r = befehlAusfuehren(kundenSchreiben, { ...e.parameter, text: 'Geänderter Text' } as never, k, { freigegeben: true });
    expect(db.nachrichten.all()[0]).toMatchObject({ richtung: 'aus', kanal: 'email', text: 'Geänderter Text' });
    expect(r.oeffnen?.[0].url).toMatch(/^mailto:mueller@test\.example/);
  });
});
