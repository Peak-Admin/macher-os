import { Icon } from "./Icon";

export type FaqItem = { frage: string; antwort: string };

/** FAQ-Liste mit nativen <details> – funktioniert ohne JavaScript. */
export function Faq({ items }: { items: FaqItem[] }) {
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
