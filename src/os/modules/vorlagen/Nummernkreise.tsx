/** Nummernkreise je Dokumentart (Dokumenten-Engine) – Kürzel einstellen, Vorschau der nächsten Nummer */
import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { useDarf } from '@core/session';
import { Button, Eingabe, FormRaster, Karte, Meldung, Meta, Seite, Stapel, useToast } from '@ui/index';
import { geschaeftsdokumente } from '@modules/dokumente/daten';
import { kuerzelFuer, kuerzelGueltig, kuerzelSetzen, naechsteDokumentNummer, NUMMERN_LABEL, STANDARD_KUERZEL, type NummerArt } from '@modules/dokumente/nummern';

const ARTEN: NummerArt[] = ['angebot', 'auftragsbestaetigung', 'lieferschein', 'rechnung', 'abschlag', 'teil', 'schluss', 'gutschrift', 'storno'];
/** Rechnungsarten teilen sich die Nummern aus der Rechnungssammlung, AB/LS die der Geschäftsdokumente */
const RECHNUNGSARTEN = new Set<NummerArt>(['rechnung', 'abschlag', 'teil', 'schluss', 'gutschrift', 'storno']);

export function Nummernkreise() {
  useDatenstand();
  const toast = useToast();
  const admin = useDarf('admin');
  const [werte, setWerte] = useState<Record<NummerArt, string>>(() => Object.fromEntries(ARTEN.map((a) => [a, kuerzelFuer(a)])) as Record<NummerArt, string>);
  const [fehler, setFehler] = useState<string>();
  const vorhandene = (a: NummerArt) =>
    RECHNUNGSARTEN.has(a) ? db.rechnungen.allMitGeloeschten().map((x) => x.nummer) : a === 'angebot' ? db.angebote.allMitGeloeschten().map((x) => x.nummer) : geschaeftsdokumente.allMitGeloeschten().map((x) => x.nummer);
  const speichern = () => {
    const falsch = ARTEN.filter((a) => !kuerzelGueltig(werte[a].trim().toUpperCase()));
    if (falsch.length) return setFehler(`Ein Kürzel hat 1 bis 4 Buchstaben, z. B. „R“ oder „GS“. Prüf: ${falsch.map((a) => NUMMERN_LABEL[a]).join(', ')}.`);
    for (const a of ARTEN) kuerzelSetzen(a, werte[a].trim().toUpperCase());
    setFehler(undefined);
    toast('Nummernkreise gespeichert.');
  };
  return (
    <Seite titel="Nummernkreise" untertitel="Jede Dokumentart bekommt fortlaufende Nummern je Jahr – ohne Lücken." zurueck={{ to: '/betrieb/vorlagen', label: 'Vorlagen' }} aktion={admin ? <Button onClick={speichern}>Nummernkreise speichern</Button> : undefined}>
      <Stapel abstand={16}>
        <Meldung ton="neutral" titel="Standard: alle Rechnungen im Kreis „R“">
          Rechnung, Abschlag, Teil- und Schlussrechnung, Gutschrift und Storno laufen normalerweise in einem Kreis. Ändere das nur, wenn dein Steuerberater getrennte Kreise will. Schon vergebene Nummern bleiben, wie sie sind.
        </Meldung>
        {!admin && <Meldung ton="neutral">Nur wer Einstellungen ändern darf, kann die Kürzel anpassen.</Meldung>}
        <Karte>
          <FormRaster>
            {ARTEN.map((a) => (
              <Eingabe
                key={a}
                label={NUMMERN_LABEL[a]}
                value={werte[a]}
                maxLength={4}
                disabled={!admin}
                onChange={(e) => setWerte({ ...werte, [a]: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
                hilfe={`Nächste Nummer: ${kuerzelGueltig(werte[a]) ? naechsteDokumentNummer(a, vorhandene(a), werte[a]) : '–'}${werte[a] !== STANDARD_KUERZEL[a] ? ` · Standard „${STANDARD_KUERZEL[a]}“` : ''}`}
              />
            ))}
          </FormRaster>
        </Karte>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <Meta>Berichte haben den Kreis „BR“, Aufträge „A“. Die laufende Nummer beginnt jedes Jahr bei 0001.</Meta>
      </Stapel>
    </Seite>
  );
}
