/**
 * Einstellungen je Nutzer: welche Takte, um wie viel Uhr, über welchen Kanal – und wann Ruhe ist.
 * Jede Änderung gilt sofort (kein Speichern-Knopf).
 */
import { useState } from 'react';
import { cloudAktiv } from '@core/cloud';
import { useEinstellung } from '@core/einstellungen';
import { useIch } from '@core/session';
import { Abschnitt, Button, Eingabe, FormRaster, Leer, Meldung, Meta, Seite, Schalter, Segmente, Stapel, Zeile, useToast } from '@ui/index';
import { systemmeldungErlauben, systemmeldungStatus } from '@modules/takte/browser';
import { einstellungenAus, einstellungsSchluessel, takteFuer, taktAn, taktInRuhezeit, taktUhr, type Kanal, type TaktEinstellungen, type TaktId } from '@modules/takte/regeln';
import { taktPfad } from '@modules/takte/zustellung';
import { minutenVonText } from '@modules/takte/zeit';

function Kanalhinweis({ kanal, email }: { kanal: Kanal; email?: string }) {
  const [status, setStatus] = useState(systemmeldungStatus());
  const toast = useToast();
  if (cloudAktiv()) {
    if (kanal === 'email' && !email) return <Meldung ton="achtung" titel="Keine E-Mail-Adresse">Trag unter Team deine E-Mail-Adresse ein, sonst kommen die Takte nicht an.</Meldung>;
    return <Meta>{kanal === 'push' ? 'Die Takte kommen als Mitteilung aufs Handy – auch wenn Macher OS geschlossen ist.' : `Die Takte kommen per E-Mail an ${email}.`}</Meta>;
  }
  return (
    <Stapel abstand={8}>
      <Meta>
        Noch ohne verbundenes Konto: Die Takte erscheinen in der Glocke und – wenn du es erlaubst – als Mitteilung auf diesem Gerät,
        aber nur solange Macher OS geöffnet ist. {kanal === 'email' ? 'E-Mails gehen erst mit verbundenem Konto raus.' : ''}
      </Meta>
      {status === 'offen' && (
        <Zeile>
          <Button
            variante="sekundaer"
            klein
            icon="glocke"
            onClick={async () => {
              const ok = await systemmeldungErlauben();
              setStatus(systemmeldungStatus());
              toast(ok ? 'Mitteilungen auf diesem Gerät erlaubt.' : 'Nicht erlaubt. Du findest die Takte weiter in der Glocke.', ok ? undefined : { ton: 'achtung' });
            }}
          >
            Mitteilungen auf diesem Gerät erlauben
          </Button>
        </Zeile>
      )}
      {status === 'verweigert' && <Meta>Mitteilungen sind im Browser blockiert. Du kannst sie in den Website-Einstellungen wieder erlauben.</Meta>}
      {status === 'erlaubt' && <Meta>Mitteilungen auf diesem Gerät sind erlaubt.</Meta>}
    </Stapel>
  );
}

export function EinstellungenSeite() {
  const ich = useIch();
  const toast = useToast();
  const [roh, setRoh] = useEinstellung<unknown>(einstellungsSchluessel(ich?.id ?? '-'), undefined);
  const e = einstellungenAus(roh);
  const [fehler, setFehler] = useState<Record<string, string>>({});

  if (!ich) {
    return (
      <Seite titel="Benachrichtigungen einstellen">
        <Leer icon="person" titel="Noch niemand angemeldet" text="Richte zuerst deinen Betrieb ein. Danach stellst du hier deine Takte ein." aktion={<Button to="/willkommen">Betrieb einrichten</Button>} />
      </Seite>
    );
  }

  const speichern = (neu: TaktEinstellungen, meldung = 'Gespeichert.') => {
    setRoh(neu);
    toast(meldung);
  };
  const takt = (id: TaktId, teil: { an?: boolean; uhr?: string }) => speichern({ ...e, takte: { ...e.takte, [id]: { ...e.takte[id], ...teil } } });
  const uhrzeit = (feld: string, wert: string, setzen: (w: string) => void) => {
    if (!wert) return; // Feld wird gerade getippt
    if (minutenVonText(wert) === undefined) {
      setFehler({ ...fehler, [feld]: 'Bitte eine Uhrzeit wie 06:30 eingeben.' });
      return;
    }
    setFehler({ ...fehler, [feld]: '' });
    setzen(wert);
  };
  const meine = takteFuer(ich.rolle);

  return (
    <Seite titel="Benachrichtigungen einstellen" untertitel="Feste Takte statt Dauerbeschallung. Gilt nur für dich." zurueck={{ to: '/macher/benachrichtigungen', label: 'Benachrichtigungen' }}>
      <Stapel abstand={32}>
        <Abschnitt titel="Deine Takte">
          <Stapel abstand={16}>
            {meine.map((t) => {
              const an = taktAn(e, t.id);
              return (
                <Stapel key={t.id} abstand={8}>
                  <Schalter label={`${t.titel} · ${t.tage.length === 1 ? 'freitags' : 'werktags'} ${taktUhr(e, t.id)} Uhr`} beschreibung={t.beschreibung} checked={an} onChange={(v) => takt(t.id, { an: v })} />
                  {an && (
                    <Zeile abstand={12}>
                      <div style={{ width: 160 }}>
                        <Eingabe label="Uhrzeit" type="time" value={taktUhr(e, t.id)} fehler={fehler[t.id] || undefined} onChange={(ev) => uhrzeit(t.id, ev.target.value, (w) => takt(t.id, { uhr: w }))} />
                      </div>
                      <Button variante="tertiaer" klein icon="pfeilRechts" to={taktPfad(t.id)}>
                        Ansehen
                      </Button>
                    </Zeile>
                  )}
                  {an && taktInRuhezeit(e, t.id) && <Meldung ton="achtung">Diese Uhrzeit liegt in deiner Ruhezeit – dann kommt der Takt nicht.</Meldung>}
                </Stapel>
              );
            })}
          </Stapel>
        </Abschnitt>

        <Abschnitt titel="Kanal">
          <Stapel abstand={8}>
            <Segmente<Kanal>
              label="So bekommst du die Takte"
              wert={e.kanal}
              onChange={(k) => speichern({ ...e, kanal: k })}
              optionen={[
                { wert: 'push', label: 'Mitteilung aufs Handy' },
                { wert: 'email', label: 'E-Mail' },
              ]}
            />
            <Kanalhinweis kanal={e.kanal} email={ich.email} />
          </Stapel>
        </Abschnitt>

        <Abschnitt titel="Ruhezeiten">
          <Stapel abstand={16}>
            <FormRaster>
              <Eingabe label="Ruhe ab" type="time" value={e.ruhe.ab} fehler={fehler.ab || undefined} onChange={(ev) => uhrzeit('ab', ev.target.value, (w) => speichern({ ...e, ruhe: { ...e.ruhe, ab: w } }))} />
              <Eingabe label="Ruhe bis" type="time" value={e.ruhe.bis} fehler={fehler.bis || undefined} onChange={(ev) => uhrzeit('bis', ev.target.value, (w) => speichern({ ...e, ruhe: { ...e.ruhe, bis: w } }))} />
            </FormRaster>
            <Schalter label="Wochenende ruhig" beschreibung="Samstag und Sonntag kommt nichts aufs Handy." checked={e.ruhe.wochenende} onChange={(v) => speichern({ ...e, ruhe: { ...e.ruhe, wochenende: v } })} />
            <Schalter
              label="Ich habe Notdienst"
              beschreibung="Dringendes (z. B. dringende Anfragen) kommt dann auch in der Ruhezeit. Takte bleiben still."
              checked={e.notdienst}
              onChange={(v) => speichern({ ...e, notdienst: v }, v ? 'Notdienst an: Dringendes kommt auch in der Ruhezeit.' : 'Notdienst aus.')}
            />
            <Meta>In der Ruhezeit sammelt die Glocke alles still. Du siehst es, wenn du Macher OS öffnest.</Meta>
          </Stapel>
        </Abschnitt>
        <Zeile>
          <Button variante="tertiaer" klein to="/macher/automatisch" icon="einstellungen">
            Automationen verwalten
          </Button>
        </Zeile>
      </Stapel>
    </Seite>
  );
}
