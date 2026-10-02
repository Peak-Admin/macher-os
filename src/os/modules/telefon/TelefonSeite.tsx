import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { heute, personName, relativ, telLink, uhrzeit } from '@core/format';
import type { Aufgabe } from '@core/objects';
import { Abschnitt, BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Seite, Stapel, Status, ZweiSpalten, useToast } from '@ui/index';
import { AnrufFormular } from './AnrufFormular';
import { istKiAnruf } from './assistent';
import { KiAnrufZeile } from './KiAnruf';
import { istUeberfaellig, rueckrufNummer } from './daten';

export function offeneRueckrufe(): Aufgabe[] {
  return db.aufgaben
    .where((a) => a.quelle === 'rueckruf' && !a.erledigt)
    .sort((a, b) => Number(b.prioritaet === 'hoch') - Number(a.prioritaet === 'hoch') || (a.faellig ?? '').localeCompare(b.faellig ?? ''));
}

function RueckrufZeile({ a }: { a: Aufgabe }) {
  const toast = useToast();
  const nummer = rueckrufNummer(a);
  const wer = db.mitarbeiter.get(a.zustaendigId);
  const ueber = istUeberfaellig(a);
  return (
    <ListenZeile
      titel={a.titel}
      untertitel={[a.notiz?.split('\n')[0], nummer, wer ? personName(wer) : null, a.faellig ? `bis ${relativ(a.faellig)}` : null].filter(Boolean).join(' · ')}
      rechts={
        <>
          {ueber ? <Status ton="achtung">Überfällig</Status> : a.prioritaet === 'hoch' ? <Status ton="achtung">Dringend</Status> : null}
          {nummer && (
            <Button klein variante="sekundaer" icon="telefon" onClick={() => (window.location.href = telLink(nummer)!)}>
              Anrufen
            </Button>
          )}
          <Button
            klein
            variante="tertiaer"
            icon="check"
            onClick={() => {
              db.aufgaben.update(a.id, { erledigt: true, erledigtAm: new Date().toISOString() });
              toast('Rückruf erledigt.', { aktion: { label: 'Rückgängig', onClick: () => db.aufgaben.update(a.id, { erledigt: false, erledigtAm: undefined }) } });
            }}
          >
            Erledigt
          </Button>
        </>
      }
    />
  );
}

export function TelefonSeite() {
  useDatenstand();
  const rueckrufe = offeneRueckrufe();
  const anrufe = db.nachrichten
    .where((n) => n.kanal === 'telefon')
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
    .slice(0, 20);
  const heuteAnz = anrufe.filter((n) => n.erstelltAm.slice(0, 10) === heute()).length;

  return (
    <Seite titel="Telefon & Empfang" untertitel="Anruf notieren, nächsten Schritt festlegen, auflegen.">
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte titel="Anruf notieren">
              <AnrufFormular />
            </Karte>
            <Abschnitt
              titel={`Letzte Anrufe${heuteAnz ? ` · heute ${heuteAnz}` : ''}`}
              aktion={
                <Button klein variante="tertiaer" icon="einstellungen" to="/auftraege/telefon/assistent">
                  Telefonassistent
                </Button>
              }
            >
              <Liste leer={<Leer titel="Noch keine Anrufe notiert" text="Notiere den ersten Anruf oben – er landet automatisch beim Kunden und am Auftrag." icon="telefon" />}>
                {anrufe.map((n) => {
                  if (istKiAnruf(n)) return <KiAnrufZeile key={n.id} n={n} />;
                  const k = db.kunden.get(n.kundeId);
                  const a = db.auftraege.get(n.auftragId);
                  const ziel = a ? pfadZu({ typ: 'auftraege', id: a.id }) : k ? pfadZu({ typ: 'kunden', id: k.id }) : undefined;
                  return (
                    <ListenZeile
                      key={n.id}
                      to={ziel}
                      titel={
                        <>
                          {n.betreff ?? 'Anruf'} <BeispielMarke zeigen={n.beispiel} />
                        </>
                      }
                      untertitel={[n.text.split('\n')[0], a ? `${a.nummer} · ${a.titel}` : null, `${relativ(n.erstelltAm)}, ${uhrzeit(n.erstelltAm)}`].filter(Boolean).join(' · ')}
                    />
                  );
                })}
              </Liste>
            </Abschnitt>
          </Stapel>
        }
        seite={
          <Abschnitt titel={`Offene Rückrufe${rueckrufe.length ? ` (${rueckrufe.length})` : ''}`}>
            <div className="tel-rueckrufe">
              <Liste leer={<Leer titel="Keine offenen Rückrufe" text="Rückrufe entstehen, wenn du bei einem Anruf „Rückruf“ wählst." icon="check" />}>
                {rueckrufe.map((a) => (
                  <RueckrufZeile key={a.id} a={a} />
                ))}
              </Liste>
            </div>
          </Abschnitt>
        }
      />
    </Seite>
  );
}
