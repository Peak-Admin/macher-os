import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, datumKurz, heute, personName, plusTage } from '@core/format';
import type { Datum, ID, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { istBuero, useDarf, useIch } from '@core/session';
import { Auswahl, Button, IconButton, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, Tabelle, Zeile, useBestaetigen, useToast } from '@ui/index';
import { abwesenheitAm, ART_LABEL as ABW_LABEL } from '@modules/abwesenheiten/daten';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { csvExport, dauer, herunterladen, jetztUhr, kalenderwoche, pruefeMitarbeiterTag, saldoText, sollTag, stunden, wochenStart } from './daten';
import { zeitTitel } from './Stempeluhr';
import { ZeitDialog } from './ZeitDialog';
import { ZeitenNav } from './ZeitenNav';

const TEAM = 'team';

interface WochenWerte {
  ist: number;
  soll: number;
  offen: Zeiteintrag[];
  probleme: { tag: Datum; text: string }[];
  laeuft: boolean;
}

export function wochenWerte(m: Mitarbeiter, montag: Datum): WochenWerte {
  const t = heute();
  const jetzt = { datum: t, uhr: jetztUhr() };
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
  const zeiten = db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum >= montag && z.datum <= tage[6]);
  const alleZeiten = db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum >= plusTage(montag, -1) && z.datum <= tage[6]);
  const abw = db.abwesenheiten.all();
  // Soll zählt erst ab der ersten erfassten Zeit (wie im Stundenkonto)
  const erste = db.zeiten.where((z) => z.mitarbeiterId === m.id).map((z) => z.datum).sort()[0];
  const probleme = tage.flatMap((d) => pruefeMitarbeiterTag(m.id, d, alleZeiten).probleme.map((text) => ({ tag: d, text })));
  return {
    ist: zeiten.reduce((s, z) => s + dauer(z, jetzt), 0),
    soll: tage.filter((d) => d <= t && !!erste && d >= erste).reduce((s, d) => s + sollTag(m, d, abw), 0),
    offen: zeiten.filter((z) => z.ende && !z.freigegeben),
    probleme,
    laeuft: zeiten.some((z) => !z.ende),
  };
}

export function ZeitenWoche() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const personal = useDarf('personal');
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const [params, setParams] = useSearchParams();
  const tag = params.get('datum') ?? heute();
  const montag = wochenStart(tag);
  // Export-Monat: der gewählte Tag (in der aktuellen Woche: heute), damit Monatswechsel in der Woche passen
  const exportMonat = (tag < montag || tag > plusTage(montag, 6) ? montag : tag).slice(0, 7);
  const sonntag = plusTage(montag, 6);
  const maParam = params.get('ma') ?? (buero ? TEAM : ich?.id ?? '');
  const maId = buero ? maParam : ich?.id ?? '';
  const [dialog, setDialog] = useState<{ eintrag?: Zeiteintrag; datum?: Datum; mitarbeiterId?: ID } | null>(null);

  // Hinweis-Link „nachtragen“ öffnet direkt das Formular
  useEffect(() => {
    const n = params.get('nachtrag');
    if (n) {
      setDialog({ datum: n, mitarbeiterId: maId !== TEAM ? maId : ich?.id });
      const p = new URLSearchParams(params);
      p.delete('nachtrag');
      p.set('datum', n);
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setze = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    p.set(k, v);
    setParams(p, { replace: true });
  };

  const team = sortiert(db.mitarbeiter.where((m) => istAktiv(m) || db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum >= montag && z.datum <= sonntag).length > 0));
  const freigeben = async (eintraege: Zeiteintrag[], probleme: number) => {
    if (!eintraege.length) return;
    if (probleme && !(await fragen('Trotz Hinweisen freigeben?', `In dieser Woche gibt es ${probleme === 1 ? 'einen Hinweis' : `${probleme} Hinweise`} zum Arbeitszeitgesetz. Prüfe die Tage, bevor du freigibst.`, 'Trotzdem freigeben')))
      return;
    eintraege.forEach((z) => db.zeiten.update(z.id, { freigegeben: true }, { text: 'Freigegeben' }));
    toast(eintraege.length === 1 ? '1 Zeit freigegeben.' : `${eintraege.length} Zeiten freigegeben.`, {
      aktion: { label: 'Rückgängig', onClick: () => eintraege.forEach((z) => db.zeiten.update(z.id, { freigegeben: false })) },
    });
  };
  const exportieren = () => {
    const monat = exportMonat;
    const zeiten = db.zeiten.where((z) => z.datum.startsWith(monat) && (maId === TEAM || z.mitarbeiterId === maId));
    if (!zeiten.length) return toast('Für diesen Monat gibt es noch keine Zeiten.', { ton: 'achtung' });
    const csv = csvExport(zeiten, (id) => db.mitarbeiter.get(id), (id) => db.auftraege.get(id)?.nummer ?? '');
    herunterladen(`arbeitszeiten-${monat}.csv`, csv);
    const offen = zeiten.filter((z) => z.ende && !z.freigegeben).length;
    toast(offen ? `CSV erstellt. Achtung: ${offen} Zeiten sind noch nicht freigegeben.` : 'CSV für die Lohnabrechnung erstellt.', { ton: offen ? 'achtung' : 'erfolg' });
  };

  return (
    <Seite
      titel="Arbeitszeiten"
      untertitel={`KW ${kalenderwoche(montag)} · ${datum(montag)} bis ${datum(sonntag)}`}
      aktion={<Button icon="plus" onClick={() => setDialog({ datum: heute() > sonntag ? sonntag : heute() < montag ? montag : heute(), mitarbeiterId: maId !== TEAM ? maId : ich?.id })}>Zeit nachtragen</Button>}
    >
      <ZeitenNav aktiv="woche" />
      <Zeile zwischen>
        <Zeile abstand={4} umbruch={false}>
          <IconButton icon="zurueck" label="Woche davor" onClick={() => setze('datum', plusTage(montag, -7))} />
          <Button klein variante="tertiaer" onClick={() => setze('datum', heute())}>
            Diese Woche
          </Button>
          <IconButton icon="weiter" label="Woche danach" onClick={() => setze('datum', plusTage(montag, 7))} />
        </Zeile>
        {(buero || personal) && (
          <Button klein variante="sekundaer" icon="download" onClick={exportieren}>
            {`${new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date(exportMonat + '-15T12:00:00'))} als CSV`}
          </Button>
        )}
      </Zeile>
      {buero && (
        <div style={{ maxWidth: 360 }}>
          <Auswahl label="Wessen Zeiten" value={maId} onChange={(e) => setze('ma', e.target.value)} optionen={[{ wert: TEAM, label: 'Ganzes Team' }, ...team.map((m) => ({ wert: m.id, label: personName(m) }))]} />
        </div>
      )}

      {maId === TEAM ? (
        <TeamWoche montag={montag} team={team} onFreigeben={freigeben} onPerson={(id) => setze('ma', id)} />
      ) : (
        <PersonWoche montag={montag} maId={maId} buero={buero} onFreigeben={freigeben} onBearbeiten={(z) => setDialog({ eintrag: z })} onNachtrag={(d) => setDialog({ datum: d, mitarbeiterId: maId })} />
      )}

      <ZeitDialog offen={!!dialog} onSchliessen={() => setDialog(null)} eintrag={dialog?.eintrag} vorgabe={dialog ?? undefined} />
      {bestaetigenElement}
    </Seite>
  );
}

function TeamWoche({ montag, team, onFreigeben, onPerson }: { montag: Datum; team: Mitarbeiter[]; onFreigeben: (z: Zeiteintrag[], probleme: number) => void; onPerson: (id: ID) => void }) {
  const zeilen = team.map((m) => ({ m, w: wochenWerte(m, montag) }));
  const offen = zeilen.flatMap((z) => z.w.offen);
  const probleme = zeilen.reduce((s, z) => s + z.w.probleme.length, 0);
  if (!team.length) return <Leer titel="Noch niemand im Team" text="Lege zuerst Mitarbeiter an." icon="team" />;
  return (
    <Stapel abstand={16}>
      {offen.length > 0 ? (
        <Meldung
          titel={`${offen.length === 1 ? '1 Zeit wartet' : `${offen.length} Zeiten warten`} auf Freigabe`}
          aktion={
            <Button klein onClick={() => onFreigeben(offen, probleme)}>
              Woche freigeben
            </Button>
          }
        >
          Prüf kurz die Hinweise. Freigegebene Zeiten gehen in die Lohnabrechnung.
        </Meldung>
      ) : (
        <Meldung ton="erfolg">Alles freigegeben, was in dieser Woche erfasst ist.</Meldung>
      )}
      <Tabelle
        zeilen={zeilen}
        schluessel={(z) => z.m.id}
        onZeile={(z) => onPerson(z.m.id)}
        spalten={[
          { titel: 'Mitarbeiter', wert: (z) => personName(z.m), sortierWert: (z) => z.m.vorname },
          { titel: 'Ist', wert: (z) => stunden(z.w.ist), zahl: true, sortierWert: (z) => z.w.ist },
          { titel: 'Soll bis heute', wert: (z) => stunden(z.w.soll), zahl: true, nebensaechlich: true },
          { titel: 'Differenz', wert: (z) => saldoText(z.w.ist - z.w.soll), zahl: true, sortierWert: (z) => z.w.ist - z.w.soll },
          {
            titel: 'Status',
            wert: (z) =>
              z.w.probleme.length ? (
                <Status ton="achtung">{z.w.probleme.length === 1 ? '1 Hinweis' : `${z.w.probleme.length} Hinweise`}</Status>
              ) : z.w.laeuft ? (
                <Status ton="aktiv">Läuft</Status>
              ) : z.w.offen.length ? (
                <Status>{`${z.w.offen.length} offen`}</Status>
              ) : z.w.ist ? (
                <Status ton="erfolg">Freigegeben</Status>
              ) : (
                <Status>Keine Zeiten</Status>
              ),
          },
        ]}
      />
    </Stapel>
  );
}

function PersonWoche({
  montag,
  maId,
  buero,
  onFreigeben,
  onBearbeiten,
  onNachtrag,
}: {
  montag: Datum;
  maId: ID;
  buero: boolean;
  onFreigeben: (z: Zeiteintrag[], probleme: number) => void;
  onBearbeiten: (z: Zeiteintrag) => void;
  onNachtrag: (d: Datum) => void;
}) {
  const m = db.mitarbeiter.get(maId);
  if (!m) return <Leer titel="Mitarbeiter nicht gefunden" icon="person" />;
  const t = heute();
  const jetzt = { datum: t, uhr: jetztUhr() };
  const w = wochenWerte(m, montag);
  const abw = db.abwesenheiten.all();
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
  const zeiten = db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum >= montag && z.datum <= tage[6]);
  return (
    <Stapel abstand={16}>
      <Raster min={160}>
        <Kennzahl label="Ist" wert={stunden(w.ist)} zeitraum={`KW ${kalenderwoche(montag)}`} />
        <Kennzahl label="Soll bis heute" wert={stunden(w.soll)} hinweis={`${String(m.wochenstunden).replace('.', ',')} h pro Woche`} />
        <Kennzahl label="Differenz" wert={saldoText(w.ist - w.soll)} ton={w.ist - w.soll < 0 ? 'achtung' : 'erfolg'} />
      </Raster>
      {buero && w.offen.length > 0 && (
        <div>
          <Button variante="sekundaer" icon="check" onClick={() => onFreigeben(w.offen, w.probleme.length)}>
            {`${w.offen.length === 1 ? '1 Zeit' : `${w.offen.length} Zeiten`} von ${m.vorname} freigeben`}
          </Button>
        </div>
      )}
      {tage.map((d) => {
        const tag = zeiten.filter((z) => z.datum === d).sort((a, b) => a.start.localeCompare(b.start));
        const summe = tag.reduce((s, z) => s + dauer(z, jetzt), 0);
        const erste = db.zeiten.where((z) => z.mitarbeiterId === m.id).map((z) => z.datum).sort()[0];
        const soll = erste && d >= erste ? sollTag(m, d, abw) : 0;
        const a = abwesenheitAm(m.id, d, abw);
        const probleme = w.probleme.filter((p) => p.tag === d);
        if (!tag.length && !soll && !a) return null;
        return (
          <Stapel key={d} abstand={8}>
            <Zeile zwischen>
              <strong>
                {datumKurz(d)} · {stunden(summe)}
              </strong>
              <Zeile abstand={4}>
                {a && <Status ton="aktiv">{ABW_LABEL[a.art]}</Status>}
                {probleme.map((p) => (
                  <Status key={p.text} ton="achtung">
                    {p.text}
                  </Status>
                ))}
              </Zeile>
            </Zeile>
            <Liste
              leer={
                d <= t && soll > 0 && !a ? (
                  <Meta>
                    Keine Zeit erfasst.{' '}
                    <Button klein variante="tertiaer" onClick={() => onNachtrag(d)}>
                      Nachtragen
                    </Button>
                  </Meta>
                ) : (
                  <Meta>{d > t ? 'Noch nicht erfasst.' : 'Kein Arbeitstag.'}</Meta>
                )
              }
            >
              {tag.map((z) => (
                <ListenZeile
                  key={z.id}
                  onClick={() => onBearbeiten(z)}
                  titel={`${z.start}–${z.ende ?? 'läuft'} · ${zeitTitel(z)}`}
                  untertitel={[`${stunden(dauer(z, jetzt))}`, z.pauseMinuten ? `${z.pauseMinuten} min Pause` : undefined, z.notiz].filter(Boolean).join(' · ')}
                  rechts={!z.ende ? <Status ton="aktiv">Läuft</Status> : z.freigegeben ? <Status ton="erfolg">Freigegeben</Status> : <Status>Offen</Status>}
                />
              ))}
            </Liste>
          </Stapel>
        );
      })}
    </Stapel>
  );
}
