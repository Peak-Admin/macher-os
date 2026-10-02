import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { datum } from '@core/format';
import { useDarf } from '@core/session';
import { AktionsMenue, Button, Checkbox, Dialog, Eingabe, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, useBestaetigen, useToast } from '@ui/index';
import { ereignissePruefen, urlPruefen, webhookQuelle, zustellungText, type WebhookAbo } from './webhooks';

/** Webhooks einrichten – gegen die Schnittstelle `WebhookQuelle` (siehe webhooks.ts) */
export function Webhooks() {
  useDatenstand();
  const admin = useDarf('admin');
  const toast = useToast();
  const [fragen, bestaetigen] = useBestaetigen();
  const [neu, setNeu] = useState(false);
  const [geheimnis, setGeheimnis] = useState<string>();
  if (!admin) return <Seite titel="Webhooks"><Leer titel="Nur mit dem Recht „Einstellungen“" text="Webhooks richtet ein, wer die Einstellungen verwalten darf." icon="schloss" /></Seite>;

  const q = webhookQuelle();
  const abos = q.abos();
  const katalog = q.katalog();
  const titel = (typ: string) => (typ === '*' ? 'Alle Ereignisse' : katalog.find((k) => k.typ === typ)?.titel ?? typ);

  const entfernen = async (a: WebhookAbo) => {
    if (!(await fragen('Webhook entfernen?', `${a.url} bekommt danach keine Nachrichten mehr.`, 'Entfernen'))) return;
    q.entfernen(a.id);
    toast('Webhook entfernt.');
  };

  return (
    <Seite
      titel="Webhooks"
      untertitel="Ein anderes Programm erfährt sofort, wenn in Macher etwas passiert."
      zurueck={{ to: '/betrieb/schnittstellen', label: 'Schnittstellen' }}
      aktion={<Button onClick={() => setNeu(true)}>Webhook hinzufügen</Button>}
    >
      <Stapel>
        {!q.zustellungAktiv() && abos.length > 0 && <Meldung>{zustellungText(q)}. Deine Einstellungen bleiben gespeichert.</Meldung>}
        {geheimnis && (
          <Meldung ton="erfolg" titel="Geheimnis jetzt kopieren" aktion={<Button klein variante="sekundaer" onClick={() => (void navigator.clipboard?.writeText(geheimnis), toast('Kopiert.'))}>Kopieren</Button>}>
            Damit prüft das andere Programm, dass die Nachricht wirklich von Macher kommt. Es wird nur dieses eine Mal angezeigt:
            <br />
            <code style={{ wordBreak: 'break-all' }}>{geheimnis}</code>
          </Meldung>
        )}
        <Liste
          leer={
            <Leer
              titel="Noch kein Webhook"
              text="Trag die Adresse deines Programms ein und wähl, worüber es Bescheid bekommen soll – z. B. „Rechnung bezahlt“."
              icon="stecker"
              aktion={<Button variante="sekundaer" onClick={() => setNeu(true)}>Webhook hinzufügen</Button>}
            />
          }
        >
          {abos.map((a) => (
            <ListenZeile
              key={a.id}
              titel={a.beschreibung || new URL(a.url).host}
              untertitel={`${a.url} · ${a.ereignisse.map(titel).join(', ')}${a.letzteZustellung ? ` · zuletzt ${datum(a.letzteZustellung.am)} ${a.letzteZustellung.ok ? 'zugestellt' : `fehlgeschlagen${a.letzteZustellung.fehler ? ` (${a.letzteZustellung.fehler})` : ''}`}` : ''}`}
              rechts={
                <>
                  <Status ton={!a.aktiv ? 'neutral' : a.letzteZustellung && !a.letzteZustellung.ok ? 'achtung' : 'erfolg'}>{!a.aktiv ? 'Pausiert' : a.letzteZustellung && !a.letzteZustellung.ok ? 'Fehler' : 'Aktiv'}</Status>
                  <AktionsMenue
                    klein
                    aktionen={[
                      { label: a.aktiv ? 'Pausieren' : 'Wieder aktivieren', onClick: () => q.aendern(a.id, { aktiv: !a.aktiv }) },
                      { label: 'Entfernen', icon: 'muell', onClick: () => void entfernen(a) },
                    ]}
                  />
                </>
              }
            />
          ))}
        </Liste>
        <details>
          <summary>So kommen die Nachrichten an</summary>
          <Meta>
            POST mit JSON {'{ id, typ, zeitpunkt, objekt: { typ, id }, daten }'}. Kopfzeilen: x-macher-ereignis (z. B. rechnung.bezahlt) und x-macher-signatur: sha256=HMAC-SHA256(Geheimnis, Inhalt). Dein Programm antwortet mit 2xx, damit die Zustellung als erfolgreich gilt.
          </Meta>
        </details>
      </Stapel>
      {bestaetigen}
      <NeuDialog
        offen={neu}
        onSchliessen={() => setNeu(false)}
        onAngelegt={(g) => {
          setGeheimnis(g);
          setNeu(false);
          toast('Webhook angelegt.', { ton: 'erfolg' });
        }}
      />
    </Seite>
  );
}

function NeuDialog({ offen, onSchliessen, onAngelegt }: { offen: boolean; onSchliessen: () => void; onAngelegt: (geheimnis: string) => void }) {
  const q = webhookQuelle();
  const katalog = q.katalog();
  const [url, setUrl] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [gewaehlt, setGewaehlt] = useState<string[]>(['rechnung.bezahlt']);
  const [fehler, setFehler] = useState<{ url?: string; ereignisse?: string }>({});
  const gruppen = [...new Set(katalog.map((k) => k.gruppe))];
  const umschalten = (typ: string, an: boolean) => setGewaehlt((g) => (an ? [...g, typ] : g.filter((x) => x !== typ)));

  const speichern = () => {
    const f = { url: urlPruefen(url), ereignisse: ereignissePruefen(gewaehlt, katalog) };
    setFehler(f);
    if (f.url || f.ereignisse) return;
    const { geheimnis } = q.anlegen({ url, ereignisse: gewaehlt, beschreibung });
    setUrl('');
    setBeschreibung('');
    setGewaehlt(['rechnung.bezahlt']);
    onAngelegt(geheimnis);
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Webhook hinzufügen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Webhook anlegen</Button>
        </>
      }
    >
      <Stapel>
        <Eingabe label="Adresse deines Programms" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} fehler={fehler.url} autoFocus />
        <Eingabe label="Wofür?" optional placeholder="z. B. Buchhaltung, Zapier" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
        <Stapel abstand={8}>
          <strong>Worüber soll es Bescheid bekommen?</strong>
          {fehler.ereignisse && <Meldung ton="achtung">{fehler.ereignisse}</Meldung>}
          {gruppen.map((g) => (
            <Stapel key={g} abstand={4}>
              <Meta>{g}</Meta>
              {katalog
                .filter((k) => k.gruppe === g)
                .map((k) => (
                  <Checkbox key={k.typ} label={k.titel} checked={gewaehlt.includes(k.typ)} onChange={(an) => umschalten(k.typ, an)} />
                ))}
            </Stapel>
          ))}
        </Stapel>
      </Stapel>
    </Dialog>
  );
}
