import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, zahl } from '@core/format';
import { Abschnitt, BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, useToast } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { bedarfZusammenfassung, berechneBedarf, bestellvorschlag, type BedarfZeile } from './daten';
import { bedarfHinweisAktualisieren } from './pruefung';

export function BedarfAnsicht() {
  useDatenstand();
  const navigate = useNavigate();
  const toast = useToast();
  const zeilen = berechneBedarf();
  const s = bedarfZusammenfassung(zeilen);
  const jeLieferant = new Map<string, BedarfZeile[]>();
  for (const z of zeilen) jeLieferant.set(z.lieferantId ?? '', [...(jeLieferant.get(z.lieferantId ?? '') ?? []), z]);

  const vorschlag = (liste: BedarfZeile[]) => {
    const b = bestellvorschlag(liste);
    bedarfHinweisAktualisieren();
    toast(b.length === 1 ? 'Bestellentwurf angelegt. Prüfen und abschicken.' : `${b.length} Bestellentwürfe angelegt – je Lieferant einer.`);
    navigate(b.length === 1 ? `/betrieb/bestellungen/${b[0].id}` : '/betrieb/bestellungen');
  };

  return (
    <Seite
      titel="Bedarf"
      untertitel="Was für die anstehenden Aufträge fehlt – abzüglich Lager und offener Bestellungen."
      aktion={zeilen.length ? <Button icon="paket" onClick={() => vorschlag(zeilen)}>Bestellvorschlag erstellen</Button> : undefined}
    >
      <Stapel>
        {!zeilen.length ? (
          <Leer
            titel="Alles da"
            text="Für die anstehenden Aufträge fehlt kein Material und kein Lagerartikel ist unter Mindestbestand. Macher prüft das täglich."
            icon="check"
            aktion={<Button variante="sekundaer" to="/betrieb/bestellungen">Zu den Bestellungen</Button>}
          />
        ) : (
          <Meldung ton={s.auftrag ? 'achtung' : 'neutral'} titel={s.auftrag ? `Für ${s.auftrag} ${s.auftrag === 1 ? 'Artikel' : 'Artikel'} reicht es nicht` : `${s.mindest} Lagerartikel nachfüllen`}>
            {s.fruehestens ? `Frühester Bedarf: ${datumKurz(s.fruehestens)} – ` : ''}
            Ein Klick legt je Lieferant einen Bestellentwurf an – du prüfst und schickst ab.
          </Meldung>
        )}
        {[...jeLieferant.entries()].map(([lid, liste]) => {
          const l = db.lieferanten.get(lid);
          return (
            <Karte
              key={lid || 'ohne'}
              titel={l ? l.name : 'Ohne festen Lieferanten'}
              oberzeile={l?.lieferzeitTage != null ? `Lieferzeit ${l.lieferzeitTage} ${l.lieferzeitTage === 1 ? 'Tag' : 'Tage'}` : undefined}
              aktion={
                jeLieferant.size > 1 ? (
                  <Button klein variante="sekundaer" onClick={() => vorschlag(liste)}>
                    Nur hier bestellen
                  </Button>
                ) : undefined
              }
            >
              <Liste>
                {liste.map((z) => (
                  <ListenZeile
                    key={z.schluessel}
                    titel={
                      z.artikelId ? (
                        <>
                          <ObjektLink bezug={{ typ: 'artikel', id: z.artikelId }}>{z.text}</ObjektLink> <BeispielMarke zeigen={db.artikel.get(z.artikelId)?.beispiel} />
                        </>
                      ) : (
                        `${z.text} (Freitext)`
                      )
                    }
                    untertitel={erklaerung(z)}
                    rechts={
                      <Stack>
                        <strong className="mm-number">
                          {zahl(z.fehl)} {z.einheit}
                        </strong>
                        <Status ton={z.grund === 'auftrag' ? 'achtung' : 'neutral'}>{z.grund === 'auftrag' ? (z.fruehestens ? `ab ${datumKurz(z.fruehestens)}` : 'für Auftrag') : 'Mindestbestand'}</Status>
                      </Stack>
                    }
                  />
                ))}
              </Liste>
              {!l && <p className="mm-meta">Tipp: Hinterlege beim Artikel einen Lieferanten, dann bündelt Macher die Bestellung automatisch.</p>}
            </Karte>
          );
        })}
        {zeilen.some((z) => z.auftraege.length) && (
          <Abschnitt titel="Betroffene Aufträge">
            <Liste>
              {[...new Set(zeilen.flatMap((z) => z.auftraege.map((x) => x.auftragId)))].map((aid) => {
                const a = db.auftraege.get(aid);
                if (!a) return null;
                const termin = zeilen.flatMap((z) => z.auftraege).find((x) => x.auftragId === aid)?.termin;
                const n = zeilen.filter((z) => z.auftraege.some((x) => x.auftragId === aid)).length;
                return <ListenZeile key={aid} titel={<ObjektLink bezug={{ typ: 'auftraege', id: aid }}>{`${a.nummer} · ${a.titel}`}</ObjektLink>} untertitel={`${db.kunden.get(a.kundeId)?.name ?? ''}${termin ? ` · nächster Einsatz ${datumKurz(termin)}` : ' · noch kein Termin'}`} rechts={<Status>{n} {n === 1 ? 'Artikel fehlt' : 'Artikel fehlen'}</Status>} />;
              })}
            </Liste>
          </Abschnitt>
        )}
      </Stapel>
    </Seite>
  );
}

function Stack({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>{children}</span>;
}

function erklaerung(z: BedarfZeile): string {
  const teile = [`gebraucht ${zahl(z.benoetigt)}`];
  if (z.mindestbestand) teile.push(`Mindestbestand ${zahl(z.mindestbestand)}`);
  teile.push(`verfügbar ${zahl(z.verfuegbar)}`);
  if (z.offen) teile.push(`bestellt ${zahl(z.offen)}`);
  const auftraege = z.auftraege.map((x) => db.auftraege.get(x.auftragId)?.nummer).filter(Boolean);
  if (auftraege.length) teile.push(auftraege.join(', '));
  return teile.join(' · ');
}
