import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, AuswahlKarten, Button, Dialog, Eingabe, FormRaster, Karte, Stapel, Textfeld, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { MitMacherVorbereiten } from '@modules/macher-fragen/MitMacher';
import { ABSAGE_GRUENDE, SCHRITTE, qualifizieren, rueckrufFaellig, type NaechsterSchritt } from './daten';

const ERFOLG: Record<NaechsterSchritt, string> = {
  rueckruf: 'Rückruf ist als Aufgabe eingetragen.',
  besichtigung: 'Weiter zur Besichtigung.',
  angebot: 'Angebotsentwurf ist angelegt.',
  termin: 'Auftrag ist beauftragt und kann eingeplant werden.',
  absagen: 'Anfrage ist abgelegt.',
};

/** Nächster Schritt für eine Anfrage – eine Entscheidung, ein Klick. */
export function QualiAuswahl({ auftragId, onFertig, abbrechen }: { auftragId: ID; onFertig?: () => void; abbrechen?: React.ReactNode }) {
  const a = db.auftraege.useOne(auftragId);
  const ich = useIch();
  const navigate = useNavigate();
  const toast = useToast();
  const [schritt, setSchritt] = useState<NaechsterSchritt>();
  const [faellig, setFaellig] = useState(rueckrufFaellig(a?.dringend));
  const [zustaendig, setZustaendig] = useState<ID | undefined>(ich?.id);
  const [notiz, setNotiz] = useState('');
  const [grund, setGrund] = useState('');
  const [fehler, setFehler] = useState<string>();

  if (!a) return null;

  const weiter = () => {
    if (!schritt) return setFehler('Wähle den nächsten Schritt.');
    if (schritt === 'absagen' && !grund) return setFehler('Wähle einen Grund – das hilft später bei der Auswertung.');
    const ziel = qualifizieren(a.id, schritt, { faellig, zustaendigId: zustaendig, notiz, grund });
    toast(ERFOLG[schritt]);
    onFertig?.();
    if (ziel) navigate(ziel);
  };

  return (
    <Stapel abstand={16}>
      <AuswahlKarten
        label="Nächster Schritt"
        wert={schritt ?? ('' as NaechsterSchritt)}
        onChange={(v) => {
          setSchritt(v as NaechsterSchritt);
          setFehler(undefined);
        }}
        optionen={SCHRITTE.map((s) => ({ wert: s.wert, label: s.label, text: s.text, icon: s.icon }))}
      />
      {schritt === 'rueckruf' && (
        <FormRaster>
          <Eingabe label="Rückruf bis" type="date" value={faellig} onChange={(e) => setFaellig(e.target.value)} />
          <MitarbeiterAuswahl label="Wer ruft zurück?" wert={zustaendig} onChange={setZustaendig} optional />
          <Textfeld label="Worum geht's beim Rückruf?" value={notiz} onChange={(e) => setNotiz(e.target.value)} optional placeholder="z. B. Termin abstimmen, Fotos anfragen" />
        </FormRaster>
      )}
      {schritt === 'absagen' && (
        <Auswahl label="Grund" value={grund} leer="Grund wählen" onChange={(e) => setGrund(e.target.value)} optionen={ABSAGE_GRUENDE.map((g) => ({ wert: g, label: g }))} fehler={fehler && !grund ? fehler : undefined} />
      )}
      {fehler && schritt !== 'absagen' && <p className="mm-fehlertext" role="alert">{fehler}</p>}
      <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={weiter} variante={schritt === 'absagen' ? 'gefahr' : 'primaer'} icon="pfeilRechts">
          {schritt === 'absagen' ? 'Anfrage absagen' : 'Weiter'}
        </Button>
        <MitMacherVorbereiten bezug={{ typ: 'auftraege', id: a.id }} nachOeffnen={onFertig} />
        {abbrechen}
      </div>
    </Stapel>
  );
}

export function QualiDialog({ auftragId, onSchliessen }: { auftragId?: ID; onSchliessen: () => void }) {
  const a = db.auftraege.useOne(auftragId);
  const k = db.kunden.useOne(a?.kundeId);
  return (
    <Dialog offen={!!auftragId} onSchliessen={onSchliessen} titel={a ? `Wie geht's weiter mit „${a.titel}“?` : 'Nächster Schritt'} icon="pfeil" breit>
      {a && (
        <Stapel abstand={16}>
          <p className="mm-meta">
            {k?.name}
            {a.beschreibung ? ` – ${a.beschreibung}` : ''}
          </p>
          <QualiAuswahl auftragId={a.id} onFertig={onSchliessen} />
        </Stapel>
      )}
    </Dialog>
  );
}

/** Panel in der Auftragsakte, solange der Auftrag eine Anfrage ist */
export function QualiPanel({ id }: { id: ID }) {
  const a = db.auftraege.useOne(id);
  if (!a || a.phase !== 'anfrage') return null;
  return (
    <Karte titel="Anfrage: nächster Schritt" icon="pfeil" kompakt>
      <QualiAuswahl auftragId={a.id} />
    </Karte>
  );
}
