"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";
import { app } from "@/lib/site";

const emailMuster = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Anmeldung. Es gibt noch kein Produkt-Backend – beim Absenden erscheint ein ehrlicher Hinweis. */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<{ email?: string; passwort?: string }>({});
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [zeigen, setZeigen] = useState(false);
  const id = useId();

  const absenden = (e: FormEvent) => {
    e.preventDefault();
    const f: typeof fehler = {};
    if (!email.trim()) f.email = "Bitte gib deine E-Mail-Adresse ein.";
    else if (!emailMuster.test(email.trim())) f.email = "Diese E-Mail-Adresse sieht nicht richtig aus.";
    if (!passwort) f.passwort = "Bitte gib dein Passwort ein.";
    setFehler(f);
    if (f.email || f.passwort) {
      setHinweis(null);
      return;
    }
    setHinweis("Konten mit Anmeldung kommen bald. Macher OS läuft schon jetzt direkt in deinem Browser.");
  };

  const feld =
    "mt-1.5 h-12 w-full rounded-lg bg-paper px-3 text-base ring-1 ring-inset ring-line focus:bg-white focus:ring-2 focus:ring-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-signal-dark";

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-6 sm:pt-12">
      <form onSubmit={absenden} noValidate className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Anmelden</h1>
        <p className="mt-2 text-muted">Willkommen zurück.</p>

        <div className="mt-8">
          <label htmlFor={`${id}-email`} className="block text-sm font-semibold">
            E-Mail-Adresse
          </label>
          <input
            id={`${id}-email`}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fehler.email)}
            aria-describedby={fehler.email ? `${id}-email-fehler` : undefined}
            className={feld}
          />
          {fehler.email && (
            <p id={`${id}-email-fehler`} className="mt-1.5 text-sm font-semibold text-signal-dark">
              {fehler.email}
            </p>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-pw`} className="block text-sm font-semibold">
              Passwort
            </label>
            <button
              type="button"
              onClick={() => setHinweis("„Passwort vergessen“ ist bald verfügbar. Bis dahin hilft dir unser Support weiter.")}
              className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink"
            >
              Passwort vergessen?
            </button>
          </div>
          <div className="relative">
            <input
              id={`${id}-pw`}
              type={zeigen ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              aria-invalid={Boolean(fehler.passwort)}
              aria-describedby={fehler.passwort ? `${id}-pw-fehler` : undefined}
              className={`${feld} pr-24`}
            />
            <button
              type="button"
              onClick={() => setZeigen((z) => !z)}
              aria-pressed={zeigen}
              className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-semibold text-muted hover:bg-sand hover:text-ink"
            >
              {zeigen ? "Verbergen" : "Anzeigen"}
            </button>
          </div>
          {fehler.passwort && (
            <p id={`${id}-pw-fehler`} className="mt-1.5 text-sm font-semibold text-signal-dark">
              {fehler.passwort}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-signal font-bold text-white transition-colors hover:bg-signal-dark"
        >
          Anmelden <Icon name="arrow-right" className="size-4" />
        </button>

        <div aria-live="polite">
          {hinweis && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-lg bg-sand px-3 py-2.5 text-sm text-ink-soft">
              <Icon name="bell" className="mt-0.5 size-4 shrink-0 text-signal-dark" />
              <span>
                {hinweis}{" "}
                {hinweis.startsWith("Konten") && (
                  <a href={app.einrichten()} className="font-semibold underline">
                    Macher OS öffnen
                  </a>
                )}
                {hinweis.startsWith("„Passwort") && (
                  <Link href="/hilfe/kontakt" className="font-semibold underline">
                    Kontakt & Support
                  </Link>
                )}
              </span>
            </p>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Noch kein Konto?{" "}
        <Link href="/signup" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
          Kostenlos testen
        </Link>
      </p>
    </div>
  );
}
