/** Ein Knopf, der direkt die Kamera öffnet und das Foto am Auftrag speichert (Mängel, Nachträge, Checklisten …). */
import { useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { DateiKnopf, bildVerkleinern, useToast } from '@ui/index';
import { SPEICHER_VOLL_TEXT, platzFrei } from './speicher';
import { standardTitel } from './daten';

export function FotoKnopf({
  auftragId,
  tags = [],
  titel,
  label = 'Foto',
  onGespeichert,
  klein = true,
  variante = 'sekundaer',
}: {
  auftragId?: ID;
  tags?: string[];
  titel?: string;
  label?: string;
  onGespeichert: (dokumentId: ID) => void;
  klein?: boolean;
  variante?: 'sekundaer' | 'tertiaer';
}) {
  const toast = useToast();
  const [laedt, setLaedt] = useState(false);
  const gewaehlt = async ([f]: File[]) => {
    setLaedt(true);
    try {
      const b = await bildVerkleinern(f);
      if (!platzFrei(b.url.length)) {
        toast(SPEICHER_VOLL_TEXT, { ton: 'achtung' });
        return;
      }
      const d = db.dokumente.create({
        art: 'foto',
        titel: titel ?? standardTitel('foto'),
        url: b.url,
        mime: b.mime,
        groesse: b.bytes,
        auftragId,
        tags,
      });
      onGespeichert(d.id);
      toast('Foto gespeichert.');
    } catch {
      toast('Das Foto konnte nicht gespeichert werden. Versuch es noch einmal.', { ton: 'achtung' });
    } finally {
      setLaedt(false);
    }
  };
  return (
    <DateiKnopf accept="image/*" kamera onDateien={gewaehlt} variante={variante} klein={klein} laedt={laedt} laedtText="Wird gespeichert …">
      {label}
    </DateiKnopf>
  );
}
