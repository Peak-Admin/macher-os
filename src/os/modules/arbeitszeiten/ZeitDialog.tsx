import { useEffect, useState } from 'react';
import { db, vermerken, zeitstrahl } from '@core/db';
import { datum as datumFmt, heute, minutenAus, personName, uhrzeit } from '@core/format';
import type { Datum, ID, Zeiteintrag } from '@core/objects';
import { istBuero, useIch } from '@core/session';
import { ZEITART_EMOJI } from '@core/zeichen';
import { Button, Eingabe, FormRaster, Meldung, Meta, Segmente, Stapel, Textfeld, Dialog, useBestaetigen, useToast } from '@ui/index';
import { AuftragAuswahl, MitarbeiterAuswahl } from '@ui/objekt';
import { ART_LABEL, pruefeTag, spanne } from './daten';

/** Zeit nachtragen oder korrigieren */
export function ZeitDialog({
  offen,
  onSchliessen,
  eintrag,
  vorgabe,
}: {
  offen: boolean;
  onSchliessen: () => void;
  eintrag?: Zeiteintrag;
  vorgabe?: { datum?: Datum; mitarbeiterId?: ID; auftragId?: ID };
}) {
  const ich = useIch();
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const buero = istBuero(ich);
  const leer = () => ({
    mitarbeiterId: eintrag?.mitarbeiterId ?? vorgabe?.mitarbeiterId ?? ich?.id ?? '',
    datum: eintrag?.datum ?? vorgabe?.datum ?? heute(),
    start: eintrag?.start ?? '',
    ende: eintrag?.ende ?? '',
    pause: String(eintrag?.pauseMinuten ?? 0),
    art: eintrag?.art ?? ('arbeit' as Zeiteintrag['art']),
    auftragId: eintrag?.auftragId ?? vorgabe?.auftragId ?? '',
    notiz: eintrag?.notiz ?? '',
    grund: '',
  });
  const [f, setF] = useState(leer);
  const [fehler, setFehler] = useState<string>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => (offen ? (setF(leer()), setFehler(undefined)) : undefined), [offen, eintrag?.id, vorgabe?.datum, vorgabe?.mitarbeiterId, vorgabe?.auftragId]);

  const gesperrt = !!eintrag?.freigegeben && !buero;
  /** Abgeschlossene Zeit ändern = Korrektur → Grund ist Pflicht, Verlauf bleibt am Eintrag */
  const korrektur = !!eintrag?.ende;
  const verlauf = eintrag ? zeitstrahl({ typ: 'zeiten', id: eintrag.id }).slice(0, 4) : [];
  const pauseMin = Math.max(0, Number(f.pause) || 0);
  const andere = db.zeiten.where((z) => z.mitarbeiterId === f.mitarbeiterId && z.datum === f.datum && z.id !== eintrag?.id);
  const vorschau = f.start && f.ende ? pruefeTag([...andere, { datum: f.datum, start: f.start, ende: f.ende, pauseMinuten: pauseMin }]) : undefined;

  const speichern = () => {
    if (!f.mitarbeiterId) return setFehler('Wähle aus, für wen die Zeit ist.');
    if (!f.start || !f.ende) return setFehler('Trag Beginn und Ende ein.');
    if (f.datum > heute()) return setFehler('Zeiten in der Zukunft kannst du nicht eintragen.');
    if (pauseMin >= spanne(f.start, f.ende)) return setFehler('Die Pause ist länger als die Arbeitszeit.');
    const s = minutenAus(f.start);
    const e = s + spanne(f.start, f.ende);
    const ueber = andere.find((z) => {
      const zs = minutenAus(z.start);
      const ze = z.ende ? zs + spanne(z.start, z.ende) : 24 * 60;
      return s < ze && zs < e;
    });
    if (ueber) return setFehler(`Überschneidet sich mit ${ueber.start}–${ueber.ende ?? 'läuft'} (${ART_LABEL[ueber.art]}).`);
    if (korrektur && !f.grund.trim()) return setFehler('Schreib kurz dazu, warum du die Zeit korrigierst. So bleibt es nachvollziehbar.');
    const daten = {
      mitarbeiterId: f.mitarbeiterId,
      datum: f.datum,
      start: f.start,
      ende: f.ende,
      pauseMinuten: pauseMin,
      art: f.art,
      auftragId: f.auftragId || undefined,
      notiz: f.notiz.trim() || undefined,
      // Änderungen durch den Mitarbeiter selbst brauchen eine neue Freigabe
      freigegeben: buero ? eintrag?.freigegeben ?? false : false,
    };
    if (eintrag) {
      const vorher = `${eintrag.start}–${eintrag.ende ?? 'läuft'}${eintrag.pauseMinuten ? `, ${eintrag.pauseMinuten} min Pause` : ''}`;
      db.zeiten.update(eintrag.id, daten, { text: `Korrigiert von ${personName(ich)}: ${vorher} → ${f.start}–${f.ende}${pauseMin ? `, ${pauseMin} min Pause` : ''}${f.grund.trim() ? ` · Grund: ${f.grund.trim()}` : ''}` });
      toast('Zeit korrigiert.');
    } else {
      const z = db.zeiten.create(daten);
      vermerken({ typ: 'zeiten', id: z.id }, 'zeiten.nachtrag', `Nachgetragen von ${personName(ich)}`);
      toast(`Zeit für ${datumFmt(f.datum)} nachgetragen.`);
    }
    onSchliessen();
  };

  const loeschen = async () => {
    if (!eintrag) return;
    if (!(await fragen('Zeit löschen?', `${eintrag.start}–${eintrag.ende ?? 'läuft'} am ${datumFmt(eintrag.datum)} wird in den Papierkorb gelegt.`, 'Löschen'))) return;
    db.zeiten.remove(eintrag.id);
    onSchliessen();
    toast('Zeit gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.zeiten.restore(eintrag.id) } });
  };

  return (
    <>
      <Dialog
        offen={offen}
        onSchliessen={onSchliessen}
        titel={eintrag ? 'Zeit korrigieren' : 'Zeit nachtragen'}
        icon="uhr"
        aktionen={
          <>
            {eintrag && !gesperrt && (
              <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                Löschen
              </Button>
            )}
            <Button variante="tertiaer" onClick={onSchliessen}>
              Abbrechen
            </Button>
            {!gesperrt && <Button onClick={speichern}>{eintrag ? 'Speichern' : 'Nachtragen'}</Button>}
          </>
        }
      >
        <Stapel abstand={16}>
          {gesperrt && <Meldung>Diese Zeit ist schon freigegeben. Änderungen macht das Büro.</Meldung>}
          {buero && !eintrag && <MitarbeiterAuswahl label="Für" wert={f.mitarbeiterId} onChange={(v) => setF({ ...f, mitarbeiterId: v })} />}
          <Segmente label="Art" wert={f.art} onChange={(v) => setF({ ...f, art: v })} optionen={(Object.keys(ART_LABEL) as Zeiteintrag['art'][]).map((a) => ({ wert: a, label: ART_LABEL[a], emoji: ZEITART_EMOJI[a] }))} />
          <FormRaster spalten={2}>
            <Eingabe label="Datum" type="date" max={heute()} value={f.datum} onChange={(e) => setF({ ...f, datum: e.target.value })} />
            <Eingabe label="Pause (Minuten)" inputMode="numeric" value={f.pause} onChange={(e) => setF({ ...f, pause: e.target.value.replace(/\D/g, '') })} />
            <Eingabe label="Beginn" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
            <Eingabe label="Ende" type="time" value={f.ende} onChange={(e) => setF({ ...f, ende: e.target.value })} />
          </FormRaster>
          <AuftragAuswahl optional nurOffene={false} wert={f.auftragId} onChange={(v) => setF({ ...f, auftragId: v })} />
          <Textfeld label="Notiz" optional value={f.notiz} onChange={(e) => setF({ ...f, notiz: e.target.value })} placeholder="Zum Beispiel: Stempeln vergessen" />
          {korrektur && !gesperrt && (
            <Eingabe label="Grund der Korrektur" value={f.grund} onChange={(e) => setF({ ...f, grund: e.target.value })} placeholder="Zum Beispiel: Pause vergessen einzutragen" />
          )}
          {verlauf.length > 0 && (
            <Stapel abstand={4}>
              <Meta>Verlauf</Meta>
              {verlauf.map((v) => (
                <Meta key={v.id}>{`${datumFmt(v.erstelltAm)} ${uhrzeit(v.erstelltAm)} · ${v.text}`}</Meta>
              ))}
            </Stapel>
          )}
          {fehler && (
            <Meldung ton="achtung" titel="Bitte prüfen">
              {fehler}
            </Meldung>
          )}
          {vorschau && vorschau.probleme.length > 0 && (
            <Meldung ton="achtung" titel="Arbeitszeitgesetz">
              {vorschau.probleme.join(' · ')}
            </Meldung>
          )}
        </Stapel>
      </Dialog>
      {bestaetigenElement}
    </>
  );
}
