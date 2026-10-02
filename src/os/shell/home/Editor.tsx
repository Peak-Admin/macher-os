/**
 * „Home anpassen“: visueller Editor direkt auf dem echten Home.
 * - Ziehen am Griff (Maus, Finger, Stift) – die Seite ordnet sich beim Ziehen live neu an.
 * - Aus der Widget-Bibliothek ins Raster ziehen oder „Hinzufügen“ tippen.
 * - Größe: Klein (eine Spalte) oder Groß (volle Breite). Ausblenden mit einem Tipp.
 * - Ohne Maus: Griff fokussieren, Pfeil hoch/runter verschiebt, Pfeil links/rechts wechselt die Spalte.
 * Jede Änderung wird sofort für diesen Nutzer gespeichert.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { Mitarbeiter } from '@core/objects';
import { AktionsMenue, Button, Dialog, Icon, IconButton, Status, Suchfeld, useBestaetigen, type MenueAktion } from '@ui/index';
import { passt } from '@core/format';
import { groesseSetzen, kannSchritt, schritt, sichtbarSetzen, spalteSetzen, verschieben, type Ziel } from './layout';
import { homeMessen } from './messen';
import { HomeRaster } from './Raster';
import { KATEGORIE_TITEL, type HomeLayout, type WidgetDefinition, type WidgetEintrag, type WidgetKategorie } from './typen';

interface Zug {
  id: string;
  ausBibliothek: boolean;
  x: number;
  y: number;
  /** erst ab ein paar Pixeln Bewegung wird gezogen (sonst Klick) */
  aktiv: boolean;
  startX: number;
  startY: number;
  ziel?: Ziel;
}

const SCHWELLE = 6;

/** Ablageziel unter dem Zeiger bestimmen */
function zielAn(x: number, y: number, ziehtId: string): Ziel | undefined | 'gleich' {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const w = el.closest<HTMLElement>('[data-home-widget]');
  if (w) {
    const id = w.dataset.homeWidget!;
    if (id === ziehtId) return 'gleich';
    const r = w.getBoundingClientRect();
    const spalte = (w.dataset.spalte as Ziel['spalte']) || undefined;
    return y < r.top + r.height / 2 ? { vor: id, spalte } : { nach: id, spalte };
  }
  const zone = el.closest<HTMLElement>('[data-home-zone]');
  if (zone) return { nach: zone.dataset.nach || undefined, spalte: (zone.dataset.spalte as Ziel['spalte']) || 'links' };
  return undefined;
}

function fokusAufGriff(id: string) {
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-griff="${CSS.escape(id)}"]`)?.focus());
}

export function HomeEditor({
  layout,
  defs,
  ich,
  speichern,
  zuruecksetzen,
  fertig,
}: {
  layout: HomeLayout;
  defs: WidgetDefinition[];
  ich: Mitarbeiter;
  speichern: (l: HomeLayout) => void;
  zuruecksetzen: () => void;
  fertig: () => void;
}) {
  const [zug, setZug] = useState<Zug | null>(null);
  const [ansage, setAnsage] = useState('');
  const [bibliothekOffen, setBibliothekOffen] = useState(false);
  const [fragen, bestaetigung] = useBestaetigen();
  const zugRef = useRef<Zug | null>(null);
  const layoutRef = useRef(layout);
  useLayoutEffect(() => {
    zugRef.current = zug;
    layoutRef.current = layout;
  });
  const name = (id: string) => defs.find((d) => d.id === id)?.name ?? id;

  // Vorschau während des Ziehens: so sähe das Home nach dem Loslassen aus
  const vorschau = zug?.aktiv && zug.ziel ? verschieben(layout, zug.id, zug.ziel) : layout;

  const aendern = (neu: HomeLayout, text: string, ereignis?: Parameters<typeof homeMessen>[0], id?: string) => {
    speichern(neu);
    setAnsage(text);
    if (ereignis) homeMessen(ereignis, id ? { widget: id } : undefined);
  };

  // Zeiger-Ereignisse während eines Zugs global verfolgen
  useEffect(() => {
    if (!zug) return;
    const bewegen = (e: PointerEvent) => {
      const z = zugRef.current;
      if (!z) return;
      const aktiv = z.aktiv || Math.hypot(e.clientX - z.startX, e.clientY - z.startY) > SCHWELLE;
      if (!aktiv) return;
      e.preventDefault();
      const t = zielAn(e.clientX, e.clientY, z.id);
      const ziel = t === 'gleich' ? z.ziel : t ?? z.ziel;
      if (e.clientY < 72) window.scrollBy(0, -16);
      else if (e.clientY > window.innerHeight - 72) window.scrollBy(0, 16);
      setZug({ ...z, aktiv: true, x: e.clientX, y: e.clientY, ziel });
    };
    const loslassen = () => {
      const z = zugRef.current;
      setZug(null);
      if (!z || !z.aktiv) return;
      if (!z.ziel) {
        setAnsage('Abgebrochen. Nichts verschoben.');
        return;
      }
      const neu = verschieben(layoutRef.current, z.id, z.ziel);
      aendern(neu, `${name(z.id)} ${z.ausBibliothek ? 'hinzugefügt' : 'verschoben'}.`, z.ausBibliothek ? 'home_widget_shown' : 'home_widget_reordered', z.id);
    };
    const abbrechen = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZug(null);
        setAnsage('Abgebrochen. Nichts verschoben.');
      }
    };
    const verloren = () => setZug(null);
    window.addEventListener('pointermove', bewegen, { passive: false });
    window.addEventListener('pointerup', loslassen);
    window.addEventListener('pointercancel', verloren);
    window.addEventListener('keydown', abbrechen);
    return () => {
      window.removeEventListener('pointermove', bewegen);
      window.removeEventListener('pointerup', loslassen);
      window.removeEventListener('pointercancel', verloren);
      window.removeEventListener('keydown', abbrechen);
    };
    // nur beim Start/Ende eines Zugs neu anmelden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!zug]);

  const greifen = (id: string, ausBibliothek: boolean) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button:not([data-griff]), a, input, textarea')) return;
    e.preventDefault();
    setZug({ id, ausBibliothek, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, aktiv: false });
  };

  const tasten = (e: WidgetEintrag) => (k: ReactKeyboardEvent) => {
    let neu: HomeLayout | undefined;
    let text = '';
    if (k.key === 'ArrowUp' && kannSchritt(layout, e.widgetId, -1)) [neu, text] = [schritt(layout, e.widgetId, -1), 'nach oben'];
    else if (k.key === 'ArrowDown' && kannSchritt(layout, e.widgetId, 1)) [neu, text] = [schritt(layout, e.widgetId, 1), 'nach unten'];
    else if (k.key === 'ArrowLeft' && e.size === 'klein' && e.spalte === 'rechts') [neu, text] = [spalteSetzen(layout, e.widgetId, 'links'), 'in die linke Spalte'];
    else if (k.key === 'ArrowRight' && e.size === 'klein' && e.spalte === 'links') [neu, text] = [spalteSetzen(layout, e.widgetId, 'rechts'), 'in die rechte Spalte'];
    if (!neu) return;
    k.preventDefault();
    aendern(neu, `${name(e.widgetId)} ${text} verschoben.`, 'home_widget_reordered', e.widgetId);
    fokusAufGriff(e.widgetId);
  };

  const ausblenden = (id: string) => aendern(sichtbarSetzen(layout, id, false), `${name(id)} ausgeblendet.`, 'home_widget_hidden', id);
  const einblenden = (id: string) => aendern(sichtbarSetzen(layout, id, true), `${name(id)} hinzugefügt – ganz unten.`, 'home_widget_shown', id);

  const umhuellen = (e: WidgetEintrag, def: WidgetDefinition, widget: ReactNode) => {
    const zieht = zug?.aktiv && zug.id === e.widgetId;
    const menue: MenueAktion[] = [
      ...(kannSchritt(layout, e.widgetId, -1) ? [{ label: 'Nach oben', onClick: () => aendern(schritt(layout, e.widgetId, -1), `${def.name} nach oben verschoben.`, 'home_widget_reordered', e.widgetId) }] : []),
      ...(kannSchritt(layout, e.widgetId, 1) ? [{ label: 'Nach unten', onClick: () => aendern(schritt(layout, e.widgetId, 1), `${def.name} nach unten verschoben.`, 'home_widget_reordered', e.widgetId) }] : []),
      ...(e.size === 'klein'
        ? [
            {
              label: e.spalte === 'links' ? 'In die rechte Spalte' : 'In die linke Spalte',
              onClick: () => aendern(spalteSetzen(layout, e.widgetId, e.spalte === 'links' ? 'rechts' : 'links'), `${def.name} in die andere Spalte verschoben.`, 'home_widget_reordered', e.widgetId),
            },
          ]
        : []),
    ];
    return (
      <div className={`mm-home-bearbeiten${zieht ? ' mm-home-bearbeiten--zieht' : ''}`}>
        <div className="mm-home-werkzeug">
          <button
            type="button"
            className="mm-home-griff"
            data-griff={e.widgetId}
            aria-label={`${def.name} verschieben`}
            aria-describedby="mm-home-griff-hilfe"
            onPointerDown={greifen(e.widgetId, false)}
            onKeyDown={tasten(e)}
          >
            <Icon name="menue" size={18} />
          </button>
          <span className="mm-home-werkzeug-titel">{def.name}</span>
          {def.availableSizes.length > 1 && (
            <div className="mm-home-groesse" role="group" aria-label={`Größe von ${def.name}`}>
              {(['klein', 'gross'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={e.size === g}
                  onClick={() => {
                    if (e.size === g) return;
                    aendern(groesseSetzen(layout, e.widgetId, g, defs), `${def.name}: ${g === 'gross' ? 'Groß – volle Breite' : 'Klein – eine Spalte'}.`, 'home_widget_resized', e.widgetId);
                  }}
                >
                  {g === 'gross' ? 'Groß' : 'Klein'}
                </button>
              ))}
            </div>
          )}
          {menue.length > 0 && <AktionsMenue klein label="Mehr" aktionen={menue} />}
          <IconButton icon="x" label={`${def.name} ausblenden`} onClick={() => ausblenden(e.widgetId)} />
        </div>
        <div className="mm-home-vorschau" inert>
          {widget}
        </div>
      </div>
    );
  };

  const sichtbar = layout.widgets.filter((w) => w.visible).length;
  const gezogen = zug?.aktiv ? defs.find((d) => d.id === zug.id) : undefined;
  const bibliothek = (ziehbar: boolean) => (
    <Bibliothek
      layout={layout}
      defs={defs}
      onHinzufuegen={(id) => {
        einblenden(id);
        setBibliothekOffen(false);
      }}
      onAusblenden={ausblenden}
      greifen={ziehbar ? (id) => greifen(id, true) : undefined}
      zieht={zug?.aktiv ? zug.id : undefined}
    />
  );

  return (
    <div className={`mm-home-editor${zug?.aktiv ? ' mm-home-editor--zieht' : ''}`}>
      <div className="mm-home-editor-leiste">
        <div>
          <h2 className="mm-home-editor-titel">Home anpassen</h2>
          <p className="mm-meta" id="mm-home-griff-hilfe">
            Zieh ein Widget am Griff <Icon name="menue" size={14} aria-hidden /> an seinen Platz. Mit der Tastatur: Pfeiltasten. Klein = eine Spalte, Groß = volle Breite.
          </p>
        </div>
        <div className="mm-home-editor-aktionen">
          <Button variante="sekundaer" klein icon="plus" className="mm-home-nur-schmal" onClick={() => setBibliothekOffen(true)}>
            Widget hinzufügen
          </Button>
          <Button
            variante="tertiaer"
            klein
            icon="wiederholen"
            onClick={async () => {
              if (await fragen('Standard wiederherstellen?', 'Dein Home bekommt wieder die vier Standard-Widgets. Deine Anpassungen gehen verloren.', 'Wiederherstellen')) {
                zuruecksetzen();
                setAnsage('Standard wiederhergestellt.');
                homeMessen('home_layout_reset');
              }
            }}
          >
            Standard wiederherstellen
          </Button>
          <Button onClick={fertig} icon="check">
            Fertig
          </Button>
        </div>
      </div>

      <div className="mm-home-editor-flaeche">
        <div className="mm-home-editor-raster">
          <HomeRaster
            layout={vorschau}
            defs={defs}
            ich={ich}
            bearbeiten
            umhuellen={umhuellen}
            leer={
              <div className="mm-home-spalte mm-home-spalte--leer mm-home-leeres-home" data-home-zone="" data-spalte="links">
                <p className="mm-home-ablage">Dein Home ist leer. Zieh ein Widget hierher oder tippe bei einem Widget auf „Hinzufügen“.</p>
              </div>
            }
          />
          <p className="mm-meta">
            {sichtbar === 1 ? '1 Widget' : `${sichtbar} Widgets`} auf deinem Home. Tipp: Weniger ist mehr – vier Widgets reichen den meisten.
          </p>
        </div>
        <aside className="mm-home-bibliothek mm-home-nur-breit" aria-label="Widget-Bibliothek">
          {bibliothek(true)}
        </aside>
      </div>

      <Dialog offen={bibliothekOffen} onSchliessen={() => setBibliothekOffen(false)} titel="Widget hinzufügen">
        {bibliothek(false)}
      </Dialog>

      {gezogen && zug && (
        <div className="mm-home-geist" style={{ transform: `translate(${zug.x + 12}px, ${zug.y + 12}px)` }} aria-hidden>
          <Icon name={gezogen.icon} size={18} />
          {gezogen.name}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {ansage}
      </p>
      {bestaetigung}
    </div>
  );
}

function Bibliothek({
  layout,
  defs,
  onHinzufuegen,
  onAusblenden,
  greifen,
  zieht,
}: {
  layout: HomeLayout;
  defs: WidgetDefinition[];
  onHinzufuegen: (id: string) => void;
  onAusblenden: (id: string) => void;
  /** nur in der Seitenleiste: Ziehen ins Raster (aus einem Dialog heraus geht das nicht) */
  greifen?: (id: string) => (e: ReactPointerEvent) => void;
  zieht?: string;
}) {
  const [q, setQ] = useState('');
  const sichtbar = new Set(layout.widgets.filter((w) => w.visible).map((w) => w.widgetId));
  const treffer = defs.filter((d) => passt(q, d.name, d.description, KATEGORIE_TITEL[d.kategorie]));
  const gruppen = (Object.keys(KATEGORIE_TITEL) as WidgetKategorie[]).map((k) => ({ k, liste: treffer.filter((d) => d.kategorie === k) })).filter((g) => g.liste.length);
  return (
    <div className="mm-home-bibliothek-inhalt">
      <div>
        <h3 className="mm-home-bibliothek-titel">Widget-Bibliothek</h3>
        <p className="mm-meta">
          {defs.length} Widgets für dich · {sichtbar.size} auf deinem Home
        </p>
      </div>
      <Suchfeld wert={q} onChange={setQ} platzhalter="Widget finden, z. B. Rechnungen" />
      {!gruppen.length && <p className="mm-meta">Kein Widget passt zu „{q}“.</p>}
      {gruppen.map(({ k, liste }) => (
        <section key={k} className="mm-home-bibliothek-gruppe" aria-label={KATEGORIE_TITEL[k]}>
          <p className="mm-oberzeile">{KATEGORIE_TITEL[k]}</p>
          <ul>
            {liste.map((d) => {
              const an = sichtbar.has(d.id);
              return (
                <li
                  key={d.id}
                  className={`mm-home-bibliothek-eintrag${an ? ' mm-home-bibliothek-eintrag--an' : ''}${!an && greifen ? ' mm-home-bibliothek-eintrag--ziehbar' : ''}${zieht === d.id ? ' mm-home-bibliothek-eintrag--zieht' : ''}`}
                  onPointerDown={an || !greifen ? undefined : greifen(d.id)}
                >
                  <span className="mm-home-kachel mm-home-kachel--klein" aria-hidden>
                    <Icon name={d.icon} size={18} />
                  </span>
                  <span className="mm-home-bibliothek-text">
                    <span className="mm-home-bibliothek-name">{d.name}</span>
                    <span className="mm-meta">{d.description}</span>
                    {an && <Status ton="erfolg">Auf deinem Home</Status>}
                  </span>
                  {an ? (
                    <Button variante="tertiaer" klein onClick={() => onAusblenden(d.id)} aria-label={`${d.name} vom Home nehmen`}>
                      Ausblenden
                    </Button>
                  ) : (
                    <Button variante="sekundaer" klein icon="plus" onClick={() => onHinzufuegen(d.id)} aria-label={`${d.name} hinzufügen`}>
                      Hinzufügen
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
