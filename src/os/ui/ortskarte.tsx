/** Karte im „Wo“-Kasten: erst eine ruhige Fläche, die echte Google-Karte lädt nach Klick (Einwilligung). */
import { useState } from 'react';
import { Button, Checkbox } from './index';
import { kartenEinbettung, kartenImmerLaden, setzeKartenImmerLaden, type KartenZiel } from './ortskarte-logik';

const SCHLUESSEL = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function OrtsKarte({ ziel, titel }: { ziel: KartenZiel; titel: string }) {
  const [geladen, setGeladen] = useState(kartenImmerLaden);
  const [immer, setImmer] = useState(kartenImmerLaden);
  const url = kartenEinbettung(ziel, SCHLUESSEL);
  if (!url) return null;

  if (geladen) {
    return (
      <div className="mm-ortskarte">
        <iframe className="mm-ortskarte-rahmen" src={url} title={`Karte: ${titel}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="mm-ortskarte mm-ortskarte--zu">
      <Button variante="sekundaer" icon="ort" onClick={() => setGeladen(true)}>
        Karte anzeigen
      </Button>
      <p className="mm-meta">Dabei werden deine IP-Adresse und der Ort an Google übertragen.</p>
      <Checkbox
        label="Karten immer direkt anzeigen"
        checked={immer}
        onChange={(an) => {
          setImmer(an);
          setzeKartenImmerLaden(an);
          if (an) setGeladen(true);
        }}
      />
    </div>
  );
}
