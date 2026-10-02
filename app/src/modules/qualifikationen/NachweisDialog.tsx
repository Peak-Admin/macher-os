import { useEffect, useState } from 'react';
import { db } from '@core/db';
import { heute, personName } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Button, Dialog, Eingabe, FormRaster, Meldung, Stapel, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { dateiLesen } from '@modules/abwesenheiten/AbwesenheitForm';
import { gueltigBisAus } from './daten';

/** Nachweis eintragen: wer, was, wann erworben, gültig bis (automatisch), Dokument optional */
export function NachweisDialog({ offen, onSchliessen, mitarbeiterId, qualifikationId }: { offen: boolean; onSchliessen: () => void; mitarbeiterId?: ID; qualifikationId?: ID }) {
  const toast = useToast();
  const qualis = db.qualifikationen.use();
  const [maId, setMaId] = useState<ID>(mitarbeiterId ?? '');
  const [qId, setQId] = useState<ID>(qualifikationId ?? '');
  const [erworben, setErworben] = useState(heute());
  const [bis, setBis] = useState('');
  const [bisGeaendert, setBisGeaendert] = useState(false);
  const [datei, setDatei] = useState<File>();
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const q = db.qualifikationen.get(qId);

  useEffect(() => {
    if (!offen) return;
    setMaId(mitarbeiterId ?? '');
    setQId(qualifikationId ?? '');
    setErworben(heute());
    setBisGeaendert(false);
    setDatei(undefined);
    setFehler(undefined);
  }, [offen, mitarbeiterId, qualifikationId]);
  useEffect(() => {
    if (!bisGeaendert) setBis(gueltigBisAus(erworben, q?.gueltigMonate) ?? '');
  }, [erworben, q?.gueltigMonate, bisGeaendert]);

  const speichern = async () => {
    if (!maId) return setFehler('Wähle den Mitarbeiter.');
    if (!qId) return setFehler('Wähle die Qualifikation.');
    if (bis && erworben && bis < erworben) return setFehler('„Gültig bis“ liegt vor dem Erwerb.');
    setLaedt(true);
    try {
      let dokumentId: ID | undefined;
      const m = db.mitarbeiter.get(maId);
      if (datei) {
        const d = db.dokumente.create({
          art: datei.type === 'application/pdf' ? 'pdf' : 'foto',
          titel: `${q?.name ?? 'Nachweis'} – ${personName(m)}`,
          url: await dateiLesen(datei),
          mime: datei.type,
          groesse: datei.size,
          bezug: { typ: 'mitarbeiter', id: maId },
          tags: ['nachweis'],
        });
        dokumentId = d.id;
      }
      db.nachweise.create({ mitarbeiterId: maId, qualifikationId: qId, erworbenAm: erworben || undefined, gueltigBis: bis || undefined, dokumentId });
      toast(`Nachweis für ${m?.vorname ?? 'Mitarbeiter'} gespeichert.`);
      onSchliessen();
    } catch {
      setFehler('Die Datei konnte nicht gelesen werden. Versuch es mit einer kleineren Datei.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Nachweis eintragen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button laedt={laedt} onClick={() => void speichern()}>
            Nachweis speichern
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        {!mitarbeiterId && <MitarbeiterAuswahl wert={maId} onChange={setMaId} />}
        {!qualifikationId && (
          <Auswahl label="Qualifikation" value={qId} leer="Qualifikation wählen" onChange={(e) => setQId(e.target.value)} optionen={qualis.map((x) => ({ wert: x.id, label: x.name }))} />
        )}
        <FormRaster spalten={2}>
          <Eingabe label="Erworben am" type="date" value={erworben} onChange={(e) => setErworben(e.target.value)} optional />
          <Eingabe
            label="Gültig bis"
            type="date"
            value={bis}
            onChange={(e) => (setBis(e.target.value), setBisGeaendert(true))}
            optional
            hilfe={q?.gueltigMonate ? `Automatisch: ${q.gueltigMonate} Monate ab Erwerb` : 'Leer lassen, wenn unbefristet'}
          />
        </FormRaster>
        <label className="mm-feld">
          <span className="mm-label">
            Nachweis-Dokument <span className="mm-label-optional">(optional)</span>
          </span>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setDatei(e.target.files?.[0])} />
          <span className="mm-hilfe">Foto oder PDF vom Zertifikat, Ausweis oder Teilnahmebescheinigung.</span>
        </label>
        {fehler && (
          <Meldung ton="achtung" titel="Bitte prüfen">
            {fehler}
          </Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}
