import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { darf, useIch } from '@core/session';
import { Abschnitt, Button, Dialog, FensterSkizze, Karte, Leer, Meta, Raster, Seite, Stapel, Status, Zeile, type GlasIconName } from '@ui/index';
import { connectoren, KATEGORIEN, VERBINDUNGSART, ZUSTAND_LABEL, ZUSTAND_TON, type Connector, type Kategorie } from './connectoren';

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

/** Glas-Icon je Bereich (Ausweich für Verbindungen ohne eigenes Icon). */
const KATEGORIE_ICON: Record<Kategorie, GlasIconName> = {
  banking: 'rechnung',
  buchhaltung: 'rechner',
  grosshandel: 'lager',
  ausschreibung: 'liste',
  kalender: 'kalender',
  kommunikation: 'mail',
  plattform: 'stecker',
};

/** Integration Hub: ruhige Kartenliste „Verbinden“ – Technisches steht hinter „Weitere Optionen“ */
export function Schnittstellen() {
  useDatenstand();
  const ich = useIch();
  const [offen, setOffen] = useState<Connector>();
  const sichtbar = connectoren().filter((c) => !c.recht || darf(c.recht, ich));
  const gruppen = KATEGORIEN.map((k) => ({
    ...k,
    liste: sichtbar.filter((c) => c.kategorie === k.id).sort((a, b) => Number(b.verfuegbar) - Number(a.verfuegbar)),
  })).filter((g) => g.liste.length);
  const verfuegbar = sichtbar.filter((c) => c.verfuegbar).length;

  return (
    <Seite titel="Schnittstellen" untertitel={`Verbinde Macher mit deinen anderen Programmen. ${verfuegbar} von ${sichtbar.length} gehen schon – wir sagen ehrlich, was noch kommt.`}>
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
          <FensterSkizze icon={iconFuer(c)} />
        </span>
        <Meta>{c.text}</Meta>
        <div>
          <Status ton={ZUSTAND_TON[s.zustand]}>{ZUSTAND_LABEL[s.zustand]}</Status>
          <Meta>{s.text}</Meta>
        </div>
        <Zeile>
          {c.pfad && c.aktion && (
            <Button klein variante={c.verfuegbar ? 'sekundaer' : 'tertiaer'} to={c.pfad}>
              {c.aktion}
            </Button>
          )}
          <Button klein variante="tertiaer" onClick={onMehr}>
            {c.verfuegbar ? 'Weitere Optionen' : 'Mehr erfahren'}
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}

function ConnectorDialog({ c, onSchliessen }: { c: Connector | undefined; onSchliessen: () => void }) {
  if (!c) return null;
  const s = c.status();
  return (
    <Dialog
      offen={!!c}
      onSchliessen={onSchliessen}
      titel={c.titel}
      aktionen={
        c.pfad && c.aktion && c.verfuegbar ? (
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
          <FensterSkizze icon={iconFuer(c)} />
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
