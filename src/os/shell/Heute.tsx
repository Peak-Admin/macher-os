/**
 * Heute: öffnen und sofort wissen, was ansteht. Höchstens drei Blöcke, je nach Rolle:
 * - Monteur: eigener Einsatz · Dein Tag · Braucht deine Entscheidung
 * - Inhaber: (laufender eigener Einsatz) · Braucht deine Entscheidung · Heute im Betrieb · Dein Tag
 * - Büro: Eingang · Einplanen · Braucht deine Entscheidung
 * Solange der Start nicht geschafft ist, steht „Dein Start“ (3 Haken) bei Inhaber und Büro ganz oben.
 * Leere Blöcke zeigen immer einen konkreten nächsten Schritt – nie eine leere Fläche.
 * Listen zeigen höchstens drei Einträge und einen klar benannten Weg zur vollständigen Liste.
 * Die Begrüßung ist eine Zeile. Navigation und Rechte bleiben für alle gleich.
 */
import { useState, type ReactNode } from 'react';
import { useDatenstand } from '@core/db';
import { heute } from '@core/format';
import { offeneHinweise } from '@core/macher';
import { modul } from '@core/modul';
import { darf, useIch } from '@core/session';
import type { Mitarbeiter, Termin } from '@core/objects';
import { Button, Leer, Liste, Meldung, Meta } from '@ui/index';
import { HinweisZeile } from '@modules/braucht-dich/BrauchtDich';
import { EinsatzKurz } from '@modules/naechster-einsatz/Einsatz';
import { laeuft, naechsterEinsatz } from '@modules/naechster-einsatz/logik';
import { aufgabenFuer, gruss, termineAm } from '@modules/mein-tag/logik';
import { AufgabeZeile, TerminZeile } from '@modules/mein-tag/teile';
import { AnfrageZeile } from '@modules/anfragen/AnfragenListe';
import { offeneAnfragen } from '@modules/anfragen/daten';
import { QualiDialog } from '@modules/anfragen/Qualifizieren';
import type { ID } from '@core/objects';
import { useOffen, OffenEintraege } from '@modules/offen/OffenListe';
import { StartKarte, useStartHaken } from '@modules/start/StartKarte';

const VORSCHAU = 3;
const tagFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function Block({ titel, alle, children }: { titel: string; alle?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="mm-heute-block" aria-label={titel}>
      <h2 className="mm-heute-blocktitel">{titel}</h2>
      {children}
      {alle && (
        <div>
          <Button variante="tertiaer" klein to={alle.to} icon="pfeilRechts">
            {alle.label}
          </Button>
        </div>
      )}
    </section>
  );
}

export function HeuteSeite() {
  useDatenstand();
  const ich = useIch();
  const startOffen = useStartHaken().some((h) => !h.erledigt);
  if (!ich) return <Leer titel="Niemand angemeldet" text="Wähle oben rechts im Profil, wer du bist." icon="person" />;
  const rolle = ich.rolle;
  const einsatz = naechsterEinsatz(ich.id);

  let bloecke: ReactNode[];
  if (rolle === 'chef') {
    bloecke = [
      einsatz && laeuft(einsatz) ? <EinsatzKurz key="e" t={einsatz} /> : null,
      startOffen && darf('geld') ? <StartKarte key="s" /> : null,
      <Entscheidungen key="h" ich={ich} immer />,
      <BetriebHeute key="b" />,
      <DeinTag key="t" ich={ich} ohne={einsatz} />,
    ];
  } else if (rolle === 'buero') {
    bloecke = [einsatz && laeuft(einsatz) ? <EinsatzKurz key="e" t={einsatz} /> : null, startOffen && darf('geld') ? <StartKarte key="s" /> : null, <Eingang key="a" />, <Einplanen key="o" />, <Entscheidungen key="h" ich={ich} immer />];
  } else {
    bloecke = [
      einsatz ? <EinsatzKurz key="e" t={einsatz} /> : <Meldung key="e" titel="Kein Einsatz geplant">In den nächsten zwei Wochen ist für dich nichts eingeplant. Frag im Büro, wenn du etwas erwartest.</Meldung>,
      <DeinTag key="t" ich={ich} ohne={einsatz} />,
      <Entscheidungen key="h" ich={ich} />,
    ];
  }

  return (
    <div className="mm-seite mm-heute">
      <h1 className="mm-heute-gruss">
        {gruss()}, {ich.vorname}. <span>{tagFormat.format(new Date())}</span>
      </h1>
      {/* höchstens drei Blöcke – leere Blöcke (null) zählen nicht */}
      {bloecke.filter(Boolean).slice(0, 3)}
    </div>
  );
}

/** Braucht deine Entscheidung: nur zugeordnete Themen, die drei wichtigsten. */
function Entscheidungen({ ich, immer }: { ich: Mitarbeiter; immer?: boolean }) {
  const liste = offeneHinweise({ rolle: ich.rolle, mitarbeiterId: ich.id });
  if (!liste.length) {
    return immer ? (
      <Block titel="Braucht deine Entscheidung">
        <Meldung ton="erfolg" titel="Nichts brennt.">
          Macher meldet sich hier, sobald etwas deine Entscheidung braucht.
        </Meldung>
      </Block>
    ) : null;
  }
  return (
    <Block titel="Braucht deine Entscheidung" alle={liste.length > VORSCHAU ? { to: '/heute/braucht-dich', label: `Alle ${liste.length} ansehen` } : undefined}>
      <Liste>
        {liste.slice(0, VORSCHAU).map((h) => (
          <HinweisZeile key={h.schluessel} h={h} kompakt />
        ))}
      </Liste>
    </Block>
  );
}

/** Dein Tag: die nächsten Termine und Aufgaben, höchstens drei */
function DeinTag({ ich, ohne }: { ich: Mitarbeiter; ohne?: Termin }) {
  const tag = heute();
  const termine = termineAm(tag, ich.id).filter((t) => t.id !== ohne?.id && t.status !== 'erledigt' && t.status !== 'abgesagt');
  const aufgaben = aufgabenFuer(ich.id, tag);
  const plaetze = Math.max(0, VORSCHAU - termine.length);
  return (
    <Block titel="Dein Tag" alle={{ to: '/heute/mein-tag', label: 'Alle Termine ansehen' }}>
      {termine.length || aufgaben.length ? (
        <Liste>
          {termine.slice(0, VORSCHAU).map((t) => (
            <TerminZeile key={t.id} t={t} />
          ))}
          {aufgaben.slice(0, plaetze).map((a) => (
            <AufgabeZeile key={a.id} a={a} tag={tag} />
          ))}
        </Liste>
      ) : (
        <>
          <Meta>Heute steht für dich sonst nichts an.</Meta>
          {darf('geld') && (
            <div>
              <Button variante="sekundaer" klein icon="dokument" to="/start/angebot">
                Angebot schreiben
              </Button>
            </div>
          )}
        </>
      )}
    </Block>
  );
}

/** Heute im Betrieb (Inhaber): was läuft, was ist noch unbesetzt */
function BetriebHeute() {
  const alle = termineAm(heute()).filter((t) => t.status !== 'abgesagt');
  const unbesetzt = alle.filter((t) => t.art !== 'intern' && t.mitarbeiterIds.length === 0);
  const laufen = alle.filter((t) => t.status === 'vor_ort' || t.status === 'unterwegs');
  const zeigen = [...unbesetzt, ...alle.filter((t) => !unbesetzt.includes(t))].slice(0, VORSCHAU);
  return (
    <Block titel="Heute im Betrieb" alle={{ to: '/plan/kalender', label: 'Plan öffnen' }}>
      {alle.length ? (
        <>
          <Meta>
            {alle.length === 1 ? '1 Termin' : `${alle.length} Termine`} · {laufen.length} {laufen.length === 1 ? 'läuft' : 'laufen'} gerade
            {unbesetzt.length ? ` · ${unbesetzt.length} ohne Mitarbeiter` : ''}
          </Meta>
          <Liste>
            {zeigen.map((t) => (
              <TerminZeile key={t.id} t={t} mitNamen />
            ))}
          </Liste>
        </>
      ) : (
        <Meta>Heute sind keine Termine im Betrieb geplant.</Meta>
      )}
    </Block>
  );
}

/** Büro: neue Anfragen */
function Eingang() {
  const offen = offeneAnfragen();
  const [wahl, setWahl] = useState<ID>();
  return (
    <Block titel="Eingang" alle={{ to: '/auftraege/anfragen', label: offen.length > VORSCHAU ? `Alle ${offen.length} Anfragen` : 'Zum Eingang' }}>
      {offen.length ? (
        <Liste>
          {offen.slice(0, VORSCHAU).map((a) => (
            <AnfrageZeile key={a.id} a={a} onWahl={setWahl} />
          ))}
        </Liste>
      ) : (
        <Meta>Keine neuen Anfragen.</Meta>
      )}
      {wahl && <QualiDialog auftragId={wahl} onSchliessen={() => setWahl(undefined)} />}
    </Block>
  );
}

/** Büro: Arbeit, die noch einen Termin braucht */
function Einplanen() {
  const offen = useOffen();
  if (!modul('offen') || !darf('planen')) return null;
  return (
    <Block titel="Noch einplanen" alle={{ to: '/plan/offen', label: offen.length > VORSCHAU ? `Alle ${offen.length} offenen` : 'Zum Einplanen' }}>
      {offen.length ? <OffenEintraege eintraege={offen} max={VORSCHAU} /> : <Meta>Alles ist eingeplant.</Meta>}
    </Block>
  );
}
