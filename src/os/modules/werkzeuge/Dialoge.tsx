import { useState } from 'react';
import { db } from '@core/db';
import { heute, personName } from '@core/format';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { Abschnitt, Avatar, Button, Dialog, Eingabe, Liste, ListenZeile, Meta, Stapel, Textfeld, useToast } from '@ui/index';
import { initialen } from '@core/format';
import { faelligkeit } from '../pruefungen/daten';
import { ausgeben, defektMelden, fahrzeuge, fahrzeugText, STANDARD_LAGER, zielText, type Ziel } from './daten';

/** Ausgabe mit einem Tap: an Mitarbeiter, ins Fahrzeug oder an einen Ort */
export function AusgabeDialog({ id, offen, onSchliessen }: { id: ID; offen: boolean; onSchliessen: () => void }) {
  const b = db.betriebsmittel.useOne(id);
  const ich = useIch();
  const toast = useToast();
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  const [ort, setOrt] = useState('');
  if (!b) return null;
  const istFahrzeug = b.art === 'fahrzeug';

  const los = (z: Ziel) => {
    const fehler = ausgeben(id, z);
    if (fehler) return toast(fehler, { ton: 'achtung' });
    const gesperrt = b.status === 'defekt' || faelligkeit(b).stufe === 'ueberfaellig';
    const text = istFahrzeug ? `${zielText(z)} fährt jetzt ${b.name}.` : `${b.name}: ${z.typ === 'mitarbeiter' ? 'bei' : 'jetzt'} ${zielText(z)}.`;
    toast(gesperrt ? `${text} Achtung: ${b.status === 'defekt' ? 'defekt' : 'Prüfung überfällig'} – nicht verwenden!` : text, { ton: gesperrt ? 'achtung' : 'erfolg' });
    setOrt('');
    onSchliessen();
  };

  const sortiert = [...mitarbeiter].sort((a, z) => (a.id === ich?.id ? -1 : z.id === ich?.id ? 1 : a.vorname.localeCompare(z.vorname, 'de')));

  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={istFahrzeug ? `Fahrer für ${b.name}` : `${b.name} ausgeben`}>
      <Stapel>
        <Abschnitt titel={istFahrzeug ? 'Wer fährt?' : 'An wen?'}>
          <Liste leer={<Meta>Noch keine Mitarbeiter angelegt.</Meta>}>
            {sortiert.map((m) => (
              <ListenZeile
                key={m.id}
                links={<Avatar text={initialen(m)} farbe={m.farbe} />}
                titel={m.id === ich?.id ? `${personName(m)} (ich)` : personName(m)}
                aktiv={b.mitarbeiterId === m.id}
                untertitel={b.mitarbeiterId === m.id ? 'Hat es gerade' : undefined}
                onClick={() => los({ typ: 'mitarbeiter', id: m.id })}
              />
            ))}
          </Liste>
        </Abschnitt>
        {!istFahrzeug && fahrzeuge().length > 0 && (
          <Abschnitt titel="Ins Fahrzeug">
            <Liste>
              {fahrzeuge().map((f) => (
                <ListenZeile key={f.id} titel={fahrzeugText(f)} onClick={() => los({ typ: 'fahrzeug', id: f.id })} />
              ))}
            </Liste>
          </Abschnitt>
        )}
        {!istFahrzeug && (
          <Abschnitt titel="An einen Ort">
            <Stapel abstand={8}>
              <Button variante="sekundaer" icon="lager" onClick={() => los({ typ: 'ort', text: STANDARD_LAGER })}>
                Ins Lager
              </Button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (ort.trim()) los({ typ: 'ort', text: ort.trim() });
                }}
                className="mm-zeile"
                style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
              >
                <div style={{ flex: '1 1 200px' }}>
                  <Eingabe label="Anderer Ort" value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="z. B. Baustelle Goethestraße" />
                </div>
                <Button type="submit" variante="sekundaer" disabled={!ort.trim()}>
                  Dort ablegen
                </Button>
              </form>
            </Stapel>
          </Abschnitt>
        )}
      </Stapel>
    </Dialog>
  );
}

export function DefektDialog({ id, offen, onSchliessen }: { id: ID; offen: boolean; onSchliessen: () => void }) {
  const b = db.betriebsmittel.useOne(id);
  const toast = useToast();
  const [text, setText] = useState('');
  const [wieder, setWieder] = useState('');
  if (!b) return null;
  const melden = () => {
    defektMelden(id, text, wieder || undefined);
    toast(`${b.name} ist als defekt gemeldet. Das Büro sieht es unter „Braucht dich“.`);
    setText('');
    setWieder('');
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`Defekt melden: ${b.name}`}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button variante="gefahr" onClick={melden}>
            Defekt melden
          </Button>
        </>
      }
    >
      <Stapel>
        <Textfeld label="Was ist kaputt?" value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Kabel angeschmort, Akku lädt nicht" autoFocus optional />
        <Eingabe label="Wann ist es wieder einsatzbereit?" type="date" min={heute()} value={wieder} onChange={(e) => setWieder(e.target.value)} hilfe="Wenn du es schon weißt, z. B. Werkstatttermin" optional />
      </Stapel>
    </Dialog>
  );
}
