import { db, useDatenstand } from '@core/db';
import type { Auftrag, ID } from '@core/objects';
import { Button, Leer, Liste, ListenZeile } from '@ui/index';
import { useDarf } from '@core/session';
import { passendeArtikel, wissen, type Vorschlag } from './daten';

/** Passende Anleitungen zu einem Auftrag (über Anlagen und Leistungen) */
export function vorschlaegeFuerAuftrag(id: ID): Vorschlag[] {
  const a = db.auftraege.get(id);
  return a ? vorschlaegeFuer(a) : [];
}

/** Vorschläge für einen bestimmten Stand eines Auftrags (auch einen früheren) */
export function vorschlaegeFuer(a: Auftrag): Vorschlag[] {
  const anlagentypen = (a.anlageIds ?? []).map((x) => db.anlagen.get(x)?.typ).filter((t): t is string => !!t);
  const leistungIds = [...(a.leistungIds ?? []), ...db.angebote.where((an) => an.auftragId === a.id).flatMap((an) => an.positionen.map((p) => p.leistungId))].filter((x): x is string => !!x);
  return passendeArtikel(wissen.all(), { anlagentypen, leistungIds: [...new Set(leistungIds)], gewerk: db.betrieb.get('betrieb')?.gewerk }, (lid) => db.leistungen.get(lid)?.name);
}

export function vorschlaegeFuerAnlage(id: ID): Vorschlag[] {
  const an = db.anlagen.get(id);
  if (!an) return [];
  return passendeArtikel(wissen.all(), { anlagentypen: [an.typ], gewerk: db.betrieb.get('betrieb')?.gewerk });
}

function VorschlagListe({ liste }: { liste: Vorschlag[] }) {
  const schreiben = useDarf('schreiben');
  return (
    <Liste
      leer={
        <Leer
          titel="Keine passende Anleitung"
          text="Verknüpfe Anleitungen mit Anlagentyp oder Leistung, dann erscheinen sie hier."
          icon="wissen"
          aktion={schreiben ? <Button variante="sekundaer" to="/betrieb/wissen/neu">Anleitung schreiben</Button> : undefined}
        />
      }
    >
      {liste.map((v) => (
        <ListenZeile key={v.artikel.id} to={`/betrieb/wissen/${v.artikel.id}`} titel={v.artikel.titel} untertitel={`${v.artikel.kategorie} · passt zu ${v.gruende.join(', ')}`} />
      ))}
    </Liste>
  );
}

export function AuftragAnleitungen({ id }: { id: ID }) {
  useDatenstand();
  return <VorschlagListe liste={vorschlaegeFuerAuftrag(id)} />;
}

export function AnlageAnleitungen({ id }: { id: ID }) {
  useDatenstand();
  return <VorschlagListe liste={vorschlaegeFuerAnlage(id)} />;
}
