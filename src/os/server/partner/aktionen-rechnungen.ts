/**
 * Action API v1 – Rechnungen: offene Posten ansehen und Rechnungsentwürfe anlegen.
 *
 * Festschreiben (fortlaufende Nummer, GoBD, E-Rechnung) und Versenden bleiben in der App beim Menschen – eine
 * festgeschriebene Rechnung lässt sich nur noch stornieren. HeyLotte legt deshalb nur Entwürfe an.
 * Summen und offene Beträge wie `rechnungsSummen`/`offenerBetrag` in `@modules/rechnungen/logik`.
 */
import type { Angebot, Auftrag, Betrieb, ID, Kunde, Position, Rechnung, Zahlung } from '@core/objects';
import { summen } from '@core/format';
import {
  aktiv,
  berlin,
  EINHEITEN,
  Eingabefehler,
  euro,
  MAX_EURO,
  nameVon,
  nichtGefunden,
  ohneLeere,
  plusTage,
  pruefeMit,
  text,
  zahl,
  type Bestand,
  type PartnerAktion,
} from './grundlagen';

type RechnungMitStand = Rechnung & { abzugStand?: Record<ID, number> };

const ART_TEXT: Record<Rechnung['art'], string> = { rechnung: 'Rechnung', abschlag: 'Abschlagsrechnung', teil: 'Teilrechnung', schluss: 'Schlussrechnung', gutschrift: 'Gutschrift' };

const ustSatzFuer = (r: Pick<Rechnung, 'reverseCharge'>, b: Betrieb | undefined) => (b?.kleinunternehmer || r.reverseCharge ? 0 : (b?.ustSatz ?? 19));

/** Geldstand aller Rechnungen eines Betriebs (rein, über den geladenen Bestand) */
export function geldstand(bestand: Bestand) {
  const betrieb = aktiv(bestand.betrieb as unknown as Betrieb[])[0];
  const rechnungen = aktiv(bestand.rechnungen as unknown as RechnungMitStand[]);
  const nachId = new Map(rechnungen.map((r) => [r.id, r]));
  const beglichenJe = new Map<ID, number>();
  for (const z of aktiv(bestand.zahlungen as unknown as Zahlung[])) beglichenJe.set(z.rechnungId, (beglichenJe.get(z.rechnungId) ?? 0) + z.betrag + (z.skonto ?? 0));
  const beglichen = (id: ID) => beglichenJe.get(id) ?? 0;

  function zahlbetrag(r: RechnungMitStand): { netto: number; ust: number; brutto: number; zahlbetrag: number } {
    const s = summen(r.positionen, ustSatzFuer(r, betrieb));
    const vorzeichen = r.stornoFuerId ? -1 : 1;
    let gezahlt = 0;
    for (const id of r.abzugRechnungIds ?? []) {
      const a = nachId.get(id);
      if (!a || a.status === 'entwurf' || (a.status === 'storniert' && !r.stornoFuerId)) continue;
      const sa = summen(a.positionen, ustSatzFuer(a, betrieb));
      gezahlt += (r.abzugStand?.[a.id] ?? Math.min(sa.brutto, Math.max(0, beglichen(a.id)))) * vorzeichen;
    }
    const einbehalt = Math.round((s.brutto * Math.max(0, r.einbehaltProzent ?? 0)) / 100);
    return { netto: s.netto, ust: s.ust, brutto: s.brutto, zahlbetrag: s.brutto - gezahlt - einbehalt };
  }

  const verrechnet = (r: Rechnung) => rechnungen.some((x) => x.status !== 'entwurf' && x.status !== 'storniert' && x.id !== r.id && x.abzugRechnungIds?.includes(r.id));
  function offen(r: RechnungMitStand): number {
    if (r.status === 'entwurf' || r.status === 'storniert' || r.art === 'gutschrift' || verrechnet(r)) return 0;
    return Math.max(0, zahlbetrag(r).zahlbetrag - beglichen(r.id));
  }
  return { betrieb, rechnungen, zahlbetrag, offen, beglichen };
}

const tageZwischen = (von: string, bis: string) => Math.round((Date.parse(`${bis}T12:00:00Z`) - Date.parse(`${von}T12:00:00Z`)) / 86_400_000);

// ------------------------------------------------------------------ Offene Rechnungen ansehen

interface RechnungenSuchen {
  kundeId?: ID;
  filter: 'open' | 'overdue' | 'drafts' | 'all';
}

export const rechnungenSuchen: PartnerAktion<RechnungenSuchen> = {
  name: 'find-invoices',
  gateway: 'invoice.find',
  beschreibung: 'Rechnungen ansehen – offene, überfällige, Entwürfe oder alle, auf Wunsch für einen Kunden. Mit offenem Betrag und Tagen überfällig.',
  risiko: 'lesen',
  rechte: ['lesen', 'geld'],
  liest: ['rechnungen', 'zahlungen', 'kunden', 'betrieb'],
  eingabe: {
    customer_id: { typ: 'string', beschreibung: 'Nur Rechnungen dieses Kunden' },
    filter: { typ: 'string', beschreibung: 'open (Standard), overdue, drafts oder all', werte: ['open', 'overdue', 'drafts', 'all'] },
  },
  pruefe: pruefeMit((roh) => {
    const filter = (text(roh, 'filter', 10) ?? 'open') as RechnungenSuchen['filter'];
    if (!['open', 'overdue', 'drafts', 'all'].includes(filter)) throw new Eingabefehler('„filter“ ist open, overdue, drafts oder all.', 'filter');
    return { kundeId: text(roh, 'customer_id', 100), filter };
  }),
  fuehreAus(d, k, bestand) {
    const g = geldstand(bestand);
    const heute = berlin(k.jetzt).datum;
    const kunden = new Map(aktiv(bestand.kunden as unknown as Kunde[]).map((x) => [x.id, x]));
    const zeilen = g.rechnungen
      .filter((r) => !d.kundeId || r.kundeId === d.kundeId)
      .map((r) => {
        const offen = g.offen(r);
        const ueberfaellig = (r.status === 'versendet' || r.status === 'teilbezahlt') && r.art !== 'gutschrift' && r.faelligAm < heute && offen > 0;
        return { r, offen, ueberfaellig };
      })
      .filter(({ r, offen, ueberfaellig }) =>
        d.filter === 'all' ? true : d.filter === 'drafts' ? r.status === 'entwurf' : d.filter === 'overdue' ? ueberfaellig : offen > 0,
      )
      .sort((a, b) => (a.r.faelligAm ?? '').localeCompare(b.r.faelligAm ?? ''));
    const liste = zeilen.slice(0, 100).map(({ r, offen, ueberfaellig }) => {
      const s = g.zahlbetrag(r);
      return {
        invoice_id: r.id,
        number: r.nummer || null,
        type: r.art,
        title: r.titel,
        status: r.status,
        customer_id: r.kundeId,
        customer_name: kunden.get(r.kundeId)?.name ?? null,
        job_id: r.auftragId ?? null,
        date: r.datum,
        due_date: r.faelligAm,
        total: euro(s.zahlbetrag),
        paid: euro(g.beglichen(r.id)),
        open_amount: euro(offen),
        overdue: ueberfaellig,
        days_overdue: ueberfaellig ? tageZwischen(r.faelligAm, heute) : 0,
        dunning_level: r.mahnstufe ?? 0,
      };
    });
    const summe = zeilen.reduce((x, z) => x + z.offen, 0);
    const ueber = zeilen.filter((z) => z.ueberfaellig).reduce((x, z) => x + z.offen, 0);
    return {
      art: 'antwort',
      status: 200,
      antwort: { status: 'ok', filter: d.filter, total: zeilen.length, open_sum: euro(summe), overdue_sum: euro(ueber), currency: 'EUR', invoices: liste },
    };
  },
};

// ------------------------------------------------------------------ Rechnungsentwurf

interface RechnungAnlegen {
  auftragId?: ID;
  kundeId?: ID;
  titel?: string;
  betragNetto?: number;
  positionen?: { text: string; menge: number; einheit: Position['einheit']; einzelpreis: number }[];
}

export const rechnungAnlegen: PartnerAktion<RechnungAnlegen> = {
  name: 'create-invoice',
  gateway: 'invoice.create_draft',
  beschreibung:
    'Rechnungsentwurf anlegen – zu einem Auftrag aus dem angenommenen Angebot, sonst aus Betrag oder Positionen. Festschreiben und Versenden passieren in der App (GoBD, E-Rechnung).',
  risiko: 'schreiben',
  rechte: ['schreiben', 'geld'],
  liest: ['rechnungen', 'angebote', 'auftraege', 'kunden', 'betrieb'],
  eingabe: {
    job_id: { typ: 'string', beschreibung: 'Auftrag – Positionen kommen aus dem angenommenen Angebot' },
    customer_id: { typ: 'string', beschreibung: 'Kunde (für eine freie Rechnung ohne Auftrag)' },
    title: { typ: 'string', beschreibung: 'Titel (Standard: Auftrag)' },
    amount: { typ: 'number', beschreibung: 'Betrag netto in Euro (eine Pauschalposition) – wenn es kein angenommenes Angebot gibt' },
    items: { typ: 'object', beschreibung: 'Liste [{ text, quantity, unit, unit_price }] – unit_price netto in Euro' },
  },
  pruefe: pruefeMit((roh) => {
    const auftragId = text(roh, 'job_id', 100);
    const kundeId = text(roh, 'customer_id', 100);
    if (!auftragId && !kundeId) throw new Eingabefehler('Für welchen Auftrag oder Kunden? „job_id“ oder „customer_id“ angeben.', 'job_id');
    const betrag = zahl(roh, 'amount');
    if (betrag !== undefined && (betrag <= 0 || betrag > MAX_EURO)) throw new Eingabefehler('„amount“ muss größer als 0 sein.', 'amount');
    let positionen: RechnungAnlegen['positionen'];
    if (roh.items !== undefined && roh.items !== null) {
      if (betrag !== undefined) throw new Eingabefehler('Entweder „amount“ oder „items“ – nicht beides.', 'amount');
      if (!Array.isArray(roh.items) || !roh.items.length || roh.items.length > 100) throw new Eingabefehler('„items“ ist eine Liste mit 1 bis 100 Positionen.', 'items');
      positionen = roh.items.map((x, i) => {
        if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Eingabefehler(`Position ${i + 1} ist kein Objekt.`, 'items');
        const p = x as Record<string, unknown>;
        const t = text(p, 'text', 500);
        if (!t) throw new Eingabefehler(`Position ${i + 1}: Text fehlt.`, 'items');
        const menge = zahl(p, 'quantity') ?? 1;
        const preis = zahl(p, 'unit_price');
        if (preis === undefined) throw new Eingabefehler(`Position ${i + 1}: „unit_price“ fehlt.`, 'items');
        const einheit = (text(p, 'unit', 5) ?? 'Stk') as Position['einheit'];
        if (!EINHEITEN.includes(einheit)) throw new Eingabefehler(`Position ${i + 1}: Einheit ist eins von ${EINHEITEN.join(', ')}.`, 'items');
        if (menge <= 0 || menge > 1_000_000 || preis < 0 || preis > MAX_EURO) throw new Eingabefehler(`Position ${i + 1}: Menge oder Preis passt nicht.`, 'items');
        return { text: t, menge, einheit, einzelpreis: Math.round(preis * 100) };
      });
    }
    return { auftragId, kundeId, titel: text(roh, 'title', 200), betragNetto: betrag === undefined ? undefined : Math.round(betrag * 100), positionen };
  }),
  fuehreAus(d, k, bestand) {
    const auftrag = d.auftragId ? aktiv(bestand.auftraege as unknown as Auftrag[]).find((x) => x.id === d.auftragId) : undefined;
    if (d.auftragId && !auftrag) return nichtGefunden('job_id', 'Diesen Auftrag gibt es nicht (mehr).');
    if (auftrag?.phase === 'verloren') return nichtGefunden('job_id', 'Der Auftrag ist nicht zustande gekommen.');
    const kundeId = auftrag?.kundeId ?? d.kundeId;
    const kunde = aktiv(bestand.kunden as unknown as Kunde[]).find((x) => x.id === kundeId);
    if (!kunde) return nichtGefunden('customer_id', 'Diesen Kunden gibt es nicht (mehr).');
    if (auftrag && d.kundeId && d.kundeId !== auftrag.kundeId) return nichtGefunden('job_id', 'Der Auftrag gehört zu einem anderen Kunden.');

    const g = geldstand(bestand);
    const antwortZu = (r: Rechnung, status: string) => {
      const s = g.zahlbetrag(r);
      return {
        status,
        invoice_id: r.id,
        number: null,
        job_id: r.auftragId ?? null,
        customer_id: r.kundeId,
        net: euro(s.netto),
        tax: euro(s.ust),
        total: euro(s.zahlbetrag),
        currency: 'EUR',
        due_date: r.faelligAm,
        // Festschreiben und Senden nur in der App
        requires_confirmation: true,
      };
    };
    // Wie in der App: gibt es zum Auftrag schon einen Entwurf, wird kein zweiter angelegt
    const vorhanden = auftrag ? g.rechnungen.find((r) => r.auftragId === auftrag.id && r.status === 'entwurf' && r.art === 'rechnung') : undefined;
    if (vorhanden) return { art: 'antwort', status: 200, antwort: antwortZu(vorhanden, 'existing_draft') };

    const zeit = k.jetzt.toISOString();
    const heute = berlin(k.jetzt).datum;
    const angebote = (bestand.angebote ?? []) as unknown as Angebot[];
    const angenommen = auftrag
      ? aktiv(angebote)
          .filter((a) => a.auftragId === auftrag.id && a.status === 'angenommen')
          .sort((a, b) => b.version - a.version || (b.entschiedenAm ?? '').localeCompare(a.entschiedenAm ?? ''))[0]
      : undefined;
    let positionen: Position[];
    let quelle: string;
    if (d.positionen) {
      positionen = d.positionen.map((p) => ({ id: k.neueId('p'), art: p.einheit === 'h' ? 'lohn' : p.einheit === 'Psch' ? 'pauschal' : 'leistung', text: p.text, menge: p.menge, einheit: p.einheit, einzelpreis: p.einzelpreis }));
      quelle = 'Positionen von Lotte';
    } else if (d.betragNetto !== undefined) {
      positionen = [{ id: k.neueId('p'), art: 'pauschal', text: d.titel ?? auftrag?.titel ?? 'Leistung', menge: 1, einheit: 'Psch', einzelpreis: d.betragNetto }];
      quelle = 'Betrag von Lotte';
    } else if (angenommen) {
      positionen = angenommen.positionen.filter((p) => !p.optional).map((p) => ({ ...p, id: k.neueId('p') }));
      quelle = `Positionen aus Angebot ${angenommen.nummer}`;
    } else return nichtGefunden('amount', 'Es gibt kein angenommenes Angebot. Bitte „amount“ oder „items“ angeben.');

    const betrieb = g.betrieb;
    const ziel = kunde.zahlungszielTage ?? betrieb?.zahlungszielTage ?? 14;
    const rechnung: Rechnung = {
      id: k.neueId(),
      erstelltAm: zeit,
      geaendertAm: zeit,
      erstelltVon: k.handelnder.mitarbeiter.id,
      nummer: '',
      art: 'rechnung',
      auftragId: auftrag?.id,
      kundeId: kunde.id,
      titel: d.titel ?? auftrag?.titel ?? 'Rechnung',
      positionen,
      status: 'entwurf',
      datum: heute,
      faelligAm: plusTage(heute, ziel),
      mahnstufe: 0,
      angebotId: angenommen && !d.positionen && d.betragNetto === undefined ? angenommen.id : undefined,
      vonMacher: true,
    };
    const s = summen(positionen, ustSatzFuer(rechnung, betrieb));
    return {
      art: 'geaendert',
      status: 201,
      antwort: { ...antwortZu(rechnung, 'draft_created'), source: quelle },
      zeilen: [{ sammlung: 'rechnungen', id: rechnung.id, daten: ohneLeere(rechnung) }],
      bezug: { typ: 'rechnungen', id: rechnung.id },
      verlauf: `${ART_TEXT.rechnung} als Entwurf angelegt (${quelle}) – über ${k.partnerName} für ${nameVon(k.handelnder.mitarbeiter)}`,
      weitereVerlaeufe: auftrag ? [{ bezug: { typ: 'auftraege', id: auftrag.id }, text: `Rechnung als Entwurf angelegt – über ${k.partnerName}`, aenderung: 'updated' }] : [],
      ereignisse: [
        {
          typ: 'invoice.created',
          objekt: { typ: 'rechnungen', id: rechnung.id },
          daten: { invoice_id: rechnung.id, status: 'entwurf', customer_id: kunde.id, job_id: auftrag?.id ?? null, net: euro(s.netto), tax: euro(s.ust), total: euro(s.brutto), currency: 'EUR' },
        },
      ],
    };
  },
};
