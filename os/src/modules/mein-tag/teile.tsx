/** Wiederverwendbare Zeilen für Heute: Termin, Aufgabe, Mitarbeiter-Lage. */
import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { heute, initialen, personName, relativ } from '@core/format';
import { pfadZu } from '@core/modul';
import type { Aufgabe, Mitarbeiter, Termin } from '@core/objects';
import { Avatar, BeispielMarke, Checkbox, ListenZeile, Status, useToast } from '@ui/index';
import type { Ton } from '@core/modul';
import { TERMIN_ART_LABEL, TERMIN_STATUS_LABEL, ortKurz, zeitText, type Lage } from './logik';

const STATUS_TON: Record<Termin['status'], Ton> = {
  geplant: 'neutral',
  bestaetigt: 'neutral',
  unterwegs: 'aktiv',
  vor_ort: 'aktiv',
  erledigt: 'erfolg',
  abgesagt: 'neutral',
};

/** Wohin führt ein Tipp auf einen Termin? Einsätze in die Einsatzansicht, sonst ins Kalender-Detail. */
export function terminPfad(t: Termin): string | undefined {
  if (t.art === 'intern') return pfadZu({ typ: 'termine', id: t.id });
  return `/heute/naechster-einsatz/${t.id}`;
}

export function TerminZeile({ t, mitNamen }: { t: Termin; mitNamen?: boolean }) {
  const wo = ortKurz(t);
  const namen = mitNamen ? t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)?.vorname).filter(Boolean).join(', ') : '';
  return (
    <ListenZeile
      to={terminPfad(t)}
      links={<span className="mm-number" style={{ minWidth: 92, fontWeight: 600 }}>{zeitText(t)}</span>}
      titel={
        <>
          {t.titel || TERMIN_ART_LABEL[t.art]} <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      untertitel={[TERMIN_ART_LABEL[t.art], wo, namen || null].filter(Boolean).join(' · ')}
      rechts={t.status !== 'geplant' ? <Status ton={STATUS_TON[t.status]}>{TERMIN_STATUS_LABEL[t.status]}</Status> : null}
    />
  );
}

export function AufgabeZeile({ a, tag = heute() }: { a: Aufgabe; tag?: string }) {
  const toast = useToast();
  const auftrag = db.auftraege.get(a.auftragId);
  const ueberfaellig = !!a.faellig && a.faellig < tag;
  const link = pfadZu({ typ: 'aufgaben', id: a.id }) ?? (auftrag ? pfadZu({ typ: 'auftraege', id: auftrag.id }) : undefined);
  const umschalten = (v: boolean) => {
    try {
      db.aufgaben.update(a.id, { erledigt: v, erledigtAm: v ? new Date().toISOString() : undefined });
      if (v)
        toast('Aufgabe erledigt.', {
          aktion: { label: 'Rückgängig', onClick: () => db.aufgaben.update(a.id, { erledigt: false, erledigtAm: undefined }) },
        });
    } catch {
      toast('Die Aufgabe wurde nicht gespeichert. Versuche es erneut.', { ton: 'achtung' });
    }
  };
  return (
    <ListenZeile
      titel={<Checkbox label={a.titel} checked={a.erledigt} onChange={umschalten} />}
      untertitel={
        <>
          {[auftrag ? `${auftrag.nummer} · ${auftrag.titel}` : null, a.faellig ? `fällig ${relativ(a.faellig)}` : null].filter(Boolean).join(' · ')}
          {link && (
            <>
              {' · '}
              <Link to={link}>Öffnen</Link>
            </>
          )}
        </>
      }
      rechts={
        ueberfaellig ? <Status ton="achtung">Überfällig</Status> : a.prioritaet === 'hoch' ? <Status ton="aktiv" icon={false}>Wichtig</Status> : null
      }
    />
  );
}

const LAGE_TON: Record<Lage['art'], Ton> = { vor_ort: 'aktiv', unterwegs: 'aktiv', geplant: 'neutral', fertig: 'erfolg', frei: 'neutral', abwesend: 'neutral' };
const LAGE_LABEL: Record<Lage['art'], string> = { vor_ort: 'Vor Ort', unterwegs: 'Unterwegs', geplant: 'Geplant', fertig: 'Fertig', frei: 'Kein Termin', abwesend: 'Abwesend' };

export function LageZeile({ m, lage }: { m: Mitarbeiter; lage: Lage }) {
  const termin = 'termin' in lage ? lage.termin : undefined;
  // geplant, aber Startzeit ist schon vorbei (Terminarten ohne Start-Knopf ausgenommen)
  const verspaetet = lage.art === 'geplant' && !!termin && termin.art !== 'intern' && new Date(termin.start).getTime() < Date.now();
  const untertitel =
    lage.art === 'geplant' && termin
      ? `ab ${zeitText(termin).split('–')[0]} · ${lage.text}${ortKurz(termin) ? ` · ${ortKurz(termin)}` : ''}`
      : lage.art === 'abwesend'
        ? `${lage.text} bis ${relativ(lage.abwesenheit.bis)}`
        : termin
          ? `${lage.text} · ${termin.titel}`
          : lage.text;
  return (
    <ListenZeile
      to={termin ? terminPfad(termin) : pfadZu({ typ: 'mitarbeiter', id: m.id })}
      links={<Avatar text={initialen(m)} farbe={m.farbe} titel={personName(m)} />}
      titel={personName(m)}
      untertitel={untertitel}
      rechts={
        verspaetet ? <Status ton="achtung">Nicht gestartet</Status> : <Status ton={LAGE_TON[lage.art]}>{LAGE_LABEL[lage.art]}</Status>
      }
    />
  );
}
