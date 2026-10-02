import { useState } from 'react';
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { datum, heute } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Button, Dialog, Eingabe, FormRaster, Meldung, Segmente, Stapel, Textfeld, useToast } from '@ui/index';
import { ERGEBNIS_LABEL, intervall, plusMonate, PRUEFARTEN, pruefungDokumentieren, standardIntervall, type Ergebnis } from './daten';

const MAX_BYTES = 2_000_000;

export function PruefungDialog({ id, offen, onSchliessen }: { id: ID; offen: boolean; onSchliessen: () => void }) {
  const b = db.betriebsmittel.useOne(id);
  return (
    <Dialog offen={offen && !!b} onSchliessen={onSchliessen} titel={b ? `Prüfung dokumentieren: ${b.name}` : 'Prüfung dokumentieren'}>
      {b && offen && <PruefungFormular id={id} fertig={onSchliessen} />}
    </Dialog>
  );
}

function PruefungFormular({ id, fertig }: { id: ID; fertig: () => void }) {
  const b = db.betriebsmittel.get(id)!;
  const toast = useToast();
  const [letzterPruefer, setLetzterPruefer] = useEinstellung('pruefungen.letzterPruefer', '');
  const [art, setArt] = useState(b.pruefungArt ?? (b.art === 'fahrzeug' ? 'TÜV/HU' : 'DGUV V3'));
  const [tag, setTag] = useState(heute());
  const [ergebnis, setErgebnis] = useState<Ergebnis>('bestanden');
  const [pruefer, setPruefer] = useState(letzterPruefer);
  const [monate, setMonate] = useState(String(b.pruefungArt === art ? intervall(b) : standardIntervall(art)));
  const [bemerkung, setBemerkung] = useState('');
  const [datei, setDatei] = useState<File>();
  const [fehler, setFehler] = useState<{ feld: string; text: string }>();
  const [laedt, setLaedt] = useState(false);

  const m = Number(monate);
  const naechste = tag && m > 0 ? plusMonate(tag, m) : undefined;
  const arten = [...new Set([...PRUEFARTEN.map((p) => p.art), ...(b.pruefungArt ? [b.pruefungArt] : [])])];

  const speichern = async () => {
    if (!tag) return setFehler({ feld: 'datum', text: 'Wann wurde geprüft?' });
    if (tag > heute()) return setFehler({ feld: 'datum', text: 'Das Prüfdatum liegt in der Zukunft.' });
    if (!pruefer.trim()) return setFehler({ feld: 'pruefer', text: 'Wer hat geprüft? (Name oder Firma)' });
    if (!(m > 0 && m <= 120)) return setFehler({ feld: 'monate', text: 'Intervall zwischen 1 und 120 Monaten.' });
    if (datei && datei.size > MAX_BYTES) return setFehler({ feld: 'datei', text: 'Die Datei ist größer als 2 MB. Mach ein Foto vom Protokoll oder verkleinere das PDF.' });
    setFehler(undefined);
    setLaedt(true);
    try {
      let dokumentId: ID | undefined;
      if (datei) {
        const url = await alsDataUrl(datei);
        dokumentId = db.dokumente.create({
          art: datei.type.startsWith('image/') ? 'foto' : 'pdf',
          titel: `${art}-Protokoll ${b.name} (${datum(tag)})`,
          url,
          mime: datei.type,
          groesse: datei.size,
          bezug: { typ: 'betriebsmittel', id },
          tags: ['pruefung'],
        }).id;
      }
      const n = pruefungDokumentieren(id, { datum: tag, ergebnis, pruefer: pruefer.trim(), art, intervallMonate: m, dokumentId, bemerkung: bemerkung.trim() || undefined });
      setLetzterPruefer(pruefer.trim());
      toast(ergebnis === 'nicht_bestanden' ? `Gespeichert. ${b.name} ist als defekt markiert.` : `Prüfung gespeichert. Nächste Prüfung am ${datum(n)}.`, {
        ton: ergebnis === 'nicht_bestanden' ? 'achtung' : 'erfolg',
      });
      fertig();
    } catch {
      setFehler({ feld: 'datei', text: 'Die Datei konnte nicht gelesen werden. Versuch es noch einmal.' });
    } finally {
      setLaedt(false);
    }
  };

  const f = (feld: string) => (fehler?.feld === feld ? fehler.text : undefined);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void speichern();
      }}
    >
      <Stapel>
        <FormRaster>
          <Auswahl
            label="Prüfart"
            value={art}
            onChange={(e) => {
              setArt(e.target.value);
              setMonate(String(standardIntervall(e.target.value)));
            }}
            optionen={arten.map((a) => ({ wert: a, label: a }))}
          />
          <Eingabe label="Geprüft am" type="date" value={tag} max={heute()} onChange={(e) => setTag(e.target.value)} fehler={f('datum')} />
        </FormRaster>
        <Segmente
          label="Ergebnis"
          wert={ergebnis}
          onChange={setErgebnis}
          optionen={(Object.keys(ERGEBNIS_LABEL) as Ergebnis[]).map((e) => ({ wert: e, label: e === 'maengel' ? 'Mit Mängeln' : ERGEBNIS_LABEL[e] }))}
        />
        <FormRaster>
          <Eingabe label="Prüfer" value={pruefer} onChange={(e) => setPruefer(e.target.value)} fehler={f('pruefer')} placeholder="z. B. Elektro Meier oder TÜV Nord" />
          <Eingabe label="Intervall in Monaten" type="number" inputMode="numeric" min={1} max={120} value={monate} onChange={(e) => setMonate(e.target.value)} fehler={f('monate')} />
        </FormRaster>
        <Eingabe
          label="Prüfprotokoll"
          type="file"
          accept="application/pdf,image/*"
          optional
          hilfe="PDF oder Foto, max. 2 MB"
          fehler={f('datei')}
          onChange={(e) => setDatei(e.target.files?.[0])}
        />
        <Textfeld label="Bemerkung" optional value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} placeholder="z. B. Zuleitung getauscht" />
        {ergebnis === 'nicht_bestanden' ? (
          <Meldung ton="achtung" titel="Gerät wird gesperrt">Es wird als defekt markiert und darf nicht verwendet werden, bis es repariert und erneut geprüft ist.</Meldung>
        ) : (
          naechste && <Meldung ton="neutral">Nächste Prüfung: {datum(naechste)}</Meldung>
        )}
        <div className="mm-zeile" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variante="tertiaer" onClick={fertig}>
            Abbrechen
          </Button>
          <Button type="submit" laedt={laedt} laedtText="Wird gespeichert …">
            Prüfung speichern
          </Button>
        </div>
      </Stapel>
    </form>
  );
}

function alsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}
