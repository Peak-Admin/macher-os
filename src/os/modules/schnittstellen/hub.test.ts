import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { zuruecksetzen } from '@core/db';
import { emit } from '@core/events';
import { setzeEinstellung } from '@core/einstellungen';
import { ereignisKatalog, starteEreignisse, webhookAuslieferungen, webhooks } from '@core/ereignisse';
import { abonniert, alteAbosUebernehmen, ereignissePruefen, katalogAusKern, kernQuelle, urlPruefen, webhookGeheimnis, webhookQuelle, setzeWebhookQuelle, type WebhookQuelle } from './webhooks';
import { anbindungen, connectoren, fehlerMelden, KATEGORIEN, nutzungMelden, statusAusAnbindung } from './connectoren';

let stopp: () => void;
beforeAll(() => (stopp = starteEreignisse()));
afterAll(() => stopp());
beforeEach(() => zuruecksetzen());

describe('Connector-Registry', () => {
  it('hat jede Kategorie und eindeutige IDs; jeder Connector sagt Art, Fähigkeiten und Status als Text', () => {
    const liste = connectoren();
    expect(new Set(liste.map((c) => c.id)).size).toBe(liste.length);
    for (const k of KATEGORIEN) expect(liste.some((c) => c.kategorie === k.id)).toBe(true);
    for (const c of liste) {
      expect(c.faehigkeiten.length).toBeGreaterThan(0);
      const s = c.status();
      expect(s.text.length).toBeGreaterThan(5);
      // DATEV hängt am Modul DATEV (im Test nicht registriert)
      if (!c.verfuegbar && c.id !== 'datev') expect(['geplant', 'verbunden']).toContain(s.zustand);
      if (c.verfuegbar && c.art !== 'eingebaut') expect(c.pfad).toBeTruthy();
    }
    expect(liste.map((c) => c.id)).toEqual(expect.arrayContaining(['datev', 'lexware', 'datanorm', 'ids-connect', 'ugl', 'oci', 'shk-connect', 'gaeb', 'email', 'telefon', 'google-kalender', 'microsoft-kalender', 'kontoauszug', 'bankverbindung', 'api', 'webhooks']));
  });

  it('merkt sich Nutzung und Fehler je Connector', () => {
    const leer = { zustand: 'nicht_verbunden' as const, text: 'Noch nichts' };
    expect(statusAusAnbindung('datanorm', leer)).toBe(leer);
    fehlerMelden('datanorm', 'Datei kaputt');
    expect(statusAusAnbindung('datanorm', leer)).toEqual({ zustand: 'fehler', text: 'Datei kaputt' });
    nutzungMelden('datanorm', '12 neu');
    expect(statusAusAnbindung('datanorm', leer).zustand).toBe('verbunden');
    expect(statusAusAnbindung('datanorm', leer).text).toMatch(/12 neu/);
    expect(anbindungen.all()).toHaveLength(1);
  });
});

describe('Webhooks', () => {
  it('prüft Adressen und Ereignisse', () => {
    const katalog = katalogAusKern();
    expect(urlPruefen('https://example.de/hook')).toBeUndefined();
    expect(urlPruefen('http://example.de')).toMatch(/https/);
    expect(urlPruefen('https://nutzer:pw@example.de')).toMatch(/Zugangsdaten/);
    expect(urlPruefen('https://192.168.0.2/x')).toMatch(/Internet/);
    expect(urlPruefen('kaputt')).toBeDefined();
    expect(ereignissePruefen([], katalog)).toBeDefined();
    expect(ereignissePruefen(['rechnung.bezahlt'], katalog)).toBeUndefined();
    expect(ereignissePruefen(['gibt.esnicht'], katalog)).toMatch(/gibt.esnicht/);
  });

  it('nimmt den Katalog aus dem Kern – mit Gruppen für die Auswahl', () => {
    const katalog = kernQuelle.katalog();
    expect(katalog).toHaveLength(ereignisKatalog().length);
    for (const t of ['rechnung.bezahlt', 'zahlung.eingegangen', 'angebot.angenommen', 'import.abgeschlossen', 'einsatz.problem_gemeldet']) expect(katalog.some((k) => k.typ === t)).toBe(true);
    expect(katalog.find((k) => k.typ === 'rechnung.bezahlt')?.gruppe).toBe('Geld');
    expect(katalog.every((k) => /^[a-z]+\.[a-z_]+$/.test(k.typ) && k.gruppe)).toBe(true);
  });

  it('legt Abos in der Kern-Sammlung an (Geheimnis nur einmal), pausiert und entfernt sie', () => {
    const { abo, geheimnis } = kernQuelle.anlegen({ url: 'https://example.de/hook', ereignisse: ['rechnung.bezahlt'], beschreibung: 'Buchhaltung' });
    expect(geheimnis).toMatch(/^whsec_[0-9a-f]{64}$/);
    expect(abo.geheimnisEnde).toBe(geheimnis.slice(-4));
    expect(abo.beschreibung).toBe('Buchhaltung');
    expect(webhooks.all()).toHaveLength(1);
    expect(JSON.stringify(webhooks.all())).not.toContain(geheimnis);
    expect(JSON.stringify(kernQuelle.abos())).not.toContain(geheimnis);
    expect(webhookGeheimnis(abo.id)).toBe(geheimnis);
    expect(abonniert(abo, 'rechnung.bezahlt')).toBe(true);
    expect(abonniert(abo, 'zahlung.eingegangen')).toBe(false);
    expect(abonniert({ aktiv: true, ereignisse: ['rechnung.*'] }, 'rechnung.versendet')).toBe(true);
    expect(abonniert({ aktiv: true, ereignisse: ['*'] }, 'egal.was')).toBe(true);
    kernQuelle.aendern(abo.id, { aktiv: false });
    expect(abonniert(kernQuelle.abos()[0], 'rechnung.bezahlt')).toBe(false);
    kernQuelle.entfernen(abo.id);
    expect(kernQuelle.abos()).toEqual([]);
    expect(webhookGeheimnis(abo.id)).toBeUndefined();
    expect(kernQuelle.zustellungAktiv()).toBe(false);
  });

  it('stellt Ereignisse für Kern-Abos in die Warteschlange', () => {
    kernQuelle.anlegen({ url: 'https://example.de/hook', ereignisse: ['rechnung.bezahlt'] });
    emit({ typ: 'rechnung.bezahlt', sammlung: 'rechnungen', objekt: { id: 'r1', erstelltAm: '', geaendertAm: '' } });
    expect(webhookAuslieferungen.all()).toHaveLength(1);
    expect(webhookAuslieferungen.all()[0].api).toBe('invoice.paid');
  });

  it('übernimmt früher als Einstellung gespeicherte Abos einmal in den Kern', () => {
    setzeEinstellung('schnittstellen.webhooks', [
      { id: 'wh_alt', url: 'https://example.de/alt', ereignisse: ['rechnung.bezahlt'], aktiv: true, beschreibung: 'Alt', angelegtAm: '2026-01-01T00:00:00Z', geheimnisEnde: 'abcd', geheimnis: 'whsec_xyzabcd' },
    ]);
    expect(alteAbosUebernehmen()).toBe(1);
    expect(alteAbosUebernehmen()).toBe(0);
    const [a] = kernQuelle.abos();
    expect(a).toMatchObject({ id: 'wh_alt', url: 'https://example.de/alt', beschreibung: 'Alt', geheimnisEnde: 'abcd', aktiv: true });
    expect(webhookGeheimnis('wh_alt')).toBe('whsec_xyzabcd');
  });

  it('lässt sich an eine andere Quelle anschließen', () => {
    const andere: WebhookQuelle = { ...kernQuelle, zustellungAktiv: () => true, katalog: () => [{ typ: 'x.y', titel: 'X', gruppe: 'G' }] };
    setzeWebhookQuelle(andere);
    expect(webhookQuelle().katalog()[0].typ).toBe('x.y');
    setzeWebhookQuelle(kernQuelle);
    expect(webhookQuelle()).toBe(kernQuelle);
  });
});
