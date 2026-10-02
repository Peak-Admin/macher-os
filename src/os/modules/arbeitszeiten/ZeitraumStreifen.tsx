import { Meta } from '@ui/index';
import { stunden } from './daten';
import { tageKurz, type ZeitraumSumme } from './zusammenfassung';
import './arbeitszeiten.css';

/**
 * Übersicht über den gewählten Zeitraum: Arbeitszeit · Fahrzeit · Überstundenabbau · Urlaub · Krank.
 * Steht über den einzelnen Buchungen. Zeigt nur, was wirklich erfasst ist – sonst einen Leerzustand.
 */
export function ZeitraumStreifen({ summe, titel, wer }: { summe: ZeitraumSumme; titel: string; wer: string }) {
  if (summe.leer)
    return (
      <section className="az-streifen" aria-label={`Übersicht ${titel}`}>
        <div className="az-streifen-kopf">
          <h2 className="az-streifen-titel">{titel}</h2>
          <Meta>{wer}</Meta>
        </div>
        <Meta>In diesem Zeitraum ist noch nichts gebucht: keine Zeiten, kein Urlaub, keine Krankheit.</Meta>
      </section>
    );
  const kacheln = [
    {
      label: 'Arbeitszeit',
      wert: summe.arbeit,
      hinweis: summe.laufend ? `inkl. ${summe.laufend === 1 ? '1 laufende Zeit' : `${summe.laufend} laufende Zeiten`}` : `Baustelle ${stunden(summe.baustelle)}`,
    },
    { label: 'Fahrzeit', wert: summe.fahrt },
    {
      label: 'Überstunden\u00ADabbau',
      wert: summe.abbau.minuten,
      hinweis: summe.abbau.tage ? tageKurz(summe.abbau.tage) : undefined,
    },
    {
      label: 'Urlaub',
      wert: summe.urlaub.minuten,
      hinweis: summe.urlaub.tage ? tageKurz(summe.urlaub.tage) : undefined,
    },
    {
      label: 'Krank',
      wert: summe.krank.minuten,
      hinweis: summe.krank.tage ? tageKurz(summe.krank.tage) : undefined,
    },
  ];
  return (
    <section className="az-streifen" aria-label={`Übersicht ${titel}`}>
      <div className="az-streifen-kopf">
        <h2 className="az-streifen-titel">{titel}</h2>
        <Meta>{wer}</Meta>
      </div>
      <dl className="az-streifen-liste">
        {kacheln.map((k) => (
          <div key={k.label} className="az-kachel">
            <dt>{k.label}</dt>
            <dd className={k.wert ? 'az-kachel-wert' : 'az-kachel-wert az-kachel-wert--null'}>{stunden(k.wert)}</dd>
            {k.hinweis && <dd className="mm-meta">{k.hinweis}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
