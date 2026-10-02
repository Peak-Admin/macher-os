import type { NextConfig } from "next";

/** Website und Software (Macher OS) laufen in einem Projekt auf einer Domain. Die Software liegt unter `/os`
 *  (Code: `src/os/`, Route: `src/app/(os)/os`). Es gibt (noch) kein Konto und keinen Login:
 *  „Kostenlos testen“ startet direkt die Einrichtung, die Daten bleiben im Browser. */
const nextConfig: NextConfig = {
  experimental: {
    // Website und Software haben eigene Root-Layouts → 404 über app/global-not-found.tsx
    globalNotFound: true,
  },
  async rewrites() {
    // Die Software ist eine Single-Page-App mit eigenem Router: jede Adresse unter /os/… lädt dieselbe Seite.
    return [{ source: "/os/:pfad+", destination: "/os" }];
  },
  async redirects() {
    return [
      // frühere Registrierung und Anmeldung – alte Links führen direkt in die App
      { source: "/signup", destination: "/os/willkommen", permanent: false },
      { source: "/login", destination: "/os/heute", permanent: false },
      { source: "/hilfe-center/passwort-vergessen", destination: "/hilfe-center/daten-sichern", permanent: true },
    ];
  },
};

export default nextConfig;
