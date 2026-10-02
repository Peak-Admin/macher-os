/**
 * Eingang fürs Büro: alles Neue an EINEM Ort – Anfragen, Kundennachrichten, Freigaben.
 * Keine eigene Sammlung: der Eingang ist eine Sicht auf Aufträge (Phase „anfrage“), Nachrichten und Hinweise.
 * Ein Eintrag verschwindet, sobald seine Hauptaktion erledigt ist (nächster Schritt geplant, gelesen, freigegeben).
 */
import { aufloesen, db } from '@core/db';
import { offeneHinweise } from '@core/macher';
import { pfadZu } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { hatNaechstenSchritt, KANAL_TEXT } from '@modules/anfragen/daten';
import { istKundenNachricht, KANAL_LABEL, threads } from '@modules/nachrichten/daten';
import { postfachAdresse } from '../../../api/eingang/_logik';

export type EingangsArt = 'anfrage' | 'nachricht' | 'freigabe';

export interface EingangsEintrag {
  schluessel: string;
  art: EingangsArt;
  titel: string;
  text?: string;
  /** Zeitpunkt (ISO) – neueste oben */
  zeit: string;
  /** Herkunft als Text, z. B. „E-Mail“ */
  kanal?: string;
  dringend?: boolean;
  /** genau eine Hauptaktion: Pfad öffnen oder registrierte Aktion ausführen */
  aktion: { label: string; pfad?: string; id?: string; payload?: unknown };
}

export const ART_LABEL: Record<EingangsArt, string> = { anfrage: 'Anfrage', nachricht: 'Nachricht', freigabe: 'Freigabe' };

const kurz = (t: string, n = 90) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export function eingangsEintraege(ich: Mitarbeiter | undefined, jetzt = new Date()): EingangsEintrag[] {
  const liste: EingangsEintrag[] = [];
  const belegt = new Set<string>();

  // 1. Anfragen ohne nächsten Schritt
  for (const a of db.auftraege.where((x) => x.phase === 'anfrage')) {
    if (hatNaechstenSchritt(a.id)) continue;
    const kunde = db.kunden.get(a.kundeId);
    belegt.add(`auftraege:${a.id}`);
    liste.push({
      schluessel: `anfrage:${a.id}`,
      art: 'anfrage',
      titel: a.titel,
      text: [kunde?.name, a.wunschtermin ? `Wunsch: ${a.wunschtermin}` : undefined].filter(Boolean).join(' · ') || undefined,
      zeit: a.erstelltAm,
      kanal: a.quelle ? KANAL_TEXT[a.quelle] : undefined,
      dringend: a.dringend,
      aktion: { label: 'Nächsten Schritt wählen', pfad: `/auftraege/anfragen?anfrage=${a.id}` },
    });
  }

  // 2. Kundennachrichten – ein Eintrag je Gesprächsverlauf mit Ungelesenem
  for (const t of threads(db.nachrichten.where(istKundenNachricht), ich?.id)) {
    if (!t.ungelesenKunde) continue;
    const neu = t.nachrichten.filter((n) => n.richtung === 'ein' && !n.gelesen);
    const letzte = neu.at(-1) ?? t.letzte;
    const kunde = db.kunden.get(letzte.kundeId ?? db.auftraege.get(letzte.auftragId)?.kundeId);
    if (letzte.auftragId) belegt.add(`auftraege:${letzte.auftragId}`);
    if (kunde) belegt.add(`kunden:${kunde.id}`);
    liste.push({
      schluessel: `nachricht:${t.schluessel}`,
      art: 'nachricht',
      titel: `${kunde?.name ?? 'Kunde'} schreibt${neu.length > 1 ? ` (${neu.length} Nachrichten)` : ''}`,
      text: `„${kurz(letzte.text)}“`,
      zeit: letzte.erstelltAm,
      kanal: KANAL_LABEL[letzte.kanal],
      aktion: { label: 'Antworten', pfad: t.pfad },
    });
  }

  // 3. Freigaben und Entscheidungen (ohne das, was oben schon steht)
  const hinweise = offeneHinweise(ich ? { rolle: ich.rolle, mitarbeiterId: ich.id } : undefined);
  for (const h of hinweise) {
    if (h.art !== 'freigabe' && h.art !== 'entscheidung') continue;
    if (h.schluessel.startsWith('anfrage-') || h.schluessel.startsWith('nachricht-ungelesen:')) continue;
    if (h.bezug && belegt.has(`${h.bezug.typ}:${h.bezug.id}`)) continue;
    const gespeichert = h.hinweisId ? db.hinweise.get(h.hinweisId) : undefined;
    const objekt = aufloesen(h.bezug);
    const primaer = h.aktionen?.find((a) => a.primaer) ?? h.aktionen?.[0];
    const pfad = h.pfad ?? pfadZu(h.bezug);
    if (!primaer && !pfad) continue;
    liste.push({
      schluessel: `freigabe:${h.schluessel}`,
      art: 'freigabe',
      titel: h.titel,
      text: h.text,
      zeit: gespeichert?.erstelltAm ?? objekt?.geaendertAm ?? jetzt.toISOString(),
      aktion: primaer ? { label: primaer.label, id: primaer.aktion, payload: primaer.payload, pfad } : { label: 'Öffnen', pfad },
    });
  }

  return liste.sort((a, b) => b.zeit.localeCompare(a.zeit));
}

export function eingangsAnzahl(ich: Mitarbeiter | undefined): number {
  return eingangsEintraege(ich).length;
}

/** Weiterleitungsadresse fürs Anfrage-Postfach */
export function anfragePostfach(): string {
  return postfachAdresse(db.betrieb.get('betrieb')?.name);
}
