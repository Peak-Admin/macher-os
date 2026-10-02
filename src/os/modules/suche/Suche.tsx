import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { sucheUeberall } from '@core/modul';
import { oeffne } from '@core/overlay';
import { useIch } from '@core/session';
import { Button, Icon, Leer, Liste, ListenZeile, Meta, Oberzeile, Suchfeld, Zeile } from '@ui/index';
import { gruppieren, merkeSuche, ohneDoppelte } from './daten';
import { funktionsTreffer } from '../../shell/struktur';

/** Klingt die Eingabe nach einer Frage? Dann steht „Macher fragen“ ganz oben statt am Ende. */
export function istFrage(q: string) {
  const t = q.trim().toLowerCase();
  return t.endsWith('?') || /^(wer|wie|was|wann|wo|wieso|warum|welche[rsmn]?|gibt|zeig|erstell|leg|plan|schreib)\b/.test(t) || t.split(/\s+/).length >= 5;
}

/**
 * Suchen oder fragen: Suchfeld + gruppierte Treffer, dazu immer eine Zeile „Macher fragen“.
 * Pfeiltasten/Enter wählen beides. Im Overlay und auf der Seite gleich.
 */
export function SuchKern({ onFertig }: { onFertig?: () => void }) {
  useDatenstand();
  const ich = useIch();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [aktiv, setAktiv] = useState(0);
  const [letzte, setLetzte] = useEinstellung<string[]>(`suche.letzte.${ich?.id ?? 'alle'}`, []);
  const liste = useRef<HTMLDivElement>(null);

  const gruppen = useMemo(() => gruppieren(ohneDoppelte([...sucheUeberall(q), ...funktionsTreffer(q, ich)])), [q, ich]);
  const flach = gruppen.flatMap((g) => g.treffer);
  const frage = q.trim();
  const frageOben = !!frage && (istFrage(frage) || !flach.length);
  const anzahl = flach.length + (frage ? 1 : 0);
  const frageIndex = frageOben ? 0 : flach.length;
  const versatz = frageOben ? 1 : 0;

  useEffect(() => setAktiv(0), [q]);
  useEffect(() => {
    liste.current?.querySelector('.mm-listenzeile--aktiv')?.scrollIntoView?.({ block: 'nearest' });
  }, [aktiv]);

  const oeffnen = (pfad: string) => {
    setLetzte(merkeSuche(letzte, q));
    onFertig?.();
    navigate(pfad);
  };

  const fragen = () => {
    setLetzte(merkeSuche(letzte, q));
    onFertig?.();
    oeffne('macher', { frage });
  };

  const taste = (e: KeyboardEvent) => {
    if (!anzahl) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktiv((a) => (a + 1) % anzahl);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktiv((a) => (a - 1 + anzahl) % anzahl);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aktiv === frageIndex && frage) fragen();
      else oeffnen(flach[aktiv - versatz].pfad);
    }
  };

  const frageZeile = frage && (
    <Liste>
      <ListenZeile titel={`Macher fragen: „${frage}“`} untertitel="Antwort aus deinen Daten" links={<Icon name="macher" />} aktiv={aktiv === frageIndex} onClick={fragen} />
    </Liste>
  );

  let i = versatz - 1;
  return (
    <div className="mm-stapel" style={{ gap: 16 }} onKeyDown={taste}>
      <Suchfeld wert={q} onChange={setQ} platzhalter="Suchen oder Macher fragen …" autoFocus />
      {!q.trim() ? (
        letzte.length ? (
          <div className="mm-stapel" style={{ gap: 8 }}>
            <Zeile zwischen>
              <Oberzeile>Zuletzt gesucht</Oberzeile>
              <Button variante="tertiaer" klein onClick={() => setLetzte([])}>
                Liste leeren
              </Button>
            </Zeile>
            <Liste>
              {letzte.map((l) => (
                <ListenZeile key={l} titel={l} links={<Icon name="uhr" />} onClick={() => setQ(l)} />
              ))}
            </Liste>
          </div>
        ) : (
          <Leer skizze icon="suche" titel="Was suchst du?" text="Tippe einen Namen, eine Auftrags- oder Rechnungsnummer, einen Ort oder ein Stichwort. Oder stell Macher eine Frage, zum Beispiel „Welche Rechnungen sind offen?“. Mit den Pfeiltasten wählst du, mit Enter öffnest du." />
        )
      ) : (
        <div ref={liste} className="mm-stapel" style={{ gap: 16 }} aria-label="Suchergebnisse">
          {frageOben && frageZeile}
          {gruppen.map((g) => (
            <div key={g.typ} className="mm-stapel" style={{ gap: 8 }}>
              <Oberzeile>{g.typ}</Oberzeile>
              <Liste>
                {g.treffer.map((t) => {
                  i++;
                  const nr = i;
                  return <ListenZeile key={t.pfad} titel={t.titel} untertitel={t.untertitel} aktiv={nr === aktiv} onClick={() => oeffnen(t.pfad)} />;
                })}
              </Liste>
            </div>
          ))}
          {!flach.length && !istFrage(frage) && <Meta>Zu „{frage}“ gibt es keine Treffer in deinen Daten. Prüfe die Schreibweise oder frag Macher.</Meta>}
          {!frageOben && frageZeile}
          <Meta>↑ ↓ zum Wählen · Enter zum Öffnen · Esc zum Schließen</Meta>
        </div>
      )}
    </div>
  );
}
