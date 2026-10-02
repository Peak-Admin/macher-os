import { useState } from 'react';
import { db } from '@core/db';
import { heute, plusTage } from '@core/format';
import { useIch } from '@core/session';
import type { Aufgabe, ID } from '@core/objects';
import { Button, Checkbox, Eingabe, FormRaster, Stapel, Textfeld, useToast } from '@ui/index';
import { AuftragAuswahl, MitarbeiterAuswahl } from '@ui/objekt';

/** Aufgabe anlegen – überall dasselbe Formular (Liste, Auftrag, Schnell erfassen) */
export function AufgabeFormular({
  auftragId,
  onFertig,
  kompakt,
  autoFocus = true,
}: {
  auftragId?: ID;
  onFertig?: (a: Aufgabe) => void;
  /** nur Titel, Fälligkeit, Zuständig – für die Liste am Auftrag */
  kompakt?: boolean;
  autoFocus?: boolean;
}) {
  const toast = useToast();
  const ich = useIch();
  const [titel, setTitel] = useState('');
  const [faellig, setFaellig] = useState('');
  const [zustaendigId, setZustaendig] = useState<ID>(ich?.id ?? '');
  const [auftrag, setAuftrag] = useState<ID>(auftragId ?? '');
  const [notiz, setNotiz] = useState('');
  const [wichtig, setWichtig] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const speichern = () => {
    if (!titel.trim()) return setFehler('Was ist zu tun? Ein paar Worte reichen.');
    const a = db.aufgaben.create({
      titel: titel.trim(),
      auftragId: auftrag || undefined,
      zustaendigId: zustaendigId || undefined,
      faellig: faellig || undefined,
      notiz: notiz.trim() || undefined,
      erledigt: false,
      prioritaet: wichtig ? 'hoch' : 'normal',
      quelle: 'manuell',
    });
    toast('Aufgabe angelegt.');
    setTitel('');
    setNotiz('');
    setFehler(undefined);
    onFertig?.(a);
  };

  const schnellDatum = (
    <div className="mm-filter" aria-label="Schnell wählen">
      {[
        { label: 'Heute', wert: heute() },
        { label: 'Morgen', wert: plusTage(heute(), 1) },
        { label: 'In einer Woche', wert: plusTage(heute(), 7) },
      ].map((x) => (
        <button key={x.label} type="button" className={`mm-chip ${faellig === x.wert ? 'mm-chip--an' : ''}`} aria-pressed={faellig === x.wert} onClick={() => setFaellig(faellig === x.wert ? '' : x.wert)}>
          {x.label}
        </button>
      ))}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel abstand={16}>
        <Eingabe label="Was ist zu tun?" value={titel} onChange={(e) => (setTitel(e.target.value), setFehler(undefined))} fehler={fehler} autoFocus={autoFocus} placeholder="z. B. Ersatzteil beim Großhandel bestellen" />
        <FormRaster>
          <Stapel abstand={8}>
            <Eingabe label="Fällig am" type="date" optional value={faellig} onChange={(e) => setFaellig(e.target.value)} />
            {schnellDatum}
          </Stapel>
          <MitarbeiterAuswahl label="Wer kümmert sich?" wert={zustaendigId} onChange={setZustaendig} optional />
          {!auftragId && <AuftragAuswahl wert={auftrag} onChange={setAuftrag} optional />}
        </FormRaster>
        {!kompakt && <Textfeld label="Notiz" optional value={notiz} onChange={(e) => setNotiz(e.target.value)} />}
        <Checkbox label="Wichtig" checked={wichtig} onChange={setWichtig} />
        <div>
          <Button type="submit" icon="plus">
            Aufgabe anlegen
          </Button>
        </div>
      </Stapel>
    </form>
  );
}
