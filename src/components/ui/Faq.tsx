import { Icon } from "./Icon";

export type FaqItem = { frage: string; antwort: string };

/**
 * FAQ-Liste mit nativen <details> – funktioniert ohne JavaScript.
 * `dark`: einzelne dunkelgrüne Panels für dunkle Abschnitte (Referenz „FAQ-Akkordeon dunkel“).
 */
export function Faq({ items, dark = false }: { items: FaqItem[]; dark?: boolean }) {
  if (dark) {
    return (
      <div className="grid gap-2">
        {items.map((item) => (
          <details key={item.frage} className="group karte-dunkel bg-ink-soft px-5 py-4 open:shadow-[inset_0_0_0_1px_var(--color-brand)]">
            <summary className="flex cursor-pointer items-center gap-4 font-semibold text-white">
              <Icon name="frage" className="size-6 shrink-0 text-accent" />
              <span className="flex-1 text-[1.05rem]">{item.frage}</span>
              <Icon
                name="chevron-down"
                className="size-5 shrink-0 text-white/70 transition-transform duration-150 ease-out group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 max-w-3xl pl-10 leading-relaxed text-white/80">{item.antwort}</p>
          </details>
        ))}
      </div>
    );
  }
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((item) => (
        <details key={item.frage} className="group px-6 py-5">
          <summary className="flex cursor-pointer items-start justify-between gap-6 font-semibold">
            <span className="text-[1.05rem]">{item.frage}</span>
            <Icon
              name="plus"
              className="mt-0.5 size-5 shrink-0 text-signal-dark transition-transform group-open:rotate-45"
            />
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{item.antwort}</p>
        </details>
      ))}
    </div>
  );
}

/** JSON-LD für FAQ-Rich-Results. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.frage,
      acceptedAnswer: { "@type": "Answer", text: i.antwort },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
