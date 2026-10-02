/**
 * Bausteine für Objekt-Detailansichten: Tabs aus allen Modulen, Zeitstrahl,
 * Auswahlfelder für Kernobjekte. Module verwenden diese, statt eigene zu bauen.
 */
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, zeitstrahl, useDatenstand } from '@core/db';
import { panelsFuer, pfadZu, tabsFuer } from '@core/modul';
import { datum, personName, relativ, uhrzeit } from '@core/format';
import type { Bezug, ID, SammlungsName } from '@core/objects';
import { Auswahl, Leer, Liste, ListenZeile, Meta, Tabs } from './index';

/**
 * Tabs, die andere Module in diese Detailansicht einhängen, gemischt mit eigenen Tabs.
 * Reihenfolge nach `gewicht` (eigene ohne Gewicht: 100 = vorn; `ende: true` = ganz hinten, z. B. Verlauf).
 * Starttab per URL `?tab=<titel oder id>`.
 */
export function ObjektTabs({
  objekt,
  id,
  eigene = [],
}: {
  objekt: SammlungsName;
  id: ID;
  eigene?: { id: string; titel: string; inhalt: ReactNode; zaehler?: number; gewicht?: number; ende?: boolean }[];
}) {
  useDatenstand();
  const [params, setParams] = useSearchParams();
  const fremde = tabsFuer(objekt).filter((t) => !t.sichtbar || t.sichtbar(id));
  const alle = [
    ...eigene.map((e) => ({ id: e.id, titel: e.titel, zaehler: e.zaehler, gewicht: e.ende ? -1 : (e.gewicht ?? 100), render: () => e.inhalt })),
    ...fremde.map((t) => ({ id: t.titel, titel: t.titel, zaehler: t.zaehler?.(id), gewicht: t.gewicht ?? 50, render: () => <t.component id={id} /> })),
  ].sort((a, b) => b.gewicht - a.gewicht);
  const [aktiv, setAktiv] = useState(() => {
    const wunsch = params.get('tab');
    return alle.find((t) => t.id === wunsch || t.titel === wunsch)?.id ?? alle[0]?.id ?? '';
  });
  const tab = alle.find((t) => t.id === aktiv) ?? alle[0];
  if (!tab) return null;
  return (
    <div className="mm-stapel" style={{ gap: 16 }}>
      <Tabs
        tabs={alle.map(({ id: i, titel, zaehler }) => ({ id: i, titel, zaehler }))}
        aktiv={tab.id}
        onWechsel={(t) => {
          setAktiv(t);
          const p = new URLSearchParams(params);
          p.set('tab', t);
          setParams(p, { replace: true });
        }}
      />
      <div role="tabpanel">{tab.render()}</div>
    </div>
  );
}

/** Kontextblöcke, die Module in die Seitenspalte einer Detailansicht einhängen */
export function ObjektPanels({ objekt, id }: { objekt: SammlungsName; id: ID }) {
  useDatenstand();
  return (
    <>
      {panelsFuer(objekt).map((p, i) => (
        <p.component key={i} id={id} />
      ))}
    </>
  );
}

/** Zeitstrahl eines Objekts – was ist wann passiert */
export function Zeitstrahl({ bezug, max = 20 }: { bezug: Bezug; max?: number }) {
  useDatenstand();
  const eintraege = zeitstrahl(bezug).slice(0, max);
  if (!eintraege.length) return <Leer titel="Noch nichts passiert" text="Änderungen erscheinen hier automatisch." icon="uhr" />;
  return (
    <Liste>
      {eintraege.map((e) => (
        <ListenZeile
          key={e.id}
          titel={e.text}
          untertitel={`${relativ(e.erstelltAm)}, ${uhrzeit(e.erstelltAm)}${e.vonMitarbeiterId ? ' · ' + personName(db.mitarbeiter.get(e.vonMitarbeiterId)) : ''}`}
        />
      ))}
    </Liste>
  );
}

/** Link zu einem beliebigen Objekt (Detailansicht kommt vom besitzenden Modul) */
export function ObjektLink({ bezug, children }: { bezug: Bezug; children: ReactNode }) {
  const p = pfadZu(bezug);
  return p ? <Link to={p}>{children}</Link> : <>{children}</>;
}

// ------------------------------------------------------------------ Auswahlfelder für Kernobjekte

export function KundeAuswahl({ wert, onChange, label = 'Kunde', optional }: { wert?: ID; onChange: (id: ID) => void; label?: string; optional?: boolean }) {
  const kunden = db.kunden.use();
  return (
    <Auswahl
      label={label}
      optional={optional}
      value={wert ?? ''}
      leer="Kunde wählen"
      onChange={(e) => onChange(e.target.value)}
      optionen={[...kunden].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((k) => ({ wert: k.id, label: k.name }))}
    />
  );
}

export function OrtAuswahl({ kundeId, wert, onChange, label = 'Einsatzort', optional }: { kundeId?: ID; wert?: ID; onChange: (id: ID) => void; label?: string; optional?: boolean }) {
  const orte = db.orte.use((o) => !kundeId || o.kundeId === kundeId, [kundeId]);
  return (
    <Auswahl
      label={label}
      optional={optional}
      value={wert ?? ''}
      leer={orte.length ? 'Ort wählen' : 'Noch kein Ort beim Kunden'}
      onChange={(e) => onChange(e.target.value)}
      optionen={orte.map((o) => ({ wert: o.id, label: `${o.bezeichnung} – ${o.adresse.strasse}, ${o.adresse.ort}` }))}
    />
  );
}

export function MitarbeiterAuswahl({ wert, onChange, label = 'Mitarbeiter', optional, nurAktive = true }: { wert?: ID; onChange: (id: ID) => void; label?: string; optional?: boolean; nurAktive?: boolean }) {
  const ma = db.mitarbeiter.use((m) => !nurAktive || m.aktiv, [nurAktive]);
  return (
    <Auswahl
      label={label}
      optional={optional}
      value={wert ?? ''}
      leer="Niemand"
      onChange={(e) => onChange(e.target.value)}
      optionen={ma.map((m) => ({ wert: m.id, label: personName(m) }))}
    />
  );
}

export function AuftragAuswahl({ wert, onChange, label = 'Auftrag', optional, nurOffene = true }: { wert?: ID; onChange: (id: ID) => void; label?: string; optional?: boolean; nurOffene?: boolean }) {
  // der gewählte Auftrag bleibt immer in der Liste, auch wenn er schon erledigt ist
  const auftraege = db.auftraege.use((a) => !nurOffene || a.id === wert || !['erledigt', 'verloren'].includes(a.phase), [nurOffene, wert]);
  return (
    <Auswahl
      label={label}
      optional={optional}
      value={wert ?? ''}
      leer="Ohne Auftrag"
      onChange={(e) => onChange(e.target.value)}
      optionen={auftraege.map((a) => ({ wert: a.id, label: `${a.nummer} · ${a.titel} (${db.kunden.get(a.kundeId)?.name ?? ''})` }))}
    />
  );
}

/** Kompakte Zeile: Kunde · Ort · Datum */
export function AuftragKurz({ id }: { id: ID }) {
  const a = db.auftraege.useOne(id);
  if (!a) return null;
  const k = db.kunden.get(a.kundeId);
  const o = db.orte.get(a.ortId);
  return (
    <Meta>
      {a.nummer} · {k?.name}
      {o ? ` · ${o.adresse.ort}` : ''} · seit {datum(a.erstelltAm)}
    </Meta>
  );
}
