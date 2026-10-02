import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { centAlsEingabe, centAus, euro } from '@core/format';
import type { Einheit, ID, Leistung } from '@core/objects';
import { useDarf } from '@core/session';
import {
  Auswahl,
  BeispielMarke,
  Button,
  Checkbox,
  Eingabe,
  FormRaster,
  IconButton,
  Karte,
  Kennzahl,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Raster,
  Schalter,
  Seite,
  Stapel,
  Textfeld,
  Zeile,
  useBestaetigen,
  useToast,
} from '@ui/index';
import { Zeitstrahl } from '@ui/objekt';
import { istBetrag, kategorienVon, lohnanteilJeStunde, materialEk } from './daten';

const EINHEITEN: Einheit[] = ['Stk', 'h', 'm', 'm²', 'm³', 'Psch', 'kg', 'l', 'Pkt', 'km'];

/** Anlegen (`/neu`) und Bearbeiten (`/:id`) einer Leistung */
export function LeistungForm() {
  const { id } = useParams();
  const neu = !id;
  const l = db.leistungen.useOne(id);
  if (!neu && (!l || l.geloeschtAm))
    return (
      <Seite titel="Leistung nicht gefunden" zurueck={{ to: '/betrieb/katalog/leistungen', label: 'Leistungen' }}>
        <Leer titel="Diese Leistung gibt es nicht (mehr)." text="Vielleicht liegt sie im Papierkorb." icon="liste" aktion={<Button to="/betrieb/einstellungen/papierkorb" variante="sekundaer">Papierkorb öffnen</Button>} />
      </Seite>
    );
  return <Formular key={id ?? 'neu'} leistung={l} />;
}

function Formular({ leistung }: { leistung?: Leistung }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigenDialog] = useBestaetigen();
  const geld = useDarf('geld');
  const darfLoeschen = useDarf('loeschen');
  const alle = db.leistungen.use();
  const artikel = db.artikel.use((a) => a.aktiv);
  const qualis = db.qualifikationen.use();
  const betrieb = db.betrieb.useOne('betrieb');
  const verwendet = db.angebote.use((a) => a.positionen.some((p) => p.leistungId === leistung?.id), [leistung?.id]).length
    + db.rechnungen.use((r) => r.positionen.some((p) => p.leistungId === leistung?.id), [leistung?.id]).length;

  const [f, setF] = useState({
    name: leistung?.name ?? '',
    beschreibung: leistung?.beschreibung ?? '',
    kategorie: leistung?.kategorie ?? '',
    einheit: leistung?.einheit ?? ('Stk' as Einheit),
    preis: centAlsEingabe(leistung?.preis),
    minuten: leistung?.minuten != null ? String(leistung.minuten) : '',
    aktiv: leistung?.aktiv ?? true,
    material: leistung?.material ?? [],
    qualifikationIds: leistung?.qualifikationIds ?? [],
  });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [neuArtikel, setNeuArtikel] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const vorschau: Leistung = {
    ...(leistung ?? { id: '', erstelltAm: '', geaendertAm: '' }),
    name: f.name,
    einheit: f.einheit,
    preis: istBetrag(f.preis) ? centAus(f.preis) : 0,
    minuten: Number(f.minuten) || undefined,
    material: f.material,
    aktiv: f.aktiv,
  };
  const artikelGet = (aid: ID) => db.artikel.get(aid);
  const lohnJeStunde = lohnanteilJeStunde(vorschau, artikelGet);
  const ek = materialEk(vorschau, artikelGet);

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Gib der Leistung einen Namen.';
    if (geld && !istBetrag(f.preis)) e.preis = 'Trage einen Preis ein, z. B. 69,00.';
    if (f.minuten && !/^\d+$/.test(f.minuten.trim())) e.minuten = 'Nur ganze Minuten, z. B. 35.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const daten = {
      name: f.name.trim(),
      beschreibung: f.beschreibung.trim() || undefined,
      kategorie: f.kategorie.trim() || undefined,
      einheit: f.einheit,
      ...(geld ? { preis: centAus(f.preis) } : {}),
      minuten: f.minuten ? Number(f.minuten) : undefined,
      aktiv: f.aktiv,
      material: f.material.length ? f.material : undefined,
      qualifikationIds: f.qualifikationIds.length ? f.qualifikationIds : undefined,
    };
    if (leistung) {
      db.leistungen.update(leistung.id, daten);
      toast('Leistung gespeichert.');
    } else {
      const n = db.leistungen.create({ preis: 0, ...daten });
      toast('Leistung angelegt.');
      navigate(`/betrieb/katalog/leistungen/${n.id}`, { replace: true });
    }
  };

  const loeschen = async () => {
    if (!leistung) return;
    const ok = await fragen('Leistung löschen?', `„${leistung.name}“ kommt in den Papierkorb. Bestehende Angebote und Rechnungen bleiben unverändert.`, 'In den Papierkorb');
    if (!ok) return;
    db.leistungen.remove(leistung.id);
    toast('Leistung liegt im Papierkorb.', { aktion: { label: 'Rückgängig', onClick: () => db.leistungen.restore(leistung.id) } });
    navigate('/betrieb/katalog/leistungen');
  };

  return (
    <Seite
      titel={leistung ? leistung.name : 'Leistung anlegen'}
      oberzeile={leistung?.kategorie}
      status={<BeispielMarke zeigen={leistung?.beispiel} />}
      zurueck={{ to: '/betrieb/katalog/leistungen', label: 'Leistungen' }}
    >
      <Stapel abstand={24}>
        {leistung && geld && (
          <Raster min={200}>
            <Kennzahl label="Preis" wert={`${euro(leistung.preis)} / ${leistung.einheit}`} />
            <Kennzahl
              label="Bringt je Arbeitsstunde"
              wert={lohnJeStunde != null ? euro(lohnJeStunde) : '–'}
              hinweis={lohnJeStunde == null ? 'Minuten eintragen' : ek ? 'nach Abzug Material-EK' : undefined}
              ton={lohnJeStunde != null && betrieb && lohnJeStunde < betrieb.stundensatz ? 'achtung' : undefined}
            />
            <Kennzahl label="Verwendet" wert={verwendet ? `${verwendet}×` : 'Noch nicht'} hinweis="in Angeboten und Rechnungen" />
          </Raster>
        )}
        {geld && lohnJeStunde != null && betrieb && lohnJeStunde < betrieb.stundensatz && (
          <Meldung ton="achtung" titel="Diese Leistung liegt unter deinem Stundensatz">
            Sie bringt {euro(lohnJeStunde)} je Stunde, dein Stundensatz ist {euro(betrieb.stundensatz)}. Prüfe Preis oder Minuten.
          </Meldung>
        )}
        <Karte>
          <form
            className="mm-stapel"
            style={{ gap: 24 }}
            onSubmit={(e) => {
              e.preventDefault();
              speichern();
            }}
          >
            <FormRaster>
              <Eingabe label="Name" value={f.name} onChange={(e) => set('name', e.target.value)} fehler={fehler.name} autoFocus={!leistung} />
              <Eingabe label="Kategorie" value={f.kategorie} onChange={(e) => set('kategorie', e.target.value)} optional list="leistung-kategorien" hilfe="z. B. Installation, Wartung, Lohn" />
              <Auswahl label="Einheit" value={f.einheit} onChange={(e) => set('einheit', e.target.value as Einheit)} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />
              {geld ? (
                <Eingabe label={`Preis netto je ${f.einheit} (€)`} inputMode="decimal" value={f.preis} onChange={(e) => set('preis', e.target.value)} fehler={fehler.preis} placeholder="0,00" />
              ) : (
                <Meldung>Preise siehst du nur mit dem Recht „Preise & Geld“.</Meldung>
              )}
              <Eingabe label={`Arbeitszeit je ${f.einheit} (Minuten)`} inputMode="numeric" value={f.minuten} onChange={(e) => set('minuten', e.target.value)} fehler={fehler.minuten} optional hilfe="Grundlage für Planung und Kalkulation" />
            </FormRaster>
            <datalist id="leistung-kategorien">
              {kategorienVon(alle).filter((k) => k !== 'Ohne Kategorie').map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <Textfeld label="Beschreibung" value={f.beschreibung} onChange={(e) => set('beschreibung', e.target.value)} optional hilfe="Erscheint als Langtext in Angeboten." />

            <Stapel abstand={8}>
              <strong>Typisches Material</strong>
              <Meta>Wird beim Kalkulieren mit vorgeschlagen.</Meta>
              {f.material.length > 0 && (
                <Liste>
                  {f.material.map((m, i) => {
                    const a = db.artikel.get(m.artikelId);
                    return (
                      <ListenZeile
                        key={m.artikelId}
                        titel={a?.name ?? 'Artikel nicht mehr vorhanden'}
                        untertitel={geld && a ? `EK ${euro(a.ek)} / ${a.einheit}` : a?.einheit}
                        rechts={
                          <Zeile abstand={8} umbruch={false}>
                            <input
                              className="mm-input"
                              style={{ width: 88 }}
                              inputMode="decimal"
                              aria-label={`Menge ${a?.name ?? ''}`}
                              value={String(m.menge).replace('.', ',')}
                              onChange={(e) => {
                                const n = Number(e.target.value.replace(',', '.'));
                                set('material', f.material.map((x, j) => (j === i ? { ...x, menge: Number.isFinite(n) ? n : x.menge } : x)));
                              }}
                            />
                            <IconButton icon="x" label="Material entfernen" onClick={() => set('material', f.material.filter((_, j) => j !== i))} />
                          </Zeile>
                        }
                      />
                    );
                  })}
                </Liste>
              )}
              {artikel.length ? (
                <Auswahl
                  label="Material hinzufügen"
                  value={neuArtikel}
                  leer="Artikel wählen"
                  onChange={(e) => {
                    const aid = e.target.value;
                    setNeuArtikel('');
                    if (aid && !f.material.some((m) => m.artikelId === aid)) set('material', [...f.material, { artikelId: aid, menge: 1 }]);
                  }}
                  optionen={artikel.filter((a) => !f.material.some((m) => m.artikelId === a.id)).map((a) => ({ wert: a.id, label: `${a.name} (${a.einheit})` }))}
                />
              ) : (
                <Meta>Noch keine Artikel angelegt.</Meta>
              )}
              {geld && ek > 0 && <Meta>Material-EK je {f.einheit}: {euro(ek)}</Meta>}
            </Stapel>

            <Stapel abstand={8}>
              <strong>Nötige Qualifikation</strong>
              <Meta>Die Planung schlägt dann nur passende Leute vor.</Meta>
              {qualis.length ? (
                qualis.map((q) => (
                  <Checkbox
                    key={q.id}
                    label={q.name}
                    checked={f.qualifikationIds.includes(q.id)}
                    onChange={(an) => set('qualifikationIds', an ? [...f.qualifikationIds, q.id] : f.qualifikationIds.filter((x) => x !== q.id))}
                  />
                ))
              ) : (
                <Meta>Noch keine Qualifikationen angelegt.</Meta>
              )}
            </Stapel>

            <Schalter label="Aktiv" beschreibung="Inaktive Leistungen werden in Angeboten nicht mehr vorgeschlagen." checked={f.aktiv} onChange={(v) => set('aktiv', v)} />

            <Zeile zwischen>
              <Button type="submit">{leistung ? 'Änderungen speichern' : 'Leistung speichern'}</Button>
              {leistung && darfLoeschen && (
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Löschen
                </Button>
              )}
            </Zeile>
          </form>
        </Karte>
        {leistung && (
          <Karte titel="Verlauf">
            <Zeitstrahl bezug={{ typ: 'leistungen', id: leistung.id }} max={8} />
          </Karte>
        )}
      </Stapel>
      {bestaetigenDialog}
    </Seite>
  );
}
