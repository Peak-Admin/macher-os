/**
 * Tab „Erfassen“ der Monteur-App: Foto, Zeit, Notiz zum Auftrag, an dem du gerade arbeitest.
 * Jeder Knopf öffnet das vorhandene Schnell-Erfassen mit genau dieser Aktion – keine Auswahl-Kaskade.
 * Höchstens drei Blöcke: Auftrag · Erfassen · Heute von dir erfasst. Große Flächen (Handschuhe), Kamera zuerst.
 */
import { db, useDatenstand } from '@core/db';
import { heute, relativ } from '@core/format';
import { useIch } from '@core/session';
import { ERFASSEN_TITEL, erfassen, erfassenAktion } from '@ui/objekt';
import { Button, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel } from '@ui/index';
import { aktuellerAuftrag, naechsterEinsatz } from './logik';
import { abschlussPfad, SyncStand } from './Feld';

export function ErfassenSeite() {
  useDatenstand();
  const ich = useIch();
  const auftragId = aktuellerAuftrag(ich?.id);
  const auftrag = db.auftraege.get(auftragId);
  const tag = heute();
  const meineDokumente = db.dokumente.where((d) => d.erstelltVon === ich?.id && d.erstelltAm.slice(0, 10) === tag);
  const meineZeiten = db.zeiten.where((z) => z.mitarbeiterId === ich?.id && z.datum === tag);
  const zuletzt = [
    ...meineDokumente.map((d) => ({ id: d.id, titel: d.titel || 'Foto', zeit: d.erstelltAm, art: d.art === 'foto' ? 'Foto' : 'Notiz', auftrag: db.auftraege.get(d.auftragId)?.nummer })),
    ...meineZeiten.map((z) => ({ id: z.id, titel: `${z.start}–${z.ende ?? 'läuft'} Uhr`, zeit: z.erstelltAm, art: 'Zeit', auftrag: db.auftraege.get(z.auftragId)?.nummer })),
  ]
    .sort((a, b) => b.zeit.localeCompare(a.zeit))
    .slice(0, 3);
  // vier Kacheln reichen: Material, Notiz, Mangel, Urlaub/krank – je nachdem, was angeboten wird
  const weitere = [...erfassenAktion('material', auftragId), ...erfassenAktion('notiz', auftragId), ...erfassenAktion('mangel', auftragId), ...erfassenAktion('abwesenheit')].slice(0, 4);
  const laufend = naechsterEinsatz(ich?.id);
  const einsatz = laufend?.status === 'vor_ort' ? laufend : undefined;

  return (
    <Seite titel="Erfassen" untertitel="Halte fest, was auf der Baustelle passiert – das Büro sieht es sofort.">
      <Stapel abstand={24}>
        <Karte kompakt>
          {auftrag ? (
            <Meta>
              Zum Auftrag <strong>{auftrag.nummer}</strong> · {auftrag.titel}
            </Meta>
          ) : (
            <Meta>Gerade läuft kein Einsatz. Den Auftrag wählst du im nächsten Schritt.</Meta>
          )}
        </Karte>

        <Stapel abstand={12}>
          <Button icon="kamera" breit className="ne-gross" onClick={() => erfassen('foto', auftragId)}>
            {ERFASSEN_TITEL.foto}
          </Button>
          <div className="ne-kacheln" role="group" aria-label="Weiteres erfassen">
            <Button variante="sekundaer" icon="mikro" className="ne-kachel" onClick={() => erfassen('sprachnotiz', auftragId)}>
              {ERFASSEN_TITEL.sprachnotiz}
            </Button>
            <Button variante="sekundaer" icon="uhr" className="ne-kachel" onClick={() => erfassen('zeit', auftragId)}>
              {ERFASSEN_TITEL.zeit}
            </Button>
            {weitere.map((w) => (
              <Button key={w.label} variante="sekundaer" icon={w.icon} className="ne-kachel" onClick={w.onClick}>
                {w.label}
              </Button>
            ))}
          </div>
          {einsatz && (
            <Button variante="sekundaer" icon="mikro" breit className="ne-gross" to={abschlussPfad(einsatz.id)}>
              Einsatz abschließen
            </Button>
          )}
          <SyncStand />
        </Stapel>

        <section className="mm-heute-block" aria-label="Heute von dir erfasst">
          <h2 className="mm-heute-blocktitel">Heute von dir erfasst</h2>
          <Liste leer={<Leer skizze titel="Heute noch nichts erfasst" text="Ein Foto vom Zählerschrank oder deine Arbeitszeit – ein Tipp reicht." icon="kamera" />}>
            {zuletzt.map((x) => (
              <ListenZeile key={x.id} titel={x.titel} untertitel={[x.art, x.auftrag, relativ(x.zeit)].filter(Boolean).join(' · ')} />
            ))}
          </Liste>
        </section>
      </Stapel>
    </Seite>
  );
}
