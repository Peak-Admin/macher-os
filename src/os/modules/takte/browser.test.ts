import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@core/db';
import { LOKALE_CLOUD, setzeCloud, type Cloud } from '@core/cloud';
import { messpunkte } from '@core/messung';
import { hinweis } from '@core/macher';
import { heute } from '@core/format';
import { aufbauen } from '../mein-tag/testdaten';
import { registriereModule } from '@core/modul';
import { aktionAusLink, aktionsLink, taktAktionAusfuehren, zeitenBestaetigen } from './aktionen';
import { inhaltFuer, pushMitRuhezeit, setzeTaktEinstellungen, taktEinstellungen, taktePruefen, taktZustellen, zeitenBestaetigtAm } from './browser';
import { einstellungenAus } from './regeln';

// Freitag, 2.10.2026, 07:05 Uhr deutscher Zeit
const SIEBEN = new Date('2026-10-02T05:05:00Z');

afterEach(() => setzeCloud(LOKALE_CLOUD));

describe('Takte im Browser (ohne Backend)', () => {
  it('stellt den Tagesbrief einmal am Tag in die Glocke – mit Entscheidungen aus „Braucht dich“', async () => {
    const { chef } = aufbauen();
    hinweis({ art: 'freigabe', titel: 'Urlaub freigeben', gewicht: 60, aktionen: [{ id: 'abwesenheit.genehmigen', label: 'Genehmigen', primaer: true, payload: { id: 'x' } }] });
    expect(await taktePruefen(SIEBEN, chef)).toEqual(['tagesbrief']);
    const b = db.benachrichtigungen.where((x) => x.fuerMitarbeiterId === chef.id);
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ titel: 'Tagesbrief: 1 Entscheidung', bezug: { typ: 'takte', id: 'tagesbrief' } });
    expect(await taktePruefen(new Date('2026-10-02T05:30:00Z'), chef)).toEqual([]);
  });

  it('respektiert abgeschaltete Takte und die Ruhezeit', async () => {
    const { chef } = aufbauen();
    setzeTaktEinstellungen(chef.id, { ...einstellungenAus(undefined), takte: { tagesbrief: { an: false } } });
    expect(taktEinstellungen(chef.id).takte.tagesbrief?.an).toBe(false);
    expect(await taktePruefen(SIEBEN, chef)).toEqual([]);
    setzeTaktEinstellungen(chef.id, { ...einstellungenAus(undefined), ruhe: { ab: '18:00', bis: '08:00', wochenende: true } });
    expect(await taktePruefen(SIEBEN, chef)).toEqual([]);
    expect(db.benachrichtigungen.all()).toHaveLength(0);
  });

  it('mit Backend plant der Server – der Browser schickt nichts doppelt; Zustellung läuft über cloud().push', async () => {
    const { chef } = aufbauen();
    const push = vi.fn(async () => {});
    setzeCloud({ ...LOKALE_CLOUD, aktiv: () => true, push } as Cloud);
    expect(await taktePruefen(SIEBEN, chef)).toEqual([]);
    expect(await taktZustellen('tagesbrief', chef, SIEBEN)).toBe(true);
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ anMitarbeiterId: chef.id, pfad: '/os/macher/takte/tagesbrief', titel: 'Tagesbrief: Nichts brennt' }));
    expect(db.benachrichtigungen.all()).toHaveLength(0);
  });

  it('Monteur: leerer Tag erzeugt keine Benachrichtigung', async () => {
    const { jonas } = aufbauen();
    expect(await taktePruefen(new Date('2026-10-02T04:35:00Z'), jonas)).toEqual([]);
    expect(db.benachrichtigungen.all()).toHaveLength(0);
  });
});

describe('Push für Ereignisse mit Ruhezeit', () => {
  it('tagsüber ja, abends nur Dringendes bei Notdienst', async () => {
    const { chef } = aufbauen();
    const push = vi.fn(async () => {});
    setzeCloud({ ...LOKALE_CLOUD, aktiv: () => true, push } as Cloud);
    const n = { anMitarbeiterId: chef.id, titel: 'Neue Anfrage: Heizung aus' };
    expect(await pushMitRuhezeit(n, {}, new Date('2026-10-02T08:00:00Z'))).toBe(true);
    expect(await pushMitRuhezeit(n, { dringend: true }, new Date('2026-10-02T19:00:00Z'))).toBe(false);
    setzeTaktEinstellungen(chef.id, { ...einstellungenAus(undefined), notdienst: true });
    expect(await pushMitRuhezeit(n, { dringend: true }, new Date('2026-10-02T19:00:00Z'))).toBe(true);
    expect(await pushMitRuhezeit(n, {}, new Date('2026-10-03T08:00:00Z'))).toBe(false);
    expect(push).toHaveBeenCalledTimes(2);
  });
});

describe('Zeiten bestätigen', () => {
  it('ein Tipp: laufende Zeit endet, Einträge bekommen den Vermerk, Messpunkt wird geschrieben', () => {
    const { jonas } = aufbauen();
    const tag = heute();
    db.zeiten.create({ mitarbeiterId: jonas.id, datum: tag, start: '00:00', ende: '00:01', pauseMinuten: 0, art: 'arbeit' });
    const laeuft = db.zeiten.create({ mitarbeiterId: jonas.id, datum: tag, start: '00:01', pauseMinuten: 0, art: 'arbeit' });
    expect(zeitenBestaetigen({ mitarbeiterId: jonas.id, datum: tag })).toBe(2);
    expect(db.zeiten.get(laeuft.id)?.ende).toBeTruthy();
    expect(db.ereignisse.where((e) => e.typ === 'bestaetigt')).toHaveLength(2);
    expect(zeitenBestaetigtAm(jonas.id, tag)).toBeTruthy();
    expect(inhaltFuer('zeiten', jonas).takt === 'zeiten' && (inhaltFuer('zeiten', jonas) as { bestaetigt: boolean }).bestaetigt).toBe(true);
    expect(messpunkte().some((p) => p.ereignis === 'gewohnheit.zeiten_bestaetigt')).toBe(true);
  });

  it('ohne erfasste Zeit gibt es nichts zu bestätigen', () => {
    const { jonas } = aufbauen();
    expect(() => zeitenBestaetigen({ mitarbeiterId: jonas.id, datum: heute() })).toThrow(/noch keine Zeit/);
    expect(zeitenBestaetigtAm(jonas.id, heute())).toBeUndefined();
  });
});

describe('Aktionen aus der Benachrichtigung', () => {
  it('Link hin und zurück', () => {
    const link = aktionsLink('/macher/takte/tagesbrief', 'abwesenheit.genehmigen', { id: 'a1' });
    expect(link).toBe('/macher/takte/tagesbrief?quelle=benachrichtigung&aktion=abwesenheit.genehmigen&payload=%7B%22id%22%3A%22a1%22%7D');
    expect(aktionAusLink(new URL(link, 'http://x').searchParams)).toEqual({ aktion: 'abwesenheit.genehmigen', payload: { id: 'a1' } });
    expect(aktionAusLink(new URLSearchParams('aktion=x&payload=kaputt'))).toEqual({ aktion: 'x', payload: undefined });
    expect(aktionAusLink(new URLSearchParams(''))).toBeUndefined();
  });

  it('führt Aktionen über die Registry aus und misst sie', () => {
    const tun = vi.fn(() => '/ziel');
    registriereModule([{ id: 'test-takte', titel: 'Test', bereich: 'macher', beschreibung: '', aktionen: { 'x.tun': tun } }]);
    expect(taktAktionAusfuehren('tagesbrief', 'x.tun', { id: 1 }, 'benachrichtigung')).toBe('/ziel');
    expect(tun).toHaveBeenCalledWith({ id: 1 });
    expect(messpunkte().at(-1)).toMatchObject({ ereignis: 'gewohnheit.aktion_aus_benachrichtigung', daten: { takt: 'tagesbrief', aktion: 'x.tun', weg: 'benachrichtigung' } });
    expect(() => taktAktionAusfuehren('tagesbrief', 'gibt.es.nicht', undefined, 'ansicht')).toThrow();
    registriereModule([]);
  });
});
