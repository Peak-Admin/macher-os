/** Liste „Offen einzuplanen“ – als Hub-Widget (kompakt) und als eigene Ansicht. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { aktionAusfuehren, pfadZu } from '@core/modul';
import { heute, isoDatum, plusTage, uhrzeit, zahl } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Filter, Karte, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, TypIcon, Emoji, useToast } from '@ui/index';
import { AUFTRAGSART_TON, TERMINART_EMOJI } from '@core/zeichen';
import { ART_ICON, ART_LABEL } from '@modules/auftraege/logik';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import { freieSlots } from '../verfuegbarkeit/daten';
import { offenEinzuplanen, vorschlagVerfuegbar, type OffenerEintrag } from './daten';

export function useOffen() {
  useDatenstand();
  return offenEinzuplanen(db.auftraege.all(), db.termine.all());
}

/** Fallback ohne Paket „Automatische Planung“: nächste freie Zeit für die geplanten Stunden */
function einfacherVorschlag(e: OffenerEintrag): TerminVorgabe | undefined {
  const stunden = Math.min(e.auftrag.geplanteStunden ?? (e.grund === 'besichtigung' ? 1 : 2), 8);
  const slot = freieSlots({ von: heute(), bis: plusTage(heute(), 28), dauerMinuten: Math.round(stunden * 60), rasterMinuten: 30, max: 1, ab: new Date(Date.now() + 60 * 60_000) })[0];
  if (!slot) return undefined;
  return {
    auftragId: e.auftrag.id,
    datum: isoDatum(new Date(slot.start)),
    von: uhrzeit(slot.start),
    bis: uhrzeit(slot.ende),
    mitarbeiterIds: slot.mitarbeiterIds.slice(0, 1),
  };
}

export function OffenEintraege({ eintraege, max }: { eintraege: OffenerEintrag[]; max?: number }) {
  const navigate = useNavigate();
  const toast = useToast();
  const darfPlanen = useDarf('planen');
  const [vorgabe, setVorgabe] = useState<TerminVorgabe>();
  const mitVorschlag = vorschlagVerfuegbar();

  const vorschlag = (e: OffenerEintrag) => {
    if (mitVorschlag) {
      const pfad = aktionAusfuehren('plan.vorschlag', { auftragId: e.auftrag.id });
      if (pfad) navigate(pfad);
      return;
    }
    const v = einfacherVorschlag(e);
    if (!v) return toast('In den nächsten 4 Wochen ist niemand lange genug frei. Plane in der Plantafel.', { ton: 'achtung' });
    setVorgabe(v);
  };

  return (
    <>
      <Liste>
        {eintraege.slice(0, max).map((e) => {
          const a = e.auftrag;
          const kunde = db.kunden.get(a.kundeId);
          const ort = db.orte.get(a.ortId);
          return (
            <ListenZeile
              key={a.id}
              links={<TypIcon name={ART_ICON[a.art] ?? 'auftraege'} label={ART_LABEL[a.art] ?? 'Auftrag'} ton={AUFTRAGSART_TON[a.art]} />}
              titel={
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Link to={pfadZu({ typ: 'auftraege', id: a.id }) ?? '#'}>{a.titel}</Link>
                  {a.dringend && <Status ton="gefahr">Dringend</Status>}
                  <Status ton="neutral">
                    <Emoji zeichen={TERMINART_EMOJI[e.grund]} />
                    {e.grund === 'besichtigung' ? 'Besichtigung' : 'Einsatz'}
                  </Status>
                </span>
              }
              untertitel={[
                kunde?.name,
                ort?.adresse.ort,
                a.wunschtermin ? `Wunsch: ${a.wunschtermin}` : undefined,
                a.geplanteStunden ? `${zahl(a.geplanteStunden)} h` : undefined,
                e.alterTage === 0 ? 'seit heute' : e.alterTage === 1 ? 'seit gestern' : `seit ${e.alterTage} Tagen`,
              ]
                .filter(Boolean)
                .join(' · ')}
              rechts={
                darfPlanen ? (
                  <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button klein onClick={() => navigate((aktionAusfuehren('plan.einplanen', { auftragId: a.id }) as string) ?? '/plan/einsatzplanung')}>
                      Einplanen
                    </Button>
                    <Button klein variante="sekundaer" onClick={() => vorschlag(e)}>
                      Vorschlag
                    </Button>
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </Liste>
      <TerminFormular offen={!!vorgabe} onSchliessen={() => setVorgabe(undefined)} vorgabe={vorgabe} titel="Vorschlag prüfen und einplanen" />
    </>
  );
}

/** Hub-Widget auf der Plan-Seite */
export function OffenWidget() {
  const eintraege = useOffen();
  const dringend = eintraege.filter((e) => e.auftrag.dringend).length;
  return (
    <Karte
      titel={eintraege.length ? `Offen einzuplanen (${eintraege.length})` : 'Offen einzuplanen'}
      icon="kalender"
      aktion={eintraege.length > 5 ? <Button variante="tertiaer" to="/plan/offen">Alle anzeigen</Button> : undefined}
    >
      {eintraege.length ? (
        <Stapel abstand={12}>
          {dringend > 0 && (
            <Meldung ton="achtung" titel={dringend === 1 ? '1 dringender Auftrag hat noch keinen Termin.' : `${dringend} dringende Aufträge haben noch keinen Termin.`} />
          )}
          <OffenEintraege eintraege={eintraege} max={5} />
        </Stapel>
      ) : (
        <Leer titel="Alles eingeplant" text="Jeder beauftragte Auftrag und jede gewünschte Besichtigung hat einen Termin." icon="check" />
      )}
    </Karte>
  );
}

/** Eigene Ansicht mit Filter */
export function OffenSeite() {
  const eintraege = useOffen();
  const [filter, setFilter] = useState<'alle' | 'einsatz' | 'besichtigung' | 'dringend'>('alle');
  const gefiltert = eintraege.filter((e) => filter === 'alle' || (filter === 'dringend' ? e.auftrag.dringend : e.grund === filter));
  return (
    <Seite titel="Offen einzuplanen" untertitel="Aufträge und Besichtigungen ohne Termin – das Dringendste zuerst.">
      <Filter
        label="Filter"
        wert={filter}
        onChange={setFilter}
        optionen={[
          { wert: 'alle', label: 'Alle', zaehler: eintraege.length },
          { wert: 'dringend', label: 'Dringend', zaehler: eintraege.filter((e) => e.auftrag.dringend).length },
          { wert: 'einsatz', label: 'Einsätze', zaehler: eintraege.filter((e) => e.grund === 'einsatz').length },
          { wert: 'besichtigung', label: 'Besichtigungen', zaehler: eintraege.filter((e) => e.grund === 'besichtigung').length },
        ]}
      />
      {gefiltert.length ? (
        <OffenEintraege eintraege={gefiltert} />
      ) : (
        <Leer
          titel={eintraege.length ? 'Nichts in diesem Filter' : 'Alles eingeplant'}
          text={eintraege.length ? 'Wähle einen anderen Filter.' : 'Sobald ein Auftrag beauftragt ist oder ein Kunde eine Besichtigung wünscht, taucht er hier auf.'}
          icon="check"
          aktion={eintraege.length ? <Button variante="sekundaer" onClick={() => setFilter('alle')}>Alle zeigen</Button> : <Button variante="sekundaer" to="/plan/kalender">Zum Kalender</Button>}
        />
      )}
    </Seite>
  );
}
