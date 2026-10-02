/**
 * Das zweispaltige Home-Raster. Bänder aus `baender()`: kleine Widgets in zwei Spalten, große über die volle Breite.
 * Im Bearbeiten-Modus legt der Editor um jedes Widget seine Werkzeugleiste (`umhuellen`) und markiert Spalten als Ablageflächen.
 */
import type { ReactNode } from 'react';
import type { Mitarbeiter } from '@core/objects';
import { baender } from './layout';
import { WidgetRahmen } from './Rahmen';
import type { HomeLayout, Spalte, WidgetDefinition, WidgetEintrag } from './typen';

export interface RasterProps {
  layout: HomeLayout;
  defs: WidgetDefinition[];
  ich: Mitarbeiter;
  bearbeiten?: boolean;
  umhuellen?: (e: WidgetEintrag, def: WidgetDefinition, widget: ReactNode) => ReactNode;
  leer?: ReactNode;
}

export function HomeRaster({ layout, defs, ich, bearbeiten, umhuellen, leer }: RasterProps) {
  const defVon = new Map(defs.map((d) => [d.id, d]));
  const zeigen = (e: WidgetEintrag) => {
    const def = defVon.get(e.widgetId);
    if (!def) return null;
    const W = def.component;
    const widget = (
      <WidgetRahmen def={def}>
        <W groesse={e.size} ich={ich} />
      </WidgetRahmen>
    );
    return (
      <div key={e.widgetId} className="mm-home-zelle" data-home-widget={e.widgetId} data-spalte={e.size === 'klein' ? e.spalte : undefined}>
        {umhuellen ? umhuellen(e, def, widget) : widget}
      </div>
    );
  };
  const ausgeblendet = (e: WidgetEintrag) => !bearbeiten && !!defVon.get(e.widgetId)?.verbergen?.(ich);
  const liste = baender(layout.widgets.some(ausgeblendet) ? { ...layout, widgets: layout.widgets.filter((e) => !ausgeblendet(e)) } : layout);
  if (!liste.length) return <>{leer}</>;
  return (
    <div className={`mm-home-raster${bearbeiten ? ' mm-home-raster--bearbeiten' : ''}`}>
      {liste.map((b) => {
        if (b.typ === 'breit')
          return (
            <div key={`b:${b.eintrag.widgetId}`} className="mm-home-band mm-home-band--breit">
              {zeigen(b.eintrag)}
            </div>
          );
        const eine = !bearbeiten && (!b.links.length || !b.rechts.length);
        const spalte = (s: Spalte, liste: WidgetEintrag[]) =>
          liste.length || bearbeiten ? (
            <div className={`mm-home-spalte mm-home-spalte--${s}${liste.length ? '' : ' mm-home-spalte--leer'}`} data-home-zone="" data-spalte={s} data-nach={b.letzte}>
              {liste.map(zeigen)}
              {bearbeiten && !liste.length && <p className="mm-home-ablage">Widget hierher ziehen</p>}
            </div>
          ) : null;
        return (
          <div key={`s:${[...b.links, ...b.rechts][0].widgetId}`} className={`mm-home-band${eine ? ' mm-home-band--eine' : ''}`}>
            {spalte('links', b.links)}
            {spalte('rechts', b.rechts)}
          </div>
        );
      })}
    </div>
  );
}
