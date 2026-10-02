/**
 * Titelbilder: Profilbild eines Mitarbeiters, Foto eines Fahrzeugs.
 * Ein Titelbild ist ein ganz normales Dokument (`art: 'foto'`) mit Bezug auf das Objekt und einem Tag –
 * keine Kopie, kein eigenes Feld. Das neueste gewinnt, ältere bleiben im Verlauf.
 * Das runde Profilbild selbst (`Personenbild`, `Person`, `Personen`) liegt im UI-Kern (`@ui/person`).
 */
import { db } from '@core/db';
import { personName } from '@core/format';
import type { Bezug, Dokument, Mitarbeiter } from '@core/objects';
import { bildVerkleinern, DateiKnopf, useToast } from '@ui/index';
import { PROFILBILD, profilbild } from '@ui/person';

export { PROFILBILD, Person, Personen, Personenbild, profilbild } from '@ui/person';

export function titelbild(bezug: Bezug, tag: string): Dokument | undefined {
  return db.dokumente
    .where((d) => d.art === 'foto' && !!d.url && d.bezug?.typ === bezug.typ && d.bezug.id === bezug.id && !!d.tags?.includes(tag))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
}

export async function titelbildSetzen(bezug: Bezug, tag: string, datei: File, titel: string, max = 800): Promise<Dokument> {
  const b = await bildVerkleinern(datei, { max });
  return db.dokumente.create({ art: 'foto', titel, url: b.url, mime: b.mime, groesse: b.bytes, bezug, tags: [tag] });
}

export function ProfilbildKnopf({ m }: { m: Mitarbeiter }) {
  const toast = useToast();
  db.dokumente.use();
  const hat = !!profilbild(m.id);
  return (
    <DateiKnopf
      accept="image/*"
      klein
      variante="tertiaer"
      icon="kamera"
      onDateien={async ([d]) => {
        try {
          await titelbildSetzen({ typ: 'mitarbeiter', id: m.id }, PROFILBILD, d, `Profilbild ${personName(m)}`, 400);
          toast('Profilbild gespeichert.');
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Das Bild ließ sich nicht laden.', { ton: 'achtung' });
        }
      }}
    >
      {hat ? 'Foto ändern' : 'Foto hinzufügen'}
    </DateiKnopf>
  );
}
