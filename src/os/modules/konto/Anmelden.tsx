/**
 * Anmelden ohne Passwort: E-Mail (Link + Code) oder Handynummer (Code per SMS).
 * Vollbild-Seiten `/anmelden` (Rücksprung aus dem E-Mail-Link, neues Gerät) und `/beitreten/:token` (Einladung).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { istEmail, supabaseCloud, useKontoZustand } from '@core/cloud-supabase';
import { useSyncStatus } from '@core/sync';
import { Button, Eingabe, Fortschritt, Karte, Laden, Leer, Meldung, Seite, Stapel } from '@ui/index';

export function AnmeldeFormular({ standard = 'egal' }: { standard?: 'telefon' | 'egal' }) {
  const c = supabaseCloud();
  const [eingabe, setEingabe] = useState('');
  const [code, setCode] = useState('');
  const [ziel, setZiel] = useState<string>();
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const email = istEmail(eingabe);

  if (!c) return <Meldung titel="Anmelden ist noch nicht verbunden">Deine Daten bleiben auf diesem Gerät.</Meldung>;

  async function anfordern() {
    setFehler(undefined);
    if (!eingabe.trim()) return setFehler(standard === 'telefon' ? 'Gib deine Handynummer ein.' : 'Gib deine E-Mail-Adresse oder Handynummer ein.');
    setLaedt(true);
    const r = await c!.anmelden(email ? { email: eingabe.trim() } : { telefon: eingabe.trim() });
    setLaedt(false);
    if (!r.ok) return setFehler(r.fehler);
    setZiel(eingabe.trim());
    setCode('');
  }

  async function bestaetigen() {
    setFehler(undefined);
    setLaedt(true);
    const r = await c!.codeBestaetigen(ziel!, code);
    setLaedt(false);
    if (!r.ok) setFehler(r.fehler);
  }

  if (ziel) {
    const perMail = istEmail(ziel);
    return (
      <form
        className="mm-stapel"
        style={{ gap: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          void bestaetigen();
        }}
      >
        <Meldung ton="aktiv" titel={perMail ? 'Schau in dein Postfach' : 'Code ist unterwegs'}>
          {perMail
            ? `Wir haben dir eine E-Mail an ${ziel} geschickt. Tipp auf den Link darin – oder gib hier den 6-stelligen Code aus der E-Mail ein.`
            : `Wir haben dir einen 6-stelligen Code per SMS an ${ziel} geschickt.`}
        </Meldung>
        <Eingabe
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fehler={fehler}
          autoFocus
        />
        <Button type="submit" breit laedt={laedt} laedtText="Wird geprüft …">
          Anmelden
        </Button>
        <Button type="button" variante="tertiaer" onClick={() => (setZiel(undefined), setFehler(undefined))}>
          {perMail ? 'Andere E-Mail-Adresse' : 'Andere Handynummer'}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="mm-stapel"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        void anfordern();
      }}
    >
      <Eingabe
        label={standard === 'telefon' ? 'Handynummer oder E-Mail-Adresse' : 'E-Mail-Adresse oder Handynummer'}
        hilfe="Kein Passwort nötig. Du bekommst einen Link oder Code."
        type="text"
        inputMode={standard === 'telefon' ? 'tel' : 'email'}
        autoComplete="username"
        value={eingabe}
        onChange={(e) => setEingabe(e.target.value)}
        fehler={fehler}
      />
      <Button type="submit" breit laedt={laedt} laedtText="Wird gesendet …">
        {!eingabe.trim() ? 'Weiter' : email ? 'Anmeldelink senden' : 'Code per SMS senden'}
      </Button>
    </form>
  );
}

/** Schlichter Rahmen ohne App-Navigation */
export function Vollbild({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--mm-canvas)', padding: '48px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>{children}</div>
    </main>
  );
}

function Uebernahme() {
  const s = useSyncStatus();
  if (s.uebernahme) return <Fortschritt wert={s.uebernahme.fertig} max={Math.max(1, s.uebernahme.gesamt)} label="Deine Daten werden gesichert" />;
  return <Laden text="Verbinde mit deinem Betrieb …" />;
}

/** Zustand nach dem Absenden: verbinden, fertig, kein Betrieb – gemeinsam für beide Vollbild-Seiten */
function NachAnmeldung({ weiter }: { weiter: () => void }) {
  const z = useKontoZustand();
  const betrieb = db.betrieb.useOne('betrieb');
  const bereit = z.phase === 'bereit' && !!betrieb?.onboardingFertig;
  useEffect(() => {
    if (bereit) weiter();
  }, [bereit, weiter]);
  if (z.phase === 'verbinde' || (z.phase === 'bereit' && !bereit)) return <Uebernahme />;
  if (z.phase === 'kein-betrieb')
    return (
      <Meldung titel="Zu diesem Konto gibt es noch keinen Betrieb" aktion={<Button to="/willkommen" klein>Betrieb einrichten</Button>}>
        Richte zuerst deinen Betrieb ein – oder lass dir von deinem Chef eine Einladung schicken.
      </Meldung>
    );
  return null;
}

export function AnmeldenSeite() {
  const z = useKontoZustand();
  const [suche] = useSearchParams();
  const navigate = useNavigate();
  const einladung = suche.get('einladung');
  useEffect(() => {
    if (einladung) supabaseCloud()?.einladungMerken(einladung);
  }, [einladung]);

  return (
    <Vollbild>
      <Seite titel="Anmelden" untertitel="Mit deinem Konto siehst du die Daten deines Betriebs auf jedem Gerät.">
        <Karte>
          {!z.konfiguriert ? (
            <Leer titel="Anmelden ist noch nicht verbunden" text="Deine Daten liegen auf diesem Gerät." aktion={<Button to="/">Zurück zur App</Button>} />
          ) : z.phase === 'abgemeldet' || z.phase === 'lokal' ? (
            <AnmeldeFormular />
          ) : (
            <Stapel>
              <NachAnmeldung weiter={() => navigate('/heute', { replace: true })} />
              {z.fehler && <Meldung ton="achtung">{z.fehler}</Meldung>}
            </Stapel>
          )}
        </Karte>
      </Seite>
    </Vollbild>
  );
}

export function BeitretenSeite() {
  const { token } = useParams();
  const z = useKontoZustand();
  const navigate = useNavigate();
  // Wer beim Öffnen schon angemeldet ist, nimmt die Einladung mit einem Tipp an
  // (wer erst auf dieser Seite anmeldet, nimmt sie automatisch mit der Anmeldung an)
  const [warAbgemeldet, setWarAbgemeldet] = useState(false);
  const [annehmen, setAnnehmen] = useState<'offen' | 'laeuft' | 'fertig'>('offen');
  const [fehler, setFehler] = useState<string>();
  const schonAngemeldet = !warAbgemeldet && (z.phase === 'bereit' || z.phase === 'kein-betrieb');
  useEffect(() => {
    if (z.phase !== 'abgemeldet') return;
    setWarAbgemeldet(true);
    if (token) supabaseCloud()?.einladungMerken(token);
  }, [token, z.phase]);

  async function jetztAnnehmen() {
    setAnnehmen('laeuft');
    setFehler(undefined);
    const r = await supabaseCloud()!.einladungAnnehmen(token!);
    setAnnehmen(r.ok ? 'fertig' : 'offen');
    if (!r.ok) setFehler(r.fehler);
  }

  return (
    <Vollbild>
      <Seite oberzeile="Einladung" titel="Willkommen im Team" untertitel="Melde dich mit deiner Handynummer an. Danach siehst du deine Einsätze und Aufträge.">
        <Karte>
          {!z.konfiguriert ? (
            <Leer titel="Einladungen sind noch nicht verbunden" text="Frag im Büro nach, wie du mitmachen kannst." />
          ) : schonAngemeldet && annehmen !== 'fertig' ? (
            <Stapel>
              <p>
                Du bist angemeldet als <strong>{z.konto?.email ?? z.konto?.telefon}</strong>. Mit der Einladung wechselt dieses Gerät in den
                Betrieb, der dich eingeladen hat. Deine bisherigen Daten hier werden vorher gesichert.
              </p>
              {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
              <Button breit laedt={annehmen === 'laeuft'} laedtText="Wird angenommen …" onClick={() => void jetztAnnehmen()}>
                Einladung annehmen
              </Button>
              <Button variante="tertiaer" to="/heute">
                Nicht jetzt
              </Button>
            </Stapel>
          ) : z.phase === 'abgemeldet' || z.phase === 'lokal' ? (
            <AnmeldeFormular standard="telefon" />
          ) : (
            <Stapel>
              <NachAnmeldung weiter={() => navigate('/heute', { replace: true })} />
              {z.fehler && <Meldung ton="achtung">{z.fehler}</Meldung>}
            </Stapel>
          )}
        </Karte>
      </Seite>
    </Vollbild>
  );
}
