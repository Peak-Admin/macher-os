/** Panel am Auftrag: bester Planvorschlag mit einem Klick übernehmen. */
import { useMemo } from 'react';
import { useDatenstand } from '@core/db';
import { erledigt } from '@core/macher';
import { Button, Karte, Meta, Stapel, useToast, Zeile } from '@ui/index';
import type { ID } from '@core/objects';
import { finde, kontextAusDb } from './basis';
import { einzuplanen, offeneStunden, vorschlaege, vorschlagKurz, vorschlagUebernehmen } from './daten';
import { zahl } from '@core/format';

export function EinplanenPanel({ id }: { id: ID }) {
  const v = useDatenstand();
  const toast = useToast();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const auftrag = finde(ctx.auftraege, id);
  const ergebnis = useMemo(() => (auftrag && einzuplanen(ctx, auftrag) ? vorschlaege(ctx, id, { anzahl: 1 }) : undefined), [ctx, auftrag, id]);
  if (!auftrag || !ergebnis) return null;
  const vs = ergebnis.vorschlaege[0];
  return (
    <Karte titel="Einplanen" icon="plan" oberzeile={`Noch ${zahl(offeneStunden(ctx, auftrag))} h offen`} kompakt>
      <Stapel abstand={8}>
        {vs ? (
          <>
            <Meta>Vorschlag: {vorschlagKurz(ctx, vs)}</Meta>
            <Meta>{vs.gruende.slice(1, 3).join(' · ')}</Meta>
          </>
        ) : (
          <Meta>{ergebnis.hinweise[ergebnis.hinweise.length - 1] ?? 'Gerade kein freies Zeitfenster.'}</Meta>
        )}
        <Zeile>
          {vs && (
            <Button
              klein
              icon="check"
              onClick={() => {
                const r = vorschlagUebernehmen(vs);
                if (!r.ok) return toast(r.grund, { ton: 'achtung' });
                erledigt('autoplanung.uebernommen', `Eingeplant: ${auftrag.titel}`, { text: vorschlagKurz(ctx, vs), bezug: { typ: 'auftraege', id }, minuten: 10 });
                toast(r.termine.length === 1 ? 'Termin angelegt.' : `${r.termine.length} Termine angelegt.`);
              }}
            >
              So einplanen
            </Button>
          )}
          <Button klein variante="tertiaer" to={`/plan/autoplanung/${id}`}>
            Alternativen
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}
