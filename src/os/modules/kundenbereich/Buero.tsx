/** Büro-Sicht: Link zum Kundenbereich erzeugen, kopieren, sperren – und Übersicht aller Zugänge. */
import { db } from '@core/db';
import { datum, relativ } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, FensterSkizze, Karte, Leer, Meta, Seite, Stapel, Status, Tabelle, Zeile, useBestaetigen, useToast } from '@ui/index';
import { aktiverZugang, portalLink, portalzugaenge, zugangErzeugen, zugangPruefen, zugangVerlaengern, zugangWiderrufen, type Portalzugang } from './daten';

async function kopieren(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Panel am Kunden */
export function KundenbereichPanel({ id }: { id: ID }) {
  portalzugaenge.use();
  const toast = useToast();
  const darf = useDarf('veroeffentlichen');
  const [fragen, dialog] = useBestaetigen();
  const z = aktiverZugang(id);

  const linkKopieren = async (zugang: Portalzugang) => {
    const ok = await kopieren(portalLink(zugang.token));
    toast(ok ? 'Link ist kopiert. Füg ihn in deine E-Mail oder WhatsApp ein.' : 'Kopieren hat nicht geklappt. Markiere den Link und kopiere ihn von Hand.', { ton: ok ? 'erfolg' : 'achtung' });
  };

  if (!z)
    return (
      <Karte titel="Kundenbereich" kompakt>
        <div className="mm-einstieg" style={{ gap: 8 }}>
          <span className="mm-fenster" aria-hidden>
            <FensterSkizze icon="link" rahmen="handy" />
          </span>
          <Meta>Der Kunde sieht dort Termine, Angebote, Rechnungen und freigegebene Unterlagen – und kann Angebote direkt annehmen.</Meta>
          {darf ? (
            <div>
              <Button
                klein
                variante="sekundaer"
                icon="link"
                onClick={async () => {
                  const neu = zugangErzeugen(id);
                  await linkKopieren(neu);
                }}
              >
                Link erzeugen und kopieren
              </Button>
            </div>
          ) : (
            <Meta>Einen Link kann das Büro oder der Chef erzeugen.</Meta>
          )}
        </div>
      </Karte>
    );

  const link = portalLink(z.token);
  return (
    <Karte titel="Kundenbereich" kompakt aktion={<Status ton="erfolg">Aktiv</Status>}>
      <Stapel abstand={8}>
        <input className="mm-input" readOnly value={link} aria-label="Link zum Kundenbereich" onFocus={(e) => e.target.select()} />
        <Meta>
          Gültig bis {datum(z.gueltigBis)}
          {z.letzterZugriffAm ? ` · zuletzt geöffnet ${relativ(z.letzterZugriffAm)}` : ' · noch nicht geöffnet'}
        </Meta>
        <Zeile abstand={4}>
          <Button klein variante="sekundaer" icon="link" onClick={() => linkKopieren(z)}>
            Link kopieren
          </Button>
          <Button klein variante="tertiaer" onClick={() => window.open(link, '_blank', 'noopener')}>
            Ansehen
          </Button>
          {darf && (
            <Button
              klein
              variante="tertiaer"
              icon="schloss"
              onClick={async () => {
                if (!(await fragen('Link sperren?', 'Der Kunde kommt mit diesem Link nicht mehr in seinen Kundenbereich. Du kannst jederzeit einen neuen erzeugen.', 'Sperren'))) return;
                zugangWiderrufen(z.id);
                toast('Link ist gesperrt.');
              }}
            >
              Sperren
            </Button>
          )}
        </Zeile>
      </Stapel>
      {dialog}
    </Karte>
  );
}

/** Übersicht aller Links */
export function Zugaenge() {
  const zugaenge = portalzugaenge.use();
  const kunden = db.kunden.use();
  const toast = useToast();
  const darf = useDarf('veroeffentlichen');
  const zeilen = [...zugaenge].sort((a, b) => (b.letzterZugriffAm ?? b.erstelltAm).localeCompare(a.letzterZugriffAm ?? a.erstelltAm));
  const statusVon = (z: Portalzugang) => {
    const p = zugangPruefen(z);
    if (p.ok) return <Status ton="erfolg">Aktiv</Status>;
    return p.grund === 'widerrufen' ? <Status ton="neutral">Gesperrt</Status> : <Status ton="achtung">Abgelaufen</Status>;
  };
  return (
    <Seite titel="Kundenbereich" untertitel="Deine Kunden sehen Termine, Angebote, Rechnungen und Unterlagen – und nehmen Angebote direkt an. Den Link erzeugst du am Kunden.">
      <Tabelle
        zeilen={zeilen}
        schluessel={(z) => z.id}
        zeilenLink={(z) => `/auftraege/kunden/${z.kundeId}`}
        leer={<Leer skizze titel="Noch kein Kunde hat einen Link" text="Öffne einen Kunden und klick bei „Kundenbereich“ auf „Link erzeugen“. Beim Versand eines Angebots legt Macher den Link automatisch an." icon="link" aktion={<Button variante="sekundaer" to="/auftraege/kunden">Zu den Kunden</Button>} />}
        spalten={[
          { titel: 'Kunde', wert: (z) => kunden.find((k) => k.id === z.kundeId)?.name ?? '–', sortierWert: (z) => kunden.find((k) => k.id === z.kundeId)?.name ?? '' },
          { titel: 'Status', wert: statusVon },
          { titel: 'Gültig bis', wert: (z) => datum(z.gueltigBis), sortierWert: (z) => z.gueltigBis, nebensaechlich: true },
          { titel: 'Zuletzt geöffnet', wert: (z) => (z.letzterZugriffAm ? relativ(z.letzterZugriffAm) : 'noch nie'), sortierWert: (z) => z.letzterZugriffAm ?? '', nebensaechlich: true },
          {
            titel: 'Aktion',
            wert: (z) =>
              darf && !z.widerrufenAm && !zugangPruefen(z).ok ? (
                <Button
                  klein
                  variante="tertiaer"
                  onClick={(e) => {
                    e.stopPropagation();
                    zugangVerlaengern(z.id);
                    toast('Link gilt wieder 90 Tage.');
                  }}
                >
                  Verlängern
                </Button>
              ) : null,
          },
        ]}
      />
    </Seite>
  );
}
