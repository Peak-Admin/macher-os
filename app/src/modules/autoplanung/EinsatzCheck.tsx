/**
 * Panel „Einsatz-Check“ an Terminen und Aufträgen: Qualifikation, Fahrt, Material,
 * Werkzeug & Fahrzeug auf einen Blick. Probleme mit Lösung, sonst eine Zeile „Passt“.
 */
import { useMemo } from 'react';
import { useDatenstand } from '@core/db';
import { datumKurz, uhrzeit } from '@core/format';
import { Button, Karte, Meta, Stapel } from '@ui/index';
import type { ID, Termin } from '@core/objects';
import { aktiverTermin, kontextAusDb, schlimmste, terminDatum, type Kontext, type Pruefung } from './basis';
import { StufeStatus, PruefBereich } from './PruefAnzeige';
import { pruefeQualifikation } from '../qualifikation-planung/daten';
import { pruefeFahrtFuerTermin, pufferMinuten, tagesroute } from '../fahrt/daten';
import { pruefeMaterialFuerTermin } from '../material-bereit/daten';
import { pruefeWerkzeug } from '../werkzeug-bereit/daten';

export interface EinsatzPruefung {
  qualifikation: Pruefung[];
  fahrt: Pruefung[];
  material: Pruefung[];
  werkzeug: Pruefung[];
}

export function pruefeEinsatz(ctx: Kontext, t: Termin, puffer = 10): EinsatzPruefung {
  return {
    qualifikation: pruefeQualifikation(ctx, t),
    fahrt: pruefeFahrtFuerTermin(ctx, t, puffer),
    material: pruefeMaterialFuerTermin(ctx, t),
    werkzeug: pruefeWerkzeug(ctx, t),
  };
}

export const allePruefungen = (p: EinsatzPruefung) => [...p.qualifikation, ...p.fahrt, ...p.material, ...p.werkzeug];

function CheckInhalt({ ctx, t }: { ctx: Kontext; t: Termin }) {
  const p = pruefeEinsatz(ctx, t, pufferMinuten());
  const route = t.mitarbeiterIds[0] ? tagesroute(ctx, t.mitarbeiterIds[0], terminDatum(t)) : undefined;
  const mapsButton = route?.mapsLink ? (
    <Button variante="tertiaer" klein icon="route" onClick={() => window.open(route.mapsLink, '_blank', 'noopener')}>
      Tagesroute in Google Maps
    </Button>
  ) : undefined;
  if (schlimmste(allePruefungen(p)) === 'ok')
    return (
      <Stapel abstand={8}>
        <Meta>Qualifikation, Fahrzeit, Material, Werkzeug und Fahrzeug sind geprüft.</Meta>
        {mapsButton && <div>{mapsButton}</div>}
      </Stapel>
    );
  return (
    <Stapel abstand={16}>
      <PruefBereich titel="Qualifikation" pruefungen={p.qualifikation} />
      <PruefBereich
        titel="Fahrt"
        pruefungen={p.fahrt.length ? p.fahrt : [{ ergebnis: 'ok', text: 'Kein enger Anschlusstermin am selben Tag.' }]}
        aktion={mapsButton}
      />
      <PruefBereich titel="Material" pruefungen={p.material} />
      <PruefBereich titel="Werkzeug & Fahrzeug" pruefungen={p.werkzeug} />
    </Stapel>
  );
}

/** Panel am Termin */
export function TerminCheck({ id }: { id: ID }) {
  const v = useDatenstand();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const t = ctx.termine.find((x) => x.id === id);
  if (!t || !aktiverTermin(t) || t.status === 'erledigt' || ['intern', 'schulung'].includes(t.art)) return null;
  const stufe = schlimmste(allePruefungen(pruefeEinsatz(ctx, t)));
  return (
    <Karte titel="Einsatz-Check" kompakt aktion={<StufeStatus stufe={stufe} text={stufe === 'ok' ? 'Alles bereit' : undefined} />}>
      <CheckInhalt ctx={ctx} t={t} />
    </Karte>
  );
}

/** Panel am Auftrag: Check für den nächsten anstehenden Einsatz */
export function AuftragCheck({ id }: { id: ID }) {
  const v = useDatenstand();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const t = ctx.termine
    .filter((x) => x.auftragId === id && aktiverTermin(x) && x.status !== 'erledigt' && terminDatum(x) >= ctx.heute && !['intern', 'schulung', 'besichtigung'].includes(x.art))
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (!t) return null;
  const stufe = schlimmste(allePruefungen(pruefeEinsatz(ctx, t)));
  return (
    <Karte titel="Einsatz-Check" oberzeile={`Nächster Einsatz ${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`} kompakt aktion={<StufeStatus stufe={stufe} text={stufe === 'ok' ? 'Alles bereit' : undefined} />}>
      <CheckInhalt ctx={ctx} t={t} />
    </Karte>
  );
}
