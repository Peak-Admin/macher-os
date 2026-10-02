/** Dateien hochladen – mit Größenlimit und ehrlicher Meldung zum Speicher. */
import { useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { DateiKnopf, Meldung, Schalter, Stapel, dateiLesen, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { SPEICHER_VOLL_TEXT, platzFrei } from '@modules/fotos/speicher';
import { AKZEPTIERT, MAX_DATEI_BYTES, artFuer, dateiFehler, titelAusName } from './daten';
import { groesseText } from '@modules/fotos/daten';

export function Hochladen({ auftragId, fertig }: { auftragId?: ID; fertig: () => void }) {
  const toast = useToast();
  const [auftrag, setAuftrag] = useState<ID | undefined>(auftragId);
  const [fuerKunde, setFuerKunde] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);

  const gewaehlt = async (liste: File[]) => {
    if (!liste.length) return;
    setLaedt(true);
    const probleme: string[] = [];
    let ok = 0;
    for (const f of liste) {
      const fehl = dateiFehler(f);
      if (fehl) {
        probleme.push(fehl);
        continue;
      }
      try {
        const d = await dateiLesen(f);
        if (!platzFrei(d.url.length)) {
          probleme.push(`„${f.name}“: ${SPEICHER_VOLL_TEXT}`);
          continue;
        }
        db.dokumente.create({
          art: artFuer(f.name, f.type),
          titel: titelAusName(f.name),
          url: d.url,
          mime: d.mime,
          groesse: d.bytes,
          auftragId: auftrag || undefined,
          fuerKunde,
          tags: [],
        });
        ok++;
      } catch {
        probleme.push(`„${f.name}“ konnte nicht gelesen werden.`);
      }
    }
    setLaedt(false);
    setFehler(probleme);
    if (ok) toast(ok === 1 ? 'Datei gespeichert.' : `${ok} Dateien gespeichert.`);
    if (ok && !probleme.length) fertig();
  };

  return (
    <Stapel abstand={16}>
      <AuftragAuswahl label="Auftrag" optional nurOffene={false} wert={auftrag} onChange={(id) => setAuftrag(id || undefined)} />
      <Schalter label="Für Kunden sichtbar" beschreibung="Der Kunde sieht die Datei in seinem Kundenbereich." checked={fuerKunde} onChange={setFuerKunde} />
      <p className="mm-meta">Pläne, PDFs, Zeichnungen, Fotos. Höchstens {groesseText(MAX_DATEI_BYTES)} pro Datei, Bilder werden automatisch verkleinert.</p>
      {fehler.map((f) => (
        <Meldung key={f} ton="achtung">
          {f}
        </Meldung>
      ))}
      <DateiKnopf variante="primaer" accept={AKZEPTIERT} mehrfach onDateien={gewaehlt} breit laedt={laedt} laedtText="Wird gespeichert …">
        Dateien auswählen
      </DateiKnopf>
    </Stapel>
  );
}
