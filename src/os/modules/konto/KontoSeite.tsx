/**
 * `/macher/konto` – Konto & Geräte. Drei Zustände:
 * nicht verbunden (Daten nur hier) · abgemeldet („Daten sichern & Team einladen“) · angemeldet (Status, Geräte, Abmelden).
 */
import { useCallback, useEffect, useState } from 'react';
import { db, exportieren, sicherungLesen } from '@core/db';
import { supabaseCloud, useKontoZustand } from '@core/cloud-supabase';
import { relativ } from '@core/format';
import { ROLLEN } from '@core/session';
import { useSyncStatus, type SyncStatus } from '@core/sync';
import { Button, Fortschritt, Karte, Laden, Liste, ListenZeile, Meldung, Seite, Stapel, Status, useBestaetigen, useToast } from '@ui/index';
import { AnmeldeFormular } from './Anmelden';

function herunterladen(daten: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const heute = () => new Date().toISOString().slice(0, 10);
const uhrzeit = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function syncText(s: SyncStatus): { ton: 'erfolg' | 'aktiv' | 'achtung' | 'neutral'; text: string } {
  if (s.uebernahme) return { ton: 'aktiv', text: 'Deine Daten werden gesichert …' };
  if (s.zustand === 'offline')
    return { ton: 'neutral', text: s.wartend ? `${s.wartend} ${s.wartend === 1 ? 'Änderung wartet' : 'Änderungen warten'} – du bist offline. Sobald du Netz hast, geht es automatisch weiter.` : 'Du bist offline. Neue Änderungen werden später abgeglichen.' };
  if (s.zustand === 'fehler') return { ton: 'achtung', text: 'Die Sicherung klemmt gerade. Macher versucht es automatisch weiter.' };
  if (s.zustand === 'sendet' || s.zustand === 'verbindet' || s.wartend) return { ton: 'aktiv', text: 'Wird gesichert …' };
  if (s.zustand === 'bereit') return { ton: 'erfolg', text: `Alles gesichert${s.zuletzt ? ` · zuletzt ${uhrzeit(s.zuletzt)}` : ''}` };
  return { ton: 'neutral', text: 'Abgleich ist aus.' };
}

function NichtVerbunden() {
  const toast = useToast();
  return (
    <Seite
      titel="Konto"
      untertitel="Deine Daten liegen nur in diesem Browser."
      aktion={
        <Button icon="download" onClick={() => (herunterladen(exportieren(), `macher-os-sicherung-${heute()}.json`), toast('Sicherung ist heruntergeladen.'))}>
          Sicherung herunterladen
        </Button>
      }
    >
      <Karte>
        <Stapel abstand={12}>
          <div>
            <Status ton="neutral">Nur auf diesem Gerät</Status>
          </div>
          <p>Konten, Team auf mehreren Geräten und echter Versand werden gerade verbunden. Bis dahin arbeitest du wie gewohnt hier – lade ab und zu eine Sicherung herunter.</p>
        </Stapel>
      </Karte>
    </Seite>
  );
}

function Abgemeldet() {
  return (
    <Seite titel="Daten sichern & Team einladen" untertitel="Leg dein Konto an – ohne Passwort. Danach sind deine Daten sicher und dein Team arbeitet auf seinen Handys mit.">
      <Stapel abstand={24}>
        <Karte titel="Konto anlegen oder anmelden">
          <AnmeldeFormular />
        </Karte>
        <Karte titel="Das passiert dabei">
          <ul className="mm-stapel" style={{ gap: 8, paddingLeft: 20, margin: 0 }}>
            <li>Deine bisherigen Daten aus diesem Browser werden einmal übernommen.</li>
            <li>Gespeichert wird auf Servern in Frankfurt. Nur dein Betrieb sieht sie.</li>
            <li>Du kannst offline weiterarbeiten. Abgeglichen wird, sobald du Netz hast.</li>
          </ul>
        </Karte>
      </Stapel>
    </Seite>
  );
}

function KeinBetrieb() {
  const z = useKontoZustand();
  const betrieb = db.betrieb.useOne('betrieb');
  const toast = useToast();
  const [laedt, setLaedt] = useState(false);
  return (
    <Seite titel="Konto" untertitel={z.konto?.email ?? z.konto?.telefon}>
      <Meldung
        titel="Zu deinem Konto gibt es noch keinen Betrieb"
        aktion={
          betrieb?.onboardingFertig ? (
            <Button
              klein
              laedt={laedt}
              onClick={async () => {
                setLaedt(true);
                const r = await supabaseCloud()!.sichern();
                setLaedt(false);
                if (r.ok) toast('Deine Daten sind gesichert.');
              }}
            >
              Daten jetzt sichern
            </Button>
          ) : (
            <Button klein to="/willkommen">
              Betrieb einrichten
            </Button>
          )
        }
      >
        Sichere deine Daten als neuen Betrieb – oder lass dir von deinem Chef eine Einladung schicken.
      </Meldung>
      {z.fehler && <Meldung ton="achtung">{z.fehler}</Meldung>}
    </Seite>
  );
}

type Geraet = { endpoint: string; geraet: string; seit: string; diesesGeraet: boolean };

function Angemeldet() {
  const z = useKontoZustand();
  const s = useSyncStatus();
  const c = supabaseCloud()!;
  const betrieb = db.betrieb.useOne('betrieb');
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const [geraete, setGeraete] = useState<Geraet[]>();
  const [geraeteFehler, setGeraeteFehler] = useState<string>();
  const [pushLaedt, setPushLaedt] = useState(false);
  const [pushFehler, setPushFehler] = useState<string>();

  const laden = useCallback(() => {
    c.geraete()
      .then((g) => (setGeraete(g), setGeraeteFehler(undefined)))
      .catch(() => setGeraeteFehler('Geräte konnten nicht geladen werden. Bist du offline?'));
  }, [c]);
  useEffect(laden, [laden]);

  const st = syncText(s);
  const hierAn = geraete?.some((g) => g.diesesGeraet);
  const rolle = ROLLEN.find((r) => r.id === z.konto?.rolle)?.label;

  async function pushEinschalten() {
    setPushFehler(undefined);
    setPushLaedt(true);
    const r = await c.pushEinschalten();
    setPushLaedt(false);
    if (!r.ok) return setPushFehler(r.fehler);
    toast('Benachrichtigungen sind auf diesem Gerät an.');
    laden();
  }

  return (
    <Seite
      titel="Konto"
      status={<Status ton={st.ton}>{st.ton === 'erfolg' ? 'Gesichert' : st.ton === 'achtung' ? 'Klemmt' : st.ton === 'aktiv' ? 'Wird gesichert' : 'Offline'}</Status>}
      aktion={
        !hierAn && geraete ? (
          <Button icon="glocke" laedt={pushLaedt} onClick={() => void pushEinschalten()}>
            Benachrichtigungen einschalten
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={24}>
        {pushFehler && <Meldung ton="achtung">{pushFehler}</Meldung>}
        <Karte
          titel="Dein Konto"
          aktion={
            <Button
              variante="sekundaer"
              klein
              onClick={async () => {
                if (s.wartend && !(await fragen('Wirklich abmelden?', `${s.wartend} Änderungen sind noch nicht gesichert. Sie bleiben auf diesem Gerät und werden nach der nächsten Anmeldung abgeglichen.`, 'Abmelden'))) return;
                await c.abmelden();
                toast('Du bist abgemeldet. Deine Daten bleiben auf diesem Gerät.');
              }}
            >
              Abmelden
            </Button>
          }
        >
          <Liste>
            <ListenZeile titel={z.konto?.email ?? z.konto?.telefon ?? 'Angemeldet'} untertitel={[betrieb?.name, rolle].filter(Boolean).join(' · ') || undefined} />
            <ListenZeile titel={st.text} untertitel={s.fehler && st.ton === 'achtung' ? s.fehler : undefined} />
          </Liste>
          {s.uebernahme && <Fortschritt wert={s.uebernahme.fertig} max={Math.max(1, s.uebernahme.gesamt)} label="Übernahme deiner Daten" />}
        </Karte>

        <Karte titel="Geräte mit Benachrichtigungen">
          {geraeteFehler ? (
            <Meldung>{geraeteFehler}</Meldung>
          ) : !geraete ? (
            <Laden />
          ) : (
            <Liste leer={<p className="mm-meta">Noch kein Gerät. Schalte Benachrichtigungen ein, dann erfährst du sofort, wenn dich etwas braucht.</p>}>
              {geraete.map((g) => (
                <ListenZeile
                  key={g.endpoint}
                  titel={g.diesesGeraet ? `${g.geraet} (dieses Gerät)` : g.geraet}
                  untertitel={`seit ${relativ(g.seit)}`}
                  rechts={
                    <Button
                      variante="tertiaer"
                      klein
                      onClick={async () => {
                        if (!(await fragen('Gerät entfernen?', 'Dieses Gerät bekommt dann keine Benachrichtigungen mehr.', 'Entfernen'))) return;
                        try {
                          await c.geraetEntfernen(g.endpoint);
                          toast('Gerät ist entfernt.');
                          laden();
                        } catch {
                          toast('Das hat nicht geklappt. Bist du offline?', { ton: 'achtung' });
                        }
                      }}
                    >
                      Entfernen
                    </Button>
                  }
                />
              ))}
            </Liste>
          )}
        </Karte>

        {z.sicherung && (
          <Meldung
            titel="Deine früheren Daten von diesem Gerät sind gesichert"
            aktion={
              <Button
                variante="tertiaer"
                klein
                icon="download"
                onClick={async () => {
                  const d = await sicherungLesen(z.sicherung!);
                  if (!d) return toast('Die Sicherung ist nicht mehr da.', { ton: 'achtung' });
                  herunterladen(d, `macher-os-geraet-sicherung-${d.angelegtAm.slice(0, 10)}.json`);
                }}
              >
                Herunterladen
              </Button>
            }
          >
            Sie lagen hier vor der Anmeldung und wurden nicht mit deinem Betrieb vermischt.
          </Meldung>
        )}
      </Stapel>
      {dialog}
    </Seite>
  );
}

export function KontoSeite() {
  const z = useKontoZustand();
  if (!z.konfiguriert) return <NichtVerbunden />;
  if (z.phase === 'verbinde')
    return (
      <Seite titel="Konto">
        <Laden text="Verbinde mit deinem Betrieb …" />
      </Seite>
    );
  if (z.phase === 'kein-betrieb') return <KeinBetrieb />;
  if (z.phase === 'bereit' && z.konto?.betriebId) return <Angemeldet />;
  return <Abgemeldet />;
}
