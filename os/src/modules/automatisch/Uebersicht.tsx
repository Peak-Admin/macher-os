import { db, useDatenstand } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { relativ, uhrzeit } from '@core/format';
import { automationAn, setzeAutomation } from '@core/macher';
import { alleAutomationen, modul } from '@core/modul';
import { useDarf } from '@core/session';
import { Abschnitt, Button, Karte, Kennzahl, Leer, Meldung, Meta, Raster, Schalter, Seite, Stapel, useToast } from '@ui/index';
import { pruefeAlle, statistik, zeitText } from './daten';

const TAGE = 30;

export function Uebersicht() {
  useDatenstand();
  const toast = useToast();
  const admin = useDarf('admin');
  const regeln = alleAutomationen();
  const seit = new Date(Date.now() - TAGE * 86_400_000).toISOString();
  const erledigungen = db.erledigungen.all();
  const an = regeln.filter((r) => automationAn(r.id));
  const gesamt = erledigungen.filter((e) => e.erstelltAm >= seit);
  const minuten = gesamt.reduce((s, e) => s + (e.minutenGespart ?? 0), 0);
  const zuletzt = einstellung<string | undefined>('macher.pruefung.zuletzt', undefined);

  // nach Modul gruppieren, Module nach Pain-Gewicht
  const gruppen = [...new Set(regeln.map((r) => r.modulId))]
    .map((id) => ({ m: modul(id), regeln: regeln.filter((r) => r.modulId === id) }))
    .sort((a, b) => (b.m?.gewicht ?? 50) - (a.m?.gewicht ?? 50));

  const umschalten = (id: string, titel: string, wert: boolean) => {
    setzeAutomation(id, wert);
    toast(wert ? `„${titel}“ ist eingeschaltet.` : `„${titel}“ ist ausgeschaltet. Das erledigst du jetzt selbst.`);
  };

  return (
    <Seite
      titel="Automatisch erledigen"
      untertitel="Diese Regeln erledigt Macher für dich. Du entscheidest, was läuft."
      aktion={
        <Button
          variante="sekundaer"
          icon="wiederholen"
          onClick={() => {
            const n = pruefeAlle();
            toast(n === 1 ? '1 Regel geprüft.' : `${n} Regeln geprüft. Neue Punkte findest du unter „Braucht dich“.`);
          }}
        >
          Jetzt prüfen
        </Button>
      }
    >
      <Raster min={200}>
        <Kennzahl label="Eingeschaltet" wert={`${an.length} von ${regeln.length}`} hinweis="Regeln" />
        <Kennzahl label="Ausgeführt" wert={gesamt.length} zeitraum={`letzte ${TAGE} Tage`} />
        <Kennzahl label="Gesparte Zeit" wert={zeitText(minuten)} zeitraum={`letzte ${TAGE} Tage`} hinweis="Schätzung" />
      </Raster>
      <Meta>{zuletzt ? `Zuletzt alles geprüft ${relativ(zuletzt)} um ${uhrzeit(zuletzt)} Uhr.` : 'Macher prüft beim Start und alle 30 Minuten, solange die App offen ist.'}</Meta>
      {!admin && <Meldung>Du kannst die Regeln ansehen. Zum Ein- und Ausschalten brauchst du die Freigabe „Einstellungen“.</Meldung>}

      {!regeln.length && <Leer icon="wiederholen" titel="Noch keine Regeln" text="Sobald Module Regeln mitbringen, erscheinen sie hier und laufen automatisch." />}

      {gruppen.map(({ m, regeln: rs }) => (
        <Abschnitt key={m?.id ?? 'x'} titel={m?.id === 'automatisch' ? 'Übergreifend' : m?.titel ?? 'Weitere'}>
          <Stapel abstand={12}>
            {rs.map((r) => {
              const s = statistik(erledigungen, r.id, seit);
              const istAn = automationAn(r.id);
              return (
                <Karte key={r.id} kompakt>
                  <Stapel abstand={8}>
                    <Schalter label={r.titel} beschreibung={r.beschreibung} checked={istAn} disabled={!admin} onChange={(v) => umschalten(r.id, r.titel, v)} />
                    <Meta>
                      {s.zuletzt
                        ? [`Zuletzt ${relativ(s.zuletzt)}`, `${s.anzahl}× in ${TAGE} Tagen`, s.minuten ? `${zeitText(s.minuten)} gespart (Schätzung)` : undefined].filter(Boolean).join(' · ')
                        : istAn
                          ? 'Bisher nicht ausgeführt – es gab noch keinen Anlass.'
                          : 'Ausgeschaltet.'}
                      {r.minuten ? ` · je Ausführung ${zeitText(r.minuten)} (Schätzung)` : ''}
                    </Meta>
                  </Stapel>
                </Karte>
              );
            })}
          </Stapel>
        </Abschnitt>
      ))}
    </Seite>
  );
}
