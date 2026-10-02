import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { datum, heute, plusTage, relativ } from '@core/format';
import { istBuero, useIch } from '@core/session';
import { Abschnitt, Button, Kennzahl, Leer, Liste, Meldung, Raster, Seite, Segmente, Stapel } from '@ui/index';
import { ABWESENHEIT_LABEL, abwesenheitAm, aufgabenFuer, betriebHeute, gruss, termineAm } from './logik';
import { AufgabeZeile, LageZeile, TerminZeile } from './teile';

const WIDGET_MAX = 5;

/** Kompakter Block auf „Heute“: meine Termine und Aufgaben, für Chef/Büro zusätzlich „Wer ist wo“. */
export function MeinTagWidget() {
  useDatenstand();
  const ich = useIch();
  if (!ich) return null;
  const tag = heute();
  const termine = termineAm(tag, ich.id);
  const aufgaben = aufgabenFuer(ich.id, tag);
  const ab = abwesenheitAm(ich.id, tag);
  const buero = istBuero(ich);
  const mehr = termine.length > WIDGET_MAX || aufgaben.length > WIDGET_MAX;

  return (
    <Abschnitt
      titel={`${gruss()}, ${ich.vorname}`}
      aktion={
        <Button variante="tertiaer" klein to="/heute/mein-tag" icon="pfeilRechts">
          {mehr ? 'Alles ansehen' : 'Mein Tag'}
        </Button>
      }
    >
      {ab && <Meldung titel={`Heute: ${ABWESENHEIT_LABEL[ab.art]}`}>Du bist bis {relativ(ab.bis)} eingetragen. Hier steht trotzdem, was für dich anliegt.</Meldung>}
      <Raster min={320}>
        <Stapel abstand={8}>
          <h3 className="mm-karte-titel">Termine heute</h3>
          <Liste leer={<Leer icon="kalender" titel="Heute keine Termine" text={buero ? 'Du hast heute keine eigenen Termine.' : 'Für dich ist heute nichts eingeplant. Frag im Büro, wenn du etwas erwartest.'} />}>
            {termine.slice(0, WIDGET_MAX).map((t) => (
              <TerminZeile key={t.id} t={t} />
            ))}
          </Liste>
        </Stapel>
        <Stapel abstand={8}>
          <h3 className="mm-karte-titel">Aufgaben</h3>
          <Liste leer={<Leer icon="check" titel="Keine Aufgaben für heute" text="Was heute fällig wird oder an deinen Einsätzen hängt, steht hier." />}>
            {aufgaben.slice(0, WIDGET_MAX).map((a) => (
              <AufgabeZeile key={a.id} a={a} tag={tag} />
            ))}
          </Liste>
        </Stapel>
        {buero && <WerIstWo kompakt />}
      </Raster>
    </Abschnitt>
  );
}

function WerIstWo({ kompakt }: { kompakt?: boolean }) {
  const liste = betriebHeute();
  const sichtbar = kompakt ? liste.filter((x) => x.lage.art !== 'frei' || liste.length <= WIDGET_MAX).slice(0, WIDGET_MAX) : liste;
  return (
    <Stapel abstand={8}>
      <h3 className="mm-karte-titel">Wer ist wo</h3>
      <Liste leer={<Leer icon="team" titel="Noch kein Team angelegt" text="Lege deine Mitarbeiter an, dann siehst du hier, wer gerade wo ist." />}>
        {sichtbar.map(({ mitarbeiter, lage }) => (
          <LageZeile key={mitarbeiter.id} m={mitarbeiter} lage={lage} />
        ))}
      </Liste>
      {kompakt && liste.length > sichtbar.length && (
        <Button variante="tertiaer" klein to="/heute/mein-tag">
          Alle {liste.length} Mitarbeiter ansehen
        </Button>
      )}
    </Stapel>
  );
}

/** Ganze Tagesansicht: Heute oder Morgen, meine Termine und Aufgaben, Betrieb für Chef/Büro. */
export function MeinTagSeite() {
  useDatenstand();
  const ich = useIch();
  const [wann, setWann] = useState<'heute' | 'morgen'>('heute');
  if (!ich) return <Seite titel="Mein Tag"><Leer titel="Niemand angemeldet" text="Wähle unten links, wer du bist." icon="person" /></Seite>;

  const tag = wann === 'heute' ? heute() : plusTage(heute(), 1);
  const termine = termineAm(tag, ich.id);
  const aufgaben = aufgabenFuer(ich.id, tag);
  const ab = abwesenheitAm(ich.id, tag);
  const buero = istBuero(ich);
  const alleTermine = buero ? termineAm(tag) : [];
  const fertig = alleTermine.filter((t) => t.status === 'erledigt').length;
  const laufend = alleTermine.filter((t) => t.status === 'vor_ort' || t.status === 'unterwegs').length;
  const unbesetzt = alleTermine.filter((t) => t.art !== 'intern' && t.mitarbeiterIds.length === 0).length;
  const schulungen = termine.filter((t) => t.art === 'schulung');

  return (
    <Seite titel="Mein Tag" untertitel={`${wann === 'heute' ? 'Heute' : 'Morgen'}, ${datum(tag)}`} breit>
      <Segmente
        label="Tag"
        wert={wann}
        onChange={setWann}
        optionen={[
          { wert: 'heute', label: 'Heute' },
          { wert: 'morgen', label: 'Morgen' },
        ]}
      />
      {ab && <Meldung titel={`${ABWESENHEIT_LABEL[ab.art]} bis ${relativ(ab.bis)}`}>{ab.notiz ?? 'Du bist an diesem Tag abwesend eingetragen.'}</Meldung>}
      {schulungen.length > 0 && (
        <Meldung ton="aktiv" titel={schulungen.length === 1 ? 'Schulung' : `${schulungen.length} Schulungen`}>
          {schulungen.map((s) => s.titel).join(', ')}
        </Meldung>
      )}

      <Abschnitt titel="Meine Termine">
        <Liste
          leer={
            <Leer
              icon="kalender"
              titel={wann === 'heute' ? 'Heute keine Termine' : 'Morgen keine Termine'}
              text={buero ? 'Neue Termine legst du im Kalender an.' : 'Für dich ist nichts eingeplant. Frag im Büro, wenn du etwas erwartest.'}
            />
          }
        >
          {termine.map((t) => (
            <TerminZeile key={t.id} t={t} />
          ))}
        </Liste>
      </Abschnitt>

      <Abschnitt titel="Meine Aufgaben" hinweis="Fällig bis zu diesem Tag oder an deinen Einsätzen. Abhaken reicht.">
        <Liste leer={<Leer icon="check" titel="Keine Aufgaben" text="Gerade liegt nichts für dich an." />}>
          {aufgaben.map((a) => (
            <AufgabeZeile key={a.id} a={a} tag={tag} />
          ))}
        </Liste>
      </Abschnitt>

      {buero && (
        <>
          <Abschnitt titel="Betrieb">
            <Raster min={200}>
              <Kennzahl label="Termine" wert={alleTermine.length} zeitraum={wann === 'heute' ? 'heute' : 'morgen'} />
              {wann === 'heute' && <Kennzahl label="Laufen gerade" wert={laufend} />}
              {wann === 'heute' && <Kennzahl label="Erledigt" wert={fertig} ton={fertig ? 'erfolg' : undefined} />}
              <Kennzahl label="Ohne Mitarbeiter" wert={unbesetzt} ton={unbesetzt ? 'achtung' : undefined} hinweis={unbesetzt ? 'Bitte einplanen' : undefined} />
            </Raster>
          </Abschnitt>
          {wann === 'heute' && <WerIstWo />}
          <Abschnitt titel={wann === 'heute' ? 'Alle Termine heute' : 'Alle Termine morgen'}>
            <Liste leer={<Leer icon="kalender" titel="Keine Termine im Betrieb" text="Plane Einsätze im Kalender, dann erscheinen sie hier." />}>
              {alleTermine.map((t) => (
                <TerminZeile key={t.id} t={t} mitNamen />
              ))}
            </Liste>
          </Abschnitt>
        </>
      )}
    </Seite>
  );
}
