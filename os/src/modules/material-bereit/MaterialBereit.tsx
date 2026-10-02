/** Material für die nächsten Einsätze: fehlt etwas? Exception-First, mit Weg zu Bedarf/Bestellung. */
import { useMemo } from 'react';
import { useDatenstand } from '@core/db';
import { modul, modulPfad, pfadZu } from '@core/modul';
import { useEinstellung } from '@core/einstellungen';
import { datumKurz, relativ, uhrzeit } from '@core/format';
import { Button, Karte, Leer, Meldung, Meta, Seite, Segmente, Stapel, Zeile } from '@ui/index';
import { kontextAusDb } from '../autoplanung/basis';
import { StufeStatus } from '../autoplanung/PruefAnzeige';
import { pruefeMaterial } from './daten';

export const VORLAUF_KEY = 'materialbereit.vorlaufTage';

/** Pfad zu Bedarf (bzw. Bestellungen), falls das Modul da ist */
export function bedarfPfad(): string | undefined {
  const m = modul('bedarf') ?? modul('bestellungen');
  return m ? modulPfad(m) : undefined;
}

export function MaterialBereit() {
  const v = useDatenstand();
  const [vorlauf, setVorlauf] = useEinstellung<number>(VORLAUF_KEY, 5);
  const checks = useMemo(() => pruefeMaterial(kontextAusDb(), vorlauf), [v, vorlauf]);
  const mitProblem = checks.filter((c) => c.ergebnis !== 'ok');
  const bedarf = bedarfPfad();

  return (
    <Seite
      titel="Material bereit?"
      untertitel="Prüft das Material deiner nächsten Einsätze gegen den Lagerbestand."
      aktion={bedarf && mitProblem.length ? <Button icon="paket" to={bedarf}>Bedarf öffnen</Button> : undefined}
    >
      <Stapel abstand={16}>
        <Segmente
          label="Einsätze der nächsten"
          wert={String(vorlauf) as '2' | '5' | '10'}
          optionen={[
            { wert: '2', label: '2 Tage' },
            { wert: '5', label: '5 Tage' },
            { wert: '10', label: '10 Tage' },
          ]}
          onChange={(x) => setVorlauf(Number(x))}
        />
        {checks.length === 0 ? (
          <Leer icon="paket" titel="Kein Material zu prüfen" text={`In den nächsten ${vorlauf} Tagen hat kein Einsatz offenes Material am Auftrag.`} />
        ) : mitProblem.length === 0 ? (
          <Meldung ton="erfolg" titel="Alles da">{`Für ${checks.length === 1 ? 'den Einsatz' : `alle ${checks.length} Einsätze`} der nächsten ${vorlauf} Tage ist das Material bereit oder im Lager.`}</Meldung>
        ) : null}
        {[...mitProblem, ...checks.filter((c) => c.ergebnis === 'ok')].map((c) => {
          const auftragPfad = pfadZu({ typ: 'auftraege', id: c.auftrag.id });
          return (
            <Karte
              key={c.auftrag.id}
              oberzeile={`Einsatz ${relativ(c.termin.start)} · ${datumKurz(c.termin.start)}, ${uhrzeit(c.termin.start)} Uhr`}
              titel={c.auftrag.titel}
              aktion={<StufeStatus stufe={c.ergebnis} text={c.ergebnis === 'ok' ? 'Alles da' : c.ergebnis === 'problem' ? 'Material fehlt' : 'Prüfen'} />}
            >
              <Stapel abstand={8}>
                {c.zeilen
                  .filter((z) => c.ergebnis === 'ok' || z.pruefung.ergebnis !== 'ok')
                  .map((z) => (
                    <Stapel key={z.buchung.id} abstand={4}>
                      <Meta>{z.pruefung.text}</Meta>
                      {z.pruefung.loesung && z.pruefung.ergebnis !== 'ok' && <Meta>Lösung: {z.pruefung.loesung}</Meta>}
                    </Stapel>
                  ))}
                <Zeile>
                  {auftragPfad && (
                    <Button klein variante="tertiaer" to={auftragPfad}>
                      Auftrag öffnen
                    </Button>
                  )}
                  {bedarf && c.ergebnis !== 'ok' && (
                    <Button klein variante="sekundaer" to={bedarf}>
                      Bestellen
                    </Button>
                  )}
                </Zeile>
              </Stapel>
            </Karte>
          );
        })}
      </Stapel>
    </Seite>
  );
}
