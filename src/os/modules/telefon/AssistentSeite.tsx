/**
 * Einstellungen des Telefonassistenten (unter Telefon & Empfang, kein eigener Menüpunkt) und der Probeanruf.
 * Jede Änderung gilt sofort (kein Speichern-Knopf). Bearbeiten nur mit dem Recht „Einstellungen“.
 */
import { useState } from 'react';
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { useDarf } from '@core/session';
import { AuswahlKarten, Button, Eingabe, IconButton, Karte, Liste, ListenZeile, Meldung, Meta, Schalter, Seite, Stapel, Status, Tabs, Textfeld, Zeile, ZahlEingabe, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { ANNAHME, FRAGEN, ERGEBNIS_TEXT, ansageText, frageVerschieben, geschaeftszeitenText, nimmtAn, stichworteAus, type AssistentKonfig } from './agent';
import { probeanruf } from './anbieter/simulator';
import { VERBINDUNG_KEY, aktuelleAgentDefinition, betriebsZeiten, useAssistentKonfig, vorschau, type Verbindung, type Vorschau } from './assistent';
import { AnrufFelder, DringlichkeitStatus, Transkript } from './KiAnruf';
import './telefon.css';

type Tab = 'einstellungen' | 'probe';

/** Arbeitszeit steht in den Betriebsdaten */
const ZEITEN_PFAD = '/betrieb/einstellungen';

function Regeln({ k, setze, gesperrt }: { k: AssistentKonfig; setze: (p: Partial<AssistentKonfig>) => void; gesperrt: boolean }) {
  const firma = db.betrieb.get('betrieb')?.name ?? '';
  const [begruessung, setBegruessung] = useState(k.begruessung);
  const zeiten = betriebsZeiten();
  const mitKlingeln = k.annahme === 'keiner' || k.annahme === 'ausserhalb_keiner';
  return (
    <Karte titel="Wann Lotte rangeht" icon="uhr">
      <Stapel abstand={16}>
        <Schalter label="Telefonassistent einschalten" beschreibung="Gilt, sobald deine Telefonnummer verbunden ist." checked={k.an} onChange={(an) => setze({ an })} disabled={gesperrt} />
        <AuswahlKarten label="Wann Lotte rangeht" wert={k.annahme} optionen={ANNAHME} onChange={(v) => !gesperrt && setze({ annahme: v as AssistentKonfig['annahme'] })} />
        {mitKlingeln && (
          <ZahlEingabe label="Nach wie vielen Sekunden Klingeln?" hilfe="Zwischen 5 und 60 Sekunden." wert={k.klingelSekunden} onWert={(n) => n && setze({ klingelSekunden: n })} disabled={gesperrt} />
        )}
        <Zeile zwischen>
          <Meta>Deine Geschäftszeiten: {geschaeftszeitenText(zeiten)}, Feiertage frei.</Meta>
          <Button klein variante="tertiaer" to={ZEITEN_PFAD}>
            Geschäftszeiten ändern
          </Button>
        </Zeile>
        <Textfeld
          label="Begrüßung"
          hilfe="{firma} wird durch deinen Firmennamen ersetzt. Der Hinweis, dass ein digitaler Assistent spricht, ist immer dabei."
          value={begruessung}
          rows={3}
          disabled={gesperrt}
          onChange={(e) => setBegruessung(e.target.value)}
          onBlur={() => setze({ begruessung })}
        />
        <Meta>So klingt es: „{ansageText(begruessung, firma)}“</Meta>
      </Stapel>
    </Karte>
  );
}

function Notfaelle({ k, setze, gesperrt }: { k: AssistentKonfig; setze: (p: Partial<AssistentKonfig>) => void; gesperrt: boolean }) {
  const [stichworte, setStichworte] = useState(k.notfallStichworte.join('\n'));
  const [nummer, setNummer] = useState(k.bereitschaft.nummer ?? '');
  return (
    <Karte titel="Notfälle und Bereitschaft" icon="achtung">
      <Stapel abstand={16}>
        <Textfeld
          label="Was gilt als Notfall?"
          hilfe="Ein Stichwort je Zeile. Fällt eins im Gespräch, geht der Anruf sofort an die Bereitschaft."
          value={stichworte}
          rows={5}
          disabled={gesperrt}
          onChange={(e) => setStichworte(e.target.value)}
          onBlur={() => setze({ notfallStichworte: stichworteAus(stichworte) })}
        />
        <MitarbeiterAuswahl
          label="Wer hat Bereitschaft?"
          optional
          wert={k.bereitschaft.mitarbeiterId}
          onChange={(id) => {
            if (gesperrt) return;
            const tel = db.mitarbeiter.get(id)?.telefon;
            const neu = nummer.trim() ? nummer : (tel ?? '');
            setNummer(neu);
            setze({ bereitschaft: { mitarbeiterId: id || undefined, nummer: neu.trim() || undefined } });
          }}
        />
        <Eingabe
          label="Weiterleitungsnummer"
          type="tel"
          inputMode="tel"
          optional
          hilfe="Hierhin stellt Lotte Notfälle durch. Ohne Nummer bekommt die Bereitschaft eine Mitteilung in Handwerk OS."
          value={nummer}
          disabled={gesperrt}
          onChange={(e) => setNummer(e.target.value)}
          onBlur={() => setze({ bereitschaft: { ...k.bereitschaft, nummer: nummer.trim() || undefined } })}
        />
      </Stapel>
    </Karte>
  );
}

function Fragen({ k, setze, gesperrt }: { k: AssistentKonfig; setze: (p: Partial<AssistentKonfig>) => void; gesperrt: boolean }) {
  return (
    <Karte titel="Was Lotte fragt" icon="chat">
      <Stapel abstand={8}>
        <Meta>In dieser Reihenfolge. Was der Anrufer schon gesagt hat, fragt Lotte nicht noch einmal.</Meta>
        <Liste>
          {k.fragen.map((f, i) => (
            <ListenZeile
              key={f.id}
              titel={FRAGEN[f.id].label}
              untertitel={f.an ? `„${FRAGEN[f.id].frage}“` : 'Wird nicht gefragt'}
              rechts={
                <>
                  {FRAGEN[f.id].pflicht ? (
                    <Status icon={false}>Immer</Status>
                  ) : (
                    <Button klein variante="tertiaer" disabled={gesperrt} onClick={() => setze({ fragen: k.fragen.map((x) => (x.id === f.id ? { ...x, an: !x.an } : x)) })}>
                      {f.an ? 'Nicht fragen' : 'Fragen'}
                    </Button>
                  )}
                  <span className="tel-fragen-knoepfe">
                    <IconButton icon="hoch" label={`${FRAGEN[f.id].label} nach oben`} disabled={gesperrt || i === 0} onClick={() => setze({ fragen: frageVerschieben(k.fragen, f.id, -1) })} />
                    <IconButton icon="runter" label={`${FRAGEN[f.id].label} nach unten`} disabled={gesperrt || i === k.fragen.length - 1} onClick={() => setze({ fragen: frageVerschieben(k.fragen, f.id, 1) })} />
                  </span>
                </>
              }
            />
          ))}
        </Liste>
      </Stapel>
    </Karte>
  );
}

const BEISPIEL =
  'Guten Tag, mein Name ist Eva Sommer. Bei uns im Keller ist ein Rohrbruch, das Wasser läuft, den Haupthahn habe ich zugedreht. Ahornweg 5, 34117 Kassel. Sie erreichen mich jederzeit unter 0171 2345678.';

function Probeanruf({ k }: { k: AssistentKonfig }) {
  const toast = useToast();
  const [nummer, setNummer] = useState('');
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();
  const [ergebnis, setErgebnis] = useState<(Vorschau & { transkript: ReturnType<typeof probeanruf>['transkript'] }) | undefined>();
  const jetzt = new Date();
  const annahme = nimmtAn({ ...k, an: true }, jetzt, betriebsZeiten());

  const durchspielen = () => {
    if (!text.trim()) return setFehler('Schreib auf, was der Anrufer sagt.');
    setFehler(undefined);
    const agent = aktuelleAgentDefinition(k);
    const e = probeanruf(text, agent, { von: nummer, jetzt });
    setErgebnis({ ...vorschau(e, k), transkript: e.transkript });
    toast('Probeanruf durchgespielt. Es wurde nichts gespeichert.');
  };

  const u = ergebnis?.u;
  return (
    <Stapel abstand={24}>
      <Karte titel="Probeanruf" icon="telefon">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            durchspielen();
          }}
        >
          <Stapel abstand={16}>
            <Meta>Schreib auf, was ein Anrufer sagen würde. Lotte zeigt dir, was sie daraus macht. Es wird nichts gespeichert.</Meta>
            <Eingabe label="Nummer des Anrufers" type="tel" inputMode="tel" optional value={nummer} onChange={(e) => setNummer(e.target.value)} placeholder="z. B. 0171 2345678" autoComplete="off" />
            <Textfeld label="Was sagt der Anrufer?" value={text} rows={5} fehler={fehler} onChange={(e) => setText(e.target.value)} placeholder="z. B. Hier ist Herr Kaya, unser Dachfenster ist undicht …" />
            <Zeile>
              <Button type="submit" icon="telefon">
                Probeanruf durchspielen
              </Button>
              <Button variante="tertiaer" onClick={() => setText(BEISPIEL)}>
                Beispiel einsetzen
              </Button>
            </Zeile>
          </Stapel>
        </form>
      </Karte>
      {ergebnis && u && (
        <Karte titel="Das würde im Eingang landen" icon="liste">
          <Stapel abstand={16}>
            <Zeile>
              <Status icon={false}>Von Lotte angenommen</Status>
              <DringlichkeitStatus d={u.dringlichkeit} immer />
              <Status ton={u.notfall ? 'gefahr' : 'neutral'}>{ERGEBNIS_TEXT[u.details.ergebnis ?? u.schritt]}</Status>
            </Zeile>
            <Meta>
              {ergebnis.kunde ? `Erkannt: ${ergebnis.kunde.name}` : u.schritt === 'anfrage' ? 'Unbekannte Nummer – Lotte legt den Kunden mit an.' : 'Unbekannte Nummer.'}
              {ergebnis.auftrag ? ` Wird an Auftrag ${ergebnis.auftrag.nummer} gehängt.` : ''}
              {u.notfall ? ` Notfall: ${u.notfallGrund}. Geht sofort an die Bereitschaft${k.bereitschaft.nummer ? ` (${k.bereitschaft.nummer})` : ''}.` : ''}
            </Meta>
            <AnrufFelder details={u.details} />
            <details className="tel-details" open>
              <summary>Gespräch ansehen</summary>
              <Transkript zeilen={ergebnis.transkript} />
            </details>
          </Stapel>
        </Karte>
      )}
      <Meta>Jetzt gerade: {annahme.annehmen ? `Lotte würde rangehen – ${annahme.grund.charAt(0).toLowerCase()}${annahme.grund.slice(1)}` : annahme.grund}</Meta>
    </Stapel>
  );
}

export function AssistentSeite() {
  const [k, setze] = useAssistentKonfig();
  const [verbindung] = useEinstellung<Verbindung | undefined>(VERBINDUNG_KEY, undefined);
  const darf = useDarf('admin');
  const [tab, setTab] = useState<Tab>('einstellungen');
  return (
    <Seite
      titel="Telefonassistent"
      zurueck={{ to: '/auftraege/telefon', label: 'Telefon & Empfang' }}
      untertitel="Lege fest, wann Lotte rangeht, was ein Notfall ist und was sie fragt."
      status={verbindung ? <Status ton="erfolg">Verbunden</Status> : <Status icon={false}>Kommt bald</Status>}
    >
      <Stapel abstand={24}>
        {!verbindung && (
          <Meldung titel="Noch nicht mit einer Telefonnummer verbunden">
            Kommt bald: Dann verbindest du hier deine Nummer, und Lotte nimmt Anrufe nach deinen Regeln an. Deine Einstellungen bleiben gespeichert. Mit dem Probeanruf siehst du schon heute, was Lotte eintragen würde.
          </Meldung>
        )}
        {!darf && <Meldung ton="achtung">Ändern darf nur, wer Einstellungen bearbeiten darf. Du kannst alles ansehen und den Probeanruf nutzen.</Meldung>}
        <Tabs
          aktiv={tab}
          onWechsel={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'einstellungen', titel: 'Einstellungen' },
            { id: 'probe', titel: 'Probeanruf' },
          ]}
        />
        {tab === 'einstellungen' ? (
          <>
            <Regeln k={k} setze={setze} gesperrt={!darf} />
            <Notfaelle k={k} setze={setze} gesperrt={!darf} />
            <Fragen k={k} setze={setze} gesperrt={!darf} />
          </>
        ) : (
          <Probeanruf k={k} />
        )}
      </Stapel>
    </Seite>
  );
}
