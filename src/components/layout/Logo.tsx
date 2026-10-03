import Image from "next/image";
import Link from "next/link";
import { herausgeber } from "@/lib/site";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label={`Handwerk OS von ${herausgeber.name} – zur Startseite`} className="flex items-center gap-2.5">
      <Image src="/marke/zeichen.png" alt="" width={32} height={32} className="size-8 shrink-0" priority />
      <span className="flex flex-col leading-none">
        <span className={`whitespace-nowrap font-display text-base font-extrabold tracking-tight sm:text-lg ${dark ? "text-white" : "text-ink"}`}>
          HANDWERK<span className={dark ? "text-accent" : "text-brand"}> OS</span>
        </span>
        <span className={`mt-0.5 whitespace-nowrap text-[0.7rem] font-medium ${dark ? "text-white/70" : "text-muted"}`}>
          von {herausgeber.name}
        </span>
      </span>
    </Link>
  );
}
