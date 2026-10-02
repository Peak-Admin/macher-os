import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { sucheUeberall } from '@core/modul';
import { oeffne } from '@core/overlay';
import { useIch } from '@core/session';
import { Button, Icon, Leer, Liste, ListenZeile, Meta, Oberzeile, Suchfeld, Zeile } from '@ui/index';
import { gruppieren, merkeSuche, ohneDoppelte } from './daten';

/** Suchfeld + gruppierte Treffer mit Pfeiltasten/Enter. Im Overlay und auf der Seite gleich. */
export function SuchKern({ onFertig }: { onFertig?: () => void }) {
  useDatenstand();
  const ich = useIch();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [aktiv, setAktiv] = useState(0);
  const [letzte, setLetzte] = useEinstellung<string[]>(`suche.letzte.${ich?.id ?? 'alle'}`, []);
  const liste = useRef<HTMLDivElement>(null);

  const gruppen = useMemo(() => gruppieren(ohneDoppelte(sucheUeberall(q))), [q]);
  const flach = gruppen.flatMap((g) => g.treffer);

  useEffect(() => setAktiv(0), [q]);
  useEffect(() => {
    liste.current?.querySelector('.mm-listenzeile--aktiv')?.scrollIntoView?.({ block: 'nearest' });
  }, [aktiv]);

  const oeffnen = (pfad: string) => {
    setLetzte(merkeSuche(letzte, q));
    onFertig?.();
    navigate(pfad);
  };

  const taste = (e: KeyboardEvent) => {
    if (!flach.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktiv((a) => (a + 1) % flach.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktiv((a) => (a - 1 + flach.length) % flach.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      oeffnen(flach[aktiv].pfad);
    }
  };

  let i = -1;
  return (
    <div className="mm-stapel" style={{ gap: 16 }} onKeyDown={taste}>
      <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Auftrag, Rechnungsnummer, Adresse …" autoFocus />
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
          <Leer icon="suche" titel="Was suchst du?" text="Tippe einen Namen, eine Auftrags- oder Rechnungsnummer, einen Ort oder ein Stichwort. Mit den Pfeiltasten wählst du, mit Enter öffnest du." />
        )
      ) : flach.length ? (
        <div ref={liste} className="mm-stapel" style={{ gap: 16 }} aria-label="Suchergebnisse">
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
          <Meta>↑ ↓ zum Wählen · Enter zum Öffnen · Esc zum Schließen</Meta>
        </div>
      ) : (
        <Leer
          icon="suche"
          titel="Keine Treffer"
          text={`Zu „${q}“ gibt es nichts. Prüfe die Schreibweise oder frag Macher.`}
          aktion={
            <Button variante="sekundaer" icon="macher" onClick={() => (onFertig?.(), oeffne('macher', { frage: q }))}>
              Macher fragen
            </Button>
          }
        />
      )}
    </div>
  );
}
