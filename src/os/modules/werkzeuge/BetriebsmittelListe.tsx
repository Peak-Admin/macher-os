import { useState } from 'react';
import { db } from '@core/db';
import { passt } from '@core/format';
import type { Betriebsmittel, BetriebsmittelArt } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Suchfeld, TypIcon } from '@ui/index';
import { faelligkeit } from '../pruefungen/daten';
import { ART_ICON, ART_LABEL, ART_TON, STATUS_LABEL, woIst } from './daten';

const TITEL: Record<BetriebsmittelArt, string> = { werkzeug: 'Werkzeuge', maschine: 'Maschinen & Geräte', fahrzeug: 'Fahrzeuge' };
const NEU: Record<BetriebsmittelArt, string> = { werkzeug: 'Werkzeug anlegen', maschine: 'Gerät anlegen', fahrzeug: 'Fahrzeug anlegen' };
const LEER: Record<BetriebsmittelArt, string> = {
  werkzeug: 'Lege Messgeräte, Leitern und Handwerkzeug an. Dann siehst du jederzeit, wer was hat.',
  maschine: 'Lege Bohrhammer, Kernbohrgerät, Rüttler & Co. an. Dann weißt du in Sekunden, wo sie sind.',
  fahrzeug: 'Lege deine Fahrzeuge an – mit Kennzeichen, Fahrer und TÜV-Termin.',
};

type StatusFilter = 'alle' | 'verfuegbar' | 'ausgegeben' | 'defekt';

function imFilter(f: StatusFilter, b: Betriebsmittel): boolean {
  if (f === 'verfuegbar') return b.status === 'verfuegbar';
  if (f === 'ausgegeben') return b.status === 'im_einsatz' || !!b.mitarbeiterId;
  if (f === 'defekt') return b.status === 'defekt' || b.status === 'in_pruefung' || faelligkeit(b).stufe === 'ueberfaellig';
  return true;
}

function suchtext(b: Betriebsmittel) {
  return [b.name, b.inventarnummer, b.kennzeichen, b.hersteller, b.seriennummer, b.standort, woIst(b).text];
}

export function BetriebsmittelListe({ art }: { art: BetriebsmittelArt }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('alle');
  const alle = db.betriebsmittel.use((b) => b.status !== 'ausgemustert');
  db.mitarbeiter.use();
  const eigene = alle.filter((b) => b.art === art);
  // Suche findet alles – „Wer hat den Bohrhammer?“ soll nicht an der Kategorie scheitern
  const treffer = q ? alle.filter((b) => passt(q, ...suchtext(b))) : eigene;
  const liste = treffer.filter((b) => imFilter(filter, b)).sort((a, b) => (a.art === art ? 0 : 1) - (b.art === art ? 0 : 1) || a.name.localeCompare(b.name, 'de'));
  const z = (f: StatusFilter) => treffer.filter((b) => imFilter(f, b)).length;

  return (
    <Seite titel={TITEL[art]} aktion={<Button icon="plus" to={`/betrieb/werkzeuge/neu?art=${art}`}>{NEU[art]}</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter={art === 'fahrzeug' ? 'Kennzeichen, Fahrer …' : 'Wer hat den Bohrhammer? Name, Inventarnr. …'} />
        <Filter
          label="Status"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: z('alle') },
            { wert: 'verfuegbar', label: 'Verfügbar', zaehler: z('verfuegbar') },
            { wert: 'ausgegeben', label: art === 'fahrzeug' ? 'Mit Fahrer' : 'Ausgegeben', zaehler: z('ausgegeben') },
            { wert: 'defekt', label: 'Defekt / Prüfung', zaehler: z('defekt') },
          ]}
        />
        {q && treffer.some((b) => b.art !== art) && <Meta>Die Suche zeigt auch Treffer aus den anderen Bereichen (Werkzeuge, Geräte, Fahrzeuge).</Meta>}
        <Liste
          leer={
            q || filter !== 'alle' ? (
              <Leer titel="Nichts gefunden" text="Prüfe die Schreibweise oder setze den Filter zurück." icon="suche" aktion={<Button variante="sekundaer" onClick={() => (setQ(''), setFilter('alle'))}>Suche zurücksetzen</Button>} />
            ) : (
              <Leer titel={`Noch keine ${TITEL[art]}`} text={LEER[art]} icon={art === 'fahrzeug' ? 'auto' : 'werkzeug'} aktion={<Button to={`/betrieb/werkzeuge/neu?art=${art}`}>{NEU[art]}</Button>} />
            )
          }
        >
          {liste.map((b) => (
            <BetriebsmittelZeile key={b.id} b={b} zeigeArt={b.art !== art} />
          ))}
        </Liste>
      </Stapel>
    </Seite>
  );
}

export function BetriebsmittelZeile({ b, zeigeArt }: { b: Betriebsmittel; zeigeArt?: boolean }) {
  const wo = woIst(b);
  const f = faelligkeit(b);
  const nummer = b.art === 'fahrzeug' ? b.kennzeichen : b.inventarnummer;
  return (
    <ListenZeile
      to={`/betrieb/werkzeuge/${b.id}`}
      links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} />}
      titel={
        <>
          {b.name} <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      untertitel={[zeigeArt ? ART_LABEL[b.art] : null, nummer, wo.text].filter(Boolean).join(' · ')}
      rechts={
        f.stufe === 'ueberfaellig' ? (
          <Status ton="gefahr">Prüfung überfällig</Status>
        ) : b.status === 'defekt' || b.status === 'in_pruefung' ? (
          <Status ton={STATUS_LABEL[b.status].ton}>{STATUS_LABEL[b.status].text}</Status>
        ) : f.stufe === 'tage14' ? (
          <Status ton="achtung">{f.text}</Status>
        ) : (
          <Status ton={STATUS_LABEL[b.status].ton}>{b.art === 'fahrzeug' ? (b.mitarbeiterId ? 'Mit Fahrer' : 'Frei') : STATUS_LABEL[b.status].text}</Status>
        )
      }
    />
  );
}
