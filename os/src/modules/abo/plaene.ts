/**
 * Gemeinsame Quelle der Planwerte für App (`os/src/modules/abo`), Server (`os/api/abo`) und
 * Website (`src/content/preise.ts`). Reine Daten, keine Importe – so kann jede Seite sie einbinden.
 *
 * Ein Preis je Betrieb nach Teamgröße (aktive Leute), alles drin. Euro netto je Monat.
 * Vorläufig bis zur Freigabe: `vorlaeufig` erst auf `false` setzen, wenn die Preise feststehen.
 */
export const PLAN_QUELLE = {
  vorlaeufig: true,
  testTage: 30,
  kulanzTage: 14,
  plaene: [
    { id: 'solo', name: 'Solo', bis: 2, monatlich: 39, jaehrlich: 32 },
    { id: 'team', name: 'Team', bis: 10, monatlich: 89, jaehrlich: 74 },
    { id: 'betrieb', name: 'Betrieb', bis: 30, monatlich: 179, jaehrlich: 149 },
    { id: 'unternehmen', name: 'Unternehmen', bis: null, monatlich: null, jaehrlich: null },
  ] as { id: 'solo' | 'team' | 'betrieb' | 'unternehmen'; name: string; bis: number | null; monatlich: number | null; jaehrlich: number | null }[],
};
