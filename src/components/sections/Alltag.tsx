import type { ReactNode } from "react";
import { Container, Icon, Karte3D, SectionHeading, type IconName } from "@/components/ui";

type Moment = { titel: string; icon: IconName; text: string; href: string; ort: string; app: ReactNode };

function Zeile({ links, rechts }: { links: ReactNode; rechts?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-0">
      <span className="min-w-0 truncate">{links}</span>
      {rechts}
    </div>
  );
}

function Pille({ children, ton = "neutral" }: { children: ReactNode; ton?: "neutral" | "gut" | "warnung" }) {
  const t = { neutral: "bg-sand text-muted", gut: "bg-signal-soft text-moss", warnung: "bg-warning-soft text-warning" }[ton];
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

const momente: Moment[] = [
  {
    titel: "Anfrage",
    icon: "phone",
    text: "Der Kunde ruft an. Macher legt die Anfrage an und schlägt einen Termin vor.",
    href: "/funktionen/anfragen",
    ort: "Eingang",
    app: (
      <>
        <Zeile links={<b className="font-semibold">Steckdosen im Keller</b>} rechts={<Pille>Neu</Pille>} />
        <Zeile links="Anruf · Petra Schulz · 08:12" />
        <p className="mt-2 rounded-md bg-signal-soft px-2 py-1.5 text-moss">Vorschlag: Di., 10:00 Uhr</p>
      </>
    ),
  },
  {
    titel: "Planung",
    icon: "calendar",
    text: "Jeder weiß morgens, wo er hinfährt und was er mitnehmen muss.",
    href: "/funktionen/einsatzplanung",
    ort: "Planen · Heute",
    app: (
      <>
        <Zeile links={<><b className="font-semibold">07:00</b> Sanierung Haus 24</>} rechts={<Pille ton="gut">Bestätigt</Pille>} />
        <Zeile links={<><b className="font-semibold">13:00</b> Jährliche Wartung</>} />
        <Zeile links={<><b className="font-semibold">15:30</b> Besichtigung Neubau</>} rechts={<Pille ton="warnung">Konflikt</Pille>} />
      </>
    ),
  },
  {
    titel: "Baustelle",
    icon: "camera",
    text: "Fotos, Zeiten und Material landen direkt im Auftrag – vom Handy.",
    href: "/funktionen/dokumentation",
    ort: "Einsatz · Haus 24",
    app: (
      <div className="grid grid-cols-3 gap-1.5 text-center font-semibold">
        {(
          [
            ["camera", "3 Fotos"],
            ["clock", "4:30 Std."],
            ["box", "Material"],
          ] as [IconName, string][]
        ).map(([i, l]) => (
          <span key={l} className="flex flex-col items-center gap-1 rounded-md border border-line py-2">
            <Icon name={i} className="size-4 text-signal-dark" />
            {l}
          </span>
        ))}
      </div>
    ),
  },
  {
    titel: "Abnahme",
    icon: "signature",
    text: "Unterschrift vor Ort. Die Rechnung ist vorbereitet, bevor du wieder im Auto sitzt.",
    href: "/funktionen/rechnungen",
    ort: "Abschluss",
    app: (
      <>
        <Zeile links={<b className="font-semibold">Unterschrift Kunde</b>} rechts={<Pille ton="gut">Erhalten</Pille>} />
        <Zeile links="Rechnung R-2026-0005" rechts={<Pille>Vorbereitet</Pille>} />
        <svg viewBox="0 0 120 24" aria-hidden className="mt-1 h-6 w-28 text-ink">
          <path d="M4 18c8-14 14-14 16-4s6 8 12-2 10-6 12 2 10 4 18-6 14-2 20 4 14 2 30-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </>
    ),
  },
];

/** „Dein Alltag“: vier Momente als 3D-Karten, jede zeigt oben, wie der Moment in Macher OS aussieht (Beispieldaten). */
export function Alltag() {
  return (
    <section data-header-theme="hell" className="zone zone-beige py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Dein Alltag"
          title="So läuft's mit Macher OS."
          intro="Vier Momente aus jedem Handwerksbetrieb – und wie sie in Macher OS aussehen."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {momente.map((m, n) => (
            <li key={m.titel}>
              <Karte3D href={m.href} innen="flex flex-col rounded-2xl border border-line bg-white">
                <div className="relative min-h-48 rounded-t-2xl bg-ink px-4 pb-5 pt-4" style={{ transformStyle: "preserve-3d" }}>
                  <div className="mb-3 flex items-center justify-between text-white">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10 text-accent">
                      <Icon name={m.icon} className="size-5" />
                    </span>
                    <span className="font-display text-sm font-bold tabular-nums text-white/60">0{n + 1}</span>
                  </div>
                  <div className="karte-3d-tief rounded-xl bg-white p-3 text-[12px] text-ink shadow-[0_18px_30px_-18px_rgb(0_0_0/0.7)]">
                    <p className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
                      <span className="font-semibold">{m.ort}</span>
                      <span className="rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold">Beispiel</span>
                    </p>
                    {m.app}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-bold text-ink">{m.titel}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted">{m.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-signal-dark">
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
