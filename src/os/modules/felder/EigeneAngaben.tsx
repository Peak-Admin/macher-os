/**
 * Eigene Angaben am Objekt: Werte der eigenen Felder ansehen und eintragen, Formulare ausfüllen.
 * Hängt als Panel in den Detailansichten (Kunde, Ort, Anlage, Auftrag, Mitarbeiter, Termin) und bleibt
 * unsichtbar, solange es keine eigenen Felder oder Formulare gibt.
 */
import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import type { Bezug, ID, SammlungsName } from '@core/objects';
import {
  Auswahl,
  Button,
  Checkbox,
  DateiKnopf,
  Dialog,
  Eingabe,
  Karte,
  Liste,
  ListenZeile,
  Meta,
  Stapel,
  Status,
  Textfeld,
  UnterschriftFeld,
  Zeile,
  dateiLesen,
  zahlAlsEingabe,
  useToast,
} from '@ui/index';
import {
  DOKUMENT_TYPEN,
  eigeneFormulare,
  felderFuer,
  felderVonFormular,
  hatEigeneAngaben,
  objekteFuerSammlung,
  wertPruefen,
  wertText,
  wertVon,
  werteSpeichern,
  type FeldDefinition,
  type Formular,
} from './daten';

/** Eingabe für Datei-Felder, die erst beim Speichern als Dokument abgelegt wird */
interface NeueDatei {
  neu: { url: string; mime: string; name: string; bytes: number; art: 'foto' | 'datei' | 'unterschrift' };
}
type Eingaben = Record<ID, unknown>;

function startwerte(felder: FeldDefinition[], bezug: Bezug): Eingaben {
  return Object.fromEntries(
    felder.map((f) => {
      const w = wertVon(f.id, bezug)?.wert;
      if (f.typ === 'zahl' || f.typ === 'masseinheit') return [f.id, typeof w === 'number' ? zahlAlsEingabe(w) : ''];
      if (f.typ === 'janein') return [f.id, w === true];
      return [f.id, w ?? ''];
    }),
  );
}

/** Panel-Komponenten je Sammlung (Panels bekommen nur die ID) */
export const panelFuer = (sammlung: SammlungsName) =>
  function EigeneAngabenPanel({ id }: { id: ID }) {
    return <EigeneAngaben sammlung={sammlung} id={id} />;
  };

export function EigeneAngaben({ sammlung, id }: { sammlung: SammlungsName; id: ID }) {
  useDatenstand();
  const [offen, setOffen] = useState(false);
  const [formular, setFormular] = useState<Formular>();
  if (!hatEigeneAngaben(sammlung, id)) return null;
  const bezug: Bezug = { typ: sammlung, id };
  const arten = objekteFuerSammlung(sammlung, id);
  const gruppen = arten.map((o) => ({ o, felder: felderFuer(o.id) })).filter((g) => g.felder.length);
  const formulare = eigeneFormulare.all().filter((x) => arten.some((o) => o.id === x.objekt)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const alleFelder = gruppen.flatMap((g) => g.felder);
  const gefuellt = alleFelder.filter((f) => wertVon(f.id, bezug)).length;

  return (
    <Karte titel="Eigene Angaben" kompakt>
      <Stapel abstand={12}>
        {gruppen.map((g) => (
          <Stapel key={g.o.id} abstand={4}>
            {gruppen.length > 1 && <strong>{g.o.gruppe ?? g.o.label}</strong>}
            {g.felder.map((f) => (
              <WertZeile key={f.id} feld={f} bezug={bezug} />
            ))}
          </Stapel>
        ))}
        {alleFelder.length > 0 && (
          <div>
            <Button klein variante="sekundaer" icon="stift" onClick={() => setOffen(true)}>
              {gefuellt ? 'Angaben ändern' : 'Angaben eintragen'}
            </Button>
          </div>
        )}
        {formulare.length > 0 && (
          <Liste>
            {formulare.map((x) => {
              const felder = felderVonFormular(x.id);
              const n = felder.filter((f) => wertVon(f.id, bezug)).length;
              return (
                <ListenZeile
                  key={x.id}
                  titel={x.name}
                  untertitel={felder.length ? `${n} von ${felder.length} ausgefüllt` : 'Noch keine Felder'}
                  rechts={<Status ton={n && n === felder.length ? 'erfolg' : n ? 'aktiv' : 'neutral'}>{n && n === felder.length ? 'Ausgefüllt' : n ? 'Angefangen' : 'Offen'}</Status>}
                  onClick={felder.length ? () => setFormular(x) : undefined}
                />
              );
            })}
          </Liste>
        )}
      </Stapel>
      {offen && <AngabenDialog titel="Eigene Angaben" felder={alleFelder} bezug={bezug} onSchliessen={() => setOffen(false)} />}
      {formular && <AngabenDialog titel={formular.name} beschreibung={formular.beschreibung} formular={formular} felder={felderVonFormular(formular.id)} bezug={bezug} onSchliessen={() => setFormular(undefined)} />}
    </Karte>
  );
}

function WertZeile({ feld, bezug }: { feld: FeldDefinition; bezug: Bezug }) {
  const w = wertVon(feld.id, bezug)?.wert;
  const dok = DOKUMENT_TYPEN.includes(feld.typ) && w ? db.dokumente.get(String(w)) : undefined;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <Meta>{feld.label}</Meta>
      {dok?.url && feld.typ !== 'datei' ? (
        <img src={dok.url} alt={feld.label} style={{ maxWidth: 120, maxHeight: 64, borderRadius: 'var(--mm-radius-control)', border: '1px solid var(--mm-border)', background: 'var(--mm-surface)' }} />
      ) : dok?.url ? (
        <a href={dok.url} download={dok.titel}>
          {dok.titel}
        </a>
      ) : (
        <span>{w == null ? <Meta>–</Meta> : wertText(feld, w)}</span>
      )}
    </div>
  );
}

function AngabenDialog({
  titel,
  beschreibung,
  formular,
  felder,
  bezug,
  onSchliessen,
}: {
  titel: string;
  beschreibung?: string;
  formular?: Formular;
  felder: FeldDefinition[];
  bezug: Bezug;
  onSchliessen: () => void;
}) {
  const toast = useToast();
  const [eingaben, setEingaben] = useState<Eingaben>(() => startwerte(felder, bezug));
  const [fehler, setFehler] = useState<Record<ID, string>>({});
  const setze = (id: ID, v: unknown) => setEingaben((e) => ({ ...e, [id]: v }));

  const speichern = () => {
    // erst alles ohne neue Dateien prüfen – Dokumente werden nur angelegt, wenn der Rest stimmt
    const vorab: Record<ID, string> = {};
    for (const f of felder) {
      const v = eingaben[f.id];
      if (v && typeof v === 'object' && 'neu' in (v as object)) continue;
      if (DOKUMENT_TYPEN.includes(f.typ) && !v) {
        if (f.pflicht) vorab[f.id] = `${f.label} fehlt.`;
        continue;
      }
      const p = wertPruefen(f, v);
      if (!p.ok) vorab[f.id] = p.fehler;
    }
    if (Object.keys(vorab).length) return setFehler(vorab);
    const fertig: Eingaben = { ...eingaben };
    for (const f of felder) {
      const v = eingaben[f.id] as NeueDatei | undefined;
      if (v && typeof v === 'object' && 'neu' in v) {
        const d = db.dokumente.create({
          art: v.neu.art,
          titel: v.neu.art === 'unterschrift' ? `${f.label}: ${v.neu.name}` : v.neu.name || f.label,
          url: v.neu.url,
          mime: v.neu.mime,
          groesse: v.neu.bytes,
          bezug,
          auftragId: bezug.typ === 'auftraege' ? bezug.id : undefined,
          tags: [f.label],
        });
        fertig[f.id] = d.id;
      }
    }
    const f = werteSpeichern(bezug, fertig, { formular });
    if (Object.keys(f).length) return setFehler(f);
    toast(formular ? `${formular.name} gespeichert.` : 'Angaben gespeichert.');
    onSchliessen();
  };

  return (
    <Dialog
      offen
      titel={titel}
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Stapel>
        {beschreibung && <Meta>{beschreibung}</Meta>}
        {felder.map((f) => (
          <FeldEingabe key={f.id} feld={f} wert={eingaben[f.id]} fehler={fehler[f.id]} onWert={(v) => setze(f.id, v)} />
        ))}
      </Stapel>
    </Dialog>
  );
}

/** Eine Eingabe je Feldtyp – nur gemeinsame Bausteine aus `@ui` */
export function FeldEingabe({ feld: f, wert, fehler, onWert }: { feld: FeldDefinition; wert: unknown; fehler?: string; onWert: (v: unknown) => void }) {
  const [unterschreiben, setUnterschreiben] = useState(false);
  const optional = !f.pflicht;
  const text = typeof wert === 'string' ? wert : '';
  switch (f.typ) {
    case 'text':
      return text.length > 60 ? (
        <Textfeld label={f.label} hilfe={f.hilfe} fehler={fehler} optional={optional} value={text} onChange={(e) => onWert(e.target.value)} />
      ) : (
        <Eingabe label={f.label} hilfe={f.hilfe} fehler={fehler} optional={optional} value={text} onChange={(e) => onWert(e.target.value)} />
      );
    case 'zahl':
    case 'masseinheit':
      return (
        <Eingabe
          label={f.typ === 'masseinheit' && f.einheit ? `${f.label} (${f.einheit})` : f.label}
          hilfe={f.hilfe}
          fehler={fehler}
          optional={optional}
          inputMode="decimal"
          value={text}
          onChange={(e) => onWert(e.target.value)}
        />
      );
    case 'auswahl':
      return <Auswahl label={f.label} hilfe={f.hilfe} fehler={fehler} optional={optional} leer="Bitte wählen" value={text} optionen={(f.optionen ?? []).map((o) => ({ wert: o, label: o }))} onChange={(e) => onWert(e.target.value)} />;
    case 'janein':
      return <Checkbox label={f.label} checked={wert === true} onChange={onWert} />;
    case 'datum':
      return <Eingabe label={f.label} hilfe={f.hilfe} fehler={fehler} optional={optional} type="date" value={text} onChange={(e) => onWert(e.target.value)} />;
    case 'foto':
    case 'datei':
    case 'unterschrift': {
      const neu = wert && typeof wert === 'object' && 'neu' in (wert as object) ? (wert as NeueDatei).neu : undefined;
      const vorhanden = !neu && text ? db.dokumente.get(text) : undefined;
      const name = neu?.name ?? vorhanden?.titel;
      return (
        <div className="mm-feld">
          <span className="mm-label">
            {f.label}
            {optional && <span className="mm-label-optional"> (optional)</span>}
          </span>
          {unterschreiben ? (
            <UnterschriftFeld
              titel={f.label}
              onAbbrechen={() => setUnterschreiben(false)}
              onBestaetigt={(u) => {
                onWert({ neu: { url: u.bild, mime: 'image/png', name: u.name, bytes: u.bild.length, art: 'unterschrift' } } satisfies NeueDatei);
                setUnterschreiben(false);
              }}
            />
          ) : (
            <Zeile>
              {f.typ === 'unterschrift' ? (
                <Button klein variante="sekundaer" icon="unterschrift" onClick={() => setUnterschreiben(true)}>
                  {name ? 'Neu unterschreiben' : 'Unterschreiben'}
                </Button>
              ) : (
                <DateiKnopf
                  klein
                  kamera={f.typ === 'foto'}
                  accept={f.typ === 'foto' ? 'image/*' : undefined}
                  onDateien={async ([d]) => {
                    const g = await dateiLesen(d);
                    onWert({ neu: { url: g.url, mime: g.mime, name: g.name, bytes: g.bytes, art: f.typ === 'foto' ? 'foto' : 'datei' } } satisfies NeueDatei);
                  }}
                >
                  {name ? 'Andere wählen' : f.typ === 'foto' ? 'Foto aufnehmen' : 'Datei wählen'}
                </DateiKnopf>
              )}
              {name && <Meta>{name}</Meta>}
              {name && (
                <Button klein variante="tertiaer" onClick={() => onWert('')}>
                  Entfernen
                </Button>
              )}
            </Zeile>
          )}
          {f.hilfe && !fehler && <p className="mm-hilfe">{f.hilfe}</p>}
          {fehler && (
            <p className="mm-fehlertext" role="alert">
              {fehler}
            </p>
          )}
        </div>
      );
    }
  }
}
