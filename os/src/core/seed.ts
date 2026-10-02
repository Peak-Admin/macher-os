/**
 * Einrichtung nach dem Onboarding: Betrieb, Leistungen, Material, Qualifikationen
 * aus der Gewerk-Vorlage – plus gekennzeichnete Beispieldaten für den direkten Start.
 */
import { alleSammlungen, batch, db, exportieren, importieren, zuruecksetzen } from './db';
import { einstellung, setzeEinstellung } from './einstellungen';
import { gewerkVorlage, type LeistungVorlage } from './gewerke';
import { alleModule } from './modul';
import { heute, plusTage, summen, zeitpunkt } from './format';
import type { Arbeitsweise, Betrieb, Gewerk, ID, Mitarbeiter, Position, Rolle } from './objects';
import { setzeIch } from './session';

export interface OnboardingAntworten {
  betriebName: string;
  gewerk: Gewerk;
  arbeitsweisen: Arbeitsweise[];
  teamgroesse: number;
  /** Vorname/Nachname des Chefs */
  chefVorname: string;
  chefNachname: string;
  /** ausgewählte Leistungen aus der Vorlage (Namen); leer = alle */
  leistungen?: string[];
  /** Beispieldaten anlegen? Nur noch für die getrennte Spielwiese (`spielwieseStarten`). */
  beispiele: boolean;
  /** Briefkopf und Stammdaten aus dem Setup (Foto/Website/von Hand) */
  betrieb?: Partial<Pick<Betrieb, 'adresse' | 'telefon' | 'email' | 'steuernummer' | 'ustId' | 'iban' | 'stundensatz' | 'zahlungszielTage'>>;
  /** Preise der Gewerk-Vorlage anpassen, z. B. 1.1 = +10 % (Region) */
  preisFaktor?: number;
  /** eigene Preisliste (bestätigt) – ersetzt die Leistungen der Vorlage */
  eigeneLeistungen?: LeistungVorlage[];
  /** eingeladene Mitarbeiter; `id` vorab vergeben, damit Einladungslinks schon vor dem Anlegen stimmen */
  team?: { id?: ID; vorname: string; nachname: string; telefon?: string; rolle: Rolle }[];
}

/** Euro-Preis mit Faktor anpassen; ab 20 € auf 50 Cent, darunter auf 10 Cent gerundet (sonst wirken Preise krumm) */
export function preisAnpassen(euro: number, faktor = 1): number {
  if (!faktor || faktor === 1) return euro;
  const p = euro * faktor;
  return p >= 20 ? Math.round(p * 2) / 2 : Math.max(0.1, Math.round(p * 10) / 10);
}

const TEAM_FARBEN = ['#2F9250', '#69AF44', '#1F6135', '#767676', '#06480C'];

const c = (euro: number) => Math.round(euro * 100);

export function einrichten(a: OnboardingAntworten) {
  const v = gewerkVorlage(a.gewerk);
  zuruecksetzen();
  batch(() => {
    db.betrieb.create({
      id: 'betrieb',
      name: a.betriebName,
      gewerk: a.gewerk,
      arbeitsweisen: a.arbeitsweisen.length ? a.arbeitsweisen : v.standardArbeitsweisen,
      teamgroesse: a.teamgroesse,
      adresse: { strasse: '', plz: '', ort: '' },
      telefon: '',
      email: '',
      stundensatz: c(preisAnpassen(v.stundensatz, a.preisFaktor)),
      zahlungszielTage: 14,
      ...a.betrieb,
      ustSatz: 19,
      arbeitsbeginn: '07:00',
      arbeitsende: '16:00',
      onboardingFertig: true,
    });

    const chef = db.mitarbeiter.create({
      vorname: a.chefVorname || 'Chef',
      nachname: a.chefNachname || '',
      rolle: 'chef',
      wochenstunden: 45,
      urlaubstageJahr: 30,
      kostensatz: c(45),
      aktiv: true,
      farbe: '#06480C',
    });
    setzeIch(chef.id);
    (a.team ?? []).forEach((m, i) =>
      db.mitarbeiter.create({
        id: m.id,
        vorname: m.vorname,
        nachname: m.nachname,
        telefon: m.telefon,
        rolle: m.rolle,
        wochenstunden: m.rolle === 'azubi' ? 40 : 39,
        urlaubstageJahr: 30,
        kostensatz: c(m.rolle === 'azubi' ? 14 : 36),
        aktiv: true,
        farbe: TEAM_FARBEN[i % TEAM_FARBEN.length],
      }),
    );

    const quali = v.qualifikationen.map((q) => db.qualifikationen.create({ ...q }));
    const lieferant = db.lieferanten.create({
      name: 'Großhandel (bitte anpassen)',
      lieferzeitTage: 1,
      konditionen: 'Bitte deine Konditionen eintragen',
    });
    const artikel = v.artikel.map((x) =>
      db.artikel.create({
        name: x.name,
        einheit: x.einheit,
        ek: c(x.ek),
        vk: c(x.vk),
        kategorie: x.kategorie,
        mindestbestand: x.mindestbestand,
        bestand: x.mindestbestand ? Math.round(x.mindestbestand * 1.5) : undefined,
        lagerort: x.mindestbestand ? 'Hauptlager' : undefined,
        lieferantId: lieferant.id,
        aktiv: true,
      }),
    );
    const auswahl = a.eigeneLeistungen?.length
      ? a.eigeneLeistungen
      : a.leistungen?.length
        ? v.leistungen.filter((l) => a.leistungen!.includes(l.name))
        : v.leistungen;
    const faktor = a.eigeneLeistungen?.length ? 1 : a.preisFaktor;
    auswahl.forEach((l) =>
      db.leistungen.create({
        name: l.name,
        einheit: l.einheit,
        preis: c(preisAnpassen(l.preis, faktor)),
        minuten: l.minuten,
        kategorie: l.kategorie,
        aktiv: true,
      }),
    );

    if (a.beispiele) beispielDaten(chef, quali.map((q) => q.id), artikel.map((x) => x.id));
  });

  // Module legen ihre eigenen Startdaten an (Checklisten, Vorlagen …)
  for (const m of alleModule()) {
    try {
      m.seed?.();
    } catch (e) {
      console.error(`Seed von Modul ${m.id} fehlgeschlagen`, e);
    }
  }
}

/** Alle Beispieldaten entfernen – echte Daten bleiben */
export function beispieleEntfernen() {
  batch(() => {
    const weg = new Set<ID>();
    for (const col of alleSammlungen()) {
      col.allMitGeloeschten()
        .filter((x) => x.beispiel)
        .forEach((x) => (weg.add(x.id), col.purge(x.id)));
    }
    // Termine und Aufgaben zu Beispielaufträgen sind ohne den Auftrag sinnlos; Beispiel-Mitarbeiter aus Terminen austragen
    db.termine.allMitGeloeschten().forEach((t) => {
      if (t.auftragId && weg.has(t.auftragId)) return (weg.add(t.id), db.termine.purge(t.id));
      if (t.mitarbeiterIds.some((m) => weg.has(m))) db.termine.update(t.id, { mitarbeiterIds: t.mitarbeiterIds.filter((m) => !weg.has(m)) }, { leise: true });
    });
    db.aufgaben
      .allMitGeloeschten()
      .filter((a) => (a.auftragId && weg.has(a.auftragId)) || (a.bezug && weg.has(a.bezug.id)))
      .forEach((a) => (weg.add(a.id), db.aufgaben.purge(a.id)));
    // Was Macher zu Beispielen notiert hat (Hinweise, Benachrichtigungen, Erledigt, Verlauf), geht mit
    for (const name of ['hinweise', 'benachrichtigungen', 'erledigungen', 'ereignisse'] as const) {
      db[name]
        .allMitGeloeschten()
        .filter((x) => x.bezug && weg.has(x.bezug.id))
        .forEach((x) => db[name].purge(x.id));
    }
  });
}

// ------------------------------------------------------------------ Spielwiese

/**
 * Spielwiese: Beispieldaten nur als getrennter Modus, nie gemischt mit echten Daten.
 * Beim Betreten wird ein vorhandener echter Betrieb vollständig zur Seite gelegt (eigene IndexedDB,
 * Rückfall localStorage), beim Verlassen genau so zurückgeholt – die Beispieldaten verschwinden ohne Reste.
 */
export const SPIELWIESE_KEY = 'modus.spielwiese';
const SICHERUNG_DB = 'macher-os-spielwiese';
const SICHERUNG_KEY = 'macher-os:echte-daten';

type Stand = ReturnType<typeof exportieren>;

export interface SicherungsSpeicher {
  lesen(): Promise<Stand | undefined>;
  schreiben(s: Stand): Promise<void>;
  loeschen(): Promise<void>;
}

function idbOeffnen(): Promise<IDBDatabase> {
  return new Promise((ok, fehler) => {
    const r = indexedDB.open(SICHERUNG_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('stand');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fehler(r.error);
  });
}

async function idbSchritt<T>(modus: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await idbOeffnen();
  try {
    return await new Promise<T>((ok, fehler) => {
      const tx = d.transaction('stand', modus);
      const r = fn(tx.objectStore('stand'));
      tx.oncomplete = () => ok(r.result as T);
      tx.onerror = () => fehler(tx.error);
      tx.onabort = () => fehler(tx.error);
    });
  } finally {
    d.close();
  }
}

/** Standard: eigene IndexedDB; ohne IndexedDB localStorage (wirft bei Platzmangel → Spielwiese startet dann nicht) */
const browserSpeicher: SicherungsSpeicher = {
  async lesen() {
    if (globalThis.indexedDB) return (await idbSchritt<Stand | undefined>('readonly', (s) => s.get('daten'))) ?? undefined;
    const t = globalThis.localStorage?.getItem(SICHERUNG_KEY);
    return t ? (JSON.parse(t) as Stand) : undefined;
  },
  async schreiben(stand) {
    if (globalThis.indexedDB) return void (await idbSchritt('readwrite', (s) => s.put(stand, 'daten')));
    if (!globalThis.localStorage) throw new Error('Kein Speicher für die Sicherung.');
    globalThis.localStorage.setItem(SICHERUNG_KEY, JSON.stringify(stand));
  },
  async loeschen() {
    if (globalThis.indexedDB) return void (await idbSchritt('readwrite', (s) => s.delete('daten')));
    globalThis.localStorage?.removeItem(SICHERUNG_KEY);
  },
};

let speicher: SicherungsSpeicher = browserSpeicher;
/** Für Tests: Speicher austauschen */
export function setzeSicherungsSpeicher(s: SicherungsSpeicher | undefined) {
  speicher = s ?? browserSpeicher;
}

export function istSpielwiese(): boolean {
  return einstellung<boolean>(SPIELWIESE_KEY, false) === true;
}

/** Gibt es einen echten (selbst eingerichteten) Betrieb in diesem Browser? */
export function hatEchtenBetrieb(): boolean {
  return !!db.betrieb.get('betrieb')?.onboardingFertig && !istSpielwiese();
}

/** Spielwiese öffnen: echte Daten zur Seite legen, Beispielbetrieb des Gewerks einrichten */
export async function spielwieseStarten(gewerk: Gewerk = 'elektro'): Promise<void> {
  if (istSpielwiese()) return;
  if (hatEchtenBetrieb()) {
    const stand = exportieren();
    await speicher.schreiben(stand);
    // nur weiter, wenn die Sicherung wirklich lesbar ist – sonst ginge beim Zurückwechseln etwas verloren
    const zurueck = await speicher.lesen();
    if (!zurueck?.betrieb) throw new Error('Deine Daten konnten nicht sicher zur Seite gelegt werden.');
  } else await speicher.loeschen().catch(() => {});
  einrichten({ betriebName: 'Musterbetrieb', gewerk, arbeitsweisen: [], teamgroesse: 5, chefVorname: 'Max', chefNachname: 'Macher', beispiele: true });
  setzeEinstellung(SPIELWIESE_KEY, true);
}

/**
 * Spielwiese verlassen. Rückgabe `'zurueck'`: der echte Betrieb ist wiederhergestellt.
 * `'leer'`: es gab noch keinen echten Betrieb – alles ist leer, das Setup beginnt.
 */
export async function spielwieseVerlassen(): Promise<'zurueck' | 'leer'> {
  const gesichert = await speicher.lesen().catch(() => undefined);
  if (gesichert?.betrieb) {
    importieren(gesichert);
    await speicher.loeschen().catch(() => {});
    return 'zurueck';
  }
  zuruecksetzen();
  await speicher.loeschen().catch(() => {});
  return 'leer';
}

/** Gibt es zur Seite gelegte echte Daten (z. B. nach einem Neuladen auf der Spielwiese)? */
export async function hatGesicherteDaten(): Promise<boolean> {
  return !!(await speicher.lesen().catch(() => undefined))?.betrieb;
}

function beispielDaten(chef: Mitarbeiter, qualiIds: ID[], artikelIds: ID[]) {
  const B = { beispiel: true };
  const t = heute();
  // „morgen“ = nächster Werktag, „gestern“ = letzter Werktag (keine Beispieltermine am Wochenende)
  const werktag = (tage: number) => {
    let d = plusTage(t, tage);
    const richtung = tage < 0 ? -1 : 1;
    while ([0, 6].includes(new Date(d + 'T12:00:00').getDay())) d = plusTage(d, richtung);
    return d;
  };
  const ist = (tage: number, uhr: string) => zeitpunkt(tage === 0 ? t : werktag(tage), uhr);

  // ---- Team
  const team = [
    { vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur' as const, farbe: '#2F9250', kostensatz: c(38) },
    { vorname: 'Mehmet', nachname: 'Yılmaz', rolle: 'monteur' as const, farbe: '#69AF44', kostensatz: c(36) },
    { vorname: 'Sandra', nachname: 'Krüger', rolle: 'buero' as const, farbe: '#1F6135', kostensatz: c(32) },
    { vorname: 'Lukas', nachname: 'Wagner', rolle: 'azubi' as const, farbe: '#767676', kostensatz: c(14) },
  ].map((m) =>
    db.mitarbeiter.create({
      ...m,
      telefon: '0170 0000000',
      wochenstunden: m.rolle === 'azubi' ? 40 : 39,
      urlaubstageJahr: 30,
      aktiv: true,
      eintritt: plusTage(t, -800),
      ...B,
    }),
  );
  const [jonas, mehmet, , lukas] = team;

  // Nachweise: einer läuft bald ab (damit "Braucht dich" etwas zu zeigen hat)
  if (qualiIds[0]) {
    db.nachweise.create({ mitarbeiterId: chef.id, qualifikationId: qualiIds[0], ...B });
    db.nachweise.create({ mitarbeiterId: jonas.id, qualifikationId: qualiIds[0], ...B });
    db.nachweise.create({ mitarbeiterId: mehmet.id, qualifikationId: qualiIds[0], ...B });
  }
  const ersteHilfe = db.qualifikationen.all().find((q) => q.name === 'Erste Hilfe');
  if (ersteHilfe) {
    db.nachweise.create({ mitarbeiterId: jonas.id, qualifikationId: ersteHilfe.id, gueltigBis: plusTage(t, 12), ...B });
    db.nachweise.create({ mitarbeiterId: mehmet.id, qualifikationId: ersteHilfe.id, gueltigBis: plusTage(t, 400), ...B });
  }

  db.abwesenheiten.create({ mitarbeiterId: lukas.id, art: 'schule', von: plusTage(t, 1), bis: plusTage(t, 2), status: 'genehmigt', ...B });
  db.abwesenheiten.create({ mitarbeiterId: mehmet.id, art: 'urlaub', von: plusTage(t, 14), bis: plusTage(t, 25), status: 'beantragt', ...B });

  // ---- Kunden & Orte
  const kunden = [
    { art: 'privat' as const, name: 'Familie Hoffmann', telefon: '0171 2345678', email: 'hoffmann@example.de', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } },
    { art: 'hausverwaltung' as const, name: 'Hausverwaltung Nord GmbH', firma: 'Hausverwaltung Nord GmbH', telefon: '0561 998877', email: 'technik@hv-nord.example', adresse: { strasse: 'Ständeplatz 3', plz: '34117', ort: 'Kassel' } },
    { art: 'privat' as const, name: 'Petra Schulz', telefon: '0160 1112233', email: 'p.schulz@example.de', adresse: { strasse: 'Am Hang 4', plz: '34128', ort: 'Kassel' } },
    { art: 'firma' as const, name: 'Bäckerei Sommer', firma: 'Bäckerei Sommer KG', telefon: '0561 445566', email: 'info@baeckerei-sommer.example', adresse: { strasse: 'Hauptstraße 41', plz: '34246', ort: 'Vellmar' } },
    { art: 'privat' as const, name: 'Thomas Richter', telefon: '0151 7778899', adresse: { strasse: 'Bergstraße 9', plz: '34225', ort: 'Baunatal' } },
  ].map((k, i) =>
    db.kunden.create({
      ...k,
      nummer: `K-${String(1001 + i)}`,
      ansprechpartner:
        k.art === 'hausverwaltung'
          ? [{ id: 'ap1', name: 'Frau Neumann', funktion: 'Technik', telefon: '0561 998870' }]
          : [],
      quelle: (['empfehlung', 'email', 'website', 'telefon', 'website'] as const)[i],
      ...B,
    }),
  );
  const [hoffmann, hv, schulz, baeckerei, richter] = kunden;

  const orte = [
    db.orte.create({ kundeId: hoffmann.id, bezeichnung: 'Einfamilienhaus', art: 'haus', adresse: hoffmann.adresse!, hinweise: 'Hund im Garten, bitte klingeln.', ...B }),
    db.orte.create({ kundeId: hv.id, bezeichnung: 'Wohnanlage Goethestraße', art: 'gewerbe', adresse: { strasse: 'Goethestraße 22–26', plz: '34119', ort: 'Kassel' }, hinweise: 'Schlüssel beim Hausmeister, Herr Albers (EG links).', ansprechpartnerVorOrt: 'Herr Albers', telefonVorOrt: '0175 1231231', ...B }),
    db.orte.create({ kundeId: schulz.id, bezeichnung: 'Wohnung 2. OG', art: 'wohnung', adresse: schulz.adresse!, ...B }),
    db.orte.create({ kundeId: baeckerei.id, bezeichnung: 'Backstube', art: 'gewerbe', adresse: baeckerei.adresse!, hinweise: 'Nur vor 6 Uhr oder nach 13 Uhr – sonst läuft der Ofen.', ...B }),
    db.orte.create({ kundeId: richter.id, bezeichnung: 'Neubau', art: 'baustelle', adresse: richter.adresse!, hinweise: 'Baustrom vorhanden. Zufahrt über Feldweg.', ...B }),
  ];

  const anlagentyp = gewerkVorlage(db.betrieb.get('betrieb')!.gewerk).anlagentypen;
  const anlage = db.anlagen.create({
    ortId: orte[0].id,
    kundeId: hoffmann.id,
    typ: anlagentyp[0] ?? 'Anlage',
    hersteller: 'Hersteller',
    baujahr: 2016,
    wartungMonate: 12,
    letzteWartung: plusTage(t, -350),
    naechsteWartung: plusTage(t, 15),
    ...B,
  });
  db.anlagen.create({
    ortId: orte[1].id,
    kundeId: hv.id,
    typ: anlagentyp[1] ?? 'Anlage',
    baujahr: 2009,
    wartungMonate: 12,
    letzteWartung: plusTage(t, -380),
    naechsteWartung: plusTage(t, -15),
    ...B,
  });

  // ---- Aufträge über alle Phasen
  const leistungen = db.leistungen.all();
  const lohn = leistungen.find((l) => l.einheit === 'h') ?? leistungen[0];
  const pos = (n: number): Position[] =>
    leistungen.slice(0, n).map((l, i) => ({
      id: `p${i}`,
      art: 'leistung',
      text: l.name,
      menge: l.einheit === 'h' ? 4 : l.einheit === 'm²' || l.einheit === 'm' ? 25 : 1,
      einheit: l.einheit,
      einzelpreis: l.preis,
      leistungId: l.id,
    }));

  const nr = (i: number) => `A-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;
  const auftrag = (i: number, x: Partial<Parameters<typeof db.auftraege.create>[0]>) =>
    db.auftraege.create({
      nummer: nr(i),
      titel: '',
      art: 'kundendienst',
      phase: 'anfrage',
      kundeId: hoffmann.id,
      ...x,
      ...B,
    } as Parameters<typeof db.auftraege.create>[0]);

  const a1 = auftrag(1, { titel: 'Störung: Sicherung fliegt raus', kundeId: schulz.id, ortId: orte[2].id, phase: 'anfrage', quelle: 'telefon', dringend: true, beschreibung: 'Seit gestern fliegt im Bad die Sicherung, sobald der Föhn läuft. Kundin ist ab 14 Uhr zu Hause.', wunschtermin: 'diese Woche nachmittags', geplanteStunden: 1.5 });
  const a2 = auftrag(2, { titel: 'Anfrage über Website: Angebot Erneuerung', kundeId: richter.id, ortId: orte[4].id, phase: 'besichtigung', art: 'projekt', quelle: 'website', beschreibung: 'Neubau, Bauherr möchte Komplettangebot.', geplanteStunden: 60 });
  const a3 = auftrag(3, { titel: 'Modernisierung Backstube', kundeId: baeckerei.id, ortId: orte[3].id, phase: 'angebot', art: 'projekt', quelle: 'telefon', geplanteStunden: 24 });
  const a4 = auftrag(4, { titel: 'Sanierung Wohnanlage, Haus 24', kundeId: hv.id, ortId: orte[1].id, phase: 'in_arbeit', art: 'projekt', verantwortlichId: chef.id, geplanteStunden: 80, qualifikationIds: qualiIds.slice(0, 1) });
  const a5 = auftrag(5, { titel: 'Jährliche Wartung', kundeId: hoffmann.id, ortId: orte[0].id, anlageIds: [anlage.id], phase: 'beauftragt', art: 'wartung', geplanteStunden: 1.5 });
  const a6 = auftrag(6, { titel: 'Kleinreparatur Treppenhaus', kundeId: hv.id, ortId: orte[1].id, phase: 'abrechnung', art: 'kundendienst', geplanteStunden: 3 });
  const a7 = auftrag(7, { titel: 'Erweiterung Küche', kundeId: hoffmann.id, ortId: orte[0].id, phase: 'erledigt', art: 'projekt', geplanteStunden: 12, abgeschlossenAm: ist(-40, '15:00') });
  auftrag(8, { titel: 'Anfrage per E-Mail: Preis für Außenarbeiten', kundeId: schulz.id, phase: 'anfrage', quelle: 'email', beschreibung: 'Was würde das ungefähr kosten? Bitte Rückruf.' });

  // ---- Termine heute/morgen
  const termin = (x: Partial<Parameters<typeof db.termine.create>[0]>) =>
    db.termine.create({ art: 'einsatz', titel: '', start: '', ende: '', mitarbeiterIds: [], status: 'geplant', ...x, ...B } as Parameters<typeof db.termine.create>[0]);
  termin({ titel: a4.titel, auftragId: a4.id, kundeId: hv.id, ortId: orte[1].id, start: ist(0, '07:00'), ende: ist(0, '12:00'), mitarbeiterIds: [jonas.id, lukas.id], status: 'bestaetigt' });
  termin({ titel: a5.titel, art: 'wartung', auftragId: a5.id, kundeId: hoffmann.id, ortId: orte[0].id, start: ist(0, '13:00'), ende: ist(0, '14:30'), mitarbeiterIds: [jonas.id] });
  termin({ titel: 'Besichtigung Neubau', art: 'besichtigung', auftragId: a2.id, kundeId: richter.id, ortId: orte[4].id, start: ist(0, '15:30'), ende: ist(0, '16:30'), mitarbeiterIds: [chef.id] });
  termin({ titel: a4.titel, auftragId: a4.id, kundeId: hv.id, ortId: orte[1].id, start: ist(1, '07:00'), ende: ist(1, '16:00'), mitarbeiterIds: [jonas.id, mehmet.id] });
  termin({ titel: 'Teambesprechung', art: 'intern', start: ist(1, '06:45'), ende: ist(1, '07:00'), mitarbeiterIds: team.map((m) => m.id).concat(chef.id) });
  termin({ titel: a4.titel, auftragId: a4.id, kundeId: hv.id, ortId: orte[1].id, start: ist(-1, '07:00'), ende: ist(-1, '16:00'), mitarbeiterIds: [jonas.id, mehmet.id], status: 'erledigt' });

  // ---- Aufgaben
  db.aufgaben.create({ titel: 'Material für Haus 24 nachbestellen', auftragId: a4.id, zustaendigId: team[2].id, faellig: t, erledigt: false, prioritaet: 'hoch', quelle: 'manuell', ...B });
  db.aufgaben.create({ titel: 'Fotos vom Zählerplatz machen', auftragId: a4.id, zustaendigId: jonas.id, faellig: t, erledigt: false, prioritaet: 'normal', quelle: 'manuell', ...B });
  db.aufgaben.create({ titel: 'Kundin zurückrufen wegen Termin', auftragId: a1.id, zustaendigId: team[2].id, faellig: t, erledigt: false, prioritaet: 'hoch', quelle: 'manuell', ...B });

  // ---- Zeiten (gestern)
  for (const m of [jonas, mehmet]) {
    db.zeiten.create({ mitarbeiterId: m.id, auftragId: a4.id, datum: plusTage(t, -1), start: '07:00', ende: '16:00', pauseMinuten: 45, art: 'arbeit', freigegeben: false, ...B });
  }

  // ---- Material am Auftrag
  artikelIds.slice(0, 3).forEach((id, i) => {
    const art = db.artikel.get(id)!;
    db.material.create({ auftragId: a4.id, artikelId: id, text: art.name, menge: [50, 12, 6][i], einheit: art.einheit, ek: art.ek, status: i === 0 ? 'verbraucht' : 'geplant', ...B });
  });

  // ---- Angebote
  db.angebote.create({ nummer: `AN-${new Date().getFullYear()}-0001`, auftragId: a3.id, kundeId: baeckerei.id, titel: a3.titel, positionen: pos(4), status: 'versendet', datum: plusTage(t, -9), gueltigBis: plusTage(t, 21), versendetAm: ist(-9, '10:00'), version: 1, ...B });
  db.angebote.create({ nummer: `AN-${new Date().getFullYear()}-0002`, auftragId: a4.id, kundeId: hv.id, titel: a4.titel, positionen: pos(5), status: 'angenommen', datum: plusTage(t, -30), gueltigBis: plusTage(t, 0), versendetAm: ist(-30, '10:00'), entschiedenAm: ist(-24, '09:00'), version: 1, ...B });

  // ---- Rechnungen: eine bezahlt, eine überfällig, eine Entwurf
  const r1 = db.rechnungen.create({ nummer: `R-${new Date().getFullYear()}-0001`, art: 'rechnung', auftragId: a7.id, kundeId: hoffmann.id, titel: a7.titel, positionen: pos(3), status: 'bezahlt', datum: plusTage(t, -38), faelligAm: plusTage(t, -24), versendetAm: ist(-38, '09:00'), mahnstufe: 0, ...B });
  db.zahlungen.create({ rechnungId: r1.id, betrag: summen(r1.positionen).brutto, datum: plusTage(t, -26), art: 'ueberweisung', ...B });
  db.rechnungen.create({ nummer: `R-${new Date().getFullYear()}-0002`, art: 'abschlag', auftragId: a4.id, kundeId: hv.id, titel: `1. Abschlag – ${a4.titel}`, positionen: [{ id: 'p', art: 'pauschal', text: '1. Abschlag gemäß Angebot', menge: 1, einheit: 'Psch', einzelpreis: c(4200) }], status: 'versendet', datum: plusTage(t, -25), faelligAm: plusTage(t, -11), versendetAm: ist(-25, '09:00'), mahnstufe: 0, ...B });
  db.rechnungen.create({ nummer: `R-${new Date().getFullYear()}-0003`, art: 'rechnung', auftragId: a6.id, kundeId: hv.id, titel: a6.titel, positionen: [{ id: 'p', art: 'lohn', text: lohn?.name ?? 'Arbeitsstunde', menge: 3, einheit: 'h', einzelpreis: lohn?.preis ?? c(60) }], status: 'entwurf', datum: t, faelligAm: plusTage(t, 14), mahnstufe: 0, ...B });

  // ---- Beleg
  db.belege.create({ art: 'eingangsrechnung', lieferantName: 'Großhandel', datum: plusTage(t, -3), netto: c(612.4), ust: c(116.36), auftragId: a4.id, kategorie: 'Material', status: 'neu', faelligAm: plusTage(t, 11), ...B });

  // ---- Fahrzeuge & Werkzeug
  db.betriebsmittel.create({ art: 'fahrzeug', name: 'VW Crafter', kennzeichen: 'KS-MO 101', status: 'im_einsatz', mitarbeiterId: jonas.id, naechstePruefung: plusTage(t, 9), pruefungArt: 'TÜV/HU', ...B });
  db.betriebsmittel.create({ art: 'fahrzeug', name: 'Ford Transit Custom', kennzeichen: 'KS-MO 102', status: 'verfuegbar', naechstePruefung: plusTage(t, 140), pruefungArt: 'TÜV/HU', ...B });
  db.betriebsmittel.create({ art: 'maschine', name: 'Bohrhammer SDS-max', inventarnummer: 'W-014', status: 'verfuegbar', standort: 'Lager', naechstePruefung: plusTage(t, -4), pruefungArt: 'DGUV V3', ...B });
  db.betriebsmittel.create({ art: 'werkzeug', name: 'Messgerät Installationstester', inventarnummer: 'W-021', status: 'im_einsatz', mitarbeiterId: jonas.id, naechstePruefung: plusTage(t, 60), pruefungArt: 'Kalibrierung', ...B });
  db.betriebsmittel.create({ art: 'werkzeug', name: 'Stehleiter 8 Stufen', inventarnummer: 'W-030', status: 'verfuegbar', standort: 'KS-MO 102', naechstePruefung: plusTage(t, 30), pruefungArt: 'Leiterprüfung', ...B });

  // ---- Nachrichten
  db.nachrichten.create({ kanal: 'email', richtung: 'ein', kundeId: baeckerei.id, auftragId: a3.id, text: 'Können wir den Termin um eine Woche schieben? Wir haben vorher noch Inventur.', gelesen: false, betreff: 'Termin Modernisierung', ...B });
  db.nachrichten.create({ kanal: 'intern', richtung: 'intern', auftragId: a4.id, vonMitarbeiterId: jonas.id, text: 'Im Keller Haus 24 ist die alte Verteilung feucht. Bitte mit Hausverwaltung klären.', gelesen: false, ...B });
}

/** Zur Seite gelegte Daten verwerfen (der Nutzer richtet bewusst neu ein) */
export async function sicherungVerwerfen(): Promise<void> {
  await speicher.loeschen().catch(() => {});
}
