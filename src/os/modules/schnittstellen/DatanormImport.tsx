import { useState } from 'react';
import { batch, db } from '@core/db';
import { emit } from '@core/events';
import { euro } from '@core/format';
import { useDarf } from '@core/session';
import { Auswahl, Button, DateiKnopf, FormRaster, Karte, Kennzahl, Leer, Meldung, Meta, Raster, Seite, Stapel, Tabelle, ZahlEingabe, useToast } from '@ui/index';
import { artikelImportieren, findeArtikel, type ImportZeile } from '@modules/artikel/daten';
import { datanormLesen, datanormText, type DatanormErgebnis } from './datanorm';
import { fehlerMelden, nutzungMelden } from './connectoren';

/** Artikel deaktivieren, die der Großhändler gelöscht hat (Kennzeichen „L“) */
export function artikelDeaktivieren(nummern: string[]): number {
  let n = 0;
  batch(() => {
    for (const nr of nummern) {
      const a = db.artikel.all().find((x) => x.nummer === nr && x.aktiv);
      if (a) {
        db.artikel.update(a.id, { aktiv: false }, { text: 'Vom Großhändler gelöscht (DATANORM)' });
        n++;
      }
    }
  });
  return n;
}

export function DatanormImport() {
  const darf = useDarf('geld');
  const toast = useToast();
  const lieferanten = db.lieferanten.use();
  const [lieferantId, setLieferantId] = useState('');
  const [rabatt, setRabatt] = useState<number>();
  const [text, setText] = useState<string>();
  const [dateiname, setDateiname] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const [dateiFehler, setDateiFehler] = useState<string>();
  const [ergebnis, setErgebnis] = useState<{ neu: number; aktualisiert: number; deaktiviert: number }>();
  if (!darf) return <Seite titel="DATANORM einlesen"><Leer titel="Hier geht es um Preise" text="Artikel und Preise des Großhandels pflegt das Büro." icon="schloss" /></Seite>;

  const gelesen: DatanormErgebnis | undefined = text != null ? datanormLesen(text, { rabattProzent: rabatt }) : undefined;
  const gueltig = gelesen?.fehler ? [] : (gelesen?.zeilen ?? []).filter((z) => !z.fehler);
  const vorhandene = db.artikel.all();
  const neu = gueltig.filter((z) => !findeArtikel(z, vorhandene)).length;
  const aktualisiert = gueltig.length - neu;
  const loeschen = gelesen?.loeschen.filter((nr) => vorhandene.some((a) => a.nummer === nr && a.aktiv)).length ?? 0;

  const datei = async (f: File | undefined) => {
    if (!f) return;
    setErgebnis(undefined);
    setDateiFehler(undefined);
    if (f.size > 50_000_000) {
      setText(undefined);
      setDateiFehler('Die Datei ist größer als 50 MB. Frag deinen Großhändler nach einer Datei nur mit deinen Warengruppen.');
      return;
    }
    setLaedt(true);
    try {
      const t = datanormText(new Uint8Array(await f.arrayBuffer()));
      setText(t);
      setDateiname(f.name);
      const e = datanormLesen(t);
      if (e.fehler) fehlerMelden('datanorm', e.fehler);
    } catch {
      setText(undefined);
      setDateiFehler('Die Datei konnte nicht gelesen werden.');
      fehlerMelden('datanorm', 'Die Datei konnte nicht gelesen werden.');
    } finally {
      setLaedt(false);
    }
  };

  const uebernehmen = () => {
    if (!gelesen || gelesen.fehler) return;
    const r = artikelImportieren(gueltig, { lieferantId: lieferantId || undefined });
    const deaktiviert = artikelDeaktivieren(gelesen.loeschen);
    const satz = `${r.neu} neu, ${r.aktualisiert} aktualisiert${deaktiviert ? `, ${deaktiviert} deaktiviert` : ''}`;
    nutzungMelden('datanorm', satz);
    emit({ typ: 'import.abgeschlossen', daten: { art: 'datanorm', datei: dateiname, neu: r.neu, aktualisiert: r.aktualisiert, deaktiviert } });
    setErgebnis({ neu: r.neu, aktualisiert: r.aktualisiert, deaktiviert });
    setText(undefined);
    toast(`Artikel übernommen: ${satz}.`, { ton: 'erfolg' });
  };

  return (
    <Seite
      titel="DATANORM einlesen"
      untertitel="Artikel und Preise deines Großhändlers. Vorhandene Artikel mit gleicher Nummer oder EAN werden aktualisiert, nicht verdoppelt."
      zurueck={{ to: '/betrieb/schnittstellen', label: 'Schnittstellen' }}
    >
      <Stapel>
        {ergebnis && (
          <Meldung ton="erfolg" titel="Fertig" aktion={<Button klein variante="sekundaer" to="/betrieb/katalog/material">Zu den Artikeln</Button>}>
            {ergebnis.neu} Artikel angelegt, {ergebnis.aktualisiert} aktualisiert{ergebnis.deaktiviert ? `, ${ergebnis.deaktiviert} deaktiviert` : ''}.
          </Meldung>
        )}
        <Karte>
          <Stapel>
            <FormRaster>
              <Auswahl label="Großhändler" optional value={lieferantId} leer="Ohne Zuordnung" onChange={(e) => setLieferantId(e.target.value)} optionen={lieferanten.map((l) => ({ wert: l.id, label: l.name }))} />
              <ZahlEingabe label="Dein Rabatt auf den Listenpreis (%)" optional wert={rabatt} onWert={setRabatt} hilfe="Nur bei Listenpreisen: daraus rechnet Macher deinen Einkaufspreis." />
            </FormRaster>
            <div>
              <DateiKnopf variante="primaer" onDateien={([f]) => datei(f)} laedt={laedt} laedtText="Wird gelesen …">
                DATANORM-Datei wählen
              </DateiKnopf>
            </div>
            <Meta>Meist heißt die Datei DATANORM.001 oder endet auf .dat – du bekommst sie im Kundenportal deines Großhändlers.</Meta>
            {(dateiFehler ?? gelesen?.fehler) && <Meldung ton="achtung">{dateiFehler ?? gelesen?.fehler}</Meldung>}
          </Stapel>
        </Karte>

        {gelesen && !gelesen.fehler && (
          <Karte icon="dokument" titel={`DATANORM ${gelesen.version}${gelesen.lieferant ? ` von ${gelesen.lieferant}` : ''}`}>
            <Stapel>
              <Raster min={150}>
                <Kennzahl label="Neue Artikel" wert={neu} />
                <Kennzahl label="Aktualisiert" wert={aktualisiert} />
                {loeschen > 0 && <Kennzahl label="Werden deaktiviert" wert={loeschen} ton="achtung" />}
              </Raster>
              <Tabelle<ImportZeile>
                zeilen={gueltig.slice(0, 8)}
                schluessel={(z) => z.nummer ?? z.name}
                spalten={[
                  { titel: 'Nummer', wert: (z) => z.nummer, nebensaechlich: true },
                  { titel: 'Bezeichnung', wert: (z) => z.name },
                  { titel: 'Einheit', wert: (z) => z.einheit ?? '–', nebensaechlich: true },
                  { titel: 'Einkauf', wert: (z) => (z.ek != null ? euro(z.ek) : '–'), zahl: true },
                  { titel: 'Verkauf', wert: (z) => (z.vk != null ? euro(z.vk) : '–'), zahl: true, nebensaechlich: true },
                ]}
              />
              {gueltig.length > 8 && <Meta>… und {gueltig.length - 8} weitere Artikel.</Meta>}
              {Object.keys(gelesen.uebersprungen).length > 0 && (
                <Meta>Übersprungen (Langtexte, Preisänderungen, Rabatte): {Object.values(gelesen.uebersprungen).reduce((s, n) => s + n, 0)} Sätze.</Meta>
              )}
              <div>
                <Button icon="upload" onClick={uebernehmen} disabled={!gueltig.length && !loeschen}>
                  {gueltig.length === 1 ? '1 Artikel übernehmen' : `${gueltig.length} Artikel übernehmen`}
                </Button>
              </div>
            </Stapel>
          </Karte>
        )}
      </Stapel>
    </Seite>
  );
}
