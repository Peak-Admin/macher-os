import { useState } from 'react';
import { useDatenstand } from '@core/db';
import { db } from '@core/db';
import { datum, euro } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { offenePosten } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';
import { KeinZugriff } from '../rechnungen/RechnungenListe';
import { beispielKontoauszug, importAusfuehren, kontoauszugLesen, zuordnen, type Zuordnung } from './logik';

const TON = { sicher: 'erfolg', unsicher: 'achtung', keine: 'neutral', doppelt: 'neutral' } as const;
const LABEL = { sicher: 'Wird gebucht', unsicher: 'Zur Freigabe', keine: 'Nicht zugeordnet', doppelt: 'Schon gebucht' } as const;

export function KontoauszugImport() {
  useDatenstand();
  const darf = useDarf('geld');
  const toast = useToast();
  const [zuordnungen, setZuordnungen] = useState<Zuordnung[] | null>(null);
  const [fehler, setFehler] = useState<string>();
  const [ergebnis, setErgebnis] = useState<{ gebucht: number; summe: number; freigaben: number } | null>(null);
  const [laedt, setLaedt] = useState(false);
  if (!darf) return <KeinZugriff />;

  const lesen = (text: string) => {
    const { umsaetze, fehler: f } = kontoauszugLesen(text);
    setErgebnis(null);
    if (f) return (setFehler(f), setZuordnungen(null));
    if (!umsaetze.length) return (setFehler('In der Datei sind keine Zahlungseingänge.'), setZuordnungen(null));
    setFehler(undefined);
    setZuordnungen(zuordnen(umsaetze));
  };

  const datei = async (f: File | undefined) => {
    if (!f) return;
    setLaedt(true);
    try {
      const buf = await f.arrayBuffer();
      // Viele Banken exportieren in Windows-1252 – UTF-8 zuerst, sonst Fallback
      let text = new TextDecoder('utf-8').decode(buf);
      if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);
      lesen(text);
    } catch {
      setFehler('Die Datei konnte nicht gelesen werden.');
    } finally {
      setLaedt(false);
    }
  };

  const ausfuehren = () => {
    if (!zuordnungen) return;
    const e = importAusfuehren(zuordnungen);
    setErgebnis(e);
    setZuordnungen(null);
    toast(e.gebucht ? `${e.gebucht === 1 ? '1 Zahlung' : `${e.gebucht} Zahlungen`} gebucht.` : 'Keine Zahlung automatisch gebucht.');
  };

  const n = (s: Zuordnung['sicherheit']) => zuordnungen?.filter((z) => z.sicherheit === s).length ?? 0;
  const hatBeispiele = offenePosten().some((r) => r.beispiel);

  return (
    <Seite titel="Kontoauszug importieren" zurueck={{ to: '/betrieb/zahlungen', label: 'Zahlungen' }}>
      <Karte>
        <Stapel>
          <p>Exportiere die Umsätze aus deinem Online-Banking als CSV-Datei (Semikolon getrennt) und lade sie hier hoch. Macher erkennt die Rechnungsnummer im Verwendungszweck oder Betrag und Kunde.</p>
          <Zeile>
            <label className="mm-btn mm-btn--primaer" style={{ cursor: 'pointer' }}>
              <span>{laedt ? 'Wird gelesen …' : 'CSV-Datei wählen'}</span>
              <input type="file" accept=".csv,.txt,text/csv" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} onChange={(e) => datei(e.target.files?.[0])} />
            </label>
            {hatBeispiele && (
              <Button variante="tertiaer" onClick={() => lesen(beispielKontoauszug())}>
                Mit Beispiel-Kontoauszug ausprobieren
              </Button>
            )}
          </Zeile>
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        </Stapel>
      </Karte>

      {ergebnis && (
        <Meldung ton="erfolg" titel="Import fertig" aktion={<Button klein variante="sekundaer" to="/betrieb/zahlungen">Zu den offenen Posten</Button>}>
          {ergebnis.gebucht === 1 ? '1 Zahlung' : `${ergebnis.gebucht} Zahlungen`} über {euro(ergebnis.summe)} gebucht.
          {ergebnis.freigaben ? ` ${ergebnis.freigaben === 1 ? '1 unsichere Zuordnung wartet' : `${ergebnis.freigaben} unsichere Zuordnungen warten`} unter „Braucht dich“ auf deine Freigabe.` : ''}
        </Meldung>
      )}

      {zuordnungen && (
        <Karte titel="Das hat Macher gefunden">
          <Stapel>
            <Meta>
              {n('sicher')} sicher · {n('unsicher')} zur Freigabe · {n('keine')} ohne passende Rechnung{n('doppelt') ? ` · ${n('doppelt')} schon gebucht` : ''}
            </Meta>
            <Liste>
              {zuordnungen.map((z) => {
                const r = rechnungX(z.rechnungId);
                return (
                  <ListenZeile
                    key={z.umsatz.zeile}
                    titel={`${euro(z.umsatz.betrag)} · ${z.umsatz.name || 'ohne Namen'}`}
                    untertitel={`${datum(z.umsatz.datum)} · „${z.umsatz.zweck || '–'}“ → ${r ? `${r.nummer} (${db.kunden.get(r.kundeId)?.name ?? ''})` : 'keine Rechnung'} · ${z.grund}`}
                    rechts={<Status ton={TON[z.sicherheit]}>{LABEL[z.sicherheit]}</Status>}
                  />
                );
              })}
            </Liste>
            <Zeile>
              <Button onClick={ausfuehren} disabled={!n('sicher') && !n('unsicher')}>
                {n('sicher') ? `${n('sicher') === 1 ? '1 Zahlung' : `${n('sicher')} Zahlungen`} buchen` : 'Zur Freigabe ablegen'}
              </Button>
              <Button variante="tertiaer" onClick={() => setZuordnungen(null)}>
                Verwerfen
              </Button>
            </Zeile>
            {n('unsicher') > 0 && <Meta>Unsichere Zuordnungen bucht Macher nicht selbst – sie landen als Freigabe unter „Braucht dich“.</Meta>}
          </Stapel>
        </Karte>
      )}

      {!zuordnungen && !ergebnis && !offenePosten().length && <Leer titel="Keine offenen Rechnungen" text="Es gibt gerade nichts zuzuordnen. Du kannst trotzdem importieren – Macher meldet, was nicht passt." icon="check" />}
    </Seite>
  );
}
