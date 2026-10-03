import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { heute, relativ } from '@core/format';
import type { Aufgabe } from '@core/objects';
import { BeispielMarke, Checkbox, ListenZeile, Status, useToast } from '@ui/index';
import { Personenbild } from '@ui/person';
import { abhaken, aufgabePfad } from './daten';

/** Eine Aufgabe in einer Liste: schnell abhaken, Titel öffnet das Detail */
export function AufgabeZeile({ a, ohneAuftrag }: { a: Aufgabe; ohneAuftrag?: boolean }) {
  const toast = useToast();
  const auftrag = !ohneAuftrag ? db.auftraege.get(a.auftragId) : undefined;
  const wer = db.mitarbeiter.get(a.zustaendigId);
  const ueberfaellig = !a.erledigt && !!a.faellig && a.faellig < heute();
  return (
    <ListenZeile
      links={
        <Checkbox
          label={<span className="sr-only">{a.erledigt ? 'Wieder öffnen' : 'Abhaken'}: {a.titel}</span>}
          checked={a.erledigt}
          onChange={(v) => {
            abhaken(a.id, v);
            if (v) toast('Aufgabe erledigt.', { aktion: { label: 'Rückgängig', onClick: () => abhaken(a.id, false) } });
          }}
        />
      }
      titel={
        <Link to={aufgabePfad(a.id)} style={{ color: 'inherit', textDecoration: a.erledigt ? 'line-through' : undefined }}>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </Link>
      }
      untertitel={[auftrag ? `${auftrag.nummer} · ${auftrag.titel}` : null, a.notiz].filter(Boolean).join(' · ') || undefined}
      rechts={
        <>
          {a.prioritaet === 'hoch' && !a.erledigt && <Status ton="achtung">Wichtig</Status>}
          {a.faellig && !a.erledigt && <Status ton={ueberfaellig ? 'gefahr' : 'neutral'} icon={ueberfaellig}>{relativ(a.faellig)}</Status>}
          {wer && <Personenbild m={wer} groesse={28} />}
        </>
      }
    />
  );
}
