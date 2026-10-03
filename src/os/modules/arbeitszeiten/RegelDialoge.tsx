import { useState } from 'react';
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { heute, personName, wochenStart } from '@core/format';
import type { ID } from '@core/objects';
import { Button, Dialog, Eingabe, FormRaster, Meldung, Meta, Schalter, Segmente, Stapel, Textfeld, ZahlEingabe, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { BUCHUNG_LABEL, WOCHENTAGE, arbeitsmodelle, stundenbuchungen, minutenAm, modellSpeichern, modellText, standardMinuten, stundenBuchen, wochenSumme, type BuchungsArt } from './modell';
import { STANDARD_REGELN } from './regelwerk';
import { stunden } from './daten';

/** Regeln für Arbeitszeiten – nur bei Bedarf geöffnet (sinnvolle Standards) */
export function RegelnDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [autoPause, setAutoPause] = useEinstellung<boolean>('arbeitszeiten.autoPause', STANDARD_REGELN.autoPause);
  const [plus, setPlus] = useEinstellung<number>('arbeitszeiten.grenzePlus', STANDARD_REGELN.grenzePlus);
  const [minus, setMinus] = useEinstellung<number>('arbeitszeiten.grenzeMinus', STANDARD_REGELN.grenzeMinus);
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Regeln für Arbeitszeiten"
      icon="einstellungen"
      aktionen={
        <Button
          onClick={() => {
            toast('Regeln gespeichert.');
            onSchliessen();
          }}
        >
          Fertig
        </Button>
      }
    >
      <Stapel abstand={16}>
        <Schalter
          label="Fehlende Pausen automatisch abziehen"
          beschreibung="Nach Arbeitszeitgesetz: über 6 Stunden 30 Minuten, über 9 Stunden 45 Minuten. Abgezogen wird nur, was fehlt."
          checked={autoPause !== false}
          onChange={setAutoPause}
        />
        <FormRaster>
          <ZahlEingabe label="Melden ab Plusstunden" wert={plus / 60} onWert={(n) => n != null && n > 0 && setPlus(Math.round(n * 60))} hilfe="Dann schlägt Macher freie Tage zum Abbau vor." beimVerlassen />
          <ZahlEingabe label="Melden ab Minusstunden" wert={minus / 60} onWert={(n) => n != null && n > 0 && setMinus(Math.round(n * 60))} hilfe="Dann bittet Macher dich, die Zeiten zu prüfen." beimVerlassen />
        </FormRaster>
        <Meta>Feiertage kommen aus deinem Bundesland (Plan-Einstellungen). Urlaub, Krankheit und Berufsschule zählen als erfüllte Soll-Zeit.</Meta>
      </Stapel>
    </Dialog>
  );
}

/** Arbeitszeitmodell (mit `key` beim Öffnen neu einhängen, damit die Felder frisch sind): Soll-Stunden je Wochentag (Teilzeit, kurzer Freitag …), gültig ab einem Montag */
export function ModellDialog({ maId, offen, onSchliessen }: { maId: ID; offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const m = db.mitarbeiter.get(maId);
  const start = () => (m ? minutenAm(m, heute(), arbeitsmodelle.all()).map((x) => x / 60) : [8, 8, 8, 8, 8, 0, 0]);
  const [stundenJeTag, setStundenJeTag] = useState<number[]>(start);
  const [ab, setAb] = useState(wochenStart(heute()));
  const [fehler, setFehler] = useState<string>();
  if (!m) return null;
  const minuten = stundenJeTag.map((h) => Math.round((h || 0) * 60));
  const summe = wochenSumme(minuten);
  const speichern = () => {
    if (minuten.some((x) => x > 12 * 60)) return setFehler('Mehr als 12 Stunden an einem Tag gehen nach Arbeitszeitgesetz nicht.');
    if (!summe) return setFehler('Trag mindestens an einem Tag Stunden ein.');
    if (!ab) return setFehler('Wähle, ab wann das Modell gilt.');
    modellSpeichern(m.id, minuten, ab);
    toast(`Arbeitszeitmodell gespeichert: ${stunden(summe)} pro Woche.`);
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`Arbeitszeit von ${m.vorname}`}
      icon="uhr"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <Meta>Stunden je Wochentag. Daraus rechnet Macher Soll, Überstunden und das Stundenkonto.</Meta>
        <FormRaster spalten={3}>
          {WOCHENTAGE.map((t, i) => (
            <ZahlEingabe
              key={t}
              label={`${t} (Std)`}
              wert={stundenJeTag[i]}
              onWert={(n) => setStundenJeTag(stundenJeTag.map((x, j) => (j === i ? Math.max(0, n ?? 0) : x)))}
            />
          ))}
        </FormRaster>
        <div>
          <Button klein variante="tertiaer" onClick={() => setStundenJeTag(standardMinuten(summe / 60 || m.wochenstunden).map((x) => x / 60))}>
            Gleichmäßig auf die Arbeitstage verteilen
          </Button>
        </div>
        <Eingabe label="Gilt ab" type="date" value={ab} onChange={(e) => setAb(e.target.value)} hilfe="Wochen davor rechnen weiter mit der alten Soll-Zeit." />
        <Meldung>
          {stunden(summe)} pro Woche · {modellText(minuten)}
        </Meldung>
        {fehler && (
          <Meldung ton="achtung" titel="Bitte prüfen">
            {fehler}
          </Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}

/** Stunden aufs Konto buchen (mit `key` beim Öffnen neu einhängen): Übertrag aus dem alten System, Auszahlung, Korrektur – immer mit Grund */
export function BuchungDialog({ offen, onSchliessen, maId }: { offen: boolean; onSchliessen: () => void; maId?: ID }) {
  const toast = useToast();
  const [f, setF] = useState({ maId: maId ?? '', art: 'korrektur' as BuchungsArt, richtung: 'plus' as 'plus' | 'minus', std: undefined as number | undefined, datum: heute(), grund: '' });
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    if (!f.maId) return setFehler('Wähle aus, für wen du buchst.');
    if (!f.std || f.std <= 0) return setFehler('Trag die Stunden ein.');
    if (!f.grund.trim()) return setFehler('Schreib kurz den Grund dazu. So bleibt es nachvollziehbar.');
    const vorzeichen = f.art === 'auszahlung' ? -1 : f.richtung === 'minus' ? -1 : 1;
    const b = stundenBuchen({ mitarbeiterId: f.maId, art: f.art, datum: f.datum, minuten: vorzeichen * Math.round(f.std * 60), grund: f.grund });
    toast(`${BUCHUNG_LABEL[b.art]} gebucht für ${personName(db.mitarbeiter.get(b.mitarbeiterId))}.`, { aktion: { label: 'Rückgängig', onClick: () => stundenbuchungen.remove(b.id) } });
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Stundenkonto korrigieren"
      icon="stift"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Buchen</Button>
        </>
      }
    >
      <Stapel abstand={16}>
        {!maId && <MitarbeiterAuswahl label="Für" wert={f.maId} onChange={(v) => setF({ ...f, maId: v })} />}
        <Segmente label="Was buchst du?" wert={f.art} onChange={(v) => setF({ ...f, art: v })} optionen={(Object.keys(BUCHUNG_LABEL) as BuchungsArt[]).map((a) => ({ wert: a, label: a === 'startsaldo' ? 'Übertrag' : a === 'auszahlung' ? 'Auszahlung' : 'Korrektur' }))} />
        {f.art !== 'auszahlung' && (
          <Segmente label="Richtung" wert={f.richtung} onChange={(v) => setF({ ...f, richtung: v })} optionen={[{ wert: 'plus', label: 'Plusstunden', icon: 'plus' }, { wert: 'minus', label: 'Minusstunden', icon: 'minus' }]} />
        )}
        <FormRaster>
          <ZahlEingabe label="Stunden" wert={f.std} onWert={(n) => setF({ ...f, std: n })} />
          <Eingabe label={f.art === 'startsaldo' ? 'Stand am' : 'Datum'} type="date" value={f.datum} onChange={(e) => setF({ ...f, datum: e.target.value })} hilfe={f.art === 'startsaldo' ? 'Ab diesem Tag rechnet Macher weiter.' : undefined} />
        </FormRaster>
        <Textfeld label="Grund" value={f.grund} onChange={(e) => setF({ ...f, grund: e.target.value })} placeholder={f.art === 'auszahlung' ? 'Zum Beispiel: mit dem Oktober-Lohn ausgezahlt' : 'Zum Beispiel: Stand laut alter Stundenliste'} />
        {f.art === 'auszahlung' && <Meta>Ausgezahlte Stunden werden vom Konto abgezogen.</Meta>}
        {fehler && (
          <Meldung ton="achtung" titel="Bitte prüfen">
            {fehler}
          </Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}
