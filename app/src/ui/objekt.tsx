/**
 * Bausteine für Objekt-Detailansichten: Tabs aus allen Modulen, Zeitstrahl,
 * Auswahlfelder für Kernobjekte. Module verwenden diese, statt eigene zu bauen.
 */
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { db, zeitstrahl, useDatenstand } from '@core/db';
import { panelsFuer, pfadZu, tabsFuer } from '@core/modul';
import { datum, personName, relativ, uhrzeit } from '@core/format';
import type { Bezug, ID, ObjektTyp } from '@core/objects';
import { Auswahl, Leer, Liste, ListenZeile, Meta, Tabs } from './index';

/** Tabs, die andere Module in diese Detailansicht einhängen. `eigene` kommen zuerst. */
export function ObjektTabs({ objekt, id, eigene = [] }: { objekt: ObjektTyp; id: ID; eigene?: { id: string; titel: string; inhalt: ReactNode; zaehler?: number }[] }) {
  useDatenstand();
  const fremde = tabsFuer(objekt).filter((t) => !t.sichtbar || t.sichtbar(id));
  const alle = [
    ...eigene.map((e) => ({ id: e.id, titel: e.titel, zaehler: e.zaehler, render: () => e.inhalt })),
    ...fremde.map((t) => ({ id: t.titel, titel: t.titel, zaehler: t.zaehler?.(id), render: () => <t.component id={id} /> })),
  ];
  const [aktiv, setAktiv] = useState(alle[0]?.id ?? '');
  const tab = alle.find((t) => t.id === aktiv) ?? alle[0];
  if (!tab) return null;
  return (
    <div className="mm-stapel" style={{ gap: 16 }}>
      <Tabs tabs={alle.map(({ id: i, titel, zaehler }) => ({ id: i, titel, zaehler }))} aktiv={tab.id} onWechsel={setAktiv} />
      <div role="tabpanel">{tab.render()}</div>
    </div>
  );
}

/** Kontextblöcke, die Module in die Seitenspalte einer Detailansicht einhängen */
export function ObjektPanels({ objekt, id }: { objekt: ObjektTyp; id: ID }) {
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
  const auftraege = db.auftraege.use((a) => !nurOffene || !['erledigt', 'verloren'].includes(a.phase), [nurOffene]);
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
