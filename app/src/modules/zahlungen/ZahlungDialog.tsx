import { useEffect, useState } from 'react';
import { db } from '@core/db';
import { euro, heute } from '@core/format';
import type { ID, Zahlung } from '@core/objects';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, FormRaster, Meldung, Meta, Stapel, useToast } from '@ui/index';
import { offenerBetrag } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';
import { GeldEingabe } from '../rechnungen/teile';
import { skontoVorschlag, zahlungBuchen } from './logik';

/** Zahlung erfassen – Teilzahlung oder Skonto in einem Schritt */
export function ZahlungDialog({ rechnungId, offen, onSchliessen }: { rechnungId: ID | undefined; offen: boolean; onSchliessen: () => void }) {
  db.zahlungen.use();
  const r = rechnungX(rechnungId);
  const toast = useToast();
  const rest = r ? offenerBetrag(r) : 0;
  const [betrag, setBetrag] = useState(rest);
  const [datumWert, setDatum] = useState(heute());
  const [art, setArt] = useState<Zahlung['art']>('ueberweisung');
  const [skonto, setSkonto] = useState(false);
  const [fehler, setFehler] = useState<string>();
  useEffect(() => {
    if (offen) {
      setBetrag(rest);
      setDatum(heute());
      setSkonto(false);
      setFehler(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, rechnungId]);
  if (!r) return null;
  const vorschlag = skontoVorschlag(r, betrag);
  const k = db.kunden.get(r.kundeId);

  const buchen = () => {
    if (betrag <= 0) return setFehler('Trag den gezahlten Betrag ein.');
    if (!datumWert) return setFehler('Trag das Zahlungsdatum ein.');
    const z = zahlungBuchen({ rechnungId: r.id, betrag, datum: datumWert, art, skonto: skonto && vorschlag ? vorschlag.rest : undefined });
    if (!z) return setFehler('Die Zahlung konnte nicht gebucht werden.');
    const neu = rechnungX(r.id);
    toast(neu?.status === 'bezahlt' ? `${r.nummer} ist bezahlt.` : `Zahlung gebucht. Noch offen: ${euro(neu ? offenerBetrag(neu) : 0)}.`);
    onSchliessen();
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`Zahlung erfassen – ${r.nummer}`}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={buchen}>Zahlung buchen</Button>
        </>
      }
    >
      <Stapel>
        <Meta>
          {k?.name} · offen {euro(rest)}
        </Meta>
        <FormRaster>
          <GeldEingabe label="Gezahlter Betrag (€)" wert={betrag} onWert={(c) => (setBetrag(c), setFehler(undefined))} fehler={fehler} autoFocus />
          <Eingabe label="Eingegangen am" type="date" value={datumWert} onChange={(e) => setDatum(e.target.value)} />
          <Auswahl
            label="Zahlart"
            value={art}
            onChange={(e) => setArt(e.target.value as Zahlung['art'])}
            optionen={[
              { wert: 'ueberweisung', label: 'Überweisung' },
              { wert: 'bar', label: 'Bar' },
              { wert: 'karte', label: 'Karte' },
              { wert: 'paypal', label: 'PayPal' },
              { wert: 'sonstiges', label: 'Sonstiges' },
            ]}
          />
        </FormRaster>
        {vorschlag && (
          <Stapel abstand={8}>
            <Checkbox
              label={`Rest von ${euro(vorschlag.rest)} als Skonto (${String(vorschlag.prozent).replace('.', ',')} %) ausbuchen`}
              checked={skonto}
              onChange={setSkonto}
            />
            <Meta>
              {skonto
                ? 'Die Rechnung gilt dann als bezahlt.'
                : `Ohne Haken bleibt die Rechnung teilbezahlt, ${euro(vorschlag.rest)} bleiben offen.`}
            </Meta>
            {skonto && !vorschlag.plausibel && <Meldung ton="achtung">Das sind mehr als 3 %. Prüf, ob wirklich Skonto vereinbart war.</Meldung>}
          </Stapel>
        )}
        {betrag > rest && rest > 0 && <Meldung ton="achtung">Der Betrag ist höher als offen ({euro(rest)}). Prüf den Betrag.</Meldung>}
      </Stapel>
    </Dialog>
  );
}
