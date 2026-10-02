import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { alsGelesen, anweisungAnlegen, anweisungenFuerTermin, arbeitsanweisungen, zeilen, type Arbeitsanweisung } from './daten';

const x = (y: Partial<Arbeitsanweisung>): Arbeitsanweisung => ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', titel: '', schritte: [], sicherheit: [], ...y });

describe('Arbeitsanweisungen', () => {
  beforeEach(() => zuruecksetzen());
  it('zeigt am Termin die Anweisungen des Auftrags, aber keine Vorlagen und keine anderer Termine', () => {
    const alle = [x({ titel: 'auftrag', auftragId: 'a' }), x({ titel: 'termin', auftragId: 'a', terminId: 't1' }), x({ titel: 'anderer', auftragId: 'a', terminId: 't2' }), x({ titel: 'vorlage', vorlage: true, auftragId: 'a' })];
    expect(anweisungenFuerTermin(alle, { id: 't1', auftragId: 'a' }).map((y) => y.titel)).toEqual(['auftrag', 'termin']);
  });
  it('teilt Sicherheitshinweise je Zeile', () => {
    expect(zeilen(' a \n\n b\n')).toEqual(['a', 'b']);
  });
  it('legt aus Vorlage an, übernimmt Auftragsbeschreibung, vermerkt „gelesen“ einmal', () => {
    const v = arbeitsanweisungen.create({ titel: 'Vorlage', vorlage: true, schritte: [{ id: 's', text: 'Schritt' }], sicherheit: ['Sicher'] });
    const au = db.auftraege.create({ nummer: 'A', titel: 'Bad', art: 'projekt', phase: 'beauftragt', kundeId: 'k', beschreibung: 'Fliesen raus' });
    const n = anweisungAnlegen(au.id, v.id);
    expect(n).toMatchObject({ auftragId: au.id, ziel: 'Fliesen raus', sicherheit: ['Sicher'] });
    expect(n.schritte[0].id).not.toBe('s');
    alsGelesen(n.id, 'm1');
    alsGelesen(n.id, 'm1');
    expect(arbeitsanweisungen.get(n.id)?.gelesen).toHaveLength(1);
  });
});
