/** Ein Knopf, der direkt die Kamera öffnet und das Foto am Auftrag speichert (für Mängel, Nachträge …). */
import { useRef, useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, useToast } from '@ui/index';
import { verkleinern } from './bild';
import { SPEICHER_VOLL_TEXT, platzFrei } from './speicher';
import { standardTitel } from './daten';

export function FotoKnopf({ auftragId, tags = [], titel, label = 'Foto', onGespeichert, klein = true }: { auftragId?: ID; tags?: string[]; titel?: string; label?: string; onGespeichert: (dokumentId: ID) => void; klein?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [laedt, setLaedt] = useState(false);
  const gewaehlt = async (f: File | undefined) => {
    if (!f) return;
    setLaedt(true);
    try {
      const b = await verkleinern(f);
      if (!platzFrei(b.url.length)) {
        toast(SPEICHER_VOLL_TEXT, { ton: 'achtung' });
        return;
      }
      const d = db.dokumente.create({ art: 'foto', titel: titel ?? standardTitel('foto'), url: b.url, mime: 'image/jpeg', groesse: b.bytes, auftragId, tags });
      onGespeichert(d.id);
    } catch {
      toast('Das Foto konnte nicht gelesen werden.', { ton: 'achtung' });
    } finally {
      setLaedt(false);
    }
  };
  return (
    <>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (gewaehlt(e.target.files?.[0]), (e.target.value = ''))} />
      <Button variante="sekundaer" icon="kamera" klein={klein} laedt={laedt} onClick={() => input.current?.click()}>
        {label}
      </Button>
    </>
  );
}
