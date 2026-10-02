/** Übersicht aller Fotos und Notizen – vor allem, um Unzugeordnetes schnell wiederzufinden. */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { Filter, Leer, Meldung, Meta, Seite, Stapel } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { FOTO_TAGS, fotosGefiltert, groesseText, istDoku, istFoto, istNotizOderSprache } from './daten';
import { ErfassenLeiste, Galerie, NotizListe } from './Galerie';
import { speicherBelegt } from './speicher';

export function FotosSeite() {
  const [params, setParams] = useSearchParams();
  const ohne = params.get('ohne') === '1';
  const [auftrag, setAuftrag] = useState<string>('');
  const [tag, setTag] = useState('');
  const alle = db.dokumente.use(istDoku);
  const gefiltert = alle.filter((d) => (ohne ? !d.auftragId : !auftrag || d.auftragId === auftrag));
  const fotos = fotosGefiltert(gefiltert, tag);
  const notizen = gefiltert.filter(istNotizOderSprache).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const ohneAuftrag = alle.filter((d) => !d.auftragId).length;

  return (
    <Seite titel="Fotos & Dokumentation" untertitel="Fotos, Sprachnotizen und Notizen – direkt am Auftrag.">
      <Stapel abstand={16}>
        <ErfassenLeiste />
        {ohneAuftrag > 0 && !ohne && (
          <Meldung ton="achtung" titel={ohneAuftrag === 1 ? '1 Eintrag ohne Auftrag' : `${ohneAuftrag} Einträge ohne Auftrag`}>
            <a href="?ohne=1" onClick={(e) => (e.preventDefault(), setParams({ ohne: '1' }))}>
              Jetzt zuordnen
            </a>
          </Meldung>
        )}
        {ohne ? (
          <Meldung ton="neutral" titel="Nur Einträge ohne Auftrag">
            Öffne einen Eintrag und wähle den Auftrag.{' '}
            <a href="?" onClick={(e) => (e.preventDefault(), setParams({}))}>
              Alle zeigen
            </a>
          </Meldung>
        ) : (
          <AuftragAuswahl label="Auftrag" optional nurOffene={false} wert={auftrag} onChange={setAuftrag} />
        )}
        <Filter
          label="Fotos filtern"
          wert={tag}
          onChange={setTag}
          optionen={[{ wert: '', label: 'Alle Fotos', zaehler: gefiltert.filter(istFoto).length }, ...FOTO_TAGS.map((t) => ({ wert: t, label: t, zaehler: gefiltert.filter((f) => istFoto(f) && f.tags?.includes(t)).length }))]}
        />
        {fotos.length ? (
          <Galerie fotos={fotos} mitAuftrag />
        ) : (
          <Leer skizze
            titel={alle.length ? 'Keine passenden Fotos' : 'Noch keine Fotos'}
            text={alle.length ? 'Ändere den Filter oder wähle einen anderen Auftrag.' : 'Fotografiere direkt aus der App – die Bilder werden automatisch verkleinert und landen am Auftrag.'}
            icon="kamera"
          />
        )}
        {notizen.length > 0 && (
          <Stapel abstand={8}>
            <h2>Notizen und Sprachnotizen</h2>
            <NotizListe eintraege={notizen} mitAuftrag />
          </Stapel>
        )}
        <Meta>Belegter Speicher in diesem Browser: etwa {groesseText(speicherBelegt())}. Fotos werden auf höchstens 1600 Pixel verkleinert.</Meta>
      </Stapel>
    </Seite>
  );
}
