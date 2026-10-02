/**
 * Vorschlag aus „Beschreib kurz, was gemacht wird“ – sichtbar als Vorschlag, erst nach „Übernehmen“ im Angebot.
 * Gesendet wird hier nie etwas.
 */
import { euro, positionSumme, zahl } from '@core/format';
import type { Position } from '@core/objects';
import { Button, Meta, Stapel, Status } from '@ui/index';

export type VorschlagQuelle = 'ki' | 'demo' | 'katalog';

const HERKUNFT: Record<VorschlagQuelle, string> = {
  ki: 'Macher hat deinen Satz mit KI gelesen. Preise aus deinem Katalog oder deinem Satz.',
  demo: 'Aus deinem Satz und deinem Katalog erkannt (KI-Demo).',
  katalog: 'Aus deinem Satz und deinem Katalog erkannt.',
};

function preisHerkunft(p: Position): string {
  if (p.leistungId) return 'Preis aus deinem Katalog';
  if (p.artikelId) return 'Materialpreis aus dem Katalog';
  return 'aus deinem Satz';
}

export function PositionenVorschlag({ positionen, quelle, onUebernehmen, onVerwerfen }: { positionen: Position[]; quelle: VorschlagQuelle; onUebernehmen: () => void; onVerwerfen: () => void }) {
  const summe = positionen.reduce((s, p) => s + positionSumme(p), 0);
  const ohnePreis = positionen.filter((p) => !p.einzelpreis).length;
  return (
    <div className="mm-karte mm-karte--kompakt" style={{ padding: 12 }} aria-label="Vorschlag von Macher">
      <Stapel abstand={12}>
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Status ton="neutral" icon={false}>
            Vorschlag
          </Status>
          <Meta>{HERKUNFT[quelle]}</Meta>
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {positionen.map((p) => (
            <li key={p.id}>
              <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{p.text}</span>
                {p.einzelpreis ? <strong className="mm-number">{euro(positionSumme(p))}</strong> : <Status ton="achtung">Preis fehlt</Status>}
              </div>
              <Meta>
                {zahl(p.menge)} {p.einheit}
                {p.einzelpreis ? ` × ${euro(p.einzelpreis)} · ${preisHerkunft(p)}` : ''}
              </Meta>
            </li>
          ))}
        </ol>
        <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span>Zusammen netto</span>
          <strong className="mm-number">{euro(summe)}</strong>
        </div>
        <Meta>
          {ohnePreis ? `${ohnePreis === 1 ? 'Eine Position hat' : `${ohnePreis} Positionen haben`} noch keinen Preis – den trägst du nach dem Übernehmen ein. ` : ''}
          Prüf den Vorschlag. Erst wenn du übernimmst, steht er im Angebot – gesendet wird nichts.
        </Meta>
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button variante="sekundaer" icon="check" onClick={onUebernehmen}>
            Übernehmen
          </Button>
          <Button variante="tertiaer" onClick={onVerwerfen}>
            Verwerfen
          </Button>
        </div>
      </Stapel>
    </div>
  );
}
