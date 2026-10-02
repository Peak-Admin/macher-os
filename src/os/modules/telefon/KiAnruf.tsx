/** Anzeige eines Anrufs, den der Telefonassistent angenommen hat – in der Anrufliste und im Probeanruf. */
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { personName, relativ, telLink, uhrzeit } from '@core/format';
import type { AnrufDetails, Nachricht } from '@core/objects';
import { BeispielMarke, Button, Status } from '@ui/index';
import { DRINGLICHKEIT_TEXT, ERGEBNIS_TEXT, FRAGEN, FRAGEN_REIHENFOLGE } from './agent';
import { kurztitel } from './daten';
import './telefon.css';

/** Dringlichkeit als Text; Rot nur beim echten Notfall */
export function DringlichkeitStatus({ d, immer }: { d: AnrufDetails['dringlichkeit']; immer?: boolean }) {
  if (d === 'notfall') return <Status ton="gefahr">Notfall</Status>;
  if (d === 'dringend') return <Status ton="achtung">Dringend</Status>;
  return immer ? <Status>{DRINGLICHKEIT_TEXT.normal}</Status> : null;
}

export function AnrufFelder({ details }: { details: Pick<AnrufDetails, 'felder' | 'zusammenfassung' | 'notfallGrund' | 'dauerSekunden' | 'weitergeleitetAn'> }) {
  const f = details.felder ?? {};
  const ma = db.mitarbeiter.get(details.weitergeleitetAn);
  const zeilen: [string, string][] = [
    ...(details.zusammenfassung ? [['Zusammenfassung', details.zusammenfassung] as [string, string]] : []),
    ...FRAGEN_REIHENFOLGE.filter((id) => f[id]?.trim()).map((id) => [FRAGEN[id].label, f[id]] as [string, string]),
    ...(details.notfallGrund ? [['Notfall erkannt', details.notfallGrund] as [string, string]] : []),
    ...(ma ? [['Weitergegeben an', personName(ma)] as [string, string]] : []),
    ...(details.dauerSekunden ? [['Dauer', `${Math.max(1, Math.round(details.dauerSekunden / 60))} Min.`] as [string, string]] : []),
  ];
  if (!zeilen.length) return null;
  return (
    <dl className="tel-felder">
      {zeilen.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Transkript({ zeilen }: { zeilen: AnrufDetails['transkript'] }) {
  if (!zeilen?.length) return null;
  return (
    <ol className="tel-transkript">
      {zeilen.map((z, i) => (
        <li key={i}>
          <strong>{z.wer === 'assistent' ? 'Macher' : 'Anrufer'}:</strong> {z.text}
        </li>
      ))}
    </ol>
  );
}

/** Zeile in „Letzte Anrufe“ für einen Anruf vom Telefonassistenten */
export function KiAnrufZeile({ n }: { n: Nachricht }) {
  const d = n.anruf!;
  const k = db.kunden.get(n.kundeId);
  const a = db.auftraege.get(n.auftragId);
  const ziel = a ? pfadZu({ typ: 'auftraege', id: a.id }) : k ? pfadZu({ typ: 'kunden', id: k.id }) : undefined;
  const nummer = d.felder?.rueckrufnummer || d.nummer || k?.telefon;
  const wer = k?.name ?? d.felder?.name ?? d.nummer ?? 'Unbekannt';
  const ergebnis = d.status === 'neu' ? 'Wird eingetragen' : d.status === 'fehler' ? 'Nicht eingetragen' : d.ergebnis ? ERGEBNIS_TEXT[d.ergebnis] : undefined;
  return (
    <li className="tel-ki">
      <div className="mm-listenzeile">
        <span className="mm-listenzeile-text">
          <span className="mm-listenzeile-titel">
            {kurztitel(d.felder?.anliegen || n.text)} <BeispielMarke zeigen={n.beispiel} />
          </span>
          <span className="mm-meta">{[wer, `${relativ(d.beginn || n.erstelltAm)}, ${uhrzeit(d.beginn || n.erstelltAm)}`, ergebnis, a ? `${a.nummer} · ${a.titel}` : null].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="mm-listenzeile-rechts">
          <Status icon={false}>Von Macher angenommen</Status>
          <DringlichkeitStatus d={d.dringlichkeit} />
          {d.status === 'fehler' && <Status ton="achtung">Nicht eingetragen</Status>}
        </span>
      </div>
      <details className="tel-details">
        <summary>Gespräch ansehen</summary>
        <AnrufFelder details={d} />
        <Transkript zeilen={d.transkript} />
        <div className="tel-aktionen">
          {nummer && (
            <Button klein variante="sekundaer" icon="telefon" href={telLink(nummer)}>
              Zurückrufen
            </Button>
          )}
          {ziel && (
            <Button klein variante="tertiaer" to={ziel}>
              {a ? 'Auftrag öffnen' : 'Kunde öffnen'}
            </Button>
          )}
        </div>
      </details>
    </li>
  );
}
