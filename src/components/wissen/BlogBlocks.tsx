import { Icon } from "@/components/ui";
import type { BlogBlock } from "@/content/wissen/blog";

/** Rendert die strukturierten Inhaltsblöcke eines Blog-Artikels. */
export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="text-[1.0625rem] leading-relaxed text-ink-soft">
      {blocks.map((b, i) => {
        switch (b.typ) {
          case "h2":
            return (
              <h2
                key={i}
                id={b.id}
                className="mt-12 scroll-mt-28 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink first:mt-0 sm:text-3xl"
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-8 font-display text-xl font-bold text-ink">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="mt-4">
                {b.text}
              </p>
            );
          case "liste": {
            const Tag = b.nummeriert ? "ol" : "ul";
            return (
              <Tag key={i} className="mt-4 grid gap-2.5">
                {b.punkte.map((p, j) => (
                  <li key={j} className="flex gap-3">
                    {b.nummeriert ? (
                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-ink font-display text-xs font-bold text-white">
                        {j + 1}
                      </span>
                    ) : (
                      <span className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
                    )}
                    <span>{p}</span>
                  </li>
                ))}
              </Tag>
            );
          }
          case "hinweis":
            return (
              <aside
                key={i}
                className={`mt-6 rounded-lg p-5 ${b.ton === "achtung" ? "bg-signal-soft" : "bg-sky-soft"}`}
              >
                {b.titel && (
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Icon name={b.ton === "achtung" ? "bell" : "spark"} className="size-4" />
                    {b.titel}
                  </p>
                )}
                <p className={b.titel ? "mt-1.5" : ""}>{b.text}</p>
              </aside>
            );
          case "beispiel":
            return (
              <figure key={i} className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
                <figcaption className="flex items-center gap-2 border-b border-line bg-sand px-5 py-3 font-display font-bold text-ink">
                  <Icon name="calculator" className="size-4 text-signal-dark" />
                  {b.titel}
                </figcaption>
                <div className="p-5">
                  {b.text && <p className="text-[0.95rem] text-muted">{b.text}</p>}
                  {b.zeilen && (
                    <table className="mt-3 w-full text-[0.95rem]">
                      <tbody>
                        {b.zeilen.map((z, j) => (
                          <tr key={j} className={z.summe ? "border-t border-ink/20 font-semibold text-ink" : ""}>
                            <td className="py-1.5 pr-4">{z.label}</td>
                            <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{z.wert}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {b.fazit && <p className="mt-4 rounded-md bg-moss-soft px-4 py-3 text-[0.95rem] text-ink">{b.fazit}</p>}
                </div>
              </figure>
            );
          case "tabelle":
            return (
              <div key={i} className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
                <table className="w-full min-w-[36rem] text-left text-[0.95rem]">
                  <thead className="bg-sand text-ink">
                    <tr>
                      {b.kopf.map((k) => (
                        <th key={k} scope="col" className="px-4 py-3 font-semibold">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {b.zeilen.map((z, j) => (
                      <tr key={j} className="align-top">
                        {z.map((c, k) => (
                          <td key={k} className={`px-4 py-3 ${k === 0 ? "whitespace-nowrap font-semibold text-ink" : ""}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
