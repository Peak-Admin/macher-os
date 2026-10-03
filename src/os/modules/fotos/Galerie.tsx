/** Galerie mit Vollbild, Tab „Fotos“ am Auftrag und Liste der Notizen/Sprachnotizen. */
import { useState } from 'react';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, relativ, uhrzeit } from '@core/format';
import type { Dokument, ID } from '@core/objects';
import {
  BeispielMarke,
  Button,
  Dialog,
  Filter,
  IconButton,
  Leer,
  Liste,
  ListenZeile,
  Meta,
  Segmente,
  Stapel,
  Status,
  TypIcon,
  Zeile,
  useToast,
} from '@ui/index';
import { Person } from '@ui/person';
import { FOTO_TAG_ICON, FOTO_TAGS, fotosGefiltert, istFoto, istNotizOderSprache } from './daten';
import { FotoErfassen, NotizErfassen, SpracheErfassen } from './Erfassen';

export function Vorschaubild({ d, groesse, onClick }: { d: Dokument; groesse?: number; onClick?: () => void }) {
  const bild = (
    <img
      src={d.url}
      alt={d.text || d.titel}
      loading="lazy"
      style={{ width: groesse ?? '100%', height: groesse, aspectRatio: '1', objectFit: 'cover', borderRadius: 5, display: 'block', background: 'var(--mm-canvas)' }}
    />
  );
  if (!onClick) return bild;
  return (
    <button type="button" onClick={onClick} aria-label={`${d.titel} groß anzeigen`} style={{ padding: 0, border: 0, background: 'none', cursor: 'zoom-in', position: 'relative', display: 'block', width: '100%' }}>
      {bild}
      {!!d.tags?.length && (
        <span style={{ position: 'absolute', left: 4, bottom: 4 }}>
          <Status ton={d.tags.includes('Mangel') ? 'achtung' : 'neutral'} icon={false}>
            {d.tags.join(', ')}
          </Status>
        </span>
      )}
    </button>
  );
}

/** Raster aus Vorschaubildern; Klick öffnet Vollbild mit Blättern */
export function Galerie({ fotos, mitAuftrag }: { fotos: Dokument[]; mitAuftrag?: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const aktuell = index != null ? fotos[index] : undefined;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 45%), 1fr))', gap: 8 }}>
        {fotos.map((f, i) => (
          <Vorschaubild key={f.id} d={f} onClick={() => setIndex(i)} />
        ))}
      </div>
      {aktuell && (
        <Vollbild
          d={aktuell}
          mitAuftrag={mitAuftrag}
          position={`${index! + 1} von ${fotos.length}`}
          zurueck={index! > 0 ? () => setIndex(index! - 1) : undefined}
          weiter={index! < fotos.length - 1 ? () => setIndex(index! + 1) : undefined}
          schliessen={() => setIndex(null)}
        />
      )}
    </>
  );
}

function Vollbild({ d, position, zurueck, weiter, schliessen, mitAuftrag }: { d: Dokument; position: string; zurueck?: () => void; weiter?: () => void; schliessen: () => void; mitAuftrag?: boolean }) {
  const toast = useToast();
  const auftrag = db.auftraege.get(d.auftragId);
  const tag = d.tags?.find((t) => (FOTO_TAGS as readonly string[]).includes(t)) ?? '';
  const loeschen = () => {
    db.dokumente.remove(d.id);
    schliessen();
    toast('Foto gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.dokumente.restore(d.id) } });
  };
  return (
    <Dialog
      offen
      breit
      titel={d.titel}
      onSchliessen={schliessen}
      aktionen={
        <>
          <Button variante="tertiaer" icon="muell" onClick={loeschen}>
            Löschen
          </Button>
          <Button variante="sekundaer" to={pfadZu({ typ: 'dokumente', id: d.id })}>
            Details
          </Button>
        </>
      }
    >
      <Stapel abstand={12}>
        <img src={d.url} alt={d.text || d.titel} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', background: 'var(--mm-dark)', borderRadius: 5, display: 'block' }} />
        <Zeile zwischen umbruch={false}>
          <IconButton icon="zurueck" label="Vorheriges Foto" onClick={zurueck} disabled={!zurueck} />
          <Meta>{position}</Meta>
          <IconButton icon="weiter" label="Nächstes Foto" onClick={weiter} disabled={!weiter} />
        </Zeile>
        <Segmente
          label="Art des Fotos"
          wert={tag}
          optionen={[{ wert: '', label: 'Ohne', icon: FOTO_TAG_ICON[''] }, ...FOTO_TAGS.map((t) => ({ wert: t, label: t, icon: FOTO_TAG_ICON[t] }))]}
          onChange={(t) => db.dokumente.update(d.id, { tags: [...(d.tags ?? []).filter((x) => !(FOTO_TAGS as readonly string[]).includes(x)), ...(t ? [t] : [])] })}
        />
        {d.text && <p>{d.text}</p>}
        <Meta>
          {datum(d.erstelltAm)}, {uhrzeit(d.erstelltAm)}
          {d.erstelltVon && (
            <>
              {' · '}
              <Person m={d.erstelltVon} groesse={20} />
            </>
          )}
          {mitAuftrag && auftrag ? ` · ${auftrag.nummer} ${auftrag.titel}` : ''}
          <BeispielMarke zeigen={d.beispiel} />
        </Meta>
      </Stapel>
    </Dialog>
  );
}

/** Notizen und Sprachnotizen als Liste */
export function NotizListe({ eintraege, mitAuftrag }: { eintraege: Dokument[]; mitAuftrag?: boolean }) {
  return (
    <Liste>
      {eintraege.map((d) => {
        const a = mitAuftrag ? db.auftraege.get(d.auftragId) : undefined;
        return (
          <ListenZeile
            key={d.id}
            to={pfadZu({ typ: 'dokumente', id: d.id })}
            links={d.art === 'sprache' ? <TypIcon name="mikro" label="Sprachnotiz" ton="lila" /> : <TypIcon name="notiz" label="Notiz" ton="sand" />}
            titel={
              <>
                {d.titel} <BeispielMarke zeigen={d.beispiel} />
              </>
            }
            untertitel={
              <>
                {relativ(d.erstelltAm)}, {uhrzeit(d.erstelltAm)}
                {d.erstelltVon && (
                  <>
                    {' · '}
                    <Person m={d.erstelltVon} groesse={20} />
                  </>
                )}
                {a ? ` · ${a.nummer}` : ''}
              </>
            }
            rechts={
              d.art === 'sprache' ? (
                <Status icon={false}>{d.text ? 'Sprachnotiz' : 'Sprachnotiz, nur Audio'}</Status>
              ) : (
                <Status icon={false}>Notiz</Status>
              )
            }
          />
        );
      })}
    </Liste>
  );
}

type Erfassung = 'foto' | 'sprache' | 'notiz' | null;

/** Erfassen-Leiste + Dialog (für Tab am Auftrag und Übersicht) */
export function ErfassenLeiste({ auftragId }: { auftragId?: ID }) {
  const [offen, setOffen] = useState<Erfassung>(null);
  const titel = offen === 'foto' ? 'Foto aufnehmen' : offen === 'sprache' ? 'Sprachnotiz aufnehmen' : 'Notiz schreiben';
  const zu = () => setOffen(null);
  return (
    <>
      <Zeile>
        <Button icon="kamera" onClick={() => setOffen('foto')}>
          Foto aufnehmen
        </Button>
        <Button variante="sekundaer" icon="mikro" onClick={() => setOffen('sprache')}>
          Sprachnotiz
        </Button>
        <Button variante="sekundaer" icon="notiz" onClick={() => setOffen('notiz')}>
          Notiz
        </Button>
      </Zeile>
      <Dialog offen={!!offen} onSchliessen={zu} titel={titel} icon={offen === 'foto' ? 'kamera' : offen === 'sprache' ? 'mikro' : 'notiz'}>
        {offen === 'foto' && <FotoErfassen fertig={zu} auftragId={auftragId} />}
        {offen === 'sprache' && <SpracheErfassen fertig={zu} auftragId={auftragId} />}
        {offen === 'notiz' && <NotizErfassen fertig={zu} auftragId={auftragId} />}
      </Dialog>
    </>
  );
}

/** Tab „Fotos“ in der Auftragsakte */
export function FotosTab({ id }: { id: ID }) {
  const [tag, setTag] = useState('');
  const doku = db.dokumente.use((d) => d.auftragId === id, [id]);
  const fotos = fotosGefiltert(doku, tag);
  const alleFotos = doku.filter(istFoto);
  const notizen = doku.filter(istNotizOderSprache).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  return (
    <Stapel abstand={16}>
      <ErfassenLeiste auftragId={id} />
      {alleFotos.length > 0 && (
        <Filter
          label="Fotos filtern"
          wert={tag}
          onChange={setTag}
          optionen={[{ wert: '', label: 'Alle', zaehler: alleFotos.length }, ...FOTO_TAGS.map((t) => ({ wert: t, label: t, zaehler: alleFotos.filter((f) => f.tags?.includes(t)).length }))]}
        />
      )}
      {fotos.length ? (
        <Galerie fotos={fotos} />
      ) : alleFotos.length ? (
        <Leer titel={`Keine Fotos mit „${tag}“`} text="Wähle einen anderen Filter oder markiere Fotos in der Vollbildansicht." icon="kamera" />
      ) : (
        <Leer skizze titel="Noch keine Fotos" text="Mach Vorher-Fotos, bevor du anfängst – das spart später Diskussionen." icon="kamera" />
      )}
      {notizen.length > 0 && (
        <Stapel abstand={8}>
          <h3>Notizen und Sprachnotizen</h3>
          <NotizListe eintraege={notizen} />
        </Stapel>
      )}
    </Stapel>
  );
}
