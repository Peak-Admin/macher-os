import { useRef, useState } from 'react';
import type { ID } from '@core/objects';
import { Button, useToast } from '@ui/index';
import { fotoSpeichern } from './foto';

/** Kamera öffnen (mobil) bzw. Bild wählen; speichert das Foto als Dokument am Auftrag */
export function FotoKnopf({ titel, auftragId, tags, onFoto, label = 'Foto', variante = 'sekundaer' }: { titel: string; auftragId?: ID; tags?: string[]; onFoto: (dokumentId: ID) => void; label?: string; variante?: 'sekundaer' | 'tertiaer' }) {
  const ref = useRef<HTMLInputElement>(null);
  const [laedt, setLaedt] = useState(false);
  const toast = useToast();
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const datei = e.target.files?.[0];
          e.target.value = '';
          if (!datei) return;
          setLaedt(true);
          try {
            const d = await fotoSpeichern(datei, { titel, auftragId, tags });
            onFoto(d.id);
            toast('Foto gespeichert.');
          } catch {
            toast('Das Foto konnte nicht gespeichert werden. Versuch es noch einmal.', { ton: 'achtung' });
          } finally {
            setLaedt(false);
          }
        }}
      />
      <Button variante={variante} klein icon="kamera" laedt={laedt} laedtText="Wird gespeichert …" onClick={() => ref.current?.click()}>
        {label}
      </Button>
    </>
  );
}
