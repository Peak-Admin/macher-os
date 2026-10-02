/**
 * Wechsler oben in der Seitenleiste: aktiver Betrieb, Abkürzungen (einladen, einstellen),
 * Liste aller Betriebe in diesem Browser und „Neuen Betrieb anlegen“.
 * Jeder Betrieb hat getrennte Daten (siehe `@core/betriebe`); ein Wechsel lädt die Seite neu.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { aktiverBetrieb, betriebAnlegen, betriebMerken, betriebWaehlen, useBetriebe, type BetriebEintrag } from '@core/betriebe';
import { db, jetztSpeichern } from '@core/db';
import { gewerkVorlage } from '@core/gewerke';
import { istSpielwiese } from '@core/seed';
import { useDarf } from '@core/session';
import { Icon } from '@ui/index';

/** Ab so vielen Betrieben erscheint das Suchfeld */
const SUCHE_AB = 5;

const kuerzel = (name: string) => (name.trim()[0] ?? 'B').toUpperCase();

function meta(b: BetriebEintrag | undefined, spielwiese: boolean): string {
  if (!b) return '';
  if (spielwiese) return 'Spielwiese mit Beispieldaten';
  if (!b.eingerichtet) return 'Noch nicht eingerichtet';
  const teile = [b.gewerk, b.personen ? `${b.personen} ${b.personen === 1 ? 'Person' : 'Personen'}` : undefined].filter(Boolean);
  return teile.join(' · ');
}

/** Anzeige-Angaben des aktiven Betriebs aus seinen Daten ins Verzeichnis übernehmen */
function useAbgleich() {
  const betrieb = db.betrieb.useOne('betrieb');
  const personen = db.mitarbeiter.use((m) => m.aktiv).length;
  useEffect(() => {
    if (!betrieb) return;
    betriebMerken({
      name: betrieb.name?.trim() || 'Mein Betrieb',
      gewerk: betrieb.gewerk ? gewerkVorlage(betrieb.gewerk).label : undefined,
      personen,
      eingerichtet: !!betrieb.onboardingFertig,
    });
  }, [betrieb, personen]);
}

/** Speichern, dann neu laden – erst danach gilt der andere Datenstand */
async function wechselnZu(id: string) {
  await jetztSpeichern().catch(() => {});
  betriebWaehlen(id);
  window.location.assign(appPfad('/heute'));
}

async function neuAnlegen() {
  await jetztSpeichern().catch(() => {});
  betriebAnlegen();
  window.location.assign(appPfad('/willkommen'));
}

export function BetriebWechsler({ kompakt }: { kompakt?: boolean }) {
  useAbgleich();
  const alle = useBetriebe();
  const aktivId = aktiverBetrieb();
  const aktiv = alle.find((b) => b.id === aktivId);
  const spielwiese = istSpielwiese();
  const darfTeam = useDarf('personal');
  const darfEinstellen = useDarf('admin');
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState('');
  const [wechselt, setWechselt] = useState<string>();
  /** Panel liegt fest über allem – die Seitenleiste scrollt und würde es sonst abschneiden */
  const [lage, setLage] = useState<{ top: number; left: number }>();
  const knopf = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOffen(false);
      knopf.current?.focus();
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [offen]);

  const name = aktiv?.name ?? 'Mein Betrieb';
  const q = suche.trim().toLowerCase();
  const treffer = q ? alle.filter((b) => b.name.toLowerCase().includes(q) || b.gewerk?.toLowerCase().includes(q)) : alle;

  const waehlen = (id: string) => {
    if (id === aktivId) return setOffen(false);
    setWechselt(id);
    void wechselnZu(id);
  };

  return (
    <div className={`mm-wechsler ${kompakt ? 'mm-wechsler--kompakt' : ''}`}>
      <button
        ref={knopf}
        type="button"
        className="mm-wechsler-knopf"
        aria-expanded={offen}
        aria-controls={panelId}
        aria-label={`Betrieb: ${name}. Betrieb wechseln`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setLage({ top: r.bottom + 8, left: r.left });
          setSuche('');
          setOffen(!offen);
        }}
      >
        <span className="mm-wechsler-kachel" aria-hidden>
          {kuerzel(name)}
        </span>
        {!kompakt && (
          <span className="mm-wechsler-text">
            <strong>{name}</strong>
            <span>{meta(aktiv, spielwiese) || 'Betrieb wechseln'}</span>
          </span>
        )}
        <Icon name="auswahl" size={18} className="mm-wechsler-pfeil" />
      </button>

      {offen && (
        <>
          <div className="mm-schleier-unsichtbar" onClick={() => setOffen(false)} />
          <div id={panelId} className="mm-wechsler-panel" style={lage} role="dialog" aria-label="Betrieb wechseln">
            <div className="mm-wechsler-kopf">
              <span className="mm-wechsler-kachel mm-wechsler-kachel--gross" aria-hidden>
                {kuerzel(name)}
              </span>
              <span className="mm-wechsler-text">
                <strong>{name}</strong>
                <span>{meta(aktiv, spielwiese)}</span>
              </span>
            </div>

            {(darfTeam || darfEinstellen) && (
              <div className="mm-wechsler-aktionen">
                {darfTeam && (
                  <Link to="/betrieb/mitarbeiter/neu" className="mm-wechsler-aktion" onClick={() => setOffen(false)}>
                    <Icon name="team" size={18} /> Mitarbeiter einladen
                  </Link>
                )}
                {darfEinstellen && (
                  <Link to="/betrieb/einstellungen" className="mm-wechsler-aktion" onClick={() => setOffen(false)}>
                    <Icon name="einstellungen" size={18} /> Betrieb einstellen
                  </Link>
                )}
              </div>
            )}

            <div className="mm-wechsler-liste-bereich">
              {alle.length >= SUCHE_AB && (
                <label className="mm-wechsler-suche">
                  <span className="sr-only">Betrieb suchen</span>
                  <Icon name="suche" size={18} />
                  <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Betrieb suchen" autoFocus />
                </label>
              )}
              <p className="mm-nav-titel">Deine Betriebe</p>
              {treffer.length ? (
                <ul className="mm-wechsler-liste">
                  {treffer.map((b) => {
                    const an = b.id === aktivId;
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          className={`mm-wechsler-eintrag ${an ? 'mm-wechsler-eintrag--an' : ''}`}
                          aria-current={an ? 'true' : undefined}
                          disabled={!!wechselt}
                          onClick={() => waehlen(b.id)}
                        >
                          <span className="mm-wechsler-kachel" aria-hidden>
                            {kuerzel(b.name)}
                          </span>
                          <span className="mm-wechsler-eintrag-name">{b.name}</span>
                          {an && <Icon name="check" size={18} aria-label="aktiv" />}
                          {wechselt === b.id && <span className="mm-meta">Wird geöffnet …</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mm-nav-leer">Kein Betrieb passt zu „{suche.trim()}“.</p>
              )}
              <button type="button" className="mm-wechsler-eintrag" disabled={!!wechselt} onClick={() => (setWechselt('neu'), void neuAnlegen())}>
                <span className="mm-wechsler-plus" aria-hidden>
                  <Icon name="plus" size={18} />
                </span>
                <span className="mm-wechsler-eintrag-name">{wechselt === 'neu' ? 'Wird angelegt …' : 'Neuen Betrieb anlegen'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
