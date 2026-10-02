import { useState } from 'react';
import { db } from '@core/db';
import { heute, personName, relativ, uhrzeit } from '@core/format';
import { useDarf, useIch } from '@core/session';
import { Auswahl, Button, Karte, Meldung, Meta, Raster, Segmente, Seite, Stapel, useToast } from '@ui/index';
import { dateiTeil, herunterladen, icsErzeugen, jsonExport, schnittstellen, termineFuerIcs } from './daten';

/** Termine als Kalenderdatei und alle Daten als JSON exportieren */
export function Export() {
  const toast = useToast();
  const ich = useIch();
  const planen = useDarf('planen');
  const admin = useDarf('admin');
  const betrieb = db.betrieb.useOne('betrieb');
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  db.termine.use();
  const protokoll = schnittstellen.use().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const [wer, setWer] = useState<string>(planen ? 'alle' : 'ich');
  const [zeitraum, setZeitraum] = useState<'ab_heute' | 'alle'>('ab_heute');
  const mitarbeiterId = wer === 'alle' ? undefined : wer === 'ich' ? ich?.id : wer;
  const termine = termineFuerIcs({ mitarbeiterId, abDatum: zeitraum === 'ab_heute' ? heute() : undefined });

  const icsLaden = () => {
    const person = mitarbeiterId ? db.mitarbeiter.get(mitarbeiterId) : undefined;
    const name = `${betrieb?.name ?? 'Macher OS'}${person ? ` – ${personName(person)}` : ''}`;
    const datei = `termine-${dateiTeil(person ? personName(person) : betrieb?.name)}-${heute()}.ics`;
    herunterladen(datei, icsErzeugen(termine, { kalendername: name }), 'text/calendar;charset=utf-8');
    schnittstellen.create({ art: 'ics', dateiname: datei, anzahl: termine.length });
    toast(`${termine.length} Termine exportiert.`);
  };

  const jsonLaden = () => {
    const daten = jsonExport();
    const anzahl = Object.values(daten.sammlungen).reduce((s, l) => s + l.length, 0);
    const datei = `macher-os-export-${dateiTeil(betrieb?.name)}-${heute()}.json`;
    herunterladen(datei, JSON.stringify(daten, null, 2), 'application/json');
    schnittstellen.create({ art: 'json', dateiname: datei, anzahl });
    toast(`${anzahl} Datensätze exportiert.`);
  };

  const letzter = (art: 'ics' | 'json') => protokoll.find((p) => p.art === art);

  return (
    <Seite titel="Exportieren" untertitel="Termine für deinen Kalender und alle Daten für andere Programme." zurueck={{ to: '/betrieb/schnittstellen', label: 'Schnittstellen' }}>
      <Raster min={300}>
        <Karte titel="Termine in deinen Kalender">
          <Stapel>
            {planen ? (
              <Auswahl
                label="Wessen Termine?"
                value={wer}
                onChange={(e) => setWer(e.target.value)}
                optionen={[{ wert: 'alle', label: 'Alle Termine' }, { wert: 'ich', label: 'Nur meine' }, ...mitarbeiter.filter((m) => m.id !== ich?.id).map((m) => ({ wert: m.id, label: personName(m) }))]}
              />
            ) : (
              <Meta>Du exportierst deine eigenen Termine.</Meta>
            )}
            <Segmente label="Zeitraum" wert={zeitraum} onChange={setZeitraum} optionen={[{ wert: 'ab_heute', label: 'Ab heute' }, { wert: 'alle', label: 'Alle' }]} />
            {termine.length ? <Meta>{termine.length === 1 ? '1 Termin' : `${termine.length} Termine`} in der Datei.</Meta> : <Meldung>Für diese Auswahl gibt es keine Termine.</Meldung>}
            <div>
              <Button icon="download" onClick={icsLaden} disabled={!termine.length}>
                Kalenderdatei herunterladen
              </Button>
            </div>
            <Meta>Datei in Outlook, Google Kalender oder auf dem iPhone öffnen – die Termine werden übernommen. Neue Termine kommen mit der nächsten Datei dazu.</Meta>
            {letzter('ics') && (
              <Meta>
                Zuletzt {relativ(letzter('ics')!.erstelltAm)}, {uhrzeit(letzter('ics')!.erstelltAm)}: {letzter('ics')!.anzahl} Termine
              </Meta>
            )}
          </Stapel>
        </Karte>
        <Karte titel="Alle Daten als JSON">
          <Stapel>
            <Meta>Kunden, Aufträge, Termine, Rechnungen und alles Weitere in einer lesbaren Datei – für ein anderes Programm oder deinen IT-Dienstleister. Ohne Papierkorb und interne Protokolle.</Meta>
            {admin ? (
              <div>
                <Button variante="sekundaer" icon="download" onClick={jsonLaden}>
                  JSON herunterladen
                </Button>
              </div>
            ) : (
              <Meldung>Den kompletten Export darf nur, wer das Recht „Einstellungen“ hat.</Meldung>
            )}
            {letzter('json') && (
              <Meta>
                Zuletzt {relativ(letzter('json')!.erstelltAm)}, {uhrzeit(letzter('json')!.erstelltAm)}: {letzter('json')!.anzahl} Datensätze
              </Meta>
            )}
            <Button variante="tertiaer" to="/betrieb/einstellungen/daten">
              Komplette Datensicherung
            </Button>
          </Stapel>
        </Karte>
      </Raster>
    </Seite>
  );
}
