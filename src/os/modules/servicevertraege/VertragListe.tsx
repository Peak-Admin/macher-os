import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { useDarf } from '@core/session';
import { datum, euro, heute, passt } from '@core/format';
import { BeispielMarke, Button, Filter, Kennzahl, Leer, Liste, ListenZeile, Raster, Seite, Status, Suchfeld } from '@ui/index';
import { intervallText } from '../wiederkehrend/regel';
import { faelligeAbrechnung, kuendigenBis, laufzeitBis, preisMonat, servicevertraege, zustand, ZUSTAND_TEXT, type Servicevertrag } from './daten';

type F = 'laufend' | 'achtung' | 'beendet';

export function VertragListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<F>('laufend');
  const alle = servicevertraege.use();
  const t = heute();
  const z = (v: Servicevertrag) => zustand(v, t);
  const laufend = alle.filter((v) => !['beendet'].includes(z(v)));
  const achtung = alle.filter((v) => ['frist', 'laeuft_aus'].includes(z(v)) || !!faelligeAbrechnung(v, t));
  const beendet = alle.filter((v) => z(v) === 'beendet');
  const basis = filter === 'laufend' ? laufend : filter === 'achtung' ? achtung : beendet;
  const liste = basis
    .filter((v) => !q || passt(q, v.nummer, v.titel, db.kunden.get(v.kundeId)?.name, ...v.leistungen))
    .sort((a, b) => (db.kunden.get(a.kundeId)?.name ?? '').localeCompare(db.kunden.get(b.kundeId)?.name ?? '', 'de'));
  const jahresumsatz = laufend.filter((v) => z(v) !== 'gekuendigt').reduce((s, v) => s + v.preisJahr, 0);

  return (
    <Seite
      titel="Serviceverträge"
      untertitel="Feste Wartung, fester Preis – Lotte rechnet ab und erinnert an Fristen."
      aktion={<Button icon="plus" to="/auftraege/servicevertraege/neu">Vertrag anlegen</Button>}
    >
      {alle.length > 0 && (
        <Raster min={180}>
          <Kennzahl label="Laufende Verträge" wert={laufend.length} />
          {geld && <Kennzahl label="Wiederkehrend pro Jahr" wert={euro(jahresumsatz)} hinweis="netto, ohne gekündigte" />}
          <Kennzahl label="Braucht dich" wert={achtung.length} ton={achtung.length ? 'achtung' : undefined} hinweis="Fristen & Abrechnung" />
        </Raster>
      )}
      {alle.length > 0 && (
        <>
          <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Nummer, Leistung …" />
          <Filter
            label="Verträge filtern"
            wert={filter}
            onChange={setFilter}
            optionen={[
              { wert: 'laufend', label: 'Laufend', zaehler: laufend.length },
              { wert: 'achtung', label: 'Braucht dich', zaehler: achtung.length },
              { wert: 'beendet', label: 'Beendet', zaehler: beendet.length },
            ]}
          />
        </>
      )}
      <Liste
        leer={
          alle.length ? (
            <Leer titel="Keine Verträge in dieser Ansicht" text={q ? 'Passe die Suche an.' : undefined} icon="suche" />
          ) : (
            <Leer
              titel="Noch keine Serviceverträge"
              text="Leg deinen ersten Wartungsvertrag an. Lotte plant dann die Wartungen, schreibt die Rechnungen und erinnert dich an Kündigungsfristen."
              aktion={<Button to="/auftraege/servicevertraege/neu">Vertrag anlegen</Button>}
              icon="dokument"
            />
          )
        }
      >
        {liste.map((v) => {
          const zz = ZUSTAND_TEXT[z(v)];
          const f = faelligeAbrechnung(v, t);
          const k = db.kunden.get(v.kundeId);
          const info =
            z(v) === 'frist'
              ? `Kündigung bis ${datum(kuendigenBis(v, t))}`
              : z(v) === 'laeuft_aus' || z(v) === 'gekuendigt'
                ? `Endet ${datum(laufzeitBis(v, t))}`
                : `Wartung ${intervallText(v.intervallMonate)}`;
          return (
            <ListenZeile
              key={v.id}
              to={`/auftraege/servicevertraege/${v.id}`}
              titel={
                <>
                  {k?.name ?? 'Kunde fehlt'} · {v.titel} <BeispielMarke zeigen={v.beispiel} />
                </>
              }
              untertitel={[v.nummer, info, geld ? `${euro(preisMonat(v))} / Monat` : undefined].filter(Boolean).join(' · ')}
              rechts={f ? <Status ton="achtung">Abrechnung fällig</Status> : <Status ton={zz.ton}>{zz.text}</Status>}
            />
          );
        })}
      </Liste>
    </Seite>
  );
}
