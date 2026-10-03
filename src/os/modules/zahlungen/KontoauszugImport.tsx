import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, euro } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, useToast, DateiKnopf } from '@ui/index';
import { offenePosten } from '../rechnungen/logik';
import { KeinZugriff } from '../rechnungen/RechnungenListe';
import { beispielKontoauszug, kontoauszugLesen, type Umsatz } from './logik';
import { camtLesen, istCamt } from './camt';
import { abgleichen, einlesen, vorschau, type Bewertung, type AbgleichErgebnis } from './abgleich';
import type { UmsatzQuelle } from './daten';

const TON = { eindeutig: 'erfolg', vorschlag: 'achtung', keine: 'neutral', doppelt: 'neutral' } as const;
const LABEL = { eindeutig: 'Wird zugeordnet', vorschlag: 'Zum Prüfen', keine: 'Nicht zugeordnet', doppelt: 'Schon importiert' } as const;

/** Kontoauszug lesen: CAMT.053 (XML) oder CSV */
export function auszugLesen(text: string): { umsaetze: Umsatz[]; quelle: UmsatzQuelle; fehler?: string } {
  if (istCamt(text)) return { ...camtLesen(text), quelle: 'camt' };
  if (/^\s*</.test(text)) return { umsaetze: [], quelle: 'camt', fehler: 'Die XML-Datei ist kein Kontoauszug im CAMT-Format. Exportiere „CAMT.053“ oder CSV aus deinem Online-Banking.' };
  return { ...kontoauszugLesen(text), quelle: 'csv' };
}

export function KontoauszugImport() {
  useDatenstand();
  const darf = useDarf('geld');
  const toast = useToast();
  const [stand, setStand] = useState<{ umsaetze: Umsatz[]; quelle: UmsatzQuelle; bewertungen: Bewertung[]; beispiel?: boolean } | null>(null);
  const [fehler, setFehler] = useState<string>();
  const [ergebnis, setErgebnis] = useState<(AbgleichErgebnis & { doppelt: number }) | null>(null);
  const [laedt, setLaedt] = useState(false);
  if (!darf) return <KeinZugriff />;

  const lesen = (text: string, beispiel = false) => {
    const { umsaetze, quelle, fehler: f } = auszugLesen(text);
    setErgebnis(null);
    if (f) return (setFehler(f), setStand(null));
    if (!umsaetze.length) return (setFehler('In der Datei sind keine Zahlungseingänge.'), setStand(null));
    setFehler(undefined);
    setStand({ umsaetze, quelle, bewertungen: vorschau(umsaetze), beispiel });
  };

  const datei = async (f: File | undefined) => {
    if (!f) return;
    setLaedt(true);
    try {
      const buf = await f.arrayBuffer();
      // Viele Banken exportieren CSV in Windows-1252 – UTF-8 zuerst, sonst Fallback
      let text = new TextDecoder('utf-8').decode(buf);
      if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);
      lesen(text);
    } catch {
      setFehler('Die Datei konnte nicht gelesen werden.');
    } finally {
      setLaedt(false);
    }
  };

  const uebernehmen = () => {
    if (!stand) return;
    const { neu, doppelt } = einlesen(stand.umsaetze, stand.quelle, { beispiel: stand.beispiel });
    const e = abgleichen({ automatisch: true, ids: neu.map((u) => u.id) });
    setErgebnis({ ...e, doppelt });
    setStand(null);
    toast(e.zugeordnet ? `${e.zugeordnet === 1 ? '1 Zahlung' : `${e.zugeordnet} Zahlungen`} zugeordnet.` : 'Keine Zahlung automatisch zugeordnet.', { ton: e.zugeordnet ? 'erfolg' : 'neutral' });
  };

  const n = (s: Bewertung['entscheidung']) => stand?.bewertungen.filter((b) => b.entscheidung === s).length ?? 0;
  const hatBeispiele = offenePosten().some((r) => r.beispiel);
  const zuPruefen = (ergebnis?.vorschlaege ?? 0) + (ergebnis?.offen ?? 0);

  return (
    <Seite titel="Kontoauszug importieren" zurueck={{ to: '/betrieb/zahlungen', label: 'Zahlungen' }}>
      <Karte>
        <Stapel>
          <p>
            Exportiere die Umsätze aus deinem Online-Banking als CAMT.053 (XML) oder CSV und lade die Datei hier hoch. Lotte erkennt Rechnungsnummer, Betrag und Kunde – auch wenn
            die Nummer verstümmelt ist.
          </p>
          <Zeile>
            <DateiKnopf variante={stand ? 'sekundaer' : 'primaer'} accept=".csv,.txt,.xml,.camt,text/csv,application/xml,text/xml" onDateien={([f]) => datei(f)} laedt={laedt} laedtText="Wird gelesen …">
              Kontoauszug wählen
            </DateiKnopf>
            {hatBeispiele && (
              <Button variante="tertiaer" onClick={() => lesen(beispielKontoauszug(), true)}>
                Mit Beispiel-Kontoauszug ausprobieren
              </Button>
            )}
          </Zeile>
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        </Stapel>
      </Karte>

      {ergebnis && (
        <Meldung
          ton="erfolg"
          titel="Import fertig"
          aktion={
            zuPruefen ? (
              <Button klein variante="sekundaer" to="/betrieb/zahlungen/abgleich">
                Jetzt zuordnen
              </Button>
            ) : (
              <Button klein variante="sekundaer" to="/betrieb/zahlungen">
                Zu den offenen Posten
              </Button>
            )
          }
        >
          {ergebnis.zugeordnet === 1 ? '1 Zahlung' : `${ergebnis.zugeordnet} Zahlungen`} über {euro(ergebnis.summe)} zugeordnet.
          {zuPruefen ? ` ${zuPruefen === 1 ? '1 Zahlung wartet' : `${zuPruefen} Zahlungen warten`} darauf, dass du sie zuordnest.` : ''}
          {ergebnis.doppelt ? ` ${ergebnis.doppelt === 1 ? '1 Umsatz war' : `${ergebnis.doppelt} Umsätze waren`} schon importiert.` : ''}
        </Meldung>
      )}

      {stand && (
        <Karte titel="Das hat Lotte gefunden" icon="liste">
          <Stapel>
            <Meta>
              {n('eindeutig')} eindeutig · {n('vorschlag')} zum Prüfen · {n('keine')} ohne passende Rechnung{n('doppelt') ? ` · ${n('doppelt')} schon importiert` : ''}
            </Meta>
            <Liste>
              {stand.bewertungen.map((b, i) => {
                const t = b.treffer[0];
                const ziel = b.buchungen?.length && b.buchungen.length > 1 ? b.grund : t ? `${t.rechnung.nummer} (${db.kunden.get(t.rechnung.kundeId)?.name ?? ''})` : 'keine Rechnung';
                return (
                  <ListenZeile
                    key={`${b.umsatz.zeile}-${i}`}
                    titel={`${euro(b.umsatz.betrag)} · ${b.umsatz.name || 'ohne Namen'}`}
                    untertitel={`${datum(b.umsatz.datum)} · „${b.umsatz.zweck || '–'}“ → ${b.entscheidung === 'doppelt' ? b.grund : `${ziel}${b.ergebnis ? ` · ${b.ergebnis}` : ''}`}`}
                    rechts={<Status ton={TON[b.entscheidung]}>{LABEL[b.entscheidung]}</Status>}
                  />
                );
              })}
            </Liste>
            <Zeile>
              <Button onClick={uebernehmen} disabled={n('doppelt') === stand.bewertungen.length}>
                {n('eindeutig') ? `${n('eindeutig') === 1 ? '1 Zahlung' : `${n('eindeutig')} Zahlungen`} zuordnen` : 'Umsätze übernehmen'}
              </Button>
              <Button variante="tertiaer" onClick={() => setStand(null)}>
                Verwerfen
              </Button>
            </Zeile>
            {n('vorschlag') + n('keine') > 0 && <Meta>Was nicht eindeutig ist, bucht Lotte nicht selbst – du ordnest es danach mit einem Klick zu.</Meta>}
          </Stapel>
        </Karte>
      )}

      {!stand && !ergebnis && !offenePosten().length && <Leer titel="Keine offenen Rechnungen" text="Es gibt gerade nichts zuzuordnen. Du kannst trotzdem importieren – Lotte meldet, was nicht passt." icon="check" />}
    </Seite>
  );
}
