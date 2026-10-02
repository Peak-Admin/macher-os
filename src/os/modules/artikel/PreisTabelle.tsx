/**
 * Materialliste am Desktop: Spalten EK · Zuschlag · VK mit schneller Bearbeitung direkt in der Zelle.
 * Klick oder Enter/Leertaste auf einen Preis öffnet ein kleines Eingabefeld; Enter oder Verlassen speichert,
 * Escape bricht ab. Nur für Rollen mit Recht „Preise & Geld“ – die Liste rendert sie sonst gar nicht.
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { euro, zahl } from '@core/format';
import type { Artikel } from '@core/objects';
import { BeispielMarke, Icon, Status, useToast, zahlAus } from '@ui/index';
import { unterMindestbestand } from '../lager/daten';
import { aufschlagProzent, preisAendern, type PreisFeld } from './daten';
import './artikel.css';

const prozent = (p: number | undefined) => (p == null ? '–' : `${String(p).replace('.', ',')} %`);
const eingabe = (cent: number) => (cent / 100).toFixed(2).replace('.', ',');

export function PreisTabelle({ artikel, bearbeitbar }: { artikel: Artikel[]; bearbeitbar: boolean }) {
  const toast = useToast();

  const speichern = (a: Artikel, feld: PreisFeld, text: string): string | undefined => {
    const r = preisAendern(a, feld, zahlAus(text));
    if ('fehler' in r) return r.fehler;
    if (r.ek === a.ek && r.vk === a.vk) return undefined;
    const vorher = { ek: a.ek, vk: a.vk };
    db.artikel.update(a.id, r, {
      text: `Preis in der Liste geändert: EK ${euro(vorher.ek)} → ${euro(r.ek)}, VK ${euro(vorher.vk)} → ${euro(r.vk)}`,
    });
    toast(`${a.name}: VK jetzt ${euro(r.vk)} / ${a.einheit}.`, {
      aktion: {
        label: 'Rückgängig',
        onClick: () =>
          db.artikel.update(a.id, vorher, {
            text: 'Preisänderung zurückgenommen',
          }),
      },
    });
    return undefined;
  };

  return (
    <div className="mm-tabelle-rahmen">
      <table className="mm-tabelle art-preise">
        <caption className="sr-only">Material mit Einkaufspreis, Zuschlag und Verkaufspreis. Preise lassen sich direkt in der Zelle ändern.</caption>
        <thead>
          <tr>
            <th scope="col">Material</th>
            <th scope="col" className="num">
              EK netto
            </th>
            <th scope="col" className="num">
              Zuschlag
            </th>
            <th scope="col" className="num">
              VK netto
            </th>
            <th scope="col">
              <span className="sr-only">Status</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {artikel.map((a) => {
            const aufschlag = aufschlagProzent(a.ek, a.vk);
            const lieferant = db.lieferanten.get(a.lieferantId)?.name;
            return (
              <tr key={a.id}>
                <td className="art-preise-name">
                  <Link to={`/betrieb/katalog/material/${a.id}`} className="art-preise-link">
                    {a.name}
                  </Link>{' '}
                  <BeispielMarke zeigen={a.beispiel} />
                  <span className="mm-meta art-preise-meta">
                    {[a.nummer, a.kategorie, lieferant, a.bestand != null ? `Bestand ${zahl(a.bestand)} ${a.einheit}` : null].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className="num">
                  <PreisZelle anzeige={euro(a.ek)} start={eingabe(a.ek)} label={`EK von ${a.name}`} einheit="€" bearbeitbar={bearbeitbar} onSpeichern={(t) => speichern(a, 'ek', t)} />
                </td>
                <td className="num">
                  <PreisZelle
                    anzeige={prozent(aufschlag)}
                    start={aufschlag != null ? String(aufschlag).replace('.', ',') : ''}
                    label={`Zuschlag von ${a.name}`}
                    einheit="%"
                    bearbeitbar={bearbeitbar && a.ek > 0}
                    onSpeichern={(t) => speichern(a, 'aufschlag', t)}
                  />
                </td>
                <td className="num">
                  <PreisZelle
                    anzeige={euro(a.vk)}
                    zusatz={`/ ${a.einheit}`}
                    start={eingabe(a.vk)}
                    label={`VK von ${a.name}`}
                    einheit="€"
                    bearbeitbar={bearbeitbar}
                    onSpeichern={(t) => speichern(a, 'vk', t)}
                  />
                </td>
                <td className="art-preise-status">
                  {a.vk < a.ek && <Status ton="gefahr">VK unter EK</Status>}
                  {unterMindestbestand(a) && <Status ton="achtung">Nachbestellen</Status>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PreisZelle({
  anzeige,
  zusatz,
  start,
  label,
  einheit,
  bearbeitbar,
  onSpeichern,
}: {
  anzeige: string;
  zusatz?: string;
  start: string;
  label: string;
  einheit: '€' | '%';
  bearbeitbar: boolean;
  onSpeichern: (text: string) => string | undefined;
}) {
  const [text, setText] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string>();
  // verhindert doppeltes Speichern: Beim Schließen verliert das Feld den Fokus und meldet noch ein „blur“
  const geschlossen = useRef(false);
  // nach Enter/Escape zurück auf den Preis, damit die Tastatur an derselben Stelle weitermacht
  const fokusZurueck = useRef(false);

  const schliessen = (fokus: boolean) => {
    geschlossen.current = true;
    setText(null);
    setFehler(undefined);
    fokusZurueck.current = fokus;
  };

  if (!bearbeitbar || text == null) {
    const inhalt = (
      <>
        <span className="mm-number">{anzeige}</span>
        {zusatz && <span className="art-zelle-zusatz">{zusatz}</span>}
      </>
    );
    if (!bearbeitbar) return <span className="art-zelle-wert">{inhalt}</span>;
    return (
      <button
        ref={(el) => {
          if (el && fokusZurueck.current) {
            fokusZurueck.current = false;
            el.focus();
          }
        }}
        type="button"
        className="art-zelle-knopf"
        aria-label={`${label} ändern, jetzt ${anzeige}`}
        onClick={() => {
          geschlossen.current = false;
          setFehler(undefined);
          setText(start);
        }}
      >
        {inhalt}
        <Icon name="stift" size={16} />
      </button>
    );
  }

  const taste = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const f = onSpeichern(text);
      if (f) setFehler(f);
      else schliessen(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      schliessen(true);
    }
  };
  const fehlerId = `art-fehler-${label.replace(/[^a-z0-9]+/gi, '-')}`;
  return (
    <span className="art-zelle-bearbeiten">
      <span className="art-zelle-feld">
        <input
          className="mm-input art-zelle-eingabe"
          inputMode="decimal"
          aria-label={`${label} in ${einheit === '€' ? 'Euro' : 'Prozent'}`}
          aria-invalid={!!fehler || undefined}
          aria-describedby={fehler ? fehlerId : undefined}
          autoFocus
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={taste}
          onBlur={() => {
            if (geschlossen.current) return;
            // Verlassen speichert; eine ungültige Eingabe wird dabei verworfen (der alte Preis bleibt)
            onSpeichern(text);
            schliessen(false);
          }}
        />
        <span className="art-zelle-einheit" aria-hidden>
          {einheit}
        </span>
      </span>
      {fehler && (
        <span id={fehlerId} className="mm-fehlertext art-zelle-fehler" role="alert">
          {fehler}
        </span>
      )}
    </span>
  );
}
