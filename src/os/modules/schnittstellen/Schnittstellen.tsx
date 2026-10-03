import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { darf, useIch } from '@core/session';
import { Abschnitt, Button, Dialog, FensterSkizze, Karte, Leer, Meldung, Meta, Raster, Seite, Stapel, Status, Textfeld, Zeile, useToast, type GlasIconName } from '@ui/index';
import { connectoren, KATEGORIEN, VERBINDUNGSART, ZUSTAND_LABEL, ZUSTAND_TON, type Connector, type Kategorie } from './connectoren';
import { anfrage, anfrageSenden, anfrageSpeichern } from './anfragen';

/** Glas-Icon je Verbindung für die Fenster-Skizze; sonst das Icon des Bereichs. */
const CONNECTOR_ICON: Partial<Record<string, GlasIconName>> = {
  kontoauszug: 'liste',
  bankverbindung: 'rechnung',
  datev: 'rechner',
  lexware: 'ordner',
  datanorm: 'lager',
  'ids-connect': 'einkauf',
  oci: 'suche',
  ugl: 'dokument',
  'shk-connect': 'werkzeug',
  gaeb: 'vorlagen',
  kalenderdatei: 'kalender',
  'google-kalender': 'wiederholen',
  'microsoft-kalender': 'bildschirm',
  email: 'mail',
  telefon: 'telefon',
  json: 'import',
  webhooks: 'stecker',
  api: 'link',
};

const iconFuer = (c: Connector): GlasIconName => CONNECTOR_ICON[c.id] ?? KATEGORIE_ICON[c.kategorie];

/** Markenlogo der Verbindung (Google Kalender, DATEV …) – so erkennt man das Programm auf einen Blick */
const logoFuer = (c: Connector) => (c.logo ? `/logos/integrationen/${c.logo}` : undefined);

/** Glas-Icon je Bereich (Ausweich für Verbindungen ohne eigenes Icon). */
const KATEGORIE_ICON: Record<Kategorie, GlasIconName> = {
  banking: 'rechnung',
  buchhaltung: 'rechner',
  grosshandel: 'lager',
  ausschreibung: 'liste',
  kalender: 'kalender',
  kommunikation: 'mail',
  plattform: 'stecker',
  ablage: 'ordner',
  vertrieb: 'person',
  daten: 'import',
};

/**
 * Integration Hub: ruhige Kartenliste „Verbinden“ – Technisches steht hinter „Weitere Optionen“.
 * Was noch nicht gebaut ist, verbindet man per Anfrage: „Verbinden“ öffnet „Anfrage senden“.
 */
export function Schnittstellen() {
  useDatenstand();
  const ich = useIch();
  const [offen, setOffen] = useState<Connector>();
  const sichtbar = connectoren().filter((c) => !c.recht || darf(c.recht, ich));
  const gruppen = KATEGORIEN.map((k) => ({
    ...k,
    liste: sichtbar.filter((c) => c.kategorie === k.id).sort((a, b) => Number(b.verfuegbar) - Number(a.verfuegbar)),
  })).filter((g) => g.liste.length);

  return (
    <Seite
      titel="Schnittstellen"
      untertitel={`Verbinde Macher mit deinen anderen Programmen – ${sichtbar.length} Integrationen. Fehlt dir eine Verbindung, sende uns eine Anfrage: Wir richten sie für dich ein.`}
    >
      <Stapel abstand={32}>
        {!gruppen.length && <Leer titel="Keine Verbindungen für dich" text="Verbindungen zu Bank, Buchhaltung und Großhandel richtet das Büro ein." icon="stecker" />}
        {gruppen.map((g) => (
          <Abschnitt key={g.id} titel={g.titel} hinweis={g.text}>
            <Raster min={280}>
              {g.liste.map((c) => (
                <ConnectorKarte key={c.id} c={c} onMehr={() => setOffen(c)} />
              ))}
            </Raster>
          </Abschnitt>
        ))}
      </Stapel>
      <ConnectorDialog c={offen} onSchliessen={() => setOffen(undefined)} />
    </Seite>
  );
}

function ConnectorKarte({ c, onMehr }: { c: Connector; onMehr: () => void }) {
  const s = c.status();
  return (
    <Karte titel={c.titel} oberzeile={VERBINDUNGSART[c.art].titel}>
      <Stapel abstand={12}>
        <span className="mm-fenster" aria-hidden>
          <FensterSkizze icon={iconFuer(c)} logo={logoFuer(c)} />
        </span>
        <Meta>{c.text}</Meta>
        <div>
          <Status ton={ZUSTAND_TON[s.zustand]}>{ZUSTAND_LABEL[s.zustand]}</Status>
          {s.zustand !== 'geplant' && <Meta>{s.text}</Meta>}
        </div>
        <Zeile>
          {c.verfuegbar && c.pfad && c.aktion && (
            <Button klein variante="sekundaer" to={c.pfad}>
              {c.aktion}
            </Button>
          )}
          {!c.verfuegbar && (
            <Button klein variante="sekundaer" icon="link" onClick={onMehr}>
              {s.zustand === 'angefragt' ? 'Anfrage ansehen' : 'Verbinden'}
            </Button>
          )}
          {!c.verfuegbar && c.pfad && c.aktion && (
            <Button klein variante="tertiaer" to={c.pfad}>
              {c.aktion}
            </Button>
          )}
          {c.verfuegbar && (
            <Button klein variante="tertiaer" onClick={onMehr}>
              Weitere Optionen
            </Button>
          )}
        </Zeile>
      </Stapel>
    </Karte>
  );
}

function ConnectorDialog({ c, onSchliessen }: { c: Connector | undefined; onSchliessen: () => void }) {
  if (!c) return null;
  if (!c.verfuegbar) return <AnfrageDialog key={c.id} c={c} onSchliessen={onSchliessen} />;
  const s = c.status();
  return (
    <Dialog
      offen={!!c}
      onSchliessen={onSchliessen}
      titel={c.titel}
      aktionen={
        c.pfad && c.aktion ? (
          <Button to={c.pfad} onClick={onSchliessen}>
            {c.aktion}
          </Button>
        ) : (
          <Button variante="sekundaer" onClick={onSchliessen}>
            Schließen
          </Button>
        )
      }
    >
      <Stapel>
        <span className="mm-fenster" aria-hidden>
          <FensterSkizze icon={iconFuer(c)} logo={logoFuer(c)} />
        </span>
        <p>{c.text}</p>
        <div>
          <Status ton={ZUSTAND_TON[s.zustand]}>{ZUSTAND_LABEL[s.zustand]}</Status>
          <Meta>{s.text}</Meta>
        </div>
        <Abschnitt titel="Was geht damit">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {c.faehigkeiten.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Abschnitt>
        <Abschnitt titel={`Verbindung: ${VERBINDUNGSART[c.art].titel}`}>
          <Meta>{VERBINDUNGSART[c.art].text}</Meta>
        </Abschnitt>
        {c.technik && c.technik.length > 0 && (
          <details>
            <summary>Technische Angaben</summary>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {c.technik.map((t) => (
                <li key={t}>
                  <Meta>{t}</Meta>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Stapel>
    </Dialog>
  );
}

/** Verbinden, was es noch nicht gibt: Anfrage mit kurzer Notiz – gespeichert im Betrieb und per E-Mail an uns */
function AnfrageDialog({ c, onSchliessen }: { c: Connector; onSchliessen: () => void }) {
  const toast = useToast();
  const vorher = anfrage(c.id);
  const [notiz, setNotiz] = useState(vorher?.notiz ?? '');
  const s = c.status();

  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const senden = async () => {
    setLaedt(true);
    setFehler(undefined);
    const e = await anfrageSenden(c.titel, notiz);
    setLaedt(false);
    if (e.ok) {
      anfrageSpeichern(c.id, c.titel, notiz);
      toast(`Anfrage für ${c.titel} gesendet – wir melden uns bei dir.`);
      return onSchliessen();
    }
    if (e.fehler) return setFehler(`${e.fehler} Deine Notiz bleibt erhalten – versuch es gleich noch einmal.`);
    // Versand nicht eingerichtet: Mail-Programm mit fertiger E-Mail
    anfrageSpeichern(c.id, c.titel, notiz);
    window.location.href = e.mailto;
    toast(`Anfrage für ${c.titel} gespeichert – sende die E-Mail in deinem Mail-Programm ab.`);
    onSchliessen();
  };

  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={/verbinden$/i.test(c.titel) ? c.titel : `${c.titel} verbinden`}
      aktionen={
        <>
          <Button variante="sekundaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button icon="mail" onClick={senden} laedt={laedt} laedtText="Wird gesendet …">
            {vorher ? 'Anfrage erneut senden' : 'Anfrage senden'}
          </Button>
        </>
      }
    >
      <Stapel>
        <p>{c.text}</p>
        <div>
          <Status ton={ZUSTAND_TON[s.zustand]}>{ZUSTAND_LABEL[s.zustand]}</Status>
          <Meta>
            {vorher
              ? s.text
              : 'Diese Verbindung richten wir auf Anfrage ein. Wir schauen sie uns an, bauen sie und melden uns, sobald du verbinden kannst.'}
          </Meta>
        </div>
        <Textfeld
          label="Wofür brauchst du die Verbindung?"
          optional
          hilfe="Zum Beispiel: „Anfragen aus unserem Gmail-Postfach sollen am Auftrag landen.“"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
        />
        {fehler && (
          <Meldung ton="achtung" titel="Anfrage nicht gesendet">
            {fehler}
          </Meldung>
        )}
        <Meta>Die Anfrage geht direkt an unser Integrationsteam – mit Betriebsname und Kontakt, ohne weitere Daten.</Meta>
      </Stapel>
    </Dialog>
  );
}
