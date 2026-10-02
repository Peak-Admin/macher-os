import { beforeEach, describe, expect, it } from 'vitest';
import { zuruecksetzen } from '@core/db';
import { abonniert, ereignissePruefen, lokaleQuelle, STANDARD_KATALOG, urlPruefen, webhookQuelle, setzeWebhookQuelle, type WebhookQuelle } from './webhooks';
import { anbindungen, connectoren, fehlerMelden, KATEGORIEN, nutzungMelden, statusAusAnbindung } from './connectoren';

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
    expect(urlPruefen('https://example.de/hook')).toBeUndefined();
    expect(urlPruefen('http://example.de')).toMatch(/https/);
    expect(urlPruefen('https://nutzer:pw@example.de')).toMatch(/Zugangsdaten/);
    expect(urlPruefen('https://192.168.0.2/x')).toMatch(/Internet/);
    expect(urlPruefen('kaputt')).toBeDefined();
    expect(ereignissePruefen([], STANDARD_KATALOG)).toBeDefined();
    expect(ereignissePruefen(['rechnung.bezahlt'], STANDARD_KATALOG)).toBeUndefined();
    expect(ereignissePruefen(['gibt.esnicht'], STANDARD_KATALOG)).toMatch(/gibt.esnicht/);
  });

  it('enthält die vereinbarten Ereignisnamen', () => {
    for (const t of ['rechnung.bezahlt', 'zahlung.eingegangen', 'angebot.angenommen', 'import.abgeschlossen']) expect(STANDARD_KATALOG.some((k) => k.typ === t)).toBe(true);
    expect(STANDARD_KATALOG.every((k) => /^[a-z]+\.[a-z_]+$/.test(k.typ))).toBe(true);
  });

  it('legt Abos an (Geheimnis nur einmal), pausiert und entfernt sie', () => {
    const { abo, geheimnis } = lokaleQuelle.anlegen({ url: 'https://example.de/hook', ereignisse: ['rechnung.bezahlt'] });
    expect(geheimnis).toMatch(/^whsec_[0-9a-f]{64}$/);
    expect(abo.geheimnisEnde).toBe(geheimnis.slice(-4));
    expect(JSON.stringify(lokaleQuelle.abos())).not.toContain(geheimnis);
    expect(abonniert(abo, 'rechnung.bezahlt')).toBe(true);
    expect(abonniert(abo, 'zahlung.eingegangen')).toBe(false);
    expect(abonniert({ aktiv: true, ereignisse: ['rechnung.*'] }, 'rechnung.versendet')).toBe(true);
    expect(abonniert({ aktiv: true, ereignisse: ['*'] }, 'egal.was')).toBe(true);
    lokaleQuelle.aendern(abo.id, { aktiv: false });
    expect(abonniert(lokaleQuelle.abos()[0], 'rechnung.bezahlt')).toBe(false);
    lokaleQuelle.entfernen(abo.id);
    expect(lokaleQuelle.abos()).toEqual([]);
    expect(lokaleQuelle.zustellungAktiv()).toBe(false);
  });

  it('lässt sich an eine andere Quelle (Kern) anschließen', () => {
    const kern: WebhookQuelle = { ...lokaleQuelle, zustellungAktiv: () => true, katalog: () => [{ typ: 'x.y', titel: 'X', gruppe: 'G' }] };
    setzeWebhookQuelle(kern);
    expect(webhookQuelle().katalog()[0].typ).toBe('x.y');
    setzeWebhookQuelle(lokaleQuelle);
  });
});
