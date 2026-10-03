/**
 * Objektbild der Handwerk-OS-Bildsprache („das digitale Werkzeug“, docs/design/visual-assets.md).
 * Ein echtes Foto eines Handwerksobjekts als kleiner, ruhiger Hinweis – nie als einzige Information.
 * Funktionale Navigation bleibt bei Linien-Icons; Objekte nur in Kopf-, Karten- und Leerzuständen.
 */
import { objekte, type ObjektSchluessel } from '@/lib/objekte';

export type { ObjektSchluessel };

const GROESSEN = { klein: [56, 42], mittel: [96, 72], gross: [192, 144] } as const;

export function MacherAsset({ asset, groesse = 'mittel', className }: { asset: ObjektSchluessel; groesse?: keyof typeof GROESSEN; className?: string }) {
  const [b, h] = GROESSEN[groesse];
  return (
    <img
      src={objekte[asset].src}
      alt=""
      width={b}
      height={h}
      loading="lazy"
      decoding="async"
      className={`mm-asset mm-asset--${groesse}${className ? ` ${className}` : ''}`}
    />
  );
}
