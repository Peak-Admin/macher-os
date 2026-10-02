import { OsLaden } from "./OsLaden";

/** Alle Adressen unter /os/… zeigen diese Seite (Rewrite in `next.config.ts`); den Rest regelt der Router der App. */
export default function OsSeite() {
  return <OsLaden />;
}
