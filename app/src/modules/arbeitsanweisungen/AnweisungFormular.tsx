import { useState } from 'react';
import { neueId } from '@core/db';
import { Button, Eingabe, IconButton, Karte, Meldung, Stapel, Textfeld, Zeile, useToast } from '@ui/index';
import { FotoKnopf } from '../checklisten/FotoKnopf';
import { arbeitsanweisungen, zeilen, type AnweisungsSchritt, type Arbeitsanweisung } from './daten';

export function AnweisungFormular({ x, onFertig }: { x: Arbeitsanweisung; onFertig: () => void }) {
  const toast = useToast();
  const [titel, setTitel] = useState(x.titel);
  const [ziel, setZiel] = useState(x.ziel ?? '');
  const [sicherheit, setSicherheit] = useState(x.sicherheit.join('\n'));
  const [schritte, setSchritte] = useState<AnweisungsSchritt[]>(x.schritte.length ? x.schritte : [{ id: neueId('s'), text: '' }]);
  const [fehler, setFehler] = useState<string>();
  const setSchritt = (i: number, patch: Partial<AnweisungsSchritt>) => setSchritte((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const verschieben = (i: number, um: number) =>
    setSchritte((l) => {
      const n = [...l];
      const [s] = n.splice(i, 1);
      n.splice(Math.max(0, Math.min(n.length, i + um)), 0, s);
      return n;
    });

  const speichern = () => {
    if (!titel.trim()) return setFehler('Gib der Anweisung einen Titel.');
    const sauber = schritte.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text || s.fotoId);
    if (!sauber.length && !ziel.trim()) return setFehler('Beschreib das Ziel oder mindestens einen Schritt.');
    arbeitsanweisungen.update(x.id, { titel: titel.trim(), ziel: ziel.trim() || undefined, sicherheit: zeilen(sicherheit), schritte: sauber });
    toast('Arbeitsanweisung gespeichert.');
    onFertig();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel abstand={24}>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <Eingabe label="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
        <Textfeld label="Ziel – was soll am Ende fertig sein?" optional value={ziel} onChange={(e) => setZiel(e.target.value)} />
        <Textfeld label="Sicherheit" optional hilfe="Ein Hinweis pro Zeile, z. B. „Spannungsfrei schalten und sichern“." value={sicherheit} onChange={(e) => setSicherheit(e.target.value)} />
        <Stapel abstand={12}>
          <h3>Schritte</h3>
          {schritte.map((s, i) => (
            <Karte key={s.id} kompakt>
              <Stapel abstand={8}>
                <Textfeld label={`Schritt ${i + 1}`} value={s.text} rows={2} onChange={(e) => setSchritt(i, { text: e.target.value })} />
                <Zeile abstand={8}>
                  <FotoKnopf titel={s.text || `Schritt ${i + 1}`} auftragId={x.auftragId} tags={['arbeitsanweisung']} label={s.fotoId ? 'Foto ersetzen' : 'Foto'} variante="tertiaer" onFoto={(fotoId) => setSchritt(i, { fotoId })} />
                  {s.fotoId && (
                    <Button variante="tertiaer" klein onClick={() => setSchritt(i, { fotoId: undefined })}>
                      Foto entfernen
                    </Button>
                  )}
                  <IconButton icon="zurueck" label="Nach oben" style={{ transform: 'rotate(90deg)' }} disabled={i === 0} onClick={() => verschieben(i, -1)} />
                  <IconButton icon="weiter" label="Nach unten" style={{ transform: 'rotate(90deg)' }} disabled={i === schritte.length - 1} onClick={() => verschieben(i, 1)} />
                  <IconButton icon="muell" label={`Schritt ${i + 1} entfernen`} onClick={() => setSchritte((l) => l.filter((_, j) => j !== i))} />
                </Zeile>
              </Stapel>
            </Karte>
          ))}
          <div>
            <Button variante="sekundaer" icon="plus" onClick={() => setSchritte((l) => [...l, { id: neueId('s'), text: '' }])}>
              Schritt hinzufügen
            </Button>
          </div>
        </Stapel>
        <Zeile abstand={8}>
          <Button type="submit">Speichern</Button>
          <Button variante="tertiaer" onClick={onFertig}>
            Abbrechen
          </Button>
        </Zeile>
      </Stapel>
    </form>
  );
}
