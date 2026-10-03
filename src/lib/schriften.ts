import { EB_Garamond, Inter } from "next/font/google";

/** Inter für alles Lesbare (Text, Felder, Knöpfe, Zahlen) */
export const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
/** EB Garamond nur für Titel (h1–h3) */
export const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"] });
