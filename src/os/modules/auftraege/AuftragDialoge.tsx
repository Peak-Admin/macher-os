import { useState } from 'react';
import { db } from '@core/db';
import { PHASEN } from '@core/objects';
import type { Auftrag, Auftragsart, Phase } from '@core/objects';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, FormRaster, Meldung, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl, MitarbeiterAuswahl, OrtAuswahl } from '@ui/objekt';
import { ART_LABEL, phaseLabel } from './logik';
import { setzePhase } from './daten';
import { auftragsnummerFehler, nummerBereinigt } from '@core/nummern';
import { MitarbeiterWahl } from './MitarbeiterWahl';

export function BearbeitenDialog({ a, offen, onSchliessen }: { a: Auftrag; offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(() => werte(a));
  const [fehler, setFehler] = useState<string>();
  const set = <K extends keyof ReturnType<typeof werte>>(k: K, v: ReturnType<typeof werte>[K]) => setF((x) => ({ ...x, [k]: v }));

  const speichern = () => {
    if (!f.titel.trim()) return setFehler('Der Auftrag braucht einen Titel.');
    const nummer = nummerBereinigt(f.nummer);
    const nummerFalsch = nummer !== a.nummer ? auftragsnummerFehler(nummer, a.id) : undefined;
    if (nummerFalsch) return setFehler(nummerFalsch);
    if (!f.kundeId) return setFehler('Wähle einen Kunden.');
    const stunden = f.geplanteStunden.trim() ? Number(f.geplanteStunden.replace(',', '.')) : undefined;
    if (stunden != null && !(stunden >= 0)) return setFehler('Gib die Stunden als Zahl ein, z. B. 4,5.');
    db.auftraege.update(
      a.id,
      {
        nummer,
        titel: f.titel.trim(),
        art: f.art,
        kundeId: f.kundeId,
        ortId: f.ortId || undefined,
        verantwortlichId: f.verantwortlichId || undefined,
        mitarbeiterIds: f.mitarbeiterIds.length ? f.mitarbeiterIds : undefined,
        dringend: f.dringend || undefined,
        wunschtermin: f.wunschtermin.trim() || undefined,
        geplanteStunden: stunden,
        beschreibung: f.beschreibung.trim() || undefined,
      },
      { text: 'Auftrag bearbeitet' },
    );
    toast('Änderungen gespeichert.');
    onSchliessen();
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Auftrag bearbeiten"
      breit
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <FormRaster>
        <Eingabe label="Titel" value={f.titel} onChange={(e) => set('titel', e.target.value)} />
        <Eingabe label="Projektnummer" value={f.nummer} onChange={(e) => set('nummer', e.target.value)} autoComplete="off" spellCheck={false} />
        <Auswahl label="Art" value={f.art} onChange={(e) => set('art', e.target.value as Auftragsart)} optionen={(Object.keys(ART_LABEL) as Auftragsart[]).map((x) => ({ wert: x, label: ART_LABEL[x] }))} />
        <KundeAuswahl wert={f.kundeId} onChange={(v) => setF((x) => ({ ...x, kundeId: v, ortId: '' }))} />
        <OrtAuswahl kundeId={f.kundeId} wert={f.ortId} onChange={(v) => set('ortId', v)} optional />
        <MitarbeiterAuswahl label="Verantwortlich" wert={f.verantwortlichId} onChange={(v) => set('verantwortlichId', v)} optional />
        <MitarbeiterWahl label="Team" wert={f.mitarbeiterIds} onChange={(v) => set('mitarbeiterIds', v)} />
        <Eingabe label="Wunschtermin des Kunden" optional value={f.wunschtermin} onChange={(e) => set('wunschtermin', e.target.value)} placeholder="z. B. nächste Woche vormittags" />
        <Eingabe label="Geplante Stunden" optional inputMode="decimal" value={f.geplanteStunden} onChange={(e) => set('geplanteStunden', e.target.value)} />
      </FormRaster>
      <Textfeld label="Beschreibung" optional value={f.beschreibung} onChange={(e) => set('beschreibung', e.target.value)} rows={4} />
      <Checkbox label="Dringend" checked={f.dringend} onChange={(v) => set('dringend', v)} />
    </Dialog>
  );
}

function werte(a: Auftrag) {
  return {
    titel: a.titel,
    nummer: a.nummer,
    mitarbeiterIds: a.mitarbeiterIds ?? [],
    art: a.art,
    kundeId: a.kundeId,
    ortId: a.ortId ?? '',
    verantwortlichId: a.verantwortlichId ?? '',
    dringend: !!a.dringend,
    wunschtermin: a.wunschtermin ?? '',
    geplanteStunden: a.geplanteStunden != null ? String(a.geplanteStunden).replace('.', ',') : '',
    beschreibung: a.beschreibung ?? '',
  };
}

export function PhaseDialog({ a, offen, onSchliessen }: { a: Auftrag; offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>(a.phase === 'verloren' ? 'anfrage' : a.phase);
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Phase ändern"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              setzePhase(a.id, phase);
              toast(`Auftrag steht jetzt auf „${phaseLabel(phase)}“.`);
              onSchliessen();
            }}
            disabled={phase === a.phase}
          >
            Phase setzen
          </Button>
        </>
      }
    >
      <p>Normalerweise schiebt Macher den Auftrag selbst weiter – etwa wenn das Angebot angenommen oder die Rechnung bezahlt ist. Hier kannst du die Phase von Hand setzen.</p>
      <Auswahl label="Neue Phase" value={phase} onChange={(e) => setPhase(e.target.value as Phase)} optionen={PHASEN.filter((p) => p.id !== 'verloren').map((p) => ({ wert: p.id, label: p.label }))} />
    </Dialog>
  );
}

const GRUENDE = ['Zu teuer', 'Kunde hat einen anderen Betrieb beauftragt', 'Kein Bedarf mehr', 'Keine Rückmeldung vom Kunden', 'Wir haben abgesagt (keine Kapazität)', 'Sonstiges'];

export function VerlorenDialog({ a, offen, onSchliessen }: { a: Auftrag; offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [grund, setGrund] = useState('');
  const [notiz, setNotiz] = useState('');
  const [fehler, setFehler] = useState<string>();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Als verloren markieren"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            variante="gefahr"
            onClick={() => {
              if (!grund) return setFehler('Wähle einen Grund. Das hilft dir später bei der Auswertung.');
              const text = grund === 'Sonstiges' && notiz.trim() ? notiz.trim() : [grund, notiz.trim()].filter(Boolean).join(' – ');
              setzePhase(a.id, 'verloren', { grund: text });
              toast('Auftrag als verloren markiert.', { aktion: { label: 'Rückgängig', onClick: () => setzePhase(a.id, a.phase) } });
              onSchliessen();
            }}
          >
            Als verloren markieren
          </Button>
        </>
      }
    >
      <p>Der Auftrag verschwindet aus der Pipeline. Du kannst ihn jederzeit wieder aufnehmen.</p>
      <Auswahl label="Warum ist es nichts geworden?" value={grund} leer="Grund wählen" onChange={(e) => (setGrund(e.target.value), setFehler(undefined))} optionen={GRUENDE.map((g) => ({ wert: g, label: g }))} fehler={fehler} />
      <Eingabe label="Notiz" optional value={notiz} onChange={(e) => setNotiz(e.target.value)} />
    </Dialog>
  );
}
