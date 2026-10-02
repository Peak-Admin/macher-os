"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { plaene } from "@/content/preise";
import { gewerkCluster, topGewerke, type GewerkSlug } from "@/content/registry";
import { arbeitsweisen, leistungenNachGewerk, teamgroessen } from "./signup-daten";

const SCHRITTE = 5;
const emailMuster = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Arbeitsweise = (typeof arbeitsweisen)[number]["id"];
type Team = (typeof teamgroessen)[number]["id"];

function gewerkTitel(slug: GewerkSlug | "") {
  return (
    topGewerke.find((g) => g.slug === slug)?.titel ?? gewerkCluster.find((g) => g.slug === slug)?.titel ?? ""
  );
}

/** Mehrstufige Registrierung: E-Mail → Gewerk → Leistungen → Arbeitsweise → Teamgröße → Ergebnis. */
export function SignupFlow() {
  const params = useSearchParams();
  const plan = plaene.find((p) => p.id === params.get("plan"));

  const [schritt, setSchritt] = useState(0);
  const [email, setEmail] = useState("");
  const [gewerk, setGewerk] = useState<GewerkSlug | "">("");
  const [leistungen, setLeistungen] = useState<string[]>([]);
  const [eigene, setEigene] = useState("");
  const [arbeitsweise, setArbeitsweise] = useState<Arbeitsweise | "">("");
  const [team, setTeam] = useState<Team | "">("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [ssoHinweis, setSsoHinweis] = useState<string | null>(null);

  const ueberschrift = useRef<HTMLHeadingElement>(null);
  const ersterSchritt = useRef(true);
  const fehlerId = useId();

  // Nach jedem Schrittwechsel den Fokus auf die neue Frage setzen (nicht beim ersten Laden).
  useEffect(() => {
    if (ersterSchritt.current) {
      ersterSchritt.current = false;
      return;
    }
    ueberschrift.current?.focus();
  }, [schritt]);

  const pruefen = (): string | null => {
    switch (schritt) {
      case 0:
        if (!email.trim()) return "Bitte gib deine E-Mail-Adresse ein.";
        if (!emailMuster.test(email.trim())) return "Diese E-Mail-Adresse sieht nicht richtig aus.";
        return null;
      case 1:
        return gewerk ? null : "Bitte wähle euer Gewerk.";
      case 2:
        return leistungen.length > 0 ? null : "Bitte wähle mindestens eine Leistung.";
      case 3:
        return arbeitsweise ? null : "Bitte wähle, wie ihr hauptsächlich arbeitet.";
      case 4:
        return team ? null : "Bitte wähle eure Teamgröße.";
      default:
        return null;
    }
  };

  const weiter = (e: FormEvent) => {
    e.preventDefault();
    const f = pruefen();
    setFehler(f);
    if (f) return;
    setSchritt((s) => Math.min(s + 1, SCHRITTE));
  };

  const zurueck = () => {
    setFehler(null);
    setSchritt((s) => Math.max(s - 1, 0));
  };

  const waehleGewerk = (slug: GewerkSlug | "") => {
    if (slug !== gewerk) setLeistungen([]);
    setGewerk(slug);
    setFehler(null);
  };

  const leistungUmschalten = (l: string) => {
    setLeistungen((ls) => (ls.includes(l) ? ls.filter((x) => x !== l) : [...ls, l]));
    setFehler(null);
  };

  const eigeneHinzufuegen = () => {
    const wert = eigene.trim();
    if (!wert) return;
    if (!leistungen.includes(wert)) setLeistungen((ls) => [...ls, wert]);
    setEigene("");
    setFehler(null);
  };

  const fehlerProps = fehler ? { "aria-invalid": true, "aria-describedby": fehlerId } : {};

  if (schritt === SCHRITTE) {
    return (
      <Ergebnis
        email={email.trim()}
        gewerk={gewerkTitel(gewerk)}
        leistungen={leistungen}
        arbeitsweise={arbeitsweisen.find((a) => a.id === arbeitsweise)?.label ?? ""}
        team={teamgroessen.find((t) => t.id === team)?.label ?? ""}
        plan={plan?.name}
        ueberschrift={ueberschrift}
        zurueck={zurueck}
      />
    );
  }

  const vorschlaege = gewerk ? leistungenNachGewerk[gewerk] : [];
  const eigeneLeistungen = leistungen.filter((l) => !vorschlaege.includes(l));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Fortschritt schritt={schritt} plan={plan?.name} />

      <form onSubmit={weiter} noValidate className="mt-8 rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        {schritt === 0 && (
          <Frage
            refH={ueberschrift}
            titel="Kostenlos testen"
            intro="Starte mit deiner E-Mail-Adresse. Keine Kreditkarte nötig."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {["Google", "Apple"].map((anbieter) => (
                <button
                  key={anbieter}
                  type="button"
                  onClick={() =>
                    setSsoHinweis(
                      `Die Anmeldung mit ${anbieter} ist bald verfügbar. Nutze bis dahin bitte deine E-Mail-Adresse.`,
                    )
                  }
                  className="h-11 rounded-lg bg-white font-semibold ring-1 ring-inset ring-line transition hover:ring-ink/40"
                >
                  Mit {anbieter} fortfahren
                </button>
              ))}
            </div>
            {ssoHinweis && (
              <p role="status" className="mt-3 rounded-lg bg-sand px-3 py-2 text-sm text-ink-soft">
                {ssoHinweis}
              </p>
            )}
            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-line" /> oder <span className="h-px flex-1 bg-line" />
            </div>
            <label htmlFor="signup-email" className="block text-sm font-semibold">
              E-Mail-Adresse
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFehler(null);
              }}
              placeholder="name@betrieb.de"
              className="mt-1.5 h-12 w-full rounded-lg bg-paper px-3 text-base ring-1 ring-inset ring-line focus:bg-white focus:ring-2 focus:ring-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-signal-dark"
              {...fehlerProps}
            />
          </Frage>
        )}

        {schritt === 1 && (
          <Frage refH={ueberschrift} titel="Was macht ihr?" intro="Wähle euer Gewerk. Begriffe und Vorlagen passen sich daran an.">
            <fieldset {...fehlerProps}>
              <legend className="sr-only">Gewerk</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {topGewerke.map((g) => (
                  <Auswahl
                    key={g.slug}
                    name="gewerk"
                    typ="radio"
                    checked={gewerk === g.slug}
                    onChange={() => waehleGewerk(g.slug)}
                  >
                    {g.kurz}
                  </Auswahl>
                ))}
              </div>
            </fieldset>
            <label htmlFor="signup-cluster" className="mt-5 block text-sm font-semibold">
              Anderes Gewerk
            </label>
            <div className="relative mt-1.5">
              <select
                id="signup-cluster"
                value={gewerkCluster.some((c) => c.slug === gewerk) ? gewerk : ""}
                onChange={(e) => waehleGewerk(e.target.value as GewerkSlug | "")}
                className="h-12 w-full appearance-none rounded-lg bg-paper pl-3 pr-9 ring-1 ring-inset ring-line focus:bg-white focus:ring-2 focus:ring-ink"
              >
                <option value="">Bereich auswählen …</option>
                {gewerkCluster.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.titel}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </div>
          </Frage>
        )}

        {schritt === 2 && (
          <Frage
            refH={ueberschrift}
            titel="Welche Arbeiten bietet ihr an?"
            intro={`Vorschläge für ${gewerkTitel(gewerk)}. Wähle alles, was passt – mehrere sind möglich.`}
          >
            <fieldset {...fehlerProps}>
              <legend className="sr-only">Leistungen</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[...vorschlaege, ...eigeneLeistungen].map((l) => (
                  <Auswahl
                    key={l}
                    name="leistungen"
                    typ="checkbox"
                    checked={leistungen.includes(l)}
                    onChange={() => leistungUmschalten(l)}
                  >
                    {l}
                  </Auswahl>
                ))}
              </div>
            </fieldset>
            <label htmlFor="signup-eigene" className="mt-5 block text-sm font-semibold">
              Eigene Leistung ergänzen
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="signup-eigene"
                type="text"
                value={eigene}
                onChange={(e) => setEigene(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    eigeneHinzufuegen();
                  }
                }}
                placeholder="z. B. Barrierefreie Bäder"
                className="h-11 min-w-0 flex-1 rounded-lg bg-paper px-3 ring-1 ring-inset ring-line focus:bg-white focus:ring-2 focus:ring-ink"
              />
              <button
                type="button"
                onClick={eigeneHinzufuegen}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg px-4 font-semibold ring-1 ring-inset ring-line hover:ring-ink/40"
              >
                <Icon name="plus" className="size-4" /> Hinzufügen
              </button>
            </div>
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              {leistungen.length === 0 ? "Noch nichts ausgewählt." : `${leistungen.length} ausgewählt`}
            </p>
          </Frage>
        )}

        {schritt === 3 && (
          <Frage refH={ueberschrift} titel="Wie arbeitet ihr hauptsächlich?" intro="Danach richten wir Planung und Abläufe aus.">
            <fieldset {...fehlerProps}>
              <legend className="sr-only">Arbeitsweise</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {arbeitsweisen.map((a) => (
                  <Auswahl
                    key={a.id}
                    name="arbeitsweise"
                    typ="radio"
                    checked={arbeitsweise === a.id}
                    onChange={() => {
                      setArbeitsweise(a.id);
                      setFehler(null);
                    }}
                    beschreibung={a.text}
                  >
                    {a.label}
                  </Auswahl>
                ))}
              </div>
            </fieldset>
          </Frage>
        )}

        {schritt === 4 && (
          <Frage refH={ueberschrift} titel="Wie groß seid ihr?" intro="Alle, die mitarbeiten – Büro und Baustelle.">
            <fieldset {...fehlerProps}>
              <legend className="sr-only">Teamgröße</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {teamgroessen.map((t) => (
                  <Auswahl
                    key={t.id}
                    name="team"
                    typ="radio"
                    checked={team === t.id}
                    onChange={() => {
                      setTeam(t.id);
                      setFehler(null);
                    }}
                  >
                    {t.label}
                  </Auswahl>
                ))}
              </div>
            </fieldset>
          </Frage>
        )}

        {fehler && (
          <p id={fehlerId} role="alert" className="mt-4 flex items-center gap-2 text-sm font-semibold text-signal-dark">
            <Icon name="x" className="size-4" /> {fehler}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {schritt > 0 ? (
            <button
              type="button"
              onClick={zurueck}
              className="inline-flex h-12 items-center gap-2 rounded-lg px-4 font-semibold text-ink ring-1 ring-inset ring-line hover:ring-ink/40"
            >
              <Icon name="arrow-right" className="size-4 rotate-180" /> Zurück
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-signal px-6 font-bold text-white transition-colors hover:bg-signal-dark"
          >
            {schritt === SCHRITTE - 1 ? "Einrichten" : "Weiter"} <Icon name="arrow-right" className="size-4" />
          </button>
        </div>

        {schritt === 0 && (
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Mit dem Fortfahren akzeptierst du unsere{" "}
            <Link href="/agb" className="underline hover:text-ink">
              AGB
            </Link>{" "}
            und die{" "}
            <Link href="/datenschutz" className="underline hover:text-ink">
              Datenschutzerklärung
            </Link>
            .
          </p>
        )}
      </form>

      {schritt === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          Schon ein Konto?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
            Anmelden
          </Link>
        </p>
      )}
    </div>
  );
}

function Fortschritt({ schritt, plan }: { schritt: number; plan?: string }) {
  const aktuell = Math.min(schritt + 1, SCHRITTE);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold">
          Schritt {aktuell} von {SCHRITTE}
        </p>
        {plan && (
          <p className="rounded-md bg-signal-soft px-2.5 py-1 text-xs font-bold text-signal-dark">
            Gewählter Plan: {plan}
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Fortschritt der Einrichtung"
        aria-valuemin={1}
        aria-valuemax={SCHRITTE}
        aria-valuenow={aktuell}
        className="mt-3 grid grid-cols-5 gap-1.5"
      >
        {Array.from({ length: SCHRITTE }, (_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-colors ${i <= schritt ? "bg-signal" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

function Frage({
  refH,
  titel,
  intro,
  children,
}: {
  refH: React.RefObject<HTMLHeadingElement | null>;
  titel: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h1 ref={refH} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight outline-none sm:text-4xl">
        {titel}
      </h1>
      <p className="mt-2 text-muted">{intro}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Auswahl({
  name,
  typ,
  checked,
  onChange,
  beschreibung,
  children,
}: {
  name: string;
  typ: "radio" | "checkbox";
  checked: boolean;
  onChange: () => void;
  beschreibung?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-3 text-sm transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal ${
        checked ? "bg-ink text-white" : "bg-paper ring-1 ring-inset ring-line hover:ring-ink/40"
      }`}
    >
      <input type={typ} name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden
        className={`mt-px inline-flex size-4.5 shrink-0 items-center justify-center ${typ === "radio" ? "rounded-full" : "rounded"} ${
          checked ? "bg-signal text-white" : "bg-white ring-1 ring-line"
        }`}
      >
        {checked && <Icon name="check" className="size-3" />}
      </span>
      <span>
        <span className="block font-semibold leading-tight">{children}</span>
        {beschreibung && (
          <span className={`mt-0.5 block text-xs ${checked ? "text-white/70" : "text-muted"}`}>{beschreibung}</span>
        )}
      </span>
    </label>
  );
}

function Ergebnis({
  email,
  gewerk,
  leistungen,
  arbeitsweise,
  team,
  plan,
  ueberschrift,
  zurueck,
}: {
  email: string;
  gewerk: string;
  leistungen: string[];
  arbeitsweise: string;
  team: string;
  plan?: string;
  ueberschrift: React.RefObject<HTMLHeadingElement | null>;
  zurueck: () => void;
}) {
  const punkte = [
    { titel: "Funktionen", text: `passend für ${arbeitsweise}` },
    { titel: "Begriffe", text: `aus dem Alltag von ${gewerk}` },
    { titel: "Vorlagen", text: `für ${leistungen.length === 1 ? "1 Leistung" : `${leistungen.length} Leistungen`}` },
    { titel: "Abläufe", text: "von der Anfrage bis zur Rechnung" },
    { titel: "Checklisten", text: "für Baustelle und Kundendienst" },
    { titel: "Schulungen", text: `für ein Team mit ${team === "Nur ich" ? "einer Person" : `${team} Leuten`}` },
  ];

  const [fertig, setFertig] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? punkte.length : 0,
  );

  useEffect(() => {
    if (fertig >= punkte.length) return;
    const t = window.setTimeout(() => setFertig((f) => f + 1), 650);
    return () => window.clearTimeout(t);
  }, [fertig, punkte.length]);

  const alles = fertig >= punkte.length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-moss">Alle Fragen beantwortet</p>
        <h1
          ref={ueberschrift}
          tabIndex={-1}
          className="mt-2 font-display text-3xl font-extrabold tracking-tight text-balance outline-none sm:text-4xl"
        >
          Macher OS wird für deinen Betrieb eingerichtet.
        </h1>
        <p className="mt-2 text-muted">
          {gewerk} · {arbeitsweise} · {team}
          {plan && ` · Plan ${plan}`}
        </p>

        <ul className="mt-8 space-y-2.5" aria-label="Einrichtung">
          {punkte.map((p, i) => {
            const ok = i < fertig;
            const laeuft = i === fertig;
            return (
              <li
                key={p.titel}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors duration-300 ${
                  ok ? "bg-moss-soft" : "bg-paper"
                }`}
              >
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md ${
                    ok ? "bg-moss text-white" : "bg-white ring-1 ring-line"
                  }`}
                >
                  {ok ? (
                    <Icon name="check" className="size-4" />
                  ) : laeuft ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-line border-t-signal" />
                  ) : null}
                </span>
                <span className={ok ? "" : "text-muted"}>
                  <b className={ok ? "text-ink" : ""}>{p.titel}</b> {p.text}
                </span>
                <span className="sr-only">{ok ? "– vorbereitet" : "– wird vorbereitet"}</span>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite">
          {alles && (
            <div className="mt-8 rounded-lg bg-ink p-5 text-white">
              <p className="flex items-center gap-2 font-display text-lg font-bold">
                <Icon name="inbox" className="size-5 text-signal" /> Fast geschafft.
              </p>
              <p className="mt-2 text-white/80">
                Wir melden uns per E-Mail, sobald dein Zugang bereit ist
                {email && (
                  <>
                    {" "}
                    – an <b className="text-white">{email}</b>
                  </>
                )}
                .
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={zurueck}
            className="inline-flex h-11 items-center gap-2 rounded-lg px-4 font-semibold ring-1 ring-inset ring-line hover:ring-ink/40"
          >
            <Icon name="arrow-right" className="size-4 rotate-180" /> Angaben ändern
          </button>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/demo" className="underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
              Demo ansehen
            </Link>
            <Link href="/hilfe/schnellstart" className="underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
              Schnellstart lesen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
