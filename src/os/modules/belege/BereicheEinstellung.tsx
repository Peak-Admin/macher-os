/** Einstellungen › Betriebsdaten: Liste der Betriebsbereiche für Belege anpassen */
import { useState } from 'react';
import { useEinstellung } from '@core/einstellungen';
import { Button, Karte, Stapel, Textfeld, Zeile, useToast } from '@ui/index';
import { BEREICHE_KEY, STANDARD_BEREICHE, bereicheBereinigen } from './bereiche';

export function BereicheEinstellung() {
  const toast = useToast();
  const [gespeichert, speichern] = useEinstellung<string[]>(BEREICHE_KEY, STANDARD_BEREICHE);
  const [text, setText] = useState(gespeichert.join('\n'));
  const [fehler, setFehler] = useState<string>();
  const sichern = () => {
    const liste = bereicheBereinigen(text.split('\n'));
    if (!liste.length) return setFehler('Trag mindestens einen Bereich ein, z. B. „Sonstiges“.');
    speichern(liste);
    setText(liste.join('\n'));
    toast('Betriebsbereiche gespeichert.');
  };
  return (
    <Karte titel="Betriebsbereiche für Belege">
      <Stapel abstand={12}>
        <Textfeld
          label="Ein Bereich pro Zeile"
          hilfe="Belege, die zu keinem Auftrag gehören, ordnest du einem Bereich zu. Macher schlägt ihn vor, z. B. Tankbeleg → Fahrzeuge."
          rows={6}
          value={text}
          fehler={fehler}
          onChange={(e) => (setText(e.target.value), setFehler(undefined))}
        />
        <Zeile>
          <Button variante="sekundaer" icon="check" onClick={sichern}>
            Bereiche speichern
          </Button>
          <Button variante="tertiaer" onClick={() => (setText(STANDARD_BEREICHE.join('\n')), setFehler(undefined))}>
            Standard einsetzen
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}
