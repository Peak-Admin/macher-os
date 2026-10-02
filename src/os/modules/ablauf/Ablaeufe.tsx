import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, neueId, useDatenstand } from '@core/db';
import { setzeEinstellung, useEinstellung } from '@core/einstellungen';
import { FACHRICHTUNGEN, VORLAGE_KEY, gewerkVorlage, type SchrittVorlage, type SchrittZustaendig } from '@core/gewerke';
import { PHASEN, type Auftragsart, type Phase } from '@core/objects';
import { useDarf } from '@core/session';
import { ART_LABEL } from '@modules/auftraege/logik';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, useBestaetigen, useToast } from '@ui/index';
import { ABLAUF_PFAD, ablaufMitId, ablaufPfad, ablaufSpeichern, aktiveVorlage, alleAblaeufe, angepasst, aufVorlageZuruecksetzen, schrittstaende } from './daten';
import { BEDINGUNG_LABEL, ZUSTAENDIG_LABEL, ablaufPruefen, nachPhaseSortiert, phasenLabel } from './logik';

const ARTEN = Object.keys(ART_LABEL) as Auftragsart[];
const PHASEN_WAHL = PHASEN.filter((p) => p.id !== 'verloren').map((p) => ({ wert: p.id, label: p.label }));
const ZUSTAENDIG_WAHL = (Object.keys(ZUSTAENDIG_LABEL) as SchrittZustaendig[]).map((z) => ({ wert: z, label: ZUSTAENDIG_LABEL[z] }));

const schrittText = (s: SchrittVorlage) =>
  [
    phasenLabel(s.phase),
    s.zustaendig ? ZUSTAENDIG_LABEL[s.zustaendig] : undefined,
    s.fristTage ? `Frist ${s.fristTage === 1 ? '1 Tag' : `${s.fristTage} Tage`}` : undefined,
    s.automatisch ? `geht weiter, sobald ${BEDINGUNG_LABEL[s.automatisch]}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

/** Übersicht: welche Abläufe gelten für welche Auftragsarten? (Betrieb › Einstellungen, nur im Kontext) */
export function AblaeufeSeite() {
  useDatenstand();
  const toast = useToast();
  const [bestaetigen, bestaetigenDialog] = useBestaetigen();
  const darf = useDarf('admin');
  const liste = alleAblaeufe();
  const vorlage = aktiveVorlage();
  const eigen = angepasst();
  const betrieb = db.betrieb.get('betrieb');
  const fach = FACHRICHTUNGEN.filter((f) => f.gewerk === betrieb?.gewerk);
  const [gewaehlt] = useEinstellung<string | undefined>(VORLAGE_KEY, undefined);
  const laufend = (id: string) => schrittstaende.all().filter((s) => s.ablaufId === id && db.auftraege.get(s.auftragId) && !['erledigt', 'verloren'].includes(db.auftraege.get(s.auftragId)!.phase)).length;

  return (
    <Seite titel="Auftragsabläufe" untertitel="Welche Schritte ein Auftrag durchläuft, wer sich kümmert und wann Macher erinnert." zurueck={{ to: '/betrieb/einstellungen', label: 'Einstellungen' }}>
      <Stapel abstand={24}>
        <Meldung titel={eigen ? 'Eigene Abläufe' : `Vorlage: ${vorlage.label}`}>
          {eigen
            ? 'Du hast die Abläufe an deinen Betrieb angepasst. Laufende Aufträge behalten ihren Ablauf.'
            : 'Macher nutzt die Abläufe aus der Vorlage für dein Gewerk. Sobald du etwas änderst, werden sie zu deinen eigenen.'}
        </Meldung>

        {darf && fach.length > 0 && !eigen && betrieb && (
          <Auswahl
            label="Schwerpunkt deines Betriebs"
            hilfe="Bestimmt die Abläufe und Begriffe der Vorlage."
            value={gewaehlt && fach.some((f) => f.id === gewaehlt) ? gewaehlt : ''}
            onChange={(e) => {
              setzeEinstellung(VORLAGE_KEY, e.target.value || undefined);
              toast('Vorlage gewechselt.');
            }}
            optionen={[{ wert: '', label: gewerkVorlage(betrieb.gewerk).label }, ...fach.map((f) => ({ wert: f.id, label: f.schwerpunkt }))]}
          />
        )}

        <Liste leer={<Leer titel="Keine Abläufe" text="Setz die Abläufe auf die Vorlage zurück, dann geht es mit den Standardschritten weiter." icon="liste" />}>
          {liste.map((a) => {
            const n = laufend(a.id);
            return (
              <ListenZeile
                key={a.id}
                to={ablaufPfad(a.id)}
                titel={a.name}
                untertitel={`${a.arten.map((x) => ART_LABEL[x]).join(', ')} · ${a.schritte.length} Schritte`}
                rechts={n ? <Status ton="aktiv">{n === 1 ? '1 laufender Auftrag' : `${n} laufende Aufträge`}</Status> : undefined}
              />
            );
          })}
        </Liste>

        {darf && eigen && (
          <div>
            <Button
              variante="tertiaer"
              icon="wiederholen"
              onClick={async () => {
                if (!(await bestaetigen('Auf Vorlage zurücksetzen?', 'Deine Änderungen an den Abläufen landen im Papierkorb. Laufende Aufträge bleiben, wo sie sind.', 'Zurücksetzen'))) return;
                aufVorlageZuruecksetzen();
                toast('Abläufe stehen wieder auf der Vorlage.');
              }}
            >
              Auf Vorlage zurücksetzen
            </Button>
          </div>
        )}
        {!darf && <Meta>Ändern kann nur, wer Einstellungen bearbeiten darf.</Meta>}
      </Stapel>
      {bestaetigenDialog}
    </Seite>
  );
}

/** Einen Ablauf bearbeiten: Schritte, Phase, Zuständige, Fristen */
export function AblaufBearbeiten() {
  const { id = '' } = useParams();
  useDatenstand();
  const toast = useToast();
  const darf = useDarf('admin');
  const original = ablaufMitId(decodeURIComponent(id));
  const [name, setName] = useState(original?.name ?? '');
  const [arten, setArten] = useState<Auftragsart[]>(original?.arten ?? []);
  const [schritte, setSchritte] = useState<SchrittVorlage[]>(original?.schritte ?? []);
  const [offen, setOffen] = useState<number | 'neu' | null>(null);
  const [fehler, setFehler] = useState<string>();
  const [geaendert, setGeaendert] = useState(false);

  if (!original)
    return (
      <Seite titel="Ablauf nicht gefunden" zurueck={{ to: ABLAUF_PFAD, label: 'Auftragsabläufe' }}>
        <Leer titel="Diesen Ablauf gibt es nicht (mehr)." text="Vielleicht wurde er zurückgesetzt." icon="liste" aktion={<Button to={ABLAUF_PFAD}>Zu den Abläufen</Button>} />
      </Seite>
    );

  const aendern = (neu: SchrittVorlage[]) => {
    setSchritte(neu);
    setGeaendert(true);
    setFehler(undefined);
  };
  const verschieben = (i: number, um: -1 | 1) => {
    const j = i + um;
    if (j < 0 || j >= schritte.length) return;
    const neu = [...schritte];
    [neu[i], neu[j]] = [neu[j], neu[i]];
    aendern(neu);
  };

  const speichern = () => {
    const sortiert = nachPhaseSortiert(schritte);
    const f = ablaufPruefen({ name, arten, schritte: sortiert });
    if (f) return setFehler(f);
    try {
      ablaufSpeichern({ id: original.id, name: name.trim(), arten, schritte: sortiert });
      setSchritte(sortiert);
      setGeaendert(false);
      toast(sortiert.some((s, i) => s !== schritte[i]) ? 'Gespeichert. Die Schritte stehen jetzt in der Reihenfolge der Phasen.' : 'Ablauf gespeichert.');
    } catch (e) {
      console.error(e);
      toast('Das hat nicht geklappt. Versuch es noch einmal.', { ton: 'achtung' });
    }
  };

  return (
    <Seite
      titel={original.name}
      oberzeile="Auftragsablauf"
      zurueck={{ to: ABLAUF_PFAD, label: 'Auftragsabläufe' }}
      aktion={darf ? <Button icon="check" onClick={speichern} disabled={!geaendert}>Speichern</Button> : undefined}
    >
      <Stapel abstand={24}>
        {fehler && <Meldung ton="achtung" titel="Noch nicht gespeichert">{fehler}</Meldung>}
        <Karte kompakt>
          <Stapel abstand={16}>
            <Eingabe label="Name" value={name} disabled={!darf} onChange={(e) => (setName(e.target.value), setGeaendert(true))} />
            <fieldset className="ablauf-arten">
              <legend className="mm-label">Gilt für diese Auftragsarten</legend>
              <Zeile abstand={16}>
                {ARTEN.map((x) => (
                  <Checkbox key={x} label={ART_LABEL[x]} checked={arten.includes(x)} disabled={!darf} onChange={(an) => (setArten(an ? [...arten, x] : arten.filter((y) => y !== x)), setGeaendert(true))} />
                ))}
              </Zeile>
            </fieldset>
          </Stapel>
        </Karte>

        <Stapel abstand={8}>
          <Zeile zwischen>
            <h2 className="ablauf-titel">Schritte</h2>
            {darf && (
              <Button variante="sekundaer" klein icon="plus" onClick={() => setOffen('neu')}>
                Schritt hinzufügen
              </Button>
            )}
          </Zeile>
          <Liste leer={<Leer titel="Noch keine Schritte" text="Füg den ersten Schritt hinzu, z. B. „Neue Anfrage“." icon="liste" />}>
            {schritte.map((s, i) => (
              <ListenZeile
                key={s.id}
                links={<span className="ablauf-nr mm-number">{i + 1}</span>}
                titel={s.label}
                untertitel={schrittText(s)}
                onClick={darf ? () => setOffen(i) : undefined}
              />
            ))}
          </Liste>
          <Meta>Jeder Schritt gehört zu einer Phase. Beim Speichern stehen die Schritte in der Reihenfolge der Phasen. Macher geht von selbst weiter, wenn die Bedingung eines Schritts erfüllt ist.</Meta>
        </Stapel>
      </Stapel>

      {offen !== null && (
        <SchrittDialog
          schritt={offen === 'neu' ? undefined : schritte[offen]}
          onHoch={typeof offen === 'number' && offen > 0 ? () => (verschieben(offen, -1), setOffen(offen - 1)) : undefined}
          onRunter={typeof offen === 'number' && offen < schritte.length - 1 ? () => (verschieben(offen, 1), setOffen(offen + 1)) : undefined}
          onEntfernen={typeof offen === 'number' ? () => (aendern(schritte.filter((_, j) => j !== offen)), setOffen(null)) : undefined}
          onSchliessen={() => setOffen(null)}
          onSpeichern={(s) => {
            aendern(offen === 'neu' ? [...schritte, s] : schritte.map((x, j) => (j === offen ? s : x)));
            setOffen(null);
          }}
        />
      )}
      {geaendert && darf && (
        <div className="ablauf-ungespeichert">
          <Meta>Du hast Änderungen, die noch nicht gespeichert sind.</Meta>
          <Zeile>
            <Button klein icon="check" onClick={speichern}>Speichern</Button>
            <Button
              klein
              variante="tertiaer"
              onClick={() => {
                setName(original.name);
                setArten(original.arten);
                setSchritte(original.schritte);
                setGeaendert(false);
                setFehler(undefined);
              }}
            >
              Verwerfen
            </Button>
          </Zeile>
        </div>
      )}
    </Seite>
  );
}

function SchrittDialog({
  schritt,
  onSchliessen,
  onSpeichern,
  onHoch,
  onRunter,
  onEntfernen,
}: {
  schritt?: SchrittVorlage;
  onSchliessen: () => void;
  onSpeichern: (s: SchrittVorlage) => void;
  onHoch?: () => void;
  onRunter?: () => void;
  onEntfernen?: () => void;
}) {
  const [label, setLabel] = useState(schritt?.label ?? '');
  const [phase, setPhase] = useState<Phase>(schritt?.phase ?? 'beauftragt');
  const [zustaendig, setZustaendig] = useState<SchrittZustaendig | ''>(schritt?.zustaendig ?? '');
  const [frist, setFrist] = useState(schritt?.fristTage ? String(schritt.fristTage) : '');
  const [erinnerung, setErinnerung] = useState(schritt?.erinnerung ?? '');
  const [fehler, setFehler] = useState<string>();

  const uebernehmen = () => {
    if (!label.trim()) return setFehler('Gib dem Schritt einen Namen.');
    const tage = frist ? Number(frist) : undefined;
    if (tage != null && (!Number.isInteger(tage) || tage < 1 || tage > 365)) return setFehler('Frist bitte als ganze Tage zwischen 1 und 365.');
    onSpeichern({
      ...(schritt ?? { id: neueId('s') }),
      label: label.trim(),
      phase,
      zustaendig: zustaendig || undefined,
      fristTage: tage,
      erinnerung: tage ? erinnerung.trim() || undefined : schritt?.erinnerung,
    });
  };

  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={schritt ? 'Schritt bearbeiten' : 'Schritt hinzufügen'}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>Abbrechen</Button>
          <Button icon="check" onClick={uebernehmen}>Übernehmen</Button>
        </>
      }
    >
      <Stapel abstand={16}>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <FormRaster>
          <Eingabe label="Name des Schritts" value={label} onChange={(e) => (setLabel(e.target.value), setFehler(undefined))} placeholder="z. B. Gerüst bestellen" autoFocus />
          <Auswahl label="Gehört zur Phase" value={phase} onChange={(e) => setPhase(e.target.value as Phase)} optionen={PHASEN_WAHL} />
          <Auswahl label="Wer kümmert sich?" value={zustaendig} onChange={(e) => setZustaendig(e.target.value as SchrittZustaendig | '')} optionen={ZUSTAENDIG_WAHL} leer="Niemand Bestimmtes" />
          <Eingabe label="Erinnern nach (Tage)" value={frist} onChange={(e) => setFrist(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="ohne Frist" optional />
        </FormRaster>
        {frist && <Eingabe label="Text der Erinnerung" value={erinnerung} onChange={(e) => setErinnerung(e.target.value)} placeholder="z. B. Gerüst beim Gerüstbauer bestellen" optional />}
        {schritt?.automatisch && <Meta>Macher geht von selbst zu diesem Schritt, sobald {BEDINGUNG_LABEL[schritt.automatisch]}.</Meta>}
        {schritt && (onHoch || onRunter || onEntfernen) && (
          <Zeile abstand={8}>
            {onHoch && (
              <Button variante="tertiaer" klein icon="pfeilLinks" onClick={onHoch}>
                Früher
              </Button>
            )}
            {onRunter && (
              <Button variante="tertiaer" klein icon="pfeilRechts" onClick={onRunter}>
                Später
              </Button>
            )}
            {onEntfernen && (
              <Button variante="tertiaer" klein icon="muell" onClick={onEntfernen}>
                Schritt entfernen
              </Button>
            )}
          </Zeile>
        )}
      </Stapel>
    </Dialog>
  );
}
