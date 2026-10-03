import { useState } from 'react';
import { db } from '@core/db';
import { passt } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Button, Karte, Liste, ListenZeile, Meta, Stapel, Status, Suchfeld, Textfeld, TypIcon, useToast } from '@ui/index';
import { ART_ICON, ART_LABEL, ART_TON, defektMelden, fahrzeugText, woIst } from './daten';

/** Hub-Widget: „Wer hat den Bohrhammer?“ in drei Sekunden */
export function WerHatWasWidget() {
  const [q, setQ] = useState('');
  const alle = db.betriebsmittel.use((b) => b.status !== 'ausgemustert' && b.art !== 'fahrzeug');
  db.mitarbeiter.use();
  if (!alle.length) return null;
  const treffer = q ? alle.filter((b) => passt(q, b.name, b.inventarnummer, b.hersteller, woIst(b).text)).slice(0, 5) : [];
  return (
    <Karte titel="Wer hat was?" icon="suche" oberzeile="Werkzeug & Geräte">
      <Stapel abstand={12}>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Gerät suchen, z. B. Bohrhammer" />
        {q && (
          <Liste leer={<Meta>Nichts gefunden. Prüf die Schreibweise.</Meta>}>
            {treffer.map((b) => {
              const wo = woIst(b);
              return <ListenZeile key={b.id} to={`/betrieb/werkzeuge/${b.id}`} links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} klein />} titel={b.name} untertitel={ART_LABEL[b.art]} rechts={<Status ton={wo.ton}>{wo.text}</Status>} />;
            })}
          </Liste>
        )}
      </Stapel>
    </Karte>
  );
}

/** Panel am Mitarbeiter: was hat er gerade? */
export function MitarbeiterGeraete({ id }: { id: ID }) {
  const liste = db.betriebsmittel.use((b) => b.mitarbeiterId === id && b.status !== 'ausgemustert', [id]);
  if (!liste.length) return null;
  const geraete = liste.filter((b) => b.art !== 'fahrzeug');
  const fz = liste.filter((b) => b.art === 'fahrzeug');
  return (
    <Karte titel="Werkzeug & Fahrzeug" icon="werkzeug" kompakt>
      <Liste>
        {fz.map((b) => (
          <ListenZeile key={b.id} to={`/betrieb/werkzeuge/${b.id}`} links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} klein />} titel={fahrzeugText(b)} untertitel="Fahrer" />
        ))}
        {geraete.map((b) => (
          <ListenZeile key={b.id} to={`/betrieb/werkzeuge/${b.id}`} links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} klein />} titel={b.name} untertitel={b.inventarnummer} />
        ))}
      </Liste>
    </Karte>
  );
}

/** Schnell erfassen: Defekt melden */
export function DefektSchnell({ fertig }: { fertig: () => void }) {
  const geraete = db.betriebsmittel.use((b) => b.status !== 'ausgemustert' && b.status !== 'defekt');
  const toast = useToast();
  const [id, setId] = useState('');
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!id) return setFehler('Welches Gerät ist kaputt?');
        defektMelden(id, text);
        toast('Defekt gemeldet. Das Büro kümmert sich.');
        fertig();
      }}
    >
      <Stapel>
        <Auswahl label="Gerät" value={id} leer="Gerät wählen" fehler={fehler} onChange={(e) => setId(e.target.value)} optionen={[...geraete].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((b) => ({ wert: b.id, label: `${b.name}${b.inventarnummer ? ` (${b.inventarnummer})` : b.kennzeichen ? ` (${b.kennzeichen})` : ''}` }))} />
        <Textfeld label="Was ist kaputt?" optional value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Akku lädt nicht" />
        <Button type="submit" variante="gefahr" breit>
          Defekt melden
        </Button>
      </Stapel>
    </form>
  );
}
