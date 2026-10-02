/**
 * Import-Assistent: Datei lesen, Zeilen prüfen (Fehler, Dubletten gegen den Bestand), übernehmen und
 * rückgängig machen.
 *
 * - Jedes Objekt existiert genau einmal: Angebote, Aufträge und Rechnungen verweisen per `kundeId` auf
 *   einen vorhandenen (oder im selben Import angelegten) Kunden – keine Kopie von Namen oder Adressen.
 * - Geld in Cent. `beispiel` wird nie gesetzt: übernommene Daten sind echte Daten.
 * - Jeder Import ist ein Eintrag in `importe` mit allen angelegten Objekten und den alten Werten geänderter
 *   Objekte. „Rückgängig“ legt alles Angelegte in den Papierkorb und stellt die alten Werte wieder her.
 */
import { aktuellerNutzerId, batch, db, defineCollection, sammlung, type Neu } from '@core/db';
import { emit } from '@core/events';
import { alsAkteur } from '@core/akteur';
import { naechsteNummer } from '@core/nummern';
import { plusTage, heute } from '@core/format';
import type { Angebot, Artikel, Auftrag, Basis, Bezug, Cent, ID, Kunde, Leistung, Mitarbeiter, Phase, Position, Rechnung, Rolle } from '@core/objects';
import { aehnlicheKunden, normEmail, normName } from '@modules/kunden/daten';
import { einheitAus, findeArtikel } from '@modules/artikel/daten';
import { naechsteFarbe } from '@modules/mitarbeiter/team';
import { csvZeilen, textDekodieren } from '@modules/onboarding/daten';
import { istXlsx, xlsxZeilen } from '@modules/onboarding/xlsx';
import { artDef, datumAus, geldAus, ibanGueltig, tabelleAus, zahlLesen, type ImportArt, type Tabelle, type Zuordnung } from './erkennen';

// ------------------------------------------------------------------ Sammlung

export interface ImportLauf extends Basis {
  art: ImportArt;
  dateiname?: string;
  /** angelegte Objekte in Reihenfolge des Anlegens */
  angelegt: Bezug[];
  /** geänderte Objekte mit den Werten von vorher */
  geaendert: { bezug: Bezug; vorher: Record<string, unknown> }[];
  /** Zeilen mit Fehler / doppelt – übersprungen */
  fehler: number;
  doppelt: number;
  /** verständliche Meldungen („Zeile 14: E-Mail fehlt das @“) */
  meldungen: string[];
  rueckgaengigAm?: string;
}

export const importe = defineCollection<ImportLauf>('importe');

// ------------------------------------------------------------------ Datei lesen

/** Bytes einer Datei (ältere Browser/jsdom kennen `Blob.arrayBuffer` nicht) */
function bytes(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer();
  return new Promise((ok, fehler) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as ArrayBuffer);
    r.onerror = () => fehler(r.error);
    r.readAsArrayBuffer(b);
  });
}

export type DateiErgebnis = { ok: true; tabelle: Tabelle } | { ok: false; fehler: string };

/** Excel (.xlsx) oder CSV in eine Tabelle mit Kopfzeile lesen – dieselben Leser wie in der Einrichtung */
export async function dateiLesen(datei: Blob & { name?: string }): Promise<DateiErgebnis> {
  try {
    const daten = await bytes(datei);
    if (/\.(xls|numbers|ods)$/i.test(datei.name ?? '') && !istXlsx(daten))
      return { ok: false, fehler: 'Dieses Dateiformat kann Macher nicht lesen. Speichere die Liste in Excel als .xlsx oder als CSV.' };
    const roh = istXlsx(daten) ? await xlsxZeilen(daten) : csvZeilen(textDekodieren(daten));
    return tabelleErgebnis(roh);
  } catch (e) {
    return { ok: false, fehler: e instanceof Error && e.message ? e.message : 'Die Datei konnte nicht gelesen werden. Speichere sie als CSV und versuche es erneut.' };
  }
}

export function tabelleErgebnis(roh: string[][]): DateiErgebnis {
  const t = tabelleAus(roh);
  if (!t) return { ok: false, fehler: 'Die Datei ist leer. Die erste Zeile braucht Überschriften, darunter je Zeile ein Eintrag.' };
  if (!t.zeilen.length) return { ok: false, fehler: 'In der Datei stehen nur Überschriften. Darunter fehlt je Zeile ein Eintrag.' };
  return { ok: true, tabelle: t };
}

// ------------------------------------------------------------------ Prüfen

export type ZeilenStatus = 'neu' | 'aktualisieren' | 'doppelt' | 'fehler';

export interface VorschauZeile {
  /** Zeile in der Datei (1-basiert) */
  zeile: number;
  status: ZeilenStatus;
  /** kurzer Titel für die Vorschau („Petra Schulz“, „R-2025-0101“) */
  titel: string;
  /** weitere Angaben für die Vorschau */
  info?: string;
  /** verständliche Fehler, z. B. „E-Mail fehlt das @“ */
  fehler: string[];
  /** Grund für „doppelt“ oder Hinweis („neuer Kunde wird angelegt“) */
  hinweis?: string;
  /** zugeordnete Rohwerte je Feld */
  werte: Record<string, string>;
}

export interface Vorschau {
  art: ImportArt;
  zeilen: VorschauZeile[];
  neu: number;
  aktualisieren: number;
  doppelt: number;
  fehler: number;
  /** Kunden, die für Angebote/Aufträge/Rechnungen neu angelegt werden */
  neueKunden: number;
}

const leer = (s: string | undefined) => !s || !s.trim();

/** Rohwerte einer Zeile je Feld; mehrere Spalten für dasselbe Feld: die erste gefüllte zählt */
export function werteVon(zeile: string[], z: Zuordnung): Record<string, string> {
  const w: Record<string, string> = {};
  for (const [spalte, feld] of Object.entries(z)) {
    if (!feld) continue;
    const v = (zeile[Number(spalte)] ?? '').trim();
    if (v && !w[feld]) w[feld] = v;
  }
  return w;
}

/** Feldprüfung nach Wertemuster – Texte in Handwerkersprache */
export function feldFehler(art: ImportArt, w: Record<string, string>): string[] {
  const f: string[] = [];
  for (const feld of artDef(art).felder) {
    const v = w[feld.id];
    if (leer(v)) continue;
    switch (feld.muster) {
      case 'email':
        if (!v.includes('@')) f.push(`${feld.label} fehlt das @`);
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) f.push(`${feld.label} „${v}“ ist unvollständig`);
        break;
      case 'plz':
        if (!/^\d{4,5}$/.test(v)) f.push(`PLZ „${v}“ hat nicht 5 Ziffern`);
        break;
      case 'iban':
        if (!ibanGueltig(v)) f.push(`IBAN „${v}“ stimmt nicht – bitte Ziffern prüfen`);
        break;
      case 'datum':
        if (!datumAus(v)) f.push(`${feld.label} „${v}“ ist kein gültiges Datum`);
        break;
      case 'geld':
        if (geldAus(v) == null) f.push(`${feld.label} „${v}“ ist kein Betrag`);
        break;
      case 'zahl':
        if (zahlLesen(v) == null) f.push(`${feld.label} „${v}“ ist keine Zahl`);
        break;
      case 'telefon':
        if (v.replace(/\D/g, '').length < 5) f.push(`${feld.label} „${v}“ ist zu kurz`);
        break;
    }
  }
  return f;
}

// ---- Kunden auflösen (für Ansprechpartner, Angebote, Aufträge, Rechnungen)

interface KundenSuche {
  /** vorhandener Kunde oder Name des Kunden, der neu angelegt wird */
  kunde?: Kunde;
  neuName?: string;
}

function kundeFinden(w: Record<string, string>, bestand: Kunde[]): KundenSuche {
  const nummer = w.kundeNummer?.trim();
  if (nummer) {
    const k = bestand.find((x) => x.nummer && x.nummer.trim().toLowerCase() === nummer.toLowerCase());
    if (k) return { kunde: k };
  }
  const name = w.kundeName?.trim();
  if (name) {
    const n = normName(name);
    const k = bestand.find((x) => normName(x.name) === n || (x.firma && normName(x.firma) === n));
    if (k) return { kunde: k };
    return { neuName: name };
  }
  return {};
}

/** Name eines Kunden aus einer Kundenzeile */
function kundenName(w: Record<string, string>): string | undefined {
  const person = [w.vorname, w.nachname].filter(Boolean).join(' ') || w.person;
  return w.name || w.firma || person || undefined;
}

function kundeAusWerten(w: Record<string, string>): Neu<Kunde> {
  const person = [w.vorname, w.nachname].filter(Boolean).join(' ') || w.person;
  const name = kundenName(w) ?? '';
  const strasse = [w.strasse, w.hausnummer].filter(Boolean).join(' ');
  const telefon = w.telefon || w.mobil;
  return {
    art: w.firma ? 'firma' : 'privat',
    name,
    firma: w.firma || undefined,
    telefon: telefon || undefined,
    email: w.email || undefined,
    // Excel macht aus „01067“ gern „1067“
    adresse: strasse || w.plz || w.ort ? { strasse, plz: /^\d{4}$/.test(w.plz ?? '') ? `0${w.plz}` : (w.plz ?? ''), ort: w.ort ?? '' } : undefined,
    nummer: w.nummer || undefined,
    notiz: [w.notiz, w.iban ? `IBAN: ${w.iban}` : ''].filter(Boolean).join('\n') || undefined,
    ansprechpartner: [
      ...(w.firma && person && person !== name ? [{ id: 'ap1', name: person, telefon: w.telefon || undefined, email: w.email || undefined }] : []),
      ...(w.telefon && w.mobil && w.mobil !== w.telefon ? [{ id: 'ap-mobil', name: `${person || name} (Handy)`, telefon: w.mobil }] : []),
    ],
    quelle: 'sonstiges',
  };
}

function mitarbeiterName(w: Record<string, string>): { vorname: string; nachname: string } {
  if (w.vorname || !w.nachname?.includes(' ')) return { vorname: w.vorname ?? '', nachname: w.nachname ?? '' };
  // „Max Mustermann“ in einer Spalte
  const teile = w.nachname.trim().split(/\s+/);
  if (w.nachname.includes(',')) {
    const [nach, vor] = w.nachname.split(',').map((x) => x.trim());
    return { vorname: vor, nachname: nach };
  }
  return { vorname: teile.slice(0, -1).join(' '), nachname: teile[teile.length - 1] };
}

export function rolleAus(t: string | undefined): Rolle {
  const n = (t ?? '').toLowerCase();
  if (/chef|inhaber|meister.*inhaber|geschäftsführ|geschaeftsfuehr/.test(n)) return 'chef';
  if (/büro|buero|verwaltung|sekret|buchhalt|disposit|kauffrau|kaufmann/.test(n)) return 'buero';
  if (/azubi|auszubild|lehrling|ausbildung/.test(n)) return 'azubi';
  return 'monteur';
}

export function phaseAus(t: string | undefined): Phase {
  const n = (t ?? '').toLowerCase();
  if (/anfrage/.test(n)) return 'anfrage';
  if (/besichtig/.test(n)) return 'besichtigung';
  if (/angebot/.test(n)) return 'angebot';
  if (/arbeit|lauf|begonnen|ausführ|ausfuehr|baustelle/.test(n)) return 'in_arbeit';
  if (/abnahme/.test(n)) return 'abnahme';
  if (/abrechn|rechnung/.test(n)) return 'abrechnung';
  return 'beauftragt';
}

/**
 * Alle Zeilen prüfen: Pflichtfelder, Wertemuster, Dubletten in der Datei und gegen den Bestand.
 * Ändert nichts.
 */
export function pruefen(art: ImportArt, t: Tabelle, z: Zuordnung): Vorschau {
  const bestandKunden = db.kunden.all();
  const zeilen: VorschauZeile[] = [];
  const gesehen = new Map<string, number>();
  const neueKundenNamen = new Set<string>();
  /** Kunden aus dieser Datei (für Dubletten innerhalb der Datei) */
  const dateiKunden: { zeile: number; k: Neu<Kunde> }[] = [];

  const doppeltIn = (schluessel: string, nr: number): number | undefined => {
    const vorher = gesehen.get(schluessel);
    if (vorher == null) gesehen.set(schluessel, nr);
    return vorher;
  };

  t.zeilen.forEach((zeile, i) => {
    const nr = t.zeilenNr[i];
    const w = werteVon(zeile, z);
    const fehler = feldFehler(art, w);
    let status: ZeilenStatus = 'neu';
    let hinweis: string | undefined;
    let titel = '';
    let info: string | undefined;
    const doppelt = (grund: string) => {
      status = 'doppelt';
      hinweis = grund;
    };

    switch (art) {
      case 'kunden': {
        const k = kundeAusWerten(w);
        titel = k.name;
        info = [w.nummer, k.adresse?.ort, k.telefon, k.email].filter(Boolean).join(' · ');
        if (!k.name) fehler.unshift('Name fehlt');
        if (!fehler.length) {
          const imBestand = aehnlicheKunden(k as Kunde, bestandKunden)[0] ?? (k.nummer ? bestandKunden.find((x) => x.nummer === k.nummer) : undefined);
          const inDatei = dateiKunden.find((d) => aehnlicheKunden(k as Kunde, [d.k as Kunde]).length);
          if (imBestand) {
            status = 'doppelt';
            hinweis = `gibt es schon: ${imBestand.name}${imBestand.nummer ? ` (${imBestand.nummer})` : ''}`;
          } else if (inDatei) {
            status = 'doppelt';
            hinweis = `steht schon in Zeile ${inDatei.zeile}`;
          } else dateiKunden.push({ zeile: nr, k });
        }
        break;
      }
      case 'ansprechpartner': {
        const name = [w.vorname, w.nachname].filter(Boolean).join(' ') || w.name || '';
        titel = name;
        const { kunde, neuName } = kundeFinden(w, bestandKunden);
        info = [kunde?.name ?? neuName ?? w.kundeNummer, w.funktion, w.telefon].filter(Boolean).join(' · ');
        if (!name) fehler.unshift('Name fehlt');
        if (!kunde) fehler.push(w.kundeNummer || w.kundeName ? `Kunde „${w.kundeName || w.kundeNummer}“ gibt es noch nicht – zuerst Kunden übernehmen` : 'Kunde fehlt');
        if (!fehler.length && kunde) {
          if (kunde.ansprechpartner.some((a) => normName(a.name) === normName(name))) {
            status = 'doppelt';
            hinweis = `steht schon bei ${kunde.name}`;
          } else {
            const d = doppeltIn(`${kunde.id}|${normName(name)}`, nr);
            if (d) doppelt(`steht schon in Zeile ${d}`);
            else status = 'aktualisieren';
          }
        }
        break;
      }
      case 'mitarbeiter': {
        const { vorname, nachname } = mitarbeiterName(w);
        titel = [vorname, nachname].filter(Boolean).join(' ');
        info = [w.rolle, w.telefon, w.email].filter(Boolean).join(' · ');
        if (!nachname && !vorname) fehler.unshift('Name fehlt');
        if (!fehler.length) {
          const vorhanden = db.mitarbeiter.all().find((m) => (normName(`${m.vorname} ${m.nachname}`) === normName(titel)) || (w.email && normEmail(m.email) === normEmail(w.email)));
          const d = doppeltIn(normName(titel), nr);
          if (vorhanden) doppelt(`gibt es schon: ${vorhanden.vorname} ${vorhanden.nachname}`);
          else if (d) doppelt(`steht schon in Zeile ${d}`);
        }
        break;
      }
      case 'artikel': {
        titel = w.name ?? '';
        info = [w.nummer, w.einheit, w.vk ? `VK ${w.vk}` : ''].filter(Boolean).join(' · ');
        if (!w.name) fehler.unshift('Bezeichnung fehlt');
        if (!fehler.length) {
          const vorhanden = findeArtikel({ nummer: w.nummer, ean: w.ean }) ?? (!w.nummer && !w.ean ? db.artikel.all().find((a) => normName(a.name) === normName(w.name)) : undefined);
          const d = doppeltIn(w.nummer || w.ean || normName(w.name), nr);
          if (vorhanden) doppelt(`gibt es schon: ${vorhanden.name}${vorhanden.nummer ? ` (${vorhanden.nummer})` : ''} – neue Preise über „Preise“ übernehmen`);
          else if (d) doppelt(`steht schon in Zeile ${d}`);
        }
        break;
      }
      case 'leistungen': {
        titel = w.name ?? '';
        info = [w.einheit, w.preis, w.minuten ? `${w.minuten} Min.` : ''].filter(Boolean).join(' · ');
        if (!w.name) fehler.unshift('Bezeichnung der Leistung fehlt');
        if (!fehler.length) {
          const vorhanden = db.leistungen.all().find((l) => normName(l.name) === normName(w.name));
          const d = doppeltIn(normName(w.name), nr);
          if (vorhanden) doppelt(`gibt es schon: ${vorhanden.name}`);
          else if (d) doppelt(`steht schon in Zeile ${d}`);
        }
        break;
      }
      case 'preise': {
        titel = w.name || w.nummer || '';
        info = w.preis;
        if (!w.preis && !w.ek) fehler.push('Preis fehlt');
        if (!w.name && !w.nummer) fehler.unshift('Bezeichnung oder Artikelnummer fehlt');
        if (!fehler.length) {
          const ziel = preisZiel(w);
          if (!ziel) fehler.push(`„${titel}“ gibt es weder bei deinen Leistungen noch bei deinen Artikeln`);
          else {
            status = 'aktualisieren';
            const alt = ziel.typ === 'leistungen' ? db.leistungen.get(ziel.id)!.preis : db.artikel.get(ziel.id)!.vk;
            hinweis = `${ziel.typ === 'leistungen' ? 'Leistung' : 'Artikel'}: ${ziel.name}, bisher ${(alt / 100).toFixed(2).replace('.', ',')} €`;
            const d = doppeltIn(`${ziel.typ}|${ziel.id}`, nr);
            if (d) doppelt(`steht schon in Zeile ${d}`);
          }
        }
        break;
      }
      case 'angebote':
      case 'auftraege':
      case 'rechnungen': {
        const { kunde, neuName } = kundeFinden(w, bestandKunden);
        titel = w.nummer || w.titel || '';
        info = [kunde?.name ?? neuName, w.titel && w.titel !== titel ? w.titel : '', w.brutto || w.netto].filter(Boolean).join(' · ');
        if (!kunde && !neuName) fehler.push(w.kundeNummer ? `Kunde mit Nummer „${w.kundeNummer}“ gibt es nicht und ein Kundenname fehlt` : 'Kunde fehlt');
        if (art !== 'auftraege' && !w.netto && !w.brutto) fehler.push('Betrag fehlt');
        if (art === 'auftraege' && !w.titel) fehler.unshift('Bezeichnung fehlt');
        if (art === 'rechnungen' && !w.nummer) fehler.unshift('Rechnungsnummer fehlt');
        if (!fehler.length) {
          const liste: { nummer: string }[] = art === 'angebote' ? db.angebote.allMitGeloeschten() : art === 'auftraege' ? db.auftraege.allMitGeloeschten() : db.rechnungen.allMitGeloeschten();
          const vorhanden = w.nummer ? liste.find((x) => x.nummer === w.nummer) : undefined;
          const d = w.nummer ? doppeltIn(w.nummer, nr) : undefined;
          if (vorhanden) doppelt(`Nummer ${w.nummer} gibt es schon`);
          else if (d) doppelt(`steht schon in Zeile ${d}`);
          else if (neuName) {
            hinweis = `neuer Kunde „${neuName}“ wird angelegt`;
            neueKundenNamen.add(normName(neuName));
          }
        }
        break;
      }
    }
    if (fehler.length) status = 'fehler';
    zeilen.push({ zeile: nr, status, titel: titel || `Zeile ${nr}`, info: info || undefined, fehler, hinweis, werte: w });
  });

  const zaehle = (s: ZeilenStatus) => zeilen.filter((x) => x.status === s).length;
  return { art, zeilen, neu: zaehle('neu'), aktualisieren: zaehle('aktualisieren'), doppelt: zaehle('doppelt'), fehler: zaehle('fehler'), neueKunden: neueKundenNamen.size };
}

function preisZiel(w: Record<string, string>): { typ: 'leistungen' | 'artikel'; id: ID; name: string } | undefined {
  const a = w.nummer ? findeArtikel({ nummer: w.nummer, ean: w.nummer }) : undefined;
  if (a) return { typ: 'artikel', id: a.id, name: a.name };
  if (w.name) {
    const n = normName(w.name);
    const l = db.leistungen.all().find((x) => normName(x.name) === n);
    if (l) return { typ: 'leistungen', id: l.id, name: l.name };
    const art = db.artikel.all().find((x) => normName(x.name) === n);
    if (art) return { typ: 'artikel', id: art.id, name: art.name };
  }
  return undefined;
}

/** Fehlermeldungen in der Form „Zeile 14: E-Mail fehlt das @“ */
export function fehlerTexte(v: Vorschau): string[] {
  return v.zeilen.filter((z) => z.status === 'fehler').map((z) => `Zeile ${z.zeile}: ${z.fehler.join(', ')}`);
}

/** „42 Kunden, 3 doppelt, 2 mit Fehler“ */
export function zusammenfassung(v: Vorschau): string {
  const def = artDef(v.art);
  const n = v.neu + v.aktualisieren;
  const teile = [`${n} ${n === 1 ? def.einzahl : def.label.replace(/^Offene /, '')}`];
  if (v.doppelt) teile.push(`${v.doppelt} doppelt`);
  if (v.fehler) teile.push(`${v.fehler} mit Fehler`);
  return teile.join(', ');
}

// ------------------------------------------------------------------ Übernehmen

function ustSatz(): number {
  const b = db.betrieb.get('betrieb');
  return b?.kleinunternehmer ? 0 : (b?.ustSatz ?? 19);
}

/** Netto in Cent aus den Werten einer Zeile (Brutto wird mit dem USt-Satz des Betriebs umgerechnet) */
export function nettoAus(w: Record<string, string>, ust = ustSatz()): Cent {
  const netto = geldAus(w.netto);
  if (netto != null) return netto;
  const brutto = geldAus(w.brutto) ?? 0;
  return Math.round(brutto / (1 + ust / 100));
}

function position(text: string, netto: Cent): Position {
  return { id: 'p1', art: 'pauschal', text, menge: 1, einheit: 'Psch', einzelpreis: netto };
}

/**
 * Übernimmt alle Zeilen mit Status „neu“ oder „aktualisieren“ in einem Rutsch.
 * Meldet `import.abgeschlossen` und gibt den Import-Eintrag zurück (für „Rückgängig“).
 */
export function importAusfuehren(v: Vorschau, opts: { dateiname?: string } = {}): ImportLauf {
  // Audit: alles, was der Import ändert, steht im Verlauf als „durch Import“ (im Auftrag des Menschen, der ihn startet)
  return alsAkteur({ quelle: 'import', id: `import.${v.art}`, name: 'Import', mitarbeiterId: aktuellerNutzerId() }, () => uebernehmen(v, opts));
}

function uebernehmen(v: Vorschau, opts: { dateiname?: string }): ImportLauf {
  const angelegt: Bezug[] = [];
  const geaendert: ImportLauf['geaendert'] = [];
  const ust = ustSatz();
  const kundenCache = new Map<string, ID>();
  const auftragNachNummer = new Map<string, ID>();
  const ziel = db.betrieb.get('betrieb')?.zahlungszielTage ?? 14;

  const anlegen = <T extends Basis>(typ: string, neu: Neu<T>): T => {
    const col = sammlung<T>(typ)!;
    const obj = col.create(neu);
    angelegt.push({ typ, id: obj.id });
    return obj;
  };
  const aendern = <T extends Basis>(typ: string, id: ID, patch: Partial<T>, text: string) => {
    const col = sammlung<T>(typ)!;
    const alt = col.get(id);
    if (!alt) return;
    const vorher = Object.fromEntries(Object.keys(patch).map((k) => [k, (alt as unknown as Record<string, unknown>)[k]]));
    geaendert.push({ bezug: { typ, id }, vorher });
    col.update(id, patch, { text });
  };
  const kundeId = (w: Record<string, string>): ID | undefined => {
    const { kunde, neuName } = kundeFinden(w, db.kunden.all());
    if (kunde) return kunde.id;
    if (!neuName) return undefined;
    const key = normName(neuName);
    if (!kundenCache.has(key)) {
      const k = anlegen<Kunde>('kunden', { art: 'privat', name: neuName, nummer: w.kundeNummer || undefined, ansprechpartner: [], quelle: 'sonstiges' });
      kundenCache.set(key, k.id);
    }
    return kundenCache.get(key);
  };

  batch(() => {
    for (const z of v.zeilen) {
      if (z.status !== 'neu' && z.status !== 'aktualisieren') continue;
      const w = z.werte;
      switch (v.art) {
        case 'kunden':
          anlegen<Kunde>('kunden', kundeAusWerten(w));
          break;
        case 'ansprechpartner': {
          const k = kundeFinden(w, db.kunden.all()).kunde;
          if (!k) break;
          const name = [w.vorname, w.nachname].filter(Boolean).join(' ') || w.name;
          const aktuell = db.kunden.get(k.id)!;
          aendern<Kunde>(
            'kunden',
            k.id,
            { ansprechpartner: [...aktuell.ansprechpartner, { id: `ap-${aktuell.ansprechpartner.length + 1}-${z.zeile}`, name, funktion: w.funktion || undefined, telefon: w.telefon || undefined, email: w.email || undefined }] },
            `Ansprechpartner ${name} übernommen`,
          );
          break;
        }
        case 'mitarbeiter': {
          const { vorname, nachname } = mitarbeiterName(w);
          const rolle = rolleAus(w.rolle);
          // Vertragswerte vom Team übernehmen, wenn die Datei keine hat – danach im Profil prüfen
          const vorbild = db.mitarbeiter.where((x) => x.aktiv && x.rolle === rolle)[0] ?? db.mitarbeiter.where((x) => x.aktiv && x.rolle !== 'chef')[0];
          anlegen<Mitarbeiter>('mitarbeiter', {
            vorname: vorname || nachname,
            nachname: vorname ? nachname : '',
            rolle,
            telefon: w.telefon || undefined,
            email: w.email || undefined,
            team: w.team || undefined,
            wochenstunden: zahlLesen(w.wochenstunden) ?? vorbild?.wochenstunden ?? 40,
            urlaubstageJahr: zahlLesen(w.urlaubstage) ?? vorbild?.urlaubstageJahr ?? 30,
            eintritt: datumAus(w.eintritt),
            kostensatz: 0,
            aktiv: true,
            farbe: naechsteFarbe(),
          });
          break;
        }
        case 'artikel':
          anlegen<Artikel>('artikel', {
            name: w.name,
            nummer: w.nummer || undefined,
            ean: w.ean || undefined,
            herstellerNummer: w.herstellerNummer || undefined,
            einheit: einheitAus(w.einheit),
            ek: geldAus(w.ek) ?? 0,
            vk: geldAus(w.vk) ?? 0,
            kategorie: w.kategorie || undefined,
            ...(w.mindestbestand ? { mindestbestand: zahlLesen(w.mindestbestand) } : {}),
            aktiv: true,
          });
          break;
        case 'leistungen':
          anlegen<Leistung>('leistungen', {
            name: w.name,
            beschreibung: w.beschreibung || undefined,
            einheit: w.einheit ? einheitAus(w.einheit) : 'Stk',
            preis: geldAus(w.preis) ?? 0,
            minuten: w.minuten ? Math.round(zahlLesen(w.minuten) ?? 0) || undefined : undefined,
            kategorie: w.kategorie || undefined,
            aktiv: true,
          });
          break;
        case 'preise': {
          const zielObj = preisZiel(w);
          if (!zielObj) break;
          const preis = geldAus(w.preis);
          const ek = geldAus(w.ek);
          if (zielObj.typ === 'leistungen') {
            if (preis != null) aendern<Leistung>('leistungen', zielObj.id, { preis }, 'Preis aus Datei übernommen');
          } else aendern<Artikel>('artikel', zielObj.id, { ...(preis != null ? { vk: preis } : {}), ...(ek != null ? { ek } : {}) }, 'Preis aus Datei übernommen');
          break;
        }
        case 'angebote': {
          const kId = kundeId(w);
          if (!kId) break;
          const netto = nettoAus(w, ust);
          const titel = w.titel || `Angebot ${w.nummer ?? ''}`.trim();
          const datum = datumAus(w.datum) ?? heute();
          const auftrag = anlegen<Auftrag>('auftraege', { nummer: naechsteNummer('auftrag'), titel, art: 'projekt', phase: 'angebot', kundeId: kId });
          anlegen<Angebot>('angebote', {
            nummer: w.nummer || naechsteNummer('angebot'),
            auftragId: auftrag.id,
            kundeId: kId,
            titel,
            positionen: [position(titel, netto)],
            status: 'versendet',
            datum,
            gueltigBis: datumAus(w.gueltigBis) ?? plusTage(datum, 30),
            version: 1,
          });
          break;
        }
        case 'auftraege': {
          const kId = kundeId(w);
          if (!kId) break;
          const a = anlegen<Auftrag>('auftraege', {
            nummer: w.nummer || naechsteNummer('auftrag'),
            titel: w.titel,
            art: 'projekt',
            phase: phaseAus(w.status),
            kundeId: kId,
            beschreibung: w.beschreibung || undefined,
            wunschtermin: w.wunschtermin || undefined,
          });
          if (w.nummer) auftragNachNummer.set(w.nummer, a.id);
          break;
        }
        case 'rechnungen': {
          const kId = kundeId(w);
          if (!kId) break;
          const netto = nettoAus(w, ust);
          const datum = datumAus(w.datum) ?? heute();
          const auftragId = w.auftragNummer ? (auftragNachNummer.get(w.auftragNummer) ?? db.auftraege.all().find((a) => a.nummer === w.auftragNummer)?.id) : undefined;
          anlegen<Rechnung>('rechnungen', {
            nummer: w.nummer,
            art: 'rechnung',
            auftragId,
            kundeId: kId,
            titel: w.titel || `Rechnung ${w.nummer}`,
            positionen: [position(w.titel || 'Übernommene Rechnung', netto)],
            status: 'versendet',
            datum,
            faelligAm: datumAus(w.faelligAm) ?? plusTage(datum, ziel),
            mahnstufe: 0,
          });
          break;
        }
      }
    }
  });

  const lauf = importe.create({
    art: v.art,
    dateiname: opts.dateiname,
    angelegt,
    geaendert,
    fehler: v.fehler,
    doppelt: v.doppelt,
    meldungen: fehlerTexte(v),
  });
  emit({ typ: 'import.abgeschlossen', objekt: lauf, daten: { art: v.art, angelegt: angelegt.length, geaendert: geaendert.length, fehler: v.fehler, doppelt: v.doppelt } });
  return lauf;
}

/** Ganzen Import zurücknehmen: Angelegtes in den Papierkorb, Geändertes auf den alten Stand */
export function importRueckgaengig(id: ID): { entfernt: number; zurueck: number } {
  return alsAkteur({ quelle: 'import', id: 'import.rueckgaengig', name: 'Import', mitarbeiterId: aktuellerNutzerId() }, () => zuruecknehmen(id));
}

function zuruecknehmen(id: ID): { entfernt: number; zurueck: number } {
  const lauf = importe.get(id);
  if (!lauf || lauf.rueckgaengigAm) return { entfernt: 0, zurueck: 0 };
  let entfernt = 0;
  let zurueck = 0;
  batch(() => {
    for (const g of [...lauf.geaendert].reverse()) {
      const col = sammlung(g.bezug.typ);
      if (col?.get(g.bezug.id)) {
        col.update(g.bezug.id, g.vorher as Partial<Basis>, { text: 'Import rückgängig gemacht' });
        zurueck++;
      }
    }
    for (const b of [...lauf.angelegt].reverse()) {
      const col = sammlung(b.typ);
      const obj = col?.get(b.id);
      if (col && obj && !obj.geloeschtAm) {
        col.remove(b.id);
        entfernt++;
      }
    }
    importe.update(id, { rueckgaengigAm: new Date().toISOString() }, { text: 'Rückgängig gemacht' });
  });
  emit({ typ: 'import.rueckgaengig', objekt: importe.get(id), daten: { entfernt, zurueck } });
  return { entfernt, zurueck };
}

/** Wohin nach dem Import? Liste der übernommenen Objektart */
export const ZIEL_PFAD: Record<ImportArt, string> = {
  kunden: '/auftraege/kunden',
  ansprechpartner: '/auftraege/kunden',
  mitarbeiter: '/betrieb/mitarbeiter',
  artikel: '/betrieb/artikel',
  leistungen: '/betrieb/leistungen',
  preise: '/betrieb/leistungen',
  angebote: '/auftraege/angebote',
  auftraege: '/auftraege/auftraege',
  rechnungen: '/betrieb/rechnungen',
};
