/**
 * Bereichsseite: Widgets der Module (nach Pain-Gewicht), darunter die übrigen Module als geordnete Listen –
 * keine Kachelwand. Einträge, die Aufmerksamkeit brauchen, stehen in ihrer Gruppe oben.
 * „Heute“ bekommt einen kompakten dunklen Markenbereich als persönlichen Einstieg (Playbook 11 A).
 */
import { BEREICHE, BETRIEB_GRUPPEN, modulPfad, moduleIn, type Bereich, type ModulDef } from '@core/modul';
import { useDatenstand } from '@core/db';
import { oeffne } from '@core/overlay';
import { useIch } from '@core/session';
import { Abschnitt, Button, Icon, Leer, Seite, Status } from '@ui/index';
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
  // Module mit eigenem Widget brauchen keinen zusätzlichen Eintrag (keine doppelte Information)
  const links = sichtbar.filter((m) => m.routen?.length && m.navigation !== 'versteckt' && !m.hubWidget);

  const inhalt = (
    <>
      {widgets.map((m) => {
        const W = m.hubWidget!;
        return <W key={m.id} />;
      })}
      {bereich === 'betrieb' ? (
        <div className="mm-hub-gruppen">
          {BETRIEB_GRUPPEN.map((g) => {
            const ms = links.filter((m) => m.gruppe === g.id);
            if (!ms.length) return null;
            return (
              <section key={g.id} className="mm-hub-gruppe" aria-labelledby={`gruppe-${g.id}`}>
                <h2 id={`gruppe-${g.id}`} className="mm-hub-gruppe-titel">
                  {g.titel}
                </h2>
                <ModulListe module={ms} />
              </section>
            );
          })}
        </div>
      ) : links.length ? (
        <Abschnitt titel={widgets.length ? 'Mehr in diesem Bereich' : undefined}>
          <ZweiListen module={links} />
        </Abschnitt>
      ) : null}
      {!widgets.length && !links.length && <Leer titel="Hier entsteht gerade etwas" text="Die Module für diesen Bereich werden eingerichtet." />}
    </>
  );

  if (bereich === 'heute') {
    return (
      <div className="mm-seite mm-seite--breit">
        <Einstieg vorname={ich?.vorname} />
        {inhalt}
      </div>
    );
  }
  return (
    <Seite titel={titel} untertitel={UNTERTITEL[bereich]} breit>
      {inhalt}
    </Seite>
  );
}

const tagFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function gruss(stunde = new Date().getHours()) {
  if (stunde < 11) return 'Guten Morgen';
  if (stunde < 17) return 'Hallo';
  return 'Guten Abend';
}

/** Persönlicher Einstieg: dunkle Markenfläche, Titel, eine Hauptaktion */
function Einstieg({ vorname }: { vorname?: string }) {
  return (
    <header className="mm-einstieg">
      <div className="mm-einstieg-text">
        <p className="mm-einstieg-oberzeile">{tagFormat.format(new Date())}</p>
        <h1>Heute</h1>
        <p className="mm-einstieg-gruss">
          {gruss()}
          {vorname ? `, ${vorname}` : ''}. {UNTERTITEL.heute}
        </p>
      </div>
      <Button className="mm-einstieg-aktion" icon="kamera" onClick={() => oeffne('schnell')}>
        Schnell erfassen
      </Button>
    </header>
  );
}

const prioritaet = (m: ModulDef) => {
  const t = m.kurzinfo?.()?.ton;
  return t === 'achtung' ? 0 : t === 'aktiv' ? 1 : 2;
};

/** Ohne feste Gruppen: zwei ruhige Listen nebeneinander, Aufmerksamkeit zuerst */
function ZweiListen({ module }: { module: ModulDef[] }) {
  const sortiert = [...module].sort((a, b) => prioritaet(a) - prioritaet(b));
  if (sortiert.length < 6) return <ModulListe module={sortiert} sortiert />;
  const haelfte = Math.ceil(sortiert.length / 2);
  return (
    <div className="mm-hub-gruppen">
      <ModulListe module={sortiert.slice(0, haelfte)} sortiert />
      <ModulListe module={sortiert.slice(haelfte)} sortiert />
    </div>
  );
}

function ModulListe({ module, sortiert }: { module: ModulDef[]; sortiert?: boolean }) {
  const liste = sortiert ? module : [...module].sort((a, b) => prioritaet(a) - prioritaet(b));
  return (
    <ul className="mm-liste">
      {liste.map((m) => {
        const info = m.kurzinfo?.();
        return (
          <li key={m.id}>
            <Link to={modulPfad(m)} className="mm-listenzeile mm-listenzeile--klickbar mm-modulzeile">
              <span className="mm-modulzeile-icon" aria-hidden>
                <Icon name={m.icon ?? 'info'} size={20} />
              </span>
              <span className="mm-listenzeile-text">
                <span className="mm-listenzeile-titel">{m.titel}</span>
                {!info && <span className="mm-meta">{m.beschreibung}</span>}
              </span>
              {info && (
                <span className="mm-modulzeile-status">
                  <Status ton={info.ton ?? 'neutral'}>{info.text}</Status>
                </span>
              )}
              <Icon name="weiter" size={16} className="mm-modulzeile-pfeil" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
