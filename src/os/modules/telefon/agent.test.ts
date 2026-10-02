import { describe, expect, it } from 'vitest';
import {
  STANDARD_KONFIG,
  adresseZerlegen,
  agentDefinition,
  ansageText,
  berlinZeit,
  ergebnisAusDetails,
  ergebnisUebersetzen,
  frageVerschieben,
  geschaeftszeitenText,
  inGeschaeftszeit,
  konfigNormalisieren,
  nimmtAn,
  notfallTreffer,
  rohNachricht,
  stichworteAus,
  type AssistentKonfig,
  type Geschaeftszeiten,
} from './agent';
import type { AnrufErgebnis } from './anbieter/typen';

const zeiten: Geschaeftszeiten = { beginn: '07:00', ende: '16:00', tage: [1, 2, 3, 4, 5] };
const konfig = (p: Partial<AssistentKonfig> = {}) => konfigNormalisieren({ ...STANDARD_KONFIG, an: true, ...p });
const ergebnis = (p: Partial<AnrufErgebnis> = {}): AnrufErgebnis => ({ anrufId: 'a1', anbieter: 'simulator', von: '0171 2345678', beginn: '2026-10-02T10:00:00.000Z', felder: {}, ...p });

describe('Ansage (EU AI Act)', () => {
  it('setzt den Firmennamen ein und nennt den digitalen Assistenten', () => {
    expect(ansageText(STANDARD_KONFIG.begruessung, 'Elektro Rückert')).toContain('digitalen Assistenten von Elektro Rückert');
  });
  it('ergänzt den Hinweis, wenn er in der eigenen Begrüßung fehlt', () => {
    const t = ansageText('Guten Tag bei {firma}, was kann ich tun?', 'Dach Kaya');
    expect(t.startsWith('Sie sprechen mit dem digitalen Assistenten von Dach Kaya.')).toBe(true);
    expect(t).toContain('Guten Tag bei Dach Kaya');
  });
  it('fällt bei leerer Vorlage auf die Standardbegrüßung zurück', () => {
    expect(ansageText('  ', '')).toContain('digitalen Assistenten von unserem Betrieb');
  });
});

describe('Konfiguration', () => {
  it('ergänzt fehlende Fragen, entfernt unbekannte und hält Pflichtfragen an', () => {
    const k = konfigNormalisieren({ fragen: [{ id: 'name', an: false }, { id: 'anliegen', an: false }, { id: 'quatsch' as never, an: true }] });
    expect(k.fragen.map((f) => f.id)).toEqual(['name', 'anliegen', 'adresse', 'dringlichkeit', 'rueckrufnummer', 'erreichbarkeit']);
    expect(k.fragen.find((f) => f.id === 'anliegen')?.an).toBe(true);
    expect(k.fragen.find((f) => f.id === 'name')?.an).toBe(false);
  });
  it('begrenzt die Klingelzeit auf 5–60 Sekunden', () => {
    expect(konfigNormalisieren({ klingelSekunden: 2 }).klingelSekunden).toBe(5);
    expect(konfigNormalisieren({ klingelSekunden: 400 }).klingelSekunden).toBe(60);
  });
  it('verschiebt Fragen mit Knöpfen statt Drag-and-drop', () => {
    const f = STANDARD_KONFIG.fragen;
    expect(frageVerschieben(f, 'name', -1).map((x) => x.id).slice(0, 2)).toEqual(['name', 'anliegen']);
    expect(frageVerschieben(f, 'anliegen', -1)).toBe(f);
    expect(frageVerschieben(f, 'erreichbarkeit', 1)).toBe(f);
  });
  it('liest Stichworte zeilen- oder kommaweise, ohne Doppelte', () => {
    expect(stichworteAus('Rohrbruch\nGasgeruch, Rohrbruch;  \n Heizung aus')).toEqual(['Rohrbruch', 'Gasgeruch', 'Heizung aus']);
  });
});

describe('Geschäftszeiten und Annahme', () => {
  // Freitag, 2.10.2026: 10:00 Uhr in Deutschland = 08:00 UTC (Sommerzeit)
  const fr10 = new Date('2026-10-02T08:00:00Z');
  const fr18 = new Date('2026-10-02T16:00:00Z');
  const sa10 = new Date('2026-10-03T08:00:00Z');

  it('rechnet in deutscher Zeit, egal wo der Server steht', () => {
    expect(berlinZeit(fr10)).toEqual({ datum: '2026-10-02', minuten: 600, wochentag: 5 });
    expect(berlinZeit(new Date('2026-12-01T23:30:00Z'))).toMatchObject({ datum: '2026-12-02', minuten: 30, wochentag: 3 });
  });
  it('kennt Geschäftszeiten, Wochenende und Feiertage', () => {
    expect(inGeschaeftszeit(fr10, zeiten)).toBe(true);
    expect(inGeschaeftszeit(fr18, zeiten)).toBe(false);
    expect(inGeschaeftszeit(sa10, zeiten)).toBe(false);
    expect(inGeschaeftszeit(fr10, { ...zeiten, istArbeitstag: () => false })).toBe(false);
    expect(geschaeftszeitenText(zeiten)).toBe('Mo–Fr, 07:00–16:00 Uhr');
    expect(geschaeftszeitenText({ ...zeiten, tage: [1, 3] })).toBe('Mo, Mi, 07:00–16:00 Uhr');
  });
  it('entscheidet nach der Annahmeregel', () => {
    expect(nimmtAn(konfig({ an: false }), fr10, zeiten).annehmen).toBe(false);
    expect(nimmtAn(konfig({ annahme: 'immer' }), fr10, zeiten)).toMatchObject({ annehmen: true, nachSekunden: 0 });
    expect(nimmtAn(konfig({ annahme: 'keiner', klingelSekunden: 25 }), fr18, zeiten)).toMatchObject({ annehmen: true, nachSekunden: 25 });
    expect(nimmtAn(konfig({ annahme: 'ausserhalb' }), fr10, zeiten).annehmen).toBe(false);
    expect(nimmtAn(konfig({ annahme: 'ausserhalb' }), sa10, zeiten)).toMatchObject({ annehmen: true, nachSekunden: 0 });
    expect(nimmtAn(konfig({ annahme: 'ausserhalb_keiner' }), fr10, zeiten)).toMatchObject({ annehmen: true, nachSekunden: 20 });
    expect(nimmtAn(konfig({ annahme: 'ausserhalb_keiner' }), fr18, zeiten)).toMatchObject({ annehmen: true, nachSekunden: 0 });
  });
});

describe('Notfall per Stichwort', () => {
  const sw = STANDARD_KONFIG.notfallStichworte;
  it('findet Stichworte unabhängig von Groß-/Kleinschreibung und Umlauten', () => {
    expect(notfallTreffer('Bei uns im Keller ist ein ROHRBRUCH!', sw)).toBe('Rohrbruch');
    expect(notfallTreffer('Hier riecht es nach Gas im Flur', sw)).toBe('riecht nach Gas');
    expect(notfallTreffer('Wasserschaden in der Kueche', ['Wasserschaden'])).toBe('Wasserschaden');
  });
  it('mehrwortige Stichworte zählen nur im selben Satz', () => {
    expect(notfallTreffer('Die Heizung ist komplett ausgefallen.', ['Heizung aus'])).toBe('Heizung aus');
    expect(notfallTreffer('Die Heizung soll gewartet werden. Ich bin aus Kassel.', ['Heizung aus'])).toBeUndefined();
  });
  it('löst nicht auf Wortteile mitten im Wort aus', () => {
    expect(notfallTreffer('Haus streichen', ['aus'])).toBeUndefined();
    expect(notfallTreffer('egal', [])).toBeUndefined();
  });
});

describe('Agent-Definition', () => {
  it('baut Ansage, Anweisung, Ziel-Schema und Werkzeuge aus Konfiguration und Betrieb', () => {
    const k = konfig({ fragen: konfigNormalisieren({}).fragen.map((f) => (f.id === 'erreichbarkeit' ? { ...f, an: false } : f)), bereitschaft: { nummer: '0170 1112223' } });
    const a = agentDefinition(k, { name: 'Haustechnik Yilmaz' }, zeiten, 'Kai Brandt');
    expect(a.ansage).toContain('digitalen Assistenten von Haustechnik Yilmaz');
    expect(a.anweisung).toContain('digitaler Assistent');
    expect(a.anweisung).toContain('112');
    expect(a.anweisung).toContain('Rohrbruch');
    expect(a.anweisung).toContain('Kai Brandt');
    expect(a.fragen.map((f) => f.id)).not.toContain('erreichbarkeit');
    const felder = a.zielSchema.properties!.felder;
    expect(Object.keys(felder.properties!)).toEqual(['anliegen', 'name', 'adresse', 'dringlichkeit', 'rueckrufnummer']);
    expect(felder.required).toEqual(['anliegen']);
    expect(felder.properties!.dringlichkeit.enum).toEqual(['normal', 'dringend', 'notfall']);
    expect(a.werkzeuge.map((w) => [w.name, w.capability, w.aktion])).toEqual([
      ['kunde_suchen', 'READ', 'call.customer_lookup'],
      ['anfrage_anlegen', 'WRITE', 'call.request_create'],
      ['rueckruf_anlegen', 'WRITE', 'call.callback_create'],
      ['an_bereitschaft_weiterleiten', 'WRITE', 'call.emergency_forward'],
    ]);
    expect(a.weiterleitung).toEqual({ nummer: '0170 1112223', name: 'Kai Brandt' });
    expect(a.annahme).toEqual({ modus: 'ausserhalb_keiner', nachSekunden: 20, geschaeftszeiten: 'Mo–Fr, 07:00–16:00 Uhr' });
  });
  it('ohne Weiterleitungsnummer keine Weiterleitung', () => {
    const a = agentDefinition(konfig(), { name: '' }, zeiten);
    expect(a.weiterleitung).toBeUndefined();
    expect(a.anweisung).toContain('sofort als Notfall an den Betrieb');
  });
});

describe('Gesprächsergebnis übersetzen', () => {
  const k = konfig();
  it('Notfall per Stichwort: Anfrage plus Weitergabe an die Bereitschaft', () => {
    const u = ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Rohrbruch im Keller, Wasser steht', adresse: 'Ahornweg 5, 34117 Kassel', erreichbarkeit: 'jederzeit' } }), k);
    expect(u).toMatchObject({ schritt: 'anfrage', dringlichkeit: 'notfall', notfall: true, notfallGrund: 'Stichwort „Rohrbruch“', aktionen: ['call.request_create', 'call.emergency_forward'] });
    expect(u.anliegen).toBe('Rohrbruch im Keller, Wasser steht\nAdresse: Ahornweg 5, 34117 Kassel\nErreichbar: jederzeit');
    expect(u.details).toMatchObject({ quelle: 'ki-assistent', ergebnis: 'weitergeleitet', dringlichkeit: 'notfall', status: 'neu' });
  });
  it('Einschätzung des Assistenten zählt ergänzend', () => {
    const u = ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Im Bad sprüht es aus der Wand' }, dringlichkeit: 'notfall' }), k);
    expect(u).toMatchObject({ notfall: true, notfallGrund: 'Einschätzung des Assistenten' });
  });
  it('dringend ohne Notfall, normale Anfrage mit eigener Rückrufnummer', () => {
    const u = ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Steckdose ohne Strom, bitte heute noch', rueckrufnummer: '0561 999' } }), k);
    expect(u).toMatchObject({ schritt: 'anfrage', dringlichkeit: 'dringend', notfall: false, nummer: '0561 999' });
    expect(u.anliegen).toContain('Rückrufnummer: 0561 999');
  });
  it('Rückruf: Vorschlag des Assistenten, Bitte um Rückruf, kein Anliegen, Frage eines bekannten Kunden', () => {
    expect(ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Dachfenster undicht' }, ergebnis: 'rueckruf' }), k).schritt).toBe('rueckruf');
    expect(ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Bitte rufen Sie mich zurück wegen dem Angebot' } }), k).schritt).toBe('rueckruf');
    expect(ergebnisUebersetzen(ergebnis({ felder: {} }), k)).toMatchObject({ schritt: 'rueckruf', anliegen: 'Anruf ohne Anliegen – bitte zurückrufen.' });
    expect(ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Frage zur Rechnung' } }), k, { kundeName: 'HV Nord', offeneAuftraege: 1 }).schritt).toBe('rueckruf');
    expect(ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Frage zur Rechnung' } }), k).schritt).toBe('anfrage');
  });
  it('Notiz nur auf Vorschlag', () => {
    expect(ergebnisUebersetzen(ergebnis({ felder: { anliegen: 'Wollte nur sagen, dass der Schlüssel beim Nachbarn liegt' }, ergebnis: 'notiz' }), k).aktionen).toEqual(['call.note_create']);
  });
  it('Rohe Nachricht vom Eingang lässt sich verlustfrei zurücklesen', () => {
    const e = ergebnis({ felder: { anliegen: 'Heizung tropft', name: 'Hr. Kaya' }, dauerSekunden: 80, ergebnis: 'rueckruf', weitergeleitet: true, dringlichkeit: 'dringend', transkript: [{ wer: 'anrufer', text: 'Heizung tropft' }] });
    const n = rohNachricht(e);
    expect(n).toMatchObject({ kanal: 'telefon', richtung: 'ein', betreff: 'Anruf von Hr. Kaya', text: 'Heizung tropft', gelesen: false });
    expect(n.anruf?.status).toBe('neu');
    expect(ergebnisAusDetails(n.anruf!)).toEqual(e);
  });
});

describe('adresseZerlegen', () => {
  it('teilt Straße, PLZ und Ort', () => {
    expect(adresseZerlegen('Ahornweg 5, 34117 Kassel')).toEqual({ strasse: 'Ahornweg 5', plz: '34117', ort: 'Kassel' });
    expect(adresseZerlegen('Lindenstr. 12a Baunatal')).toEqual({ strasse: 'Lindenstr. 12a', plz: '', ort: 'Baunatal' });
    expect(adresseZerlegen('Am Markt 3')).toEqual({ strasse: 'Am Markt 3', plz: '', ort: '' });
    expect(adresseZerlegen('irgendwo in Kassel')).toBeUndefined();
    expect(adresseZerlegen(undefined)).toBeUndefined();
  });
});
