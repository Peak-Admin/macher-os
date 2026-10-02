/**
 * Die Zielstruktur von Macher OS – an genau einer Stelle.
 *
 *   Heute · Aufträge · Planen · Betrieb
 *
 * Jede Ebene hat höchstens vier gleichrangige Ziele. Module hängen sich nicht mehr selbst in eine Navigation,
 * sondern werden hier einem Ort zugeordnet:
 * - als `ansicht` (sichtbar im Wechsler eines Ziels, höchstens vier je Ziel) oder
 * - als `kontext` (gehört fachlich hierher, wird aber am Objekt, per Suche oder über einen Link geöffnet).
 *
 * Neue Funktionen bekommen nie automatisch einen Menüpunkt. Ein Modul, das hier fehlt, fällt im Test
 * `struktur.test.ts` auf.
 */
import { matchPath } from 'react-router-dom';
import { alleModule, modul, modulPfad, type ModulDef } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { darf, type Recht } from '@core/session';

export type HauptId = 'heute' | 'auftraege' | 'plan' | 'betrieb';

export interface Ansicht {
  titel: string;
  /** Module, deren Seiten zu dieser Ansicht gehören. Das erste ist die Startseite der Ansicht. */
  module: string[];
  /** Startpfad, falls nicht die Startseite des ersten Moduls */
  pfad?: string;
  recht?: Recht;
}

export interface Ziel {
  id: string;
  titel: string;
  /** kürzere Beschriftung für schmale Bildschirme */
  kurz?: string;
  /** höchstens vier Ansichten */
  ansichten: Ansicht[];
  /** Module, die fachlich hierher gehören, aber nur im Kontext geöffnet werden */
  kontext?: string[];
  recht?: Recht;
  /** Suchbegriffe, unter denen dieses Ziel gefunden wird */
  stichworte?: string[];
}

export interface Kategorie {
  id: string;
  titel: string;
  text: string;
  icon: string;
  ziele: Ziel[];
}

export interface Hauptbereich {
  id: HauptId;
  titel: string;
  pfad: string;
  icon: string;
  ziele?: Ziel[];
  kategorien?: Kategorie[];
  /** Module ohne eigenes Ziel (Heute-Bausteine, Overlays) */
  kontext?: string[];
}

export const STRUKTUR: Hauptbereich[] = [
  {
    id: 'heute',
    titel: 'Heute',
    pfad: '/heute',
    icon: 'heute',
    kontext: ['braucht-dich', 'naechster-einsatz', 'mein-tag', 'schnell-erfassen', 'hinweise', 'suche', 'macher-fragen', 'benachrichtigungen', 'takte', 'onboarding', 'start', 'konto'],
  },
  {
    id: 'auftraege',
    titel: 'Aufträge',
    pfad: '/auftraege',
    icon: 'auftraege',
    ziele: [
      {
        id: 'uebersicht',
        titel: 'Übersicht',
        ansichten: [
          { titel: 'Aufträge', module: ['auftraege'] },
          { titel: 'Angebote', module: ['angebote'], recht: 'geld' },
          { titel: 'Aufgaben', module: ['aufgaben'] },
        ],
        kontext: ['fotos', 'zusatzleistungen', 'abnahme', 'aufmass', 'berichte', 'kalkulation', 'checklisten', 'material-am-auftrag', 'arbeitsanweisungen', 'dateien', 'dokumente'],
        stichworte: ['Auftrag', 'Projekt', 'Baustelle', 'Angebot', 'Aufgabe', 'Foto', 'Aufmaß', 'Bericht', 'Abnahme', 'Kalkulation', 'Checkliste', 'Datei'],
      },
      {
        id: 'eingang',
        titel: 'Eingang',
        ansichten: [
          { titel: 'Alles', module: ['eingang'] },
          { titel: 'Anfragen', module: ['anfragen'] },
          { titel: 'Nachrichten', module: ['nachrichten'] },
          { titel: 'Rückrufe', module: ['telefon'] },
        ],
        stichworte: ['Anfrage', 'Anruf', 'Telefon', 'Rückruf', 'Nachricht', 'E-Mail', 'Posteingang', 'Eingang', 'Freigabe', 'Anfrage-Postfach'],
      },
      {
        id: 'kunden',
        titel: 'Kunden',
        ansichten: [{ titel: 'Kunden', module: ['kunden'] }],
        kontext: ['orte', 'kundenbereich', 'bewertungen'],
        stichworte: ['Kunde', 'Kontakt', 'Ansprechpartner', 'Adresse', 'Baustelle', 'Ort', 'Bewertung', 'Kundenbereich'],
      },
      {
        id: 'service',
        titel: 'Service',
        ansichten: [
          { titel: 'Wartungen', module: ['wartung'] },
          { titel: 'Verträge', module: ['servicevertraege'] },
          { titel: 'Reklamationen', module: ['reklamationen'] },
          { titel: 'Anlagen', module: ['anlagen'] },
        ],
        stichworte: ['Wartung', 'Servicevertrag', 'Vertrag', 'Reklamation', 'Mangel', 'Gewährleistung', 'Anlage', 'Heizung'],
      },
    ],
  },
  {
    id: 'plan',
    titel: 'Planen',
    pfad: '/plan',
    icon: 'plan',
    ziele: [
      {
        id: 'kalender',
        titel: 'Kalender',
        ansichten: [
          { titel: 'Kalender', module: ['kalender'] },
          { titel: 'Plantafel', module: ['einsatzplanung'] },
        ],
        kontext: ['besichtigungen', 'wiederkehrend', 'fahrt', 'material-bereit', 'werkzeug-bereit', 'qualifikation-planung'],
        stichworte: ['Termin', 'Kalender', 'Besichtigung', 'Einsatz', 'Wiederholen', 'Route', 'Fahrt', 'Plantafel'],
      },
      {
        id: 'einplanen',
        titel: 'Einplanen',
        ansichten: [{ titel: 'Offen', module: ['offen'] }],
        kontext: ['autoplanung'],
        stichworte: ['Einplanen', 'Offen', 'Automatisch planen', 'Vorschlag'],
      },
      {
        id: 'kapazitaet',
        titel: 'Kapazität',
        ansichten: [
          { titel: 'Auslastung', module: ['auslastung'] },
          { titel: 'Verfügbarkeit', module: ['verfuegbarkeit'] },
        ],
        stichworte: ['Auslastung', 'Kapazität', 'Verfügbarkeit', 'Wer hat Zeit'],
      },
    ],
  },
  {
    id: 'betrieb',
    titel: 'Betrieb',
    pfad: '/betrieb',
    icon: 'betrieb',
    kategorien: [
      {
        id: 'geld',
        titel: 'Geld',
        text: 'Rechnungen & Belege',
        icon: 'euro',
        ziele: [
          {
            id: 'rechnungen',
            titel: 'Rechnungen',
            recht: 'geld',
            ansichten: [
              { titel: 'Rechnungen', module: ['rechnungen'] },
              { titel: 'Zahlungen', module: ['zahlungen'] },
              { titel: 'Mahnungen', module: ['mahnungen'] },
            ],
            stichworte: ['Rechnung', 'Zahlung', 'Mahnung', 'Offene Posten', 'Überfällig'],
          },
          {
            id: 'ausgaben',
            titel: 'Ausgaben',
            ansichten: [{ titel: 'Belege', module: ['belege'] }],
            stichworte: ['Beleg', 'Eingangsrechnung', 'Quittung', 'Tankbeleg', 'Ausgabe'],
          },
          {
            id: 'ueberblick',
            titel: 'Überblick',
            recht: 'geld',
            ansichten: [
              { titel: 'Auswertung', module: ['auswertung'] },
              { titel: 'Ertrag', module: ['ertrag'] },
              { titel: 'Nachkalkulation', module: ['nachkalkulation'] },
              { titel: 'Kosten', module: ['kosten'] },
            ],
            stichworte: ['Auswertung', 'Umsatz', 'Ertrag', 'Gewinn', 'Nachkalkulation', 'Kosten'],
          },
          {
            id: 'steuerberater',
            titel: 'Steuerberater',
            kurz: 'Steuer',
            recht: 'geld',
            ansichten: [{ titel: 'Steuerberater', module: ['datev'] }],
            stichworte: ['DATEV', 'Steuerberater', 'Buchhaltung', 'Export'],
          },
        ],
      },
      {
        id: 'team',
        titel: 'Team',
        text: 'Menschen & Zeiten',
        icon: 'team',
        ziele: [
          { id: 'mitarbeiter', titel: 'Mitarbeiter', ansichten: [{ titel: 'Mitarbeiter', module: ['mitarbeiter'] }], stichworte: ['Mitarbeiter', 'Personal', 'Kollege'] },
          {
            id: 'zeiten',
            titel: 'Zeiten & Abwesenheit',
            kurz: 'Zeiten',
            ansichten: [
              { titel: 'Arbeitszeiten', module: ['arbeitszeiten'] },
              { titel: 'Abwesenheit', module: ['abwesenheiten'] },
            ],
            stichworte: ['Arbeitszeit', 'Stunden', 'Stempeln', 'Urlaub', 'Krank', 'Abwesenheit', 'Zeitkonto'],
          },
          {
            id: 'lernen',
            titel: 'Lernen & Nachweise',
            kurz: 'Lernen',
            ansichten: [
              { titel: 'Qualifikationen', module: ['qualifikationen'] },
              { titel: 'Unterweisungen', module: ['unterweisungen'] },
              { titel: 'Schulungen', module: ['schulungen'] },
              { titel: 'Einarbeitung', module: ['einarbeitung'] },
            ],
            stichworte: ['Qualifikation', 'Unterweisung', 'Schulung', 'Einarbeitung', 'Nachweis', 'Zertifikat'],
          },
          { id: 'bewerber', titel: 'Bewerber', ansichten: [{ titel: 'Bewerber', module: ['bewerber'] }], stichworte: ['Bewerber', 'Bewerbung', 'Azubi suchen'] },
        ],
      },
      {
        id: 'ausstattung',
        titel: 'Ausstattung',
        text: 'Lager, Einkauf & Geräte',
        icon: 'werkzeug',
        ziele: [
          { id: 'lager', titel: 'Lager', ansichten: [{ titel: 'Bestand', module: ['lager'] }], stichworte: ['Lager', 'Bestand', 'Inventur', 'Mindestbestand'] },
          {
            id: 'einkauf',
            titel: 'Einkauf',
            ansichten: [
              { titel: 'Bedarf', module: ['bedarf'] },
              { titel: 'Bestellungen', module: ['bestellungen'] },
              { titel: 'Lieferanten', module: ['lieferanten'] },
              { titel: 'Subunternehmer', module: ['subunternehmer'] },
            ],
            stichworte: ['Bestellung', 'Bedarf', 'Lieferant', 'Großhandel', 'Subunternehmer', 'Nachunternehmer'],
          },
          {
            id: 'geraete',
            titel: 'Geräte & Fahrzeuge',
            kurz: 'Geräte',
            ansichten: [
              { titel: 'Werkzeuge', module: ['werkzeuge'] },
              { titel: 'Maschinen', module: ['maschinen'] },
              { titel: 'Fahrzeuge', module: ['fahrzeuge'] },
              { titel: 'Prüfungen', module: ['pruefungen'] },
            ],
            stichworte: ['Werkzeug', 'Maschine', 'Gerät', 'Fahrzeug', 'Auto', 'TÜV', 'DGUV', 'Prüfung', 'Defekt'],
          },
        ],
      },
      {
        id: 'unternehmen',
        titel: 'Unternehmen',
        text: 'Katalog, Vorlagen & Regeln',
        icon: 'einstellungen',
        ziele: [
          {
            // Was kommt aufs Angebot, auf die Rechnung? Material und Leistungen an einem Ort – zwei Sammlungen, keine Kopien.
            id: 'katalog',
            titel: 'Katalog',
            ansichten: [
              { titel: 'Material', module: ['artikel'] },
              { titel: 'Leistungen', module: ['leistungen'] },
            ],
            stichworte: ['Katalog', 'Artikel', 'Material', 'Leistung', 'Preis', 'Preisliste', 'Stundensatz', 'Einkaufspreis', 'Verkaufspreis', 'Aufschlag', 'Zuschlag', 'DATANORM'],
          },
          { id: 'vorlagen', titel: 'Vorlagen', ansichten: [{ titel: 'Vorlagen', module: ['vorlagen'] }], stichworte: ['Vorlage', 'Formular', 'Briefkopf', 'Textbaustein'] },
          { id: 'wissen', titel: 'Wissen', ansichten: [{ titel: 'Wissen', module: ['wissen'] }], stichworte: ['Wissen', 'Anleitung', 'Handbuch'] },
          {
            id: 'einstellungen',
            titel: 'Einstellungen',
            kurz: 'Einstellung',
            ansichten: [
              { titel: 'Betrieb', module: ['einstellungen', 'abo'] },
              { titel: 'Zugriffe', module: ['rollen'] },
              { titel: 'Verbindungen', module: ['schnittstellen', 'terminbuchung'] },
              { titel: 'Automationen', module: ['automatisch', 'erledigt'] },
            ],
            kontext: ['import', 'felder', 'ablauf'],
            stichworte: ['Einstellungen', 'Rollen', 'Rechte', 'Zugriff', 'Schnittstelle', 'Terminbuchung', 'Online buchen', 'Automation', 'Erledigt', 'Datensicherung', 'Papierkorb', 'Dein Plan', 'Abo', 'Bezahlen', 'Kündigen', 'Testphase', 'Ablauf', 'Auftragsablauf', 'Daten übernehmen', 'Import', 'Excel', 'Eigene Felder'],
          },
        ],
      },
    ],
  },
];

// ------------------------------------------------------------------ Abfragen

export interface Ort {
  haupt: Hauptbereich;
  kategorie?: Kategorie;
  ziel?: Ziel;
  ansicht?: Ansicht;
  modulId?: string;
  /** Detail-, Anlege- oder Bearbeitungsseite (keine lokale Navigation) */
  detail?: boolean;
}

export function zieleVon(h: Hauptbereich): Ziel[] {
  return h.ziele ?? h.kategorien?.flatMap((k) => k.ziele) ?? [];
}

/** Wo gehört ein Modul hin? */
export function ortVonModul(id: string): Ort | undefined {
  for (const haupt of STRUKTUR) {
    if (haupt.kontext?.includes(id)) return { haupt, modulId: id };
    const gruppen: { kategorie?: Kategorie; ziele: Ziel[] }[] = haupt.kategorien ? haupt.kategorien.map((k) => ({ kategorie: k, ziele: k.ziele })) : [{ ziele: haupt.ziele ?? [] }];
    for (const { kategorie, ziele } of gruppen) {
      for (const ziel of ziele) {
        const ansicht = ziel.ansichten.find((a) => a.module.includes(id));
        if (ansicht || ziel.kontext?.includes(id)) return { haupt, kategorie, ziel, ansicht, modulId: id };
      }
    }
  }
  return undefined;
}

const DETAIL = /(:|\/neu$|\/bearbeiten$|\/import$)/;

/** Wo bin ich? Aus dem Pfad den Hauptbereich, die Kategorie, das Ziel und die Ansicht bestimmen. */
export function ortVonPfad(pfad: string, module: ModulDef[] = alleModule()): Ort | undefined {
  const seg = pfad.split('/').filter(Boolean);
  if (seg[0] === 'betrieb' && seg[1]) {
    const k = STRUKTUR[3].kategorien!.find((x) => x.id === seg[1]);
    if (k) return { haupt: STRUKTUR[3], kategorie: k };
  }
  for (const m of module) {
    for (const r of m.routen ?? []) {
      const muster = r.pfad.startsWith('/') ? r.pfad : modulPfad(m, r.pfad);
      if (matchPath({ path: muster, end: true }, pfad)) {
        const o = ortVonModul(m.id);
        if (o) return { ...o, detail: DETAIL.test(muster) };
      }
    }
  }
  const haupt = STRUKTUR.find((h) => h.id === seg[0]);
  return haupt ? { haupt } : undefined;
}

function modulSichtbar(id: string, ich: Mitarbeiter | undefined) {
  const m = modul(id);
  return !!m && (!m.rollen || !ich || m.rollen.includes(ich.rolle));
}

export function ansichtSichtbar(a: Ansicht, ich: Mitarbeiter | undefined) {
  return (!a.recht || darf(a.recht, ich)) && modulSichtbar(a.module[0], ich);
}

export function sichtbareAnsichten(z: Ziel, ich: Mitarbeiter | undefined): Ansicht[] {
  if (z.recht && !darf(z.recht, ich)) return [];
  return z.ansichten.filter((a) => ansichtSichtbar(a, ich));
}

export function sichtbareZiele(ziele: Ziel[], ich: Mitarbeiter | undefined): Ziel[] {
  return ziele.filter((z) => sichtbareAnsichten(z, ich).length > 0);
}

export function ansichtPfad(a: Ansicht): string {
  if (a.pfad) return a.pfad;
  const m = modul(a.module[0]);
  return m ? modulPfad(m) : '/';
}

export function zielPfad(z: Ziel, ich: Mitarbeiter | undefined): string {
  const a = sichtbareAnsichten(z, ich)[0] ?? z.ansichten[0];
  return ansichtPfad(a);
}

// ------------------------------------------------------------------ Modulverzeichnis (Betrieb)

export interface VerzeichnisGruppe {
  id: string;
  titel: string;
  module: ModulDef[];
}

/**
 * Alle Module mit eigener Ansicht, die dieser Nutzer sehen darf – gruppiert für das Verzeichnis unter „Betrieb“:
 * zuerst Geld · Team · Ausstattung · Unternehmen, dann die Ansichten aus Aufträge und Planen.
 * Module, die nur im Kontext erscheinen (Fotos, Heute-Bausteine …), stehen nicht darin.
 */
export function modulVerzeichnis(ich: Mitarbeiter | undefined): VerzeichnisGruppe[] {
  const ausZielen = (ziele: Ziel[]) => {
    const ids = sichtbareZiele(ziele, ich).flatMap((z) => sichtbareAnsichten(z, ich).flatMap((a) => a.module));
    return [...new Set(ids)].filter((id) => modulSichtbar(id, ich)).map((id) => modul(id)!);
  };
  const betrieb = STRUKTUR.find((h) => h.id === 'betrieb')!;
  const gruppen: VerzeichnisGruppe[] = [
    ...betrieb.kategorien!.map((k) => ({ id: k.id, titel: k.titel, module: ausZielen(k.ziele) })),
    ...STRUKTUR.filter((h) => h.ziele).map((h) => ({ id: h.id, titel: `Aus ${h.titel}`, module: ausZielen(h.ziele!) })),
  ];
  return gruppen.filter((g) => g.module.length);
}

// ------------------------------------------------------------------ Suche nach Funktionen

/**
 * Funktionen unter verständlichen Namen und Synonymen finden („Urlaub“ → Betrieb › Team › Zeiten & Abwesenheit).
 * Auch Funktionen, die nur im Kontext erscheinen (z. B. Fotos), sind so erreichbar.
 */
export function funktionsTreffer(q: string, ich: Mitarbeiter | undefined): { titel: string; untertitel: string; pfad: string; typ: string; relevanz: number }[] {
  const woerter = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!woerter.length) return [];
  const passt = (...felder: (string | undefined)[]) => {
    const heu = felder.filter(Boolean).join(' ').toLowerCase();
    return woerter.every((w) => heu.includes(w));
  };
  const treffer: ReturnType<typeof funktionsTreffer> = [];
  for (const h of STRUKTUR) {
    const gruppen = h.kategorien ? h.kategorien.map((k) => ({ k, ziele: k.ziele })) : [{ k: undefined, ziele: h.ziele ?? [] }];
    for (const { k, ziele } of gruppen) {
      for (const z of sichtbareZiele(ziele, ich)) {
        const ort = [h.titel, k?.titel, z.titel].filter(Boolean).join(' › ');
        const ansichten = sichtbareAnsichten(z, ich);
        if (passt(z.titel, ...(z.stichworte ?? []), ...ansichten.map((a) => a.titel))) {
          treffer.push({ titel: z.titel, untertitel: ort, pfad: zielPfad(z, ich), typ: 'Funktion', relevanz: 30 });
        }
        for (const a of ansichten) {
          if (a.titel !== z.titel && passt(a.titel)) treffer.push({ titel: a.titel, untertitel: ort, pfad: ansichtPfad(a), typ: 'Funktion', relevanz: 25 });
        }
        for (const id of z.kontext ?? []) {
          const m = modul(id);
          if (m && m.routen?.length && modulSichtbar(id, ich) && passt(m.titel, m.beschreibung)) {
            treffer.push({ titel: m.titel, untertitel: `${ort} · ${m.beschreibung}`, pfad: modulPfad(m), typ: 'Funktion', relevanz: 20 });
          }
        }
      }
    }
  }
  return treffer.slice(0, 6);
}
