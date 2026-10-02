import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { aktiverBetrieb, leerenBetriebVerwerfen, useBetriebe } from '@core/betriebe';
import { cloud, cloudAktiv } from '@core/cloud';
import { db } from '@core/db';
import { GEWERKE, vorlageFuer, type FachrichtungId } from '@core/gewerke';
import type { Gewerk } from '@core/objects';
import { hatGesicherteDaten, istSpielwiese, spielwieseStarten, spielwieseVerlassen } from '@core/seed';
import { DATEN_VERTRAUEN } from '@core/vertrauen';
import { Button, Eingabe, FensterSkizze, Icon, Meldung, Meta, Oberzeile, useBestaetigen, type IconName } from '@ui/index';
import {
  briefkopfErkennen,
  briefkopfLuecken,
  entwurfAusErkannt,
  fachrichtungAusText,
  LEERER_BRIEFKOPF,
  PLATZHALTER_NAME,
  setupEinrichten,
  setupFertig,
  setupGestartet,
  setupSchritt,
  vorlageErkennen,
  websiteAnzeige,
  zielNachSetup,
  type BriefkopfEntwurf,
  type SchrittId,
} from './daten';
import { SchrittKonto, type KontoStand } from './Schritte';
import './onboarding.css';

/** Vollbild `/willkommen`: Magic Setup – eine Frage, dann sofort in die Anwendung. */
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

/**
 * Was beim Start zählt – steht bei der Anmeldung (`/signup`) im Markenkopf.
 * Antworten auf die stärksten Einwände aus `docs/produkt/einwaende.md` (Zeit, kompliziert, Risiko, allein gelassen).
 * Jeder Punkt muss heute stimmen. Keine Minutenzahl, solange `setup.fertig` sie nicht im Median belegt.
 */
const VORTEILE = ['Kostenlos starten – ohne Kreditkarte', 'In wenigen Minuten startklar', 'Du musst keine Software lernen', 'Kostenlose Hilfe beim Einrichten'];

function Rahmen({ children, vorteile }: { children: ReactNode; vorteile?: boolean }) {
  return (
    <div className="ob-rahmen">
      <header className={`ob-marke${vorteile ? ' ob-marke--vorteile' : ''}`}>
        <div className="ob-marke-innen">
          {vorteile && <HandwerkerFoto />}
          <div className="ob-logo">
            <img className="mm-logo-zeichen" src="/os/icons/icon-192.png" alt="" width={32} height={32} />
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
          {vorteile && (
            <div className="ob-eu">
              <Icon name="schild" size={20} />
              <ul aria-label="Datenschutz">
                {DATEN_VERTRAUEN.map((v) => (
                  <li key={v.titel}>
                    <Icon name="check" size={16} strokeWidth={2.5} />
                    {v.titel}
                  </li>
                ))}
              </ul>
            </div>
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

/** Was die Website ergeben hat – Entwurf, bis der Mensch „Sieht gut aus“ sagt */
interface Fund {
  website: string;
  briefkopf: BriefkopfEntwurf;
  leistungen: string[];
  gewerk?: Gewerk;
  fachrichtung?: FachrichtungId;
  /** Gewerk von der KI, aus Stichworten (Regel) oder vom Menschen gewählt */
  gewerkQuelle: 'website' | 'regel' | 'tipp';
}

/**
 * Magic Setup: eine einzige Frage („Welcher Betrieb bist du?“). Website → „Wir haben deinen Betrieb gefunden“ →
 * los. Ohne Website ein Tipp aufs Gewerk. Danach sofort in die Anwendung („Was möchtest du als Erstes erledigen?“).
 */
function Ablauf() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const vonWebsite = GEWERKE.find((x) => x.id === params.get('gewerk'))?.id;
  const nameVonWebsite = params.get('betrieb')?.trim() ?? '';
  const [schritt, setSchritt] = useState<SchrittId>(() => (cloudAktiv() && !cloud().konto() ? 'konto' : 'website'));
  const [konto, setKonto] = useState<KontoStand>({ art: cloudAktiv() ? 'offen' : 'lokal' });
  const [website, setWebsite] = useState('');
  const [fund, setFund] = useState<Fund>();
  const [anderesGewerk, setAnderesGewerk] = useState(false);
  const [hinweis, setHinweis] = useState<string>();
  const [fehler, setFehler] = useState<string>();
  const [liest, setLiest] = useState(false);
  const [richtetEin, setRichtetEin] = useState(false);
  const start = useRef(0);

  useEffect(() => {
    start.current = setupGestartet(params.get('gewerk') ? 'website' : 'direkt');
  }, [params]);

  const geheZu = (id: SchrittId) => {
    setupSchritt(start.current, schritt);
    setSchritt(id);
    setFehler(undefined);
    window.scrollTo?.({ top: 0 });
  };

  const betriebFinden = async () => {
    if (!website.trim()) return setFehler('Gib deine Website ein, z. B. maler-mueller.de.');
    setLiest(true);
    setFehler(undefined);
    setHinweis(undefined);
    const r = await briefkopfErkennen({ website: website.trim() });
    setLiest(false);
    if (!r.ok) {
      if (r.art === 'nicht-verbunden') {
        setHinweis('Deine Website kann Macher hier noch nicht lesen. Wähl dein Gewerk – den Rest ergänzt du, wenn du ihn brauchst.');
        return geheZu('gewerk');
      }
      return setFehler(`${r.fehler} Du kannst auch ohne Website starten.`);
    }
    const v = vorlageErkennen(r.wert);
    const ki = !!r.wert.gewerk && v.gewerk === r.wert.gewerk;
    setFund({
      website: website.trim(),
      briefkopf: { ...entwurfAusErkannt(r.wert, { ...LEERER_BRIEFKOPF, name: nameVonWebsite }), ...(r.wert.logoBild ? { logo: r.wert.logoBild } : {}) },
      leistungen: r.wert.leistungen ?? [],
      gewerk: v.gewerk ?? vonWebsite,
      fachrichtung: v.fachrichtung,
      gewerkQuelle: ki ? 'website' : v.gewerk ? 'regel' : 'tipp',
    });
    setAnderesGewerk(false);
    geheZu('gefunden');
  };

  const einrichtenMit = async (a: { gewerk: Gewerk; fachrichtung?: FachrichtungId; briefkopf: BriefkopfEntwurf; quelle: 'hand' | 'website'; gewerkQuelle: Fund['gewerkQuelle'] }) => {
    setRichtetEin(true);
    setFehler(undefined);
    // kurz rendern lassen, damit „Wird eingerichtet …“ sichtbar ist
    await new Promise((r) => setTimeout(r, 30));
    try {
      const briefkopf = { ...a.briefkopf, name: a.briefkopf.name.trim() || PLATZHALTER_NAME };
      const e = setupEinrichten({ gewerk: a.gewerk, fachrichtung: a.fachrichtung, briefkopf, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
      setupSchritt(start.current, schritt);
      setupFertig(start.current, {
        ...e,
        konto: konto.art === 'gesichert' ? 'gesichert' : konto.art === 'lokal' ? 'lokal' : 'offen',
        briefkopfQuelle: a.quelle,
        preise: 'vorlage',
        gewerkQuelle: a.gewerkQuelle,
      });
      navigate(zielNachSetup(), { replace: true, state: { setup: 'fertig' } });
    } catch (err) {
      console.error(err);
      setFehler('Dein Betrieb wurde noch nicht eingerichtet. Versuche es erneut.');
      setRichtetEin(false);
    }
  };

  const umsehen = async () => {
    try {
      await spielwieseStarten(fund?.gewerk ?? vonWebsite ?? 'elektro');
      navigate('/heute');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Spielwiese konnte nicht geöffnet werden.');
    }
  };

  const spielwiese = (
    <div className="ob-schnell">
      <Meta>Erst mal nur umsehen? Die Spielwiese zeigt einen Beispielbetrieb – getrennt von deinen echten Daten.</Meta>
      <Button variante="tertiaer" onClick={umsehen}>
        Spielwiese öffnen
      </Button>
    </div>
  );

  if (schritt === 'konto')
    return (
      <div className="ob-ablauf">
        <Frage titel="Konto erstellen" text="Mit deiner E-Mail oder Handynummer kommst du jederzeit wieder rein – ohne Passwort.">
          <SchrittKonto konto={konto} setKonto={setKonto} email={params.get('email')?.trim() ?? ''} google={params.get('anmeldung') === 'google'} />
        </Frage>
        <div className="ob-navigation">
          <Button variante="tertiaer" onClick={() => geheZu('website')} disabled={konto.art === 'laedt'}>
            Später sichern
          </Button>
          {(konto.art === 'gesichert' || konto.art === 'link') && (
            <WeiterButton icon="pfeil" onClick={() => geheZu('website')} laedtText="Einen Moment …">
              Weiter
            </WeiterButton>
          )}
        </div>
      </div>
    );

  if (schritt === 'gewerk')
    return (
      <div className="ob-ablauf">
        <Frage titel="Was macht ihr?" text="Ein Tipp genügt. Macher richtet Leistungen, Richtpreise und Auftragsabläufe für dein Gewerk ein. Alles lässt sich später ändern.">
          {hinweis && <Meldung>{hinweis}</Meldung>}
          {richtetEin ? (
            <Meldung ton="erfolg" titel="Dein Betrieb wird eingerichtet …">
              Leistungen, Preise und Abläufe werden vorbereitet.
            </Meldung>
          ) : (
            <GewerkKarten
              wert={vonWebsite}
              onChange={(g) => void einrichtenMit({ gewerk: g, briefkopf: { ...LEERER_BRIEFKOPF, name: nameVonWebsite }, quelle: 'hand', gewerkQuelle: 'tipp' })}
            />
          )}
        </Frage>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div className="ob-schnell">
          <Button variante="tertiaer" icon="zurueck" onClick={() => geheZu('website')} disabled={richtetEin}>
            Doch mit Website
          </Button>
        </div>
        {spielwiese}
      </div>
    );

  if (schritt === 'gefunden' && fund) return <Gefunden fund={fund} setFund={setFund} anderesGewerk={anderesGewerk} setAnderesGewerk={setAnderesGewerk} fehler={fehler} richtetEin={richtetEin} onZurueck={() => geheZu('website')} onLos={() => {
    if (!fund.gewerk) return setFehler('Wähl noch dein Gewerk – ein Tipp genügt.');
    void einrichtenMit({ gewerk: fund.gewerk, fachrichtung: fund.fachrichtung, briefkopf: fund.briefkopf, quelle: 'website', gewerkQuelle: fund.gewerkQuelle });
  }} />;

  return (
    <div className="ob-ablauf">
      <Frage titel="Welcher Betrieb bist du?" text="Gib deine Website an. Macher liest Name, Logo, Gewerk, Leistungen und Kontaktdaten aus und richtet alles für dich ein.">
        <form
          className="ob-website ob-website--gross"
          onSubmit={(e) => {
            e.preventDefault();
            void betriebFinden();
          }}
        >
          <Eingabe label="Website" value={website} onChange={(e) => (setWebsite(e.target.value), setFehler(undefined))} placeholder="www.maler-mueller.de" inputMode="url" autoComplete="url" autoFocus />
          <WeiterButton icon="pfeil" onClick={() => void betriebFinden()} laedt={liest} laedtText="Macher liest deine Website …">
            Betrieb übernehmen
          </WeiterButton>
        </form>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div className="ob-ohne-website">
          <Button variante="tertiaer" icon="pfeilRechts" onClick={() => geheZu('gewerk')} disabled={liest}>
            Keine Website? Gewerk auswählen
          </Button>
        </div>
      </Frage>
      {spielwiese}
    </div>
  );
}

/** „Wir haben deinen Betrieb gefunden.“ – nur Erkanntes, ehrlich benannt. Eine Hauptaktion. */
function Gefunden({
  fund,
  setFund,
  anderesGewerk,
  setAnderesGewerk,
  fehler,
  richtetEin,
  onZurueck,
  onLos,
}: {
  fund: Fund;
  setFund: (f: Fund) => void;
  anderesGewerk: boolean;
  setAnderesGewerk: (an: boolean) => void;
  fehler?: string;
  richtetEin: boolean;
  onZurueck: () => void;
  onLos: () => void;
}) {
  const b = fund.briefkopf;
  const v = fund.gewerk ? vorlageFuer(fund.gewerk, fund.fachrichtung) : undefined;
  const kontakt = [b.strasse && 'Anschrift', b.telefon && 'Telefon', b.email && 'E-Mail', (b.steuernummer || b.ustId) && 'Steuernummer', b.iban && 'Bankverbindung'].filter(Boolean) as string[];
  const zeile = [v?.label, b.ort].filter(Boolean).join(' · ');
  const gewerkWaehlen = !fund.gewerk || anderesGewerk;
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <h1>{b.name ? 'Wir haben deinen Betrieb gefunden.' : 'Wir haben deine Website gelesen.'}</h1>
        <p>Aus {websiteAnzeige(fund.website)}. Prüf kurz, ob es passt – ändern kannst du alles später.</p>
      </div>

      <section className="ob-fund" aria-label="Dein Betrieb">
        <div className="ob-fund-kopf">
          {b.logo ? (
            <img src={b.logo} alt={`Logo von ${b.name || 'deinem Betrieb'}`} className="ob-fund-logo" />
          ) : (
            <span className="ob-fund-logo ob-fund-logo--ersatz" aria-hidden="true">
              <Icon name="betrieb" />
            </span>
          )}
          <div className="ob-fund-name">
            <strong>{b.name || 'Name nicht gefunden'}</strong>
            {zeile && <span>{zeile}</span>}
          </div>
        </div>
        <ul className="ob-fund-liste">
          {kontakt.length > 0 && <FundZeile>Firmendaten übernommen: {kontakt.join(', ')}</FundZeile>}
          {fund.leistungen.length > 0 && (
            <FundZeile>
              {fund.leistungen.length === 1 ? '1 Leistung' : `${fund.leistungen.length} Leistungen`} auf deiner Website erkannt
              <span className="ob-fund-chips">
                {fund.leistungen.slice(0, 8).map((l) => (
                  <span key={l} className="ob-fund-chip">
                    {l}
                  </span>
                ))}
              </span>
            </FundZeile>
          )}
          {v && <FundZeile>{v.leistungen.length} Leistungen mit Richtpreisen und passende Auftragsabläufe für {v.label} vorbereitet</FundZeile>}
          {b.logo && <FundZeile>Logo für Angebote und Rechnungen übernommen</FundZeile>}
        </ul>
        {!gewerkWaehlen && (
          <div>
            <Button variante="tertiaer" klein onClick={() => setAnderesGewerk(true)}>
              Anderes Gewerk wählen
            </Button>
          </div>
        )}
      </section>

      {gewerkWaehlen && (
        <section className="ob-block" aria-label="Gewerk">
          <h2 className="ob-block-titel">{fund.gewerk ? 'Welches Gewerk passt?' : 'Welches Gewerk seid ihr? Ein Tipp genügt.'}</h2>
          <GewerkKarten
            wert={fund.gewerk}
            onChange={(g) => {
              setFund({ ...fund, gewerk: g, fachrichtung: fachrichtungAusText(g, b.name, ...fund.leistungen), gewerkQuelle: 'tipp' });
              setAnderesGewerk(false);
            }}
          />
        </section>
      )}

      <Meta>Deinen Briefkopf prüfst du kurz, bevor dein erstes Angebot rausgeht. Kunden, Preise und Team übernimmst du, wenn du so weit bist.</Meta>
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}

      <div className="ob-navigation">
        <Button variante="tertiaer" icon="zurueck" onClick={onZurueck} disabled={richtetEin}>
          Andere Website
        </Button>
        <WeiterButton icon="pfeil" onClick={onLos} laedt={richtetEin} laedtText="Dein Betrieb wird eingerichtet …">
          Sieht gut aus – los geht’s
        </WeiterButton>
      </div>
    </div>
  );
}

function FundZeile({ children }: { children: ReactNode }) {
  return (
    <li>
      <span className="ob-fund-haken" aria-hidden="true">
        <Icon name="check" size={14} strokeWidth={2.5} />
      </span>
      <span className="ob-fund-text">{children}</span>
    </li>
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
      <span className="mm-fenster" aria-hidden>
        <FensterSkizze icon="erledigt" />
      </span>
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
      <span className="mm-fenster" aria-hidden>
        <FensterSkizze icon="start" />
      </span>
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
      <span className="mm-fenster" aria-hidden>
        <FensterSkizze icon="handy" rahmen="handy" />
      </span>
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
