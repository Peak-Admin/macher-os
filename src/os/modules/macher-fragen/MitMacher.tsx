/**
 * „Mit Lotte vorbereiten“ – die eine gemeinsame Sekundäraktion an Angebot, Rechnung, Anfrage und Einsatzplanung.
 * Kein eigener Chat: Sie öffnet den Lotte-Assistenten (wie Strg+K und Seitenleiste) mit Objekt und Absicht.
 * Erscheint nur, wenn es am Objekt gerade etwas vorzubereiten gibt und deine Rolle es darf.
 */
import { useDatenstand } from '@core/db';
import { heute } from '@core/format';
import { alleAbsichten } from '@core/gateway';
import type { Bezug } from '@core/objects';
import { darf, useIch } from '@core/session';
import { Button } from '@ui/index';
import { mitMacherOeffnen, vorbereitungFuer } from './vorbereiten';

/** `nachOeffnen`: z. B. einen lokalen Dialog schließen, damit nicht zwei Fenster übereinander liegen */
export function MitMacherVorbereiten({ bezug, zweck, breit, klein, nachOeffnen }: { bezug: Bezug; zweck?: 'einplanen'; breit?: boolean; klein?: boolean; nachOeffnen?: () => void }) {
  useDatenstand();
  const ich = useIch();
  const tag = heute();
  const v = vorbereitungFuer(bezug, tag, zweck);
  const def = v && alleAbsichten().find((a) => a.id === v.absicht);
  if (!v || !def || (def.rechte ?? []).some((r) => !darf(r, ich))) return null;
  return (
    <Button variante="sekundaer" icon="macher" breit={breit} klein={klein} onClick={() => mitMacherOeffnen(bezug, tag, zweck) && nachOeffnen?.()} aria-label={`Mit Lotte vorbereiten: ${def.titel}`}>
      Mit Lotte vorbereiten
    </Button>
  );
}
