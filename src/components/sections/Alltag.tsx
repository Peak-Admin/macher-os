import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Icon, IconTile, Karte3D, SectionHeading, type IconName } from "@/components/ui";
import { AbnahmeMini, AnfrageMini, BaustelleMini, PlanungMini } from "./AlltagMinis";

type Moment = { titel: string; icon: IconName; text: string; href: string; ort: string; app: ReactNode };

const momente: Moment[] = [
  {
    titel: "Anfrage",
    icon: "phone",
    text: "Der Kunde ruft an. Macher legt die Anfrage an und schlägt einen Termin vor.",
    href: "/funktionen/anfragen",
    ort: "Eingang",
    app: <AnfrageMini />,
  },
  {
    titel: "Planung",
    icon: "calendar",
    text: "Jeder weiß morgens, wo er hinfährt und was er mitnehmen muss.",
    href: "/funktionen/einsatzplanung",
    ort: "Planen · Heute",
    app: <PlanungMini />,
  },
  {
    titel: "Baustelle",
    icon: "camera",
    text: "Fotos, Zeiten und Material landen direkt im Auftrag – vom Handy.",
    href: "/funktionen/dokumentation",
    ort: "Einsatz · Haus 24",
    app: <BaustelleMini />,
  },
  {
    titel: "Abnahme",
    icon: "signature",
    text: "Unterschrift vor Ort. Die Rechnung ist vorbereitet, bevor du wieder im Auto sitzt.",
    href: "/funktionen/rechnungen",
    ort: "Abschluss",
    app: <AbnahmeMini />,
  },
];

/**
 * „Dein Alltag“: vier Momente als 3D-Karten, jede zeigt oben, wie der Moment in Macher OS aussieht (Beispieldaten) –
 * zum Ausprobieren: Der Ausschnitt reagiert auf Klicks, der Titel führt zur Funktion.
 * `nachUeberhang`: oben Platz für das Fenster, das aus dem Hero hineinragt (`UEBERHANG` in KernBereiche).
 */
export function Alltag({ nachUeberhang = false }: { nachUeberhang?: boolean }) {
  const abstand = nachUeberhang ? "pb-16 pt-[12rem] sm:pb-24 sm:pt-[17rem] lg:pt-[25rem]" : "py-16 sm:py-24";
  return (
    <section data-header-theme="hell" className={`zone zone-beige ${abstand}`}>
      <Container>
        <SectionHeading
          eyebrow="Dein Alltag"
          title="So läuft's mit Macher OS."
          intro="Vier Momente aus jedem Handwerksbetrieb – und wie sie in Macher OS aussehen."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {momente.map((m, n) => (
            <li key={m.titel}>
              <Karte3D innen="flex h-full flex-col rounded-2xl border border-line bg-white">
                <div className="relative rounded-t-2xl bg-ink px-4 pb-5 pt-4" style={{ transformStyle: "preserve-3d" }}>
                  <div className="mb-3 flex items-center justify-between text-white">
                    <IconTile name={m.icon} className="size-9" />
                    <span className="font-display text-sm font-bold tabular-nums text-white/60">0{n + 1}</span>
                  </div>
                  <div
                    role="group"
                    aria-label={`${m.titel} zum Ausprobieren (Beispiel)`}
                    className="karte-3d-tief relative z-10 flex min-h-44 flex-col rounded-xl bg-white p-3 text-[12px] text-ink shadow-[0_18px_30px_-18px_rgb(0_0_0/0.7)]"
                  >
                    <p className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
                      <span className="font-semibold">{m.ort}</span>
                      <span className="rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold">Beispiel</span>
                    </p>
                    {m.app}
                  </div>
                </div>
                <div className="relative flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-bold text-ink">
                    <Link href={m.href} className="outline-none after:absolute after:inset-0 after:rounded-b-2xl focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary">
                      {m.titel}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted">{m.text}</p>
                  <span aria-hidden className="mt-4 inline-flex items-center gap-1.5 font-semibold text-signal-dark">
                    So geht&apos;s <Icon name="arrow-right" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Karte3D>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
