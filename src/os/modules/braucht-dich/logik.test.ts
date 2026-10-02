import { describe, expect, it } from 'vitest';
import type { OffenerHinweis } from '@core/macher';
import { nachArt, sichtbareAktionen } from './logik';

const h = (x: Partial<OffenerHinweis>): OffenerHinweis => ({ schluessel: 'k', art: 'problem', titel: 't', gewicht: 50, ...x });

describe('Braucht dich', () => {
  it('gruppiert nach Art', () => {
    const g = nachArt([h({ art: 'problem' }), h({ art: 'freigabe' }), h({ art: 'problem' })]);
    expect(g.problem).toHaveLength(2);
    expect(g.freigabe).toHaveLength(1);
    expect(g.info).toHaveLength(0);
  });

  it('zeigt nur ausführbare Aktionen, die primäre zuerst', () => {
    const x = h({
      aktionen: [
        { aktion: 'a', label: 'A' },
        { aktion: 'fehlt', label: 'Fehlt' },
        { aktion: 'b', label: 'B', primaer: true },
      ],
    });
    expect(sichtbareAktionen(x, (id) => id !== 'fehlt').map((a) => a.label)).toEqual(['B', 'A']);
  });
});
