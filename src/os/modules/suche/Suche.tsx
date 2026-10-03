import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { schnellAktion, sucheUeberall, type Treffer } from '@core/modul';
import { oeffne } from '@core/overlay';
import { darf, useIch } from '@core/session';
import { Button, Filter, Icon, KiKugel, Leer, Liste, ListenZeile, Meta, Oberzeile, Stapel, Suchfeld, Zeile } from '@ui/index';
import { erfassen } from '@ui/objekt';
import { ALLE, artFilter, artLabel, bezugAus, gruppieren, merkeGeoeffnet, merkeSuche, ohneDoppelte, schnellaktion, sortieren, trefferZeit, type Geoeffnet, type Sortierung } from './daten';
import { funktionsTreffer } from '../../shell/struktur';

/** Klingt die Eingabe nach einer Frage? Dann steht „Frag Lotte“ ganz oben statt am Ende. */
export function istFrage(q: string) {
  const t = q.trim().toLowerCase();
  return t.endsWith('?') || /^(wer|wie|was|wann|wo|wieso|warum|welche[rsmn]?|gibt|zeig|erstell|leg|plan|schreib)\b/.test(t) || t.split(/\s+/).length >= 5;
}

/**
 * Suchen oder fragen: Suchfeld, Filter nach Art, gruppierte Treffer mit je einer Nebenaktion,
 * dazu immer eine Zeile „Frag Lotte“. Pfeiltasten/Enter wählen, Tab erreicht die Nebenaktionen.
 * Ohne Suchbegriff: häufige Aktionen, zuletzt geöffnet, zuletzt gesucht. Im Overlay und auf der Seite gleich.
 */
export function SuchKern({ onFertig }: { onFertig?: () => void }) {
  useDatenstand();
  const ich = useIch();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [aktiv, setAktiv] = useState(0);
  const [art, setArt] = useState(ALLE);
  const [sortierung, setSortierung] = useState<Sortierung>('relevanz');
  const [letzte, setLetzte] = useEinstellung<string[]>(`suche.letzte.${ich?.id ?? 'alle'}`, []);
  const [geoeffnet, setGeoeffnet] = useEinstellung<Geoeffnet[]>(`suche.geoeffnet.${ich?.id ?? 'alle'}`, []);
  const liste = useRef<HTMLDivElement>(null);

  const rechte = { geld: !!ich && darf('geld', ich), schreiben: !!ich && darf('schreiben', ich), zeit: !!schnellAktion('zeit') };
  const alleTreffer = useMemo(() => ohneDoppelte([...sucheUeberall(q), ...funktionsTreffer(q, ich)]), [q, ich]);
  const chips = artFilter(alleTreffer);
  const gewaehlt = chips.some((c) => c.wert === art) ? art : ALLE;
  const gefiltert = sortieren(
    gewaehlt === ALLE ? alleTreffer : alleTreffer.filter((t) => t.typ === gewaehlt),
    sortierung,
    trefferZeit,
  );
  const gruppen = gruppieren(gefiltert, gewaehlt === ALLE ? 5 : 30);
  const flach = gruppen.flatMap((g) => g.treffer);
  const frage = q.trim();
  const frageOben = !!frage && (istFrage(frage) || !flach.length);
  const anzahl = flach.length + (frage ? 1 : 0);
  const frageIndex = frageOben ? 0 : flach.length;
  const versatz = frageOben ? 1 : 0;

  useEffect(() => setAktiv(0), [q, gewaehlt, sortierung]);
  useEffect(() => {
    liste.current?.querySelector('.mm-listenzeile--aktiv')?.scrollIntoView?.({ block: 'nearest' });
  }, [aktiv]);

  const oeffnen = (t: Pick<Treffer, 'titel' | 'typ' | 'pfad'>) => {
    if (q.trim()) setLetzte(merkeSuche(letzte, q));
    setGeoeffnet(merkeGeoeffnet(geoeffnet, t));
    onFertig?.();
    navigate(t.pfad);
  };

  const fragen = () => {
    setLetzte(merkeSuche(letzte, q));
    onFertig?.();
    oeffne('macher', { frage });
  };

  const taste = (e: KeyboardEvent) => {
    if (!anzahl || (e.target as HTMLElement).closest('.mm-listenzeile-aktion, .mm-filter')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktiv((a) => (a + 1) % anzahl);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktiv((a) => (a - 1 + anzahl) % anzahl);
    } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      if (aktiv === frageIndex && frage) fragen();
      else oeffnen(flach[aktiv - versatz]);
    }
  };

  /** Nebenaktion am Treffer: echter Knopf neben der Zeile, per Tab erreichbar */
  const nebenaktion = (t: Treffer) => {
    const a = schnellaktion(bezugAus(t), rechte);
    if (!a) return undefined;
    const label = `${a.label}: ${t.titel}`;
    if (a.href) return <Button variante="tertiaer" klein icon={a.icon} href={a.href} aria-label={label}>{a.label}</Button>;
    if (a.to)
      return (
        <Button variante="tertiaer" klein icon={a.icon} aria-label={label} onClick={() => (onFertig?.(), navigate(a.to!))}>
          {a.label}
        </Button>
      );
    if (a.fenster)
      return (
        <Button variante="tertiaer" klein icon={a.icon} aria-label={label} onClick={() => window.open(appPfad(a.fenster!), '_blank')}>
          {a.label}
        </Button>
      );
    if (a.erfassen) {
      const { aktion, auftragId } = a.erfassen;
      return (
        <Button variante="tertiaer" klein icon={a.icon} aria-label={label} onClick={() => erfassen(aktion, auftragId)}>
          {a.label}
        </Button>
      );
    }
    return undefined;
  };

  const frageZeile = frage && (
    <Liste>
      <ListenZeile titel={`Frag Lotte: „${frage}“`} untertitel="Antwort aus deinen Daten" links={<KiKugel groesse={24} />} aktiv={aktiv === frageIndex} onClick={fragen} />
    </Liste>
  );

  let i = versatz - 1;
  return (
    <div className="mm-stapel" style={{ gap: 16 }} onKeyDown={taste}>
      <Suchfeld ki wert={q} onChange={setQ} platzhalter="Frag Lotte oder such etwas …" autoFocus />
      {!frage ? (
        <OhneSuchbegriff
          rechte={rechte}
          geoeffnet={geoeffnet}
          letzte={letzte}
          oeffnen={oeffnen}
          suchen={setQ}
          leeren={() => (setLetzte([]), setGeoeffnet([]))}
          weiter={(pfad) => (onFertig?.(), navigate(pfad))}
        />
      ) : (
        <div ref={liste} className="mm-stapel" style={{ gap: 16 }} aria-label="Suchergebnisse">
          {alleTreffer.length > 0 && (
            <Zeile zwischen>
              {chips.length > 2 ? <Filter label="Nach Art filtern" optionen={chips} wert={gewaehlt} onChange={setArt} /> : <span />}
              <Button
                variante="tertiaer"
                klein
                icon="filter"
                aria-label={`Sortierung: ${sortierung === 'relevanz' ? 'Relevanz' : 'Neueste zuerst'}. Wechseln`}
                onClick={() => setSortierung((s) => (s === 'relevanz' ? 'neueste' : 'relevanz'))}
              >
                {sortierung === 'relevanz' ? 'Relevanz' : 'Neueste zuerst'}
              </Button>
            </Zeile>
          )}
          {frageOben && frageZeile}
          {gruppen.map((g) => (
            <div key={g.typ} className="mm-stapel" style={{ gap: 8 }}>
              <Oberzeile>{artLabel(g.typ)}</Oberzeile>
              <Liste>
                {g.treffer.map((t) => {
                  i++;
                  const nr = i;
                  return <ListenZeile key={t.pfad} titel={t.titel} untertitel={t.untertitel} aktiv={nr === aktiv} onClick={() => oeffnen(t)} aktion={nebenaktion(t)} />;
                })}
              </Liste>
            </div>
          ))}
          {!flach.length && !istFrage(frage) && <Meta>Zu „{frage}“ gibt es keine Treffer in deinen Daten. Prüfe die Schreibweise oder frag Lotte.</Meta>}
          {!frageOben && frageZeile}
          <Meta>↑ ↓ zum Wählen · Enter zum Öffnen · Tab zu den Aktionen · Esc zum Schließen</Meta>
        </div>
      )}
    </div>
  );
}

/** Ohne Suchbegriff: höchstens drei ruhige Blöcke – häufige Aktionen, zuletzt geöffnet, zuletzt gesucht */
function OhneSuchbegriff({
  rechte,
  geoeffnet,
  letzte,
  oeffnen,
  suchen,
  leeren,
  weiter,
}: {
  rechte: { geld: boolean; schreiben: boolean; zeit: boolean };
  geoeffnet: Geoeffnet[];
  letzte: string[];
  oeffnen: (t: Geoeffnet) => void;
  suchen: (q: string) => void;
  leeren: () => void;
  weiter: (pfad: string) => void;
}) {
  const aktionen = [
    rechte.schreiben && (
      <Button key="auftrag" variante="sekundaer" klein icon="auftraege" onClick={() => weiter('/auftraege/auftraege/neu')}>
        Auftrag anlegen
      </Button>
    ),
    rechte.zeit && (
      <Button key="zeit" variante="sekundaer" klein icon="uhr" onClick={() => erfassen('zeit')}>
        Zeit eintragen
      </Button>
    ),
    rechte.geld && (
      <Button key="rechnung" variante="sekundaer" klein icon="euro" onClick={() => weiter('/start/rechnung')}>
        Rechnung schreiben
      </Button>
    ),
  ].filter(Boolean);
  return (
    <Stapel abstand={24}>
      {aktionen.length > 0 && (
        <Stapel abstand={8}>
          <Oberzeile>Häufig</Oberzeile>
          <Zeile>{aktionen}</Zeile>
        </Stapel>
      )}
      {geoeffnet.length > 0 && (
        <Stapel abstand={8}>
          <Zeile zwischen>
            <Oberzeile>Zuletzt geöffnet</Oberzeile>
            <Button variante="tertiaer" klein onClick={leeren}>
              Verlauf leeren
            </Button>
          </Zeile>
          <Liste>
            {geoeffnet.map((g) => (
              <ListenZeile key={g.pfad} titel={g.titel} untertitel={g.typ} links={<Icon name="uhr" />} onClick={() => oeffnen(g)} />
            ))}
          </Liste>
        </Stapel>
      )}
      {letzte.length > 0 && (
        <Stapel abstand={8}>
          <Zeile zwischen>
            <Oberzeile>Zuletzt gesucht</Oberzeile>
            {!geoeffnet.length && (
              <Button variante="tertiaer" klein onClick={leeren}>
                Verlauf leeren
              </Button>
            )}
          </Zeile>
          <Liste>
            {letzte.slice(0, 4).map((l) => (
              <ListenZeile key={l} titel={l} links={<Icon name="suche" />} onClick={() => suchen(l)} />
            ))}
          </Liste>
        </Stapel>
      )}
      {!geoeffnet.length && !letzte.length && (
        <Leer
          skizze
          icon="suche"
          titel="Was suchst du?"
          text="Tippe einen Namen, eine Auftrags- oder Rechnungsnummer, einen Ort oder ein Stichwort. Oder stell Lotte eine Frage, zum Beispiel „Welche Rechnungen sind offen?“."
        />
      )}
    </Stapel>
  );
}
