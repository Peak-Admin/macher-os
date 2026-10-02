/** Ablage für Eingangsrechnungen: PDF hier ablegen oder fotografieren – plus Belege-Postfach (E-Mail-Eingang) */
import { useState, type DragEvent } from 'react';
import { Button, DateiKnopf, Meldung, Meta, Status, useToast } from '@ui/index';
import type { BelegX } from '../rechnungen/typen';
import { BELEG_DATEITYPEN, belegAusDatei, emailEingang } from './logik';
import './belege.css';

/** Adresse des Belege-Postfachs zum Kopieren, mit ehrlichem Stand (aktiv oder noch nicht) */
export function EmailEingang() {
  const toast = useToast();
  const e = emailEingang();
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(e.adresse);
      toast('Adresse kopiert.');
    } catch {
      toast('Kopieren ging nicht. Markiere die Adresse und kopiere sie von Hand.', { ton: 'achtung' });
    }
  };
  return (
    <div className="bl-email">
      <div className="bl-email-zeile">
        <span>Rechnungen per E-Mail:</span>
        <code className="bl-email-adresse">{e.adresse}</code>
        <Button klein variante="tertiaer" onClick={kopieren}>
          Adresse kopieren
        </Button>
      </div>
      <div className="bl-email-zeile">
        <Status ton={e.aktiv ? 'erfolg' : 'neutral'}>{e.aktiv ? 'Aktiv' : 'Noch nicht aktiv'}</Status>
        <Meta>{e.text.replace(/^(Aktiv|Noch nicht aktiv): /, '')}</Meta>
      </div>
    </div>
  );
}

export function Ablage({ gross, onFertig }: { gross?: boolean; onFertig?: (belege: BelegX[]) => void }) {
  const toast = useToast();
  const [ziel, setZiel] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);

  const ablegen = async (dateien: File[], quelle: 'foto' | 'upload') => {
    if (!dateien.length || laedt) return;
    setLaedt(true);
    setFehler([]);
    const neu: BelegX[] = [];
    const probleme: string[] = [];
    for (const f of dateien) {
      try {
        neu.push(await belegAusDatei(f, { quelle }));
      } catch (e) {
        probleme.push(e instanceof Error ? e.message : `${f.name} konnte nicht gespeichert werden.`);
      }
    }
    setLaedt(false);
    setFehler(probleme);
    if (neu.length) {
      toast(neu.length === 1 ? 'Beleg angelegt. Er steht unter „Zu prüfen“.' : `${neu.length} Belege angelegt. Sie stehen unter „Zu prüfen“.`);
      onFertig?.(neu);
    }
  };

  const drueber = (e: DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!ziel) setZiel(true);
  };

  return (
    <section
      className={['bl-ablage', gross && 'bl-ablage--gross', ziel && 'bl-ablage--ziel'].filter(Boolean).join(' ')}
      aria-label="Beleg ablegen"
      onDragEnter={drueber}
      onDragOver={drueber}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setZiel(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setZiel(false);
        void ablegen(Array.from(e.dataTransfer.files), 'upload');
      }}
    >
      {gross ? <h2 className="bl-ablage-titel">PDF hier ablegen oder fotografieren</h2> : <p className="bl-ablage-titel">PDF hier ablegen oder fotografieren</p>}
      {gross && <p className="bl-ablage-text">Lieferantenrechnungen und Quittungen landen als „Neu“ in deiner Liste. Dann prüfen, dem Auftrag zuordnen, freigeben, bezahlen.</p>}
      <div className="bl-ablage-knoepfe">
        <DateiKnopf accept={BELEG_DATEITYPEN} mehrfach onDateien={(l) => ablegen(l, 'upload')} laedt={laedt} laedtText="Wird gespeichert …">
          Datei wählen
        </DateiKnopf>
        <DateiKnopf accept="image/*" kamera onDateien={(l) => ablegen(l, 'foto')} disabled={laedt}>
          Beleg fotografieren
        </DateiKnopf>
      </div>
      <Meta>PDF bis 2 MB, Fotos werden verkleinert.</Meta>
      {fehler.length > 0 && (
        <Meldung ton="achtung" titel={fehler.length === 1 ? 'Eine Datei wurde nicht übernommen' : `${fehler.length} Dateien wurden nicht übernommen`}>
          {fehler.join(' ')}
        </Meldung>
      )}
      <EmailEingang />
    </section>
  );
}
