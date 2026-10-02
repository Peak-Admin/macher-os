import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Karte, Leer, Liste, ListenZeile, Meta, Raster, Seite, Stapel, Status, ZweiSpalten, Zeile, useBestaetigen, useToast } from '@ui/index';
import { gewerkVorlage } from '@core/gewerke';
import { ArtikelText } from './ArtikelText';
import { istSichererLink, wissen } from './daten';
import { ausgehend } from '@/lib/link/ausgehend';

export function WissenArtikel() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const schreiben = useDarf('schreiben');
  const darfLoeschen = useDarf('loeschen');
  const a = wissen.useOne(id);
  const fotos = db.dokumente.use((d) => !!a?.fotoIds?.includes(d.id), [a?.fotoIds?.join()]);
  const zurueck = { to: '/betrieb/wissen', label: 'Wissen' };
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Anleitung nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Anleitung gibt es nicht (mehr)." icon="wissen" />
      </Seite>
    );
  const leistungen = (a.leistungIds ?? []).map((lid) => db.leistungen.get(lid)).filter((l) => l && !l.geloeschtAm);

  const loeschen = async () => {
    if (!(await fragen('Anleitung löschen?', `„${a.titel}“ kommt in den Papierkorb.`, 'In den Papierkorb'))) return;
    wissen.remove(a.id);
    toast('Anleitung liegt im Papierkorb.', { aktion: { label: 'Rückgängig', onClick: () => wissen.restore(a.id) } });
    navigate('/betrieb/wissen');
  };

  return (
    <Seite
      titel={a.titel}
      oberzeile={a.kategorie}
      zurueck={zurueck}
      aktion={schreiben ? <Button variante="sekundaer" icon="stift" to={`/betrieb/wissen/${a.id}/bearbeiten`}>Bearbeiten</Button> : undefined}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte>
              {a.text.trim() ? <ArtikelText text={a.text} /> : <Leer titel="Noch kein Text" text="Schreib die wichtigsten Schritte auf." icon="notiz" />}
            </Karte>
            {fotos.length > 0 && (
              <Karte titel="Fotos">
                <Raster min={160}>
                  {fotos.map((f) => (
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt={f.titel} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 'var(--mm-radius-card)' }} />
                    </a>
                  ))}
                </Raster>
              </Karte>
            )}
            <Meta>Zuletzt geändert am {datum(a.geaendertAm)}</Meta>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Passt zu" kompakt>
              <Stapel abstand={8}>
                {a.gewerk ? <Meta>Gewerk: {gewerkVorlage(a.gewerk).label}</Meta> : <Meta>Alle Gewerke</Meta>}
                {a.anlagentypen?.length ? (
                  <Zeile abstand={4}>
                    {a.anlagentypen.map((t) => (
                      <Status key={t}>{t}</Status>
                    ))}
                  </Zeile>
                ) : null}
                {leistungen.length > 0 && (
                  <Liste>
                    {leistungen.map((l) => (
                      <ListenZeile key={l!.id} to={`/betrieb/katalog/leistungen/${l!.id}`} titel={l!.name} />
                    ))}
                  </Liste>
                )}
                {!a.anlagentypen?.length && !leistungen.length && <Meta>Noch nicht verknüpft. Verknüpfte Anleitungen schlägt Macher am passenden Auftrag vor.</Meta>}
              </Stapel>
            </Karte>
            {a.links?.length ? (
              <Karte titel="Herstellerlinks" kompakt>
                <Stapel abstand={8}>
                  {a.links.filter((l) => istSichererLink(l.url)).map((l) => (
                    <a key={l.url} href={ausgehend(l.url)} target="_blank" rel="noreferrer noopener">
                      {l.titel || l.url}
                    </a>
                  ))}
                </Stapel>
              </Karte>
            ) : null}
            {darfLoeschen && (
              <div>
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Anleitung löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      {dialog}
    </Seite>
  );
}
