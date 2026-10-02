import { describe, expect, it } from 'vitest';
import type { Betrieb } from '@core/objects';
import { db, zuruecksetzen } from '@core/db';
import { vorlagen } from '@modules/vorlagen/daten';
import { beispielAnzahl, beispieleEntfernenZaehlen, endgueltigLoeschen, fehlendeRechnungsangaben, ibanGueltig, objektTitel, papierkorbEintraege, sicherungErstellen, sicherungPruefen, ustIdFormatOk, wiederherstellen } from './daten';

const b = (x: Partial<Betrieb> = {}) =>
  ({ id: 'betrieb', erstelltAm: '', geaendertAm: '', name: 'Elektro Muster', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6800, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true, ...x }) as Betrieb;

const daten = () => ({
  betrieb: { betrieb: b() },
  kunden: {
    k1: { id: 'k1', erstelltAm: '', geaendertAm: '', name: 'Echt' },
    k2: { id: 'k2', erstelltAm: '', geaendertAm: '', name: 'Beispiel', beispiel: true },
    k3: { id: 'k3', erstelltAm: '', geaendertAm: '', name: 'Gelöscht', geloeschtAm: '2026-10-01T10:00:00Z' },
  },
  rechnungen: { r1: { id: 'r1', erstelltAm: '', geaendertAm: '', nummer: 'R-2026-0001', titel: 'Wartung', geloeschtAm: '2026-10-02T10:00:00Z' } },
  vorlagen: { v1: { id: 'v1', erstelltAm: '', geaendertAm: '', titel: 'Gruß', beispiel: true } },
  ereignisse: { e1: { id: 'e1', erstelltAm: '', geaendertAm: '', geloeschtAm: 'x' } },
});

/** Testdaten als Sammlungs-Quellen (wie `alleSammlungen()`) */
const quellen = (d: ReturnType<typeof daten>) => Object.entries(d).map(([name, t]) => ({ name, allMitGeloeschten: () => Object.values(t) as never[] }));

describe('Datensicherung', () => {
  it('erstellt und prüft eine Sicherung', () => {
    const s = sicherungErstellen(daten(), '2026-10-02T08:00:00Z');
    const p = sicherungPruefen(JSON.parse(JSON.stringify(s)));
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.betrieb).toBe('Elektro Muster');
      expect(p.anzahl).toBe(7);
      expect(p.erstelltAm).toBe('2026-10-02T08:00:00Z');
    }
  });
  it('nimmt auch rohe Daten an', () => {
    expect(sicherungPruefen(daten()).ok).toBe(true);
  });
  it('lehnt Kaputtes und Fremdes ab', () => {
    expect(sicherungPruefen('hallo')).toEqual({ ok: false, fehler: 'Die Datei ist keine Macher-Sicherung.' });
    expect(sicherungPruefen({ kunden: {} }).ok).toBe(false);
    expect(sicherungPruefen({ betrieb: { betrieb: b() }, kunden: { a: { id: 'b' } } }).ok).toBe(false);
    const fremd = sicherungPruefen({ format: 'macher-os-export', sammlungen: {} });
    expect(fremd.ok === false && fremd.fehler).toMatch(/JSON-Export/);
  });
});

describe('Beispieldaten', () => {
  it('zählt Beispiele in allen Sammlungen, auch in Modul-Sammlungen', () => {
    expect(beispielAnzahl(quellen(daten()))).toBe(2);
  });
  it('entfernt Beispiele über die Sammlungs-Registry, echte Daten bleiben', () => {
    zuruecksetzen();
    const echt = db.kunden.create({ art: 'privat', name: 'Echt', ansprechpartner: [] });
    db.kunden.create({ art: 'privat', name: 'Beispiel', ansprechpartner: [], beispiel: true });
    vorlagen.create({ schluessel: 'test.gruss', art: 'email', titel: 'Gruß', text: 'Hallo', beispiel: true });
    expect(beispielAnzahl()).toBe(2);
    expect(beispieleEntfernenZaehlen()).toBe(2);
    expect(db.kunden.all().map((k) => k.id)).toEqual([echt.id]);
    expect(vorlagen.allMitGeloeschten()).toEqual([]);
  });
});

describe('Papierkorb', () => {
  it('listet Gelöschtes, neueste zuerst, ohne interne Sammlungen', () => {
    const p = papierkorbEintraege(quellen(daten()));
    expect(p.map((x) => x.id)).toEqual(['r1', 'k3']);
    expect(p[0]).toMatchObject({ titel: 'R-2026-0001 · Wartung', art: 'Rechnung', aufbewahren: true });
    expect(p[1]).toMatchObject({ titel: 'Gelöscht', art: 'Kunde', aufbewahren: false });
  });
  it('stellt auch Einträge aus Modul-Sammlungen wieder her und löscht endgültig', () => {
    zuruecksetzen();
    const v = vorlagen.create({ schluessel: 'test.gruss', art: 'email', titel: 'Gruß', text: 'Hallo' });
    const k = db.kunden.create({ art: 'privat', name: 'Weg', ansprechpartner: [] });
    vorlagen.remove(v.id);
    db.kunden.remove(k.id);
    expect(papierkorbEintraege().map((e) => e.sammlung).sort()).toEqual(['kunden', 'vorlagen']);
    wiederherstellen('vorlagen', v.id);
    expect(vorlagen.get(v.id)?.geloeschtAm).toBeUndefined();
    endgueltigLoeschen([{ sammlung: 'kunden', id: k.id }]);
    expect(db.kunden.allMitGeloeschten()).toEqual([]);
    expect(papierkorbEintraege()).toEqual([]);
  });
  it('findet lesbare Titel', () => {
    expect(objektTitel({ vorname: 'Jonas', nachname: 'Becker' })).toBe('Jonas Becker');
    expect(objektTitel({ typ: 'Gasheizung' })).toBe('Gasheizung');
    expect(objektTitel({})).toBe('Ohne Titel');
  });
});

describe('Betriebsdaten', () => {
  it('prüft IBAN und USt-IdNr.', () => {
    expect(ibanGueltig('DE02 1203 0000 0000 2020 51')).toBe(true);
    expect(ibanGueltig('DE02120300000000202052')).toBe(false);
    expect(ibanGueltig('DE0212030000')).toBe(false);
    expect(ustIdFormatOk('DE123456789')).toBe(true);
    expect(ustIdFormatOk('DE12345')).toBe(false);
  });
  it('nennt fehlende Rechnungsangaben', () => {
    expect(fehlendeRechnungsangaben(b())).toEqual(['Anschrift', 'Steuernummer oder USt-IdNr.', 'Bankverbindung', 'Telefon oder E-Mail']);
    expect(fehlendeRechnungsangaben(b({ adresse: { strasse: 'Weg 1', plz: '34117', ort: 'Kassel' }, ustId: 'DE123456789', iban: 'DE02120300000000202051', email: 'a@b.de' }))).toEqual([]);
  });
});
