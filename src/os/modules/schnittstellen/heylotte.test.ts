import { describe, expect, it } from 'vitest';
import { aktionLabel, aufrufStatus, ereignisText, fehlerText, nutzerIdPruefen, schluesselAnzeige, verbindung, workspacePruefen, zustellungStand, type PartnerZugang } from './heylotte';

const zugang = (z: Partial<PartnerZugang> = {}): PartnerZugang => ({
  id: 'z1',
  name: 'HeyLotte',
  partner_workspace_id: null,
  schluessel_ende: 'x9Zq',
  webhook_url: null,
  ereignisse: [],
  erstellt_am: '2026-10-01T08:00:00Z',
  zuletzt_genutzt_am: null,
  widerrufen_am: null,
  nutzer: [],
  auslieferungen: { wartend: 0, fehler: 0, aufgegeben: 0, letzter_fehler: null },
  ...z,
});

describe('HeyLotte – Verbindung', () => {
  it('erkennt keinen, aktiven und getrennten Zugang', () => {
    expect(verbindung([]).zustand).toBe('keine');
    expect(verbindung([zugang({ widerrufen_am: '2026-10-02T00:00:00Z' }), zugang({ id: 'z2' })])).toMatchObject({ zustand: 'aktiv', zugang: { id: 'z2' } });
    const g = verbindung([zugang({ id: 'a', widerrufen_am: '2026-09-01T00:00:00Z' }), zugang({ id: 'b', widerrufen_am: '2026-10-01T00:00:00Z' })]);
    expect(g).toMatchObject({ zustand: 'getrennt', getrennt: { id: 'b' } });
  });

  it('zeigt nur das Ende des Schlüssels', () => {
    expect(schluesselAnzeige('x9Zq')).toBe('…x9Zq');
    expect(schluesselAnzeige(null)).toBe('Unbekannt');
  });
});

describe('HeyLotte – Texte', () => {
  it('übersetzt Fehler der Serveranfrage', () => {
    expect(fehlerText({ status: 0 })).toMatch(/Internet/);
    expect(fehlerText({ status: 403 })).toMatch(/Chef/);
    expect(fehlerText({ status: 422, daten: { fehler: 'Adresse falsch.' } })).toBe('Adresse falsch.');
    expect(fehlerText({ status: 500 })).toMatch(/Fehler 500/);
  });

  it('beschreibt Aufrufe mit Text statt Farbe', () => {
    expect(aufrufStatus({ status: 200, code: null }).text).toBe('Erledigt');
    expect(aufrufStatus({ status: 403, code: 'forbidden' }).text).toBe('Abgelehnt: fehlendes Recht');
    expect(aufrufStatus({ status: 403, code: 'unknown_user' }).text).toBe('Abgelehnt: Nutzer nicht zugeordnet');
    expect(aufrufStatus({ status: 503, code: null }).text).toBe('Fehler in Handwerk OS');
    expect(aktionLabel('create-task')).toBe('Aufgabe anlegen');
    expect(aktionLabel('neu-aktion')).toBe('neu-aktion');
  });

  it('beschreibt die Zustellung', () => {
    expect(zustellungStand(zugang()).text).toBe('Keine Adresse eingetragen');
    const mit = (a: Partial<PartnerZugang['auslieferungen']>) => zugang({ webhook_url: 'https://heylotte.ai/hook', auslieferungen: { wartend: 0, fehler: 0, aufgegeben: 0, letzter_fehler: null, ...a } });
    expect(zustellungStand(mit({}))).toEqual({ text: 'Alles zugestellt', ton: 'erfolg' });
    expect(zustellungStand(mit({ fehler: 2 })).text).toBe('2 Zustellungen fehlgeschlagen – neuer Versuch folgt');
    expect(zustellungStand(mit({ aufgegeben: 1, fehler: 2 })).ton).toBe('achtung');
    expect(zustellungStand(mit({ wartend: 1 })).text).toBe('1 Nachricht wartet auf Zustellung');
    expect(ereignisText(['*'])).toBe('Alle Ereignisse');
    expect(ereignisText(['task.created'])).toBe('Aufgabe angelegt');
  });
});

describe('HeyLotte – Eingaben prüfen', () => {
  it('prüft die Lotte-Nutzer-ID', () => {
    expect(nutzerIdPruefen('')).toBeDefined();
    expect(nutzerIdPruefen('lotte user')).toBeDefined();
    expect(nutzerIdPruefen('lotte_user_928', ['lotte_user_928'])).toMatch(/schon/);
    expect(nutzerIdPruefen(' lotte_user_928 ')).toBeUndefined();
  });

  it('Workspace-ID ist freiwillig', () => {
    expect(workspacePruefen('')).toBeUndefined();
    expect(workspacePruefen('ws_123')).toBeUndefined();
    expect(workspacePruefen('ws 123')).toBeDefined();
  });
});
