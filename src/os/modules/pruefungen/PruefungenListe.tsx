import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, TypIcon, Abschnitt } from '@ui/index';
import { ART_ICON, ART_LABEL, ART_TON, woIst } from '../werkzeuge/daten';
import { pruefliste, type Stufe } from './daten';
import { PruefungDialog } from './PruefungDialog';

type Ansicht = 'faellig' | 'ueberfaellig' | 'alle';

export function PruefungenListe() {
  useDatenstand();
  const [ansicht, setAnsicht] = useState<Ansicht>('faellig');
  const [offen, setOffen] = useState<ID>();
  const liste = pruefliste();
  const ohneFrist = db.betriebsmittel.where((b) => b.status !== 'ausgemustert' && !b.naechstePruefung);
  const faellig = (s: Stufe) => s === 'ueberfaellig' || s === 'tage14' || s === 'tage30';
  const zaehl = { ueberfaellig: liste.filter((x) => x.f.stufe === 'ueberfaellig').length, faellig: liste.filter((x) => faellig(x.f.stufe)).length };
  const gezeigt = liste.filter((x) => (ansicht === 'alle' ? true : ansicht === 'ueberfaellig' ? x.f.stufe === 'ueberfaellig' : faellig(x.f.stufe)));
  const alleGeraete = liste.length + ohneFrist.length;

  return (
    <Seite titel="Prüfungen & Wartung" untertitel="DGUV V3, TÜV/HU, UVV, Leitern, Kalibrierung – alle Fristen an einem Ort.">
      <PruefungDialog id={offen ?? ''} offen={!!offen} onSchliessen={() => setOffen(undefined)} />
      <Stapel>
        {zaehl.ueberfaellig > 0 && (
          <Meldung ton="achtung" titel={`${zaehl.ueberfaellig} ${zaehl.ueberfaellig === 1 ? 'Gerät' : 'Geräte'} mit überfälliger Prüfung`}>
            Nicht verwenden, bis die Prüfung gemacht ist. Tippe ein Gerät an, um die Prüfung einzutragen.
          </Meldung>
        )}
        {!alleGeraete ? (
          <Leer skizze titel="Noch keine Geräte erfasst" text="Lege Werkzeuge, Maschinen und Fahrzeuge an und trag die nächste Prüfung ein. Macher erinnert dich 30 und 14 Tage vorher." icon="schild" aktion={<Button to="/betrieb/werkzeuge/neu">Gerät anlegen</Button>} />
        ) : (
          <>
            <Filter
              label="Ansicht"
              wert={ansicht}
              onChange={setAnsicht}
              optionen={[
                { wert: 'faellig', label: 'Nächste 30 Tage', zaehler: zaehl.faellig },
                { wert: 'ueberfaellig', label: 'Überfällig', zaehler: zaehl.ueberfaellig },
                { wert: 'alle', label: 'Alle Fristen', zaehler: liste.length },
              ]}
            />
            <Liste leer={<Leer titel="Alles geprüft" text={ansicht === 'ueberfaellig' ? 'Keine Prüfung ist überfällig.' : 'In den nächsten 30 Tagen ist keine Prüfung fällig.'} icon="check" aktion={ansicht !== 'alle' ? <Button variante="sekundaer" onClick={() => setAnsicht('alle')}>Alle Fristen zeigen</Button> : undefined} />}>
              {gezeigt.map(({ b, f }) => (
                <ListenZeile
                  key={b.id}
                  onClick={() => setOffen(b.id)}
                  links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} />}
                  titel={
                    <>
                      {b.name} <BeispielMarke zeigen={b.beispiel} />
                    </>
                  }
                  untertitel={[`${b.pruefungArt ?? 'Prüfung'} am ${datum(b.naechstePruefung)}`, ART_LABEL[b.art], b.kennzeichen ?? b.inventarnummer, woIst(b).text].filter(Boolean).join(' · ')}
                  rechts={<Status ton={f.ton}>{f.stufe === 'ueberfaellig' ? 'Überfällig' : f.text}</Status>}
                />
              ))}
            </Liste>
            {ohneFrist.length > 0 && (
              <Abschnitt titel="Ohne Prüffrist" hinweis="Prüfpflichtig? Öffne das Gerät und trag die nächste Prüfung ein.">
                <Liste>
                  {ohneFrist.map((b) => (
                    <ListenZeile key={b.id} to={`/betrieb/werkzeuge/${b.id}`} links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} />} titel={b.name} untertitel={ART_LABEL[b.art]} rechts={<Status>Keine Frist</Status>} />
                  ))}
                </Liste>
              </Abschnitt>
            )}
          </>
        )}
      </Stapel>
    </Seite>
  );
}
