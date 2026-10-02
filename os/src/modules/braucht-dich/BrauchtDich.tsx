import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { hinweisAusblenden, hinweisErledigen, offeneHinweise, type OffenerHinweis } from '@core/macher';
import { aktionAusfuehren, pfadZu, type Ton } from '@core/modul';
import { relativ } from '@core/format';
import { istBuero, useIch } from '@core/session';
import { Abschnitt, Button, Filter, Leer, Liste, Meldung, Meta, Seite, Stapel, Status, useToast } from '@ui/index';
import { aktionVorhanden } from '@core/modul';
import { ART_LABEL, type HinweisArt, nachArt, sichtbareAktionen } from './logik';

const ART_TON: Record<HinweisArt, Ton> = { problem: 'achtung', entscheidung: 'aktiv', freigabe: 'aktiv', info: 'neutral' };
const WIDGET_MAX = 5;

function useMeineHinweise(team = false) {
  useDatenstand();
  const ich = useIch();
  if (!ich) return [];
  return team && istBuero(ich) ? offeneHinweise() : offeneHinweise({ rolle: ich.rolle, mitarbeiterId: ich.id });
}

/** Ein Hinweis mit seinen Aktionen: primäre Aktion, Öffnen, Später/Erledigt */
export function HinweisZeile({ h, kompakt }: { h: OffenerHinweis; kompakt?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();
  const pfad = h.pfad ?? pfadZu(h.bezug);
  // Vorschau auf „Heute“: nur die empfohlene Handlung und „Öffnen“
  const aktionen = sichtbareAktionen(h, aktionVorhanden).slice(0, kompakt ? 1 : undefined);
  const faellig = h.faellig ? `fällig ${relativ(h.faellig)}` : null;

  const ausfuehren = (a: (typeof aktionen)[number]) => {
    try {
      const ziel = aktionAusfuehren(a.aktion, a.payload);
      if (h.hinweisId) hinweisErledigen(h.hinweisId);
      toast(`Erledigt: ${a.label}.`);
      if (ziel) navigate(ziel);
    } catch {
      toast('Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
    }
  };

  const weitere = h.weitere ?? [];
  return (
    <li className={`mm-hinweis mm-hinweis--${ART_TON[h.art]}`}>
      <div className="mm-hinweis-kopf">
        <div className="mm-hinweis-text">
          <span className="mm-hinweis-titel">{h.titel}</span>
          {(h.text || faellig) && <span className="mm-meta">{[h.text, faellig].filter(Boolean).join(' · ')}</span>}
        </div>
        <Status ton={ART_TON[h.art]}>{ART_LABEL[h.art]}</Status>
      </div>
      {weitere.length > 0 && !kompakt && <Weitere liste={weitere} />}
      <div className="mm-hinweis-aktionen">
        {aktionen.map((a, i) => (
          <Button key={a.aktion + i} klein variante={i === 0 ? 'primaer' : 'sekundaer'} onClick={() => ausfuehren(a)}>
            {a.label}
          </Button>
        ))}
        {pfad && (
          <Button klein variante={aktionen.length ? 'tertiaer' : 'sekundaer'} to={pfad} icon="pfeilRechts">
            Öffnen
          </Button>
        )}
        {kompakt ? null : h.hinweisId ? (
          <Button
            klein
            variante="tertiaer"
            icon="check"
            onClick={() => {
              hinweisErledigen(h.hinweisId!);
              toast('Als erledigt markiert.');
            }}
          >
            Erledigt
          </Button>
        ) : (
          <Button
            klein
            variante="tertiaer"
            icon="uhr"
            onClick={() => {
              hinweisAusblenden(h.schluessel, 1);
              toast('Ausgeblendet bis morgen.');
            }}
          >
            Morgen erinnern
          </Button>
        )}
      </div>
    </li>
  );
}

/** Gebündelte Hinweise zum selben Objekt: „+N weitere“ zum Aufklappen */
function Weitere({ liste }: { liste: OffenerHinweis[] }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <button type="button" className="mm-hinweis-weitere-knopf" aria-expanded={offen} onClick={() => setOffen(!offen)}>
        {offen ? 'Weniger zeigen' : `+${liste.length} ${liste.length === 1 ? 'weiterer Punkt' : 'weitere Punkte'} dazu`}
      </button>
      {offen && (
        <ul className="mm-hinweis-weitere">
          {liste.map((w) => (
            <li key={w.schluessel}>
              <strong>{w.titel}</strong>
              {w.text && <span className="mm-meta"> · {w.text}</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Hub-Widget: nur die wichtigsten Ausnahmen, ganz oben auf „Heute“. */
export function BrauchtDichWidget() {
  const liste = useMeineHinweise();
  return (
    <Abschnitt
      titel={liste.length ? `Braucht dich (${liste.length})` : 'Braucht dich'}
      aktion={
        liste.length > WIDGET_MAX ? (
          <Button variante="tertiaer" klein to="/heute/braucht-dich" icon="pfeilRechts">
            Alle {liste.length} ansehen
          </Button>
        ) : undefined
      }
    >
      {liste.length ? (
        <Liste>
          {liste.slice(0, WIDGET_MAX).map((h) => (
            <HinweisZeile key={h.schluessel} h={h} />
          ))}
        </Liste>
      ) : (
        <Meldung ton="erfolg" titel="Nichts brennt.">
          Macher meldet sich hier, sobald etwas deine Entscheidung braucht.
        </Meldung>
      )}
    </Abschnitt>
  );
}

/** Ganze Liste mit Filter nach Art; Chef/Büro können aufs ganze Team umschalten. */
export function BrauchtDichSeite() {
  const ich = useIch();
  const [team, setTeam] = useState(false);
  const [art, setArt] = useState<HinweisArt | 'alle'>('alle');
  const liste = useMeineHinweise(team);
  const gruppen = nachArt(liste);
  const gefiltert = art === 'alle' ? liste : gruppen[art];
  const buero = istBuero(ich);

  return (
    <Seite titel="Braucht dich" untertitel="Nur Probleme, Fristen und Entscheidungen. Routine erledigt Macher selbst.">
      <Stapel abstand={12}>
        {buero && (
          <Filter
            label="Für wen"
            wert={team ? 'team' : 'ich'}
            onChange={(v) => setTeam(v === 'team')}
            optionen={[
              { wert: 'ich', label: 'Für mich' },
              { wert: 'team', label: 'Ganzes Team' },
            ]}
          />
        )}
        <Filter
          label="Art"
          wert={art}
          onChange={setArt}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: liste.length },
            ...(Object.keys(ART_LABEL) as HinweisArt[]).filter((a) => gruppen[a].length).map((a) => ({ wert: a, label: ART_LABEL[a], zaehler: gruppen[a].length })),
          ]}
        />
      </Stapel>
      {team && <Meta>Du siehst auch Hinweise, die an einzelne Mitarbeiter gehen.</Meta>}
      <Meta>
        Auch hier: <Link to="/macher/hinweise">Freigaben & alle Hinweise</Link> · <Link to="/heute/erledigt">Was Macher schon erledigt hat</Link>
      </Meta>
      <Liste
        leer={
          art === 'alle' ? (
            <Leer icon="check" titel="Nichts brennt" text="Gerade braucht nichts deine Entscheidung. Macher meldet sich, sobald sich das ändert." />
          ) : (
            <Leer icon="filter" titel="Keine Treffer" text="Zu diesem Filter gibt es nichts. Passe die Auswahl an." aktion={<Button variante="sekundaer" onClick={() => setArt('alle')}>Alle zeigen</Button>} />
          )
        }
      >
        {gefiltert.map((h) => (
          <HinweisZeile key={h.schluessel} h={h} />
        ))}
      </Liste>
    </Seite>
  );
}
