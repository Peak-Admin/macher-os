import { useState } from 'react';
import { db } from '@core/db';
import { gewerkVorlage } from '@core/gewerke';
import { datum } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import type { Anlage, Auftrag, ID } from '@core/objects';
import { BeispielMarke, Button, Dialog, Eingabe, FormRaster, Leer, Liste, ListenZeile, Stapel, Status, Textfeld } from '@ui/index';
import { OrtAuswahl } from '@ui/objekt';
import { GEWAEHRLEISTUNG_TEXT, WARTUNG_TEXT, gewaehrleistungStatus, naechsteWartungBerechnen, wartungsStatus } from './daten';

export function anlageName(a: Pick<Anlage, 'typ' | 'hersteller' | 'modell'>) {
  return [a.typ, [a.hersteller, a.modell].filter(Boolean).join(' ')].filter(Boolean).join(' – ');
}

/** Wichtigster Status einer Anlage als Text */
export function AnlageStatus({ a }: { a: Anlage }) {
  const w = wartungsStatus(a);
  const g = gewaehrleistungStatus(a);
  if (w === 'ueberfaellig' || w === 'bald') return <Status ton={WARTUNG_TEXT[w].ton}>{WARTUNG_TEXT[w].text}</Status>;
  if (g === 'endet_bald') return <Status ton="achtung">{GEWAEHRLEISTUNG_TEXT[g].text}</Status>;
  if (w === 'ok') return <Status ton="erfolg">Wartung {datum(a.naechsteWartung ?? naechsteWartungBerechnen(a))}</Status>;
  return null;
}

/** Wartungsauftrag für eine Anlage anlegen und zurückgeben */
export function wartungsauftragAnlegen(a: Anlage): Auftrag {
  return db.auftraege.create({
    nummer: naechsteNummer('auftrag'),
    titel: `Wartung ${anlageName(a)}`,
    art: 'wartung',
    phase: 'beauftragt',
    kundeId: a.kundeId,
    ortId: a.ortId,
    anlageIds: [a.id],
    quelle: 'sonstiges',
    beschreibung: [a.seriennummer && `Seriennummer: ${a.seriennummer}`, a.letzteWartung && `Letzte Wartung: ${datum(a.letzteWartung)}`].filter(Boolean).join('\n') || undefined,
  });
}

type Entwurf = Record<'typ' | 'hersteller' | 'modell' | 'seriennummer' | 'baujahr' | 'eingebautAm' | 'wartungMonate' | 'letzteWartung' | 'naechsteWartung' | 'gewaehrleistungBis' | 'notiz', string>;

export function AnlageDialog({ anlage, kundeId, ortId, onSchliessen, onGespeichert }: { anlage?: Anlage; kundeId?: ID; ortId?: ID; onSchliessen: () => void; onGespeichert?: (a: Anlage) => void }) {
  const [ort, setOrt] = useState<ID | undefined>(anlage?.ortId ?? ortId);
  const kunde = anlage?.kundeId ?? kundeId ?? db.orte.get(ort)?.kundeId;
  const s = (v: string | number | undefined) => (v == null ? '' : String(v));
  const [f, setF] = useState<Entwurf>({
    typ: s(anlage?.typ),
    hersteller: s(anlage?.hersteller),
    modell: s(anlage?.modell),
    seriennummer: s(anlage?.seriennummer),
    baujahr: s(anlage?.baujahr),
    eingebautAm: s(anlage?.eingebautAm),
    wartungMonate: s(anlage?.wartungMonate),
    letzteWartung: s(anlage?.letzteWartung),
    // nur abweichende (manuell gesetzte) nächste Wartung vorbelegen, sonst wird sie neu berechnet
    naechsteWartung: anlage?.naechsteWartung && anlage.naechsteWartung !== naechsteWartungBerechnen(anlage) ? anlage.naechsteWartung : '',
    gewaehrleistungBis: s(anlage?.gewaehrleistungBis),
    notiz: s(anlage?.notiz),
  });
  const [fehler, setFehler] = useState<Partial<Record<keyof Entwurf | 'ort', string>>>({});
  const set = (k: keyof Entwurf) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const typen = gewerkVorlage(db.betrieb.get('betrieb')?.gewerk ?? 'sonstiges').anlagentypen;
  const vorschlag = naechsteWartungBerechnen({ letzteWartung: f.letzteWartung || undefined, eingebautAm: f.eingebautAm || undefined, wartungMonate: Number(f.wartungMonate) || undefined });

  const speichern = () => {
    const e: typeof fehler = {};
    if (!f.typ.trim()) e.typ = 'Was für eine Anlage ist es? z. B. Gasheizung, Wallbox.';
    if (!ort) e.ort = 'Wähle den Ort, an dem die Anlage steht.';
    const jahr = new Date().getFullYear();
    if (f.baujahr && !(/^\d{4}$/.test(f.baujahr) && Number(f.baujahr) > 1900 && Number(f.baujahr) <= jahr)) e.baujahr = `Trage ein Jahr zwischen 1900 und ${jahr} ein.`;
    if (f.wartungMonate && !(/^\d{1,3}$/.test(f.wartungMonate) && Number(f.wartungMonate) > 0)) e.wartungMonate = 'Trage die Monate als Zahl ein, z. B. 12.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const ortObj = db.orte.get(ort)!;
    const daten: Omit<Anlage, keyof import('@core/objects').Basis> = {
      ortId: ortObj.id,
      kundeId: ortObj.kundeId,
      typ: f.typ.trim(),
      hersteller: f.hersteller.trim() || undefined,
      modell: f.modell.trim() || undefined,
      seriennummer: f.seriennummer.trim() || undefined,
      baujahr: f.baujahr ? Number(f.baujahr) : undefined,
      eingebautAm: f.eingebautAm || undefined,
      wartungMonate: f.wartungMonate ? Number(f.wartungMonate) : undefined,
      letzteWartung: f.letzteWartung || undefined,
      naechsteWartung: f.naechsteWartung || vorschlag,
      gewaehrleistungBis: f.gewaehrleistungBis || undefined,
      notiz: f.notiz.trim() || undefined,
    };
    const ergebnis = anlage ? db.anlagen.update(anlage.id, daten, { text: 'Anlagendaten geändert' }) : db.anlagen.create(daten);
    if (ergebnis) onGespeichert?.(ergebnis);
    onSchliessen();
  };

  return (
    <Dialog
      offen
      breit
      titel={anlage ? 'Anlage bearbeiten' : 'Anlage anlegen'}
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Stapel abstand={24}>
        <FormRaster>
          <Eingabe label="Art der Anlage" value={f.typ} onChange={set('typ')} fehler={fehler.typ} list="mm-anlagentypen" />
          <datalist id="mm-anlagentypen">
            {typen.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div>
            <OrtAuswahl kundeId={kunde} wert={ort} onChange={(id) => setOrt(id || undefined)} label="Steht an" />
            {fehler.ort && (
              <p className="mm-fehlertext" role="alert">
                {fehler.ort}
              </p>
            )}
          </div>
          <Eingabe label="Hersteller" value={f.hersteller} onChange={set('hersteller')} optional />
          <Eingabe label="Modell" value={f.modell} onChange={set('modell')} optional />
          <Eingabe label="Seriennummer" value={f.seriennummer} onChange={set('seriennummer')} optional />
          <Eingabe label="Baujahr" value={f.baujahr} onChange={set('baujahr')} fehler={fehler.baujahr} optional inputMode="numeric" />
          <Eingabe label="Eingebaut am" type="date" value={f.eingebautAm} onChange={set('eingebautAm')} optional />
          <Eingabe label="Gewährleistung bis" type="date" value={f.gewaehrleistungBis} onChange={set('gewaehrleistungBis')} optional />
        </FormRaster>
        <FormRaster spalten={3}>
          <Eingabe label="Wartung alle … Monate" value={f.wartungMonate} onChange={set('wartungMonate')} fehler={fehler.wartungMonate} optional inputMode="numeric" />
          <Eingabe label="Letzte Wartung" type="date" value={f.letzteWartung} onChange={set('letzteWartung')} optional />
          <Eingabe label="Nächste Wartung" type="date" value={f.naechsteWartung} onChange={set('naechsteWartung')} optional hilfe={vorschlag && !f.naechsteWartung ? `Leer lassen = automatisch ${datum(vorschlag)}` : 'Leer lassen = aus Intervall berechnen'} />
        </FormRaster>
        <Textfeld label="Notiz" value={f.notiz} onChange={set('notiz')} optional placeholder="z. B. Zugang über Heizungskeller, Ersatzteil-Nr." />
      </Stapel>
    </Dialog>
  );
}

/** Kompakte Anlagenliste für Tabs am Kunden, Ort und Auftrag */
export function AnlagenKompakt({ anlagen, leerText, aktion }: { anlagen: Anlage[]; leerText: string; aktion?: (a: Anlage) => React.ReactNode }) {
  if (!anlagen.length) return <Leer titel="Keine Anlagen" text={leerText} icon="werkzeug" />;
  return (
    <Liste>
      {anlagen.map((a) => (
        <ListenZeile
          key={a.id}
          to={aktion ? undefined : `/auftraege/anlagen/${a.id}`}
          titel={
            <>
              {anlageName(a)} <BeispielMarke zeigen={a.beispiel} />
            </>
          }
          untertitel={[a.seriennummer && `SN ${a.seriennummer}`, a.baujahr && `Baujahr ${a.baujahr}`, db.orte.get(a.ortId)?.bezeichnung].filter(Boolean).join(' · ')}
          rechts={aktion ? aktion(a) : <AnlageStatus a={a} />}
        />
      ))}
    </Liste>
  );
}
