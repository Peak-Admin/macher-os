import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, Button, Eingabe, FormRaster, Meldung, Segmente, Stapel, Textfeld, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { rueckrufFaellig } from '@modules/anfragen/daten';
import { KundenVorschlaege } from '@modules/anfragen/KundenVorschlaege';
import { DRINGLICHKEIT, SCHRITT_ICON, SCHRITT_TEXT, anrufErfassen, erkenneAnrufer, offeneAuftraegeVon, type AnrufSchritt, type Dringlichkeit } from './daten';

/**
 * Gesprächsnotiz in Sekunden: Nummer → Anrufer erkannt, Anliegen, Dringlichkeit, nächster Schritt.
 * Wird auf der Telefon-Seite und im „Schnell erfassen“-Blatt verwendet.
 */
export function AnrufFormular({ fertig, auftragId: vorAuftrag, kompakt }: { fertig?: () => void; auftragId?: ID; kompakt?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();
  const ich = useIch();
  const kunden = db.kunden.use();
  const vorKunde = db.auftraege.get(vorAuftrag)?.kundeId;
  const [nummer, setNummer] = useState('');
  const [name, setName] = useState('');
  const [gewaehlt, setGewaehlt] = useState<ID | undefined>(vorKunde);
  const [auftragId, setAuftragId] = useState<ID | undefined>(vorAuftrag);
  const [anliegen, setAnliegen] = useState('');
  const [dringlichkeit, setDringlichkeit] = useState<Dringlichkeit>('normal');
  const [schritt, setSchritt] = useState<AnrufSchritt>(vorAuftrag ? 'notiz' : 'anfrage');
  const [zustaendig, setZustaendig] = useState<ID | undefined>(ich?.id);
  const [fehler, setFehler] = useState<string>();

  const erkannt = useMemo(() => (gewaehlt ? undefined : erkenneAnrufer(nummer, kunden)), [nummer, kunden, gewaehlt]);
  const kundeId = gewaehlt ?? erkannt?.id;
  const kunde = db.kunden.get(kundeId);
  const auftraege = offeneAuftraegeVon(kundeId);

  const zuruecksetzen = () => {
    setNummer('');
    setName('');
    setGewaehlt(vorKunde);
    setAuftragId(vorAuftrag);
    setAnliegen('');
    setDringlichkeit('normal');
    setSchritt(vorAuftrag ? 'notiz' : 'anfrage');
    setFehler(undefined);
  };

  const speichern = () => {
    if (!anliegen.trim()) return setFehler('Notiere kurz das Anliegen.');
    if (!kunde && !nummer.trim() && !name.trim()) return setFehler('Notiere Nummer oder Namen, damit du zurückrufen kannst.');
    const r = anrufErfassen({
      nummer,
      name,
      kundeId,
      auftragId: schritt === 'anfrage' ? undefined : auftragId,
      anliegen,
      dringlichkeit,
      schritt,
      zustaendigId: zustaendig,
      faellig: rueckrufFaellig(dringlichkeit !== 'normal'),
    });
    const ziel = r.auftrag && schritt === 'anfrage' ? `/auftraege/anfragen?anfrage=${r.auftrag.id}` : undefined;
    toast(
      schritt === 'anfrage' ? (r.kundeNeu ? 'Anruf notiert, Anfrage und Kunde angelegt.' : 'Anruf notiert, Anfrage angelegt.') : schritt === 'rueckruf' ? 'Anruf notiert, Rückruf eingetragen.' : 'Anruf notiert.',
      ziel ? { aktion: { label: 'Anfrage öffnen', onClick: () => navigate(ziel) } } : undefined,
    );
    zuruecksetzen();
    fertig?.();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel abstand={16}>
        {!gewaehlt && (
          <FormRaster spalten={kompakt ? 1 : 2}>
            <Eingabe label="Nummer des Anrufers" type="tel" inputMode="tel" value={nummer} onChange={(e) => setNummer(e.target.value)} autoFocus autoComplete="off" placeholder="z. B. 0171 2345678" />
            {!erkannt && <Eingabe label="Name" value={name} onChange={(e) => setName(e.target.value)} optional autoComplete="off" />}
          </FormRaster>
        )}
        {erkannt && !gewaehlt ? (
          <Meldung
            ton="erfolg"
            titel={`Erkannt: ${erkannt.name}`}
            aktion={
              pfadZu({ typ: 'kunden', id: erkannt.id }) ? (
                <Button klein variante="tertiaer" to={pfadZu({ typ: 'kunden', id: erkannt.id })}>
                  Kunde öffnen
                </Button>
              ) : undefined
            }
          >
            {auftraege.length ? `${auftraege.length === 1 ? '1 offener Auftrag' : `${auftraege.length} offene Aufträge`}: ${auftraege.map((a) => a.titel).join(', ')}` : 'Keine offenen Aufträge.'}
          </Meldung>
        ) : (
          <KundenVorschlaege e={{ name, telefon: nummer }} gewaehlt={gewaehlt} onWahl={setGewaehlt} />
        )}
        <Textfeld label="Anliegen" value={anliegen} onChange={(e) => setAnliegen(e.target.value)} fehler={fehler} placeholder="Was ist los? Was braucht der Anrufer?" rows={kompakt ? 3 : 4} />
        <Segmente label="Dringlichkeit" wert={dringlichkeit} onChange={setDringlichkeit} optionen={DRINGLICHKEIT} />
        <Segmente
          label="Nächster Schritt"
          wert={schritt}
          onChange={setSchritt}
          optionen={(['anfrage', 'rueckruf', 'notiz'] as AnrufSchritt[]).map((s) => ({ wert: s, label: SCHRITT_TEXT[s], icon: SCHRITT_ICON[s] }))}
        />
        {schritt !== 'anfrage' && auftraege.length > 0 && (
          <Auswahl
            label="Zu Auftrag"
            optional
            value={auftragId ?? ''}
            leer="Keinem Auftrag zuordnen"
            onChange={(e) => setAuftragId(e.target.value || undefined)}
            optionen={auftraege.map((a) => ({ wert: a.id, label: `${a.nummer} · ${a.titel}` }))}
          />
        )}
        {schritt === 'rueckruf' && <MitarbeiterAuswahl label="Wer ruft zurück?" wert={zustaendig} onChange={setZustaendig} optional />}
        <div>
          <Button type="submit" icon="check" breit={kompakt}>
            Anruf speichern
          </Button>
        </div>
      </Stapel>
    </form>
  );
}
