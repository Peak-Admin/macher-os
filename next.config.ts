import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Macher OS (Vite-App aus `os/`) wird beim Build nach `public/os` kopiert.
  // Dateien unter /os/ liefert Next direkt aus, alle anderen Pfade gehen an die App (Client-Routing).
  async rewrites() {
    return [
      { source: "/os", destination: "/os/index.html" },
      { source: "/os/:path*", destination: "/os/index.html" },
    ];
  },
};

export default nextConfig;
