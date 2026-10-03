/** Tab „Rechnungen“ in der Auftragsakte und beim Kunden */
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Leer, Liste, ListenZeile, Meldung, Stapel, Zeile, useToast } from '@ui/index';
import { abschlussRechnung, ART_LABEL, nummerText, offenFuerKunde, passendeArt, rechnungErstellen, rechnungsSummen } from './logik';
import { alleRechnungen, type RechnungX } from './typen';
import { RechnungStatus } from './teile';

function RechnungsZeilen({ liste }: { liste: RechnungX[] }) {
  return (
    <Liste>
      {[...liste]
        .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
        .map((r) => (
          <ListenZeile
            key={r.id}
            to={`/betrieb/rechnungen/${r.id}`}
            titel={`${nummerText(r)} · ${r.stornoFuerId ? 'Storno' : ART_LABEL[r.art]}`}
            untertitel={`${r.titel}${r.status === 'entwurf' ? '' : ` · ${datum(r.datum)}`} · ${euro(rechnungsSummen(r).zahlbetrag)}`}
            rechts={<RechnungStatus r={r} />}
          />
        ))}
    </Liste>
  );
}

export function AuftragRechnungenTab({ id }: { id: ID }) {
  useDatenstand();
  const navigate = useNavigate();
  const toast = useToast();
  const darf = useDarf('geld');
  const a = db.auftraege.get(id);
  if (!darf) return <Leer titel="Nur für Chef und Büro" text="Rechnungen sehen nur Chef und Büro." icon="schloss" />;
  const liste = alleRechnungen().filter((r) => r.auftragId === id);
  const art = passendeArt(id);
  const erstellen = () => {
    const r = rechnungErstellen(id, art);
    if (!r) return;
    toast(`${ART_LABEL[art]} als Entwurf angelegt.`);
    navigate(`/betrieb/rechnungen/${r.id}`);
  };
  return (
    <Stapel>
      {a?.phase === 'abrechnung' && !abschlussRechnung(id) && <Meldung ton="achtung" titel="Der Auftrag wartet auf die Rechnung">Lotte übernimmt Angebot, Material, Zeiten und bezahlte Abschläge in den Entwurf.</Meldung>}
      <Zeile>
        <Button icon="plus" onClick={erstellen}>
          {art === 'schluss' ? 'Schlussrechnung erstellen' : 'Rechnung erstellen'}
        </Button>
        <Button variante="tertiaer" to={`/betrieb/rechnungen/neu?auftrag=${id}`}>
          Weitere Optionen
        </Button>
      </Zeile>
      {liste.length ? <RechnungsZeilen liste={liste} /> : <Leer skizze titel="Noch keine Rechnung" text="Erstelle die Rechnung mit einem Klick – Positionen kommen aus Angebot, Material und Zeiten." icon="euro" />}
    </Stapel>
  );
}

export function KundeRechnungenTab({ id }: { id: ID }) {
  useDatenstand();
  const darf = useDarf('geld');
  if (!darf) return <Leer titel="Nur für Chef und Büro" icon="schloss" />;
  const liste = alleRechnungen().filter((r) => r.kundeId === id);
  const o = offenFuerKunde(id);
  return (
    <Stapel>
      {o.ueberfaellig.length > 0 && (
        <Meldung ton="gefahr" titel={`Überfällig: ${euro(o.ueberfaelligSumme)}`}>
          {o.ueberfaellig.map((r) => r.nummer).join(', ')}
        </Meldung>
      )}
      {liste.length ? (
        <RechnungsZeilen liste={liste} />
      ) : (
        <Leer skizze titel="Noch keine Rechnungen" text="Rechnungen entstehen aus den Aufträgen dieses Kunden." aktion={<Button variante="sekundaer" to={`/betrieb/rechnungen/neu?kunde=${id}`}>Freie Rechnung schreiben</Button>} icon="euro" />
      )}
    </Stapel>
  );
}
