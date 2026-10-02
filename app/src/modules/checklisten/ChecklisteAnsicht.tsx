import { db } from '@core/db';
import { useIch } from '@core/session';
import { personName, relativ } from '@core/format';
import { Checkbox, Fortschritt, Liste, ListenZeile, Meta, Stapel, Status, Zeile } from '@ui/index';
import { punktOffen, punktSetzen, stand, type Checkliste, type PunktStand } from './daten';
import { FotoKnopf } from '@modules/fotos/FotoKnopf';

/** Punkte einer Checkliste abhaken – groß genug für Handschuhe, Foto direkt am Punkt */
export function ChecklisteAnsicht({ c }: { c: Checkliste }) {
  const s = stand(c);
  return (
    <Stapel abstand={12}>
      <Fortschritt wert={s.erledigt} max={s.gesamt} label={`${s.erledigt} von ${s.gesamt} erledigt`} />
      {s.offenePflicht > 0 && (
        <Meta>
          {s.offenePflicht === 1 ? '1 Pflichtpunkt ist' : `${s.offenePflicht} Pflichtpunkte sind`} noch offen. Das hält dich nicht auf – Macher erinnert vor der Abnahme.
        </Meta>
      )}
      <Liste>
        {c.punkte.map((p) => (
          <PunktZeile key={p.id} c={c} p={p} />
        ))}
      </Liste>
    </Stapel>
  );
}

function PunktZeile({ c, p }: { c: Checkliste; p: PunktStand }) {
  const ich = useIch();
  const foto = db.dokumente.get(p.fotoId);
  const wer = db.mitarbeiter.get(p.erledigtVon);
  const fotoFehlt = p.fotoPflicht && !p.fotoId;
  return (
    <ListenZeile
      links={<Checkbox label={<span className="sr-only">{p.text}</span>} checked={p.erledigt} onChange={(v) => punktSetzen(c.id, p.id, { erledigt: v }, ich?.id)} />}
      titel={<span style={{ textDecoration: p.erledigt && !punktOffen(p) ? 'line-through' : undefined }}>{p.text}</span>}
      untertitel={p.erledigt && p.erledigtAm ? `${relativ(p.erledigtAm)}${wer ? ` · ${personName(wer)}` : ''}` : undefined}
      rechts={
        <Zeile abstand={8}>
          {p.pflicht && !p.erledigt && <Status ton="neutral" icon={false}>Pflicht</Status>}
          {p.erledigt && fotoFehlt && <Status ton="achtung">Foto fehlt</Status>}
          {foto?.url && <img src={foto.url} alt={`Foto: ${p.text}`} width={44} height={44} style={{ objectFit: 'cover', borderRadius: 'var(--mm-radius-control)' }} />}
          {(p.fotoPflicht || !p.erledigt) && (
            <FotoKnopf
              titel={p.text}
              auftragId={c.auftragId}
              tags={['checkliste']}
              label={foto ? 'Neues Foto' : 'Foto'}
              variante={p.fotoPflicht && !foto ? 'sekundaer' : 'tertiaer'}
              onGespeichert={(fotoId) => punktSetzen(c.id, p.id, { fotoId, erledigt: true }, ich?.id)}
            />
          )}
        </Zeile>
      }
    />
  );
}
