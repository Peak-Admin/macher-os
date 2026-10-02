import { Logo } from "@/components/layout/Logo";

/** Schlanker Rahmen ohne Marketing-Navigation – für Anmelden und Registrierung. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
