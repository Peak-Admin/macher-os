import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Objekt } from "@/components/ui/Objekt";
import { Foto } from "@/components/ui/Foto";
import type { BildKey } from "@/content/bilder";
import type { ObjektSchluessel } from "@/lib/objekte";
import { KartenDetails } from "./KartenReihe";

export type KartenTon = "hell" | "beige" | "gruen" | "dunkel" | "dunkelgruen" | "foto";

/** Fläche und Schrift je Ton. Benachbarte Karten einer Reihe bekommen bewusst unterschiedliche Töne und Ansichten. */
const toene: Record<KartenTon, string> = {
  hell: "bg-paper text-ink ring-1 ring-inset ring-line",
  beige: "bg-beige text-ink ring-1 ring-inset ring-beige-line",
  gruen: "bg-signal-soft text-ink",
  dunkel: "bg-ink text-white",
  /** Dunkelgrün mit heller Schrift – hebt sich auch auf dunklen Boxen (Waldgrün) ab */
  dunkelgruen: "bg-signal-dark text-white ring-1 ring-inset ring-white/10",
  foto: "bg-ink text-white",
};

/**
 * Hohe Karte für eine `KartenReihe` (Vorbild Feather). Jede Karte einer Reihe soll anders aussehen –
 * anderer Ton (`ton`) und andere Ansicht: Handy-Ausschnitt, Foto mit Hinweis, Objekt mit Marke, Zitat …
 * (Bausteine in `ReihenAnsichten.tsx`).
 * - `foto`: Foto füllt die Karte, unten abgedunkelt; `ansicht` liegt darüber (z. B. ein `Hinweis`)
 * - sonst: `ansicht` (oder ein `objekt`) füllt den oberen Teil
 * Unten steht der Titel groß, daneben „+“ für `details` im Dialog (ohne `details` ein Pfeil).
 * Die ganze Karte ist ein Link (über den Titel), der „+“-Knopf liegt darüber.
 */
export function ReihenKarte({
  titel,
  href,
  ton = "hell",
  objekt,
  bild,
  ansicht,
  marke,
  details,
  linkText = "Ansehen",
}: {
  titel: string;
  href: string;
  ton?: KartenTon;
  /** Objektfoto oben (wenn keine `ansicht`) */
  objekt?: ObjektSchluessel;
  /** `foto`: Foto aus dem Bildregister */
  bild?: BildKey;
  /** eigene Darstellung im oberen Teil der Karte */
  ansicht?: ReactNode;
  /** kleine Marke oben links, z. B. „Beispiel“ */
  marke?: ReactNode;
  /** Inhalt des Detail-Dialogs hinter „+“ */
  details?: ReactNode;
  /** Text des Links im Dialog */
  linkText?: string;
}) {
  const foto = ton === "foto";
  const dunkel = foto || ton === "dunkel" || ton === "dunkelgruen";
  return (
    <li className="w-[82%] shrink-0 snap-start min-[480px]:w-[20rem] lg:w-[22rem] xl:w-[23.5rem]">
      <article
        className={`group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-2xl transition-shadow duration-150 ease-out hover:shadow-lg hover:shadow-ink/10 ${toene[ton]}`}
      >
        {foto && bild && (
          <>
            <Foto
              bild={bild}
              sizes="(min-width: 1024px) 380px, (min-width: 480px) 320px, 82vw"
              className="-z-10 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          </>
        )}
        {(ton === "dunkel" || ton === "dunkelgruen") && (
          // Sanftes Licht im Aktionsgrün, wie auf den dunklen Markenflächen
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--color-primary)_45%,transparent),transparent_60%)]"
          />
        )}

        {marke && <div className="absolute left-4 top-4 z-10">{marke}</div>}

        <div className="relative min-h-0 flex-1">
          {ansicht ??
            (objekt && (
              <div className="flex h-full items-center justify-center p-6 pb-0">
                <Objekt
                  objekt={objekt}
                  className="w-full shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-1"
                  sizes="(min-width: 1024px) 330px, 75vw"
                />
              </div>
            ))}
        </div>

        <div className="flex items-end justify-between gap-4 p-6 pt-4">
          <h3 className="font-display text-2xl font-semibold leading-[1.15] text-balance sm:text-[1.75rem]">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
            >
              {titel}
            </Link>
          </h3>
          {details ? (
            <KartenDetails titel={titel} href={href} linkText={linkText} hell={dunkel}>
              {details}
            </KartenDetails>
          ) : (
            <span
              aria-hidden
              className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink ${dunkel ? "" : "ring-1 ring-line"}`}
            >
              <Icon name="arrow-right" className="size-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </article>
    </li>
  );
}
