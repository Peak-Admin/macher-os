import { Barlow, Poppins } from "next/font/google";

export const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
export const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["600"] });
