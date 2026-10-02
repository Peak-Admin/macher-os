import { describe, expect, it } from 'vitest';
import { ansprechpartnerAnzeige } from './ansprechpartner';
import { ersteSchritte, type ErsteSchritteStand } from './ersteSchritte';

const leer: ErsteSchritteStand = { kunden: [], mitarbeiter: [], auftraege: [], angebote: [], rechnungen: [], darfGeld: true };
const briefkopf = { name: 'Elektro Meister', adresse: { strasse: 'Hauptstr. 1', plz: '80331', ort: 'München' }, steuernummer: '143/123/45678' };
const offen = (s: ErsteSchritteStand) => ersteSchritte(s).filter((x) => !x.erledigt).map((x) => x.id);

describe('Erste Schritte', () => {
  it('neuer Betrieb: alles offen, in fester Reihenfolge mit konkreter Aktion', () => {
    const s = ersteSchritte(leer);
    expect(s.map((x) => x.id)).toEqual(['briefkopf', 'kunde', 'auftrag', 'angebot', 'team']);
    expect(s.every((x) => !x.erledigt && x.aktion.pfad.startsWith('/'))).toBe(true);
  });

  it('Häkchen setzen sich aus echten Daten – Beispieldaten zählen nie', () => {
    const beispiel = { beispiel: true };
    expect(
      offen({
        ...leer,
        kunden: [beispiel],
        auftraege: [{ ...beispiel, phase: 'beauftragt' }],
        angebote: [beispiel],
        rechnungen: [beispiel],
        mitarbeiter: [{ aktiv: true, beispiel: true }, { aktiv: true, beispiel: true }],
      }),
    ).toEqual(['briefkopf', 'kunde', 'auftrag', 'angebot', 'team']);
    expect(
      offen({
        ...leer,
        betrieb: briefkopf,
        kunden: [{}],
        auftraege: [{ phase: 'beauftragt' }],
        rechnungen: [{}],
        mitarbeiter: [{ aktiv: true }, { aktiv: true }],
      }),
    ).toEqual([]);
  });

  it('Anfrage ist noch kein Auftrag; Platzhaltername zählt nicht als Briefkopf; Einladung zählt als Team', () => {
    const s = offen({ ...leer, betrieb: { ...briefkopf, name: 'Mein Betrieb' }, auftraege: [{ phase: 'anfrage' }], teamEingeladen: true });
    expect(s).toEqual(['briefkopf', 'kunde', 'auftrag', 'angebot']);
  });

  it('ohne Geld-Recht kein Schritt „Angebot oder Rechnung“', () => {
    expect(ersteSchritte({ ...leer, darfGeld: false }).map((x) => x.id)).not.toContain('angebot');
  });
});

describe('Ansprechpartner', () => {
  it('ohne Konfiguration: kein Ansprechpartner (neutraler Text statt erfundener Daten)', () => {
    expect(ansprechpartnerAnzeige(null)).toBeNull();
    expect(ansprechpartnerAnzeige({ name: '  ' })).toBeNull();
  });

  it('baut Initialen, Telefon- und Mail-Links; Foto nur mit Freigabe', () => {
    const p = ansprechpartnerAnzeige({ name: 'Erika Beispiel', telefon: '+49 (89) 123 45', email: 'erika@example.org', foto: '/bilder/x.webp' }, ['/bilder/frei.webp']);
    expect(p).toMatchObject({ initialen: 'EB', telefon: { href: 'tel:+498912345' }, email: { href: 'mailto:erika@example.org' } });
    expect(p!.foto).toBeUndefined();
    expect(ansprechpartnerAnzeige({ name: 'Erika Beispiel', foto: '/bilder/frei.webp' }, ['/bilder/frei.webp'])!.foto).toBe('/bilder/frei.webp');
  });
});
