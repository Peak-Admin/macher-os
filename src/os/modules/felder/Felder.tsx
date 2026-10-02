/**
 * Eigene Felder & Formulare verwalten (Betrieb › Einstellungen › Betrieb › „Eigene Felder“).
 * Ein Meister soll ohne Erklärung verstehen: „Eigenes Feld hinzufügen“ → Name, Art, wo es erscheint.
 */
import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { gewerkVorlage } from '@core/gewerke';
import { useDarf } from '@core/session';
import { AktionsMenue, Auswahl, Button, Checkbox, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Textfeld, Zeile, useBestaetigen, useToast } from '@ui/index';
import {
  FELD_OBJEKTE,
  FELD_TYPEN,
  definitionPruefen,
  eigeneFelder,
  eigeneFormulare,
  feldAnlegen,
  feldEntfernen,
  feldObjekt,
  feldTypLabel,
  feldVerschieben,
  feldvorlagenAnwenden,
  felderFuer,
  felderVonFormular,
  formularEntfernen,
  sindFeldvorlagen,
  type FeldDefinition,
  type FeldObjekt,
  type FeldTyp,
  type FeldVorlage,
  type Formular,
} from './daten';

function beschreibung(f: FeldDefinition): string {
  return [
    feldTypLabel(f.typ),
    f.typ === 'masseinheit' && f.einheit ? `in ${f.einheit}` : '',
    f.typ === 'auswahl' && f.optionen?.length ? f.optionen.join(' / ') : '',
    f.pflicht ? 'muss ausgefüllt werden' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Feldvorlagen des eigenen Gewerks, falls die Gewerk-Vorlage welche mitbringt */
function gewerkFeldvorlagen(): FeldVorlage[] {
  const b = db.betrieb.get('betrieb');
  if (!b) return [];
  const v = gewerkVorlage(b.gewerk) as unknown as Record<string, unknown>;
  const liste = v.feldvorlagen ?? v.felder;
  return sindFeldvorlagen(liste) ? liste : [];
}

export function Felder() {
  useDatenstand();
  const toast = useToast();
  const [fragen, bestaetigen] = useBestaetigen();
  const admin = useDarf('admin');
  const [feldDialog, setFeldDialog] = useState<{ objekt?: FeldObjekt; formularId?: string } | null>(null);
  const [formularDialog, setFormularDialog] = useState(false);
  const felder = eigeneFelder.all();
  const formulare = [...eigeneFormulare.all()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const vorlagen = gewerkFeldvorlagen();
  const vorhandeneSchluessel = new Set(eigeneFelder.allMitGeloeschten().map((f) => f.schluessel));
  const offeneVorlagen = vorlagen.filter((v) => !vorhandeneSchluessel.has(v.schluessel));

  if (!admin)
    return (
      <Seite titel="Eigene Felder" zurueck={{ to: '/betrieb/einstellungen', label: 'Einstellungen' }}>
        <Meldung ton="achtung" titel="Dafür fehlt dir ein Recht">Eigene Felder und Formulare legt an, wer das Recht „Einstellungen“ hat.</Meldung>
      </Seite>
    );

  const entfernen = async (f: FeldDefinition) => {
    if (!(await fragen(`„${f.label}“ entfernen?`, 'Das Feld verschwindet an allen Objekten. Eingetragene Werte kommen mit in den Papierkorb und lassen sich dort wiederherstellen.', 'Feld entfernen'))) return;
    feldEntfernen(f.id);
    toast(`„${f.label}“ entfernt.`);
  };
  const formularWeg = async (x: Formular) => {
    if (!(await fragen(`Formular „${x.name}“ entfernen?`, 'Das Formular und seine Felder kommen in den Papierkorb. Ausgefüllte Werte auch.', 'Formular entfernen'))) return;
    formularEntfernen(x.id);
    toast(`Formular „${x.name}“ entfernt.`);
  };
  const vorlagenUebernehmen = () => {
    const r = feldvorlagenAnwenden(offeneVorlagen);
    toast(r.angelegt.length ? `${r.angelegt.length} Felder für dein Gewerk angelegt.` : 'Alle Felder deines Gewerks sind schon da.');
  };

  const zeile = (f: FeldDefinition) => (
    <ListenZeile
      key={f.id}
      titel={f.label}
      untertitel={beschreibung(f)}
      rechts={
        <AktionsMenue
          klein
          label="Mehr"
          aktionen={[
            { label: 'Nach oben', icon: 'pfeil', onClick: () => feldVerschieben(f.id, -1) },
            { label: 'Nach unten', icon: 'pfeil', onClick: () => feldVerschieben(f.id, 1) },
            { label: 'Entfernen', icon: 'muell', onClick: () => void entfernen(f) },
          ]}
        />
      }
    />
  );

  const gruppen = FELD_OBJEKTE.filter((o) => o.id !== 'formular')
    .map((o) => ({ o, felder: felderFuer(o.id) }))
    .filter((g) => g.felder.length);

  return (
    <Seite
      titel="Eigene Felder"
      untertitel="Angaben, die Macher noch nicht kennt – z. B. die Zählernummer am Ort oder die Dachneigung beim Aufmaß."
      zurueck={{ to: '/betrieb/einstellungen', label: 'Einstellungen' }}
      aktion={
        <Button icon="plus" onClick={() => setFeldDialog({})}>
          Eigenes Feld hinzufügen
        </Button>
      }
    >
      <Stapel abstand={24}>
        {offeneVorlagen.length > 0 && (
          <Meldung
            titel={`${offeneVorlagen.length} typische Felder für dein Gewerk`}
            aktion={
              <Button klein variante="sekundaer" onClick={vorlagenUebernehmen}>
                Übernehmen
              </Button>
            }
          >
            {offeneVorlagen
              .slice(0, 4)
              .map((v) => v.label)
              .join(', ')}
            {offeneVorlagen.length > 4 ? ' …' : ''}
          </Meldung>
        )}

        {!felder.length && !formulare.length ? (
          <Leer
            icon="liste"
            titel="Noch keine eigenen Felder"
            text="Du brauchst eine Angabe, die es in Macher nicht gibt? Leg sie als eigenes Feld an. Sie erscheint dann an jedem Kunden, Ort, Auftrag oder Termin – je nachdem, wo du sie brauchst."
            aktion={<Button onClick={() => setFeldDialog({})}>Eigenes Feld hinzufügen</Button>}
          />
        ) : (
          gruppen.map((g) => (
            <Karte
              key={g.o.id}
              titel={g.o.ueberschrift}
              aktion={
                <Button klein variante="tertiaer" icon="plus" onClick={() => setFeldDialog({ objekt: g.o.id })}>
                  Feld hinzufügen
                </Button>
              }
            >
              <Liste>{g.felder.map(zeile)}</Liste>
            </Karte>
          ))
        )}

        <Karte
          titel="Formulare"
          aktion={
            <Button klein variante="sekundaer" onClick={() => setFormularDialog(true)}>
              Formular anlegen
            </Button>
          }
        >
          {formulare.length ? (
            <Stapel abstand={16}>
              {formulare.map((x) => {
                const fs = felderVonFormular(x.id);
                return (
                  <Stapel key={x.id} abstand={8}>
                    <Zeile zwischen>
                      <div>
                        <strong>{x.name}</strong>
                        <Meta>
                          Ausfüllen am {feldObjekt(x.objekt).label} · {fs.length === 1 ? '1 Feld' : `${fs.length} Felder`}
                        </Meta>
                      </div>
                      <AktionsMenue
                        klein
                        label="Mehr"
                        aktionen={[
                          { label: 'Feld hinzufügen', icon: 'plus', onClick: () => setFeldDialog({ objekt: 'formular', formularId: x.id }) },
                          { label: 'Formular entfernen', icon: 'muell', onClick: () => void formularWeg(x) },
                        ]}
                      />
                    </Zeile>
                    {fs.length ? (
                      <Liste>{fs.map(zeile)}</Liste>
                    ) : (
                      <div>
                        <Button klein variante="sekundaer" icon="plus" onClick={() => setFeldDialog({ objekt: 'formular', formularId: x.id })}>
                          Erstes Feld hinzufügen
                        </Button>
                      </div>
                    )}
                  </Stapel>
                );
              })}
            </Stapel>
          ) : (
            <Meta>Ein Formular bündelt mehrere Felder in fester Reihenfolge – z. B. ein Prüfprotokoll, das der Monteur am Auftrag ausfüllt.</Meta>
          )}
        </Karte>
        <Meta>Eigene Felder erscheinen am Objekt unter „Eigene Angaben“ und werden von der Suche gefunden.</Meta>
      </Stapel>
      {feldDialog && <FeldDialog vorgabe={feldDialog} formulare={formulare} onSchliessen={() => setFeldDialog(null)} />}
      {formularDialog && <FormularDialog onSchliessen={() => setFormularDialog(false)} onAngelegt={(id) => setFeldDialog({ objekt: 'formular', formularId: id })} />}
      {bestaetigen}
    </Seite>
  );
}

function FeldDialog({ vorgabe, formulare, onSchliessen }: { vorgabe: { objekt?: FeldObjekt; formularId?: string }; formulare: Formular[]; onSchliessen: () => void }) {
  const toast = useToast();
  const [objekt, setObjekt] = useState<FeldObjekt>(vorgabe.objekt ?? 'auftrag');
  const [formularId, setFormularId] = useState(vorgabe.formularId ?? formulare[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [typ, setTyp] = useState<FeldTyp>('text');
  const [einheit, setEinheit] = useState('');
  const [optionen, setOptionen] = useState('');
  const [pflicht, setPflicht] = useState(false);
  const [mehr, setMehr] = useState(false);
  const [hilfe, setHilfe] = useState('');
  const [fehler, setFehler] = useState<string>();

  const objekte = FELD_OBJEKTE.filter((o) => o.id !== 'formular' || formulare.length);
  const speichern = () => {
    const d = {
      objekt,
      label,
      typ,
      einheit,
      optionen: optionen.split('\n'),
      pflicht,
      hilfe: hilfe.trim() || undefined,
      formularId: objekt === 'formular' ? formularId : undefined,
    };
    const f = definitionPruefen(d);
    if (f) return setFehler(f);
    feldAnlegen(d);
    toast(`„${label.trim()}“ angelegt.`);
    onSchliessen();
  };

  return (
    <Dialog
      offen
      titel="Eigenes Feld hinzufügen"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Feld anlegen</Button>
        </>
      }
    >
      <Stapel>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <Eingabe label="Name des Feldes" placeholder="z. B. Zählernummer" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        <Auswahl label="Wo soll das Feld erscheinen?" value={objekt} onChange={(e) => setObjekt(e.target.value as FeldObjekt)} optionen={objekte.map((o) => ({ wert: o.id, label: o.label }))} hilfe={feldObjekt(objekt).text} />
        {objekt === 'formular' && <Auswahl label="Formular" value={formularId} onChange={(e) => setFormularId(e.target.value)} optionen={formulare.map((x) => ({ wert: x.id, label: x.name }))} />}
        <Auswahl label="Was wird eingetragen?" value={typ} onChange={(e) => setTyp(e.target.value as FeldTyp)} optionen={FELD_TYPEN.map((t) => ({ wert: t.id, label: `${t.label} – ${t.text}` }))} />
        {typ === 'masseinheit' && <Eingabe label="Einheit" placeholder="z. B. m², kW, bar" value={einheit} onChange={(e) => setEinheit(e.target.value)} />}
        {typ === 'auswahl' && <Textfeld label="Möglichkeiten" hilfe="Eine Möglichkeit pro Zeile." value={optionen} onChange={(e) => setOptionen(e.target.value)} />}
        <Checkbox label="Muss ausgefüllt werden" checked={pflicht} onChange={setPflicht} />
        {mehr ? (
          <Eingabe label="Hinweis unter dem Feld" optional placeholder="z. B. steht auf dem Typenschild" value={hilfe} onChange={(e) => setHilfe(e.target.value)} />
        ) : (
          <div>
            <Button klein variante="tertiaer" onClick={() => setMehr(true)}>
              Weitere Optionen
            </Button>
          </div>
        )}
      </Stapel>
    </Dialog>
  );
}

function FormularDialog({ onSchliessen, onAngelegt }: { onSchliessen: () => void; onAngelegt: (id: string) => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [objekt, setObjekt] = useState<Formular['objekt']>('auftrag');
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    if (!name.trim()) return setFehler('Gib dem Formular einen Namen.');
    const x = eigeneFormulare.create({ name: name.trim(), objekt, beschreibung: text.trim() || undefined });
    toast(`Formular „${x.name}“ angelegt. Jetzt das erste Feld hinzufügen.`);
    onSchliessen();
    onAngelegt(x.id);
  };
  return (
    <Dialog
      offen
      titel="Formular anlegen"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Formular anlegen</Button>
        </>
      }
    >
      <Stapel>
        <Eingabe label="Name des Formulars" placeholder="z. B. Prüfprotokoll Heizung" value={name} onChange={(e) => setName(e.target.value)} fehler={fehler} autoFocus />
        <Auswahl
          label="Wo wird es ausgefüllt?"
          value={objekt}
          onChange={(e) => setObjekt(e.target.value as Formular['objekt'])}
          optionen={FELD_OBJEKTE.filter((o) => o.id !== 'formular').map((o) => ({ wert: o.id, label: o.label }))}
        />
        <Textfeld label="Kurze Beschreibung" optional value={text} onChange={(e) => setText(e.target.value)} />
      </Stapel>
    </Dialog>
  );
}
