/** „Route heute“: Stopps eines Mitarbeiters mit Fahrzeiten, Puffer-Prüfung und Google-Maps-Link. */
import { useMemo, useState } from 'react';
import { useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { useIch } from '@core/session';
import { datumKurz, heute, personName, plusTage, uhrzeit } from '@core/format';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile } from '@ui/index';
import { kontextAusDb, planKontext } from '../autoplanung/basis';
import { planbareMitarbeiter, termineAm } from '../verfuegbarkeit/daten';
import { StufeStatus } from '../autoplanung/PruefAnzeige';
import { naechsterNachbar, pufferMinuten, streckeText, tagesroute } from './daten';

export function RouteHeute() {
  const v = useDatenstand();
  const ich = useIch();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const leute = planbareMitarbeiter(ctx, ctx.heute);
  const [tag, setTag] = useState(heute());
  const standard = leute.find((m) => m.id === ich?.id && termineAm(m.id, tag, planKontext(ctx)).length) ?? leute.find((m) => termineAm(m.id, tag, planKontext(ctx)).length) ?? leute[0];
  const [wahl, setWahl] = useState<string>('');
  const maId = wahl || standard?.id || '';
  const route = useMemo(() => (maId ? tagesroute(ctx, maId, tag, pufferMinuten()) : undefined), [ctx, maId, tag]);
  const vorschlag = useMemo(() => (route && route.stopps.length > 2 ? naechsterNachbar(route.start, route.stopps) : undefined), [route]);
  const spart = vorschlag ? Math.round(vorschlag.kmBisher - vorschlag.km) : 0;

  if (!leute.length)
    return (
      <Seite titel="Route heute">
        <Leer icon="team" titel="Noch niemand zum Einplanen" text="Leg zuerst deine Monteure an, dann siehst du hier ihre Tagesrouten." />
      </Seite>
    );

  const probleme = route?.uebergaenge.filter((u) => u.pruefung.ergebnis !== 'ok') ?? [];

  return (
    <Seite
      titel="Route heute"
      untertitel="Alle Einsätze eines Tages in Fahrtreihenfolge – mit Fahrzeit und Puffer."
      aktion={
        route?.mapsLink ? (
          <Button icon="route" onClick={() => window.open(route.mapsLink, '_blank', 'noopener')}>
            Route in Google Maps
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={16}>
        <FormRaster>
          <Auswahl
            label="Wer"
            value={maId}
            onChange={(e) => setWahl(e.target.value)}
            optionen={leute.map((m) => ({ wert: m.id, label: personName(m) }))}
          />
          <Eingabe label="Tag" type="date" value={tag} onChange={(e) => setTag(e.target.value || heute())} />
        </FormRaster>
        <Zeile>
          <Button klein variante={tag === heute() ? 'sekundaer' : 'tertiaer'} onClick={() => setTag(heute())}>
            Heute
          </Button>
          <Button klein variante={tag === plusTage(heute(), 1) ? 'sekundaer' : 'tertiaer'} onClick={() => setTag(plusTage(heute(), 1))}>
            Morgen
          </Button>
        </Zeile>

        {!route || !route.stopps.length ? (
          <Leer icon="route" titel={`Keine Einsätze am ${datumKurz(tag)}`} text="Sobald für diesen Tag Einsätze geplant sind, steht hier die Route." />
        ) : (
          <>
            <Karte kompakt>
              <Zeile abstand={16}>
                <Meta>{route.stopps.length === 1 ? '1 Stopp' : `${route.stopps.length} Stopps`}</Meta>
                <Meta>
                  {route.geschaetzt ? 'ca. ' : ''}
                  {Math.round(route.kmGesamt)} km · {route.minutenGesamt} min Fahrt
                </Meta>
                {route.geschaetzt && <Status ton="neutral">Grob geschätzt über PLZ</Status>}
                {probleme.length ? <StufeStatus stufe={probleme.some((p) => p.pruefung.ergebnis === 'problem') ? 'problem' : 'warnung'} text="Zeit wird knapp" /> : <StufeStatus stufe="ok" text="Zeiten passen" />}
              </Zeile>
              {!route.start && <Meta>Ohne Startadresse (Betrieb oder Mitarbeiter) beginnt die Route am ersten Einsatz.</Meta>}
            </Karte>

            {probleme.map((u) => (
              <Meldung key={u.von.id + u.nach.id} ton={u.pruefung.ergebnis === 'problem' ? 'achtung' : 'neutral'} titel={u.pruefung.text}>
                {u.pruefung.loesung}
              </Meldung>
            ))}

            <Liste>
              {route.stopps.map((s, i) => (
                <ListenZeile
                  key={s.termin.id}
                  to={pfadZu({ typ: 'termine', id: s.termin.id })}
                  links={<Status ton="neutral" icon={false}>{String(i + 1)}</Status>}
                  titel={`${uhrzeit(s.termin.start)}–${uhrzeit(s.termin.ende)} · ${s.termin.titel}`}
                  untertitel={
                    <Stapel abstand={4}>
                      <span>{s.punkt?.label ?? 'Keine Adresse hinterlegt'}</span>
                      <span>Anfahrt: {streckeText(s.anfahrt)}</span>
                    </Stapel>
                  }
                />
              ))}
            </Liste>

            {vorschlag && spart >= 2 && (
              <Meldung titel={`Andere Reihenfolge spart ca. ${spart} km`}>
                {vorschlag.reihenfolge.map((s) => s.termin.titel).join(' → ')}. Die Uhrzeiten stehen fest – zum Umstellen die Termine im Kalender verschieben.
              </Meldung>
            )}
          </>
        )}
      </Stapel>
    </Seite>
  );
}
