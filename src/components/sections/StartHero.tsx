import Image from "next/image";
import { Zone } from "@/components/ui";
import { bildVorhanden } from "@/components/ui/Foto";
import { app, herausgeber } from "@/lib/site";
import { KernBereiche } from "./KernBereiche";
import { TrustRow } from "./TrustRow";

/** Google-Logo in den Originalfarben (fremde Marke, deshalb feste Farben statt Tokens). */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

/**
 * Hero der Startseite (Aufbau nach dem Vorbild von Personio, Farben und Marke von Macher OS): Text in der Mitte,
 * darunter der Einstieg – Google oder E-Mail –, danach gleich die fünf Kernelemente als Pillen und die Software,
 * die schon im unteren Drittel des ersten Bildschirms beginnt. Rechts steht Matthias Aumann (freigegebenes Porträt,
 * siehe `missionMittelstandBilder`), ab 1280 px neben dem Text; er läuft über den Pillen weich aus.
 * Beide Wege führen in die Einrichtung der Software; die E-Mail kommt dort vorausgefüllt an (`?email=`),
 * Google startet direkt (`?anmeldung=google`). Ohne JavaScript funktioniert das Formular als normales GET.
 */
export function StartHero() {
  const { person } = herausgeber;
  const kopf = (
    <>
      <div className="relative">
        {bildVorhanden(person.foto) && (
          // Läuft nach unten weich aus, damit er über den Pillen endet und nichts überdeckt.
          <figure className="pointer-events-none absolute inset-y-0 right-0 hidden w-[20rem] [mask-image:linear-gradient(to_bottom,black_70%,transparent)] xl:block min-[1400px]:w-[24rem]">
            <Image
              src={person.foto}
              alt={`${person.name}, ${person.rolle}`}
              fill
              preload
              sizes="(min-width: 1400px) 384px, 320px"
              className="object-cover object-top"
            />
          </figure>
        )}
        <div className="relative z-10 mx-auto w-full max-w-[36rem] pb-10 text-center">
          <p className="mb-4 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">
            Von {herausgeber.name} · Das Betriebssystem für Handwerker
          </p>
          <h1
            id="hero-titel"
            className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl"
          >
            Dein Betrieb.
            <br />
            <span className="text-accent">Einfach im Griff.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-on-dark">
            Die Software für Handwerker, die Büro, Baustelle und Team
            zusammenbringt.
          </p>

          <div className="mx-auto mt-7 w-full max-w-md text-left">
            <a
              href={`${app.einrichten()}?anmeldung=google`}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-base font-semibold text-ink ring-1 ring-inset ring-line transition-colors duration-150 ease-out hover:bg-signal-soft"
            >
              <GoogleLogo /> Mit Google starten
            </a>

            <p
              className="my-4 flex items-center gap-3 text-sm text-on-dark/80"
              aria-hidden
            >
              <span className="h-px flex-1 bg-white/20" />
              oder mit E-Mail
              <span className="h-px flex-1 bg-white/20" />
            </p>

            <form action={app.einrichten()} method="get">
              <label
                htmlFor="hero-email"
                className="mb-2 block text-base font-medium text-white"
              >
                Deine E-Mail-Adresse
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="hero-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@betrieb.de"
                  className="h-12 w-full min-w-0 rounded-lg border border-white/40 bg-white px-4 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent sm:flex-1"
                />
                <button
                  type="submit"
                  className="btn-primaer min-h-12 shrink-0 px-6"
                >
                  Kostenlos testen
                </button>
              </div>
            </form>
          </div>

          <TrustRow dark className="mt-5 justify-center" />
        </div>
        {bildVorhanden(person.foto) && (
          <p className="absolute bottom-12 right-0 z-10 hidden rounded-xl bg-ink/85 px-4 py-2.5 ring-1 ring-white/15 xl:block">
            <span className="block font-display text-base font-semibold text-white">
              {person.name}
            </span>
            <span className="block text-sm text-on-dark">{person.rolle}</span>
          </p>
        )}
      </div>
    </>
  );

  return (
    <Zone ton="dunkel" label="hero-titel" className="relative overflow-hidden">
      <div className="mx-auto max-w-[90rem] px-4 pb-8 pt-28 sm:px-10 sm:pb-12 xl:px-14">
        <KernBereiche dunkel kopf={kopf} />
      </div>
    </Zone>
  );
}
