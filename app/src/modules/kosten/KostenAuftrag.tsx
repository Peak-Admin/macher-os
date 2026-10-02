/** Aufschlüsselung der tatsächlichen Kosten eines Auftrags – als Tab in der Auftragsakte und als eigene Seite. */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, euro, personName, zahl } from '@core/format';
import type { ID } from '@core/objects';
import { Abschnitt, Kennzahl, Leer, Liste, ListenZeile, Meldung, Raster, Stapel, Tabelle } from '@ui/index';
import { stundenText } from './basis';
import { auftragKosten } from './daten';
import { NurMitGeld, useBasis } from './gemeinsam';
import { NachkalkulationKurz } from '../nachkalkulation/NachkalkulationKurz';

export function KostenTab({ id }: { id: ID }) {
  return (
    <NurMitGeld>
      <KostenAuftrag id={id} mitNachkalkulation />
    </NurMitGeld>
  );
}

export function KostenAuftrag({ id, mitNachkalkulation }: { id: ID; mitNachkalkulation?: boolean }) {
  const b = useBasis();
  const k = useMemo(() => auftragKosten(id, b), [id, b]);

  if (!k.hatDaten) {
    return (
      <Stapel>
        <Leer
          titel="Noch keine Kosten"
          text="Sobald Zeiten auf diesen Auftrag gebucht, Material als verbraucht erfasst oder Belege zugeordnet sind, siehst du hier die tatsächlichen Kosten."
          icon="euro"
        />
        {k.materialOffen > 0 && <Meldung>Geplantes Material im Wert von {euro(k.materialOffen)} (EK) ist noch nicht verbraucht und deshalb nicht eingerechnet.</Meldung>}
      </Stapel>
    );
  }

  return (
    <Stapel abstand={24}>
      <Raster min={200}>
        <Kennzahl label="Kosten gesamt" wert={euro(k.gesamt)} hinweis="Lohn + Material + Belege, netto" />
        <Kennzahl label="Lohn" wert={euro(k.lohn)} hinweis={stundenText(k.minuten)} />
        <Kennzahl label="Material" wert={euro(k.material)} hinweis="verbraucht, zum EK" />
        <Kennzahl label="Belege" wert={euro(k.belege)} hinweis={k.belegZeilen.length === 1 ? '1 Beleg' : `${k.belegZeilen.length} Belege`} />
      </Raster>

      {k.ohneKostensatz.length > 0 && (
        <Meldung ton="achtung" titel="Kostensatz fehlt">
          Bei {k.ohneKostensatz.map((m, i) => (
            <span key={m}>
              {i > 0 && ', '}
              <MitarbeiterLink id={m} />
            </span>
          ))}{' '}
          ist kein Kostensatz hinterlegt. Diese Stunden zählen mit 0 € – die Lohnkosten sind zu niedrig.
        </Meldung>
      )}
      {k.laufend > 0 && <Meldung>{k.laufend === 1 ? 'Eine Zeit läuft' : `${k.laufend} Zeiten laufen`} gerade – bis jetzt eingerechnet.</Meldung>}
      {k.unvollstaendig > 0 && (
        <Meldung ton="achtung">
          {k.unvollstaendig === 1 ? 'Eine Zeit hat' : `${k.unvollstaendig} Zeiten haben`} kein Ende und {k.unvollstaendig === 1 ? 'ist' : 'sind'} nicht eingerechnet. Bitte in der Zeiterfassung nachtragen.
        </Meldung>
      )}

      {mitNachkalkulation && <NachkalkulationKurz id={id} />}

      <Abschnitt titel="Arbeitszeit" hinweis="Erfasste Stunden × Kostensatz des Mitarbeiters (Lohn und Nebenkosten).">
        <Tabelle
          zeilen={k.lohnZeilen}
          schluessel={(z) => z.mitarbeiterId}
          leer={<Leer titel="Keine Zeiten gebucht" text="Zeiten kommen aus der Zeiterfassung der Mitarbeiter." icon="uhr" />}
          spalten={[
            { titel: 'Mitarbeiter', wert: (z) => <MitarbeiterLink id={z.mitarbeiterId} /> },
            { titel: 'Stunden', zahl: true, wert: (z) => stundenText(z.minuten) },
            { titel: 'davon Fahrt', zahl: true, nebensaechlich: true, wert: (z) => (z.fahrtMinuten ? stundenText(z.fahrtMinuten) : '–') },
            { titel: 'Kostensatz', zahl: true, nebensaechlich: true, wert: (z) => (z.kostensatz ? `${euro(z.kostensatz)}/h` : 'fehlt') },
            { titel: 'Kosten', zahl: true, wert: (z) => euro(z.betrag) },
          ]}
        />
      </Abschnitt>

      <Abschnitt titel="Material" hinweis={k.materialOffen ? `Noch nicht verbraucht und nicht eingerechnet: ${euro(k.materialOffen)} (EK).` : 'Nur Material mit Status „verbraucht“, zum Einkaufspreis.'}>
        <Liste leer={<Leer titel="Kein Material verbraucht" text="Material, das am Auftrag als verbraucht gebucht wird, erscheint hier." icon="paket" />}>
          {k.materialZeilen.map((m) => (
            <ListenZeile key={m.id} titel={m.text} untertitel={`${zahl(m.menge)} ${m.einheit} × ${euro(m.ek)}`} rechts={<span className="mm-number">{euro(m.betrag)}</span>} />
          ))}
        </Liste>
      </Abschnitt>

      <Abschnitt titel="Belege" hinweis="Eingangsrechnungen und Quittungen, die diesem Auftrag zugeordnet sind (netto).">
        <Liste leer={<Leer titel="Keine Belege zugeordnet" text="Ordne Eingangsrechnungen beim Erfassen dem Auftrag zu, dann zählen sie hier mit." icon="dokument" />}>
          {k.belegZeilen.map((x) => (
            <ListenZeile key={x.id} titel={x.text} untertitel={datum(x.datum)} to={pfadZu({ typ: 'belege', id: x.id })} rechts={<span className="mm-number">{euro(x.netto)}</span>} />
          ))}
        </Liste>
      </Abschnitt>
    </Stapel>
  );
}

function MitarbeiterLink({ id }: { id: ID }) {
  const m = db.mitarbeiter.get(id);
  const p = pfadZu({ typ: 'mitarbeiter', id });
  const name = m ? personName(m) : 'Unbekannt';
  return p ? <Link to={p}>{name}</Link> : <>{name}</>;
}
