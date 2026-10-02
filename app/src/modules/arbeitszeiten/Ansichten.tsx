import { db, useDatenstand } from '@core/db';
import { datum, heute, personName, plusTage } from '@core/format';
import type { ID } from '@core/objects';
import { istBuero, useIch } from '@core/session';
import { Button, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, Tabelle } from '@ui/index';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { dauer, saldoText, stundenkonto, stunden, wochenStart } from './daten';
import { Stempeluhr, zeitTitel } from './Stempeluhr';
import { ZeitenNav } from './ZeitenNav';
import { wochenWerte } from './ZeitenWoche';

/** Startansicht: Stempeluhr + heutige Einträge + (Büro) wer gerade arbeitet */
export function StempeluhrSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const t = heute();
  const meine = db.zeiten.where((z) => z.mitarbeiterId === ich?.id && z.datum === t).sort((a, b) => a.start.localeCompare(b.start));
  const laufen = buero ? sortiert(db.mitarbeiter.where((m) => istAktiv(m) && m.id !== ich?.id)).map((m) => ({ m, z: db.zeiten.where((z) => z.mitarbeiterId === m.id && !z.ende)[0] })) : [];
  return (
    <Seite titel="Arbeitszeiten" untertitel="Ein Tap zum Starten, ein Tap zum Stoppen.">
      <ZeitenNav aktiv="stempeluhr" />
      <Stempeluhr />
      {meine.length > 0 && (
        <Stapel abstand={8}>
          <strong>Heute</strong>
          <Liste>
            {meine.map((z) => (
              <ListenZeile
                key={z.id}
                titel={`${z.start}–${z.ende ?? 'läuft'} · ${zeitTitel(z)}`}
                untertitel={z.ende ? `${stunden(dauer(z))}${z.pauseMinuten ? ` · ${z.pauseMinuten} min Pause` : ''}` : undefined}
                to={`/betrieb/arbeitszeiten/woche?datum=${t}`}
              />
            ))}
          </Liste>
        </Stapel>
      )}
      {buero && laufen.length > 0 && (
        <Stapel abstand={8}>
          <strong>Team gerade</strong>
          <Liste>
            {laufen.map(({ m, z }) => (
              <ListenZeile
                key={m.id}
                titel={personName(m)}
                untertitel={z ? `seit ${z.start}${z.datum < t ? ` am ${datum(z.datum)}` : ''} · ${zeitTitel(z)}` : 'Keine Zeit läuft'}
                rechts={z ? <Status ton={z.datum < t ? 'achtung' : 'aktiv'}>{z.datum < t ? 'Läuft seit gestern' : 'Läuft'}</Status> : <Status>Nicht gestempelt</Status>}
                to={`/betrieb/arbeitszeiten/woche?ma=${m.id}`}
              />
            ))}
          </Liste>
        </Stapel>
      )}
    </Seite>
  );
}

/** Stundenkonto: Soll aus Wochenstunden, Abwesenheiten gutgeschrieben, Ist aus erfassten Zeiten */
export function StundenkontoSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const bis = plusTage(heute(), -1);
  const leute = buero ? sortiert(db.mitarbeiter.where((m) => istAktiv(m))) : ich ? [ich] : [];
  const zeiten = db.zeiten.all();
  const abw = db.abwesenheiten.all();
  const zeilen = leute.map((m) => ({ m, k: stundenkonto(m, zeiten, abw, bis) }));
  const eigenes = ich ? stundenkonto(ich, zeiten, abw, bis) : undefined;
  const woche = ich ? wochenWerte(ich, wochenStart(heute())) : undefined;

  return (
    <Seite titel="Stundenkonto" untertitel={`Stand: Ende ${datum(bis)}. Urlaub, Krankheit und Berufsschule zählen als erfüllt.`}>
      <ZeitenNav aktiv="konto" />
      {eigenes && (
        <Raster min={180}>
          <Kennzahl label="Dein Stundenkonto" wert={saldoText(eigenes.saldo)} ton={eigenes.saldo < 0 ? 'achtung' : 'erfolg'} zeitraum={`seit ${datum(eigenes.von)}`} />
          <Kennzahl label="Ist" wert={stunden(eigenes.ist)} hinweis={`Soll ${stunden(eigenes.soll)}`} />
          {woche && <Kennzahl label="Diese Woche" wert={stunden(woche.ist)} hinweis={`Soll bis heute ${stunden(woche.soll)}`} to="/betrieb/arbeitszeiten/woche" />}
        </Raster>
      )}
      {buero ? (
        <Tabelle
          zeilen={zeilen}
          schluessel={(z) => z.m.id}
          zeilenLink={(z) => `/betrieb/arbeitszeiten/woche?ma=${z.m.id}`}
          leer={<Leer titel="Noch niemand im Team" icon="team" />}
          spalten={[
            { titel: 'Mitarbeiter', wert: (z) => personName(z.m), sortierWert: (z) => z.m.vorname },
            { titel: 'Erfasst seit', wert: (z) => (z.k ? datum(z.k.von) : '–'), nebensaechlich: true },
            { titel: 'Soll', wert: (z) => (z.k ? stunden(z.k.soll) : '–'), zahl: true, nebensaechlich: true },
            { titel: 'Ist', wert: (z) => (z.k ? stunden(z.k.ist) : '–'), zahl: true, nebensaechlich: true },
            {
              titel: 'Konto',
              wert: (z) => (z.k ? <Status ton={z.k.saldo < 0 ? 'achtung' : 'erfolg'}>{saldoText(z.k.saldo)}</Status> : <Status>Noch keine Zeiten</Status>),
              sortierWert: (z) => z.k?.saldo ?? 0,
            },
          ]}
        />
      ) : (
        !eigenes && (
          <Leer titel="Noch keine Zeiten" text="Sobald du deine erste Zeit stempelst, rechnet Macher dein Stundenkonto." icon="uhr" aktion={<Button to="/betrieb/arbeitszeiten">Zur Stempeluhr</Button>} />
        )
      )}
      <Meldung>
        Das Konto beginnt mit der ersten erfassten Zeit in Macher OS (frühestens am Jahresanfang). Übernommene Stunden aus dem alten System trägst du als Zeit mit Notiz nach.
      </Meldung>
      <Meta>Feiertage: bundesweite gesetzliche Feiertage sind berücksichtigt.</Meta>
    </Seite>
  );
}

/** Tab „Zeiten“ am Mitarbeiter */
export function MitarbeiterZeitenTab({ id }: { id: ID }) {
  useDatenstand();
  const m = db.mitarbeiter.get(id);
  const montag = wochenStart(heute());
  if (!m) return null;
  const w = wochenWerte(m, montag);
  const k = stundenkonto(m, db.zeiten.all(), db.abwesenheiten.all(), plusTage(heute(), -1));
  const letzte = db.zeiten
    .where((z) => z.mitarbeiterId === id)
    .sort((a, b) => (b.datum + b.start).localeCompare(a.datum + a.start))
    .slice(0, 8);
  return (
    <Stapel abstand={16}>
      <Raster min={160}>
        <Kennzahl label="Diese Woche" wert={stunden(w.ist)} hinweis={`Soll bis heute ${stunden(w.soll)}`} />
        <Kennzahl label="Stundenkonto" wert={k ? saldoText(k.saldo) : undefined} zeitraum={k ? `seit ${datum(k.von)}` : undefined} />
      </Raster>
      <Liste leer={<Leer titel="Noch keine Zeiten" text={`${m.vorname} hat noch nichts gestempelt.`} icon="uhr" />}>
        {letzte.map((z) => (
          <ListenZeile
            key={z.id}
            titel={`${datum(z.datum)} · ${z.start}–${z.ende ?? 'läuft'}`}
            untertitel={`${zeitTitel(z)}${z.ende ? ` · ${stunden(dauer(z))}` : ''}`}
            rechts={!z.ende ? <Status ton="aktiv">Läuft</Status> : z.freigegeben ? <Status ton="erfolg">Freigegeben</Status> : <Status>Offen</Status>}
          />
        ))}
      </Liste>
      <div>
        <Button variante="sekundaer" to={`/betrieb/arbeitszeiten/woche?ma=${id}`}>
          Wochenübersicht öffnen
        </Button>
      </div>
    </Stapel>
  );
}
