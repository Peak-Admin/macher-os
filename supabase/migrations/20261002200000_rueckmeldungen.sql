-- Rückmeldungen aus der App an das Macher-Team (`/api/cloud/rueckmeldung`).
-- Schreiben und Lesen nur über die Service-Role: Betriebe sehen fremde Rückmeldungen nie.

create table if not exists public.rueckmeldungen (
  id text primary key,
  erstellt_am timestamptz not null default now(),
  art text not null check (art in ('problem', 'idee', 'lob')),
  text text not null check (char_length(text) between 1 and 4000),
  seite text,
  breite integer,
  geraet text,
  betrieb_id uuid references public.betriebe on delete set null,
  nutzer_id uuid,
  rolle text,
  erledigt_am timestamptz
);
create index if not exists rueckmeldungen_zeit on public.rueckmeldungen (erstellt_am desc);

alter table public.rueckmeldungen enable row level security;
-- bewusst keine Policies; zusätzlich kein Tabellenrecht für anon/authenticated
revoke all on public.rueckmeldungen from anon, authenticated;
