import { useMemo, useState } from 'react';
import { datum, euro, heute } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Karte, Kennzahl, Meldung, Raster, Stapel, Filter } from '@ui/index';
import { prozentText } from '../kosten/basis';
import { GeldSeite, useBasis } from '../kosten/gemeinsam';
import { kennzahlen, veraenderung, type Kennzahlen, type ZeitraumArt } from './daten';

const ZEITRAEUME: { wert: ZeitraumArt; label: string }[] = [
  { wert: 'monat', label: 'Dieser Monat' },
  { wert: 'vormonat', label: 'Letzter Monat' },
  { wert: 'quartal', label: 'Dieses Quartal' },
  { wert: 'jahr', label: 'Dieses Jahr' },
];

const prozent = (a: number) => `${Math.round(a * 100)} %`;
/** Kennzahl ohne Grundlage: Strich statt Zahl, Erklärung steht im Hinweis */
const LEER = '–';

/** „+12 % zu September 2026“ – nur wenn es einen Vergleichswert gibt */
function vergleich(k: Kennzahlen, jetzt: number | undefined, vorher: number | undefined, einheit: 'prozent' | 'punkte' | 'tage' = 'prozent') {
  if (jetzt == null || vorher == null) return `${k.zeitraum.vor.label}: noch keine Daten`;
  const zu = `zu ${k.zeitraum.vor.label}`;
  if (einheit === 'punkte') {
    const d = Math.round((jetzt - vorher) * 100);
    return `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} Prozentpunkte ${zu}`;
  }
  if (einheit === 'tage') {
    const d = jetzt - vorher;
    return d === 0 ? `gleich wie ${k.zeitraum.vor.label}` : `${Math.abs(d)} ${Math.abs(d) === 1 ? 'Tag' : 'Tage'} ${d > 0 ? 'länger' : 'schneller'} als ${k.zeitraum.vor.label}`;
  }
  const v = veraenderung(jetzt, vorher);
  return v == null ? `${k.zeitraum.vor.label}: 0 €` : `${prozentText(v)} ${zu}`;
}

export function useKennzahlen(art: ZeitraumArt) {
  const b = useBasis();
  return useMemo(() => kennzahlen(b, art, heute()), [b, art]);
}

export function AuswertungSeite() {
  const [art, setArt] = useState<ZeitraumArt>('monat');
  const k = useKennzahlen(art);
  const z = k.zeitraum;
  const nichts = !k.umsatz.anzahl && !k.offen.anzahl && !k.bestand.anzahl && !k.auslastung?.geplantMinuten && !k.quote && !k.zahlung;

  return (
    <GeldSeite titel="Auswertung" untertitel="Die wichtigsten Zahlen deines Betriebs – mit Vergleich zum Vorzeitraum.">
      <Stapel abstand={24}>
        <Filter label="Zeitraum" wert={art} onChange={setArt} optionen={ZEITRAEUME} />
        <p className="mm-meta" style={{ margin: 0 }}>
          {z.label}: {datum(z.von)} bis {datum(z.bis)} · verglichen mit {datum(z.vor.von)} bis {datum(z.vor.bis)}
        </p>
        {nichts && (
          <Meldung titel="Noch keine Daten">
            Die Kennzahlen entstehen aus deinen Rechnungen, Zahlungen, Angeboten und Terminen. Sobald die erste Rechnung raus ist, geht es hier los.
          </Meldung>
        )}
        <Raster min={220}>
          <Kennzahl
            label="Umsatz netto"
            wert={k.umsatz.anzahl || k.umsatzVor.anzahl ? euro(k.umsatz.netto) : LEER}
            zeitraum={z.label}
            hinweis={k.umsatz.anzahl || k.umsatzVor.anzahl ? vergleich(k, k.umsatz.netto, k.umsatzVor.netto) : 'Noch keine Daten – keine Rechnungen'}
            to="/betrieb/ertrag"
          />
          <Kennzahl
            label="Offene Posten"
            wert={euro(k.offen.summe)}
            zeitraum="Stand heute"
            ton={k.offen.ueberfaellig ? 'gefahr' : undefined}
            hinweis={k.offen.anzahl ? `${k.offen.anzahl} ${k.offen.anzahl === 1 ? 'Rechnung' : 'Rechnungen'}${k.offen.ueberfaellig ? `, davon ${euro(k.offen.ueberfaellig)} überfällig` : ''}` : 'Alles bezahlt'}
          />
          <Kennzahl
            label="Auftragsbestand"
            wert={k.bestand.anzahl ? euro(k.bestand.summe) : LEER}
            zeitraum="Stand heute"
            hinweis={
              k.bestand.anzahl
                ? `${k.bestand.anzahl} ${k.bestand.anzahl === 1 ? 'Auftrag' : 'Aufträge'} mit angenommenem Angebot, noch nicht berechnet${k.bestand.ohneAngebot ? ` · ${k.bestand.ohneAngebot} ohne Angebot nicht bewertet` : ''}`
                : k.bestand.ohneAngebot
                  ? `${k.bestand.ohneAngebot} laufende Aufträge ohne angenommenes Angebot – nicht bewertbar`
                  : 'Keine laufenden Aufträge'
            }
          />
          <Kennzahl
            label="Auslastung (grob)"
            wert={k.auslastung ? prozent(k.auslastung.anteil) : LEER}
            zeitraum={z.label}
            hinweis={k.auslastung ? `Verplante Einsätze ÷ Arbeitszeit · ${vergleich(k, k.auslastung.anteil, k.auslastungVor?.anteil, 'punkte')}` : 'Noch keine Daten – kein Team mit Wochenstunden'}
          />
          <Kennzahl
            label="Angebotsquote"
            wert={k.quote ? prozent(k.quote.anteil) : LEER}
            zeitraum={z.label}
            hinweis={k.quote ? `${k.quote.angenommen} von ${k.quote.entschieden} entschiedenen Angeboten angenommen · ${vergleich(k, k.quote.anteil, k.quoteVor?.anteil, 'punkte')}` : 'Noch keine Daten – kein Angebot entschieden'}
          />
          <Kennzahl
            label="Ø Zahlungsdauer"
            wert={k.zahlung ? `${k.zahlung.tage} Tage` : LEER}
            zeitraum={z.label}
            hinweis={k.zahlung ? `Rechnungsdatum bis Zahlung, ${k.zahlung.anzahl} bezahlte ${k.zahlung.anzahl === 1 ? 'Rechnung' : 'Rechnungen'} · ${vergleich(k, k.zahlung.tage, k.zahlungVor?.tage, 'tage')}` : 'Noch keine Daten – keine Rechnung bezahlt'}
          />
        </Raster>
        <Meldung titel="So wird gerechnet">
          Umsatz: Rechnungen, die raus sind (netto, ohne Entwürfe und Stornos), nach Rechnungsdatum. Offene Posten: Brutto minus eingegangene Zahlungen. Auftragsbestand: angenommene Angebote laufender Aufträge
          minus bereits Berechnetes. Auslastung: verplante Einsatz-, Wartungs-, Besichtigungs- und Abnahmetermine ÷ Wochenstunden des Teams ohne Büro an Werktagen (Urlaub nicht abgezogen). Laufende Zeiträume werden
          mit dem Vorzeitraum bis zum gleichen Tag verglichen.
        </Meldung>
      </Stapel>
    </GeldSeite>
  );
}

/** Kompakter Block im Betrieb-Hub (nur Chef) */
export function AuswertungWidget() {
  const darf = useDarf('geld');
  const k = useKennzahlen('monat');
  if (!darf) return null;
  return (
    <Karte titel="Zahlen auf einen Blick" oberzeile={k.zeitraum.label} aktion={<Button variante="tertiaer" klein icon="weiter" to="/betrieb/auswertung">Auswertung</Button>}>
      <Raster min={200}>
        <Kennzahl label="Umsatz netto" wert={k.umsatz.anzahl || k.umsatzVor.anzahl ? euro(k.umsatz.netto) : LEER} hinweis={k.umsatz.anzahl || k.umsatzVor.anzahl ? vergleich(k, k.umsatz.netto, k.umsatzVor.netto) : 'Noch keine Daten – keine Rechnung im Monat'} />
        <Kennzahl label="Offene Posten" wert={euro(k.offen.summe)} ton={k.offen.ueberfaellig ? 'gefahr' : undefined} hinweis={k.offen.ueberfaellig ? `${euro(k.offen.ueberfaellig)} überfällig` : 'nichts überfällig'} to="/betrieb/zahlungen" />
        <Kennzahl label="Auftragsbestand" wert={k.bestand.anzahl ? euro(k.bestand.summe) : LEER} hinweis={k.bestand.anzahl ? `${k.bestand.anzahl} ${k.bestand.anzahl === 1 ? 'Auftrag' : 'Aufträge'} mit Angebot` : 'Noch keine Daten – kein angenommenes Angebot'} />
        <Kennzahl label="Angebotsquote" wert={k.quote ? prozent(k.quote.anteil) : LEER} hinweis={k.quote ? `${k.quote.angenommen} von ${k.quote.entschieden} angenommen` : 'Noch keine Daten – kein Angebot entschieden'} />
      </Raster>
    </Karte>
  );
}
