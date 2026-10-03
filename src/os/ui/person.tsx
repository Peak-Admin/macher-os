/**
 * Profilbilder für Menschen im Betrieb – überall, wo ein Mitarbeiter genannt wird, steht sein Bild daneben.
 * Quelle: das neueste Foto-Dokument mit Tag `profilbild` am Mitarbeiter (keine Kopie, kein eigenes Feld).
 * Ohne Foto: in der Spielwiese ein Porträt des Beispielteams, sonst die Initialen in der Kennfarbe.
 */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { initialen, personName } from '@core/format';
import type { ID, Mitarbeiter } from '@core/objects';
import { Avatar } from './index';

export const PROFILBILD = 'profilbild';

/** Porträts des Beispielteams (public/bilder/os/team, Quelle: docs/design/bilder.md) */
const BEISPIEL_TEAM: Record<string, string> = {
  'max macher': 'max-macher',
  'jonas becker': 'jonas-becker',
  'mehmet yılmaz': 'mehmet-yilmaz',
  'sandra krüger': 'sandra-krueger',
  'lukas wagner': 'lukas-wagner',
};

/** Schlüssel wie `SPIELWIESE_KEY` in `@core/seed` (hier nicht importiert, sonst Kreis über die Modulliste) */
const istSpielwiese = () => einstellung<boolean>('modus.spielwiese', false) === true;

/** Porträt aus dem Beispielteam – nur für Beispieldaten oder in der Spielwiese */
export function beispielProfilbild(m: Pick<Mitarbeiter, 'vorname' | 'nachname' | 'beispiel'>): string | undefined {
  if (!m.beispiel && !istSpielwiese()) return undefined;
  const datei = BEISPIEL_TEAM[`${m.vorname} ${m.nachname}`.trim().toLowerCase()];
  return datei ? `/bilder/os/team/${datei}.webp` : undefined;
}

/** URL des Profilbilds – hochgeladenes Foto vor Beispielporträt */
export function profilbild(mitarbeiterId: ID | undefined): string | undefined {
  if (!mitarbeiterId) return undefined;
  const foto = db.dokumente
    .where((d) => d.art === 'foto' && !!d.url && d.bezug?.typ === 'mitarbeiter' && d.bezug.id === mitarbeiterId && !!d.tags?.includes(PROFILBILD))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
  if (foto?.url) return foto.url;
  const m = db.mitarbeiter.get(mitarbeiterId);
  return m ? beispielProfilbild(m) : undefined;
}

type PersonArg = Mitarbeiter | ID | undefined | null;
const aufloesen = (m: PersonArg): Mitarbeiter | undefined => (typeof m === 'string' ? db.mitarbeiter.get(m) : (m ?? undefined));

/** Rundes Profilbild – ohne Foto die Initialen in der Kennfarbe */
export function Personenbild({ m, groesse = 32, dekorativ }: { m: PersonArg; groesse?: number; dekorativ?: boolean }) {
  db.dokumente.use();
  const p = aufloesen(m);
  const url = p ? profilbild(p.id) : undefined;
  const name = p ? personName(p) : undefined;
  if (!url) return <Avatar text={initialen(p)} farbe={p?.farbe} groesse={groesse} titel={dekorativ ? undefined : name} />;
  return (
    <img
      className="mm-avatar mm-avatar--foto"
      src={url}
      alt={dekorativ ? '' : (name ?? '')}
      data-tipp={dekorativ ? undefined : name}
      width={groesse}
      height={groesse}
      loading="lazy"
      decoding="async"
      style={{ width: groesse, height: groesse }}
    />
  );
}

/** Profilbild + Name in einer Zeile – für Listen, Auswahlfelder, Chips und Fließtext */
export function Person({ m, groesse = 24, children }: { m: PersonArg; groesse?: number; children?: ReactNode }) {
  const p = aufloesen(m);
  return (
    <span className="mm-person">
      <Personenbild m={p} groesse={groesse} dekorativ />
      <span className="mm-person-name">{children ?? personName(p)}</span>
    </span>
  );
}

/** Mehrere Personen als überlappende Bilderreihe; Namen als Text daneben, wenn `namen` gesetzt */
export function Personen({ ids, groesse = 24, max = 4, namen }: { ids: (ID | Mitarbeiter)[]; groesse?: number; max?: number; namen?: boolean }) {
  const leute = ids.map(aufloesen).filter((x): x is Mitarbeiter => !!x);
  if (!leute.length) return null;
  const rest = leute.length - max;
  const text = leute.map(personName).join(', ');
  return (
    <span className="mm-personen" data-tipp={namen ? undefined : text}>
      <span className="mm-personen-bilder" aria-hidden={namen ? true : undefined} role={namen ? undefined : 'img'} aria-label={namen ? undefined : text}>
        {leute.slice(0, max).map((p) => (
          <Personenbild key={p.id} m={p} groesse={groesse} dekorativ />
        ))}
        {rest > 0 && <Avatar text={`+${rest}`} farbe="#eef1ed" groesse={groesse} />}
      </span>
      {namen && <span className="mm-person-name">{text}</span>}
    </span>
  );
}
