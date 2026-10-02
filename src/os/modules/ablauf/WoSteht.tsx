import type { ReactNode } from 'react';
import { db, useDatenstand } from '@core/db';
import { datumKurz, personName } from '@core/format';
import { istBuero, useDarf, useIch } from '@core/session';
import type { Auftrag } from '@core/objects';
import { Button, Karte, Meta, Stapel, Status, Zeile, useToast } from '@ui/index';
import { standVon, tageSeit, weiter } from './daten';
import { BEDINGUNG_LABEL, weiterMoeglich, weiterVonHand } from './logik';
import './ablauf.css';

/**
 * „Wo steht der Auftrag?“ – ruhige Fortschrittsanzeige mit dem aktuellen Schritt, Zuständigen und Frist.
 * `naechstes` ist der Satz „Was muss als Nächstes passieren?“ (die Hauptaktion steht im Seitenkopf).
 */
export function WoStehtDerAuftrag({ auftrag: a, naechstes }: { auftrag: Auftrag; naechstes?: ReactNode }) {
  useDatenstand();
  const ich = useIch();
  const toast = useToast();
  const darfSchreiben = useDarf('schreiben');
  const st = standVon(a);
  const schritte = st.ablauf.schritte;
  const verloren = a.phase === 'verloren';
  const tage = tageSeit(st.seit);
  const zustaendig = db.mitarbeiter.get(st.zustaendigId);
  const weiterZu = darfSchreiben && istBuero(ich) && !verloren ? weiterVonHand(st.ablauf, st) : undefined;
  const vonSelbst = !verloren ? weiterMoeglich(st.ablauf, st) : undefined;
  const nr = st.index >= 0 && st.index < schritte.length ? st.index + 1 : undefined;

  const details = [
    nr ? `Schritt ${nr} von ${schritte.length}` : undefined,
    !st.fertig && !verloren && tage != null ? (tage === 0 ? 'seit heute' : tage === 1 ? 'seit gestern' : `seit ${tage} Tagen`) : undefined,
    !st.fertig && !verloren && zustaendig ? `zuständig: ${personName(zustaendig)}` : undefined,
  ].filter(Boolean);

  return (
    <Karte kompakt oberzeile="Wo steht der Auftrag?">
      <Stapel abstand={12}>
        {!verloren && (
          <ol className="ablauf-leiste" aria-label={`Ablauf: ${st.ablauf.name}`} style={{ gridTemplateColumns: `repeat(${schritte.length}, minmax(0, 1fr))` }}>
            {schritte.map((s, i) => {
              const zustand = st.fertig || i < st.index ? 'fertig' : i === st.index ? 'jetzt' : 'offen';
              return (
                <li key={s.id} className={`ablauf-schritt ablauf-schritt--${zustand}`} aria-current={zustand === 'jetzt' ? 'step' : undefined}>
                  <span className="ablauf-label">{s.label}</span>
                  <span className="ablauf-sr">{zustand === 'fertig' ? ' (erledigt)' : zustand === 'jetzt' ? ' (jetzt)' : ''}</span>
                </li>
              );
            })}
          </ol>
        )}
        <Zeile zwischen>
          <div className="ablauf-jetzt">
            <strong>{st.schritt.label}</strong>
            {details.length > 0 && <Meta>{details.join(' · ')}</Meta>}
          </div>
          {st.ueberfaellig ? <Status ton="achtung">Frist {datumKurz(st.faellig)} überschritten</Status> : st.faellig ? <Status ton="neutral">Frist {datumKurz(st.faellig)}</Status> : st.fertig ? <Status ton="erfolg">Abgeschlossen</Status> : null}
        </Zeile>
        {naechstes}
        {vonSelbst?.automatisch && <Meta>Weiter zu „{vonSelbst.label}“ geht es von selbst, sobald {BEDINGUNG_LABEL[vonSelbst.automatisch]}.</Meta>}
        {weiterZu && (
          <div>
            <Button
              variante="tertiaer"
              klein
              icon="pfeilRechts"
              onClick={() => {
                const neu = weiter(a.id);
                toast(neu ? `Weiter mit „${neu.schritt.label}“.` : 'Das hat nicht geklappt. Versuch es noch einmal.', neu ? undefined : { ton: 'achtung' });
              }}
            >
              {`Weiter zu „${weiterZu.label}“`}
            </Button>
          </div>
        )}
      </Stapel>
    </Karte>
  );
}
