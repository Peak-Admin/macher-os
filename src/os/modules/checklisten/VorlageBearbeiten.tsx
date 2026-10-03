import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { neueId } from '@core/db';
import type { Auftragsart } from '@core/objects';
import { Button, Checkbox, Eingabe, IconButton, Karte, Leer, Meldung, Schalter, Seite, Stapel, Zeile, useToast } from '@ui/index';
import { ART_LABEL } from '../auftraege/logik';
import { checklistenVorlagen, vorlagePfad, type ChecklistenPunkt } from './daten';

export function VorlageBearbeiten() {
  const { id = '' } = useParams();
  const neu = id === 'neu';
  const v = checklistenVorlagen.useOne(neu ? undefined : id);
  if (!neu && !v)
    return (
      <Seite titel="Vorlage nicht gefunden" zurueck={{ to: '/auftraege/checklisten', label: 'Checklisten' }}>
        <Leer titel="Diese Vorlage gibt es nicht (mehr)." icon="liste" />
      </Seite>
    );
  return <Formular key={id} vorlageId={neu ? undefined : id} />;
}

function Formular({ vorlageId }: { vorlageId?: string }) {
  const v = vorlageId ? checklistenVorlagen.get(vorlageId) : undefined;
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(v?.name ?? '');
  const [arten, setArten] = useState<Auftragsart[]>(v?.arten ?? ['kundendienst']);
  const [automatisch, setAutomatisch] = useState(v?.automatisch ?? true);
  const [aktiv, setAktiv] = useState(v?.aktiv ?? true);
  const [punkte, setPunkte] = useState<ChecklistenPunkt[]>(v?.punkte ?? [{ id: neueId('p'), text: '' }]);
  const [fehler, setFehler] = useState<string>();

  const setPunkt = (i: number, patch: Partial<ChecklistenPunkt>) => setPunkte((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const speichern = () => {
    const sauber = punkte.map((p) => ({ ...p, text: p.text.trim() })).filter((p) => p.text);
    if (!name.trim()) return setFehler('Gib der Vorlage einen Namen.');
    if (!arten.length) return setFehler('Wähle mindestens eine Auftragsart.');
    if (!sauber.length) return setFehler('Trag mindestens einen Punkt ein.');
    const daten = { name: name.trim(), arten, automatisch, aktiv, punkte: sauber };
    if (v) {
      checklistenVorlagen.update(v.id, daten);
      toast('Vorlage gespeichert. Gilt ab jetzt für neue Checklisten.');
    } else {
      const n = checklistenVorlagen.create(daten);
      toast('Vorlage angelegt.');
      navigate(vorlagePfad(n.id), { replace: true });
    }
    setFehler(undefined);
  };

  return (
    <Seite titel={v ? v.name : 'Vorlage anlegen'} oberzeile="Checklisten-Vorlage" zurueck={{ to: '/auftraege/checklisten', label: 'Checklisten' }}>
      <Karte>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <Stapel abstand={24}>
            {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
            <Eingabe label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Kundendienst-Einsatz" />
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="mm-label">Für welche Auftragsarten?</legend>
              <Zeile abstand={16}>
                {(Object.keys(ART_LABEL) as Auftragsart[]).map((x) => (
                  <Checkbox key={x} label={ART_LABEL[x]} checked={arten.includes(x)} onChange={(an) => setArten((l) => (an ? [...l, x] : l.filter((y) => y !== x)))} />
                ))}
              </Zeile>
            </fieldset>
            <Schalter label="Automatisch anlegen" beschreibung="Lotte hängt die Checkliste an jeden passenden Auftrag, sobald er beauftragt ist." checked={automatisch} onChange={setAutomatisch} />
            <Schalter label="Vorlage aktiv" checked={aktiv} onChange={setAktiv} />
            <Stapel abstand={12}>
              <h3>Punkte</h3>
              {punkte.map((p, i) => (
                <Karte key={p.id} kompakt>
                  <Stapel abstand={8}>
                    <Zeile abstand={8} umbruch={false}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Eingabe label={`Punkt ${i + 1}`} value={p.text} onChange={(e) => setPunkt(i, { text: e.target.value })} />
                      </div>
                      <div style={{ alignSelf: 'flex-end' }}>
                        <IconButton icon="muell" label={`Punkt ${i + 1} entfernen`} onClick={() => setPunkte((l) => l.filter((_, j) => j !== i))} />
                      </div>
                    </Zeile>
                    <Zeile abstand={16}>
                      <Checkbox label="Pflicht vor Abnahme" checked={!!p.pflicht} onChange={(x) => setPunkt(i, { pflicht: x || undefined })} />
                      <Checkbox label="Foto nötig" checked={!!p.fotoPflicht} onChange={(x) => setPunkt(i, { fotoPflicht: x || undefined })} />
                    </Zeile>
                  </Stapel>
                </Karte>
              ))}
              <div>
                <Button variante="sekundaer" icon="plus" onClick={() => setPunkte((l) => [...l, { id: neueId('p'), text: '' }])}>
                  Punkt hinzufügen
                </Button>
              </div>
            </Stapel>
            <div>
              <Button type="submit">Vorlage speichern</Button>
            </div>
          </Stapel>
        </form>
      </Karte>
    </Seite>
  );
}
