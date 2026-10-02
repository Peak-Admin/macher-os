import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute, plusTage, zeitpunkt } from '@core/format';
import type { Bericht } from './daten';
import { berichtErstellen, berichtHinweise, einsaetzeOhneBericht, minuten, naechsteBerichtNummer, sammeln, standardPruefpunkte, taetigkeitenAusNotizen } from './daten';

describe('Berichte', () => {
  it('rechnet Arbeitsminuten ohne Pause', () => {
    expect(minuten({ start: '07:00', ende: '16:00', pauseMinuten: 45 })).toBe(495);
    expect(minuten({ start: '22:00', ende: '02:00', pauseMinuten: 0 })).toBe(240);
    expect(minuten({ start: '07:00', pauseMinuten: 0 })).toBe(0);
  });

  it('vergibt fortlaufende Nummern je Jahr', () => {
    expect(naechsteBerichtNummer([], 2026)).toBe('BR-2026-0001');
    expect(naechsteBerichtNummer(['BR-2026-0007', 'BR-2025-0099'], 2026)).toBe('BR-2026-0008');
  });

  it('sammelt Zeiten, Material, Fotos und Aufgaben des Tages per ID', () => {
    const k = db.kunden.create({ art: 'privat', name: 'K', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-9', titel: 'X', art: 'projekt', phase: 'in_arbeit', kundeId: k.id });
    const t = heute();
    const z1 = db.zeiten.create({ mitarbeiterId: 'm', auftragId: a.id, datum: t, start: '07:00', ende: '12:00', pauseMinuten: 0, art: 'arbeit' });
    db.zeiten.create({ mitarbeiterId: 'm', auftragId: a.id, datum: plusTage(t, -1), start: '07:00', ende: '12:00', pauseMinuten: 0, art: 'arbeit' });
    const m = db.material.create({ auftragId: a.id, text: 'Kabel', menge: 10, einheit: 'm', ek: 100, status: 'verbraucht', datum: t });
    const f = db.dokumente.create({ art: 'foto', titel: 'F', auftragId: a.id });
    const au = db.aufgaben.create({ titel: 'Dose setzen', auftragId: a.id, erledigt: true, erledigtAm: new Date().toISOString(), prioritaet: 'normal' });
    db.dokumente.create({ art: 'notiz', titel: 'N', text: 'Dosen gesetzt', auftragId: a.id });
    const s = sammeln(a.id, t, { zeiten: db.zeiten.all(), material: db.material.all(), dokumente: db.dokumente.all(), aufgaben: db.aufgaben.all() });
    expect(s).toEqual({ zeitIds: [z1.id], materialIds: [m.id], fotoIds: [f.id], aufgabeIds: [au.id] });
    expect(taetigkeitenAusNotizen(a.id, t, db.dokumente.all())).toBe('- Dosen gesetzt');

    const b = berichtErstellen({ auftragId: a.id });
    expect(b.zeitIds).toEqual([z1.id]);
    expect(b.taetigkeiten).toBe('- Dosen gesetzt');
    expect(berichtErstellen({ auftragId: a.id }).id).toBe(b.id);
  });

  it('meldet beendete Einsätze ohne fertigen Bericht', () => {
    const t = heute();
    const termin = db.termine.create({ art: 'einsatz', titel: 'Einsatz', auftragId: 'a1', start: zeitpunkt(t, '07:00'), ende: zeitpunkt(t, '12:00'), mitarbeiterIds: [], status: 'erledigt' });
    const andere = db.termine.create({ art: 'besichtigung', titel: 'B', auftragId: 'a1', start: zeitpunkt(t, '13:00'), ende: zeitpunkt(t, '14:00'), mitarbeiterIds: [], status: 'erledigt' });
    const termine = [termin, andere];
    expect(einsaetzeOhneBericht(termine, [], t)).toHaveLength(1);
    let h = berichtHinweise(termine, [], t);
    expect(h[0].aktionen?.[0]).toMatchObject({ aktion: 'bericht.erstellen', payload: { auftragId: 'a1', terminId: termin.id } });
    const entwurf = { id: 'b1', auftragId: 'a1', terminId: termin.id, datum: t, status: 'entwurf', art: 'tagesbericht' } as Bericht;
    h = berichtHinweise(termine, [entwurf], t);
    expect(h[0].schluessel).toBe('bericht-entwurf:b1');
    expect(berichtHinweise(termine, [{ ...entwurf, status: 'fertig' }], t)).toHaveLength(0);
    expect(einsaetzeOhneBericht(termine, [], plusTage(t, 20))).toHaveLength(0);
  });

  it('liefert Prüfpunkte je Gewerk', () => {
    expect(standardPruefpunkte('elektro').map((p) => p.text)).toContain('Isolationswiderstand');
    expect(standardPruefpunkte(undefined).map((p) => p.text)).toEqual(['Sichtprüfung', 'Funktionsprüfung', 'Arbeitsplatz sauber übergeben']);
  });
});
