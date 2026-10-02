import { describe, expect, it, vi } from 'vitest';
import type { Leistung, Artikel } from '@core/objects';
import { LOKALE_CLOUD, type Cloud } from '@core/cloud';
import { messpunkte } from '@core/messung';
import { on } from '@core/events';
import { positionenErkennen, zahlAusWort, einheitAusWort, zerlegen } from './sprache';
import { briefkopfVorSenden, dokumentVersendet, erstwertPfad, kontaktArt, sendenMitRueckfall, startHaken, startKarten, versandText } from './daten';

const l = (id: string, name: string, einheit: Leistung['einheit'], preis: number): Leistung => ({ id, name, einheit, preis, aktiv: true, erstelltAm: '', geaendertAm: '' });
const KATALOG: Leistung[] = [
  l('geselle', 'Arbeitsstunde Geselle', 'h', 6800),
  l('anfahrt', 'Anfahrtspauschale', 'Psch', 3900),
  l('steckdose', 'Steckdose setzen inkl. Dose', 'Stk', 6900),
  l('schalter', 'Lichtschalter tauschen', 'Stk', 4500),
  l('leitung', 'Leitung verlegen NYM 3x1,5 auf Putz', 'm', 1450),
  l('fi', 'FI-Schutzschalter nachrüsten', 'Stk', 21000),
  l('stoerung', 'Störungssuche', 'h', 7400),
  l('wand', 'Wandflächen streichen, 2 Anstriche', 'm²', 980),
];
const ARTIKEL: Artikel[] = [
  { id: 'nym', name: 'NYM-J 3x1,5 mm²', einheit: 'm', ek: 62, vk: 110, aktiv: true, erstelltAm: '', geaendertAm: '' } as Artikel,
  { id: 'wago', name: 'Wago-Klemme 3-fach', einheit: 'Stk', ek: 28, vk: 60, aktiv: true, erstelltAm: '', geaendertAm: '' } as Artikel,
  { id: 'schuko', name: 'Schuko-Steckdose reinweiß', einheit: 'Stk', ek: 390, vk: 850, aktiv: true, erstelltAm: '', geaendertAm: '' } as Artikel,
];

describe('Sprach-Parser: Zahlwörter', () => {
  it('liest einfache und zusammengesetzte Zahlwörter', () => {
    expect(zahlAusWort('zwei')).toBe(2);
    expect(zahlAusWort('Zehn')).toBe(10);
    expect(zahlAusWort('zwölf')).toBe(12);
    expect(zahlAusWort('fünfundzwanzig')).toBe(25);
    expect(zahlAusWort('einundvierzig')).toBe(41);
    expect(zahlAusWort('hundert')).toBe(100);
    expect(zahlAusWort('zweihundertfünfzig')).toBe(250);
    expect(zahlAusWort('dreitausend')).toBe(3000);
    expect(zahlAusWort('eineinhalb')).toBe(1.5);
    expect(zahlAusWort('zweieinhalb')).toBe(2.5);
    expect(zahlAusWort('anderthalb')).toBe(1.5);
    expect(zahlAusWort('eine')).toBe(1);
  });
  it('liest Ziffern mit Komma', () => {
    expect(zahlAusWort('10')).toBe(10);
    expect(zahlAusWort('2,5')).toBe(2.5);
    expect(zahlAusWort('Steckdose')).toBeUndefined();
    expect(zahlAusWort('und')).toBeUndefined();
  });
});

describe('Sprach-Parser: Einheiten und Zerlegen', () => {
  it('kennt die üblichen Einheiten', () => {
    expect(einheitAusWort('Meter')).toBe('m');
    expect(einheitAusWort('qm')).toBe('m²');
    expect(einheitAusWort('Quadratmeter')).toBe('m²');
    expect(einheitAusWort('Stunden')).toBe('h');
    expect(einheitAusWort('Std')).toBe('h');
    expect(einheitAusWort('Stück')).toBe('Stk');
    expect(einheitAusWort('Liter')).toBe('l');
    expect(einheitAusWort('Dose')).toBeUndefined();
  });
  it('zerlegt an Komma, „und“, „plus“ – aber nicht im Dezimalkomma oder Zahlwort', () => {
    expect(zerlegen('zwei Steckdosen, zehn Meter Leitung und Anfahrt')).toEqual(['zwei Steckdosen', 'zehn Meter Leitung', 'Anfahrt']);
    expect(zerlegen('2,5 m² Wand plus fünfundzwanzig Meter Leitung')).toEqual(['2,5 m² Wand', 'fünfundzwanzig Meter Leitung']);
  });
});

describe('Sprach-Parser: Katalog-Abgleich', () => {
  it('baut das Beispiel aus dem PRD mit Katalogpreisen', () => {
    const e = positionenErkennen('Zwei Steckdosen setzen, zehn Meter Leitung, Anfahrt', KATALOG, ARTIKEL);
    expect(e.map((x) => [x.leistung?.id, x.menge])).toEqual([
      ['steckdose', 2],
      ['leitung', 10],
      ['anfahrt', 1],
    ]);
  });
  it('nimmt Einheit und Stunden mit, Umlaute egal', () => {
    const e = positionenErkennen('drei Stunden Störungssuche und eineinhalb Stunden Geselle', KATALOG);
    expect(e.map((x) => [x.leistung?.id, x.menge, x.einheit])).toEqual([
      ['stoerung', 3, 'h'],
      ['geselle', 1.5, 'h'],
    ]);
  });
  it('Leistung vor Material, Material wenn keine Leistung passt', () => {
    expect(positionenErkennen('eine Steckdose', KATALOG, ARTIKEL)[0].leistung?.id).toBe('steckdose');
    expect(positionenErkennen('fünfzig Wago-Klemmen', KATALOG, ARTIKEL)[0]).toMatchObject({ artikel: { id: 'wago' }, menge: 50 });
  });
  it('was nicht im Katalog steht, wird eine freie Position', () => {
    const e = positionenErkennen('zwei Steckdosen, Bewegungsmelder montieren', KATALOG);
    expect(e).toHaveLength(2);
    expect(e[1].leistung).toBeUndefined();
    expect(e[1].roh).toBe('Bewegungsmelder montieren');
    expect(e[1].menge).toBe(1);
  });
  it('leerer Text ergibt nichts', () => {
    expect(positionenErkennen('', KATALOG)).toEqual([]);
    expect(positionenErkennen(' , und ', KATALOG)).toEqual([]);
  });
  it('2,5 Quadratmeter Wand streichen', () => {
    expect(positionenErkennen('2,5 Quadratmeter Wand streichen', KATALOG)[0]).toMatchObject({ leistung: { id: 'wand' }, menge: 2.5, einheit: 'm²' });
  });
});

describe('Was möchtest du als Erstes erledigen?', () => {
  it('Angebot vorn, ohne Geld-Recht nur Kunden und Auftrag', () => {
    expect(startKarten(true)).toEqual(['angebot', 'kunden', 'auftrag']);
    expect(startKarten(false)).toEqual(['kunden', 'auftrag']);
  });
  it('erkennt die drei First-Value-Pfade – Beispiele und Anfragen zählen nicht', () => {
    expect(erstwertPfad({ typ: 'angebot.erstellt', objekt: {} })).toBe('angebot');
    expect(erstwertPfad({ typ: 'auftrag.angelegt', objekt: { phase: 'auftrag' } })).toBe('auftrag');
    expect(erstwertPfad({ typ: 'auftrag.angelegt', objekt: { phase: 'anfrage' } })).toBeUndefined();
    expect(erstwertPfad({ typ: 'import.abgeschlossen' })).toBe('wechsel');
    expect(erstwertPfad({ typ: 'angebot.erstellt', objekt: { beispiel: true } })).toBeUndefined();
    expect(erstwertPfad({ typ: 'kunde.angelegt', objekt: {} })).toBeUndefined();
  });
});

describe('Macher fertig machen', () => {
  const betrieb = { onboardingFertig: true, gewerk: 'maler' as const };
  it('nach dem Magic Setup: 2 von 4 erledigt, jeder offene Haken mit konkretem Schritt', () => {
    const h = startHaken({ betrieb, kunden: [], mitarbeiter: [{ aktiv: true }] });
    expect(h.map((x) => x.titel)).toEqual(['Betrieb eingerichtet', 'Gewerk eingerichtet', 'Kunden & Preise übernehmen', 'Team hinzufügen']);
    expect(h.map((x) => x.erledigt)).toEqual([true, true, false, false]);
    expect(h.filter((x) => !x.erledigt).map((x) => x.aktion.pfad)).toEqual(['/betrieb/import?art=kunden', '/betrieb/mitarbeiter/neu']);
  });
  it('Beispieldaten zählen nicht', () => {
    const h = startHaken({ betrieb, kunden: [{ beispiel: true }], mitarbeiter: [{ aktiv: true }, { aktiv: true, beispiel: true }] });
    expect(h.map((x) => x.erledigt)).toEqual([true, true, false, false]);
  });
  it('erledigt mit echten Kunden, einem Import oder einer Einladung', () => {
    expect(startHaken({ betrieb, kunden: [{}], mitarbeiter: [{ aktiv: true }, { aktiv: true }] }).every((x) => x.erledigt)).toBe(true);
    expect(startHaken({ betrieb, kunden: [], mitarbeiter: [], datenUebernommen: true, teamEingeladen: true }).every((x) => x.erledigt)).toBe(true);
  });
});

describe('Briefkopf just in time', () => {
  const voll = { name: 'Maler Müller GmbH', adresse: { strasse: 'Musterstraße 12', plz: '97070', ort: 'Würzburg' }, steuernummer: '', ustId: 'DE123456789' };
  it('fragt nur, was fürs Dokument fehlt', () => {
    expect(briefkopfVorSenden(voll, 'Mein Betrieb')).toEqual([]);
    expect(briefkopfVorSenden({ ...voll, ustId: '' }, 'Mein Betrieb').map((l) => l.feld)).toEqual(['steuer']);
    expect(briefkopfVorSenden({ ...voll, name: 'Mein Betrieb', adresse: { strasse: '', plz: '', ort: '' } }, 'Mein Betrieb').map((l) => l.feld)).toEqual(['name', 'adresse']);
  });
});

describe('Versand mit Rückfall', () => {
  const v = { an: 'kunde@example.de', kanal: 'email' as const, betreff: 'Angebot', text: 'Guten Tag', link: 'https://x/k/abc' };
  const cloudMit = (senden: Cloud['senden']): Cloud => ({ ...LOKALE_CLOUD, aktiv: () => true, senden });

  it('nimmt die Cloud, wenn sie sendet', async () => {
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(LOKALE_CLOUD.senden) };
    const r = await sendenMitRueckfall(v, cloudMit(async () => ({ status: 'gesendet', id: 'm1' })), lokal);
    expect(r).toEqual({ status: 'gesendet', id: 'm1' });
    expect(lokal.senden).not.toHaveBeenCalled();
  });
  it('fällt bei Fehler auf das Mailprogramm zurück und sagt es ehrlich', async () => {
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'geoeffnet' as const })) };
    const r = await sendenMitRueckfall(v, cloudMit(async () => ({ status: 'fehler', fehler: 'Resend 500' })), lokal);
    expect(r).toMatchObject({ status: 'geoeffnet', rueckfall: true, fehler: 'Resend 500' });
    expect(lokal.senden).toHaveBeenCalledWith(v);
    expect(versandText(r, 'email', 'Dein Angebot')).toMatch(/nicht geklappt.*Mailprogramm ist offen/);
  });
  it('fällt auch zurück, wenn die Cloud wirft', async () => {
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'geoeffnet' as const })) };
    const r = await sendenMitRueckfall(v, cloudMit(async () => { throw new Error('offline'); }), lokal);
    expect(r).toMatchObject({ status: 'geoeffnet', rueckfall: true, fehler: 'offline' });
  });
  it('lokal ohne Cloud: kein doppeltes Öffnen', async () => {
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'geoeffnet' as const })) };
    const r = await sendenMitRueckfall(v, lokal, lokal);
    expect(r).toEqual({ status: 'geoeffnet' });
    expect(lokal.senden).toHaveBeenCalledTimes(1);
    expect(versandText(r, 'sms', 'x')).toMatch(/SMS-App ist offen/);
  });
  it('meldet dokument.versendet und den Messpunkt', () => {
    const events: unknown[] = [];
    const weg = on('dokument.versendet', (e) => events.push(e.daten));
    dokumentVersendet({ typ: 'angebote', id: 'a1' }, 'email', { status: 'gesendet' }, 95.4);
    weg();
    expect(events).toEqual([{ bezug: { typ: 'angebote', id: 'a1' }, kanal: 'email', status: 'gesendet' }]);
    expect(messpunkte().at(-1)).toMatchObject({ ereignis: 'erstwert.dokument_versendet', daten: { art: 'angebote', kanal: 'email', status: 'gesendet', sekunden: 95 } });
  });
  it('erkennt E-Mail und Telefon', () => {
    expect(kontaktArt('a@b.de')).toBe('email');
    expect(kontaktArt('0171 2345678')).toBe('sms');
    expect(kontaktArt('+49 (171) 234-56')).toBe('sms');
    expect(kontaktArt('Hoffmann')).toBeUndefined();
    expect(kontaktArt('123')).toBeUndefined();
  });
});
