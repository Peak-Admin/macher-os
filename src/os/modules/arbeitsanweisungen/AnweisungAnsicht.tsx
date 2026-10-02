import { db } from '@core/db';
import { personName, relativ } from '@core/format';
import { useIch } from '@core/session';
import { Button, Meldung, Meta, Stapel, useToast } from '@ui/index';
import { alsGelesen, type Arbeitsanweisung } from './daten';

/** Lesefassung: groß, klar, Schritt für Schritt – für den Monteur vor Ort */
export function AnweisungAnsicht({ x, kurz }: { x: Arbeitsanweisung; kurz?: boolean }) {
  const ich = useIch();
  const toast = useToast();
  const schritte = x.schritte.filter((s) => s.text.trim());
  const gezeigt = kurz ? schritte.slice(0, 3) : schritte;
  const habGelesen = !!ich && !!x.gelesen?.some((g) => g.mitarbeiterId === ich.id);
  return (
    <Stapel abstand={16}>
      {x.ziel && (
        <div>
          <p className="mm-oberzeile">Ziel</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{x.ziel}</p>
        </div>
      )}
      {x.sicherheit.length > 0 && (
        <Meldung ton="achtung" titel="Sicherheit">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {x.sicherheit.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Meldung>
      )}
      {gezeigt.length ? (
        <ol style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gezeigt.map((s) => {
            const foto = db.dokumente.get(s.fotoId);
            return (
              <li key={s.id}>
                <span style={{ whiteSpace: 'pre-wrap' }}>{s.text}</span>
                {foto?.url && <img src={foto.url} alt={`Foto zu: ${s.text}`} style={{ display: 'block', marginTop: 8, maxWidth: '100%', maxHeight: 240, borderRadius: 'var(--mm-radius-card)' }} />}
              </li>
            );
          })}
        </ol>
      ) : (
        <Meta>Noch keine Schritte beschrieben.</Meta>
      )}
      {kurz && schritte.length > gezeigt.length && <Meta>… und {schritte.length - gezeigt.length} weitere Schritte.</Meta>}
      {!x.vorlage && ich && (
        <div>
          {habGelesen ? (
            <Meta>Du hast das gelesen.</Meta>
          ) : (
            <Button
              variante="sekundaer"
              klein
              icon="check"
              onClick={() => {
                alsGelesen(x.id, ich.id);
                toast('Als gelesen vermerkt.');
              }}
            >
              Gelesen und verstanden
            </Button>
          )}
        </div>
      )}
      {!kurz && !!x.gelesen?.length && (
        <Meta>Gelesen von: {x.gelesen.map((g) => `${personName(db.mitarbeiter.get(g.mitarbeiterId))} (${relativ(g.am)})`).join(', ')}</Meta>
      )}
    </Stapel>
  );
}
