import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { registriereModule, aktionAusfuehren } from '@core/modul';
import { erledigt } from '@core/macher';
import heuteModul from './index';
import erledigtModul from '../erledigt/index';
import { aktuellerAuftrag, einsatzBeenden, einsatzStarten, naechsterEinsatz, telefonFuer } from './logik';
import { einsatzHinweise } from './hinweise';
import { terminstatusNachziehen } from './automationen';
import { rueckgaengigMachen } from '../erledigt/logik';
import { aufbauen, JETZT } from '../mein-tag/testdaten';

beforeAll(() => registriereModule([heuteModul, erledigtModul]));

describe('Nächster Einsatz', () => {
  it('nimmt den laufenden Einsatz, sonst den nächsten offenen', () => {
    const { jonas, t } = aufbauen();
    t('07:00', '09:00', [jonas.id], { status: 'erledigt' });
    const b = t('13:00', '14:00', [jonas.id]);
    t('15:00', '16:00', [jonas.id], { art: 'intern' });
    expect(naechsterEinsatz(jonas.id, JETZT)?.id).toBe(b.id);
    const c = t('08:00', '09:00', [jonas.id], { status: 'vor_ort' });
    expect(naechsterEinsatz(jonas.id, JETZT)?.id).toBe(c.id);
    expect(naechsterEinsatz(undefined, JETZT)).toBeUndefined();
  });

  it('wählt für Schnell erfassen den Auftrag des heutigen Einsatzes vor', () => {
    const { jonas, chef, auftrag, t } = aufbauen();
    t('13:00', '14:00', [jonas.id]);
    expect(aktuellerAuftrag(jonas.id, JETZT)).toBe(auftrag.id);
    expect(aktuellerAuftrag(chef.id, JETZT)).toBeUndefined();
  });

  it('startet und beendet ohne Zeiterfassung über den Terminstatus und feuert Events', () => {
    const { jonas, t } = aufbauen();
    const x = t('13:00', '14:00', [jonas.id]);
    const ev: string[] = [];
    const aus = on('einsatz.*', (e) => ev.push(e.typ));
    einsatzStarten(x.id);
    expect(db.termine.get(x.id)?.status).toBe('vor_ort');
    einsatzBeenden(x.id);
    expect(db.termine.get(x.id)?.status).toBe('erledigt');
    aus();
    expect(ev).toEqual(['einsatz.gestartet', 'einsatz.beendet']);
  });

  it('nimmt die Telefonnummer vor Ort zuerst', () => {
    const { jonas, t } = aufbauen();
    expect(telefonFuer(t('13:00', '14:00', [jonas.id]))).toEqual({ nummer: '0175 2', wer: 'Herr Albers' });
  });

  it('meldet nicht beendete Einsätze dem Monteur und nicht gestartete dem Büro', () => {
    const { jonas, lukas, t } = aufbauen();
    t('07:00', '09:00', [jonas.id, lukas.id], { status: 'vor_ort' });
    t('09:00', '12:00', [jonas.id], { status: 'bestaetigt' });
    const h = einsatzHinweise(JETZT);
    expect(h.filter((x) => x.schluessel.startsWith('einsatz-nicht-beendet')).map((x) => x.fuerMitarbeiterId)).toEqual([jonas.id, lukas.id]);
    const ng = h.find((x) => x.schluessel.startsWith('einsatz-nicht-gestartet'));
    expect(ng?.fuerRollen).toEqual(['chef', 'buero']);
    // Hinweis-Aktion ist registriert und wirkt
    aktionAusfuehren(ng!.aktionen![0].aktion, ng!.aktionen![0].payload);
    expect(einsatzHinweise(JETZT).some((x) => x.schluessel.startsWith('einsatz-nicht-gestartet'))).toBe(false);
  });

  it('schließt vergangene Termine mit Zeiten automatisch ab – rückgängig machbar', () => {
    const { jonas, auftrag, t } = aufbauen();
    const gestern = t('07:00', '16:00', [jonas.id], { status: 'bestaetigt' }, '2026-10-01');
    const ohneZeit = t('07:00', '16:00', [jonas.id], {}, '2026-09-30');
    db.zeiten.create({ mitarbeiterId: jonas.id, auftragId: auftrag.id, datum: '2026-10-01', start: '07:00', ende: '16:00', pauseMinuten: 30, art: 'arbeit' });
    expect(terminstatusNachziehen(JETZT)).toBe(1);
    expect(db.termine.get(gestern.id)?.status).toBe('erledigt');
    expect(db.termine.get(ohneZeit.id)?.status).toBe('geplant');
    const e = db.erledigungen.all()[0];
    rueckgaengigMachen(e);
    expect(db.termine.get(gestern.id)?.status).toBe('bestaetigt');
    expect(() => rueckgaengigMachen(e)).toThrow();
    // ohne registrierte Gegen-Aktion: verständlicher Fehler statt stillem Nichts
    const fremd = erledigt('x', 'Fremd', { rueckgaengig: { aktion: 'gibt.es.nicht' } });
    expect(() => rueckgaengigMachen(fremd)).toThrow(/nicht verfügbar/);
  });
});
