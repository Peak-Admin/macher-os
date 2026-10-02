import { describe, expect, it } from 'vitest';
import type { Aufgabe } from '@core/objects';
import { arbeitsposten, nachGruppe, type ArbeitStand } from './arbeit';

const aufgabe = (id: string, teil: Partial<Aufgabe> = {}): Aufgabe => ({
  id,
  titel: `Aufgabe ${id}`,
  erledigt: false,
  prioritaet: 'normal',
  erstelltAm: '2026-09-01T08:00:00Z',
  geaendertAm: '2026-09-01T08:00:00Z',
  ...teil,
});

const basis = (teil: Partial<ArbeitStand> = {}): ArbeitStand => ({
  heute: '2026-10-02',
  ich: { id: 'chef', rolle: 'chef' },
  darfGeld: true,
  aufgaben: [],
  auftraege: [{ id: 'au1', nummer: 'A-1', titel: 'Badrenovierung', kundeId: 'k1' }],
  abwesenheiten: [],
  mitarbeiter: [{ id: 'mo', vorname: 'Tom' }],
  hinweise: [],
  angebote: [],
  kundenName: (id) => (id === 'k1' ? 'Müller' : undefined),
  pfad: (b) => `/${b.typ}/${b.id}`,
  ...teil,
});

describe('Deine Arbeit', () => {
  it('ist leer, wenn nichts wartet', () => {
    expect(arbeitsposten(basis())).toEqual([]);
  });

  it('zeigt eigene offene Aufgaben mit Auftrag und Kunde, Überfälliges zuerst', () => {
    const liste = arbeitsposten(
      basis({
        aufgaben: [
          aufgabe('a', { zustaendigId: 'chef', auftragId: 'au1' }),
          aufgabe('b', { zustaendigId: 'chef', faellig: '2026-09-30' }),
          aufgabe('c', { zustaendigId: 'mo' }),
          aufgabe('d', { zustaendigId: 'chef', erledigt: true }),
        ],
      }),
    );
    expect(liste.map((w) => w.id)).toEqual(['aufgaben:b', 'aufgaben:a']);
    expect(liste[0].ueberfaellig).toBe(true);
    expect(liste[1].description).toBe('Badrenovierung · Müller');
    expect(liste[1].actionUrl).toBe('/aufgaben/a');
  });

  it('Urlaubsaufgabe: Aufgaben abwesender Kollegen landen beim Büro/Chef', () => {
    const stand = basis({
      aufgaben: [aufgabe('u', { zustaendigId: 'mo', titel: 'Material für Montag freigeben' })],
      abwesenheiten: [{ mitarbeiterId: 'mo', von: '2026-09-28', bis: '2026-10-09', art: 'urlaub', status: 'genehmigt' }],
    });
    const [w] = arbeitsposten(stand);
    expect(w).toMatchObject({ type: 'vertretung', title: 'Urlaubsaufgabe: Material für Montag freigeben', actionLabel: 'Übernehmen' });
    expect(w.description).toContain('Tom ist nicht da.');
    // Monteure übernehmen keine Vertretungen
    expect(arbeitsposten({ ...stand, ich: { id: 'x', rolle: 'monteur' } })).toEqual([]);
    // nur genehmigte Abwesenheiten zählen
    expect(arbeitsposten({ ...stand, abwesenheiten: [{ ...stand.abwesenheiten[0], status: 'beantragt' }] })).toEqual([]);
  });

  it('bündelt vorbereitete Freigaben, Entscheidungen und Angebotsentwürfe', () => {
    const liste = arbeitsposten(
      basis({
        hinweise: [
          { schluessel: 'f1', art: 'freigabe', titel: 'Bestellung freigeben', gewicht: 60 },
          { schluessel: 'p1', art: 'problem', titel: 'Problem', gewicht: 90 },
        ],
        angebote: [{ id: 'an1', titel: 'Bad', status: 'entwurf', kundeId: 'k1', geaendertAm: '2026-10-01', auftragId: 'au1' }],
      }),
    );
    expect(liste.map((w) => [w.type, w.status])).toEqual([
      ['freigabe', 'ready'],
      ['angebot', 'in_progress'],
    ]);
    expect(liste[1].title).toBe('Bad · Müller');
  });

  it('zeigt nichts doppelt, was schon als nächster Schritt oben steht, und ohne Geld-Recht keine Angebote', () => {
    const angebote = [{ id: 'an1', titel: 'Bad', status: 'entwurf' as const, kundeId: 'k1', geaendertAm: '2026-10-01', auftragId: 'au1' }];
    expect(arbeitsposten(basis({ angebote, ohne: ['angebote:an1'] }))).toEqual([]);
    expect(arbeitsposten(basis({ angebote, darfGeld: false }))).toEqual([]);
  });
});

describe('Deine Arbeit – Gruppen', () => {
  it('bündelt nach erledigen · prüfen · entscheiden · bestätigen, wichtigste Gruppe zuerst', () => {
    const posten = arbeitsposten(
      basis({
        aufgaben: [aufgabe('t1', { zustaendigId: 'chef', faellig: '2026-09-30' })],
        hinweise: [
          { schluessel: 'f1', art: 'freigabe', titel: 'Rechnungsentwurf von Macher', gewicht: 90 },
          { schluessel: 'e1', art: 'entscheidung', titel: 'Urlaub genehmigen?', gewicht: 40 },
        ],
        angebote: [{ id: 'an1', titel: 'Bad', status: 'entwurf', kundeId: 'k1', geaendertAm: '2026-10-01T08:00:00Z', auftragId: 'au1' }],
      }),
    );
    expect(Object.fromEntries(posten.map((w) => [w.id, w.gruppe]))).toEqual({ 'aufgaben:t1': 'erledigen', 'hinweis:f1': 'bestaetigen', 'hinweis:e1': 'entscheiden', 'angebote:an1': 'pruefen' });
    // überfällige Aufgabe (80) vor Freigabe (85)? Freigabe 40+45=85 > Aufgabe 50+30=80
    expect(nachGruppe(posten).map((g) => g.gruppe)).toEqual(['bestaetigen', 'erledigen', 'entscheiden', 'pruefen']);
  });
});
