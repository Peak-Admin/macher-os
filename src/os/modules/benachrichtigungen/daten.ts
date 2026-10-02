/**
 * Benachrichtigungen: Ereignis → Meldung. Hier steht nur, WER bei WELCHEM Ereignis einen echten Grund hat
 * (Verantwortung, Zuständigkeit, Recht). Stufe, Lebensdauer, Auflösung durch den Zustand, Deduplizierung und Push
 * regelt zentral `@core/aufmerksamkeit` – nicht diese Datei und keine Komponente.
 *
 * Bewusst KEINE Meldung bei: jeder Feldänderung, eigenen Aktionen, Beispieldaten.
 */
import { db } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { datum, euro, personName } from '@core/format';
import { aufgabeEinstufen, kontext, setzePushVersand } from '@core/aufmerksamkeit';
import { benachrichtigen } from '@core/macher';
import type { Abwesenheit, Angebot, Aufgabe, Auftrag, Bezug, ID, Mitarbeiter, Nachricht, Zahlung } from '@core/objects';
import { darf } from '@core/session';
import { appPfad } from '@core/basis';
import { pfadZu, type Automation } from '@core/modul';
import { pushMitRuhezeit } from '@modules/takte/browser';

export const REGEL_ID = 'macher.benachrichtigen';

const ABWESENHEIT: Record<Abwesenheit['art'], string> = { urlaub: 'Urlaub', krank: 'Krankmeldung', schule: 'Berufsschule', schulung: 'Schulung', frei: 'Freier Tag', sonstiges: 'Abwesenheit' };

/** Chef und Büro – optional nur mit einem bestimmten Recht */
function buero(recht?: Parameters<typeof darf>[0]): Mitarbeiter[] {
  return db.mitarbeiter.where((m) => m.aktiv && (m.rolle === 'chef' || m.rolle === 'buero') && (!recht || darf(recht, m)));
}

const ids = (liste: (Mitarbeiter | undefined)[]) => liste.filter((m): m is Mitarbeiter => !!m).map((m) => m.id);
const kundeName = (id: ID | undefined) => db.kunden.get(id)?.name ?? 'Kunde';
const verantwortlich = (auftragId: ID | undefined) => db.mitarbeiter.get(db.auftraege.get(auftragId)?.verantwortlichId);
const istStatus = (e: DbEvent, feld: string, wert: string) =>
  (e.objekt as Record<string, unknown> | undefined)?.[feld] === wert && (e.vorher as Record<string, unknown> | undefined)?.[feld] !== wert;

// ------------------------------------------------------------------ Regeln je Ereignis (wer hat einen Grund?)

export function neueAnfrage(a: Auftrag) {
  if (a.beispiel || a.phase !== 'anfrage') return;
  const zust = db.mitarbeiter.get(a.verantwortlichId);
  benachrichtigen(`Neue Anfrage: ${a.titel}`, {
    art: 'anfrage.neu',
    text: `${kundeName(a.kundeId)}${a.dringend ? ' · dringend' : ''}`,
    bezug: { typ: 'auftraege', id: a.id },
    fuer: zust ? [zust.id] : ids(buero()),
    grund: zust ? 'Die Anfrage ist dir zugewiesen.' : 'Du bist im Büro für neue Anfragen zuständig.',
    ausloeser: a.erstelltVon,
    dringend: a.dringend,
  });
}

export function kundenNachricht(n: Nachricht) {
  // Anrufe notiert das Büro selbst – dafür keine Benachrichtigung
  if (n.beispiel || n.richtung !== 'ein' || n.kanal === 'intern' || n.kanal === 'telefon') return;
  const text = n.text.length > 90 ? n.text.slice(0, 88) + ' …' : n.text;
  const zust = verantwortlich(n.auftragId);
  benachrichtigen(`Nachricht von ${kundeName(n.kundeId ?? db.auftraege.get(n.auftragId)?.kundeId)}`, {
    art: 'nachricht.kunde',
    text,
    // Zustand: die Nachricht selbst (gelesen = erledigt); gebündelt am Auftrag bzw. Kunden
    bezug: { typ: 'nachrichten', id: n.id },
    gruppe: n.auftragId ? { typ: 'auftraege', id: n.auftragId } : n.kundeId ? { typ: 'kunden', id: n.kundeId } : undefined,
    fuer: zust ? [zust.id] : ids(buero()),
    grund: zust ? 'Du bist für den Auftrag verantwortlich.' : 'Du bist im Büro für Kundennachrichten zuständig.',
    ausloeser: n.erstelltVon,
    quelleId: `nachricht:${n.id}`,
  });
}

export function abwesenheitNeu(a: Abwesenheit) {
  if (a.beispiel || a.status !== 'beantragt') return;
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const zeitraum = a.von === a.bis ? `am ${datum(a.von)}` : `${datum(a.von)} bis ${datum(a.bis)}`;
  // Krankmeldungen und Bescheide an den Mitarbeiter meldet das Modul Abwesenheiten (eigene Regeln) – hier nicht doppelt
  const freigeber = buero('personal').length ? buero('personal') : buero();
  benachrichtigen(`${ABWESENHEIT[a.art]} beantragt: ${personName(m)}`, {
    art: 'abwesenheit.beantragt',
    text: zeitraum,
    bezug: { typ: 'abwesenheiten', id: a.id },
    fuer: ids(freigeber).filter((id) => id !== a.mitarbeiterId),
    ausloeser: a.erstelltVon,
  });
}

export function angebotAngenommen(a: Angebot) {
  if (a.beispiel || a.status !== 'angenommen') return;
  // dieselbe Art wie „Zum Einplanen“ aus dem Ablauf – ein Eintrag je Auftrag und Person
  benachrichtigen(`Angebot angenommen: ${kundeName(a.kundeId)}`, {
    art: 'auftrag.einplanen',
    text: `${a.nummer} · ${a.titel} – jetzt einplanen.`,
    bezug: { typ: 'auftraege', id: a.auftragId },
    fuer: ids([...buero('planen'), verantwortlich(a.auftragId)]),
    grund: 'Du planst die Einsätze.',
  });
}

export function zahlungEingegangen(z: Zahlung) {
  if (z.beispiel) return;
  const r = db.rechnungen.get(z.rechnungId);
  benachrichtigen(`Zahlung eingegangen: ${euro(z.betrag)}`, {
    art: 'zahlung.eingegangen',
    text: r ? `${r.nummer} · ${kundeName(r.kundeId)}` : undefined,
    bezug: { typ: 'rechnungen', id: z.rechnungId },
    fuer: ids(buero('geld')),
    grund: 'Du kümmerst dich um das Geld.',
    ausloeser: z.erstelltVon,
    quelleId: `zahlung:${z.id}`,
  });
}

export function aufgabeZugewiesen(a: Aufgabe, vorher?: Aufgabe) {
  if (a.beispiel || a.erledigt || !a.zustaendigId || vorher?.zustaendigId === a.zustaendigId) return;
  const von = db.mitarbeiter.get(a.erstelltVon);
  benachrichtigen(`Neue Aufgabe für dich: ${a.titel}`, {
    art: 'aufgabe.zugewiesen',
    text: [von ? `von ${von.vorname}` : undefined, a.faellig ? `fällig ${datum(a.faellig)}` : undefined].filter(Boolean).join(' · ') || undefined,
    bezug: { typ: 'aufgaben', id: a.id },
    gruppe: a.auftragId ? { typ: 'auftraege', id: a.auftragId } : undefined,
    fuer: a.zustaendigId,
    // bei Neuanlage: wer sie sich selbst gibt, braucht keine Glocke
    ausloeser: vorher ? undefined : a.erstelltVon,
  });
}

/**
 * Einmal am Tag: überfällige Aufgaben (auch selbst angelegte) erscheinen als Aktion – überfällig an einem
 * kritischen Auftrag als „Jetzt“. Je Aufgabe und Fälligkeit höchstens einmal (`quelleId`).
 */
export function faelligeAufgaben(jetzt = new Date()) {
  const k = kontext(jetzt);
  let n = 0;
  for (const a of db.aufgaben.where((x) => !x.erledigt && !x.beispiel && !!x.zustaendigId && !!x.faellig && x.faellig < k.heute)) {
    const stufe = aufgabeEinstufen(a, k);
    if (stufe === 'ignorieren') continue;
    n += benachrichtigen(`Überfällig: ${a.titel}`, {
      art: 'aufgabe.zugewiesen',
      text: `war fällig ${datum(a.faellig)}`,
      bezug: { typ: 'aufgaben', id: a.id },
      gruppe: a.auftragId ? { typ: 'auftraege', id: a.auftragId } : undefined,
      fuer: a.zustaendigId,
      quelleId: `aufgabe-ueberfaellig:${a.id}:${a.faellig}`,
      jetzt,
    }).length;
  }
  return n;
}

/** Push nur, wenn die zentrale Regel es erlaubt – hier nur die Zustellung (Ruhezeit, Notdienst, Cloud) */
function pushAnbinden() {
  setzePushVersand(({ anMitarbeiterId, titel, text, bezug, stufe }: { anMitarbeiterId: ID; titel: string; text?: string; bezug?: Bezug; stufe: string }) => {
    const p = pfadZu(bezug);
    void pushMitRuhezeit({ anMitarbeiterId, titel, text, pfad: p ? appPfad(p) : undefined }, { dringend: stufe === 'jetzt' }).catch(() => {});
  });
}

export const benachrichtigenAutomation: Automation = {
  id: REGEL_ID,
  titel: 'Bei wichtigen Ereignissen benachrichtigen',
  beschreibung:
    'Meldet nur, wofür du einen Grund hast: neue Anfragen, Kundennachrichten, Urlaubsanträge, angenommene Angebote, Zahlungseingänge, Aufgaben für dich. Erledigtes verschwindet von selbst.',
  standardAn: true,
  start: () => {
    pushAnbinden();
    const obj = <T>(e: DbEvent) => e.objekt as T | undefined;
    const aus = [
      on('auftraege.created', (e) => obj<Auftrag>(e) && neueAnfrage(obj<Auftrag>(e)!)),
      on('anfrage.eingegangen', (e) => obj<Auftrag>(e)?.phase && neueAnfrage(obj<Auftrag>(e)!)),
      on('nachrichten.created', (e) => obj<Nachricht>(e) && kundenNachricht(obj<Nachricht>(e)!)),
      on('abwesenheiten.created', (e) => obj<Abwesenheit>(e) && abwesenheitNeu(obj<Abwesenheit>(e)!)),
      on('angebote.updated', (e) => istStatus(e, 'status', 'angenommen') && angebotAngenommen(obj<Angebot>(e)!)),
      on('angebot.angenommen', (e) => obj<Angebot>(e)?.status && angebotAngenommen(obj<Angebot>(e)!)),
      on('zahlungen.created', (e) => obj<Zahlung>(e) && zahlungEingegangen(obj<Zahlung>(e)!)),
      on('zahlung.eingegangen', (e) => obj<Zahlung>(e)?.rechnungId && zahlungEingegangen(obj<Zahlung>(e)!)),
      on('aufgaben.created', (e) => obj<Aufgabe>(e) && aufgabeZugewiesen(obj<Aufgabe>(e)!)),
      on('aufgaben.updated', (e) => obj<Aufgabe>(e) && aufgabeZugewiesen(obj<Aufgabe>(e)!, e.vorher as Aufgabe)),
    ];
    return () => {
      aus.forEach((f) => f());
      setzePushVersand(undefined);
    };
  },
  pruefen: () => {
    faelligeAufgaben();
  },
};

/** Beispiel-Meldungen nach dem Onboarding – zeigen, wie die Inbox arbeitet (gelöst = weg). */
export function beispielBenachrichtigungen() {
  const chef = db.mitarbeiter.all().find((m) => m.rolle === 'chef');
  if (!chef || !db.auftraege.all().some((a) => a.beispiel)) return;
  const anfrage = db.auftraege.all().find((a) => a.beispiel && a.phase === 'anfrage' && a.dringend);
  const nachricht = db.nachrichten.all().find((n) => n.beispiel && n.richtung === 'ein' && !n.gelesen);
  const urlaub = db.abwesenheiten.all().find((a) => a.beispiel && a.status === 'beantragt');
  const erledigt = db.auftraege.all().find((a) => a.beispiel && a.phase === 'erledigt');
  const fuer = chef.id;
  const neu = [
    ...(urlaub
      ? benachrichtigen(`Urlaub beantragt: ${personName(db.mitarbeiter.get(urlaub.mitarbeiterId))}`, { art: 'abwesenheit.beantragt', text: `${datum(urlaub.von)} bis ${datum(urlaub.bis)}`, bezug: { typ: 'abwesenheiten', id: urlaub.id }, fuer })
      : []),
    ...(nachricht
      ? benachrichtigen(`Nachricht von ${kundeName(nachricht.kundeId)}`, {
          art: 'nachricht.kunde',
          text: nachricht.text.slice(0, 88),
          bezug: { typ: 'nachrichten', id: nachricht.id },
          gruppe: nachricht.auftragId ? { typ: 'auftraege', id: nachricht.auftragId } : undefined,
          fuer,
        })
      : []),
    ...(anfrage ? benachrichtigen(`Neue Anfrage: ${anfrage.titel}`, { art: 'anfrage.neu', text: `${kundeName(anfrage.kundeId)} · dringend`, bezug: { typ: 'auftraege', id: anfrage.id }, fuer }) : []),
    ...(erledigt ? benachrichtigen(`Auftrag abgeschlossen: ${erledigt.titel}`, { stufe: 'info', text: kundeName(erledigt.kundeId), bezug: { typ: 'auftraege', id: erledigt.id }, fuer }) : []),
  ];
  for (const b of neu) db.benachrichtigungen.update(b.id, { beispiel: true }, { leise: true });
}
