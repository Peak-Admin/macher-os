/** Werkzeug & Fahrzeug für die nächsten 7 Tage: was ist defekt, nicht geprüft oder doppelt verplant? */
import { useMemo } from 'react';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { datumKurz, relativ, uhrzeit } from '@core/format';
import { Button, Karte, Leer, Meta, Seite, Stapel, useToast, Zeile } from '@ui/index';
import { kontextAusDb, schlimmste } from '../autoplanung/basis';
import { StufeStatus } from '../autoplanung/PruefAnzeige';
import { ersatzFuer, werkzeugProbleme } from './daten';

export function WerkzeugBereit() {
  const v = useDatenstand();
  const toast = useToast();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const liste = useMemo(() => werkzeugProbleme(ctx, 7), [ctx]);
  const probleme = liste.filter((x) => schlimmste(x.pruefungen) === 'problem');
  const warnungen = liste.filter((x) => schlimmste(x.pruefungen) !== 'problem');

  return (
    <Seite titel="Werkzeug & Fahrzeug bereit?" untertitel="Prüft für die Einsätze der nächsten 7 Tage Zustand, Prüffristen und Doppelbelegung.">
      <Stapel abstand={16}>
        {!liste.length && (
          <Leer icon="check" titel="Alles einsatzbereit" text="Für die nächsten 7 Tage ist kein Werkzeug defekt, überfällig geprüft oder doppelt verplant." />
        )}
        {[...probleme, ...warnungen].map(({ termin: t, pruefungen }) => {
          const stufe = schlimmste(pruefungen);
          const terminPfad = pfadZu({ typ: 'termine', id: t.id });
          return (
            <Karte key={t.id} oberzeile={`${relativ(t.start)} · ${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`} titel={t.titel} aktion={<StufeStatus stufe={stufe} />}>
              <Stapel abstand={8}>
                {pruefungen.map((p, i) => {
                  const b = db.betriebsmittel.get(p.betriebsmittelId);
                  const ersatz = b && (t.betriebsmittelIds ?? []).includes(b.id) ? ersatzFuer(ctx, b, t) : undefined;
                  return (
                    <Stapel key={i} abstand={4}>
                      <Meta>{p.text}</Meta>
                      {p.loesung && <Meta>Lösung: {p.loesung}</Meta>}
                      {ersatz && p.ergebnis === 'problem' && (
                        <div>
                          <Button
                            klein
                            variante="sekundaer"
                            onClick={() => {
                              db.termine.update(t.id, { betriebsmittelIds: (t.betriebsmittelIds ?? []).map((x) => (x === b!.id ? ersatz.id : x)) }, { text: `${b!.name} durch ${ersatz.name} ersetzt` });
                              toast(`${ersatz.name} eingeplant.`);
                            }}
                          >
                            {ersatz.name} nehmen
                          </Button>
                        </div>
                      )}
                    </Stapel>
                  );
                })}
                {terminPfad && (
                  <Zeile>
                    <Button klein variante="tertiaer" to={terminPfad}>
                      Termin öffnen
                    </Button>
                  </Zeile>
                )}
              </Stapel>
            </Karte>
          );
        })}
      </Stapel>
    </Seite>
  );
}
