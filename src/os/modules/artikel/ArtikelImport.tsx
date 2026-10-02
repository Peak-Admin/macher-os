import { useState } from 'react';
import { db } from '@core/db';
import { euro } from '@core/format';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, Tabelle, Textfeld, Zeile, useToast, zahlAus, DateiFeld } from '@ui/index';
import { artikelImportieren, csvParsen, findeArtikel, IMPORT_FELDER, spaltenRaten, zeilenUmwandeln, type ImportZeile, type Zuordnung } from './daten';

const BEISPIEL = 'Artikelnummer;Bezeichnung;Einheit;EK;VK;Kategorie;EAN\nK-100;NYM-J 3x1,5 mm²;m;0,48;0,95;Kabel;4012345000017';

export function ArtikelImport() {
  const toast = useToast();
  const lieferanten = db.lieferanten.use();
  const [text, setText] = useState('');
  const [kopfzeile, setKopfzeile] = useState(true);
  const [zuordnung, setZuordnung] = useState<Zuordnung>({});
  const [lieferantId, setLieferantId] = useState('');
  const [aufschlag, setAufschlag] = useState('');
  const [fehler, setFehler] = useState<string>();
  const [ergebnis, setErgebnis] = useState<{ neu: number; aktualisiert: number; uebersprungen: number }>();

  const roh = text ? csvParsen(text) : [];
  const kopf = kopfzeile ? (roh[0] ?? []) : (roh[0] ?? []).map((_, i) => `Spalte ${i + 1}`);
  const daten = kopfzeile ? roh.slice(1) : roh;
  const spalten = kopf.map((k, i) => ({ wert: String(i), label: k || `Spalte ${i + 1}` }));
  const zeilen: ImportZeile[] = zuordnung.name != null ? zeilenUmwandeln(daten, zuordnung, { aufschlag: zahlAus(aufschlag) }) : [];
  const vorhandene = db.artikel.all();
  const neu = zeilen.filter((z) => !z.fehler && !findeArtikel(z, vorhandene)).length;
  const upd = zeilen.filter((z) => !z.fehler && findeArtikel(z, vorhandene)).length;
  const kaputt = zeilen.filter((z) => z.fehler).length;

  const laden = (t: string) => {
    setText(t);
    setErgebnis(undefined);
    setFehler(undefined);
    const r = csvParsen(t);
    if (r.length && r[0].length < 2) setFehler('Die Datei hat nur eine Spalte. Ist sie mit Semikolon (;) getrennt? So speichert Excel „CSV (Trennzeichen-getrennt)“.');
    setZuordnung(kopfzeile && r[0] ? spaltenRaten(r[0]) : {});
  };

  const datei = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 5_000_000) return setFehler('Die Datei ist größer als 5 MB. Teile sie bitte auf.');
    const buf = await f.arrayBuffer();
    // Excel speichert oft Windows-1252 – UTF-8 versuchen, sonst umstellen
    let t = new TextDecoder('utf-8').decode(buf);
    if (t.includes('�')) t = new TextDecoder('windows-1252').decode(buf);
    laden(t);
  };

  const importieren = () => {
    if (zuordnung.name == null) return setFehler('Ordne mindestens die Spalte „Bezeichnung“ zu.');
    const r = artikelImportieren(zeilen, { lieferantId: lieferantId || undefined });
    setErgebnis(r);
    setText('');
    toast(`${r.neu} Artikel angelegt, ${r.aktualisiert} aktualisiert.`);
  };

  return (
    <Seite titel="Artikel importieren" untertitel="Artikelliste vom Großhändler oder aus Excel als CSV (Semikolon-getrennt)." zurueck={{ to: '/betrieb/katalog/material', label: 'Artikel' }}>
      <Stapel>
        {ergebnis && (
          <Meldung ton="erfolg" titel="Import fertig" aktion={<Button klein variante="sekundaer" to="/betrieb/katalog/material">Zu den Artikeln</Button>}>
            {ergebnis.neu} neu angelegt, {ergebnis.aktualisiert} aktualisiert{ergebnis.uebersprungen ? `, ${ergebnis.uebersprungen} ohne Bezeichnung übersprungen` : ''}.
          </Meldung>
        )}
        <Karte titel="1. Datei wählen">
          <Stapel>
            <DateiFeld label="CSV-Datei" accept=".csv,.txt,text/csv" onDateien={([f]) => datei(f)} knopf="CSV-Datei wählen" hilfe="Vorhandene Artikel (gleiche Artikelnummer oder EAN) werden aktualisiert, nicht doppelt angelegt." />
            <Textfeld label="… oder Inhalt einfügen" optional rows={4} value={text} onChange={(e) => laden(e.target.value)} placeholder={BEISPIEL} />
            <Zeile>
              <Button klein variante="tertiaer" onClick={() => laden(BEISPIEL)}>
                Beispiel einfügen
              </Button>
              <Button
                klein
                variante="tertiaer"
                onClick={() => {
                  setKopfzeile(!kopfzeile);
                  setZuordnung({});
                }}
              >
                {kopfzeile ? 'Erste Zeile ist keine Überschrift' : 'Erste Zeile ist Überschrift'}
              </Button>
            </Zeile>
            {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          </Stapel>
        </Karte>

        {roh.length > 0 && (
          <Karte titel="2. Spalten zuordnen">
            <Stapel>
              <FormRaster spalten={3}>
                {IMPORT_FELDER.map((f) => (
                  <Auswahl
                    key={f.feld}
                    label={f.label}
                    optional={!f.pflicht}
                    value={zuordnung[f.feld] != null ? String(zuordnung[f.feld]) : ''}
                    leer="– nicht importieren –"
                    onChange={(e) => setZuordnung({ ...zuordnung, [f.feld]: e.target.value === '' ? undefined : Number(e.target.value) })}
                    optionen={spalten}
                  />
                ))}
              </FormRaster>
              <FormRaster>
                <Auswahl label="Lieferant für alle Artikel" optional value={lieferantId} leer="Nicht ändern" onChange={(e) => setLieferantId(e.target.value)} optionen={lieferanten.map((l) => ({ wert: l.id, label: l.name }))} />
                <Eingabe label="Aufschlag, wenn kein VK in der Datei (%)" optional inputMode="decimal" value={aufschlag} onChange={(e) => setAufschlag(e.target.value)} placeholder="z. B. 30" />
              </FormRaster>
            </Stapel>
          </Karte>
        )}

        {zeilen.length > 0 && (
          <Karte titel="3. Prüfen und importieren">
            <Stapel>
              <Zeile>
                <Status ton="erfolg">{neu} neu</Status>
                <Status ton="aktiv">{upd} aktualisieren</Status>
                {kaputt > 0 && <Status ton="achtung">{kaputt} ohne Bezeichnung</Status>}
              </Zeile>
              <Tabelle
                zeilen={zeilen.slice(0, 8).map((z, i) => ({ ...z, i }))}
                schluessel={(z) => String(z.i)}
                spalten={[
                  { titel: 'Bezeichnung', wert: (z) => z.name || <Status ton="achtung">fehlt</Status> },
                  { titel: 'Nr.', wert: (z) => z.nummer ?? '–', nebensaechlich: true },
                  { titel: 'Einheit', wert: (z) => z.einheit ?? '–', nebensaechlich: true },
                  { titel: 'EK', wert: (z) => (z.ek != null ? euro(z.ek) : '–'), zahl: true },
                  { titel: 'VK', wert: (z) => (z.vk != null ? euro(z.vk) : '–'), zahl: true },
                ]}
              />
              {zeilen.length > 8 && <Meta>… und {zeilen.length - 8} weitere Zeilen.</Meta>}
              <div>
                <Button icon="upload" onClick={importieren} disabled={!neu && !upd}>
                  {neu + upd} Artikel importieren
                </Button>
              </div>
            </Stapel>
          </Karte>
        )}
        {roh.length > 0 && zuordnung.name == null && <Leer titel="Welche Spalte ist die Bezeichnung?" text="Ordne oben mindestens die Bezeichnung zu, dann siehst du die Vorschau." icon="liste" />}

        <Karte titel="Datanorm" kompakt>
          <Zeile zwischen>
            <Meta>Datanorm-Datei vom Großhändler direkt einlesen, inklusive Preisupdates.</Meta>
            <Button variante="sekundaer" icon="upload" to="/betrieb/schnittstellen/datanorm">
              Datanorm einlesen
            </Button>
          </Zeile>
        </Karte>
      </Stapel>
    </Seite>
  );
}
