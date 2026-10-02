import Link from "next/link";
import { Icon } from "./Icon";

export function Breadcrumbs({ items, dark = false }: { items: { label: string; href?: string }[]; dark?: boolean }) {
  const hover = dark ? "hover:text-white" : "hover:text-ink";
  return (
    <nav aria-label="Brotkrumen" className={`mb-6 text-sm ${dark ? "text-white/70" : "text-muted"}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className={hover}>
            Start
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <Icon name="chevron-down" className="size-3.5 -rotate-90 opacity-60" />
            {item.href ? (
              <Link href={item.href} className={hover}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={dark ? "text-white" : "text-ink"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
