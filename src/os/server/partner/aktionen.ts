/**
 * Action API v1 – Katalog und Geschäftslogik der Aktionen für Partner (zuerst HeyLotte).
 *
 * HeyLotte versteht, Handwerk OS entscheidet und führt aus: Der Partner sagt nur, *was* passieren soll
 * (`create-customer` mit Name und Telefon). Welche Sammlungen betroffen sind, wie Nummern vergeben werden und
 * welche Rechte gelten, bleibt hier. Jede Aktion trägt dieselbe ID wie im Macher-Gateway der App
 * (`customer.create`), dasselbe Risiko und dieselben Rechte.
 *
 * Alles hier ist rein: Die Aktion bekommt die geladenen Objekte und gibt zurück, was zu schreiben ist.
 * Laden, Schreiben, Protokoll und Ereignisse übernimmt `dienst.ts`.
 *
 * Feldnamen nach außen sind englisch in snake_case (wie im Architektur-Papier), Texte für Menschen deutsch.
 */
import type { Recht } from '@core/rechte';
import type { Angebot, Aufgabe, Auftrag, Basis, Betrieb, Bezug, Einheit, ID, Kunde, Mitarbeiter, Position } from '@core/objects';
import { summen } from '@core/format';
import { naechsteNummerFuer, projektNummerFuer } from '@core/projektnummer';
import { aehnlicheKunden, kundennummerNach, normName, normTelefon } from '@modules/kunden/dubletten';

export type Risiko = 'lesen' | 'schreiben' | 'kritisch';

/** Eine Zeile in `objekte` */
export interface ObjektZeile {
  sammlung: string;
  id: ID;
  daten: Record<string, unknown> & Partial<Basis>;
}

/** Wer handelt – der zugeordnete Mitarbeiter, für den der Partner spricht */
export interface Handelnder {
  mitarbeiter: Pick<Mitarbeiter, 'id' | 'vorname' | 'nachname' | 'rolle'>;
  rechte: Recht[];
}

export interface AktionsKontext {
  handelnder: Handelnder;
  jetzt: Date;
  neueId: (praefix?: string) => string;
  /** Kurzname des Partners für Texte im Verlauf („HeyLotte“) */
  partnerName: string;
}

/** Geladene Objekte je Sammlung – inklusive Papierkorb (`geloeschtAm`), damit Nummern nie doppelt vergeben werden */
export type Bestand = Record<string, ObjektZeile['daten'][]>;

/** Ein Ereignis, das an den Partner zurückgeht (API-Name aus dem Ereigniskatalog, z. B. `customer.created`) */
export interface PartnerEreignis {
  typ: string;
  objekt: Bezug;
  daten: Record<string, unknown>;
}

export type Ergebnis =
  | { art: 'antwort'; status: number; antwort: Record<string, unknown> }
  | {
      art: 'geaendert';
      status: number;
      antwort: Record<string, unknown>;
      zeilen: ObjektZeile[];
      bezug: Bezug;
      /** Klartext für den Verlauf am Objekt („Kunde angelegt – über HeyLotte für Jonas Weber“) */
      verlauf: string;
      /** weitere Einträge im Verlauf, z. B. am Auftrag, der für ein Angebot angelegt oder weitergeschaltet wurde */
      weitereVerlaeufe?: { bezug: Bezug; text: string; aenderung: 'created' | 'updated' }[];
      ereignisse: PartnerEreignis[];
    };

export interface FeldBeschreibung {
  typ: 'string' | 'number' | 'boolean' | 'object';
  pflicht?: boolean;
  beschreibung: string;
  werte?: string[];
}

export interface PartnerAktion<E = unknown> {
  /** Name in der Adresse: `POST /v1/actions/<name>` */
  name: string;
  /** dieselbe ID wie im Macher-Gateway der App */
  gateway: string;
  beschreibung: string;
  risiko: Risiko;
  rechte: Recht[];
  /** Sammlungen, die die Aktion lesen muss */
  liest: string[];
  eingabe: Record<string, FeldBeschreibung>;
  /** Eingabe prüfen und in die interne Form bringen – Fehlertext für den Menschen */
  pruefe(roh: Record<string, unknown>): { daten: E } | { fehler: string; feld?: string };
  fuehreAus(daten: E, k: AktionsKontext, bestand: Bestand): Ergebnis;
}

// ------------------------------------------------------------------ Eingaben prüfen

const text = (roh: Record<string, unknown>, feld: string, max = 200): string | undefined => {
  const v = roh[feld];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new Eingabefehler(`„${feld}“ muss Text sein.`, feld);
  const t = v.trim();
  if (t.length > max) throw new Eingabefehler(`„${feld}“ ist zu lang (höchstens ${max} Zeichen).`, feld);
  return t || undefined;
};

class Eingabefehler extends Error {
  constructor(
    message: string,
    readonly feld?: string,
  ) {
    super(message);
  }
}

function pruefeMit<E>(fn: (roh: Record<string, unknown>) => E): PartnerAktion<E>['pruefe'] {
  return (roh) => {
    try {
      return { daten: fn(roh) };
    } catch (e) {
      if (e instanceof Eingabefehler) return { fehler: e.message, feld: e.feld };
      throw e;
    }
  };
}

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;
const istEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const aktiv = <T extends Partial<Basis>>(liste: T[] | undefined) => (liste ?? []).filter((x) => !x.geloeschtAm);
const nameVon = (m: Handelnder['mitarbeiter']) => [m.vorname, m.nachname].filter(Boolean).join(' ') || 'Mitarbeiter';

// ------------------------------------------------------------------ Kunden

function kundeKurz(k: Kunde) {
  return {
    customer_id: k.id,
    name: k.name,
    number: k.nummer ?? null,
    city: k.adresse?.ort ?? null,
    phone: k.telefon ?? null,
    email: k.email ?? null,
  };
}

interface KundeSuchen {
  query: string;
  limit: number;
}

const kundeSuchen: PartnerAktion<KundeSuchen> = {
  name: 'find-customer',
  gateway: 'customer.find',
  beschreibung: 'Kunden nach Name, Firma, Telefon oder Kundennummer finden – damit der Partner eine customer_id bekommt.',
  risiko: 'lesen',
  rechte: ['lesen'],
  liest: ['kunden'],
  eingabe: {
    query: { typ: 'string', pflicht: true, beschreibung: 'Name, Firma, Telefonnummer oder Kundennummer, z. B. „Müller“' },
    limit: { typ: 'number', beschreibung: 'höchstens so viele Treffer (1–10, Standard 5)' },
  },
  pruefe: pruefeMit((roh) => {
    const query = text(roh, 'query', 120);
    if (!query || query.length < 2) throw new Eingabefehler('Wonach soll ich suchen? Mindestens zwei Zeichen.', 'query');
    const l = roh.limit === undefined ? 5 : Number(roh.limit);
    if (!Number.isInteger(l) || l < 1 || l > 10) throw new Eingabefehler('„limit“ muss eine Zahl von 1 bis 10 sein.', 'limit');
    return { query, limit: l };
  }),
  fuehreAus(d, _k, bestand) {
    const kunden = aktiv(bestand.kunden as unknown as Kunde[]);
    const q = normName(d.query);
    const tel = normTelefon(d.query);
    const bewertet = kunden
      .map((k) => {
        const n = normName(k.name);
        const f = normName(k.firma);
        let punkte = 0;
        if (k.nummer && k.nummer.toLowerCase() === d.query.toLowerCase()) punkte = 100;
        else if (tel.length >= 6 && [k.telefon, ...(k.ansprechpartner ?? []).map((a) => a.telefon)].some((t) => normTelefon(t) === tel)) punkte = 90;
        else if (q && (n === q || f === q)) punkte = 80;
        else if (q && (n.split(' ').includes(q) || f.split(' ').includes(q))) punkte = 60;
        else if (q && (n.includes(q) || f.includes(q))) punkte = 40;
        return { k, punkte };
      })
      .filter((x) => x.punkte > 0)
      .sort((a, b) => b.punkte - a.punkte || a.k.name.localeCompare(b.k.name, 'de'));
    return {
      art: 'antwort',
      status: 200,
      antwort: { status: 'ok', customers: bewertet.slice(0, d.limit).map((x) => kundeKurz(x.k)), total: bewertet.length },
    };
  },
};

interface KundeAnlegen {
  name: string;
  art?: Kunde['art'];
  telefon?: string;
  email?: string;
  adresse?: Kunde['adresse'];
  notiz?: string;
  dubletteErlaubt: boolean;
}

const KUNDEN_ARTEN: Kunde['art'][] = ['privat', 'firma', 'hausverwaltung', 'oeffentlich'];

const kundeAnlegen: PartnerAktion<KundeAnlegen> = {
  name: 'create-customer',
  gateway: 'customer.create',
  beschreibung: 'Kunden anlegen. Warnt vor möglichen Dubletten (409), außer allow_duplicate ist gesetzt.',
  risiko: 'schreiben',
  rechte: ['schreiben'],
  liest: ['kunden'],
  eingabe: {
    name: { typ: 'string', pflicht: true, beschreibung: 'Person oder Firma, z. B. „Familie Müller“ oder „Bäckerei Schmidt GmbH“' },
    type: { typ: 'string', beschreibung: 'Art des Kunden (Standard: aus dem Namen erkannt)', werte: KUNDEN_ARTEN },
    phone: { typ: 'string', beschreibung: 'Telefonnummer' },
    email: { typ: 'string', beschreibung: 'E-Mail-Adresse' },
    address: { typ: 'object', beschreibung: '{ street, zip, city } – alle drei oder keins' },
    note: { typ: 'string', beschreibung: 'Notiz zum Kunden' },
    allow_duplicate: { typ: 'boolean', beschreibung: 'true = trotz möglicher Dublette anlegen (erst nach Rückfrage beim Nutzer)' },
  },
  pruefe: pruefeMit((roh) => {
    const name = text(roh, 'name', 120);
    if (!name || name.length < 2) throw new Eingabefehler('Wie heißt der Kunde?', 'name');
    const art = text(roh, 'type', 20) as Kunde['art'] | undefined;
    if (art && !KUNDEN_ARTEN.includes(art)) throw new Eingabefehler(`„type“ ist eins von: ${KUNDEN_ARTEN.join(', ')}.`, 'type');
    const telefon = text(roh, 'phone', 40);
    if (telefon && normTelefon(telefon).length < 5) throw new Eingabefehler('Die Telefonnummer sieht nicht vollständig aus.', 'phone');
    const email = text(roh, 'email', 200);
    if (email && !istEmail(email)) throw new Eingabefehler('Die E-Mail-Adresse sieht nicht richtig aus.', 'email');
    let adresse: Kunde['adresse'];
    if (roh.address !== undefined && roh.address !== null) {
      if (typeof roh.address !== 'object' || Array.isArray(roh.address)) throw new Eingabefehler('„address“ ist { street, zip, city }.', 'address');
      const a = roh.address as Record<string, unknown>;
      const strasse = text(a, 'street', 120);
      const plz = text(a, 'zip', 10);
      const ort = text(a, 'city', 80);
      if (!strasse || !plz || !ort) throw new Eingabefehler('Zur Adresse gehören Straße, PLZ und Ort.', 'address');
      adresse = { strasse, plz, ort };
    }
    const notiz = text(roh, 'note', 2000);
    if (roh.allow_duplicate !== undefined && typeof roh.allow_duplicate !== 'boolean') throw new Eingabefehler('„allow_duplicate“ ist true oder false.', 'allow_duplicate');
    return { name, art, telefon, email, adresse, notiz, dubletteErlaubt: roh.allow_duplicate === true };
  }),
  fuehreAus(d, k, bestand) {
    const alle = (bestand.kunden ?? []) as unknown as Kunde[];
    if (!d.dubletteErlaubt) {
      const gleich = aehnlicheKunden({ name: d.name, telefon: d.telefon, email: d.email, adresse: d.adresse, ansprechpartner: [] }, aktiv(alle));
      if (gleich.length)
        return {
          art: 'antwort',
          status: 409,
          antwort: {
            status: 'possible_duplicate',
            message: `Den Kunden gibt es vielleicht schon: ${gleich.slice(0, 3).map((x) => x.name).join(', ')}.`,
            candidates: gleich.slice(0, 5).map(kundeKurz),
            requires_confirmation: true,
          },
        };
    }
    const zeit = k.jetzt.toISOString();
    const kunde: Kunde = {
      id: k.neueId(),
      erstelltAm: zeit,
      geaendertAm: zeit,
      erstelltVon: k.handelnder.mitarbeiter.id,
      art: d.art ?? (/\b(gmbh|kg|ag|ug|ohg|gbr|e\.k\.)(?=\s|$)/i.test(d.name) ? 'firma' : 'privat'),
      name: d.name,
      telefon: d.telefon,
      email: d.email,
      adresse: d.adresse,
      notiz: d.notiz,
      nummer: kundennummerNach(alle),
      ansprechpartner: [],
    };
    const daten = ohneLeere(kunde);
    return {
      art: 'geaendert',
      status: 201,
      antwort: { status: 'created', customer_id: kunde.id, number: kunde.nummer, requires_confirmation: false },
      zeilen: [{ sammlung: 'kunden', id: kunde.id, daten }],
      bezug: { typ: 'kunden', id: kunde.id },
      verlauf: `Kunde angelegt – über ${k.partnerName} für ${nameVon(k.handelnder.mitarbeiter)}`,
      ereignisse: [{ typ: 'customer.created', objekt: { typ: 'kunden', id: kunde.id }, daten: kundeKurz(kunde) }],
    };
  },
};

// ------------------------------------------------------------------ Aufgaben

interface AufgabeAnlegen {
  titel: string;
  notiz?: string;
  faellig?: string;
  zustaendigId?: ID;
  kundeId?: ID;
  auftragId?: ID;
  prioritaet: Aufgabe['prioritaet'];
}

const aufgabeAnlegen: PartnerAktion<AufgabeAnlegen> = {
  name: 'create-task',
  gateway: 'task.create',
  beschreibung: 'Aufgabe oder Notiz zum Erledigen anlegen – für sich selbst oder einen Kollegen, optional an Kunde oder Auftrag.',
  risiko: 'schreiben',
  rechte: ['schreiben'],
  liest: ['kunden', 'auftraege', 'mitarbeiter'],
  eingabe: {
    title: { typ: 'string', pflicht: true, beschreibung: 'Was zu tun ist, z. B. „Leiter prüfen“' },
    note: { typ: 'string', beschreibung: 'Details' },
    due_date: { typ: 'string', beschreibung: 'Fällig am (YYYY-MM-DD)' },
    assignee_id: { typ: 'string', beschreibung: 'Mitarbeiter-ID in Handwerk OS (Standard: der Nutzer selbst)' },
    customer_id: { typ: 'string', beschreibung: 'Kunde, zu dem die Aufgabe gehört (aus find-customer)' },
    job_id: { typ: 'string', beschreibung: 'Auftrag, zu dem die Aufgabe gehört' },
    priority: { typ: 'string', beschreibung: 'normal oder high', werte: ['normal', 'high'] },
  },
  pruefe: pruefeMit((roh) => {
    const titel = text(roh, 'title', 200);
    if (!titel || titel.length < 2) throw new Eingabefehler('Was soll erledigt werden?', 'title');
    const faellig = text(roh, 'due_date', 10);
    if (faellig && (!ISO_DATUM.test(faellig) || Number.isNaN(Date.parse(faellig)))) throw new Eingabefehler('„due_date“ ist ein Datum wie 2026-10-12.', 'due_date');
    const prio = text(roh, 'priority', 10) ?? 'normal';
    if (prio !== 'normal' && prio !== 'high') throw new Eingabefehler('„priority“ ist normal oder high.', 'priority');
    return {
      titel,
      notiz: text(roh, 'note', 2000),
      faellig,
      zustaendigId: text(roh, 'assignee_id', 100),
      kundeId: text(roh, 'customer_id', 100),
      auftragId: text(roh, 'job_id', 100),
      prioritaet: prio === 'high' ? 'hoch' : 'normal',
    };
  }),
  fuehreAus(d, k, bestand) {
    const gibt = (sammlung: string, id: ID | undefined) => !id || aktiv(bestand[sammlung]).some((x) => x.id === id);
    if (!gibt('kunden', d.kundeId)) return nichtGefunden('customer_id', 'Diesen Kunden gibt es nicht (mehr).');
    if (!gibt('auftraege', d.auftragId)) return nichtGefunden('job_id', 'Diesen Auftrag gibt es nicht (mehr).');
    const zustaendig = (bestand.mitarbeiter ?? []).find((m) => m.id === (d.zustaendigId ?? k.handelnder.mitarbeiter.id)) as Mitarbeiter | undefined;
    if (d.zustaendigId && (!zustaendig || zustaendig.geloeschtAm || !zustaendig.aktiv)) return nichtGefunden('assignee_id', 'Diesen Mitarbeiter gibt es nicht oder er ist nicht aktiv.');
    const zeit = k.jetzt.toISOString();
    const aufgabe: Aufgabe = {
      id: k.neueId(),
      erstelltAm: zeit,
      geaendertAm: zeit,
      erstelltVon: k.handelnder.mitarbeiter.id,
      titel: d.titel,
      notiz: d.notiz,
      faellig: d.faellig,
      zustaendigId: d.zustaendigId ?? k.handelnder.mitarbeiter.id,
      auftragId: d.auftragId,
      bezug: d.kundeId ? { typ: 'kunden', id: d.kundeId } : undefined,
      erledigt: false,
      prioritaet: d.prioritaet,
      quelle: 'partner',
    };
    const fuer = zustaendig && zustaendig.id !== k.handelnder.mitarbeiter.id ? ` (für ${nameVon(zustaendig)})` : '';
    return {
      art: 'geaendert',
      status: 201,
      antwort: { status: 'created', task_id: aufgabe.id, assignee_id: aufgabe.zustaendigId, requires_confirmation: false },
      zeilen: [{ sammlung: 'aufgaben', id: aufgabe.id, daten: ohneLeere(aufgabe) }],
      bezug: { typ: 'aufgaben', id: aufgabe.id },
      verlauf: `Aufgabe angelegt${fuer} – über ${k.partnerName} von ${nameVon(k.handelnder.mitarbeiter)}`,
      ereignisse: [
        {
          typ: 'task.created',
          objekt: { typ: 'aufgaben', id: aufgabe.id },
          daten: { task_id: aufgabe.id, title: aufgabe.titel, due_date: aufgabe.faellig ?? null, assignee_id: aufgabe.zustaendigId, customer_id: d.kundeId ?? null, job_id: d.auftragId ?? null },
        },
      ],
    };
  },
};

// ------------------------------------------------------------------ Angebote

interface PositionEingabe {
  text: string;
  menge: number;
  einheit: Einheit;
  einzelpreis: number;
}

interface AngebotAnlegen {
  kundeId: ID;
  auftragId?: ID;
  titel?: string;
  /** Netto in Cent (aus amount umgerechnet) oder einzelne Positionen */
  betragNetto?: number;
  betragBrutto?: number;
  positionen?: PositionEingabe[];
  wunschtermin?: string;
  einleitung?: string;
}

const EINHEITEN: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'];
const MAX_EURO = 10_000_000;

const zahl = (roh: Record<string, unknown>, feld: string): number | undefined => {
  const v = roh[feld];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Eingabefehler(`„${feld}“ muss eine Zahl sein.`, feld);
  return v;
};
const euro = (cent: number) => Math.round(cent) / 100;
const plusTage = (datum: string, tage: number) => new Date(Date.parse(`${datum}T12:00:00Z`) + tage * 86_400_000).toISOString().slice(0, 10);
/** Phasen vor dem Angebot – dorthin schaltet ein neues Angebot den Auftrag weiter (wie in der App) */
const VOR_ANGEBOT = new Set(['anfrage', 'besichtigung']);

const angebotAnlegen: PartnerAktion<AngebotAnlegen> = {
  name: 'create-quote',
  gateway: 'offer.create_draft',
  beschreibung:
    'Angebotsentwurf anlegen – mit einem Gesamtbetrag (eine Pauschalposition) oder einzelnen Positionen. Nummer, Steuer, Gültigkeit und Vorlage kommen aus Handwerk OS. Wird nie versendet.',
  risiko: 'schreiben',
  rechte: ['schreiben', 'geld'],
  liest: ['kunden', 'auftraege', 'angebote', 'betrieb'],
  eingabe: {
    customer_id: { typ: 'string', pflicht: true, beschreibung: 'Kunde (aus find-customer oder create-customer)' },
    job_id: { typ: 'string', beschreibung: 'Auftrag, zu dem das Angebot gehört. Ohne: Handwerk OS legt einen Auftrag mit „title“ an.' },
    title: { typ: 'string', beschreibung: 'Worum es geht, z. B. „Badrenovierung“ (Pflicht ohne job_id)' },
    amount: { typ: 'number', beschreibung: 'Gesamtbetrag in Euro, z. B. 8500 (alternativ zu items)' },
    amount_is_gross: { typ: 'boolean', beschreibung: 'true = amount ist brutto (inkl. USt). Standard: netto' },
    items: { typ: 'object', beschreibung: 'Liste [{ text, quantity, unit, unit_price }] – unit_price netto in Euro, unit z. B. Stk, m, h, Psch' },
    requested_period: { typ: 'string', beschreibung: 'Wunschtermin des Kunden als Text, z. B. „nächste Woche“' },
    intro: { typ: 'string', beschreibung: 'Einleitungstext (Standard: Vorlage des Betriebs)' },
  },
  pruefe: pruefeMit((roh) => {
    const kundeId = text(roh, 'customer_id', 100);
    if (!kundeId) throw new Eingabefehler('Für welchen Kunden? „customer_id“ fehlt.', 'customer_id');
    const auftragId = text(roh, 'job_id', 100);
    const titel = text(roh, 'title', 200);
    if (!auftragId && (!titel || titel.length < 2)) throw new Eingabefehler('Worum geht es? „title“ fehlt (oder „job_id“ angeben).', 'title');
    const betrag = zahl(roh, 'amount');
    if (roh.amount_is_gross !== undefined && typeof roh.amount_is_gross !== 'boolean') throw new Eingabefehler('„amount_is_gross“ ist true oder false.', 'amount_is_gross');
    let positionen: PositionEingabe[] | undefined;
    if (roh.items !== undefined && roh.items !== null) {
      if (!Array.isArray(roh.items) || !roh.items.length || roh.items.length > 100) throw new Eingabefehler('„items“ ist eine Liste mit 1 bis 100 Positionen.', 'items');
      positionen = roh.items.map((x, i) => {
        if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Eingabefehler(`Position ${i + 1} ist kein Objekt.`, 'items');
        const p = x as Record<string, unknown>;
        const t = text(p, 'text', 500);
        if (!t) throw new Eingabefehler(`Position ${i + 1}: Text fehlt.`, 'items');
        const menge = zahl(p, 'quantity') ?? 1;
        const preis = zahl(p, 'unit_price');
        if (preis === undefined) throw new Eingabefehler(`Position ${i + 1}: „unit_price“ fehlt.`, 'items');
        const einheit = (text(p, 'unit', 5) ?? 'Stk') as Einheit;
        if (!EINHEITEN.includes(einheit)) throw new Eingabefehler(`Position ${i + 1}: Einheit ist eins von ${EINHEITEN.join(', ')}.`, 'items');
        if (menge <= 0 || menge > 1_000_000 || preis < 0 || preis > MAX_EURO) throw new Eingabefehler(`Position ${i + 1}: Menge oder Preis passt nicht.`, 'items');
        return { text: t, menge, einheit, einzelpreis: Math.round(preis * 100) };
      });
    }
    if (betrag === undefined && !positionen) throw new Eingabefehler('Wie viel? „amount“ oder „items“ angeben.', 'amount');
    if (betrag !== undefined && positionen) throw new Eingabefehler('Entweder „amount“ oder „items“ – nicht beides.', 'amount');
    if (betrag !== undefined && (betrag <= 0 || betrag > MAX_EURO)) throw new Eingabefehler('„amount“ muss größer als 0 sein.', 'amount');
    const cent = betrag === undefined ? undefined : Math.round(betrag * 100);
    return {
      kundeId,
      auftragId,
      titel,
      betragNetto: roh.amount_is_gross === true ? undefined : cent,
      betragBrutto: roh.amount_is_gross === true ? cent : undefined,
      positionen,
      wunschtermin: text(roh, 'requested_period', 200),
      einleitung: text(roh, 'intro', 2000),
    };
  }),
  fuehreAus(d, k, bestand) {
    const kunde = aktiv(bestand.kunden as unknown as Kunde[]).find((x) => x.id === d.kundeId);
    if (!kunde) return nichtGefunden('customer_id', 'Diesen Kunden gibt es nicht (mehr).');
    const alleAuftraege = (bestand.auftraege ?? []) as unknown as Auftrag[];
    let auftrag = d.auftragId ? aktiv(alleAuftraege).find((x) => x.id === d.auftragId) : undefined;
    if (d.auftragId && !auftrag) return nichtGefunden('job_id', 'Diesen Auftrag gibt es nicht (mehr).');
    if (auftrag && auftrag.kundeId !== kunde.id) return nichtGefunden('job_id', 'Der Auftrag gehört zu einem anderen Kunden.');
    if (auftrag?.phase === 'verloren') return nichtGefunden('job_id', 'Dieser Auftrag ist abgesagt.');

    const betrieb = aktiv(bestand.betrieb as unknown as Betrieb[])[0];
    const ust = betrieb?.kleinunternehmer ? 0 : (betrieb?.ustSatz ?? 19);
    const zeit = k.jetzt.toISOString();
    const heute = zeit.slice(0, 10);
    const zeilen: ObjektZeile[] = [];
    const weitere: NonNullable<Extract<Ergebnis, { art: 'geaendert' }>['weitereVerlaeufe']> = [];
    const ereignisse: PartnerEreignis[] = [];
    const wer = nameVon(k.handelnder.mitarbeiter);

    if (!auftrag) {
      auftrag = {
        id: k.neueId(),
        erstelltAm: zeit,
        geaendertAm: zeit,
        erstelltVon: k.handelnder.mitarbeiter.id,
        nummer: projektNummerFuer(alleAuftraege.map((x) => x.nummer), k.jetzt),
        titel: d.titel!,
        art: 'projekt',
        phase: 'angebot',
        kundeId: kunde.id,
        wunschtermin: d.wunschtermin,
        verantwortlichId: k.handelnder.mitarbeiter.id,
      };
      zeilen.push({ sammlung: 'auftraege', id: auftrag.id, daten: ohneLeere(auftrag) });
      weitere.push({ bezug: { typ: 'auftraege', id: auftrag.id }, text: `Auftrag angelegt – über ${k.partnerName} für ${wer}`, aenderung: 'created' });
      ereignisse.push({ typ: 'job.created', objekt: { typ: 'auftraege', id: auftrag.id }, daten: { job_id: auftrag.id, number: auftrag.nummer, title: auftrag.titel, customer_id: kunde.id } });
    } else if (VOR_ANGEBOT.has(auftrag.phase)) {
      const weiter: Auftrag = { ...auftrag, phase: 'angebot', geaendertAm: zeit, wunschtermin: auftrag.wunschtermin ?? d.wunschtermin };
      zeilen.push({ sammlung: 'auftraege', id: weiter.id, daten: ohneLeere(weiter) });
      weitere.push({ bezug: { typ: 'auftraege', id: weiter.id }, text: `Angebot in Arbeit – über ${k.partnerName} für ${wer}`, aenderung: 'updated' });
      auftrag = weiter;
    }

    const netto = d.betragNetto ?? (d.betragBrutto !== undefined ? Math.round((d.betragBrutto * 100) / (100 + ust)) : undefined);
    const positionen: Position[] = d.positionen
      ? d.positionen.map((p) => ({ id: k.neueId('p'), art: p.einheit === 'h' ? 'lohn' : p.einheit === 'Psch' ? 'pauschal' : 'leistung', text: p.text, menge: p.menge, einheit: p.einheit, einzelpreis: p.einzelpreis }))
      : [{ id: k.neueId('p'), art: 'pauschal', text: auftrag.titel, menge: 1, einheit: 'Psch', einzelpreis: netto! }];
    const s = summen(positionen, ust);
    const gueltigZeile = (bestand.einstellungen ?? []).find((e) => e.id === 'angebote.gueltigTage') as { wert?: unknown } | undefined;
    const gueltigTage = typeof gueltigZeile?.wert === 'number' && gueltigZeile.wert > 0 ? gueltigZeile.wert : 30;
    const alleAngebote = (bestand.angebote ?? []) as unknown as Angebot[];
    const angebot: Angebot = {
      id: k.neueId(),
      erstelltAm: zeit,
      geaendertAm: zeit,
      erstelltVon: k.handelnder.mitarbeiter.id,
      nummer: naechsteNummerFuer('AN', alleAngebote.map((x) => x.nummer), { jahr: k.jetzt.getUTCFullYear() }),
      auftragId: auftrag.id,
      kundeId: kunde.id,
      titel: auftrag.titel,
      einleitung: d.einleitung ?? `Vielen Dank für die Anfrage „${auftrag.titel}“. Gerne bieten wir folgende Leistungen an:`,
      positionen,
      status: 'entwurf',
      datum: heute,
      gueltigBis: plusTage(heute, gueltigTage),
      version: 1,
    };
    zeilen.unshift({ sammlung: 'angebote', id: angebot.id, daten: ohneLeere(angebot) });
    ereignisse.unshift({
      typ: 'quote.created',
      objekt: { typ: 'angebote', id: angebot.id },
      daten: { quote_id: angebot.id, number: angebot.nummer, job_id: auftrag.id, customer_id: kunde.id, net: euro(s.netto), tax: euro(s.ust), total: euro(s.brutto), currency: 'EUR' },
    });
    return {
      art: 'geaendert',
      status: 201,
      antwort: {
        status: 'draft_created',
        quote_id: angebot.id,
        number: angebot.nummer,
        job_id: auftrag.id,
        job_number: auftrag.nummer,
        customer_id: kunde.id,
        net: euro(s.netto),
        tax: euro(s.ust),
        tax_rate: ust,
        total: euro(s.brutto),
        currency: 'EUR',
        valid_until: angebot.gueltigBis,
        // Versendet wird nur nach Prüfung durch den Menschen (Angebot öffnen → senden)
        requires_confirmation: true,
      },
      zeilen,
      bezug: { typ: 'angebote', id: angebot.id },
      verlauf: `Angebotsentwurf angelegt – über ${k.partnerName} für ${wer}`,
      weitereVerlaeufe: weitere,
      ereignisse,
    };
  },
};

function nichtGefunden(feld: string, message: string): Ergebnis {
  return { art: 'antwort', status: 422, antwort: { status: 'error', error: { code: 'not_found', message, field: feld } } };
}

/** undefined-Felder entfernen – so steht das Objekt genauso in `objekte` wie aus der App */
function ohneLeere<T extends object>(o: T): ObjektZeile['daten'] {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as ObjektZeile['daten'];
}

// ------------------------------------------------------------------ Katalog

export const PARTNER_AKTIONEN: PartnerAktion[] = [kundeSuchen, kundeAnlegen, aufgabeAnlegen, angebotAnlegen] as PartnerAktion[];

export function partnerAktion(name: string): PartnerAktion | undefined {
  return PARTNER_AKTIONEN.find((a) => a.name === name);
}

/** Katalog für `GET /v1/actions` – damit der Partner weiß, was er aufrufen kann */
export function aktionsKatalog() {
  return PARTNER_AKTIONEN.map((a) => ({
    name: a.name,
    path: `/v1/actions/${a.name}`,
    id: a.gateway,
    description: a.beschreibung,
    risk: a.risiko,
    requires_confirmation: a.risiko === 'kritisch',
    permissions: a.rechte,
    input: Object.fromEntries(
      Object.entries(a.eingabe).map(([feld, f]) => [feld, { type: f.typ, required: !!f.pflicht, description: f.beschreibung, ...(f.werte ? { enum: f.werte } : {}) }]),
    ),
  }));
}
