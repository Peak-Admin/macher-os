/** Tägliche Bedarfsprüfung → ein Hinweis in „Braucht dich“ (gespeichert, dedupliziert, schließt sich selbst). */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { automationAn, erledigt, hinweis, hinweisErledigen } from '@core/macher';
import { datumKurz, heute } from '@core/format';
import { bedarfZusammenfassung, berechneBedarf } from './daten';

export const BEDARF_AUTOMATION = 'bedarf.taeglich-pruefen';
export const BEDARF_SCHLUESSEL = 'bedarf-fehlt';

export function bedarfHinweisAktualisieren(opts: { protokoll?: boolean } = {}) {
  const zeilen = berechneBedarf();
  const s = bedarfZusammenfassung(zeilen);
  const offen = db.hinweise.where((h) => h.schluessel === BEDARF_SCHLUESSEL && h.status === 'offen');
  if (opts.protokoll && einstellung('bedarf.geprueftAm', '') !== heute()) {
    setzeEinstellung('bedarf.geprueftAm', heute());
    erledigt(BEDARF_AUTOMATION, s.gesamt ? `Materialbedarf geprüft: ${s.gesamt} ${s.gesamt === 1 ? 'Artikel fehlt' : 'Artikel fehlen'}` : 'Materialbedarf geprüft: alles da', {
      text: s.gesamt ? 'Hinweis mit Bestellvorschlag liegt unter „Braucht dich“.' : undefined,
    });
  }
  if (!s.gesamt) {
    offen.forEach((h) => hinweisErledigen(h.id));
    return;
  }
  const titel = s.auftrag ? `Material fehlt: ${s.auftrag} ${s.auftrag === 1 ? 'Artikel' : 'Artikel'} für anstehende Aufträge` : `${s.mindest} Lagerartikel unter Mindestbestand`;
  const text = `${s.fruehestens ? `Frühester Bedarf: ${datumKurz(s.fruehestens)} – ` : ''}Ein Klick legt Bestellentwürfe je Lieferant an.`;
  const gewicht = s.auftrag ? 70 : 40;
  if (offen.length) {
    const h = offen[0];
    if (h.titel !== titel || h.text !== text || h.gewicht !== gewicht) db.hinweise.update(h.id, { titel, text, gewicht }, { leise: true });
    return;
  }
  hinweis({
    art: 'entscheidung',
    titel,
    text,
    gewicht,
    schluessel: BEDARF_SCHLUESSEL,
    fuerRollen: ['chef', 'buero'],
    aktionen: [
      { id: 'material.bestellvorschlag', label: 'Bestellvorschlag erstellen', primaer: true },
      { id: 'material.bedarf-oeffnen', label: 'Bedarf ansehen' },
    ],
  });
}

let geplant: ReturnType<typeof setTimeout> | undefined;
/** Nach Datenänderungen gebündelt neu rechnen */
export function bedarfSpaeterPruefen() {
  if (geplant) return;
  geplant = setTimeout(() => {
    geplant = undefined;
    if (automationAn(BEDARF_AUTOMATION)) bedarfHinweisAktualisieren({ protokoll: true });
  }, 300);
}
