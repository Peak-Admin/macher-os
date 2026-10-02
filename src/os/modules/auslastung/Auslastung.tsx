/** Auslastung: wer ist die nächsten 4 Wochen voll, wer hat Luft? */
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, kalenderwoche, personName, zahl } from '@core/format';
import { Karte, Kennzahl, Leer, Liste, ListenZeile, Meta, Raster, Seite, Stapel, Status, Tabelle, Button } from '@ui/index';
import { Person, Personen } from '@ui/person';
import { useSchmal } from '../kalender/hooks';
import { kontextAusDb } from '../verfuegbarkeit/daten';
import { auslastung, teamWoche, type MitarbeiterAuslastung, type WochenWert } from './daten';

const wochenTitel = (w: string, i: number) => (i === 0 ? 'Diese Woche' : i === 1 ? 'Nächste Woche' : `KW ${kalenderwoche(w)}`);

function Zelle({ w }: { w: WochenWert }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      <span className="mm-number">
        {zahl(Math.round(w.geplant * 10) / 10)} / {zahl(Math.round(w.verfuegbar * 10) / 10)} h
      </span>
      <Status ton={w.ton}>{w.text}</Status>
    </span>
  );
}

export function useAuslastung() {
  useDatenstand();
  return auslastung(kontextAusDb(), heute(), 4);
}

export function AuslastungSeite() {
  const daten = useAuslastung();
  const schmal = useSchmal();
  const wochen = daten[0]?.wochen.map((w) => w.wochenStart) ?? [];
  const name = (id: string) => personName(db.mitarbeiter.get(id));
  const ueberlast = daten.filter((m) => m.wochen.slice(0, 2).some((w) => w.bewertung === 'ueberlast'));

  return (
    <Seite titel="Auslastung" untertitel="Geplante Stunden im Vergleich zu den Wochenstunden – Urlaub und Krankheit sind abgezogen.">
      {!daten.length ? (
        <Leer titel="Noch kein Team angelegt" text="Sobald Mitarbeiter mit Wochenstunden angelegt sind, siehst du hier, wer noch Luft hat." icon="team" />
      ) : (
        <>
          <Raster min={200}>
            {wochen.slice(0, 2).map((w, i) => {
              const s = teamWoche(daten, i);
              return (
                <Kennzahl
                  key={w}
                  label={i === 0 ? 'Team diese Woche' : 'Team nächste Woche'}
                  wert={s.verfuegbar ? `${Math.round(s.quote * 100)} %` : 'Niemand da'}
                  hinweis={`${zahl(s.geplant)} von ${zahl(s.verfuegbar)} h verplant`}
                  ton={s.quote > 1 ? 'achtung' : undefined}
                />
              );
            })}
          </Raster>
          {ueberlast.length > 0 && (
            <Meta>
              Überlastet in den nächsten 2 Wochen: <Personen ids={ueberlast.map((m) => m.mitarbeiterId)} namen />. Verteile Einsätze in der Plantafel um.
            </Meta>
          )}
          {schmal ? (
            <Stapel>
              {daten.map((m) => (
                <Karte key={m.mitarbeiterId} titel={<Person m={m.mitarbeiterId} groesse={32} />} kompakt>
                  <Liste>
                    {m.wochen.map((w, i) => (
                      <ListenZeile key={w.wochenStart} titel={wochenTitel(w.wochenStart, i)} untertitel={`ab ${datumKurz(w.wochenStart)}`} rechts={<Zelle w={w} />} />
                    ))}
                  </Liste>
                </Karte>
              ))}
            </Stapel>
          ) : (
            <Tabelle<MitarbeiterAuslastung>
              zeilen={daten}
              schluessel={(m) => m.mitarbeiterId}
              zeilenLink={() => '/plan/einsatzplanung'}
              spalten={[
                { titel: 'Mitarbeiter', wert: (m) => <Person m={m.mitarbeiterId} />, sortierWert: (m) => name(m.mitarbeiterId) },
                ...wochen.map((w, i) => ({
                  titel: `${wochenTitel(w, i)} (ab ${datumKurz(w).split(', ')[1]})`,
                  wert: (m: MitarbeiterAuslastung) => <Zelle w={m.wochen[i]} />,
                  sortierWert: (m: MitarbeiterAuslastung) => m.wochen[i].quote,
                })),
              ]}
            />
          )}
          <div>
            <Button variante="sekundaer" to="/plan/einsatzplanung">
              Zur Plantafel
            </Button>
          </div>
        </>
      )}
    </Seite>
  );
}

/** Kleine Kennzahl im Plan-Hub */
export function AuslastungWidget() {
  const daten = useAuslastung();
  if (!daten.length) return null;
  const s = teamWoche(daten, 0);
  const n = teamWoche(daten, 1);
  const ueber = daten.filter((m) => m.wochen[0].bewertung === 'ueberlast').length;
  return (
    <Raster min={200}>
      <Kennzahl
        label="Auslastung diese Woche"
        wert={s.verfuegbar ? `${Math.round(s.quote * 100)} %` : 'Niemand da'}
        hinweis={ueber ? `${ueber} überlastet` : `${zahl(Math.max(0, Math.round((s.verfuegbar - s.geplant) * 10) / 10))} h frei`}
        ton={ueber ? 'achtung' : undefined}
        to="/plan/auslastung"
      />
      <Kennzahl label="Nächste Woche" wert={n.verfuegbar ? `${Math.round(n.quote * 100)} %` : 'Niemand da'} hinweis={`${zahl(n.geplant)} von ${zahl(n.verfuegbar)} h verplant`} to="/plan/auslastung" />
    </Raster>
  );
}
