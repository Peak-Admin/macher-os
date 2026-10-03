import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, heute, personName, plusTage } from '@core/format';
import type { ID } from '@core/objects';
import { istBuero, useDarf, useIch } from '@core/session';
import { Button, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, Tabelle, Zeile } from '@ui/index';
import { Person, Personenbild } from '@ui/person';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { dauer, saldoText, stundenkonto, stunden } from './daten';
import { Stempeluhr, zeitTitel } from './Stempeluhr';
import { ZeitenNav } from './ZeitenNav';
import { BUCHUNG_LABEL, arbeitsmodelle, minutenAm, modellAm, modellText, stundenbuchungen, wochenSumme } from './modell';
import { std, wochenStand } from './regelwerk';
import { BuchungDialog, ModellDialog, RegelnDialog } from './RegelDialoge';

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
                links={<Personenbild m={m} groesse={40} />}
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

/** Stundenkonto: Soll aus dem Arbeitszeitmodell, Feiertage und Abwesenheiten berücksichtigt, Ist nach Pausenregel */
export function StundenkontoSeite() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const admin = useDarf('admin');
  const buero = istBuero(ich) || personal;
  const [buchungOffen, setBuchungOffen] = useState(false);
  const [regelnOffen, setRegelnOffen] = useState(false);
  const bis = plusTage(heute(), -1);
  const leute = buero ? sortiert(db.mitarbeiter.where((m) => istAktiv(m))) : ich ? [ich] : [];
  const zeiten = db.zeiten.all();
  const abw = db.abwesenheiten.all();
  const zeilen = leute.map((m) => ({ m, k: stundenkonto(m, zeiten, abw, bis) }));
  const eigenes = ich ? stundenkonto(ich, zeiten, abw, bis) : undefined;
  const stand = ich ? wochenStand(ich) : undefined;

  return (
    <Seite titel="Stundenkonto" untertitel={`Stand: Ende ${datum(bis)}. Urlaub, Krankheit und Berufsschule zählen als erfüllt, Feiertage haben kein Soll.`}>
      <ZeitenNav aktiv="konto" />
      {eigenes && (
        <Raster min={180}>
          <Kennzahl label="Dein Stundenkonto" wert={saldoText(eigenes.saldo)} ton={eigenes.saldo < 0 ? 'achtung' : 'erfolg'} zeitraum={`seit ${datum(eigenes.von)}`} />
          {stand && <Kennzahl label="Diese Woche" wert={std(stand.erreicht)} hinweis={`von ${std(stand.soll)}`} to="/betrieb/arbeitszeiten/woche" />}
          <Kennzahl label="Gearbeitet" wert={stunden(eigenes.ist)} hinweis={`Soll ${stunden(eigenes.soll)}`} />
        </Raster>
      )}
      {buero ? (
        <Stapel abstand={8}>
          <Tabelle
            zeilen={zeilen}
            schluessel={(z) => z.m.id}
            zeilenLink={(z) => `/betrieb/arbeitszeiten/woche?ma=${z.m.id}`}
            leer={<Leer titel="Noch niemand im Team" icon="team" aktion={<Button to="/betrieb/mitarbeiter/neu">Mitarbeiter anlegen</Button>} />}
            spalten={[
              { titel: 'Mitarbeiter', wert: (z) => <Person m={z.m} />, sortierWert: (z) => z.m.vorname },
              { titel: 'Erfasst seit', wert: (z) => (z.k ? datum(z.k.von) : '–'), nebensaechlich: true },
              { titel: 'Soll', wert: (z) => (z.k ? stunden(z.k.soll) : '–'), zahl: true, nebensaechlich: true },
              { titel: 'Ist', wert: (z) => (z.k ? stunden(z.k.ist) : '–'), zahl: true, nebensaechlich: true },
              { titel: 'Gebucht', wert: (z) => (z.k?.gebucht ? saldoText(z.k.gebucht) : '–'), zahl: true, nebensaechlich: true },
              {
                titel: 'Konto',
                wert: (z) => (z.k ? <Status ton={z.k.saldo < 0 ? 'achtung' : 'erfolg'}>{saldoText(z.k.saldo)}</Status> : <Status>Noch keine Zeiten</Status>),
                sortierWert: (z) => z.k?.saldo ?? 0,
              },
            ]}
          />
          <Zeile>
            <Button klein variante="sekundaer" icon="stift" onClick={() => setBuchungOffen(true)}>
              Stundenkonto korrigieren
            </Button>
            {admin && (
              <Button klein variante="tertiaer" icon="einstellungen" onClick={() => setRegelnOffen(true)}>
                Regeln
              </Button>
            )}
          </Zeile>
        </Stapel>
      ) : (
        !eigenes && (
          <Leer titel="Noch keine Zeiten" text="Sobald du deine erste Zeit stempelst, rechnet Lotte dein Stundenkonto." icon="uhr" aktion={<Button to="/betrieb/arbeitszeiten">Zur Stempeluhr</Button>} />
        )
      )}
      <Meldung>
        Das Konto beginnt mit der ersten erfassten Zeit in Handwerk OS und läuft über den Jahreswechsel weiter. Stunden aus dem alten System trägt das Büro als Übertrag ein (Stundenkonto
        korrigieren).
      </Meldung>
      <Meta>Fehlende Pausen nach Arbeitszeitgesetz (über 6 Stunden 30 Minuten, über 9 Stunden 45 Minuten) zieht Lotte automatisch ab. Feiertage deines Bundeslands laut Plan-Einstellung haben kein Soll.</Meta>
      {buero && <BuchungDialog key={String(buchungOffen)} offen={buchungOffen} onSchliessen={() => setBuchungOffen(false)} />}
      {admin && <RegelnDialog offen={regelnOffen} onSchliessen={() => setRegelnOffen(false)} />}
    </Seite>
  );
}

/** Tab „Zeiten“ am Mitarbeiter: Woche, Konto, Arbeitszeitmodell, Kontobuchungen, letzte Zeiten */
export function MitarbeiterZeitenTab({ id }: { id: ID }) {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const darfAendern = personal || istBuero(ich);
  const [modellOffen, setModellOffen] = useState(false);
  const [buchungOffen, setBuchungOffen] = useState(false);
  const m = db.mitarbeiter.get(id);
  if (!m) return null;
  const stand = wochenStand(m);
  const k = stundenkonto(m, db.zeiten.all(), db.abwesenheiten.all(), plusTage(heute(), -1));
  const modelle = arbeitsmodelle.where((x) => x.mitarbeiterId === id);
  const aktuell = modellAm(id, heute(), modelle);
  const kuenftig = modelle.filter((x) => x.gueltigAb > heute()).sort((a, b) => a.gueltigAb.localeCompare(b.gueltigAb))[0];
  const minuten = minutenAm(m, heute(), modelle);
  const buchungen = stundenbuchungen.where((b) => b.mitarbeiterId === id).sort((a, b) => b.datum.localeCompare(a.datum));
  const letzte = db.zeiten
    .where((z) => z.mitarbeiterId === id)
    .sort((a, b) => (b.datum + b.start).localeCompare(a.datum + a.start))
    .slice(0, 8);
  return (
    <Stapel abstand={16}>
      <Raster min={160}>
        <Kennzahl label="Diese Woche" wert={std(stand.erreicht)} hinweis={`von ${std(stand.soll)}`} />
        <Kennzahl label="Stundenkonto" wert={k ? saldoText(k.saldo) : undefined} zeitraum={k ? `seit ${datum(k.von)}` : undefined} />
      </Raster>
      <Karte
        kompakt
        oberzeile="Arbeitszeit"
        titel={`${stunden(wochenSumme(minuten))} pro Woche`}
        aktion={
          darfAendern ? (
            <Button klein variante="tertiaer" icon="stift" onClick={() => setModellOffen(true)}>
              Ändern
            </Button>
          ) : undefined
        }
      >
        <Stapel abstand={4}>
          <Meta>{modellText(minuten)}</Meta>
          {aktuell && aktuell.gueltigAb > '2000-01-01' && <Meta>{`gilt seit ${datum(aktuell.gueltigAb)}`}</Meta>}
          {kuenftig && <Meta>{`Ab ${datum(kuenftig.gueltigAb)}: ${stunden(wochenSumme(kuenftig.minuten))} (${modellText(kuenftig.minuten)})`}</Meta>}
        </Stapel>
      </Karte>
      {buchungen.length > 0 && (
        <Stapel abstand={8}>
          <Zeile zwischen>
            <strong>Kontobuchungen</strong>
            {darfAendern && (
              <Button klein variante="tertiaer" onClick={() => setBuchungOffen(true)}>
                Korrigieren
              </Button>
            )}
          </Zeile>
          <Liste leer={<Meta>Kein Übertrag und keine Korrektur.</Meta>}>
            {buchungen.slice(0, 5).map((b) => (
              <ListenZeile key={b.id} titel={`${saldoText(b.minuten)} · ${BUCHUNG_LABEL[b.art]}`} untertitel={`${datum(b.datum)} · ${b.grund}`} />
            ))}
          </Liste>
        </Stapel>
      )}
      <Liste leer={<Leer titel="Noch keine Zeiten" text={`${m.vorname} hat noch nichts gestempelt.`} icon="uhr" />}>
        {letzte.map((z) => (
          <ListenZeile
            key={z.id}
            titel={`${datum(z.datum)} · ${z.start}–${z.ende ?? 'läuft'}`}
            untertitel={`${zeitTitel(z)}${z.ende ? ` · ${stunden(dauer(z))}` : ''}`}
            rechts={!z.ende ? <Status ton="aktiv">Läuft</Status> : z.freigegeben ? <Status ton="erfolg">Freigegeben</Status> : <Status>{darfAendern ? 'Zu prüfen' : 'Offen'}</Status>}
          />
        ))}
      </Liste>
      <Zeile>
        <Button variante="sekundaer" to={`/betrieb/arbeitszeiten/woche?ma=${id}`}>
          Wochenübersicht öffnen
        </Button>
        {darfAendern && buchungen.length === 0 && (
          <Button variante="tertiaer" icon="stift" onClick={() => setBuchungOffen(true)}>
            Stundenkonto korrigieren
          </Button>
        )}
      </Zeile>
      {darfAendern && <ModellDialog key={String(modellOffen)} maId={id} offen={modellOffen} onSchliessen={() => setModellOffen(false)} />}
      {darfAendern && <BuchungDialog key={String(buchungOffen)} maId={id} offen={buchungOffen} onSchliessen={() => setBuchungOffen(false)} />}
    </Stapel>
  );
}
