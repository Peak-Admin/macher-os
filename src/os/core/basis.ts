/** Handwerk OS läuft auf derselben Domain wie die Website, unter diesem Pfad (siehe `src/app/(os)`). */
export const BASIS = '/os';

/** Vollständiger Browser-Pfad für eine App-Route – nur für Links außerhalb des Routers (`window.open`, kopierte Links). */
export const appPfad = (pfad: string) => `${BASIS}${pfad.startsWith('/') ? pfad : `/${pfad}`}`;
