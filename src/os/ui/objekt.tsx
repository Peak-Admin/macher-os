/**
 * Bausteine für Objekt-Detailansichten: Tabs aus allen Modulen, Zeitstrahl,
 * Auswahlfelder für Kernobjekte. Module verwenden diese, statt eigene zu bauen.
 */
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, zeitstrahl, useDatenstand } from '@core/db';
import { panelsFuer, pfadZu, schnellAktion, tabsFuer } from '@core/modul';
import { oeffne } from '@core/overlay';
import { datum, personName, relativ, uhrzeit } from '@core/format';
import type { Bezug, ID, SammlungsName } from '@core/objects';
import { Auswahl, Button, Filter, Leer, Liste, ListenZeile, Meta, Tabs, type ButtonProps, type MenueAktion } from './index';

/**
 * Lokale Bereiche je Objekttyp: höchstens vier Bereiche, darin höchstens vier Teile,
 * darin – falls nötig – eine Auswahl der Art (statt immer weiterer Tabs).
 * Tabs werden über ihren Titel (fremde Tabs) oder ihre id (eigene Tabs) zugeordnet.
 * Nicht zugeordnete Tabs landen im Teil mit `rest: true` – nie in einem fünften Bereich.
 */
interface TeilDef {
  titel: string;
  tabs: string[];
  rest?: boolean;
}
interface BereichDef {
  id: string;
  titel: string;
  teile: TeilDef[];
}

export const OBJEKT_BEREICHE: Partial<Record<SammlungsName, BereichDef[]>> = {
  auftraege: [
    { id: 'ueberblick', titel: 'Überblick', teile: [{ titel: 'Überblick', tabs: ['ueberblick'] }, { titel: 'Termine', tabs: ['Termine'] }, { titel: 'Anlagen', tabs: ['Anlagen'] }] },
    {
      id: 'arbeit',
      titel: 'Arbeit',
      teile: [
        { titel: 'Aufgaben & Checklisten', tabs: ['Aufgaben & Checklisten'] },
        { titel: 'Zeit', tabs: ['zeiten'] },
        { titel: 'Material', tabs: ['Material'] },
        { titel: 'Weiteres', tabs: ['Arbeitsanweisung', 'Zusatzleistungen', 'Abnahme', 'Wartung', 'Reklamationen', 'Subunternehmer', 'Anleitungen'], rest: true },
      ],
    },
    {
      id: 'unterlagen',
      titel: 'Unterlagen',
      teile: [
        { titel: 'Fotos', tabs: ['Fotos'] },
        { titel: 'Dokumente', tabs: ['Dateien', 'Berichte'] },
        { titel: 'Aufmaß', tabs: ['Aufmaß'] },
        { titel: 'Angebote & Rechnungen', tabs: ['Angebote', 'Rechnungen', 'Kalkulation', 'Kosten', 'Belege'] },
      ],
    },
    { id: 'verlauf', titel: 'Verlauf', teile: [{ titel: 'Verlauf', tabs: ['Nachrichten', 'verlauf'] }] },
  ],
  kunden: [
    { id: 'auftraege', titel: 'Aufträge', teile: [{ titel: 'Aufträge', tabs: ['auftraege'] }] },
    { id: 'kontakt', titel: 'Kontakt & Orte', teile: [{ titel: 'Ansprechpartner', tabs: ['Ansprechpartner'] }, { titel: 'Orte', tabs: ['Orte'] }, { titel: 'Anlagen', tabs: ['Anlagen'] }, { titel: 'Weiteres', tabs: [], rest: true }] },
    { id: 'geld', titel: 'Angebote & Rechnungen', teile: [{ titel: 'Angebote', tabs: ['Angebote'] }, { titel: 'Rechnungen', tabs: ['Rechnungen'] }] },
    { id: 'verlauf', titel: 'Verlauf', teile: [{ titel: 'Nachrichten', tabs: ['Nachrichten'] }, { titel: 'Verlauf', tabs: ['Verlauf'] }] },
  ],
  mitarbeiter: [
    { id: 'zeiten', titel: 'Zeiten & Abwesenheit', teile: [{ titel: 'Zeiten', tabs: ['Zeiten'] }, { titel: 'Abwesenheiten', tabs: ['Abwesenheiten'] }] },
    {
      id: 'lernen',
      titel: 'Lernen & Nachweise',
      teile: [{ titel: 'Qualifikationen', tabs: ['Qualifikationen'] }, { titel: 'Unterweisungen', tabs: ['Unterweisungen'] }, { titel: 'Schulungen', tabs: ['Schulungen'] }, { titel: 'Einarbeitung', tabs: ['Einarbeitung'], rest: true }],
    },
  ],
};

interface TabEintrag {
  id: string;
  titel: string;
  zaehler?: number;
  render: () => ReactNode;
}
interface Teil {
  titel: string;
  tabs: TabEintrag[];
}
interface Bereich {
  id: string;
  titel: string;
  teile: Teil[];
}

/** Ordnet Tabs den (höchstens vier) Bereichen zu. Exportiert für Tests. */
export function bereicheBilden(objekt: SammlungsName, alle: TabEintrag[]): Bereich[] {
  const def = OBJEKT_BEREICHE[objekt];
  if (!def) {
    if (alle.length <= 4) return alle.map((t) => ({ id: t.id, titel: t.titel, teile: [{ titel: t.titel, tabs: [t] }] }));
    // Ohne Festlegung: drei Bereiche einzeln, der Rest gesammelt unter „Mehr“ (Auswahl statt fünftem Tab)
    return [...alle.slice(0, 3).map((t) => ({ id: t.id, titel: t.titel, teile: [{ titel: t.titel, tabs: [t] }] })), { id: 'mehr', titel: 'Mehr', teile: [{ titel: 'Mehr', tabs: alle.slice(3) }] }];
  }
  const vergeben = new Set<string>();
  const finde = (namen: string[]) =>
    namen.flatMap((n) => {
      const t = alle.find((x) => (x.id === n || x.titel === n) && !vergeben.has(x.id));
      if (!t) return [];
      vergeben.add(t.id);
      return [t];
    });
  const bereiche = def.map((b) => ({ id: b.id, titel: b.titel, teile: b.teile.map((t) => ({ titel: t.titel, rest: t.rest, tabs: finde(t.tabs) })) }));
  const uebrig = alle.filter((t) => !vergeben.has(t.id));
  const restTeil = bereiche.flatMap((b) => b.teile).find((t) => t.rest) ?? bereiche[bereiche.length - 1].teile[0];
  restTeil.tabs.push(...uebrig);
  return bereiche.map((b) => ({ id: b.id, titel: b.titel, teile: b.teile.filter((t) => t.tabs.length).map(({ titel, tabs }) => ({ titel, tabs })) })).filter((b) => b.teile.length);
}

/**
 * Tabs, die andere Module in diese Detailansicht einhängen, gemischt mit eigenen Tabs –
 * gebündelt zu höchstens vier lokalen Bereichen (siehe `OBJEKT_BEREICHE`).
 * Reihenfolge nach `gewicht` (eigene ohne Gewicht: 100 = vorn; `ende: true` = ganz hinten, z. B. Verlauf).
 * Starttab per URL `?tab=<titel oder id>` (alte Links bleiben gültig).
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
  const bereiche = bereicheBilden(objekt, alle);
  const [aktiv, setAktiv] = useState(() => {
    const wunsch = params.get('tab');
    return alle.find((t) => t.id === wunsch || t.titel === wunsch)?.id ?? bereiche.find((b) => b.id === wunsch)?.teile[0].tabs[0].id ?? bereiche[0]?.teile[0].tabs[0].id ?? '';
  });
  const bereich = bereiche.find((b) => b.teile.some((t) => t.tabs.some((x) => x.id === aktiv))) ?? bereiche[0];
  if (!bereich) return null;
  const teil = bereich.teile.find((t) => t.tabs.some((x) => x.id === aktiv)) ?? bereich.teile[0];
  const tab = teil.tabs.find((x) => x.id === aktiv) ?? teil.tabs[0];
  const waehle = (tabId: string) => {
    setAktiv(tabId);
    const p = new URLSearchParams(params);
    p.set('tab', tabId);
    setParams(p, { replace: true });
  };
  const summe = (b: Bereich) => b.teile.flatMap((t) => t.tabs).reduce<number | undefined>((s, t) => (t.zaehler ? (s ?? 0) + t.zaehler : s), undefined);
  return (
    <div className="mm-stapel" style={{ gap: 16 }}>
      {bereiche.length > 1 && (
        <Tabs
          tabs={bereiche.map((b) => ({ id: b.id, titel: b.titel, zaehler: b.teile.length === 1 && b.teile[0].tabs.length === 1 ? b.teile[0].tabs[0].zaehler : summe(b) }))}
          aktiv={bereich.id}
          onWechsel={(bid) => waehle(bereiche.find((b) => b.id === bid)!.teile[0].tabs[0].id)}
        />
      )}
      {bereich.teile.length > 1 && (
        <Filter
          label={bereich.titel}
          wert={teil.titel}
          onChange={(t) => waehle(bereich.teile.find((x) => x.titel === t)!.tabs[0].id)}
          optionen={bereich.teile.map((t) => ({ wert: t.titel, label: t.titel }))}
        />
      )}
      {teil.tabs.length > 1 && (
        <div style={{ maxWidth: 360 }}>
          <Auswahl label={teil.titel} value={tab.id} onChange={(e) => waehle(e.target.value)} optionen={teil.tabs.map((t) => ({ wert: t.id, label: t.zaehler ? `${t.titel} (${t.zaehler})` : t.titel }))} />
        </div>
      )}
      <div role="tabpanel" aria-label={tab.titel} className="mm-objekt-bereich">
        {tab.render()}
      </div>
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

/** Beschriftung kontextueller Erfassungsaktionen – konkrete Verben statt „Neu“ oder „+“ */
export const ERFASSEN_TITEL: Record<string, string> = {
  foto: 'Foto hinzufügen',
  notiz: 'Notiz schreiben',
  sprachnotiz: 'Notiz sprechen',
  zeit: 'Zeit erfassen',
  material: 'Material buchen',
  aufgabe: 'Aufgabe hinzufügen',
  zusatzleistung: 'Zusatzleistung erfassen',
  mangel: 'Mangel melden',
  beleg: 'Beleg fotografieren',
  anruf: 'Anruf notieren',
  abwesenheit: 'Urlaub oder krank melden',
  'defekt-melden': 'Defekt melden',
};

/** Öffnet direkt das passende Erfassungsformular – mit bereits bekanntem Auftrag */
export function erfassen(aktion: string, auftragId?: ID) {
  oeffne('schnell', { aktion, auftragId });
}

/** Knopf für eine konkrete Erfassung im Arbeitskontext; erscheint nur, wenn ein Modul sie anbietet */
export function ErfassenKnopf({ aktion, auftragId, label, ...rest }: { aktion: string; auftragId?: ID; label?: string } & Omit<ButtonProps, 'onClick'>) {
  const a = schnellAktion(aktion);
  if (!a) return null;
  return (
    <Button variante="sekundaer" icon={a.icon} {...rest} onClick={() => erfassen(aktion, auftragId)}>
      {label ?? ERFASSEN_TITEL[aktion] ?? a.label}
    </Button>
  );
}

/** Eintrag für „Weitere Aktionen“, nur wenn die Erfassung angeboten wird */
export function erfassenAktion(aktion: string, auftragId?: ID): MenueAktion[] {
  const a = schnellAktion(aktion);
  return a ? [{ label: ERFASSEN_TITEL[aktion] ?? a.label, icon: a.icon, onClick: () => erfassen(aktion, auftragId) }] : [];
}
