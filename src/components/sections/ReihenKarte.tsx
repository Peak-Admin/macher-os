import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Objekt } from "@/components/ui/Objekt";
import { Foto } from "@/components/ui/Foto";
import type { BildKey } from "@/content/bilder";
import type { ObjektSchluessel } from "@/lib/objekte";
import { KartenDetails } from "./KartenReihe";

/**
 * Hohe Karte für eine `KartenReihe`. Zwei Arten:
 * - `hell`: ruhige helle Fläche, oben ein Objektfoto (`objekt`) oder eine eigene Ansicht (`ansicht`, z. B. ein Mock)
 * - `foto`: Foto füllt die Karte, unten abgedunkelt, Titel weiß
 * Unten steht der Titel groß; rechts daneben der runde „+“-Knopf, der `details` im Dialog öffnet. Ohne `details`
 * führt ein Pfeil direkt zum Ziel. Die ganze Karte ist ein Link (über den Titel), der „+“-Knopf liegt darüber.
 */
export function ReihenKarte({
  titel,
  href,
  art = "hell",
  objekt,
  bild,
  ansicht,
  marke,
  details,
  linkText = "Ansehen",
}: {
  titel: string;
  href: string;
  art?: "hell" | "foto";
  /** `hell`: Objektfoto oben */
  objekt?: ObjektSchluessel;
  /** `foto`: Foto aus dem Bildregister */
  bild?: BildKey;
  /** `hell`: eigene Ansicht statt Objektfoto */
  ansicht?: ReactNode;
  /** kleine Marke oben links, z. B. „Beispiel“ */
  marke?: ReactNode;
  /** Inhalt des Detail-Dialogs hinter „+“ */
  details?: ReactNode;
  /** Text des Links im Dialog */
  linkText?: string;
}) {
  const foto = art === "foto";
  return (
    <li className="w-[82%] shrink-0 snap-start min-[480px]:w-[20rem] lg:w-[22rem] xl:w-[23.5rem]">
      <article
        className={`group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-2xl transition-shadow duration-150 ease-out hover:shadow-lg hover:shadow-ink/10 ${
          foto ? "bg-ink text-white" : "bg-paper text-ink ring-1 ring-inset ring-line"
        }`}
      >
        {foto && bild && (
          <>
            <Foto
              bild={bild}
              sizes="(min-width: 1024px) 380px, (min-width: 480px) 320px, 82vw"
              className="-z-10 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
          </>
        )}

        {marke && <div className="absolute left-4 top-4 z-10">{marke}</div>}

        {!foto && (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6 pb-0">
            {ansicht ??
              (objekt && (
                <Objekt
                  objekt={objekt}
                  className="w-full shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-1"
                  sizes="(min-width: 1024px) 330px, 75vw"
                />
              ))}
          </div>
        )}

        <div className={`mt-auto flex items-end justify-between gap-4 p-6 ${foto ? "" : "pt-5"}`}>
          <h3 className="font-display text-2xl font-semibold leading-[1.15] text-balance sm:text-[1.75rem]">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
            >
              {titel}
            </Link>
          </h3>
          {details ? (
            <KartenDetails titel={titel} href={href} linkText={linkText} hell={foto}>
              {details}
            </KartenDetails>
          ) : (
            <span
              aria-hidden
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${foto ? "bg-white text-ink" : "bg-white text-ink ring-1 ring-line"}`}
            >
              <Icon name="arrow-right" className="size-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </article>
    </li>
  );
}
