import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { GEWERKE, gewerkVorlage } from '@core/gewerke';
import type { Gewerk, ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, IconButton, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Textfeld, Zeile, useToast } from '@ui/index';
import { bildVerkleinern } from '@modules/vorlagen/bild';
import { KATEGORIEN, istSichererLink, wissen, type WissensArtikel } from './daten';

export function WissenBearbeiten() {
  const { id } = useParams();
  const a = wissen.useOne(id);
  if (id && (!a || a.geloeschtAm))
    return (
      <Seite titel="Anleitung nicht gefunden" zurueck={{ to: '/betrieb/wissen', label: 'Wissen' }}>
        <Leer titel="Diese Anleitung gibt es nicht (mehr)." icon="wissen" />
      </Seite>
    );
  return <Formular key={id ?? 'neu'} artikel={a} />;
}

function Formular({ artikel }: { artikel?: WissensArtikel }) {
  const navigate = useNavigate();
  const toast = useToast();
  const schreiben = useDarf('schreiben');
  const betrieb = db.betrieb.useOne('betrieb');
  const leistungen = db.leistungen.use((l) => l.aktiv);
  const anlagen = db.anlagen.use();
  const alleArtikel = wissen.use();
  const datei = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    titel: artikel?.titel ?? '',
    kategorie: artikel?.kategorie ?? '',
    text: artikel?.text ?? '',
    gewerk: artikel ? (artikel.gewerk ?? '') : (betrieb?.gewerk ?? ''),
    anlagentypen: artikel?.anlagentypen ?? [],
    leistungIds: artikel?.leistungIds ?? [],
    links: artikel?.links ?? [],
    fotoIds: artikel?.fotoIds ?? [],
  });
  const [link, setLink] = useState({ titel: '', url: '' });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [laedt, setLaedt] = useState(false);
  const zurueck = artikel ? { to: `/betrieb/wissen/${artikel.id}`, label: artikel.titel } : { to: '/betrieb/wissen', label: 'Wissen' };

  const typen = [...new Set([...gewerkVorlage((f.gewerk || betrieb?.gewerk || 'sonstiges') as Gewerk).anlagentypen, ...anlagen.map((x) => x.typ), ...f.anlagentypen])].sort((a, b) => a.localeCompare(b, 'de'));
  const kategorien = [...new Set([...KATEGORIEN, ...alleArtikel.map((x) => x.kategorie)])];

  if (!schreiben)
    return (
      <Seite titel="Anleitung bearbeiten" zurueck={zurueck}>
        <Meldung ton="achtung">Dafür brauchst du das Recht „Bearbeiten“.</Meldung>
      </Seite>
    );

  const fotoHinzufuegen = async (dateien: FileList | null) => {
    if (!dateien?.length) return;
    setLaedt(true);
    try {
      const ids: ID[] = [];
      for (const d of Array.from(dateien)) {
        const url = await bildVerkleinern(d, 1600, 1600);
        const doc = db.dokumente.create({ art: 'foto', titel: d.name, url, mime: url.slice(5, url.indexOf(';')), groesse: Math.round((url.length * 3) / 4), tags: ['wissen'] });
        ids.push(doc.id);
      }
      setF((x) => ({ ...x, fotoIds: [...x.fotoIds, ...ids] }));
      toast(ids.length === 1 ? 'Foto hinzugefügt.' : `${ids.length} Fotos hinzugefügt.`);
    } catch (e) {
      setFehler({ ...fehler, foto: e instanceof Error ? e.message : 'Foto konnte nicht gespeichert werden.' });
    } finally {
      setLaedt(false);
      if (datei.current) datei.current.value = '';
    }
  };

  const linkHinzufuegen = () => {
    if (!istSichererLink(link.url)) return setFehler({ ...fehler, link: 'Gib eine Adresse mit https:// ein.' });
    setF({ ...f, links: [...f.links, { titel: link.titel.trim() || link.url.trim(), url: link.url.trim() }] });
    setLink({ titel: '', url: '' });
    setFehler({ ...fehler, link: '' });
  };

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.titel.trim()) e.titel = 'Gib der Anleitung einen Titel.';
    if (!f.kategorie.trim()) e.kategorie = 'Wähle oder schreib eine Kategorie.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const daten = {
      titel: f.titel.trim(),
      kategorie: f.kategorie.trim(),
      text: f.text,
      gewerk: (f.gewerk || undefined) as Gewerk | undefined,
      anlagentypen: f.anlagentypen.length ? f.anlagentypen : undefined,
      leistungIds: f.leistungIds.length ? f.leistungIds : undefined,
      links: f.links.length ? f.links : undefined,
      fotoIds: f.fotoIds.length ? f.fotoIds : undefined,
    };
    if (artikel) {
      wissen.update(artikel.id, daten);
      toast('Anleitung gespeichert.');
      navigate(`/betrieb/wissen/${artikel.id}`);
    } else {
      const n = wissen.create(daten);
      toast('Anleitung angelegt.');
      navigate(`/betrieb/wissen/${n.id}`, { replace: true });
    }
  };

  return (
    <Seite titel={artikel ? 'Anleitung bearbeiten' : 'Anleitung schreiben'} zurueck={zurueck}>
      <form
        className="mm-stapel"
        style={{ gap: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <Karte>
          <Stapel>
            <FormRaster>
              <Eingabe label="Titel" value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} fehler={fehler.titel} placeholder="z. B. Ablauf Wartung Gas-Brennwert" autoFocus={!artikel} />
              <Eingabe label="Kategorie" value={f.kategorie} onChange={(e) => setF({ ...f, kategorie: e.target.value })} fehler={fehler.kategorie} list="wissen-kategorien" />
            </FormRaster>
            <datalist id="wissen-kategorien">
              {kategorien.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <Textfeld
              label="Text"
              rows={16}
              value={f.text}
              onChange={(e) => setF({ ...f, text: e.target.value })}
              hilfe="# Überschrift · ## Zwischenüberschrift · - Punkt · 1. Schritt · **fett** · Leerzeile = neuer Absatz"
            />
          </Stapel>
        </Karte>

        <Karte titel="Fotos">
          <Stapel>
            {f.fotoIds.length > 0 && (
              <Raster min={140}>
                {f.fotoIds.map((fid) => {
                  const d = db.dokumente.get(fid);
                  return (
                    <div key={fid} className="mm-stapel" style={{ gap: 4 }}>
                      {d?.url ? <img src={d.url} alt={d.titel} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 'var(--mm-radius-card)' }} /> : <Meta>Foto fehlt</Meta>}
                      <Button variante="tertiaer" klein icon="x" onClick={() => setF({ ...f, fotoIds: f.fotoIds.filter((x) => x !== fid) })}>
                        Entfernen
                      </Button>
                    </div>
                  );
                })}
              </Raster>
            )}
            <input ref={datei} type="file" accept="image/*" multiple hidden onChange={(e) => fotoHinzufuegen(e.target.files)} />
            {fehler.foto && <Meldung ton="achtung">{fehler.foto}</Meldung>}
            <div>
              <Button variante="sekundaer" icon="kamera" laedt={laedt} laedtText="Wird verkleinert …" onClick={() => datei.current?.click()}>
                Foto hinzufügen
              </Button>
            </div>
          </Stapel>
        </Karte>

        <Karte titel="Verknüpfen" oberzeile="Damit Macher die Anleitung am passenden Auftrag vorschlägt">
          <Stapel abstand={24}>
            <Auswahl
              label="Gewerk"
              value={f.gewerk}
              leer="Alle Gewerke"
              onChange={(e) => setF({ ...f, gewerk: e.target.value })}
              optionen={GEWERKE.map((g) => ({ wert: g.id, label: g.label }))}
            />
            <Stapel abstand={8}>
              <strong>Anlagentypen</strong>
              {typen.map((t) => (
                <Checkbox key={t} label={t} checked={f.anlagentypen.includes(t)} onChange={(an) => setF({ ...f, anlagentypen: an ? [...f.anlagentypen, t] : f.anlagentypen.filter((x) => x !== t) })} />
              ))}
            </Stapel>
            <Stapel abstand={8}>
              <strong>Leistungen</strong>
              {f.leistungIds.length > 0 && (
                <Liste>
                  {f.leistungIds.map((lid) => (
                    <ListenZeile key={lid} titel={db.leistungen.get(lid)?.name ?? 'Leistung gelöscht'} rechts={<IconButton icon="x" label="Verknüpfung entfernen" onClick={() => setF({ ...f, leistungIds: f.leistungIds.filter((x) => x !== lid) })} />} />
                  ))}
                </Liste>
              )}
              {leistungen.length ? (
                <Auswahl
                  label="Leistung verknüpfen"
                  value=""
                  leer="Leistung wählen"
                  onChange={(e) => e.target.value && setF({ ...f, leistungIds: [...f.leistungIds, e.target.value] })}
                  optionen={leistungen.filter((l) => !f.leistungIds.includes(l.id)).map((l) => ({ wert: l.id, label: l.name }))}
                />
              ) : (
                <Meta>Noch keine Leistungen angelegt.</Meta>
              )}
            </Stapel>
          </Stapel>
        </Karte>

        <Karte titel="Herstellerlinks">
          <Stapel>
            {f.links.length > 0 && (
              <Liste>
                {f.links.map((l, i) => (
                  <ListenZeile key={l.url + i} titel={l.titel} untertitel={l.url} rechts={<IconButton icon="x" label="Link entfernen" onClick={() => setF({ ...f, links: f.links.filter((_, j) => j !== i) })} />} />
                ))}
              </Liste>
            )}
            <FormRaster>
              <Eingabe label="Bezeichnung" optional value={link.titel} onChange={(e) => setLink({ ...link, titel: e.target.value })} placeholder="z. B. Wartungsanleitung" />
              <Eingabe label="Adresse" type="url" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="https://" fehler={fehler.link || undefined} />
            </FormRaster>
            <div>
              <Button variante="sekundaer" icon="link" onClick={linkHinzufuegen} disabled={!link.url.trim()}>
                Link hinzufügen
              </Button>
            </div>
          </Stapel>
        </Karte>

        <Zeile>
          <Button type="submit">{artikel ? 'Änderungen speichern' : 'Anleitung speichern'}</Button>
          <Button variante="tertiaer" to={zurueck.to}>
            Abbrechen
          </Button>
        </Zeile>
      </form>
    </Seite>
  );
}
