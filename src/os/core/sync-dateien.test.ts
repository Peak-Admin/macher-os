import { beforeEach, describe, expect, test, vi } from 'vitest';
import { db, zuruecksetzen } from './db';
import { dataUrlZuBlob, dataUrlsAuslagern } from './sync-dateien';

const gross = `data:image/jpeg;base64,${btoa('x'.repeat(30_000))}`;

beforeEach(() => zuruecksetzen());

describe('Data-URLs in den Speicher umziehen', () => {
  test('große Data-URLs werden ersetzt, kleine, Beispiele und Links bleiben', async () => {
    const doc = db.dokumente.create({ titel: 'Foto', url: gross, vorschau: 'data:image/png;base64,AAAA', seiten: [{ bild: gross }] } as never);
    const beispiel = db.dokumente.create({ titel: 'B', url: gross, beispiel: true } as never);
    const link = db.dokumente.create({ titel: 'L', url: 'https://x/y.jpg' } as never);
    const ablegen = vi.fn(async (_b: Blob, name: string) => `https://app/api/cloud/datei?p=${name}`);
    const n = await dataUrlsAuslagern(ablegen);
    expect(n).toBe(2);
    const neu = db.dokumente.get(doc.id) as unknown as { url: string; vorschau: string; seiten: { bild: string }[] };
    expect(neu.url).toMatch(/^https:\/\/app\/api\/cloud\/datei\?p=dokumente-.+-url-1\.jpg$/);
    expect(neu.seiten[0].bild).toMatch(/^https:/);
    expect(neu.vorschau).toBe('data:image/png;base64,AAAA');
    expect((db.dokumente.get(beispiel.id) as unknown as { url: string }).url).toBe(gross);
    expect((db.dokumente.get(link.id) as unknown as { url: string }).url).toBe('https://x/y.jpg');
    expect(ablegen.mock.calls[0][0].size).toBe(30_000);
  });

  test('bleibt die Datei lokal (offline), ändert sich nichts', async () => {
    const doc = db.dokumente.create({ titel: 'Foto', url: gross } as never);
    expect(await dataUrlsAuslagern(async () => gross)).toBe(0);
    expect((db.dokumente.get(doc.id) as unknown as { url: string }).url).toBe(gross);
  });

  test('Data-URL zu Blob', () => {
    expect(dataUrlZuBlob('data:text/plain;base64,SGFsbG8=')?.type).toBe('text/plain');
    expect(dataUrlZuBlob('https://x')).toBeUndefined();
  });
});
