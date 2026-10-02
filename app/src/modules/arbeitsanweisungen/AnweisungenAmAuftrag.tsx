import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarf } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, Button, Karte, Leer, Stapel, Zeile, useToast } from '@ui/index';
import { anweisungAnlegen, anweisungPfad, arbeitsanweisungen } from './daten';
import { AnweisungAnsicht } from './AnweisungAnsicht';

/** Tab „Arbeitsanweisung“ in der Auftragsakte */
export function AnweisungenAmAuftrag({ id }: { id: ID }) {
  const navigate = useNavigate();
  const toast = useToast();
  const darfSchreiben = useDarf('schreiben');
  const liste = arbeitsanweisungen.use((x) => x.auftragId === id && !x.vorlage, [id]);
  const vorlagen = arbeitsanweisungen.use((x) => !!x.vorlage);
  const [vorlage, setVorlage] = useState('');

  const anlegen = () => {
    const x = anweisungAnlegen(id, vorlage || undefined);
    toast('Arbeitsanweisung angelegt.');
    navigate(anweisungPfad(x.id, true));
  };

  const neu = darfSchreiben && (
    <Zeile abstand={8}>
      {vorlagen.length > 0 && (
        <div style={{ flex: '1 1 240px' }}>
          <Auswahl label="Vorlage" optional value={vorlage} leer="Leer beginnen" onChange={(e) => setVorlage(e.target.value)} optionen={vorlagen.map((v) => ({ wert: v.id, label: v.titel }))} />
        </div>
      )}
      <div style={{ alignSelf: 'flex-end' }}>
        <Button variante={liste.length ? 'sekundaer' : 'primaer'} icon="plus" onClick={anlegen}>
          Anweisung schreiben
        </Button>
      </div>
    </Zeile>
  );

  return (
    <Stapel abstand={16}>
      {liste.length ? (
        liste.map((x) => (
          <Karte
            key={x.id}
            titel={x.titel}
            kompakt
            aktion={
              <Button variante="tertiaer" klein to={anweisungPfad(x.id)}>
                Öffnen
              </Button>
            }
          >
            <AnweisungAnsicht x={x} />
          </Karte>
        ))
      ) : (
        <Leer titel="Noch keine Arbeitsanweisung" text="Schreib in ein paar Schritten auf, was vor Ort zu tun ist – mit Fotos und Sicherheitshinweisen. Der Monteur sieht sie direkt am Termin." icon="wissen" />
      )}
      {neu}
    </Stapel>
  );
}
