import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { on, type DbEvent } from '@core/events';
import { FACHRICHTUNGEN, GEWERKE, VORLAGEN, VORLAGE_KEY, ablaufVorlageFuer, felderFuer, fachrichtungenFuer, gewerkVorlage, vorlageFuer } from '@core/gewerke';
import { automationAn } from '@core/macher';
import { registriereModule, type ModulDef } from '@core/modul';
import { heute, plusTage, zeitpunkt } from '@core/format';
import type { Auftrag, Auftragsart, Phase } from '@core/objects';
import { LEERER_BRIEFKOPF, setupEinrichten } from '@modules/onboarding/daten';
import { checklistenVorlagen } from '@modules/checklisten/daten';
import modulAblauf from './index';
import { ablaeufe, ablaufFuer, ablaufSpeichern, alleAblaeufe, anpassen, aufVorlageZuruecksetzen, begriff, mitfuehren, schrittstaende, standVon, weiter } from './daten';
import { ablaufHinweise } from './hinweise';
import { ablaufPruefen, aktuellerSchritt, nachPhaseSortiert, phasenIndex, weiterMoeglich, weiterVonHand, type AblaufDef } from './logik';
import { beiAbnahme, beiBezahlt, beiZusage } from './regeln';

const ARTEN: Auftragsart[] = ['kundendienst', 'projekt', 'wartung', 'reklamation', 'werkstatt'];

// ------------------------------------------------------------------ Vorlagen (Template Engine)

describe('Gewerk-Vorlagen', () => {
  it('kennt alle Gewerke wie bisher und die Fachrichtungen Solar, Fensterbau, Gebäudereinigung', () => {
    expect(GEWERKE.map((g) => g.id)).toEqual(['elektro', 'shk', 'maler', 'dach', 'tischler', 'fliesen', 'garten', 'metall', 'bau', 'sonstiges']);
    expect(FACHRICHTUNGEN.map((f) => [f.id, f.gewerk])).toEqual([
      ['solar', 'elektro'],
      ['fensterbau', 'tischler'],
      ['reinigung', 'sonstiges'],
    ]);
    expect(fachrichtungenFuer('elektro').map((f) => f.id)).toEqual(['solar']);
    expect(fachrichtungenFuer('maler')).toEqual([]);
  });

  it('wählt die Vorlage: Fachrichtung nur, wenn sie zum Gewerk passt', () => {
    expect(vorlageFuer('elektro', 'solar').id).toBe('solar');
    expect(vorlageFuer('maler', 'solar').id).toBe('maler');
    expect(vorlageFuer(undefined).id).toBe('sonstiges');
    expect(gewerkVorlage('dach').gewerk).toBe('dach');
  });

  for (const v of VORLAGEN) {
    describe(v.label, () => {
      it('hat Begriffe, Auftragsarten, Leistungen, Planung und Heute-Inhalte', () => {
        expect(v.begriffe.einsatzort).toBeTruthy();
        expect(v.auftragsarten.length).toBeGreaterThan(0);
        expect(v.leistungen.length).toBeGreaterThan(3);
        expect(v.dokumente).toContain('Rechnung');
        expect(v.heute[0]).toBe('einsaetze');
        expect(v.artikelgruppen.length).toBeGreaterThan(0);
      });

      it('hat gültige Abläufe: Phasen in Reihenfolge, eindeutige Schritte, Standard-Schritte für die Regeln', () => {
        expect(v.ablaeufe.length).toBeGreaterThan(0);
        for (const a of v.ablaeufe) {
          expect(ablaufPruefen(a)).toBeUndefined();
          const idx = a.schritte.map((s) => phasenIndex(s.phase));
          expect(idx).toEqual([...idx].sort((x, y) => x - y));
          expect(a.schritte[0].phase).toBe('anfrage');
          expect(a.schritte.at(-1)!.phase).toBe('erledigt');
        }
        const projekt = ablaufVorlageFuer(v, 'projekt');
        for (const id of ['vorbereitung', 'rechnung', 'bezahlt', 'warten-kunde']) expect(projekt.schritte.some((s) => s.id === id)).toBe(true);
        // jede Auftragsart findet einen Ablauf
        for (const art of ARTEN) expect(ablaufVorlageFuer(v, art)).toBeTruthy();
      });

      it('liefert Feldvorlagen im einfachen Format für die Felder-Engine', () => {
        for (const f of v.felder) {
          expect(f.schluessel).toMatch(/^[a-z0-9_]+$/);
          expect(['text', 'zahl', 'auswahl', 'ja_nein', 'datum']).toContain(f.typ);
          if (f.typ === 'auswahl') expect(f.optionen?.length).toBeGreaterThan(1);
        }
        expect(new Set(v.felder.map((f) => `${f.objekt}:${f.schluessel}`)).size).toBe(v.felder.length);
      });
    });
  }

  it('filtert Feldvorlagen nach Objekt', () => {
    const solar = vorlageFuer('elektro', 'solar');
    expect(felderFuer(solar, 'aufmasse').every((f) => f.objekt === 'aufmasse')).toBe(true);
    expect(felderFuer(solar, 'aufmasse').map((f) => f.schluessel)).toContain('dachneigung');
  });

  it('nutzt passende Begriffe je Gewerk', () => {
    expect(vorlageFuer('sonstiges', 'reinigung').begriffe.einsatzort).toBe('Objekt');
    expect(gewerkVorlage('dach').begriffe.einsatzort).toBe('Baustelle');
  });
});

// ------------------------------------------------------------------ Reine Logik

const ABLAUF: AblaufDef = {
  id: 'p',
  name: 'P',
  arten: ['projekt'],
  schritte: [
    { id: 'anfrage', label: 'Neue Anfrage', phase: 'anfrage' },
    { id: 'angebot', label: 'Angebot', phase: 'angebot' },
    { id: 'warten-kunde', label: 'Warten auf Kunde', phase: 'angebot', automatisch: 'angebot_versendet' },
    { id: 'beauftragt', label: 'Beauftragt', phase: 'beauftragt' },
    { id: 'vorbereitung', label: 'Vorbereitung', phase: 'beauftragt' },
    { id: 'eingeplant', label: 'Eingeplant', phase: 'beauftragt', automatisch: 'termin_geplant' },
    { id: 'bezahlt', label: 'Bezahlt', phase: 'erledigt' },
  ],
};

describe('Aktueller Schritt', () => {
  it('nimmt den ersten Schritt der Phase', () => {
    expect(aktuellerSchritt(ABLAUF, 'beauftragt', undefined, {}).schritt.id).toBe('beauftragt');
  });
  it('bleibt beim gespeicherten Schritt, wenn er zur Phase passt', () => {
    expect(aktuellerSchritt(ABLAUF, 'beauftragt', 'vorbereitung', {}).schritt.id).toBe('vorbereitung');
    expect(aktuellerSchritt(ABLAUF, 'angebot', 'vorbereitung', {}).schritt.id).toBe('angebot');
  });
  it('geht automatisch weiter, wenn die Bedingung eines späteren Schritts erfüllt ist', () => {
    expect(aktuellerSchritt(ABLAUF, 'angebot', undefined, { angebot_versendet: true }).schritt.id).toBe('warten-kunde');
    expect(aktuellerSchritt(ABLAUF, 'beauftragt', 'vorbereitung', { termin_geplant: true }).schritt.id).toBe('eingeplant');
  });
  it('kennt Phasen ohne Schritt und das Ende', () => {
    const x = aktuellerSchritt(ABLAUF, 'in_arbeit', undefined, {});
    expect(x).toMatchObject({ index: -1, fertig: false, schritt: { label: 'In Arbeit' } });
    expect(aktuellerSchritt(ABLAUF, 'erledigt', undefined, {})).toMatchObject({ fertig: true, schritt: { id: 'bezahlt' } });
    expect(aktuellerSchritt(ABLAUF, 'verloren', undefined, {}).schritt.label).toBe('Nicht zustande gekommen');
  });
  it('erlaubt „weiter“ von Hand nur innerhalb der Phase und nicht zu Schritten, die von selbst kommen', () => {
    expect(weiterMoeglich(ABLAUF, aktuellerSchritt(ABLAUF, 'beauftragt', undefined, {}))?.id).toBe('vorbereitung');
    expect(weiterMoeglich(ABLAUF, aktuellerSchritt(ABLAUF, 'anfrage', undefined, {}))).toBeUndefined();
    expect(weiterVonHand(ABLAUF, aktuellerSchritt(ABLAUF, 'beauftragt', undefined, {}))?.id).toBe('vorbereitung');
    expect(weiterVonHand(ABLAUF, aktuellerSchritt(ABLAUF, 'beauftragt', 'vorbereitung', {}))).toBeUndefined();
  });
  it('sortiert stabil nach Phase und prüft vor dem Speichern', () => {
    const s = nachPhaseSortiert([ABLAUF.schritte[3], ABLAUF.schritte[0], ABLAUF.schritte[4]]);
    expect(s.map((x) => x.id)).toEqual(['anfrage', 'beauftragt', 'vorbereitung']);
    expect(ablaufPruefen({ ...ABLAUF, name: ' ' })).toMatch(/Namen/);
    expect(ablaufPruefen({ ...ABLAUF, arten: [] })).toMatch(/Auftragsart/);
    expect(ablaufPruefen({ ...ABLAUF, schritte: [{ id: 'a', label: 'A', phase: 'anfrage', fristTage: 0 }] })).toMatch(/Fristen/);
    expect(ablaufPruefen({ ...ABLAUF, schritte: [ABLAUF.schritte[0], ABLAUF.schritte[0]] })).toMatch(/Kennung/);
  });
});

// ------------------------------------------------------------------ Engine mit Daten und Regeln

function betriebAnlegen(gewerk: 'elektro' | 'dach' = 'elektro') {
  db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk, arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  db.mitarbeiter.create({ id: 'chef', vorname: 'Eva', nachname: 'Chef', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  db.mitarbeiter.create({ id: 'buero', vorname: 'Ben', nachname: 'Büro', rolle: 'buero', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
}

const neu = (x: Partial<Auftrag> = {}) => db.auftraege.create({ nummer: 'A-1', titel: 'Wallbox', art: 'projekt', phase: 'anfrage', kundeId: 'k', verantwortlichId: 'chef', ...x });

let stoppen: (() => void)[] = [];
function engineStarten(weitere: ModulDef[] = []) {
  stoppen.forEach((f) => f());
  registriereModule([modulAblauf, ...weitere]);
  // init (Schrittstand mitführen) und die Regeln wie beim App-Start
  modulAblauf.init?.();
  stoppen = (modulAblauf.automationen ?? []).map((a) => a.start());
}

describe('Ablauf-Engine am Auftrag', () => {
  beforeEach(() => {
    zuruecksetzen();
    betriebAnlegen();
    engineStarten();
  });

  it('gilt die Vorlage des Gewerks, bis der Betrieb anpasst', () => {
    expect(alleAblaeufe().map((a) => a.id)).toEqual(['projekt', 'kundendienst', 'wartung', 'reklamation']);
    expect(ablaufFuer({ id: 'x', art: 'kundendienst' }).id).toBe('kundendienst');
    setzeEinstellung(VORLAGE_KEY, 'solar');
    expect(ablaufFuer({ id: 'x', art: 'projekt' }).schritte.some((s) => s.id === 'netzanmeldung')).toBe(true);
    expect(begriff('einsatzort')).toBe('Baustelle');
  });

  it('führt den Schritt mit: Angebot verschickt → „Warten auf Kunde“ mit Ereignis und Verlauf', () => {
    const ereignisse: DbEvent[] = [];
    const aus = on('auftrag.schritt_gewechselt', (e) => ereignisse.push(e));
    const a = neu({ phase: 'angebot' });
    expect(schrittstaende.get(a.id)?.schrittId).toBe('angebot');
    expect(ereignisse).toHaveLength(0); // erster Stand still
    db.angebote.create({ nummer: 'AN-1', auftragId: a.id, kundeId: 'k', titel: '', positionen: [], status: 'versendet', datum: heute(), gueltigBis: heute(), version: 1 });
    expect(standVon(db.auftraege.get(a.id)!).schritt.label).toBe('Warten auf Kunde');
    expect(schrittstaende.get(a.id)?.schrittId).toBe('warten-kunde');
    expect(ereignisse.at(-1)?.daten).toMatchObject({ auftragId: a.id, von: 'angebot', nach: 'warten-kunde' });
    expect(db.ereignisse.all().some((e) => e.typ === 'auftrag.schritt_gewechselt' && e.text.includes('Warten auf Kunde'))).toBe(true);
    aus();
  });

  it('Zusage → Vorbereitung, Phase „Beauftragt“, Planung benachrichtigt, Material-Hinweis; Termin → Eingeplant', () => {
    const a = neu({ phase: 'angebot' });
    expect(beiZusage(a.id)).toBe(true);
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
    expect(standVon(db.auftraege.get(a.id)!).schritt.id).toBe('vorbereitung');
    expect(db.benachrichtigungen.all().map((b) => b.fuerMitarbeiterId)).toEqual(['buero']);
    expect(db.erledigungen.all().some((e) => e.regel === 'ablauf.zusage')).toBe(true);
    const h = ablaufHinweise().find((x) => x.schluessel === `ablauf-material:${a.id}`);
    expect(h?.aktionen?.map((x) => x.aktion)).toEqual(['auftrag.oeffnen', 'ablauf.material-geklaert']);

    db.termine.create({ art: 'einsatz', titel: '', start: zeitpunkt(plusTage(heute(), 3), '08:00'), ende: zeitpunkt(plusTage(heute(), 3), '12:00'), mitarbeiterIds: ['chef'], status: 'geplant', auftragId: a.id });
    expect(schrittstaende.get(a.id)?.schrittId).toBe('eingeplant');
    expect(ablaufHinweise().some((x) => x.schluessel === `ablauf-material:${a.id}`)).toBe(false);
  });

  it('„Material ist geklärt“ blendet den Hinweis aus', () => {
    const a = neu({ phase: 'angebot' });
    beiZusage(a.id);
    modulAblauf.aktionen!['ablauf.material-geklaert']({ auftragId: a.id });
    expect(ablaufHinweise().some((x) => x.schluessel === `ablauf-material:${a.id}`)).toBe(false);
    expect(standVon(db.auftraege.get(a.id)!).schritt.id).toBe('vorbereitung');
  });

  it('reagiert auf angenommene Angebote über Events', () => {
    const a = neu({ phase: 'angebot' });
    const an = db.angebote.create({ nummer: 'AN-1', auftragId: a.id, kundeId: 'k', titel: '', positionen: [], status: 'versendet', datum: heute(), gueltigBis: heute(), version: 1 });
    db.angebote.update(an.id, { status: 'angenommen' });
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
    expect(schrittstaende.get(a.id)?.schrittId).toBe('vorbereitung');
  });

  it('von Hand weiter nur innerhalb der Phase', () => {
    const a = neu({ phase: 'beauftragt' });
    expect(weiter(a.id)?.schritt.id).toBe('vorbereitung');
    expect(weiter(a.id)?.schritt.id).toBe('eingeplant'); // z. B. Termin steht schon außerhalb
    expect(weiter(a.id)).toBeUndefined(); // „In Arbeit“ ist eine neue Phase – das macht die Hauptaktion
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
  });

  it('erinnert nach Ablauf der Frist an die zuständige Person', () => {
    const a = neu({ phase: 'beauftragt' });
    weiter(a.id); // Vorbereitung, Frist 5 Tage, zuständig: verantwortlich
    schrittstaende.update(a.id, { seit: new Date(Date.now() - 9 * 86_400_000).toISOString() });
    const h = ablaufHinweise().find((x) => x.schluessel.startsWith(`ablauf-frist:${a.id}`));
    expect(h).toMatchObject({ art: 'problem', fuerMitarbeiterId: 'chef' });
    expect(h?.titel).toContain('Material, Werkzeug und Termin vorbereiten');
    // „Eingeplant“ kommt von selbst – also führt die Erinnerung zur Hauptaktion des Auftrags
    expect(h?.aktionen?.[0]).toMatchObject({ aktion: 'auftrag.oeffnen', primaer: true });
  });

  it('bei Schritten von Hand bietet die Erinnerung „Erledigt“ an (Dach: Gerüst bestellen)', () => {
    db.betrieb.update('betrieb', { gewerk: 'dach' });
    const a = neu({ phase: 'beauftragt' });
    expect(weiter(a.id)?.schritt.id).toBe('geruest');
    schrittstaende.update(a.id, { seit: new Date(Date.now() - 6 * 86_400_000).toISOString() });
    const h = ablaufHinweise().find((x) => x.schluessel.startsWith(`ablauf-frist:${a.id}`));
    expect(h?.fuerMitarbeiterId).toBe('buero');
    expect(h?.aktionen?.[0]).toMatchObject({ aktion: 'ablauf.weiter', primaer: true });
    modulAblauf.aktionen!['ablauf.weiter']({ auftragId: a.id });
    expect(standVon(db.auftraege.get(a.id)!).schritt.label).toBe('Material bestellen');
  });

  it('Abnahme → Schritt „Rechnung“ und Vorschlag „Rechnung vorbereiten“, wenn ein Rechnungsmodul da ist', () => {
    const a = neu({ phase: 'abnahme' });
    engineStarten([{ id: 'geld', titel: 'G', bereich: 'betrieb', beschreibung: '', aktionen: { 'rechnung.erstellen': () => '/r' } }]);
    expect(beiAbnahme(a.id)).toBe(true);
    expect(db.auftraege.get(a.id)?.phase).toBe('abrechnung');
    expect(standVon(db.auftraege.get(a.id)!).schritt.id).toBe('rechnung');
    expect(ablaufHinweise().find((x) => x.schluessel === `ablauf-rechnung:${a.id}`)?.aktionen?.[0].aktion).toBe('rechnung.erstellen');
  });

  it('Rechnung bezahlt → Auftrag abgeschlossen, Schritt „Bezahlt“', () => {
    const a = neu({ phase: 'abrechnung' });
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId: 'k', auftragId: a.id, titel: '', positionen: [], status: 'versendet', datum: heute(), faelligAm: heute(), mahnstufe: 0 });
    expect(standVon(db.auftraege.get(a.id)!).schritt.id).toBe('warten-zahlung');
    db.rechnungen.update(r.id, { status: 'bezahlt' });
    expect(db.auftraege.get(a.id)?.phase).toBe('erledigt');
    expect(schrittstaende.get(a.id)?.schrittId).toBe('bezahlt');
    expect(beiBezahlt(a.id)).toBe(true); // nochmal: nichts doppelt
    expect(db.erledigungen.all().filter((e) => e.regel === 'ablauf.bezahlt')).toHaveLength(1);
  });

  it('anpassen behält die IDs, speichert eigene Schritte und lässt sich zurücksetzen', () => {
    const a = neu({ phase: 'anfrage' });
    mitfuehren(a.id);
    anpassen();
    expect(ablaeufe.all().map((x) => x.id)).toEqual(['projekt', 'kundendienst', 'wartung', 'reklamation']);
    const p = ablaufFuer(a);
    ablaufSpeichern({ ...p, schritte: [...p.schritte, { id: 'eigen', label: 'Gerüst bestellen', phase: 'beauftragt' as Phase }] });
    expect(ablaufFuer(a).schritte.some((s) => s.id === 'eigen')).toBe(true);
    expect(ablaufFuer(a).id).toBe('projekt');
    aufVorlageZuruecksetzen();
    expect(ablaeufe.all()).toHaveLength(0);
    expect(ablaufFuer(a).schritte.some((s) => s.id === 'eigen')).toBe(false);
  });
});

// ------------------------------------------------------------------ Onboarding: Vorkonfiguration

describe('Onboarding mit Gewerk-Vorlage', () => {
  const briefkopf = { ...LEERER_BRIEFKOPF, name: 'Sonne GmbH', inhaber: 'Eva Sonne' };
  const fake: ModulDef = {
    id: 'fake',
    titel: 'F',
    bereich: 'betrieb',
    beschreibung: '',
    automationen: [{ id: 'bewertungen.vorbereiten', titel: 'B', beschreibung: '', standardAn: true, start: () => () => {} }],
  };

  beforeEach(() => registriereModule([fake]));

  it('Solar: Fachrichtung gemerkt, eigene Leistungen, Material, Checklisten – Abläufe folgen', () => {
    setupEinrichten({ gewerk: 'elektro', fachrichtung: 'solar', briefkopf, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    expect(db.betrieb.get('betrieb')?.gewerk).toBe('elektro');
    expect(einstellung(VORLAGE_KEY, '')).toBe('solar');
    expect(db.leistungen.all().some((l) => l.name === 'Anmeldung beim Netzbetreiber')).toBe(true);
    expect(db.artikel.all().some((x) => x.name === 'Modulklemme')).toBe(true);
    expect(checklistenVorlagen.all().some((c) => c.name === 'PV-Montage')).toBe(true);
    expect(ablaufFuer({ id: 'x', art: 'projekt' }).name).toBe('PV-Anlage mit Angebot');
  });

  it('Gebäudereinigung: Stundensatz der Vorlage, Bewertungsanfrage nach jeder Reinigung aus', () => {
    setupEinrichten({ gewerk: 'sonstiges', fachrichtung: 'reinigung', briefkopf, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    expect(db.betrieb.get('betrieb')?.stundensatz).toBe(3800);
    expect(automationAn('bewertungen.vorbereiten')).toBe(false);
    expect(begriff('einsatzort')).toBe('Objekt');
  });

  it('ohne Fachrichtung bleibt alles beim Gewerk – zweimal anwenden legt nichts doppelt an', () => {
    setupEinrichten({ gewerk: 'dach', briefkopf, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    expect(einstellung(VORLAGE_KEY, '')).toBe('');
    const n = checklistenVorlagen.all().filter((c) => c.name === 'Sturmschaden-Einsatz').length;
    expect(n).toBe(1);
    expect(automationAn('bewertungen.vorbereiten')).toBe(true);
  });
});
