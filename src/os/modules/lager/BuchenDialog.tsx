import { useState } from 'react';
import { db } from '@core/db';
import { zahl } from '@core/format';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, Button, Dialog, Eingabe, FormRaster, Meta, Segmente, Stapel, Textfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { ART_ICON, ART_LABEL, bestandAm, buchen, HAUPTLAGER, lagerorte, lagerortName, pruefeBuchung, type Lagerbewegung, type LagerortId } from './daten';

type Art = Exclude<Lagerbewegung['art'], 'inventur'>;

/** Zugang, Entnahme oder Umbuchung buchen */
export function BuchenDialog({ offen, onSchliessen, artikelId, ort }: { offen: boolean; onSchliessen: () => void; artikelId?: ID; ort?: LagerortId }) {
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Material buchen" icon="lager">
      {offen && <BuchenFormular artikelId={artikelId} ort={ort} fertig={onSchliessen} />}
    </Dialog>
  );
}

function BuchenFormular({ artikelId, ort, fertig }: { artikelId?: ID; ort?: LagerortId; fertig: () => void }) {
  const ich = useIch();
  const toast = useToast();
  const artikel = db.artikel.use((a) => a.aktiv);
  const orte = lagerorte();
  const [art, setArt] = useState<Art>('entnahme');
  const [aid, setAid] = useState(artikelId ?? '');
  const [menge, setMenge] = useState('');
  const [von, setVon] = useState<LagerortId>(ort ?? HAUPTLAGER);
  const [nach, setNach] = useState<LagerortId>(ort && ort !== HAUPTLAGER ? HAUPTLAGER : (orte[1]?.id ?? HAUPTLAGER));
  const [zugangNach, setZugangNach] = useState<LagerortId>(ort ?? HAUPTLAGER);
  const [auftragId, setAuftragId] = useState('');
  const [notiz, setNotiz] = useState('');
  const [fehler, setFehler] = useState<string>();

  const a = db.artikel.get(aid);
  const n = Number(menge.replace(',', '.'));
  const eingabe = {
    art,
    artikelId: aid,
    menge: n,
    von: art === 'zugang' ? undefined : von,
    nach: art === 'zugang' ? zugangNach : art === 'umbuchung' ? nach : undefined,
    mitarbeiterId: ich?.id,
    auftragId: art === 'entnahme' && auftragId ? auftragId : undefined,
    notiz: notiz.trim() || undefined,
  };
  const vorhanden = a && eingabe.von ? bestandAm(a, eingabe.von) : undefined;

  const speichern = () => {
    const f = pruefeBuchung(eingabe);
    if (f) return setFehler(f);
    buchen(eingabe);
    const text =
      art === 'zugang'
        ? `+${zahl(n)} ${a!.einheit} ${a!.name} ins ${lagerortName(eingabe.nach)}`
        : art === 'entnahme'
          ? `−${zahl(n)} ${a!.einheit} ${a!.name} aus ${lagerortName(eingabe.von)}`
          : `${zahl(n)} ${a!.einheit} ${a!.name}: ${lagerortName(eingabe.von)} → ${lagerortName(eingabe.nach)}`;
    toast(`Gebucht: ${text}`);
    fertig();
  };

  const ortOptionen = orte.map((o) => ({ wert: o.id, label: o.name }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel>
        <Segmente label="Was passiert?" wert={art} onChange={setArt} optionen={(['entnahme', 'zugang', 'umbuchung'] as Art[]).map((x) => ({ wert: x, label: ART_LABEL[x], icon: ART_ICON[x] }))} />
        {!artikelId ? (
          <Auswahl label="Artikel" value={aid} leer="Artikel wählen" onChange={(e) => setAid(e.target.value)} optionen={[...artikel].sort((x, y) => x.name.localeCompare(y.name, 'de')).map((x) => ({ wert: x.id, label: `${x.name}${x.nummer ? ` (${x.nummer})` : ''}` }))} />
        ) : (
          <Meta>
            Artikel: <strong>{a?.name}</strong>
          </Meta>
        )}
        <FormRaster>
          <Eingabe label={`Menge${a ? ` in ${a.einheit}` : ''}`} inputMode="decimal" value={menge} onChange={(e) => setMenge(e.target.value)} autoFocus={!!artikelId} fehler={fehler} />
          {art === 'zugang' ? (
            <Auswahl label="Nach" value={zugangNach} onChange={(e) => setZugangNach(e.target.value)} optionen={ortOptionen} />
          ) : (
            <Auswahl label="Von" value={von} onChange={(e) => setVon(e.target.value)} optionen={ortOptionen} hilfe={vorhanden != null && a ? `Dort laut Bestand: ${zahl(vorhanden)} ${a.einheit}` : undefined} />
          )}
          {art === 'umbuchung' && <Auswahl label="Nach" value={nach} onChange={(e) => setNach(e.target.value)} optionen={ortOptionen} />}
          {art === 'entnahme' && <AuftragAuswahl wert={auftragId} onChange={setAuftragId} label="Für Auftrag" optional />}
        </FormRaster>
        {art !== 'zugang' && a && vorhanden != null && n > vorhanden && <Meta>Achtung: Laut Bestand sind dort nur {zahl(vorhanden)} {a.einheit}. Die Buchung geht trotzdem – prüfe den Bestand bei der nächsten Inventur.</Meta>}
        <Textfeld label="Notiz" optional rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        <div className="mm-zeile" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variante="tertiaer" onClick={fertig}>
            Abbrechen
          </Button>
          <Button type="submit">{ART_LABEL[art]} buchen</Button>
        </div>
      </Stapel>
    </form>
  );
}
