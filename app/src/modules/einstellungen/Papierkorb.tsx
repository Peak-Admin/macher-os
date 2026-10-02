import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { relativ } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Filter, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Zeile, useBestaetigen, useToast } from '@ui/index';
import { EinstellungenTabs } from './Navigation';
import { endgueltigLoeschen, papierkorbEintraege, wiederherstellen } from './daten';

export function Papierkorb() {
  useDatenstand();
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const darfLoeschen = useDarf('loeschen');
  const admin = useDarf('admin');
  const [art, setArt] = useState('alle');
  const alle = papierkorbEintraege();
  const arten = [...new Set(alle.map((e) => e.art))].sort((a, b) => a.localeCompare(b, 'de'));
  const sichtbar = alle.filter((e) => art === 'alle' || e.art === art);
  const leerbar = alle.filter((e) => !e.aufbewahren);

  const leeren = async () => {
    if (!(await fragen('Papierkorb leeren?', `${leerbar.length} Einträge werden endgültig gelöscht. Rechnungen, Zahlungen, Belege und Angebote bleiben wegen der Aufbewahrungspflicht erhalten.`, 'Endgültig löschen'))) return;
    endgueltigLoeschen(leerbar);
    toast('Papierkorb geleert.');
  };

  return (
    <Seite titel="Einstellungen" untertitel="Gelöschtes bleibt hier, bis du es wiederherstellst oder endgültig löschst.">
      <Stapel abstand={24}>
        <EinstellungenTabs aktiv="papierkorb" papierkorb={alle.length} />
        {alle.length > 0 && (
          <Zeile zwischen>
            {arten.length > 1 ? (
              <Filter label="Art" wert={art} onChange={setArt} optionen={[{ wert: 'alle', label: 'Alle', zaehler: alle.length }, ...arten.map((a) => ({ wert: a, label: a, zaehler: alle.filter((e) => e.art === a).length }))]} />
            ) : (
              <span />
            )}
            {admin && leerbar.length > 0 && (
              <Button variante="tertiaer" icon="muell" onClick={leeren}>
                Papierkorb leeren
              </Button>
            )}
          </Zeile>
        )}
        <Liste leer={<Leer titel="Der Papierkorb ist leer" text="Was du löschst, landet zuerst hier – du kannst es jederzeit zurückholen." icon="muell" />}>
          {sichtbar.map((e) => (
            <ListenZeile
              key={`${e.sammlung}:${e.id}`}
              titel={e.titel}
              untertitel={`${e.art} · gelöscht ${relativ(e.geloeschtAm)}`}
              rechts={
                <Zeile abstand={8}>
                  {e.aufbewahren && <Status>Aufbewahrungspflicht</Status>}
                  {darfLoeschen && (
                    <Button
                      variante="sekundaer"
                      klein
                      icon="wiederholen"
                      onClick={() => {
                        wiederherstellen(e.sammlung, e.id);
                        toast(`„${e.titel}“ wiederhergestellt.`);
                      }}
                    >
                      Wiederherstellen
                    </Button>
                  )}
                </Zeile>
              }
            />
          ))}
        </Liste>
        {!darfLoeschen && alle.length > 0 && <Meta>Wiederherstellen darf, wer das Recht „Löschen“ hat.</Meta>}
      </Stapel>
      {dialog}
    </Seite>
  );
}
