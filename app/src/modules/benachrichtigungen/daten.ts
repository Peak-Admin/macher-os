/**
 * Benachrichtigungen: sparsam. Nur bei Ereignissen, auf die jemand reagieren muss –
 * neue Anfrage, Kundennachricht, Abwesenheit, Angebot angenommen, Zahlung eingegangen,
 * neue Aufgabe für dich. Nicht bei jeder Änderung.
 */
import { db } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { datum, euro, personName } from '@core/format';
import { benachrichtigen } from '@core/macher';
import type { Automation } from '@core/modul';
import type { Abwesenheit, Angebot, Aufgabe, Auftrag, Benachrichtigung, Bezug, ID, Mitarbeiter, Nachricht, Zahlung } from '@core/objects';
import { darf } from '@core/session';

export const REGEL_ID = 'macher.benachrichtigen';

/** Was sieht dieser Mitarbeiter? Persönliche + allgemeine (ohne Empfänger) */
export function fuerMich(liste: Benachrichtigung[], ichId: ID | undefined): Benachrichtigung[] {
  return liste
    .filter((b) => !b.fuerMitarbeiterId || b.fuerMitarbeiterId === ichId)
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
}

export function alleGelesen(liste: Benachrichtigung[]) {
  for (const b of liste) if (!b.gelesen) db.benachrichtigungen.update(b.id, { gelesen: true }, { leise: true });
}

const ABWESENHEIT: Record<Abwesenheit['art'], string> = { urlaub: 'Urlaub', krank: 'Krankmeldung', schule: 'Berufsschule', schulung: 'Schulung', frei: 'Freier Tag', sonstiges: 'Abwesenheit' };

/** Chef und Büro – optional nur mit einem bestimmten Recht */
function buero(recht?: Parameters<typeof darf>[0]): Mitarbeiter[] {
  return db.mitarbeiter.where((m) => m.aktiv && (m.rolle === 'chef' || m.rolle === 'buero') && (!recht || darf(recht, m)));
}

/**
 * Benachrichtigt jeden Empfänger einmal. Wer das Ereignis selbst ausgelöst hat, bekommt nichts.
 * Gleicher Titel zum gleichen Objekt innerhalb von 10 Minuten zählt als doppelt
 * (z. B. `angebote.updated` und `angebot.angenommen` für dasselbe Angebot).
 */
export function melden(empfaenger: (Mitarbeiter | undefined)[], titel: string, opts: { text?: string; bezug?: Bezug; ausloeser?: ID; wichtig?: boolean }) {
  const seit = new Date(Date.now() - 10 * 60_000).toISOString();
  const ids = [...new Set(empfaenger.filter((m): m is Mitarbeiter => !!m).map((m) => m.id))].filter((id) => id !== opts.ausloeser);
  let n = 0;
  for (const id of ids) {
    const doppelt = db.benachrichtigungen.where(
      (b) => b.fuerMitarbeiterId === id && b.titel === titel && b.erstelltAm >= seit && b.bezug?.id === opts.bezug?.id,
    ).length;
    if (doppelt) continue;
    benachrichtigen(titel, { text: opts.text, bezug: opts.bezug, fuer: id, wichtig: opts.wichtig });
    n++;
  }
  return n;
}

const kundeName = (id: ID | undefined) => db.kunden.get(id)?.name ?? 'Kunde';
const verantwortlich = (auftragId: ID | undefined) => db.mitarbeiter.get(db.auftraege.get(auftragId)?.verantwortlichId);
const istStatus = (e: DbEvent, feld: string, wert: string) =>
  (e.objekt as Record<string, unknown> | undefined)?.[feld] === wert && (e.vorher as Record<string, unknown> | undefined)?.[feld] !== wert;

// ------------------------------------------------------------------ Regeln je Ereignis

export function neueAnfrage(a: Auftrag) {
  if (a.beispiel || a.phase !== 'anfrage') return;
  melden(buero(), `Neue Anfrage: ${a.titel}`, { text: `${kundeName(a.kundeId)}${a.dringend ? ' · dringend' : ''}`, bezug: { typ: 'auftraege', id: a.id }, ausloeser: a.erstelltVon, wichtig: a.dringend });
}

export function kundenNachricht(n: Nachricht) {
  if (n.beispiel || n.richtung !== 'ein' || n.kanal === 'intern') return;
  const text = n.text.length > 90 ? n.text.slice(0, 88) + ' …' : n.text;
  melden([...buero(), verantwortlich(n.auftragId)], `Nachricht von ${kundeName(n.kundeId ?? db.auftraege.get(n.auftragId)?.kundeId)}`, {
    text,
    bezug: n.auftragId ? { typ: 'auftraege', id: n.auftragId } : n.kundeId ? { typ: 'kunden', id: n.kundeId } : undefined,
    ausloeser: n.erstelltVon,
  });
}

export function abwesenheitNeu(a: Abwesenheit) {
  if (a.beispiel) return;
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const zeitraum = a.von === a.bis ? `am ${datum(a.von)}` : `${datum(a.von)} bis ${datum(a.bis)}`;
  if (a.status === 'beantragt') {
    melden(buero('personal').length ? buero('personal') : buero(), `${ABWESENHEIT[a.art]} beantragt: ${personName(m)}`, { text: `${zeitraum} – bitte freigeben oder ablehnen.`, bezug: { typ: 'abwesenheiten', id: a.id }, ausloeser: a.erstelltVon, wichtig: true });
  } else if (a.art === 'krank') {
    // Krankmeldung betrifft sofort die Planung
    melden(buero(), `Krankmeldung: ${personName(m)}`, { text: `${zeitraum} – prüfe die Einsätze.`, bezug: { typ: 'abwesenheiten', id: a.id }, ausloeser: a.erstelltVon, wichtig: true });
  }
}

export function abwesenheitEntschieden(a: Abwesenheit, vorher?: Abwesenheit) {
  if (a.beispiel || vorher?.status !== 'beantragt' || a.status === 'beantragt') return;
  const art = ABWESENHEIT[a.art];
  const zeitraum = a.von === a.bis ? `am ${datum(a.von)}` : `${datum(a.von)} bis ${datum(a.bis)}`;
  melden([db.mitarbeiter.get(a.mitarbeiterId)], a.status === 'genehmigt' ? `Dein Antrag ist genehmigt: ${art}` : `Dein Antrag wurde abgelehnt: ${art}`, {
    text: zeitraum,
    bezug: { typ: 'abwesenheiten', id: a.id },
  });
}

export function angebotAngenommen(a: Angebot) {
  if (a.beispiel || a.status !== 'angenommen') return;
  melden([...buero(), verantwortlich(a.auftragId)], `Angebot angenommen: ${kundeName(a.kundeId)}`, {
    text: `${a.nummer} · ${a.titel} – jetzt einplanen.`,
    bezug: { typ: 'auftraege', id: a.auftragId },
    wichtig: true,
  });
}

export function zahlungEingegangen(z: Zahlung) {
  if (z.beispiel) return;
  const r = db.rechnungen.get(z.rechnungId);
  melden(buero('geld'), `Zahlung eingegangen: ${euro(z.betrag)}`, {
    text: r ? `${r.nummer} · ${kundeName(r.kundeId)}` : undefined,
    bezug: { typ: 'rechnungen', id: z.rechnungId },
    ausloeser: z.erstelltVon,
  });
}

export function aufgabeZugewiesen(a: Aufgabe, vorher?: Aufgabe) {
  if (a.beispiel || a.erledigt || !a.zustaendigId || vorher?.zustaendigId === a.zustaendigId) return;
  const von = db.mitarbeiter.get(a.erstelltVon);
  melden([db.mitarbeiter.get(a.zustaendigId)], `Neue Aufgabe für dich: ${a.titel}`, {
    text: [von ? `von ${von.vorname}` : undefined, a.faellig ? `fällig ${datum(a.faellig)}` : undefined].filter(Boolean).join(' · ') || undefined,
    bezug: { typ: 'aufgaben', id: a.id },
    // bei Neuanlage: wer sie sich selbst gibt, braucht keine Glocke
    ausloeser: vorher ? undefined : a.erstelltVon,
  });
}

export const benachrichtigenAutomation: Automation = {
  id: REGEL_ID,
  titel: 'Bei wichtigen Ereignissen benachrichtigen',
  beschreibung: 'Meldet neue Anfragen, Kundennachrichten, Urlaubsanträge und Krankmeldungen, angenommene Angebote, Zahlungseingänge und neue Aufgaben – sonst nichts.',
  standardAn: true,
  start: () => {
    const obj = <T>(e: DbEvent) => e.objekt as T | undefined;
    const aus = [
      on('auftraege.created', (e) => obj<Auftrag>(e) && neueAnfrage(obj<Auftrag>(e)!)),
      on('anfrage.eingegangen', (e) => obj<Auftrag>(e)?.phase && neueAnfrage(obj<Auftrag>(e)!)),
      on('nachrichten.created', (e) => obj<Nachricht>(e) && kundenNachricht(obj<Nachricht>(e)!)),
      on('abwesenheiten.created', (e) => obj<Abwesenheit>(e) && abwesenheitNeu(obj<Abwesenheit>(e)!)),
      on('abwesenheiten.updated', (e) => obj<Abwesenheit>(e) && abwesenheitEntschieden(obj<Abwesenheit>(e)!, e.vorher as Abwesenheit)),
      on('angebote.updated', (e) => istStatus(e, 'status', 'angenommen') && angebotAngenommen(obj<Angebot>(e)!)),
      on('angebot.angenommen', (e) => obj<Angebot>(e)?.status && angebotAngenommen(obj<Angebot>(e)!)),
      on('zahlungen.created', (e) => obj<Zahlung>(e) && zahlungEingegangen(obj<Zahlung>(e)!)),
      on('zahlung.eingegangen', (e) => obj<Zahlung>(e)?.rechnungId && zahlungEingegangen(obj<Zahlung>(e)!)),
      on('aufgaben.created', (e) => obj<Aufgabe>(e) && aufgabeZugewiesen(obj<Aufgabe>(e)!)),
      on('aufgaben.updated', (e) => obj<Aufgabe>(e) && aufgabeZugewiesen(obj<Aufgabe>(e)!, e.vorher as Aufgabe)),
    ];
    return () => aus.forEach((f) => f());
  },
};

/** Beispiel-Benachrichtigungen nach dem Onboarding – zeigen, wie die Glocke arbeitet. */
export function beispielBenachrichtigungen() {
  const chef = db.mitarbeiter.all().find((m) => m.rolle === 'chef');
  if (!chef || !db.auftraege.all().some((a) => a.beispiel)) return;
  const anfrage = db.auftraege.all().find((a) => a.beispiel && a.phase === 'anfrage' && a.dringend);
  const nachricht = db.nachrichten.all().find((n) => n.beispiel && n.richtung === 'ein');
  const urlaub = db.abwesenheiten.all().find((a) => a.beispiel && a.status === 'beantragt');
  const B = { beispiel: true, gelesen: false, fuerMitarbeiterId: chef.id };
  if (urlaub)
    db.benachrichtigungen.create({ ...B, titel: `Urlaub beantragt: ${personName(db.mitarbeiter.get(urlaub.mitarbeiterId))}`, text: `${datum(urlaub.von)} bis ${datum(urlaub.bis)} – bitte freigeben oder ablehnen.`, bezug: { typ: 'abwesenheiten', id: urlaub.id }, wichtig: true });
  if (nachricht)
    db.benachrichtigungen.create({ ...B, titel: `Nachricht von ${kundeName(nachricht.kundeId)}`, text: nachricht.text.slice(0, 88), bezug: nachricht.auftragId ? { typ: 'auftraege', id: nachricht.auftragId } : undefined });
  if (anfrage)
    db.benachrichtigungen.create({ ...B, titel: `Neue Anfrage: ${anfrage.titel}`, text: `${kundeName(anfrage.kundeId)} · dringend`, bezug: { typ: 'auftraege', id: anfrage.id }, wichtig: true });
}
