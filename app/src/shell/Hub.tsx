/** Bereichsseite: Widgets der Module (nach Pain-Gewicht), darunter weitere Module als Einstieg. */
import { BEREICHE, BETRIEB_GRUPPEN, modulPfad, moduleIn, type Bereich } from '@core/modul';
import { useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { Abschnitt, Icon, Leer, Raster, Seite, Status } from '@ui/index';
import { Link } from 'react-router-dom';

const UNTERTITEL: Record<string, string> = {
  heute: 'Was jetzt wichtig ist.',
  auftraege: 'Vom ersten Anruf bis zur bezahlten Rechnung.',
  plan: 'Wer macht was, wann und wo.',
  betrieb: 'Alles, was dein Betrieb dauerhaft braucht.',
};

export function Hub({ bereich }: { bereich: Exclude<Bereich, 'macher'> }) {
  useDatenstand();
  const ich = useIch();
  const sichtbar = moduleIn(bereich).filter((m) => !m.rollen || !ich || m.rollen.includes(ich.rolle));
  const widgets = sichtbar.filter((m) => m.hubWidget);
  const titel = BEREICHE.find((b) => b.id === bereich)!.titel;
  // Module mit eigenem Widget brauchen keine zusätzliche Kachel (keine doppelte Information)
  const links = sichtbar.filter((m) => m.routen?.length && m.navigation !== 'versteckt' && !m.hubWidget);

  return (
    <Seite titel={titel} untertitel={UNTERTITEL[bereich]} breit>
      {widgets.map((m) => {
        const W = m.hubWidget!;
        return <W key={m.id} />;
      })}
      {bereich === 'betrieb' ? (
        BETRIEB_GRUPPEN.map((g) => {
          const ms = links.filter((m) => m.gruppe === g.id);
          if (!ms.length) return null;
          return (
            <Abschnitt key={g.id} titel={g.titel}>
              <ModulKacheln module={ms} />
            </Abschnitt>
          );
        })
      ) : links.length ? (
        <Abschnitt titel={widgets.length ? 'Mehr in diesem Bereich' : undefined}>
          <ModulKacheln module={links} />
        </Abschnitt>
      ) : null}
      {!widgets.length && !links.length && <Leer titel="Hier entsteht gerade etwas" text="Die Module für diesen Bereich werden eingerichtet." />}
    </Seite>
  );
}

function ModulKacheln({ module }: { module: ReturnType<typeof moduleIn> }) {
  return (
    <Raster min={240}>
      {module.map((m) => {
        const info = m.kurzinfo?.();
        return (
          <Link key={m.id} to={modulPfad(m)} className="mm-karte mm-karte--kompakt mm-karte--klickbar mm-modulkachel">
            <span className="mm-modulkachel-icon">
              <Icon name={m.icon ?? 'info'} />
            </span>
            <span className="mm-modulkachel-text">
              <strong>{m.titel}</strong>
              {info ? <Status ton={info.ton ?? 'neutral'}>{info.text}</Status> : <span className="mm-meta">{m.beschreibung}</span>}
            </span>
          </Link>
        );
      })}
    </Raster>
  );
}
