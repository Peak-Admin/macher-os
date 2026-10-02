import Link from "next/link";
import { Icon } from "@/components/ui";
import { webinarHref, webinarStatusLabel, type Webinar } from "@/content/wissen/webinare";

export function WebinarStatusLabel({ status }: { status: Webinar["status"] }) {
  const ton = status === "aufzeichnung" ? "bg-moss-soft text-moss" : "bg-signal-soft text-signal-dark";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${ton}`}>
      <Icon name={status === "aufzeichnung" ? "play" : "calendar"} className="size-3.5" />
      {webinarStatusLabel[status]}
    </span>
  );
}

export function WebinarKarte({ webinar }: { webinar: Webinar }) {
  return (
    <Link
      href={webinarHref(webinar.slug)}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <WebinarStatusLabel status={webinar.status} />
        <span className="text-xs font-medium text-muted">ca. {webinar.dauer} Min.</span>
      </div>
      <h3 className="mt-3 font-display text-xl font-bold leading-snug text-balance group-hover:text-signal-dark">
        {webinar.titel}
      </h3>
      <p className="mt-2 leading-relaxed text-muted">{webinar.kurz}</p>
      <p className="mt-auto flex items-center gap-2 pt-5 text-sm">
        <Icon name="mic" className="size-4 text-muted" />
        <span className="text-muted">Mit dem {webinar.sprecher}</span>
      </p>
    </Link>
  );
}
