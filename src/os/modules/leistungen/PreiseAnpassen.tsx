import { useState } from 'react';
import { batch, db } from '@core/db';
import { euro } from '@core/format';
import { useDarf } from '@core/session';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Leer, Meldung, Segmente, Seite, Stapel, Tabelle, useToast } from '@ui/index';
import { RUNDUNGEN, kategorienVon, preisVorschau, prozentAus, type Rundung } from './daten';

export function PreiseAnpassen() {
  const toast = useToast();
  const geld = useDarf('geld');
  const leistungen = db.leistungen.use((l) => l.aktiv);
  const [kategorie, setKategorie] = useState('');
  const [prozentText, setProzentText] = useState('');
  const [rundung, setRundung] = useState<Rundung>('10ct');
  const prozent = prozentAus(prozentText);
  const auswahl = leistungen.filter((l) => !kategorie || (l.kategorie || 'Ohne Kategorie') === kategorie);
  const vorschau = prozent != null && prozent !== 0 ? preisVorschau(auswahl, prozent, rundung) : [];
  const zurueck = { to: '/betrieb/leistungen', label: 'Leistungen' };

  if (!geld)
    return (
      <Seite titel="Preise anpassen" zurueck={zurueck}>
        <Meldung ton="achtung" titel="Dafür fehlt dir ein Recht">Preise ändern darf nur, wer das Recht „Preise & Geld“ hat.</Meldung>
      </Seite>
    );

  const anwenden = () => {
    const alt = vorschau.map((z) => ({ id: z.leistung.id, preis: z.alt }));
    const text = `Preis ${prozent! > 0 ? '+' : ''}${String(prozent).replace('.', ',')} % angepasst`;
    batch(() => vorschau.forEach((z) => db.leistungen.update(z.leistung.id, { preis: z.neu }, { text: `${text}: ${euro(z.alt)} → ${euro(z.neu)}` })));
    toast(`${vorschau.length} Preise angepasst.`, {
      aktion: { label: 'Rückgängig', onClick: () => batch(() => alt.forEach((a) => db.leistungen.update(a.id, { preis: a.preis }, { text: 'Preisanpassung zurückgenommen' }))) },
    });
    setProzentText('');
  };

  return (
    <Seite titel="Preise anpassen" untertitel="Erhöhe oder senke Preise einer Kategorie in einem Schritt." zurueck={zurueck}>
      <Stapel abstand={24}>
        <Karte>
          <Stapel>
            <FormRaster>
              <Auswahl
                label="Kategorie"
                value={kategorie}
                leer={`Alle aktiven Leistungen (${leistungen.length})`}
                onChange={(e) => setKategorie(e.target.value)}
                optionen={kategorienVon(leistungen).map((k) => ({ wert: k, label: `${k} (${leistungen.filter((l) => (l.kategorie || 'Ohne Kategorie') === k).length})` }))}
              />
              <Eingabe
                label="Änderung in %"
                inputMode="decimal"
                placeholder="z. B. 5 oder -3"
                value={prozentText}
                onChange={(e) => setProzentText(e.target.value)}
                fehler={prozentText && prozent == null ? 'Gib eine Zahl ein, z. B. 5 oder -3,5.' : undefined}
                hilfe="Minus senkt die Preise."
              />
            </FormRaster>
            <Segmente label="Runden" wert={rundung} onChange={setRundung} optionen={RUNDUNGEN} />
          </Stapel>
        </Karte>
        <Karte titel="Vorschau" aktion={vorschau.length ? <Button onClick={anwenden}>{`${vorschau.length} Preise anpassen`}</Button> : undefined}>
          {!auswahl.length ? (
            <Leer titel="Keine Leistungen in dieser Auswahl" icon="liste" />
          ) : !vorschau.length ? (
            <Leer titel="Noch keine Änderung" text="Trag ein, um wie viel Prozent sich die Preise ändern sollen. Du siehst hier vorher jeden neuen Preis." icon="euro" />
          ) : (
            <Tabelle
              zeilen={vorschau}
              schluessel={(z) => z.leistung.id}
              spalten={[
                { titel: 'Leistung', wert: (z) => z.leistung.name, sortierWert: (z) => z.leistung.name },
                { titel: 'Bisher', wert: (z) => euro(z.alt), zahl: true, nebensaechlich: true },
                { titel: 'Neu', wert: (z) => <strong>{euro(z.neu)}</strong>, zahl: true, sortierWert: (z) => z.neu },
                { titel: 'Differenz', wert: (z) => `${z.neu > z.alt ? '+' : ''}${euro(z.neu - z.alt)}`, zahl: true },
              ]}
            />
          )}
        </Karte>
        <Meldung>Bestehende Angebote und Rechnungen bleiben unverändert. Neue Preise gelten ab jetzt.</Meldung>
      </Stapel>
    </Seite>
  );
}
