/**
 * Die Inbox: eine ruhige Warteschlange für deine Aufmerksamkeit – kein Postfach, kein Archiv.
 * Jetzt · Aktion nötig · Zur Kenntnis. Aktivität nur hinter „Letzte Aktivitäten“.
 * Alle Regeln (was gilt, was verschwindet, was zählt) kommen aus `@core/aufmerksamkeit` – hier wird nur gezeigt.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { alsGeloest, hinweisSpaeter, schliessen, spaeter, spaeterAm, spaeterOptionen, zustand, type Inbox, type InboxEintrag, type InboxGruppe } from '@core/aufmerksamkeit';
import { relativ, uhrzeit } from '@core/format';
import { hinweisErledigen, meinPosteingang, offeneHinweise } from '@core/macher';
import { aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { useIch } from '@core/session';
import type { Mitarbeiter } from '@core/objects';
import { Button, Icon, Leer, Meta, Stapel, Status, useToast } from '@ui/index';
import './inbox.css';

/** Neu berechnen, sobald sich Daten ändern – und jede Minute (Später und Lebensdauer laufen ab, auch ohne Änderung) */
function useMinutentakt() {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function useInbox(): { inbox: Inbox; ich: Mitarbeiter | undefined } {
  const v = useDatenstand();
  const ich = useIch();
  const takt = useMinutentakt();
  const inbox = useMemo(() => meinPosteingang(ich, new Date(takt)), [v, ich, takt]); // eslint-disable-line react-hooks/exhaustive-deps
  return { inbox, ich };
}

/** Zahl an der Glocke: nur Jetzt + Aktion nötig – nie „ungelesen“ */
export function useInboxZahl(): number {
  return useInbox().inbox.zaehler;
}

// ------------------------------------------------------------------ Handlungen

/** Gilt der Eintrag noch? Schützt vor Doppelarbeit, wenn jemand anders (oder ein anderes Gerät) schneller war. */
function nochOffen(e: InboxEintrag, ich: Mitarbeiter | undefined): boolean {
  if (e.quelle.typ === 'meldung') {
    return e.quelle.ids.some((id) => {
      const b = db.benachrichtigungen.get(id);
      return !!b && ['aktiv', 'spaeter'].includes(zustand(b, new Date(), ich));
    });
  }
  const k = e.quelle.schluessel;
  return offeneHinweise(ich ? { rolle: ich.rolle, mitarbeiterId: ich.id } : undefined).some((h) => h.schluessel === k || h.weitere?.some((w) => w.schluessel === k));
}

function useHandlungen(ich: Mitarbeiter | undefined, onNavigiert?: () => void) {
  const navigate = useNavigate();
  const toast = useToast();
  const weg = (e: InboxEintrag) => e.quelle.typ === 'meldung' && alsGeloest(e.quelle.ids);
  return {
    ausfuehren(e: InboxEintrag, aktion: { id: string; label: string; payload?: unknown }) {
      if (!nochOffen(e, ich)) {
        weg(e);
        toast('Das hat sich schon erledigt.');
        return;
      }
      try {
        const ziel = aktionAusfuehren(aktion.id, aktion.payload);
        weg(e);
        if (typeof ziel === 'string' && ziel.startsWith('/')) {
          onNavigiert?.();
          navigate(ziel);
        } else toast(`${aktion.label}: erledigt.`);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Das hat nicht geklappt. Versuch es noch einmal.');
      }
    },
    oeffnen(e: InboxEintrag) {
      if (!e.pfad) return;
      onNavigiert?.();
      navigate(e.pfad);
    },
    spaeter(e: InboxEintrag, bis: string, label: string) {
      if (e.quelle.typ === 'meldung') spaeter(e.quelle.ids, bis);
      else if (ich) hinweisSpaeter(ich.id, e.quelle.schluessel, bis);
      toast(`Zurückgestellt: ${label.toLowerCase()}. Kommt nur wieder, wenn es dann noch offen ist.`);
    },
    zurueckholen(e: InboxEintrag) {
      const jetzt = new Date().toISOString();
      if (e.quelle.typ === 'meldung') spaeter(e.quelle.ids, jetzt);
      else if (ich) hinweisSpaeter(ich.id, e.quelle.schluessel, jetzt);
    },
    erledigt(e: InboxEintrag) {
      if (e.quelle.typ === 'meldung') schliessen(e.quelle.ids);
      else if (e.quelle.hinweisId) hinweisErledigen(e.quelle.hinweisId);
    },
  };
}

type Handlungen = ReturnType<typeof useHandlungen>;

// ------------------------------------------------------------------ Bausteine

function SpaeterMenue({ e, h }: { e: InboxEintrag; h: Handlungen }) {
  const [offen, setOffen] = useState(false);
  const [datum, setDatum] = useState('');
  const optionen = spaeterOptionen();
  useEffect(() => {
    if (!offen) return;
    const zu = (ev: KeyboardEvent) => ev.key === 'Escape' && setOffen(false);
    window.addEventListener('keydown', zu);
    return () => window.removeEventListener('keydown', zu);
  }, [offen]);
  const morgen = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return (
    <div className="mm-aktionsmenue">
      <Button variante="tertiaer" klein icon="uhr" aria-expanded={offen} aria-haspopup="menu" onClick={() => setOffen(!offen)}>
        Später
      </Button>
      {offen && (
        <>
          <div className="mm-aktionsmenue-schleier" onClick={() => setOffen(false)} />
          <div className="mm-aktionsmenue-liste mm-inbox-spaeter" role="menu" aria-label={`„${e.titel}“ später erinnern`}>
            {optionen.map((o) => (
              <button key={o.id} type="button" role="menuitem" onClick={() => (setOffen(false), h.spaeter(e, o.bis, o.label))}>
                {o.label}
              </button>
            ))}
            <form
              className="mm-inbox-datum"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!datum) return;
                setOffen(false);
                h.spaeter(e, spaeterAm(datum), `am ${new Date(datum + 'T12:00:00').toLocaleDateString('de-DE')}`);
              }}
            >
              <label>
                <span className="mm-meta">Datum wählen</span>
                <input type="date" className="mm-input" min={morgen} value={datum} onChange={(ev) => setDatum(ev.target.value)} />
              </label>
              <Button variante="sekundaer" klein type="submit" disabled={!datum}>
                Übernehmen
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

const zeitText = (iso: string) => (relativ(iso) === 'heute' ? `heute, ${uhrzeit(iso)} Uhr` : relativ(iso));

/** Ein Eintrag mit nächster sinnvoller Aktion – „No notification without a Next Best Action“ */
function Eintrag({ e, h, fuehrend }: { e: InboxEintrag; h: Handlungen; fuehrend: boolean }) {
  const aktionen = e.aktionen.filter((a) => aktionVorhanden(a.id)).sort((a, b) => Number(!!b.primaer) - Number(!!a.primaer));
  const [haupt, ...weitere] = aktionen;
  const schliessbar = e.quelle.typ === 'meldung' || !!e.quelle.hinweisId;
  return (
    <li className={`mm-inbox-eintrag mm-inbox-eintrag--${e.stufe}`}>
      <div className="mm-inbox-kopf">
        <span className="mm-inbox-titel">{e.titel}</span>
        {e.stufe === 'jetzt' && <Status ton={e.art === 'pruefung.ueberfaellig' ? 'gefahr' : 'achtung'}>Jetzt</Status>}
      </div>
      {e.text && <p className="mm-inbox-text">{e.text}</p>}
      <Meta>{[e.grund, e.anzahl > 1 ? `${e.anzahl}× gemeldet` : undefined, e.quelle.typ === 'meldung' ? zeitText(e.zeit) : undefined].filter(Boolean).join(' · ')}</Meta>
      <div className="mm-inbox-aktionen">
        {haupt ? (
          <Button variante={fuehrend ? 'primaer' : 'sekundaer'} klein onClick={() => h.ausfuehren(e, haupt)}>
            {haupt.label}
          </Button>
        ) : (
          e.pfad && (
            <Button variante={fuehrend ? 'primaer' : 'sekundaer'} klein onClick={() => h.oeffnen(e)}>
              {e.stufe === 'jetzt' ? 'Problem lösen' : 'Öffnen'}
            </Button>
          )
        )}
        {weitere.slice(0, 1).map((a) => (
          <Button key={a.id} variante="sekundaer" klein onClick={() => h.ausfuehren(e, a)}>
            {a.label}
          </Button>
        ))}
        <SpaeterMenue e={e} h={h} />
        {haupt && e.pfad && (
          <Button variante="tertiaer" klein onClick={() => h.oeffnen(e)}>
            Öffnen
          </Button>
        )}
        {schliessbar && (
          <Button variante="tertiaer" klein icon="check" aria-label={`„${e.titel}“ als erledigt schließen`} onClick={() => h.erledigt(e)}>
            Erledigt
          </Button>
        )}
      </div>
    </li>
  );
}

/** Mehrere Updates zum selben Objekt als ein Bündel – die Aktion darin steht vorn */
function Buendel({ g, h, fuehrend }: { g: InboxGruppe; h: Handlungen; fuehrend: boolean }) {
  const [auf, setAuf] = useState(false);
  if (g.eintraege.length === 1 && !g.zusammenfassung) return <Eintrag e={g.eintraege[0]} h={h} fuehrend={fuehrend} />;
  const updates = g.eintraege.reduce((s, e) => s + e.anzahl, 0);
  const rest = g.eintraege.filter((e) => e !== g.aktion);
  return (
    <li className={`mm-inbox-buendel mm-inbox-eintrag--${g.stufe}`}>
      <div className="mm-inbox-kopf">
        <span className="mm-inbox-titel">{g.titel}</span>
        <Meta>{updates === 1 ? '1 Update' : `${updates} Updates`}</Meta>
      </div>
      <p className="mm-inbox-text">{g.zusammenfassung}</p>
      {g.aktion && (
        <>
          <p className="mm-inbox-hervor">{g.aktion.stufe === 'jetzt' ? 'Eine Sache ist dringend:' : 'Eine Sache braucht dich:'}</p>
          <ul className="mm-inbox-liste mm-inbox-liste--innen">
            <Eintrag e={g.aktion} h={h} fuehrend={fuehrend} />
          </ul>
        </>
      )}
      {rest.length > 0 && (
        <>
          <button type="button" className="mm-inbox-mehr" aria-expanded={auf} onClick={() => setAuf(!auf)}>
            <Icon name={auf ? 'hoch' : 'runter'} size={16} /> {auf ? 'Weniger zeigen' : g.aktion ? 'Übrige Updates zeigen' : 'Updates zeigen'}
          </button>
          {auf && (
            <ul className="mm-inbox-liste mm-inbox-liste--innen">
              {rest.map((e) => (
                <Eintrag key={e.schluessel} e={e} h={h} fuehrend={false} />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

/** „Zur Kenntnis“: deutlich ruhiger – eine Zeile, Zeit, leises Ausblenden. Verschwindet ohnehin von selbst. */
function KenntnisZeile({ g, h }: { g: InboxGruppe; h: Handlungen }) {
  const e = g.eintraege[0];
  const mehrere = g.eintraege.length > 1 || !!g.zusammenfassung;
  const ziel = g.eintraege.find((x) => x.pfad);
  return (
    <li className="mm-inbox-kenntnis">
      <button type="button" className="mm-inbox-kenntnis-text" onClick={() => ziel && h.oeffnen(ziel)} disabled={!ziel}>
        <span className="mm-inbox-kenntnis-titel">{mehrere ? g.titel : e.titel}</span>
        <span className="mm-meta">{[mehrere ? g.zusammenfassung : e.text, zeitText(g.zeit)].filter(Boolean).join(' · ')}</span>
      </button>
      {g.eintraege.every((x) => x.quelle.typ === 'meldung') && (
        <button type="button" className="mm-inbox-weg" aria-label={`„${mehrere ? g.titel : e.titel}“ ausblenden`} onClick={() => g.eintraege.forEach((x) => h.erledigt(x))}>
          <Icon name="x" size={18} />
        </button>
      )}
    </li>
  );
}

function Bereich({ titel, anzahl, children, ruhig }: { titel: string; anzahl: number; children: React.ReactNode; ruhig?: boolean }) {
  if (!anzahl) return null;
  return (
    <section className={`mm-inbox-bereich ${ruhig ? 'mm-inbox-bereich--ruhig' : ''}`} aria-label={titel}>
      <h3 className="mm-inbox-bereich-titel">
        {titel} <span className="mm-meta">{anzahl}</span>
      </h3>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ Inbox

export function InboxListe({ onNavigiert }: { onNavigiert?: () => void }) {
  const { inbox, ich } = useInbox();
  const h = useHandlungen(ich, onNavigiert);
  const [aktivitaetAuf, setAktivitaetAuf] = useState(false);
  const [spaeterAuf, setSpaeterAuf] = useState(false);
  const wichtig = [...inbox.jetzt, ...inbox.aktion];
  const leer = !wichtig.length && !inbox.info.length;
  const erste = wichtig[0]?.schluessel;

  return (
    <Stapel abstand={24}>
      {leer ? (
        <Leer
          skizze="erledigt"
          icon="check"
          titel="Alles erledigt"
          text="Aktuell braucht nichts deine Aufmerksamkeit. Was passiert ist, steht im Verlauf des jeweiligen Auftrags oder Kunden."
        />
      ) : (
        <>
          <Bereich titel="Jetzt" anzahl={inbox.jetzt.length}>
            <ul className="mm-inbox-liste">
              {inbox.jetzt.map((g) => (
                <Buendel key={g.schluessel} g={g} h={h} fuehrend={g.schluessel === erste} />
              ))}
            </ul>
          </Bereich>
          <Bereich titel="Aktion nötig" anzahl={inbox.aktion.length}>
            <ul className="mm-inbox-liste">
              {inbox.aktion.map((g) => (
                <Buendel key={g.schluessel} g={g} h={h} fuehrend={g.schluessel === erste} />
              ))}
            </ul>
          </Bereich>
          <Bereich titel="Zur Kenntnis" anzahl={inbox.info.length} ruhig>
            <ul className="mm-inbox-liste mm-inbox-liste--ruhig">
              {inbox.info.map((g) => (
                <KenntnisZeile key={g.schluessel} g={g} h={h} />
              ))}
            </ul>
          </Bereich>
        </>
      )}

      {inbox.weitereHinweise > 0 && (
        <Button variante="tertiaer" to="/heute/braucht-dich" onClick={onNavigiert}>
          {inbox.weitereHinweise === 1 ? '1 weiterer Punkt im Team' : `${inbox.weitereHinweise} weitere Punkte im Team`} in „Braucht dich“
        </Button>
      )}
      {(inbox.spaeter.length > 0 || inbox.aktivitaet.length > 0) && (
        <div className="mm-inbox-fuss">
          {inbox.spaeter.length > 0 && (
            <div>
              <button type="button" className="mm-inbox-mehr" aria-expanded={spaeterAuf} onClick={() => setSpaeterAuf(!spaeterAuf)}>
                <Icon name="uhr" size={16} /> Zurückgestellt ({inbox.spaeter.length})
              </button>
              {spaeterAuf && (
                <ul className="mm-inbox-liste mm-inbox-liste--ruhig">
                  {inbox.spaeter.map((e) => (
                    <li key={e.schluessel} className="mm-inbox-kenntnis">
                      <span className="mm-inbox-kenntnis-text">
                        <span className="mm-inbox-kenntnis-titel">{e.titel}</span>
                        <span className="mm-meta">Kommt wieder, wenn es dann noch offen ist</span>
                      </span>
                      <Button variante="tertiaer" klein onClick={() => h.zurueckholen(e)}>
                        Jetzt zeigen
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {inbox.aktivitaet.length > 0 && (
            <div>
              <button type="button" className="mm-inbox-mehr" aria-expanded={aktivitaetAuf} onClick={() => setAktivitaetAuf(!aktivitaetAuf)}>
                Letzte Aktivitäten ({inbox.aktivitaet.length}) <Icon name={aktivitaetAuf ? 'hoch' : 'weiter'} size={16} />
              </button>
              {aktivitaetAuf && (
                <ul className="mm-inbox-liste mm-inbox-liste--ruhig">
                  {inbox.aktivitaet.map((e) => (
                    <li key={e.schluessel} className="mm-inbox-kenntnis mm-inbox-kenntnis--leise">
                      <button type="button" className="mm-inbox-kenntnis-text" onClick={() => h.oeffnen(e)} disabled={!e.pfad}>
                        <span className="mm-inbox-kenntnis-titel">{e.titel}</span>
                        <span className="mm-meta">{zeitText(e.zeit)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </Stapel>
  );
}
