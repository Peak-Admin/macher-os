/** Kleine gemeinsame Bausteine des Pakets „geld“ (nur aus UI-Bausteinen zusammengesetzt). */
import { useEffect, useState } from 'react';
import { db } from '@core/db';
import { euro } from '@core/format';
import type { ID } from '@core/objects';
import { Button, Dialog, Eingabe, FormAbschnitt, FormRaster, Meldung, Meta, Schalter, Stapel, Status, Zeile, useToast } from '@ui/index';
import { statusText, summenZeilen, type Mangel, type RechnungsSummen } from './logik';
import type { RechnungX } from './typen';

export function RechnungStatus({ r }: { r: RechnungX }) {
  const s = statusText(r);
  return <Status ton={s.ton}>{s.text}</Status>;
}

/** Summenblock: Netto, USt, Brutto, Abzüge, Einbehalt, Zahlbetrag (dieselben Zeilen wie im PDF) */
export function SummenListe({ s, kleinunternehmer }: { s: RechnungsSummen; kleinunternehmer?: boolean }) {
  return (
    <Stapel abstand={4}>
      {summenZeilen(s, kleinunternehmer).map((z) => (
        <div key={z.label}>
          <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, fontWeight: z.gesamt ? 700 : undefined }}>
            <span>{z.label.replace(/^zzgl\. /, '')}</span>
            <span className="mm-number">{euro(z.wert)}</span>
          </div>
          {z.klein && <Meta>{z.klein}</Meta>}
        </div>
      ))}
    </Stapel>
  );
}

/** Fehlende Pflichtangaben mit direkter Behebung */
export function MaengelListe({ maengel, kundeId, ton = 'achtung' }: { maengel: Mangel[]; kundeId?: ID; ton?: 'achtung' | 'neutral' }) {
  const [betriebOffen, setBetriebOffen] = useState(false);
  const [kundeOffen, setKundeOffen] = useState(false);
  if (!maengel.length) return null;
  const betrieb = maengel.some((m) => m.wo === 'betrieb');
  const kunde = maengel.some((m) => m.wo === 'kunde');
  return (
    <Meldung
      ton={ton}
      titel={ton === 'achtung' ? 'Das fehlt noch für eine gültige Rechnung' : 'Das solltest du noch ergänzen'}
    >
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {maengel.map((m) => (
          <li key={m.feld}>{m.text}</li>
        ))}
      </ul>
      {(betrieb || (kunde && kundeId)) && (
        <div style={{ marginTop: 8 }}>
          <Zeile>
            {betrieb && (
              <Button klein variante="sekundaer" onClick={() => setBetriebOffen(true)}>
                Betriebsdaten ergänzen
              </Button>
            )}
            {kunde && kundeId && (
              <Button klein variante="sekundaer" onClick={() => setKundeOffen(true)}>
                Kundendaten ergänzen
              </Button>
            )}
          </Zeile>
        </div>
      )}
      <BetriebsdatenDialog offen={betriebOffen} onSchliessen={() => setBetriebOffen(false)} />
      {kundeId && <KundendatenDialog kundeId={kundeId} offen={kundeOffen} onSchliessen={() => setKundeOffen(false)} />}
    </Meldung>
  );
}

/** Betriebsdaten für Rechnungen (Briefkopf, Steuernummer, Bank) */
export function BetriebsdatenDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const b = db.betrieb.useOne('betrieb');
  const toast = useToast();
  const [f, setF] = useState(() => werte());
  function werte() {
    return {
      name: b?.name ?? '',
      strasse: b?.adresse?.strasse ?? '',
      plz: b?.adresse?.plz ?? '',
      ort: b?.adresse?.ort ?? '',
      telefon: b?.telefon ?? '',
      email: b?.email ?? '',
      steuernummer: b?.steuernummer ?? '',
      ustId: b?.ustId ?? '',
      iban: b?.iban ?? '',
      zahlungszielTage: String(b?.zahlungszielTage ?? 14),
      kleinunternehmer: !!b?.kleinunternehmer,
    };
  }
  useEffect(() => {
    if (offen) setF(werte());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const speichern = () => {
    if (!b) return;
    db.betrieb.update('betrieb', {
      name: f.name.trim(),
      adresse: { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() },
      telefon: f.telefon.trim(),
      email: f.email.trim(),
      steuernummer: f.steuernummer.trim() || undefined,
      ustId: f.ustId.trim() || undefined,
      iban: f.iban.trim() || undefined,
      zahlungszielTage: Math.max(0, Number(f.zahlungszielTage) || 0),
      kleinunternehmer: f.kleinunternehmer,
    });
    toast('Betriebsdaten gespeichert.');
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Betriebsdaten für Rechnungen"
      icon="betrieb"
      breit
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Betriebsdaten speichern</Button>
        </>
      }
    >
      <Stapel>
        <FormAbschnitt titel="Betrieb und Kontakt" icon="betrieb">
          <FormRaster>
            <Eingabe label="Name des Betriebs" value={f.name} onChange={set('name')} />
            <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} />
            <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} inputMode="numeric" />
            <Eingabe label="Ort" value={f.ort} onChange={set('ort')} />
            <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} />
            <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} />
          </FormRaster>
        </FormAbschnitt>
        <FormAbschnitt titel="Steuer und Zahlung" icon="euro">
          <FormRaster>
            <Eingabe label="Steuernummer" value={f.steuernummer} onChange={set('steuernummer')} hilfe="Steuernummer oder USt-IdNr. ist Pflicht." />
            <Eingabe label="USt-IdNr." value={f.ustId} onChange={set('ustId')} optional />
            <Eingabe label="IBAN" value={f.iban} onChange={set('iban')} />
            <Eingabe label="Zahlungsziel in Tagen" type="number" min={0} value={f.zahlungszielTage} onChange={set('zahlungszielTage')} />
          </FormRaster>
          <Schalter
            label="Kleinunternehmer (§ 19 UStG)"
            beschreibung="Dann weist Macher keine Umsatzsteuer aus und setzt den Pflichthinweis."
            checked={f.kleinunternehmer}
            onChange={(v) => setF({ ...f, kleinunternehmer: v })}
          />
        </FormAbschnitt>
      </Stapel>
    </Dialog>
  );
}

/** Anschrift und E-Mail eines Kunden ergänzen, ohne die Rechnung zu verlassen */
export function KundendatenDialog({ kundeId, offen, onSchliessen }: { kundeId: ID; offen: boolean; onSchliessen: () => void }) {
  const k = db.kunden.useOne(kundeId);
  const toast = useToast();
  const [f, setF] = useState({ strasse: '', plz: '', ort: '', email: '' });
  useEffect(() => {
    if (offen) setF({ strasse: k?.adresse?.strasse ?? '', plz: k?.adresse?.plz ?? '', ort: k?.adresse?.ort ?? '', email: k?.email ?? '' });
  }, [offen, k]);
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [key]: e.target.value });
  if (!k) return null;
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`Kundendaten: ${k.name}`}
      icon="person"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              db.kunden.update(k.id, { adresse: { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() }, email: f.email.trim() || undefined });
              toast('Kundendaten gespeichert.');
              onSchliessen();
            }}
          >
            Kundendaten speichern
          </Button>
        </>
      }
    >
      <FormRaster>
        <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} />
        <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} inputMode="numeric" />
        <Eingabe label="Ort" value={f.ort} onChange={set('ort')} />
        <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} optional />
      </FormRaster>
    </Dialog>
  );
}
