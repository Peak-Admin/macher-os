import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, passt, personName, relativ, uhrzeit } from '@core/format';
import type { Dokument, ID } from '@core/objects';
import {
  BeispielMarke,
  Button,
  Dialog,
  Eingabe,
  Filter,
  Icon,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meta,
  Schalter,
  Seite,
  Stapel,
  Status,
  Suchfeld,
  Textfeld,
  ZweiSpalten,
  useBestaetigen,
  useToast,
  type IconName,
} from '@ui/index';
import { AuftragAuswahl, Zeitstrahl } from '@ui/objekt';
import { groesseText } from '@modules/fotos/daten';
import { ART_LABEL, dataUrlZuBlob, istDatei, vorschauArt } from './daten';
import { Hochladen } from './Hochladen';

const ICON: Partial<Record<Dokument['art'], IconName>> = { pdf: 'dokument', plan: 'ordner', datei: 'dokument', foto: 'kamera', sprache: 'mikro', notiz: 'notiz', unterschrift: 'unterschrift', bericht: 'notiz' };

function DateiZeile({ d, mitAuftrag = true }: { d: Dokument; mitAuftrag?: boolean }) {
  const a = mitAuftrag ? db.auftraege.get(d.auftragId) : undefined;
  return (
    <ListenZeile
      to={`/auftraege/dateien/${d.id}`}
      links={<Icon name={ICON[d.art] ?? 'dokument'} />}
      titel={
        <>
          {d.titel} <BeispielMarke zeigen={d.beispiel} />
        </>
      }
      untertitel={[ART_LABEL[d.art], d.groesse ? groesseText(d.groesse) : null, a ? `${a.nummer} ${a.titel}` : mitAuftrag && !d.auftragId ? 'Ohne Auftrag' : null, relativ(d.erstelltAm)].filter(Boolean).join(' · ')}
      rechts={d.fuerKunde ? <Status ton="aktiv" icon={false}>Für Kunden sichtbar</Status> : null}
    />
  );
}

type F = 'alle' | 'plan' | 'pdf' | 'kunde';

export function DateienListe() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<F>('alle');
  const [hoch, setHoch] = useState(false);
  const alle = db.dokumente.use(istDatei);
  const passend = alle
    .filter((d) => (filter === 'alle' ? true : filter === 'kunde' ? d.fuerKunde : d.art === filter))
    .filter((d) => !q || passt(q, d.titel, db.auftraege.get(d.auftragId)?.titel, db.auftraege.get(d.auftragId)?.nummer))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  return (
    <Seite titel="Dateien" untertitel="Pläne, PDFs und Zeichnungen am Auftrag – auch draußen griffbereit." aktion={<Button icon="upload" onClick={() => setHoch(true)}>Dateien hochladen</Button>}>
      <Stapel abstand={16}>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Dateiname, Auftrag …" />
        <Filter
          label="Art"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: alle.length },
            { wert: 'plan', label: 'Pläne', zaehler: alle.filter((d) => d.art === 'plan').length },
            { wert: 'pdf', label: 'PDFs', zaehler: alle.filter((d) => d.art === 'pdf').length },
            { wert: 'kunde', label: 'Für Kunden', zaehler: alle.filter((d) => d.fuerKunde).length },
          ]}
        />
        <Liste
          leer={
            alle.length ? (
              <Leer titel="Keine Treffer" text="Passe Suche oder Filter an." icon="suche" />
            ) : (
              <Leer titel="Noch keine Dateien" text="Lade Pläne, PDFs oder Zeichnungen hoch – dann hat dein Team sie auf der Baustelle dabei." aktion={<Button onClick={() => setHoch(true)}>Dateien hochladen</Button>} icon="ordner" />
            )
          }
        >
          {passend.map((d) => (
            <DateiZeile key={d.id} d={d} />
          ))}
        </Liste>
      </Stapel>
      <Dialog offen={hoch} onSchliessen={() => setHoch(false)} titel="Dateien hochladen">
        {hoch && <Hochladen fertig={() => setHoch(false)} />}
      </Dialog>
    </Seite>
  );
}

/** Blob-URL aus einer Data-URL (wird beim Verlassen wieder freigegeben) */
function useBlobUrl(url: string | undefined) {
  const blobUrl = useMemo(() => {
    if (!url?.startsWith('data:') || typeof URL.createObjectURL !== 'function') return url;
    const b = dataUrlZuBlob(url);
    return b ? URL.createObjectURL(b) : url;
  }, [url]);
  useEffect(() => () => void (blobUrl?.startsWith('blob:') && URL.revokeObjectURL(blobUrl)), [blobUrl]);
  return blobUrl;
}

function Vorschau({ d }: { d: Dokument }) {
  const art = vorschauArt(d);
  const blob = useBlobUrl(art === 'pdf' ? d.url : undefined);
  if (art === 'bild') return <img src={d.url} alt={d.titel} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', background: 'var(--mm-canvas)', borderRadius: 5, display: 'block' }} />;
  if (art === 'pdf')
    return (
      <Stapel abstand={8}>
        <iframe src={blob} title={d.titel} style={{ width: '100%', height: '70vh', border: '1px solid var(--mm-border)', borderRadius: 5 }} />
        <Meta>Wird die Vorschau nicht angezeigt (z. B. am Handy), öffne die Datei über „Herunterladen“.</Meta>
      </Stapel>
    );
  if (art === 'audio')
    return (
      <Stapel abstand={8}>
        <audio controls src={d.url} style={{ width: '100%' }} />
        {d.art === 'sprache' && !d.text && <Meta>Kein Transkript – die Aufnahme ist nur als Audio gespeichert.</Meta>}
      </Stapel>
    );
  if (art === 'text') return null;
  return <Leer titel="Keine Vorschau möglich" text="Diese Datei kann der Browser nicht anzeigen. Lade sie herunter und öffne sie mit dem passenden Programm." icon="dokument" />;
}

export function DateiDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const d = db.dokumente.useOne(id);
  const download = useBlobUrl(d?.url);
  if (!d || d.geloeschtAm)
    return (
      <Seite titel="Datei nicht gefunden" zurueck={{ to: '/auftraege/dateien', label: 'Dateien' }}>
        <Leer titel="Diese Datei gibt es nicht (mehr)." text="Vielleicht liegt sie im Papierkorb." icon="dokument" />
      </Seite>
    );
  const zurueck = istDatei(d) ? { to: '/auftraege/dateien', label: 'Dateien' } : { to: '/auftraege/fotos', label: 'Fotos & Dokumentation' };
  const textBearbeitbar = d.art === 'notiz' || d.art === 'sprache';
  const loeschbar = d.art !== 'unterschrift';
  return (
    <Seite
      titel={d.titel}
      oberzeile={ART_LABEL[d.art] ?? 'Dokument'}
      status={
        <>
          {d.fuerKunde && <Status ton="aktiv" icon={false}>Für Kunden sichtbar</Status>} <BeispielMarke zeigen={d.beispiel} />
        </>
      }
      zurueck={zurueck}
      aktion={
        d.url ? (
          <a className="mm-btn mm-btn--sekundaer" href={download} download={d.titel}>
            <Icon name="download" />
            <span>Herunterladen</span>
          </a>
        ) : undefined
      }
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Vorschau d={d} />
            {textBearbeitbar ? (
              <Karte titel={d.art === 'sprache' ? 'Text zur Sprachnotiz' : 'Notiz'}>
                <Textfeld label="Text" rows={5} value={d.text ?? ''} onChange={(e) => db.dokumente.update(d.id, { text: e.target.value, tags: (d.tags ?? []).filter((t) => t !== 'Ohne Transkript') }, { leise: true })} />
              </Karte>
            ) : (
              d.text && (
                <Karte titel={d.art === 'unterschrift' ? 'Unterschrieben von' : 'Notiz'}>
                  <p>{d.text}</p>
                </Karte>
              )
            )}
            <Karte titel="Verlauf">
              <Zeitstrahl bezug={{ typ: 'dokumente', id: d.id }} />
            </Karte>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Angaben" kompakt>
              <Stapel abstand={16}>
                <Eingabe label="Titel" value={d.titel} onChange={(e) => db.dokumente.update(d.id, { titel: e.target.value }, { leise: true })} />
                <AuftragAuswahl label="Auftrag" optional nurOffene={false} wert={d.auftragId} onChange={(aid) => db.dokumente.update(d.id, { auftragId: aid || undefined }, { text: aid ? `Auftrag ${db.auftraege.get(aid)?.nummer ?? ''} zugeordnet` : 'Vom Auftrag gelöst' })} />
                <Schalter label="Für Kunden sichtbar" beschreibung="Erscheint im Kundenbereich des Kunden." checked={!!d.fuerKunde} onChange={(v) => db.dokumente.update(d.id, { fuerKunde: v }, { text: v ? 'Für Kunden freigegeben' : 'Für Kunden ausgeblendet' })} />
                <Meta>
                  {datum(d.erstelltAm)}, {uhrzeit(d.erstelltAm)}
                  {d.erstelltVon ? ` · ${personName(db.mitarbeiter.get(d.erstelltVon))}` : ''}
                  {d.groesse ? ` · ${groesseText(d.groesse)}` : ''}
                </Meta>
                {!!d.tags?.length && <Meta>Markiert: {d.tags.join(', ')}</Meta>}
              </Stapel>
            </Karte>
            {loeschbar && (
              <Button
                variante="tertiaer"
                icon="muell"
                onClick={async () => {
                  if (!(await fragen(`${ART_LABEL[d.art] ?? 'Dokument'} löschen?`, `„${d.titel}“ kommt in den Papierkorb und kann wiederhergestellt werden.`, 'Löschen'))) return;
                  db.dokumente.remove(d.id);
                  toast('Gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.dokumente.restore(d.id) } });
                  navigate(zurueck.to);
                }}
              >
                Löschen
              </Button>
            )}
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}

/** Tab „Dateien“ am Auftrag */
export function DateienTab({ id }: { id: ID }) {
  const [hoch, setHoch] = useState(false);
  const liste = db.dokumente.use((d) => d.auftragId === id && istDatei(d), [id]);
  return (
    <Stapel abstand={16}>
      <div>
        <Button icon="upload" onClick={() => setHoch(true)}>
          Dateien hochladen
        </Button>
      </div>
      <Liste leer={<Leer titel="Noch keine Dateien" text="Lade Pläne, Schaltpläne oder PDFs hoch – dann sind sie auf der Baustelle dabei." icon="ordner" />}>
        {[...liste]
          .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
          .map((d) => (
            <DateiZeile key={d.id} d={d} mitAuftrag={false} />
          ))}
      </Liste>
      <Dialog offen={hoch} onSchliessen={() => setHoch(false)} titel="Dateien hochladen">
        {hoch && <Hochladen auftragId={id} fertig={() => setHoch(false)} />}
      </Dialog>
    </Stapel>
  );
}
