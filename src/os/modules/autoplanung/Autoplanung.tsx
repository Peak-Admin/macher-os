/** Alle offenen Aufträge auf einmal vorplanen → Vorschau → übernehmen. */
import { useMemo, useState } from 'react';
import { useDatenstand } from '@core/db';
import { erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { Button, Checkbox, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, useToast, Zeile } from '@ui/index';
import { kontextAusDb } from './basis';
import { allesVorplanen, vorschlagKurz, vorschlagUebernehmen } from './daten';

export function Autoplanung() {
  const v = useDatenstand();
  const toast = useToast();
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const plan = useMemo(() => allesVorplanen(ctx), [ctx]);
  const [abgewaehlt, setAbgewaehlt] = useState<Set<string>>(new Set());
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);

  const mitVorschlag = plan.filter((p) => p.vorschlag);
  const gewaehlt = mitVorschlag.filter((p) => !abgewaehlt.has(p.auftrag.id));

  const uebernehmen = () => {
    setLaeuft(true);
    const probleme: string[] = [];
    let n = 0;
    let termine = 0;
    for (const p of gewaehlt) {
      const r = vorschlagUebernehmen(p.vorschlag!);
      if (r.ok) {
        n++;
        termine += r.termine.length;
        erledigt('autoplanung.uebernommen', `Eingeplant: ${p.auftrag.titel}`, {
          text: vorschlagKurz(ctx, p.vorschlag!),
          bezug: { typ: 'auftraege', id: p.auftrag.id },
          minuten: 10,
        });
      } else probleme.push(`${p.auftrag.titel}: ${r.grund}`);
    }
    setFehler(probleme);
    setLaeuft(false);
    setAbgewaehlt(new Set());
    if (n) toast(`${n === 1 ? '1 Auftrag' : `${n} Aufträge`} eingeplant (${termine === 1 ? '1 Termin' : `${termine} Termine`}).`);
    else if (probleme.length) toast('Nichts übernommen. Schau dir die Hinweise an.', { ton: 'achtung' });
  };

  return (
    <Seite
      titel="Automatische Planung"
      untertitel="Macher plant alle offenen Aufträge vor. Du prüfst und übernimmst."
      aktion={
        mitVorschlag.length ? (
          <Button icon="check" onClick={uebernehmen} laedt={laeuft} laedtText="Wird eingeplant …" disabled={!gewaehlt.length}>
            {gewaehlt.length === 1 ? '1 Vorschlag übernehmen' : `${gewaehlt.length} Vorschläge übernehmen`}
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={16}>
        {fehler.length > 0 && (
          <Meldung ton="achtung" titel="Nicht alles hat geklappt">
            {fehler.map((f) => (
              <div key={f}>{f}</div>
            ))}
          </Meldung>
        )}
        {plan.length > 0 && (
          <Meta>
            Wichtigstes zuerst: dringende Aufträge, dann laufende Baustellen, dann nach Eingang. Jeder Vorschlag blockt seine Zeit für die folgenden.
          </Meta>
        )}
        <Liste
          leer={
            <Leer
              icon="check"
              titel="Alles eingeplant"
              text="Für beauftragte Aufträge sind alle geschätzten Stunden in Terminen. Neue Aufträge erscheinen hier automatisch."
            />
          }
        >
          {plan.map((p) => {
            const vs = p.vorschlag;
            const an = !!vs && !abgewaehlt.has(p.auftrag.id);
            return (
              <ListenZeile
                key={p.auftrag.id}
                links={
                  vs ? (
                    <Checkbox
                      label="Übernehmen"
                      checked={an}
                      onChange={(x) =>
                        setAbgewaehlt((s) => {
                          const n = new Set(s);
                          if (x) n.delete(p.auftrag.id);
                          else n.add(p.auftrag.id);
                          return n;
                        })
                      }
                    />
                  ) : undefined
                }
                titel={
                  <>
                    {p.auftrag.titel} {p.auftrag.dringend && <Status ton="achtung">Dringend</Status>}
                  </>
                }
                untertitel={
                  <Stapel abstand={4}>
                    <span>{vs ? vorschlagKurz(ctx, vs) : p.hinweise[p.hinweise.length - 1] ?? 'Kein Vorschlag möglich.'}</span>
                    {vs && <span>{vs.gruende.slice(1).join(' · ')}</span>}
                    {vs?.warnungen.length ? <span>Achtung: {vs.warnungen.join(' · ')}</span> : null}
                    <Zeile abstand={8}>
                      <Button variante="tertiaer" klein to={`/plan/autoplanung/${p.auftrag.id}`}>
                        Alternativen ansehen
                      </Button>
                      {pfadZu({ typ: 'auftraege', id: p.auftrag.id }) && (
                        <Button variante="tertiaer" klein to={pfadZu({ typ: 'auftraege', id: p.auftrag.id })}>
                          Auftrag öffnen
                        </Button>
                      )}
                    </Zeile>
                  </Stapel>
                }
                rechts={vs ? <Status ton={vs.score >= 70 ? 'erfolg' : 'aktiv'}>{vs.score} / 100</Status> : <Status ton="achtung">Kein Vorschlag</Status>}
              />
            );
          })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
