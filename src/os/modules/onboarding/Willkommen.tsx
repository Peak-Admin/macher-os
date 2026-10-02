import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { aktiverBetrieb, leerenBetriebVerwerfen, useBetriebe } from '@core/betriebe';
import { cloud, cloudAktiv } from '@core/cloud';
import { db, type Neu } from '@core/db';
import { GEWERKE } from '@core/gewerke';
import type { Gewerk, Kunde } from '@core/objects';
import { hatGesicherteDaten, istSpielwiese, spielwieseStarten, spielwieseVerlassen } from '@core/seed';
import { Button, Fortschritt, Icon, Meldung, Meta, Oberzeile, Stapel, useBestaetigen, type IconName } from '@ui/index';
import {
  briefkopfLuecken,
  briefkopfPruefen,
  LEERER_BRIEFKOPF,
  SCHRITTE,
  setupEinrichten,
  setupFertig,
  setupGestartet,
  setupSchritt,
  teamEinladen,
  zielNachSetup,
  type BriefkopfEntwurf,
  type KundenImport,
  type Preise,
  type TeamEintrag,
} from './daten';
import { SchrittBetrieb, SchrittKonto, SchrittKundenPreise, SchrittTeam, type KontoStand } from './Schritte';
import './onboarding.css';

/** Vollbild `/willkommen`: Setup in höchstens 5 Schritten – eine Frage je Bildschirm. */
export function Willkommen() {
  const betrieb = db.betrieb.useOne('betrieb');
  const [params] = useSearchParams();
  const [neu, setNeu] = useState(false);
  const spielwiese = istSpielwiese();
  const einladung = params.get('einladung');
  if (einladung && !betrieb?.onboardingFertig) return <Rahmen><Einladung betrieb={params.get('betrieb') ?? ''} /></Rahmen>;
  if (spielwiese && !neu) return <Rahmen><AufDerSpielwiese onNeu={() => setNeu(true)} /></Rahmen>;
  if (betrieb?.onboardingFertig && !spielwiese && !neu) return <Rahmen><SchonEingerichtet onNeu={() => setNeu(true)} /></Rahmen>;
  return (
    <Rahmen vorteile>
      <Ablauf />
    </Rahmen>
  );
}

/** Was beim Start zählt – steht bei der Anmeldung (`/signup`) im Markenkopf. */
const VORTEILE = ['Keine Kündigung notwendig', 'Keine versteckten Kosten', 'Alle Funktionen ab Tag 1 freigeschaltet', 'Sofort startklar – ohne Installation, ohne Setup'];

function Rahmen({ children, vorteile }: { children: ReactNode; vorteile?: boolean }) {
  return (
    <div className="ob-rahmen">
      <header className={`ob-marke${vorteile ? ' ob-marke--vorteile' : ''}`}>
        <div className="ob-marke-innen">
          {vorteile && <HandwerkerFoto />}
          <div className="ob-logo">
            <span className="mm-logo-zeichen" aria-hidden>
              M
            </span>
            <span>
              Macher <strong>OS</strong>
            </span>
          </div>
          <p className="ob-marke-statement">Dein Betrieb. Klar geführt.</p>
          {vorteile && (
            <ul className="ob-vorteile">
              {VORTEILE.map((v) => (
                <li key={v}>
                  <span className="ob-vorteil-haken" aria-hidden="true">
                    <Icon name="check" size={14} strokeWidth={2.5} />
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          )}
          <ZurueckZumBetrieb />
        </div>
      </header>
      <main className="ob-inhalt" id="inhalt">
        {children}
      </main>
    </div>
  );
}

/** Neuer Betrieb über den Wechsler angelegt, Setup noch offen: zurück zum vorigen Betrieb, der leere wird verworfen */
function ZurueckZumBetrieb() {
  const betrieb = db.betrieb.useOne('betrieb');
  const alle = useBetriebe();
  const hier = aktiverBetrieb();
  const ziel = alle.find((b) => b.id !== hier && b.eingerichtet);
  if (betrieb?.onboardingFertig || !ziel || alle.find((b) => b.id === hier)?.eingerichtet) return null;
  return (
    <button
      type="button"
      className="ob-zurueck-betrieb"
      onClick={() => {
        leerenBetriebVerwerfen(hier, ziel.id);
        window.location.assign(appPfad('/heute'));
      }}
    >
      <Icon name="zurueck" size={18} /> Zurück zu {ziel.name}
    </button>
  );
}

export interface AblaufStand {
  gewerk?: Gewerk;
  briefkopf: BriefkopfEntwurf;
  /** woher der Briefkopf stammt – für die Messung */
  briefkopfQuelle: 'hand' | 'foto' | 'website';
  /** KI-Entwurf liegt vor und ist noch nicht bestätigt */
  entwurf: boolean;
  kunden: Neu<Kunde>[];
  kundenInfo?: Omit<KundenImport, 'kunden'> & { quelle: string };
  preise: Preise;
  team: TeamEintrag[];
}

function Ablauf() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [schritt, setSchritt] = useState(0);
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const [konto, setKonto] = useState<KontoStand>({ art: cloudAktiv() ? 'offen' : 'lokal' });
  const start = useRef(0);
  const [s, setS] = useState<AblaufStand>(() => {
    // Von der Website („Kostenlos testen“) kommen Gewerk und Betriebsname mit: ?gewerk=elektro&betrieb=…
    const g = GEWERKE.find((x) => x.id === params.get('gewerk'));
    return {
      gewerk: g?.id,
      briefkopf: { ...LEERER_BRIEFKOPF, name: params.get('betrieb') ?? '' },
      briefkopfQuelle: 'hand',
      entwurf: false,
      kunden: [],
      preise: { art: 'vorlage', prozent: 0 },
      team: [],
    };
  });
  const set = (patch: Partial<AblaufStand>) => (setS((alt) => ({ ...alt, ...patch })), setFehler(undefined));

  useEffect(() => {
    start.current = setupGestartet(params.get('gewerk') ? 'website' : 'direkt');
  }, [params]);

  const pruefen = (): string | undefined => {
    switch (SCHRITTE[schritt].id) {
      case 'gewerk':
        return s.gewerk ? undefined : 'Wähle dein Gewerk.';
      case 'betrieb':
        return briefkopfPruefen(s.briefkopf);
      case 'kunden':
        if (s.preise.art === 'eigen' && !s.preise.liste.some((l) => l.an)) return 'Wähle mindestens eine Leistung aus deiner Preisliste – oder nimm die Vorlage.';
        return undefined;
      default:
        return undefined;
    }
  };

  const geheZu = (n: number) => {
    setSchritt(n);
    setFehler(undefined);
    window.scrollTo?.({ top: 0 });
  };

  const weiter = (gewerk?: Gewerk) => {
    const f = gewerk ? undefined : pruefen();
    if (f) return setFehler(f);
    if (SCHRITTE[schritt].id === 'betrieb') set({ entwurf: false });
    setupSchritt(start.current, schritt);
    if (schritt < SCHRITTE.length - 1) return geheZu(schritt + 1);
    void abschliessen();
  };

  const abschliessen = async () => {
    setLaedt(true);
    // kurz rendern lassen, damit „Wird eingerichtet …“ sichtbar ist
    await new Promise((r) => setTimeout(r, 30));
    try {
      const e = setupEinrichten({ gewerk: s.gewerk!, briefkopf: s.briefkopf, kunden: s.kunden, preise: s.preise, team: s.team });
      await teamEinladen(s.team).catch(() => undefined);
      setupFertig(start.current, {
        ...e,
        konto: konto.art === 'gesichert' ? 'gesichert' : konto.art === 'lokal' ? 'lokal' : 'offen',
        briefkopfQuelle: s.briefkopfQuelle,
        preise: s.preise.art === 'eigen' ? 'eigen' : s.preise.prozent ? 'vorlage-angepasst' : 'vorlage',
      });
      navigate(zielNachSetup(), { replace: true, state: { setup: 'fertig' } });
    } catch (err) {
      console.error(err);
      setFehler('Dein Betrieb wurde noch nicht eingerichtet. Versuche es erneut.');
      setLaedt(false);
    }
  };

  const umsehen = async () => {
    try {
      await spielwieseStarten(s.gewerk ?? 'elektro');
      navigate('/heute');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Spielwiese konnte nicht geöffnet werden.');
    }
  };

  const id = SCHRITTE[schritt].id;
  const letzter = schritt === SCHRITTE.length - 1;
  const hauptLabel =
    id === 'betrieb' && s.entwurf
      ? 'Briefkopf übernehmen'
      : id === 'kunden' && !s.kunden.length && s.preise.art === 'vorlage' && !s.preise.prozent
        ? 'Weiter mit Vorlage'
        : id === 'team' && !s.team.length
          ? 'Erst mal ohne Team'
          : letzter
            ? 'Fertig – los geht’s'
            : 'Weiter';

  return (
    <div className="ob-ablauf">
      <Stapel abstand={8}>
        <Oberzeile>
          Schritt {schritt + 1} von {SCHRITTE.length} · {SCHRITTE[schritt].titel}
        </Oberzeile>
        <Fortschritt wert={schritt + 1} max={SCHRITTE.length} label="Fortschritt der Einrichtung" />
      </Stapel>

      {id === 'gewerk' && (
        <Frage titel="Was macht ihr?" text="Dein Gewerk bestimmt Leistungen, Preise, Material und Begriffe. Alles lässt sich später ändern.">
          <GewerkKarten
            wert={s.gewerk}
            onChange={(g) => {
              set({ gewerk: g });
              // ein Tipp genügt
              setupSchritt(start.current, 0);
              geheZu(1);
            }}
          />
        </Frage>
      )}

      {id === 'betrieb' && (
        <Frage titel="Dein Briefkopf" text="Mach ein Foto von einer alten Rechnung oder gib deine Website an – Macher liest alles aus. Du prüfst nur.">
          <SchrittBetrieb stand={s} set={set} />
        </Frage>
      )}

      {id === 'kunden' && s.gewerk && (
        <Frage titel="Kunden und Preise übernehmen" text="Bring mit, was du schon hast. Doppelte Kunden führt Macher zusammen. Du kannst das auch später machen.">
          <SchrittKundenPreise stand={s} set={set} gewerk={s.gewerk} />
        </Frage>
      )}

      {id === 'team' && (
        <Frage titel="Wer arbeitet mit dir?" text="Name und Handynummer reichen. Deine Leute brauchen kein Passwort und keine eigene Einrichtung.">
          <SchrittTeam stand={s} set={set} />
        </Frage>
      )}

      {id === 'konto' && (
        <Frage titel="Konto sichern" text={cloudAktiv() ? 'Mit deiner E-Mail oder Handynummer kommst du jederzeit wieder rein – ohne Passwort.' : 'Damit nichts verloren geht und dein Team mitarbeiten kann.'}>
          <SchrittKonto konto={konto} setKonto={setKonto} />
        </Frage>
      )}

      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}

      {id !== 'gewerk' && (
        <div className="ob-navigation">
          <Button variante="tertiaer" icon="zurueck" onClick={() => geheZu(schritt - 1)} disabled={laedt}>
            Zurück
          </Button>
          <WeiterButton icon={letzter ? 'check' : 'pfeil'} onClick={() => weiter()} laedt={laedt || (id === 'konto' && konto.art === 'laedt')} laedtText={laedt ? 'Dein Betrieb wird eingerichtet …' : 'Einen Moment …'}>
            {hauptLabel}
          </WeiterButton>
        </div>
      )}

      {id === 'gewerk' && (
        <div className="ob-schnell">
          <Meta>Erst mal nur umsehen? Die Spielwiese zeigt einen Beispielbetrieb – getrennt von deinen echten Daten.</Meta>
          <Button variante="tertiaer" onClick={umsehen}>
            Spielwiese öffnen
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Fotos aus dem Bildregister der Website (`public/bilder/gewerke/…`, Nachweise in `src/content/bilder.ts`).
 * Fehlt ein Foto, bleibt eine Markenfläche mit Pfeilmotiv stehen.
 */
const GEWERK_BILD: Record<Gewerk, { datei: string; position?: string }> = {
  elektro: { datei: 'elektriker' },
  shk: { datei: 'shk', position: 'center 40%' },
  maler: { datei: 'maler', position: 'center 70%' },
  dach: { datei: 'dachdecker' },
  tischler: { datei: 'tischler' },
  fliesen: { datei: 'fliesenleger', position: 'center 35%' },
  garten: { datei: 'galabau', position: 'center 30%' },
  metall: { datei: 'metall-maschinen' },
  bau: { datei: 'bau', position: 'center 25%' },
  sonstiges: { datei: 'weitere-gewerke' },
};

function GewerkKarten({ wert, onChange }: { wert?: Gewerk; onChange: (g: Gewerk) => void }) {
  return (
    <div className="ob-gewerke" role="radiogroup" aria-label="Gewerk">
      {GEWERKE.map((g) => {
        const an = wert === g.id;
        return (
          <button key={g.id} type="button" role="radio" aria-checked={an} className={`ob-gewerk${an ? ' ob-gewerk--an' : ''}`} onClick={() => onChange(g.id)}>
            <GewerkFoto gewerk={g.id} />
            {an && (
              <span className="ob-gewerk-haken" aria-hidden="true">
                <Icon name="check" size={16} />
              </span>
            )}
            <span className="ob-gewerk-text">
              <strong>{g.label}</strong>
              <span className="mm-meta">{g.leistungen.slice(1, 4).map((l) => l.name).join(', ')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Verkleinerte Fassung über die Bildoptimierung von Next.js – die Originale sind für die Website (1920 px). */
const klein = (datei: string, breite: number) => `/_next/image?url=${encodeURIComponent(`/bilder/gewerke/${datei}.jpg`)}&w=${breite}&q=75`;

function GewerkFoto({ gewerk }: { gewerk: Gewerk }) {
  const { datei, position } = GEWERK_BILD[gewerk];
  const [fehlt, setFehlt] = useState(false);
  return (
    <span className={`ob-gewerk-bild${fehlt ? ' ob-gewerk-bild--ersatz' : ''}`} aria-hidden="true">
      {fehlt ? (
        <svg viewBox="0 0 220 200" className="ob-gewerk-pfeile" fill="currentColor">
          <path d="M0 0h52l70 100-70 100H0l70-100Z" />
          <path d="M90 0h52l70 100-70 100H90l70-100Z" opacity=".55" />
        </svg>
      ) : (
        <img
          src={klein(datei, 640)}
          srcSet={`${klein(datei, 640)} 640w, ${klein(datei, 1080)} 1080w`}
          sizes="(max-width: 600px) 50vw, 380px"
          alt=""
          loading="lazy"
          decoding="async"
          style={position ? { objectPosition: position } : undefined}
          onError={() => setFehlt(true)}
        />
      )}
    </span>
  );
}

/** Handwerker im Markenkopf der Anmeldung; fehlt das Foto, bleibt die grüne Markenfläche stehen. */
function HandwerkerFoto() {
  const [fehlt, setFehlt] = useState(false);
  if (fehlt) return null;
  return (
    <span className="ob-marke-foto" aria-hidden="true">
      <img
        src={klein('tischler', 640)}
        srcSet={`${klein('tischler', 640)} 640w, ${klein('tischler', 1080)} 1080w`}
        sizes="(max-width: 600px) 100vw, 480px"
        alt=""
        decoding="async"
        onError={() => setFehlt(true)}
      />
    </span>
  );
}

/**
 * Hauptaktion der Einrichtung im Stil des Mission-Mittelstand-CTAs: grüne Fläche mit feinem Würfelraster,
 * weißer Kreis mit Pfeil links. Beim Hover wandert der Kreis nach rechts.
 */
function WeiterButton({ icon, onClick, laedt, laedtText, children }: { icon: IconName; onClick: () => void; laedt?: boolean; laedtText: string; children: ReactNode }) {
  return (
    <button type="button" className="ob-weiter" onClick={onClick} disabled={laedt} aria-busy={laedt || undefined}>
      <span className="ob-weiter-innen">
        <span className="ob-weiter-kreis" aria-hidden="true">
          {laedt ? <span className="mm-spinner" /> : <Icon name={icon} size={16} strokeWidth={2.25} />}
        </span>
        <span>{laedt ? laedtText : children}</span>
        <span className="ob-weiter-kreis ob-weiter-kreis--hover" aria-hidden="true">
          <Icon name={icon} size={16} strokeWidth={2.25} />
        </span>
      </span>
    </button>
  );
}

export function Frage({ titel, text, children }: { titel: string; text: string; children: ReactNode }) {
  return (
    <section className="ob-frage" aria-label={titel}>
      <div className="ob-frage-kopf">
        <h1>{titel}</h1>
        <p>{text}</p>
      </div>
      {children}
    </section>
  );
}

function SchonEingerichtet({ onNeu }: { onNeu: () => void }) {
  const navigate = useNavigate();
  const b = db.betrieb.get('betrieb');
  const [fragen, dialog] = useBestaetigen();
  const [fehler, setFehler] = useState<string>();
  const luecken = b
    ? briefkopfLuecken({ ...LEERER_BRIEFKOPF, name: b.name, inhaber: '-', strasse: b.adresse?.strasse ?? '', plz: b.adresse?.plz ?? '', ort: b.adresse?.ort ?? '', steuernummer: b.steuernummer ?? '', ustId: b.ustId ?? '', iban: b.iban ?? '', logo: 'egal' })
    : [];
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <h1>{b?.name} ist schon eingerichtet</h1>
        <p>Du kannst direkt weiterarbeiten.</p>
      </div>
      {luecken.length > 0 && <Meldung titel="Briefkopf noch nicht vollständig">Es fehlt: {luecken.join(', ')}. Ergänze das unter Betrieb → Einstellungen, bevor dein erstes Angebot rausgeht.</Meldung>}
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <div className="ob-navigation">
        <Button
          variante="tertiaer"
          onClick={async () => {
            if (await fragen('Neu einrichten?', 'Wenn du die Einrichtung abschließt, werden alle Daten in diesem Browser ersetzt – Kunden, Aufträge, Rechnungen. Das lässt sich nicht rückgängig machen.', 'Alles löschen und neu starten')) onNeu();
          }}
        >
          Neu einrichten
        </Button>
        <Button icon="weiter" onClick={() => navigate('/heute')}>
          Zu Heute
        </Button>
      </div>
      <div className="ob-schnell">
        <Meta>Etwas ausprobieren, ohne deine Daten anzufassen?</Meta>
        <Button
          variante="tertiaer"
          onClick={async () => {
            try {
              await spielwieseStarten(b?.gewerk);
              navigate('/heute');
            } catch (e) {
              setFehler(e instanceof Error ? e.message : 'Die Spielwiese konnte nicht geöffnet werden.');
            }
          }}
        >
          Spielwiese öffnen
        </Button>
      </div>
      {dialog}
    </div>
  );
}

function AufDerSpielwiese({ onNeu }: { onNeu: () => void }) {
  const navigate = useNavigate();
  const [gesichert, setGesichert] = useState<boolean>();
  const [laedt, setLaedt] = useState(false);
  useEffect(() => {
    void hatGesicherteDaten().then(setGesichert);
  }, []);
  const verlassen = async () => {
    setLaedt(true);
    const r = await spielwieseVerlassen();
    if (r === 'zurueck') navigate('/heute', { replace: true });
    else onNeu();
  };
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <Oberzeile>Spielwiese</Oberzeile>
        <h1>Du bist gerade auf der Spielwiese</h1>
        <p>Alles hier sind Beispieldaten. {gesichert ? 'Deine echten Daten liegen sicher zur Seite und kommen unverändert zurück.' : 'Wenn du deinen eigenen Betrieb einrichtest, verschwinden sie vollständig.'}</p>
      </div>
      <div className="ob-navigation">
        <Button variante="tertiaer" onClick={() => navigate('/heute')}>
          Weiter umsehen
        </Button>
        <Button icon="weiter" onClick={verlassen} laedt={laedt || gesichert === undefined}>
          {gesichert ? 'Zurück zu deinen Daten' : 'Eigenen Betrieb einrichten'}
        </Button>
      </div>
    </div>
  );
}

function Einladung({ betrieb }: { betrieb: string }) {
  const verbunden = cloudAktiv() && !!cloud().konto();
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <Oberzeile>Einladung</Oberzeile>
        <h1>{betrieb ? `${betrieb} hat dich eingeladen` : 'Du wurdest eingeladen'}</h1>
        <p>Über Macher OS bekommst du deine Einsätze, Adressen und Aufgaben aufs Handy.</p>
      </div>
      {verbunden ? (
        <Meldung ton="erfolg" titel="Du bist angemeldet">Deine Einsätze erscheinen unter Heute.</Meldung>
      ) : (
        <Meldung titel="Noch nicht verbunden">
          Dein Betrieb arbeitet noch ohne verbundenes Konto. Seine Daten liegen bisher nur auf seinem Gerät – deshalb siehst du hier noch nichts. Sobald das Konto gesichert ist, bekommst du eine SMS mit einem neuen Link.
        </Meldung>
      )}
      {verbunden && (
        <div>
          <Button to="/heute" variante="sekundaer">
            Zu Heute
          </Button>
        </div>
      )}
    </div>
  );
}
