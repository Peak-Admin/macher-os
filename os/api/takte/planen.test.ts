import { afterEach, describe, expect, it } from 'vitest';
import { betriebsDaten, planen, type ObjektZeile } from './planen';
import { GET } from './cron';

const B = { erstelltAm: '2026-09-01T08:00:00Z', geaendertAm: '2026-09-01T08:00:00Z' };
const zeile = (sammlung: string, id: string, daten: Record<string, unknown>): ObjektZeile => ({ sammlung, id, daten: { ...B, id, ...daten } });
const ma = (id: string, rolle: string, x: Record<string, unknown> = {}) => zeile('mitarbeiter', id, { vorname: id, nachname: 'T', rolle, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x });

const zeilen: ObjektZeile[] = [
  zeile('betrieb', 'betrieb', { name: 'Test', onboardingFertig: true, ustSatz: 19 }),
  ma('chef', 'chef', { email: 'chef@example.de' }),
  ma('jonas', 'monteur'),
  ma('lukas', 'monteur'),
  zeile('kunden', 'k1', { name: 'Familie Hoffmann', art: 'privat', ansprechpartner: [] }),
  zeile('termine', 't1', { art: 'einsatz', titel: 'Wartung', start: '2026-10-02T05:30:00Z', ende: '2026-10-02T07:00:00Z', kundeId: 'k1', mitarbeiterIds: ['jonas'], status: 'geplant' }),
  zeile('abwesenheiten', 'ab1', { mitarbeiterId: 'jonas', art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'beantragt' }),
  zeile('termine', 't-geloescht', { art: 'einsatz', titel: 'Weg', start: '2026-10-02T05:30:00Z', ende: '2026-10-02T07:00:00Z', mitarbeiterIds: ['lukas'], status: 'geplant', geloeschtAm: '2026-10-01T00:00:00Z' }),
  zeile('einstellungen', 'takte.nutzer.chef', { wert: { kanal: 'email' } }),
];
const mitglieder = [
  { nutzer_id: 'u-chef', mitarbeiter_id: 'chef', rolle: 'chef' },
  { nutzer_id: 'u-jonas', mitarbeiter_id: 'jonas', rolle: 'monteur' },
  { nutzer_id: 'u-lukas', mitarbeiter_id: 'lukas', rolle: 'monteur' },
];

describe('Server-Takt (planen)', () => {
  it('erzeugt aus den objekte-Zeilen dieselben Takte wie der Browser', () => {
    const d = betriebsDaten(zeilen);
    // 6:30 deutscher Zeit (Freitag): Dein Tag für Jonas; Lukas hat nichts (gelöschter Termin) → nichts zugestellt, aber gemerkt
    const frueh = planen(d, mitglieder, new Date('2026-10-02T04:30:00Z'));
    expect(frueh.zustellungen.map((z) => [z.mitarbeiterId, z.takt, z.nachricht.titel])).toEqual([['jonas', 'dein-tag', 'Dein Tag: 1 Termin']]);
    expect(Object.fromEntries(frueh.zuletzt)).toEqual({ jonas: { 'dein-tag': '2026-10-02' }, lukas: { 'dein-tag': '2026-10-02' } });
    // 7:00: Tagesbrief für die Chefin per E-Mail, mit Urlaubsantrag als Entscheidung + Aktion an der Nachricht
    const sieben = planen(d, mitglieder, new Date('2026-10-02T05:00:00Z'));
    // Jonas' „Dein Tag“ würde hier nachgeholt, weil in diesem Lauf noch nichts gemerkt ist
    expect(sieben.zustellungen.map((z) => z.takt)).toEqual(['tagesbrief', 'dein-tag']);
    expect(sieben.zustellungen[0]).toMatchObject({ nutzerId: 'u-chef', takt: 'tagesbrief', kanal: 'email', email: 'chef@example.de', nachricht: { titel: 'Tagesbrief: 1 Entscheidung' } });
    expect(sieben.zustellungen[0].nachricht.aktionen[0]).toEqual({ aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', payload: { id: 'ab1' } });
  });

  it('merkt sich die Zustellung: zweiter Lauf am selben Tag schickt nichts', () => {
    const erste = planen(betriebsDaten(zeilen), mitglieder, new Date('2026-10-02T05:00:00Z'));
    const gemerkt = [...erste.zuletzt].map(([id, wert]) => zeile('einstellungen', `takte.zuletzt.${id}`, { wert }));
    expect(planen(betriebsDaten([...zeilen, ...gemerkt]), mitglieder, new Date('2026-10-02T05:15:00Z')).zustellungen).toEqual([]);
  });

  it('Ruhezeit, Wochenende und laufendes Onboarding: nichts', () => {
    const d = betriebsDaten(zeilen);
    expect(planen(d, mitglieder, new Date('2026-10-02T17:00:00Z')).zustellungen).toEqual([]);
    expect(planen(d, mitglieder, new Date('2026-10-03T05:00:00Z')).zustellungen).toEqual([]);
    const ohne = betriebsDaten(zeilen.map((z) => (z.sammlung === 'betrieb' ? { ...z, daten: { ...z.daten, onboardingFertig: false } } : z)));
    expect(planen(ohne, mitglieder, new Date('2026-10-02T05:00:00Z')).zustellungen).toEqual([]);
  });

  it('an Feiertagen kommt nichts (Bundesland aus den Einstellungen)', () => {
    // 25.12.2026 ist ein Freitag
    expect(planen(betriebsDaten(zeilen), mitglieder, new Date('2026-12-25T06:00:00Z')).zustellungen).toEqual([]);
    // Reformationstag 31.10.2029 (Mittwoch) nur in z. B. Niedersachsen
    const ni = betriebsDaten([...zeilen, zeile('einstellungen', 'plan.bundesland', { wert: 'NI' })]);
    expect(planen(ni, mitglieder, new Date('2029-10-31T06:00:00Z')).zustellungen).toEqual([]);
    expect(planen(betriebsDaten(zeilen), mitglieder, new Date('2029-10-31T06:00:00Z')).zustellungen.map((z) => z.takt)).toEqual(['tagesbrief']);
  });

  it('nimmt Push-Abos mit, die das Gerät als Einstellung abgelegt hat', () => {
    const abo = { endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } };
    const d = betriebsDaten([...zeilen, zeile('einstellungen', 'takte.push-abo.jonas', { wert: [abo, { endpoint: 'kaputt' }] })]);
    expect(planen(d, mitglieder, new Date('2026-10-02T04:30:00Z')).zustellungen[0].geraete).toEqual([abo]);
  });

  it('Wochenbilanz freitags 15 Uhr nur für den Chef', () => {
    const z = planen(betriebsDaten(zeilen), mitglieder, new Date('2026-10-02T13:00:00Z')).zustellungen;
    expect(z.map((x) => [x.mitarbeiterId, x.takt])).toEqual([['chef', 'wochenbilanz']]);
  });
});

describe('Server-Takt (Endpunkt)', () => {
  const vorher = { ...process.env };
  afterEach(() => {
    process.env = { ...vorher };
  });

  it('ohne Schlüssel: 501 „nicht verbunden“', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const r = await GET(new Request('https://x/api/takte/cron'));
    expect(r.status).toBe(501);
    expect(await r.json()).toEqual({ fehler: 'nicht verbunden' });
  });

  it('mit Schlüsseln, aber ohne Cron-Geheimnis im Aufruf: 401', async () => {
    Object.assign(process.env, { SUPABASE_URL: 'https://sb.example', SUPABASE_SERVICE_ROLE_KEY: 'k', CRON_SECRET: 'geheim' });
    const r = await GET(new Request('https://x/api/takte/cron', { headers: { authorization: 'Bearer falsch' } }));
    expect(r.status).toBe(401);
  });
});
