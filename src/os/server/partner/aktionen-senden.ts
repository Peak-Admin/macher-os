/**
 * Action API v1 – Angebot an den Kunden senden (`send-quote`, wie `offer.send` im Macher-Gateway der App).
 *
 * Kritisch: Der Kunde bekommt eine Nachricht. HeyLotte muss vorher beim Nutzer nachfragen und `confirmed: true`
 * mitschicken. Der Kunde bekommt – wie aus der App – einen Link zu seinem Kundenbereich, dort sieht er das Angebot
 * als Briefbogen und nimmt es an. Erst wenn der Versand geklappt hat, wird das Angebot „versendet“.
 */
import type { Angebot, Auftrag, Betrieb, ID, Kunde } from '@core/objects';
import { BASIS } from '@core/basis';
import { summen } from '@core/format';
import {
  aktiv,
  euro,
  kanalFuer,
  nameVon,
  nichtGefunden,
  ohneLeere,
  plusTage,
  pruefeMit,
  text,
  Eingabefehler,
  type ObjektZeile,
  type PartnerAktion,
  type VersandAuftrag,
} from './grundlagen';

/** wie `portalzugaenge` der App (`@modules/kundenbereich/daten`) */
interface Portalzugang {
  id: ID;
  kundeId: ID;
  token: string;
  gueltigBis: string;
  widerrufenAm?: string;
  geloeschtAm?: string;
  erstelltAm?: string;
  geaendertAm?: string;
}

/** Gültigkeit eines neuen Kundenbereich-Links (wie `STANDARD_TAGE` der App) */
const PORTAL_TAGE = 90;
const VOR_ANGEBOT = new Set(['anfrage', 'besichtigung']);

interface AngebotSenden {
  angebotId: ID;
  an?: string;
  kanal?: string;
}

const geld = (cent: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cent / 100);
const datumDe = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Nachricht wie `angebotNachricht` der App */
export function angebotsText(a: Angebot, kunde: Kunde, betrieb: Betrieb | undefined, brutto: number, kanal: VersandAuftrag['kanal']): { betreff: string; text: string } {
  const betreff = `Angebot ${a.nummer}${a.version > 1 ? ` (Version ${a.version})` : ''} – ${a.titel}`;
  const name = kunde.ansprechpartner?.[0]?.name ?? kunde.name;
  if (kanal !== 'email')
    return {
      betreff,
      text: `Guten Tag ${name}, hier ist unser Angebot ${a.nummer} „${a.titel}“ über ${geld(brutto)}. Sie können es unter diesem Link ansehen und direkt annehmen. Viele Grüße, ${betrieb?.name ?? ''}`.trim(),
    };
  return {
    betreff,
    text: [
      `Guten Tag ${name},`,
      '',
      `vielen Dank für Ihre Anfrage. Unser Angebot ${a.nummer} für „${a.titel}“ finden Sie unter dem Link unten – dort können Sie es ansehen, als PDF speichern und direkt annehmen.`,
      `Gesamtsumme: ${geld(brutto)} (inkl. USt.)`,
      `Gültig bis: ${datumDe(a.gueltigBis)}`,
      '',
      'Bei Fragen melden Sie sich gern. Wir freuen uns auf Ihren Auftrag.',
      '',
      'Viele Grüße',
      betrieb?.name ?? '',
    ]
      .join('\n')
      .trim(),
  };
}

export const angebotSenden: PartnerAktion<AngebotSenden> = {
  name: 'send-quote',
  gateway: 'offer.send',
  beschreibung:
    'Angebot an den Kunden senden – per E-Mail, SMS oder WhatsApp mit Link zum Kundenbereich, wo er es ansieht und annimmt. Kritisch: erst beim Nutzer bestätigen, dann mit "confirmed": true senden.',
  risiko: 'kritisch',
  rechte: ['veroeffentlichen'],
  liest: ['angebote', 'kunden', 'auftraege', 'betrieb', 'portalzugaenge'],
  eingabe: {
    quote_id: { typ: 'string', pflicht: true, beschreibung: 'Angebot (aus create-quote)' },
    to: { typ: 'string', beschreibung: 'E-Mail oder Handynummer. Standard: E-Mail des Kunden, sonst seine Telefonnummer' },
    channel: { typ: 'string', beschreibung: 'email, sms oder whatsapp (Standard: passend zu „to“)', werte: ['email', 'sms', 'whatsapp'] },
  },
  pruefe: pruefeMit((roh) => {
    const angebotId = text(roh, 'quote_id', 100);
    if (!angebotId) throw new Eingabefehler('Welches Angebot? „quote_id“ fehlt.', 'quote_id');
    const kanal = text(roh, 'channel', 10);
    if (kanal && !['email', 'sms', 'whatsapp'].includes(kanal)) throw new Eingabefehler('„channel“ ist email, sms oder whatsapp.', 'channel');
    return { angebotId, an: text(roh, 'to', 200), kanal };
  }),
  fuehreAus(d, k, bestand) {
    const alle = (bestand.angebote ?? []) as unknown as Angebot[];
    const a = aktiv(alle).find((x) => x.id === d.angebotId);
    if (!a) return nichtGefunden('quote_id', 'Dieses Angebot gibt es nicht (mehr).');
    if (a.status !== 'entwurf' && a.status !== 'versendet')
      return nichtGefunden('quote_id', a.status === 'angenommen' ? 'Dieses Angebot ist schon angenommen.' : 'Dieses Angebot ist abgelehnt oder abgelaufen.');
    if (alle.some((x) => x.nummer === a.nummer && x.id !== a.id && x.version > a.version && !x.geloeschtAm))
      return nichtGefunden('quote_id', `Von Angebot ${a.nummer} gibt es eine neuere Version.`);
    const kunde = aktiv(bestand.kunden as unknown as Kunde[]).find((x) => x.id === a.kundeId);
    if (!kunde) return nichtGefunden('quote_id', 'Den Kunden zu diesem Angebot gibt es nicht (mehr).');
    const betrieb = aktiv(bestand.betrieb as unknown as Betrieb[])[0];
    const ust = betrieb?.kleinunternehmer ? 0 : (betrieb?.ustSatz ?? 19);
    const s = summen(a.positionen, ust, a.rabattProzent ?? 0);
    if (!a.positionen.length || s.brutto <= 0) return nichtGefunden('quote_id', 'Das Angebot hat noch keine Positionen mit Preis.');

    const an = (d.an ?? (d.kanal === 'sms' || d.kanal === 'whatsapp' ? kunde.telefon : (kunde.email ?? kunde.telefon)) ?? '').trim();
    if (!an) return nichtGefunden('to', `Für ${kunde.name} ist keine E-Mail und keine Telefonnummer hinterlegt. Bitte „to“ angeben.`);
    const kanal = kanalFuer(an, d.kanal);
    if (!kanal) return nichtGefunden('to', '„to“ ist keine gültige E-Mail oder Telefonnummer (oder passt nicht zu „channel“).');

    const zeit = k.jetzt.toISOString();
    const heute = zeit.slice(0, 10);
    const zeilen: ObjektZeile[] = [];
    const weitere: { bezug: { typ: string; id: ID }; text: string; aenderung: 'created' | 'updated' }[] = [];

    // Link zum Kundenbereich: vorhandenen gültigen Zugang nutzen, sonst einen anlegen (wie `kundenLink` der App)
    let zugang = ((bestand.portalzugaenge ?? []) as unknown as Portalzugang[])
      .filter((z) => z.kundeId === kunde.id && !z.geloeschtAm && !z.widerrufenAm && z.gueltigBis >= heute)
      .sort((x, y) => y.gueltigBis.localeCompare(x.gueltigBis))[0];
    if (!zugang) {
      zugang = { id: k.neueId(), erstelltAm: zeit, geaendertAm: zeit, kundeId: kunde.id, token: k.neuesToken(), gueltigBis: plusTage(heute, PORTAL_TAGE) };
      zeilen.push({ sammlung: 'portalzugaenge', id: zugang.id, daten: ohneLeere(zugang) });
      weitere.push({ bezug: { typ: 'kunden', id: kunde.id }, text: `Link zum Kundenbereich erzeugt – über ${k.partnerName}`, aenderung: 'updated' });
    }
    const link = `${k.appUrl.replace(/\/$/, '')}${BASIS}/k/${encodeURIComponent(zugang.token)}?angebot=${encodeURIComponent(a.id)}`;

    const versendet: Angebot = { ...a, status: 'versendet', versendetAm: zeit, datum: a.status === 'entwurf' ? heute : a.datum, geaendertAm: zeit };
    zeilen.unshift({ sammlung: 'angebote', id: a.id, daten: ohneLeere(versendet) });
    const auftrag = aktiv(bestand.auftraege as unknown as Auftrag[]).find((x) => x.id === a.auftragId);
    if (auftrag && VOR_ANGEBOT.has(auftrag.phase)) {
      zeilen.push({ sammlung: 'auftraege', id: auftrag.id, daten: ohneLeere({ ...auftrag, phase: 'angebot', geaendertAm: zeit }) });
      weitere.push({ bezug: { typ: 'auftraege', id: auftrag.id }, text: `Angebot ${a.nummer} versendet – über ${k.partnerName}`, aenderung: 'updated' });
    } else if (auftrag) weitere.push({ bezug: { typ: 'auftraege', id: auftrag.id }, text: `Angebot ${a.nummer} versendet – über ${k.partnerName}`, aenderung: 'updated' });

    const wie = kanal === 'sms' ? 'SMS' : kanal === 'whatsapp' ? 'WhatsApp' : 'E-Mail';
    const { betreff, text: nachricht } = angebotsText(a, kunde, betrieb, s.brutto, kanal);
    return {
      art: 'geaendert',
      status: 200,
      antwort: {
        status: 'sent',
        quote_id: a.id,
        number: a.nummer,
        customer_id: kunde.id,
        channel: kanal,
        to: an,
        total: euro(s.brutto),
        currency: 'EUR',
        valid_until: a.gueltigBis,
        requires_confirmation: false,
      },
      zeilen,
      bezug: { typ: 'angebote', id: a.id },
      aenderung: 'updated',
      verlauf: `Per ${wie} an ${an} versendet – über ${k.partnerName} für ${nameVon(k.handelnder.mitarbeiter)}`,
      weitereVerlaeufe: weitere,
      ereignisse: [
        {
          typ: 'quote.sent',
          objekt: { typ: 'angebote', id: a.id },
          daten: { quote_id: a.id, number: a.nummer, customer_id: kunde.id, job_id: a.auftragId, channel: kanal, total: euro(s.brutto), currency: 'EUR' },
        },
      ],
      versand: { kanal, an, betreff, text: nachricht, link, bezug: { typ: 'angebote', id: a.id } },
    };
  },
};
