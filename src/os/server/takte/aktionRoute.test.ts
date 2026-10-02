import { afterEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/takte/aktion/route';

describe('POST /api/takte/aktion', () => {
  const vorher = { ...process.env };
  afterEach(() => {
    process.env = { ...vorher };
  });
  it('ohne Schlüssel: 501, mit ungültigem Schlüssel: 401', async () => {
    for (const k of ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'TAKTE_GEHEIMNIS']) delete process.env[k];
    expect((await POST(new Request('https://x/api/takte/aktion', { method: 'POST', body: '{}' }))).status).toBe(501);
    Object.assign(process.env, { SUPABASE_URL: 'https://sb.example', SUPABASE_SERVICE_ROLE_KEY: 'k', CRON_SECRET: 'g' });
    const r = await POST(new Request('https://x/api/takte/aktion', { method: 'POST', body: JSON.stringify({ schluessel: 'a.b' }) }));
    expect(r.status).toBe(401);
  });
});
