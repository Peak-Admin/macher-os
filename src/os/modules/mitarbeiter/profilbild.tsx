/**
 * Titelbilder: Profilbild eines Mitarbeiters, Foto eines Fahrzeugs.
 * Ein Titelbild ist ein ganz normales Dokument (`art: 'foto'`) mit Bezug auf das Objekt und einem Tag –
 * keine Kopie, kein eigenes Feld. Das neueste gewinnt, ältere bleiben im Verlauf.
 * Kernwunsch: `bildId` an Mitarbeiter/Betriebsmittel und ein `Avatar` mit Bild im UI-Kern.
 */
import { db } from '@core/db';
import { initialen, personName } from '@core/format';
import type { Bezug, Dokument, ID, Mitarbeiter } from '@core/objects';
import { Avatar, bildVerkleinern, DateiKnopf, useToast } from '@ui/index';

export const PROFILBILD = 'profilbild';

export function titelbild(bezug: Bezug, tag: string): Dokument | undefined {
  return db.dokumente
    .where((d) => d.art === 'foto' && !!d.url && d.bezug?.typ === bezug.typ && d.bezug.id === bezug.id && !!d.tags?.includes(tag))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
}

export async function titelbildSetzen(bezug: Bezug, tag: string, datei: File, titel: string, max = 800): Promise<Dokument> {
  const b = await bildVerkleinern(datei, { max });
  return db.dokumente.create({ art: 'foto', titel, url: b.url, mime: b.mime, groesse: b.bytes, bezug, tags: [tag] });
}

export const profilbild = (mitarbeiterId: ID | undefined) => (mitarbeiterId ? titelbild({ typ: 'mitarbeiter', id: mitarbeiterId }, PROFILBILD)?.url : undefined);

/** Rundes Profilbild – ohne Foto die Initialen in der Kennfarbe */
export function Personenbild({ m, groesse = 32 }: { m: Mitarbeiter; groesse?: number }) {
  db.dokumente.use();
  const url = profilbild(m.id);
  if (!url) return <Avatar text={initialen(m)} farbe={m.farbe} groesse={groesse} titel={personName(m)} />;
  return <img className="mm-avatar" src={url} alt={personName(m)} width={groesse} height={groesse} style={{ width: groesse, height: groesse, objectFit: 'cover' }} />;
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
