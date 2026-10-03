import { describe, expect, it } from 'vitest';
import { naechsteAktionen, type NaechsterSchrittStand } from './naechsterSchritt';

const basis = (teil: Partial<NaechsterSchrittStand> = {}): NaechsterSchrittStand => ({
  heute: '2026-10-02',
  buero: true,
  darfGeld: true,
  einrichtung: [],
  anfragen: [],
  angebote: [],
  abzurechnen: [],
  ueberfaellig: [],
  ueberfaelligeAufgaben: 0,
  nachfassenTage: 7,
  kundenName: (id) => (id ? { k1: 'Müller', k2: 'Schneider' }[id] : undefined),
  pfad: (b) => `/${b.typ}/${b.id}`,
  ...teil,
});

const haken = (erledigt: boolean[]) =>
  erledigt.map((e, i) => ({ id: `h${i}`, titel: `Schritt ${i}`, erledigt: e, aktion: { label: `Schritt ${i} erledigen`, pfad: `/s/${i}` } }));

describe('Dein nächster Schritt', () => {
  it('ohne offene Themen gibt es keine Aktion (→ „Alles eingerichtet“)', () => {
    expect(naechsteAktionen(basis())).toEqual([]);
  });

  it('„Handwerk OS einrichten“: optional, ausblendbar, mit Fortschritt und erstem offenen Schritt', () => {
    const [a] = naechsteAktionen(basis({ einrichtung: haken([true, true, false, false]) }));
    expect(a.type).toBe('onboarding');
    expect(a.title).toBe('Handwerk OS einrichten');
    expect(a.actionLabel).toBe('Weiter einrichten');
    expect(a.actionUrl).toBe('/s/2');
    expect(a.progress).toMatchObject({ erledigt: 2, gesamt: 4 });
    expect(a.ausblenden).toBe('start.karteAus');
    // Die Einrichtungsansicht zeigt den aktiven Schritt mit seiner eigenen Aktion
    expect(a.progress?.schritte?.find((s) => !s.erledigt)).toMatchObject({ id: 'h2', aktion: { label: 'Schritt 2 erledigen', pfad: '/s/2' } });
  });

  it('nach der Aktivierung verschwindet die Einrichtung komplett – auch ausgeblendet ist sie weg', () => {
    expect(naechsteAktionen(basis({ einrichtung: haken([true, true, true, true]) })).some((a) => a.type === 'onboarding')).toBe(false);
    // ausgeblendet (`start.karteAus`): useStartHaken liefert keine Haken mehr
    expect(naechsteAktionen(basis({ einrichtung: [] })).some((a) => a.type === 'onboarding')).toBe(false);
  });

  it('echte Arbeit geht vor dem Einrichten', () => {
    const liste = naechsteAktionen(basis({ einrichtung: haken([true, false]), anfragen: [{ id: 'a1', titel: 'Bad' }] }));
    expect(liste.map((a) => a.type)).toEqual(['anfragen', 'onboarding']);
  });

  it('nach der Einrichtung wird es zur Next-Best-Action: Anfragen vor Angeboten vor Rechnungen', () => {
    const liste = naechsteAktionen(
      basis({
        einrichtung: haken([true, true, true]),
        anfragen: [{ id: 'a1', titel: 'Bad undicht' }, { id: 'a2', titel: 'Heizung' }, { id: 'a3', titel: 'Fenster' }],
        angebote: [{ id: 'an1', titel: 'Badrenovierung', status: 'entwurf', kundeId: 'k1', geaendertAm: '2026-10-01T08:00:00Z' }],
        abzurechnen: [{ id: 'au1', titel: 'Therme getauscht', kundeId: 'k2' }],
      }),
    );
    expect(liste.map((a) => a.type)).toEqual(['anfragen', 'angebot_versenden', 'rechnung_erstellen']);
    expect(liste[0].title).toBe('3 neue Kundenanfragen warten auf dich');
    expect(liste[1].title).toBe('Dein Angebot für Müller ist noch nicht verschickt');
    expect(liste[1].actionUrl).toBe('/angebote/an1');
    expect(liste[2].title).toBe('Eine Rechnung kann jetzt erstellt werden');
  });

  it('respektiert Rechte: ohne Geld-Recht keine Angebote, Rechnungen oder Einrichtung', () => {
    const liste = naechsteAktionen(
      basis({
        darfGeld: false,
        einrichtung: haken([false, false, false]),
        angebote: [{ id: 'an1', titel: 'X', status: 'entwurf', kundeId: 'k1', geaendertAm: '2026-10-01' }],
        ueberfaellig: [{ id: 'r1', nummer: 'R-1', kundeId: 'k1' }],
      }),
    );
    expect(liste).toEqual([]);
  });

  it('ein laufender Einsatz steht immer oben', () => {
    const liste = naechsteAktionen(
      basis({
        anfragen: [{ id: 'a1', titel: 'Bad' }],
        einsatz: { id: 't1', titel: 'Therme Müller', status: 'vor_ort', start: '2026-10-02T08:00:00Z' },
      }),
    );
    expect(liste[0].type).toBe('einsatz');
    expect(liste[0].title).toBe('Einsatz läuft: Therme Müller');
  });

  it('Monteur: der heutige Einsatz ist der nächste Schritt, keine Büro-Themen', () => {
    const liste = naechsteAktionen(
      basis({
        buero: false,
        darfGeld: false,
        anfragen: [{ id: 'a1', titel: 'Bad' }],
        einsatz: { id: 't1', titel: 'Wartung Schneider', status: 'geplant', start: '2026-10-02T10:00:00Z' },
      }),
    );
    expect(liste.map((a) => a.type)).toEqual(['einsatz']);
    expect(liste[0].title).toBe('Heute: Wartung Schneider');
  });

  it('fasst Angebote nach, die länger als die Frist ohne Antwort sind', () => {
    const liste = naechsteAktionen(
      basis({
        angebote: [
          { id: 'n1', titel: 'Dach', status: 'versendet', versendetAm: '2026-09-20T09:00:00Z', kundeId: 'k2', geaendertAm: '2026-09-20' },
          { id: 'n2', titel: 'Neu', status: 'versendet', versendetAm: '2026-10-01T09:00:00Z', kundeId: 'k1', geaendertAm: '2026-10-01' },
        ],
      }),
    );
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ type: 'angebot_nachfassen', title: 'Frag bei Schneider nach' });
    expect(liste[0].description).toContain('seit 12 Tagen');
  });
});
