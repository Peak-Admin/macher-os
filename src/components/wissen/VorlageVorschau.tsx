import type { Vorlage, VorlageBlock } from "@/content/wissen/vorlagen";

function Linie({ label }: { label: string }) {
  return (
    <div className="flex min-w-0 items-end gap-2">
      <span className="shrink-0 text-xs font-semibold text-muted print:text-[9pt]">{label}:</span>
      <span className="h-6 flex-1 border-b border-ink/40" />
    </div>
  );
}

function Kasten() {
  return <span className="inline-block size-4 shrink-0 rounded-[3px] border-[1.5px] border-ink/60" aria-hidden />;
}

function Block({ block }: { block: VorlageBlock }) {
  switch (block.typ) {
    case "felder":
      return (
        <div className="vorlage-block">
          {block.titel && <h3 className="mb-2 text-sm font-bold font-tagline uppercase tracking-wider">{block.titel}</h3>}
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
            {block.felder.map((f) => (
              <Linie key={f} label={f} />
            ))}
          </div>
        </div>
      );
    case "checkliste":
      return (
        <div className="vorlage-block">
          <h3 className="mb-2 text-sm font-bold font-tagline uppercase tracking-wider">{block.titel}</h3>
          <table className="w-full border-collapse text-sm print:text-[10pt]">
            {block.bewertung && (
              <thead>
                <tr className="text-[11px] font-semibold text-muted">
                  <th className="py-1 text-left font-semibold">Prüfpunkt</th>
                  <th className="w-12 py-1 text-center font-semibold">i. O.</th>
                  <th className="w-12 py-1 text-center font-semibold">n. i. O.</th>
                  <th className="w-12 py-1 text-center font-semibold">entf.</th>
                </tr>
              </thead>
            )}
            <tbody>
              {block.punkte.map((p) => (
                <tr key={p} className="border-t border-line">
                  {block.bewertung ? (
                    <>
                      <td className="py-1.5 pr-2">{p}</td>
                      {[0, 1, 2].map((k) => (
                        <td key={k} className="py-1.5 text-center">
                          <Kasten />
                        </td>
                      ))}
                    </>
                  ) : (
                    <td className="py-1.5">
                      <span className="flex items-start gap-2.5">
                        <span className="mt-0.5">
                          <Kasten />
                        </span>
                        {p}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tabelle": {
      const vorbelegt = block.vorbelegt ?? [];
      const leer = Array.from({ length: block.zeilen });
      return (
        <div className="vorlage-block">
          {block.titel && <h3 className="mb-2 text-sm font-bold font-tagline uppercase tracking-wider">{block.titel}</h3>}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[34rem] table-fixed border-collapse text-sm print:min-w-0 print:text-[9pt]">
              {block.breiten && (
                <colgroup>
                  {block.breiten.map((b, i) => (
                    <col key={i} style={b === "auto" ? undefined : { width: b }} />
                  ))}
                </colgroup>
              )}
              <thead>
                <tr>
                  {block.spalten.map((s, i) => (
                    <th key={i} className="border border-ink/40 bg-sand px-2 py-1.5 text-left text-xs font-semibold">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vorbelegt.map((v) => (
                  <tr key={v}>
                    <td className="border border-ink/40 px-2 py-1.5 text-xs">{v}</td>
                    {block.spalten.slice(1).map((_, i) => (
                      <td key={i} className="border border-ink/40 px-2 py-1.5" />
                    ))}
                  </tr>
                ))}
                {leer.map((_, r) => (
                  <tr key={`leer-${r}`}>
                    {block.spalten.map((_, i) => (
                      <td key={i} className="h-8 border border-ink/40 px-2" />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    case "freitext":
      return (
        <div className="vorlage-block">
          <h3 className="text-sm font-bold font-tagline uppercase tracking-wider">{block.titel}</h3>
          {block.hinweis && <p className="mt-0.5 text-xs text-muted">{block.hinweis}</p>}
          <div className="mt-1">
            {Array.from({ length: block.linien }).map((_, i) => (
              <div key={i} className="h-7 border-b border-ink/30" />
            ))}
          </div>
        </div>
      );
    case "auswahl":
      return (
        <div className="vorlage-block">
          <h3 className="mb-2 text-sm font-bold font-tagline uppercase tracking-wider">{block.titel}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {block.optionen.map((o) => (
              <span key={o} className="inline-flex items-center gap-2">
                <Kasten /> {o}
              </span>
            ))}
          </div>
        </div>
      );
    case "hinweis":
      return <p className="vorlage-block rounded-md bg-sand px-3 py-2 text-xs leading-relaxed text-ink-soft">{block.text}</p>;
    case "unterschriften":
      return (
        <div className="vorlage-block grid gap-8 pt-6 sm:grid-cols-2 print:grid-cols-2">
          {block.felder.map((f) => (
            <div key={f}>
              <div className="h-10 border-b border-ink/60" />
              <p className="mt-1 text-xs text-muted">Ort, Datum, Unterschrift {f}</p>
            </div>
          ))}
        </div>
      );
  }
}

/** Druckbare Vorschau einer Vorlage im Stil eines A4-Blatts. */
export function VorlageVorschau({ vorlage }: { vorlage: Vorlage }) {
  return (
    <article
      id="druckbereich"
      aria-label={`Vorschau: ${vorlage.titel}`}
      className="mx-auto max-w-[52rem] print:max-w-none rounded-lg border border-line bg-white p-6 text-ink shadow-xl shadow-ink/5 sm:p-10"
    >
      <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4 sm:gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">{vorlage.art}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight break-words hyphens-auto sm:text-3xl">{vorlage.titel}</h2>
        </div>
        <div className="w-24 shrink-0 text-right text-xs text-muted sm:w-40">
          <div className="h-10 rounded-md border border-dashed border-line print:border-ink/30" />
          <p className="mt-1">Firmenstempel / Logo</p>
        </div>
      </header>
      <div className="mt-6 grid grid-cols-1 gap-7">
        {vorlage.inhalt.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
      <footer className="mt-8 border-t border-line pt-3 text-[10px] text-muted">
        Vorlage von Handwerk OS · macher-os.de/wissen/vorlagen · Ohne Gewähr, bitte an deinen Betrieb anpassen.
      </footer>
    </article>
  );
}
