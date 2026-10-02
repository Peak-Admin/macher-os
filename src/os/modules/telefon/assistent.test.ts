import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import { fuehreAus, kiProtokoll, registriereGateway } from '@core/gateway';
import { STANDARD_KONFIG, rohNachricht } from './agent';
import { felderAusText, probeanruf, simulatorAnbieter } from './anbieter/simulator';
import { anbieter } from './anbieter';
import type { AnrufErgebnis } from './anbieter/typen';
import { aktuelleAgentDefinition, assistentKonfig, kiAnrufAufnehmen, konfigSpeichern, rohAnrufVerarbeiten, telefonKontext, vorschau } from './assistent';
import { TELEFON_AKTIONEN } from './gateway';

const ergebnis = (p: Partial<AnrufErgebnis> = {}): AnrufErgebnis => ({ anrufId: `a-${Math.random()}`, anbieter: 'simulator', von: '0160 5551234', beginn: new Date().toISOString(), felder: {}, ...p });

describe('Simulator', () => {
  it('zieht Name, Adresse, Nummer, Erreichbarkeit und Anliegen aus dem Gesagten', () => {
    const f = felderAusText('Guten Tag, mein Name ist Eva Sommer. Bei uns im Keller ist ein Rohrbruch. Ahornweg 5, 34117 Kassel. Sie erreichen mich jederzeit unter 0171 2345678.');
    expect(f).toMatchObject({ name: 'Eva Sommer', adresse: 'Ahornweg 5, 34117 Kassel', rueckrufnummer: '0171 2345678', erreichbarkeit: 'jederzeit' });
    expect(f.anliegen).toContain('Rohrbruch');
    expect(f.anliegen).not.toContain('Eva Sommer');
  });
  it('nimmt die Anrufernummer, wenn keine genannt wird, und erkennt Dringlichkeit', () => {
    expect(felderAusText('Hier ist Herr Kaya, das Dachfenster ist undicht, bitte dringend melden. Ab 17 Uhr bin ich da.', '0151 1')).toMatchObject({ name: 'Herr Kaya', rueckrufnummer: '0151 1', dringlichkeit: 'dringend', erreichbarkeit: 'Ab 17 Uhr' });
  });
  it('spielt einen Probeanruf mit Ansage, Fragen und Transkript durch', () => {
    const e = probeanruf('Bitte rufen Sie mich zurück wegen der Rechnung.', { ansage: 'Hallo, digitaler Assistent.', fragen: [{ id: 'anliegen', frage: 'Worum geht es?' }, { id: 'name', frage: 'Wie ist Ihr Name?' }] }, { von: '0171 1', jetzt: new Date('2026-10-02T08:00:00Z'), anrufId: 'p1' });
    expect(e).toMatchObject({ anrufId: 'p1', anbieter: 'simulator', ergebnis: 'rueckruf', beginn: '2026-10-02T08:00:00.000Z' });
    expect(e.transkript?.map((z) => z.wer)).toEqual(['assistent', 'assistent', 'anrufer', 'assistent', 'assistent']);
    expect(e.transkript?.[3].text).toBe('Wie ist Ihr Name?');
  });
  it('liest nur gültige normalisierte Ereignisse und prüft das Geheimnis', () => {
    const gut = { typ: 'anruf.beendet', ergebnis: ergebnis({ anrufId: 'x' }) };
    expect(simulatorAnbieter.eingangLesen([gut, { typ: 'quatsch' }, { typ: 'anruf.beendet', ergebnis: {} }])).toEqual([gut]);
    expect(simulatorAnbieter.pruefeSignatur({ kopf: { 'x-macher-signatur': 'geheim' }, rohText: '' }, 'geheim')).toBe(true);
    expect(simulatorAnbieter.pruefeSignatur({ kopf: { 'x-macher-signatur': 'falsch' }, rohText: '' }, 'geheim')).toBe(false);
    expect(simulatorAnbieter.pruefeSignatur({ kopf: {}, rohText: '' }, '')).toBe(false);
    expect(anbieter('simulator')).toBe(simulatorAnbieter);
    expect(anbieter('sipgate')).toBeUndefined();
  });
});

describe('Telefonassistent in der App', () => {
  let aus: () => void;
  beforeEach(() => {
    zuruecksetzen();
    aus = registriereGateway({ aktionen: TELEFON_AKTIONEN });
  });
  afterEach(() => aus());

  it('speichert die Konfiguration normalisiert und baut die Agent-Definition aus den Betriebsdaten', () => {
    expect(assistentKonfig()).toEqual(STANDARD_KONFIG);
    db.betrieb.create({ id: 'betrieb', name: 'Elektro Rückert', arbeitsbeginn: '06:30', arbeitsende: '15:00' } as never);
    konfigSpeichern({ an: true, notfallStichworte: [' Kurzschluss ', ''] });
    expect(assistentKonfig()).toMatchObject({ an: true, notfallStichworte: ['Kurzschluss'] });
    const a = aktuelleAgentDefinition();
    expect(a.ansage).toContain('Elektro Rückert');
    expect(a.annahme.geschaeftszeiten).toBe('Mo–Fr, 06:30–15:00 Uhr');
  });

  it('unbekannter Anrufer: Anfrage mit neuem Kunden samt Adresse, über den Gateway als Macher', async () => {
    const r = await kiAnrufAufnehmen(ergebnis({ felder: { anliegen: 'Dachfenster undicht, tropft bei Regen', name: 'Hr. Kaya', adresse: 'Lindenstr. 12, 34117 Kassel' } }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nachricht).toMatchObject({ kanal: 'telefon', richtung: 'ein', gelesen: false, anruf: { quelle: 'ki-assistent', status: 'verarbeitet', ergebnis: 'anfrage' } });
    const auftrag = db.auftraege.get(r.nachricht.auftragId)!;
    expect(auftrag).toMatchObject({ phase: 'anfrage', quelle: 'telefon', titel: 'Dachfenster undicht, tropft bei Regen' });
    expect(db.kunden.get(auftrag.kundeId)).toMatchObject({ name: 'Hr. Kaya', telefon: '0160 5551234', adresse: { strasse: 'Lindenstr. 12', plz: '34117', ort: 'Kassel' } });
    const p = kiProtokoll.all();
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ aktion: 'call.request_create', ergebnis: 'ausgefuehrt', kanal: 'sprache', bestaetigt: true });
    expect(db.ereignisse.where((e) => e.bezug?.typ === 'auftraege' && e.bezug.id === auftrag.id).some((e) => e.quelle === 'ai')).toBe(true);
  });

  it('bekannter Kunde mit einem offenen Auftrag: Rückruf am Auftrag', async () => {
    const k = db.kunden.create({ art: 'hausverwaltung', name: 'HV Nord', telefon: '0561 123456', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Haus 24', art: 'kundendienst', phase: 'beauftragt', kundeId: k.id } as never);
    const r = await kiAnrufAufnehmen(ergebnis({ von: '+49 561 123456', felder: { anliegen: 'Frage zur Rechnung', erreichbarkeit: 'bis 17 Uhr' } }));
    expect(r.ok && r.nachricht).toMatchObject({ kundeId: k.id, auftragId: a.id, anruf: { ergebnis: 'rueckruf' } });
    const rueckruf = db.aufgaben.all()[0];
    expect(rueckruf).toMatchObject({ quelle: 'rueckruf', auftragId: a.id, prioritaet: 'normal', titel: 'Rückruf: HV Nord' });
    expect(rueckruf.notiz).toContain('Erreichbar: bis 17 Uhr');
    expect(db.auftraege.all()).toHaveLength(1);
  });

  it('Notfall: dringende Anfrage, Mitteilung an die Bereitschaft und Ereignisse', async () => {
    const kai = db.mitarbeiter.create({ vorname: 'Kai', nachname: 'Brandt', rolle: 'monteur', telefon: '0170 1112223', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true } as never);
    konfigSpeichern({ an: true, bereitschaft: { mitarbeiterId: kai.id, nummer: '0170 1112223' } });
    const typen: string[] = [];
    const ab = [on('anruf.angenommen', (e) => typen.push(e.typ)), on('anruf.notfall_weitergeleitet', (e) => typen.push(e.typ))];
    const r = await kiAnrufAufnehmen(ergebnis({ felder: { anliegen: 'Bei uns riecht es nach Gas im Keller', name: 'Eva Sommer' }, weitergeleitet: true }));
    ab.forEach((f) => f());
    expect(r.ok && r.notfall).toBe(true);
    if (!r.ok) return;
    expect(r.nachricht.anruf).toMatchObject({ dringlichkeit: 'notfall', ergebnis: 'weitergeleitet', weitergeleitetAn: kai.id, durchgestellt: true, notfallGrund: 'Stichwort „riecht nach Gas“' });
    expect(db.auftraege.get(r.nachricht.auftragId)).toMatchObject({ dringend: true });
    const b = db.benachrichtigungen.all();
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ fuerMitarbeiterId: kai.id, stufe: 'jetzt', art: 'anruf.notfall', bezug: { typ: 'auftraege', id: r.nachricht.auftragId } });
    expect(b[0].titel).toBe('Notfall am Telefon: Bei uns riecht es nach Gas im Keller');
    expect(typen).toEqual(['anruf.angenommen', 'anruf.notfall_weitergeleitet']);
    expect(kiProtokoll.all().map((p) => p.aktion)).toEqual(['call.request_create', 'call.emergency_forward']);
  });

  it('doppelte Zustellung legt nichts doppelt an', async () => {
    const e = ergebnis({ anrufId: 'gleich', felder: { anliegen: 'Licht flackert' } });
    await kiAnrufAufnehmen(e);
    const r = await kiAnrufAufnehmen(e);
    expect(r).toMatchObject({ ok: true, doppelt: true });
    expect(db.nachrichten.all()).toHaveLength(1);
    expect(db.auftraege.all()).toHaveLength(1);
  });

  it('vom Eingang abgelegte Nachricht wird ergänzt statt verdoppelt', async () => {
    const roh = db.nachrichten.create(rohNachricht(ergebnis({ anrufId: 'srv-1', felder: { anliegen: 'Bitte zurückrufen wegen Termin' } })));
    const r = await rohAnrufVerarbeiten(roh);
    expect(r.ok).toBe(true);
    expect(db.nachrichten.all()).toHaveLength(1);
    expect(db.nachrichten.get(roh.id)?.anruf).toMatchObject({ status: 'verarbeitet', ergebnis: 'rueckruf', anrufId: 'srv-1' });
    expect(await rohAnrufVerarbeiten(db.nachrichten.get(roh.id)!)).toMatchObject({ ok: false });
  });

  it('Fehler im Gateway landet am Anruf (für den Hinweis)', async () => {
    aus();
    aus = () => {};
    const roh = db.nachrichten.create(rohNachricht(ergebnis({ anrufId: 'srv-2', felder: { anliegen: 'Steckdose' } })));
    const r = await rohAnrufVerarbeiten(roh);
    expect(r.ok).toBe(false);
    expect(db.nachrichten.get(roh.id)?.anruf).toMatchObject({ status: 'fehler' });
  });

  it('der Assistent darf nur lesen und schreiben – kein Geld, nichts senden', async () => {
    const k = telefonKontext();
    expect(['lesen', 'schreiben'].every((r) => k.darf(r as never))).toBe(true);
    expect(['geld', 'veroeffentlichen', 'loeschen', 'admin', 'personal', 'planen'].some((r) => k.darf(r as never))).toBe(false);
    expect(TELEFON_AKTIONEN.every((a) => (a.rechte ?? []).every((r) => r === 'lesen' || r === 'schreiben'))).toBe(true);
  });

  it('kunde_suchen verrät dem Anrufer keine Kundendaten', async () => {
    db.kunden.create({ art: 'privat', name: 'Hoffmann', telefon: '0171 2345678', ansprechpartner: [] });
    const r = await fuehreAus({ aktion: 'call.customer_lookup', daten: { telefon: '0171 2345678' } }, telefonKontext());
    expect(r.ok && JSON.parse(r.text!)).toEqual({ bekannt: true, offeneAuftraege: 0 });
  });

  it('Probeanruf-Vorschau ändert nichts', () => {
    const e = probeanruf('Rohrbruch im Bad, Wasser läuft!', aktuelleAgentDefinition(), { von: '0151 99' });
    const v = vorschau(e);
    expect(v.u).toMatchObject({ notfall: true, schritt: 'anfrage' });
    expect(db.nachrichten.all()).toHaveLength(0);
    expect(db.auftraege.all()).toHaveLength(0);
  });
});
