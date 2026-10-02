import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { datum, euro, heute } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Leer, Liste, ListenZeile, Meta, Stapel, Status, Zeile } from '@ui/index';
import { EINSATZ_STATUS, freistellungFehlt, kostenSumme, subunternehmer, type SubEinsatz, type Subunternehmer } from './daten';
import { EinsatzDialog } from './Dialoge';
import { subName } from './name';

export function einsaetzeAmAuftrag(auftragId: ID): { sub: Subunternehmer; einsatz: SubEinsatz }[] {
  return subunternehmer.all().flatMap((sub) => sub.einsaetze.filter((e) => e.auftragId === auftragId).map((einsatz) => ({ sub, einsatz })));
}

/** Tab „Subunternehmer“ in der Auftragsakte */
export function AuftragSubunternehmer({ id }: { id: ID }) {
  useDatenstand();
  const geld = useDarf('geld');
  const [dialog, setDialog] = useState<{ sub?: Subunternehmer; einsatz?: SubEinsatz } | null>(null);
  const liste = einsaetzeAmAuftrag(id).sort((a, b) => a.einsatz.von.localeCompare(b.einsatz.von));
  const t = heute();
  return (
    <Stapel>
      <Zeile zwischen>
        {geld && liste.length > 0 ? <Meta>Kosten Subunternehmer: {euro(kostenSumme(liste.map((x) => x.einsatz)))} netto</Meta> : <span />}
        <Button variante="sekundaer" icon="plus" onClick={() => setDialog({})}>
          Subunternehmer einsetzen
        </Button>
      </Zeile>
      <Liste leer={<Leer titel="Kein Subunternehmer an diesem Auftrag" text="Brauchst du Gerüst, Trockenbau oder Erdarbeiten? Setz eine Fremdfirma ein – Macher prüft ihre Nachweise." icon="team" />}>
        {liste.map(({ sub, einsatz }) => (
          <ListenZeile
            key={einsatz.id}
            onClick={() => setDialog({ sub, einsatz })}
            titel={
              <>
                {einsatz.leistung} · <Link to={`/betrieb/subunternehmer/${sub.id}`} onClick={(e) => e.stopPropagation()}>{subName(sub)}</Link>
              </>
            }
            untertitel={`${datum(einsatz.von)}${einsatz.bis ? ` – ${datum(einsatz.bis)}` : ''}${geld && einsatz.kosten != null ? ` · ${euro(einsatz.kosten)}` : ''}`}
            rechts={
              <Zeile abstand={8}>
                {einsatz.status !== 'erledigt' && freistellungFehlt(sub, t) && <Status ton="achtung">Freistellung fehlt</Status>}
                <Status ton={einsatz.status === 'erledigt' ? 'erfolg' : einsatz.status === 'laeuft' ? 'aktiv' : 'neutral'}>{EINSATZ_STATUS.find((x) => x.wert === einsatz.status)?.label}</Status>
              </Zeile>
            }
          />
        ))}
      </Liste>
      {dialog && <EinsatzDialog offen onSchliessen={() => setDialog(null)} auftragId={id} subId={dialog.sub?.id} einsatz={dialog.einsatz} />}
    </Stapel>
  );
}
