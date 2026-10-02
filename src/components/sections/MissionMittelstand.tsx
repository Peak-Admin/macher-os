import Link from "next/link";
import { Container, Icon } from "@/components/ui";
import { FotoDatei, bildVorhanden } from "@/components/ui/Foto";
import { herausgeber } from "@/lib/site";

/** Große grüne Chevrons hinter der Person (Personen-Hero mit Pfeilmotiv). */
function Pfeilmotiv({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden className={className} preserveAspectRatio="xMidYMax slice">
      <path d="M40 40 L200 200 L40 360" fill="none" className="stroke-signal-dark" strokeWidth="64" />
      <path d="M150 40 L310 200 L150 360" fill="none" className="stroke-brand" strokeWidth="64" />
      <path d="M260 40 L420 200 L260 360" fill="none" className="stroke-accent" strokeWidth="64" />
    </svg>
  );
}

/** Ersatz, solange kein freigegebenes Porträt in `public/` liegt. */
function PorträtErsatz() {
  const initialen = herausgeber.person.name
    .split(" ")
    .map((t) => t[0])
    .join("");
  return (
    <div className="absolute inset-x-0 bottom-16 flex justify-center" aria-hidden>
      <span className="flex size-40 items-center justify-center rounded-full bg-ink-soft font-display text-5xl font-bold text-white ring-4 ring-white/15">
        {initialen}
      </span>
    </div>
  );
}

/** Personenkarte: Porträt vor Pfeilmotiv, unten dunkle Namensleiste. */
export function PersonenKarte({ className = "" }: { className?: string }) {
  const { person } = herausgeber;
  return (
    <figure className={`relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-ink ${className}`}>
      <Pfeilmotiv className="absolute inset-0 size-full opacity-90" />
      <FotoDatei
        src={person.foto}
        alt={`${person.name}, ${person.rolle}`}
        sizes="(min-width: 1024px) 420px, 90vw"
        className="object-contain object-bottom"
        ersatz={<PorträtErsatz />}
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-ink/80 px-5 py-3 backdrop-blur-sm">
        <span className="block font-display text-lg font-medium text-white">{person.name}</span>
        <span className="block text-sm text-white/75">{person.rolle}</span>
      </figcaption>
    </figure>
  );
}

/** Logo von Mission Mittelstand, falls freigegeben in `public/` abgelegt – sonst der Name als Text. */
export function HerausgeberMarke({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const src = dark ? herausgeber.logo.dunkel : herausgeber.logo.hell;
  if (bildVorhanden(src)) {
    // Originalasset im echten Seitenverhältnis, daher kein next/image mit fester Größe.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={herausgeber.name} className={`w-auto ${className || "h-10"}`} />;
  }
  return (
    <span className={`font-display text-lg font-bold ${dark ? "text-white" : "text-ink"} ${className}`}>
      {herausgeber.name}
    </span>
  );
}

const punkte = [
  "Gemeinsam mit Mission Mittelstand entwickelt",
  "Gebaut für Betriebe, wie Mission Mittelstand sie in der Beratung begleitet",
  "Eine Software für Büro und Baustelle – kein Flickenteppich aus Programmen",
];

/**
 * Abschnitt „Von Mission Mittelstand“: Macher OS ist ein Joint-Venture-Projekt
 * von Mission Mittelstand. Dunkle Fläche, Person vor Pfeilmotiv.
 */
export function MissionMittelstand({
  id,
  title = "Aus der Beratung. Fürs Handwerk.",
  intro = `Macher OS ist ein Joint-Venture-Projekt von ${herausgeber.name}. ${herausgeber.name} begleitet Handwerksbetriebe und Mittelständler in der Beratung – Macher OS bringt diese Erfahrung in deinen Betriebsalltag.`,
}: {
  id?: string;
  title?: string;
  intro?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 overflow-hidden bg-ink text-white">
      <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">
            Von {herausgeber.name}
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/80">{intro}</p>
          <ul className="mt-8 space-y-3">
            {punkte.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Icon name="check" className="mt-1 size-4 shrink-0 text-accent" />
                <span className="text-white/90">{p}</span>
              </li>
            ))}
          </ul>
          <a
            href={herausgeber.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
          >
            Mission Mittelstand kennenlernen <Icon name="arrow-right" className="size-4" />
            <span className="sr-only">(öffnet in neuem Tab)</span>
          </a>
        </div>
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <PersonenKarte />
        </div>
      </Container>
    </section>
  );
}

/** Echtes Team- oder Veranstaltungsfoto von Mission Mittelstand. */
export function MissionMittelstandFoto({ className = "" }: { className?: string }) {
  return (
    <figure className={`relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-ink ${className}`}>
      <FotoDatei
        src={herausgeber.teamFoto}
        alt={`Besprechung im Team von ${herausgeber.name}`}
        sizes="(min-width: 1024px) 640px, 100vw"
        className="object-cover"
        ersatz={
          <div className="absolute inset-0 flex items-end">
            <Pfeilmotiv className="absolute inset-0 size-full opacity-60" />
            <span className="relative m-5 rounded bg-ink/85 px-3 py-1.5 font-display font-semibold text-white">
              {herausgeber.name}
            </span>
          </div>
        }
      />
    </figure>
  );
}

/**
 * Kompakter Hinweis „Hinter Macher OS steht Mission Mittelstand“: echtes Teamfoto, Porträt von Matthias Aumann, Logo.
 * Für Seiten, auf denen Vertrauen zählt (Funktionen, Preise, Hilfe, Kontakt, Gewerke).
 */
export function MissionMittelstandStreifen({ className = "" }: { className?: string }) {
  const { person } = herausgeber;
  return (
    <section className={`bg-white py-12 sm:py-16 ${className}`}>
      <Container>
        <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-end gap-3">
            <MissionMittelstandFoto className="rounded-xl" />
            <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink">
              <FotoDatei
                src={person.foto}
                alt={`${person.name}, ${person.rolle}`}
                sizes="200px"
                className="object-cover object-top"
                ersatz={<PorträtErsatz />}
              />
            </figure>
          </div>
          <div className="min-w-0">
            <HerausgeberMarke className="h-8" />
            <h2 className="mt-5 font-display text-2xl font-bold leading-tight text-balance sm:text-3xl">
              Hinter Macher OS steht {herausgeber.name}.
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              {person.name} und sein Team begleiten Handwerksbetriebe in der Beratung. Diese Erfahrung steckt in Macher OS.
            </p>
            <Link
              href="/ueber-uns#mission-mittelstand"
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 font-semibold text-signal-dark underline underline-offset-4"
            >
              Mehr über uns <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
