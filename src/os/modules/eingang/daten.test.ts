import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { hinweis } from '@core/macher';
import { eingangsEintraege } from './daten';

describe('Eingang', () => {
  it('Anfragen, Kundennachrichten und Freigaben an einem Ort – neueste oben, je Eintrag eine Aktion', async () => {
    const k = db.kunden.create({ art: 'privat', name: 'Jan Becker', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Wallbox', art: 'kundendienst', phase: 'anfrage', kundeId: k.id, quelle: 'email' });
    await new Promise((r) => setTimeout(r, 5));
    const k2 = db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
    db.nachrichten.create({ kanal: 'portal', richtung: 'ein', kundeId: k2.id, text: 'Passt Dienstag?', gelesen: false });
    await new Promise((r) => setTimeout(r, 5));
    hinweis({ art: 'freigabe', titel: 'Urlaub genehmigen', gewicht: 70, schluessel: 'test-urlaub', aktionen: [{ id: 'urlaub.genehmigen', label: 'Genehmigen', primaer: true }] });

    const e = eingangsEintraege(undefined).filter((x) => ['Wallbox', 'Petra Schulz schreibt', 'Urlaub genehmigen'].includes(x.titel));
    expect(e.map((x) => x.art)).toEqual(['freigabe', 'nachricht', 'anfrage']);
    expect(e[0].aktion).toMatchObject({ label: 'Genehmigen', id: 'urlaub.genehmigen' });
    expect(e[1].aktion).toMatchObject({ label: 'Antworten', pfad: `/auftraege/nachrichten/kunde/${k2.id}` });
    expect(e[2]).toMatchObject({ kanal: 'E-Mail', aktion: { label: 'Nächsten Schritt wählen', pfad: `/auftraege/anfragen?anfrage=${a.id}` } });
  });

  it('Anfrage mit geplantem nächsten Schritt verschwindet aus dem Eingang', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Rita Klein', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-2026-0002', titel: 'Heizung tropft', art: 'kundendienst', phase: 'anfrage', kundeId: k.id });
    expect(eingangsEintraege(undefined).some((x) => x.schluessel === `anfrage:${a.id}`)).toBe(true);
    db.aufgaben.create({ titel: 'Zurückrufen', auftragId: a.id, erledigt: false, prioritaet: 'normal' });
    expect(eingangsEintraege(undefined).some((x) => x.schluessel === `anfrage:${a.id}`)).toBe(false);
  });
});
