import type { NextConfig } from "next";

/** Macher OS (die Software) läuft als eigenes Projekt. Es gibt (noch) kein Konto und keinen Login:
 *  „Kostenlos testen“ startet direkt die Einrichtung, die Daten bleiben im Browser. */
const APP = "https://macher-os-app.vercel.app";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // frühere Registrierung und Anmeldung – alte Links führen direkt in die App
      { source: "/signup", destination: `${APP}/willkommen`, permanent: false },
      { source: "/login", destination: `${APP}/heute`, permanent: false },
      { source: "/hilfe-center/passwort-vergessen", destination: "/hilfe-center/daten-sichern", permanent: true },
    ];
  },
};

export default nextConfig;
