import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, importieren, useDatenstand } from '@core/db';
import { datum, heute, relativ, uhrzeit, zahl } from '@core/format';
import { setzeEinstellung, useEinstellung } from '@core/einstellungen';
import { useDarf } from '@core/session';
import { Button, Dialog, FensterSkizze, Karte, Meldung, Meta, Seite, Stapel, Zeile, useBestaetigen, useToast, DateiKnopf } from '@ui/index';
import { dateiTeil, herunterladen } from '@modules/schnittstellen/daten';
import { EinstellungenTabs } from './Navigation';
import { LETZTE_SICHERUNG_KEY, beispielAnzahl, beispieleEntfernenZaehlen, papierkorbEintraege, sicherungErstellen, sicherungPruefen, type PruefErgebnis } from './daten';

export function sicherungHerunterladen() {
  const s = sicherungErstellen();
  herunterladen(`macher-os-sicherung-${dateiTeil(s.betrieb)}-${heute()}.json`, JSON.stringify(s), 'application/json');
  setzeEinstellung(LETZTE_SICHERUNG_KEY, s.erstelltAm);
}

export function DatenSicherung() {
  useDatenstand();
  const toast = useToast();
  const navigate = useNavigate();
  const [fragen, bestaetigen] = useBestaetigen();
  const admin = useDarf('admin');
  const [letzte] = useEinstellung<string | undefined>(LETZTE_SICHERUNG_KEY, undefined);
  const [geprueft, setGeprueft] = useState<PruefErgebnis | null>(null);
  const beispiele = beispielAnzahl();
  const papierkorb = papierkorbEintraege().length;

  if (!admin)
    return (
      <Seite titel="Einstellungen">
        <Stapel abstand={24}>
          <EinstellungenTabs aktiv="daten" papierkorb={papierkorb} />
          <Meldung ton="achtung" titel="Dafür fehlt dir ein Recht">Datensicherung und Zurücksetzen darf nur, wer das Recht „Einstellungen“ hat.</Meldung>
        </Stapel>
      </Seite>
    );

  const herunter = () => {
    sicherungHerunterladen();
    toast('Sicherung heruntergeladen. Leg sie an einem sicheren Ort ab, z. B. auf einem USB-Stick.');
  };

  const dateiGewaehlt = async (f: File | undefined) => {
    if (!f) return;
    try {
      setGeprueft(sicherungPruefen(JSON.parse(await f.text())));
    } catch {
      setGeprueft({ ok: false, fehler: 'Die Datei konnte nicht gelesen werden. Ist es eine Macher-Sicherung (.json)?' });
    }
  };

  const einspielen = () => {
    if (!geprueft?.ok) return;
    importieren(geprueft.daten);
    setGeprueft(null);
    toast('Sicherung eingespielt.');
    navigate('/heute');
  };

  const beispieleWeg = async () => {
    if (!(await fragen('Beispieldaten entfernen?', `${zahl(beispiele)} Beispiel-Einträge (Kunden, Aufträge, Team …) werden endgültig gelöscht. Was du selbst angelegt hast, bleibt.`, 'Beispieldaten entfernen'))) return;
    const entfernt = beispieleEntfernenZaehlen();
    toast(`${zahl(entfernt)} Beispiel-Einträge entfernt. Jetzt gehört Macher ganz dir.`);
  };

  const onboarding = async () => {
    if (!(await fragen('Einrichtung neu starten?', 'Du kommst zurück zur Einrichtung. Wenn du sie abschließt, werden alle bisherigen Daten ersetzt. Lade vorher eine Sicherung herunter.', 'Einrichtung neu starten'))) return;
    db.betrieb.update('betrieb', { onboardingFertig: false });
    navigate('/willkommen');
  };

  const alt = !letzte || Date.now() - new Date(letzte).getTime() > 30 * 86_400_000;

  return (
    <Seite titel="Einstellungen" untertitel="Deine Daten sichern, aufräumen und neu anfangen.">
      <Stapel abstand={24}>
        <EinstellungenTabs aktiv="daten" papierkorb={papierkorb} />
        <Karte titel="Datensicherung" icon="schild">
          <Stapel>
            <Meta>Deine Daten liegen auf diesem Gerät. Lade regelmäßig eine Sicherung herunter – damit holst du alles zurück, auch auf einem neuen Gerät.</Meta>
            {letzte ? (
              <Meldung ton={alt ? 'achtung' : 'erfolg'} titel={`Letzte Sicherung: ${relativ(letzte)}, ${uhrzeit(letzte)}`}>
                {alt ? 'Das ist länger als 30 Tage her.' : undefined}
              </Meldung>
            ) : (
              <Meldung ton="achtung" titel="Noch keine Sicherung heruntergeladen" />
            )}
            <Zeile>
              <Button icon="download" onClick={herunter}>
                Sicherung herunterladen
              </Button>
              <DateiKnopf accept="application/json,.json" onDateien={([f]) => dateiGewaehlt(f)}>
                Sicherung einspielen
              </DateiKnopf>
            </Zeile>
            {geprueft && !geprueft.ok && <Meldung ton="achtung" titel="Diese Datei passt nicht">{geprueft.fehler}</Meldung>}
          </Stapel>
        </Karte>

        <Karte titel="Daten übernehmen" icon="upload">
          <div className="mm-fenster-teaser">
            <span className="mm-fenster" aria-hidden>
              <FensterSkizze icon="import" />
            </span>
            <Stapel>
              <Meta>Kunden, Artikel, Preise oder offene Rechnungen aus Excel oder deinem alten Programm übernehmen. Macher erkennt die Spalten selbst.</Meta>
              <div>
                <Button variante="sekundaer" icon="upload" to="/betrieb/import">
                  Daten übernehmen
                </Button>
              </div>
            </Stapel>
          </div>
        </Karte>

        <Karte titel="Beispieldaten" icon="liste">
          <Stapel>
            {beispiele ? (
              <>
                <Meta>Aus der Einrichtung stammen noch {zahl(beispiele)} Beispiel-Einträge. Sie sind überall mit „Beispiel“ markiert.</Meta>
                <div>
                  <Button variante="sekundaer" icon="muell" onClick={beispieleWeg}>
                    Beispieldaten entfernen
                  </Button>
                </div>
              </>
            ) : (
              <Meldung ton="erfolg" titel="Keine Beispieldaten mehr da">Alles, was du siehst, sind deine echten Daten.</Meldung>
            )}
          </Stapel>
        </Karte>

        <Karte titel="Einrichtung neu starten" icon="wiederholen">
          <Stapel>
            <Meta>Gewerk falsch gewählt oder nochmal von vorn? Starte die Einrichtung neu. Beim Abschließen werden alle Daten ersetzt.</Meta>
            <div>
              <Button variante="gefahr" icon="wiederholen" onClick={onboarding}>
                Einrichtung neu starten
              </Button>
            </div>
          </Stapel>
        </Karte>
      </Stapel>
      <Dialog
        offen={!!geprueft?.ok}
        onSchliessen={() => setGeprueft(null)}
        titel="Sicherung einspielen?"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setGeprueft(null)}>
              Abbrechen
            </Button>
            <Button variante="gefahr" onClick={einspielen}>
              Alles ersetzen
            </Button>
          </>
        }
      >
        {geprueft?.ok && (
          <Stapel abstand={8}>
            <p style={{ margin: 0 }}>
              Sicherung von <strong>{geprueft.betrieb}</strong>
              {geprueft.erstelltAm ? ` vom ${datum(geprueft.erstelltAm)}, ${uhrzeit(geprueft.erstelltAm)}` : ''} mit {zahl(geprueft.anzahl)} Einträgen.
            </p>
            <p style={{ margin: 0 }}>Alle Daten auf diesem Gerät werden durch die Sicherung ersetzt. Das lässt sich nicht rückgängig machen.</p>
          </Stapel>
        )}
      </Dialog>
      {bestaetigen}
    </Seite>
  );
}
