-- Macher OS – Fundament
-- Mandant (Betrieb) → Mitglieder → alle Objekte als eine Zeile je Objekt.
-- Region: Frankfurt (eu-central-1). Zeilen sind nur für Mitglieder des eigenen Betriebs sichtbar (RLS).
-- Server-Funktionen (os/api/**) arbeiten mit dem Service-Role-Schlüssel und umgehen RLS bewusst.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ Mandant

create table if not exists public.betriebe (
  id uuid primary key default gen_random_uuid(),
  name text,
  erstellt_am timestamptz not null default now(),
  plan text default 'test',
  test_bis date,
  stripe_kunde text
);

create table if not exists public.mitglieder (
  betrieb_id uuid not null references public.betriebe on delete cascade,
  nutzer_id uuid not null,
  mitarbeiter_id text,
  rolle text not null default 'monteur',
  erstellt_am timestamptz not null default now(),
  primary key (betrieb_id, nutzer_id)
);
create index if not exists mitglieder_nutzer on public.mitglieder (nutzer_id);

-- ------------------------------------------------------------------ Objekte (eine Zeile je Objekt)

create table if not exists public.objekte (
  betrieb_id uuid not null references public.betriebe on delete cascade,
  sammlung text not null,
  id text not null,
  daten jsonb,
  -- Serverzeit der letzten Speicherung (für den Abgleich „alles seit …“), wird per Trigger gesetzt
  geaendert_am timestamptz not null default now(),
  -- gesetzt = im Papierkorb (daten.geloeschtAm) oder endgültig entfernt (daten = null)
  geloescht_am timestamptz,
  primary key (betrieb_id, sammlung, id)
);
create index if not exists objekte_stand on public.objekte (betrieb_id, geaendert_am);

-- ------------------------------------------------------------------ Öffentliche Links, Push, Messung

create table if not exists public.oeffentliche_links (
  token text primary key,
  betrieb_id uuid not null references public.betriebe on delete cascade,
  art text not null,
  bezug jsonb,
  gueltig_bis timestamptz
);

create table if not exists public.push_abos (
  nutzer_id uuid not null,
  betrieb_id uuid references public.betriebe on delete cascade,
  abo jsonb not null,
  geraet text,
  erstellt_am timestamptz not null default now(),
  primary key (nutzer_id, abo)
);

create table if not exists public.messpunkte (
  betrieb_id uuid,
  ereignis text not null,
  zeit timestamptz not null default now(),
  daten jsonb
);
create index if not exists messpunkte_ereignis on public.messpunkte (ereignis, zeit);

-- ------------------------------------------------------------------ Einladungen und Versand (Fundament)

create table if not exists public.einladungen (
  token text primary key,
  betrieb_id uuid not null references public.betriebe on delete cascade,
  mitarbeiter_id text,
  rolle text not null default 'monteur',
  ziel text,
  eingeladen_von uuid,
  erstellt_am timestamptz not null default now(),
  gueltig_bis timestamptz not null default now() + interval '14 days',
  angenommen_am timestamptz,
  angenommen_von uuid
);

create table if not exists public.versand (
  id text primary key,
  betrieb_id uuid not null references public.betriebe on delete cascade,
  kanal text not null,
  an text,
  bezug jsonb,
  ziel_link text,
  status text not null default 'gesendet',
  anbieter_id text,
  erstellt_am timestamptz not null default now(),
  geoeffnet_am timestamptz
);
create index if not exists versand_betrieb on public.versand (betrieb_id, erstellt_am);

-- ------------------------------------------------------------------ Hilfsfunktionen für RLS

create or replace function public.ist_mitglied(b uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mitglieder m where m.betrieb_id = b and m.nutzer_id = auth.uid());
$$;

create or replace function public.hat_rolle(b uuid, rollen text[]) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mitglieder m where m.betrieb_id = b and m.nutzer_id = auth.uid() and m.rolle = any (rollen));
$$;

-- ------------------------------------------------------------------ Letzte Änderung gewinnt (Schutz auf dem Server)

create or replace function public.objekte_vor_schreiben() returns trigger
  language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and new.daten is not null and old.daten is not null
     and coalesce(new.daten->>'geaendertAm', '') < coalesce(old.daten->>'geaendertAm', '') then
    -- ältere Fassung kommt zu spät an (z. B. von einem Gerät, das offline war) → verwerfen
    return null;
  end if;
  new.geaendert_am := now();
  return new;
end;
$$;

drop trigger if exists objekte_vor_schreiben on public.objekte;
create trigger objekte_vor_schreiben before insert or update on public.objekte
  for each row execute function public.objekte_vor_schreiben();

-- ------------------------------------------------------------------ Betrieb anlegen, Einladung annehmen

-- Legt für den angemeldeten Nutzer einen Betrieb an und macht ihn zum Chef.
-- Ist er schon Mitglied eines Betriebs, wird dieser zurückgegeben (kein zweiter Mandant aus Versehen).
create or replace function public.betrieb_anlegen(p_name text, p_mitarbeiter_id text default null)
  returns uuid language plpgsql security definer set search_path = public as $$
declare
  nutzer uuid := auth.uid();
  b uuid;
begin
  if nutzer is null then
    raise exception 'nicht angemeldet' using errcode = '28000';
  end if;
  select m.betrieb_id into b from public.mitglieder m where m.nutzer_id = nutzer order by m.erstellt_am limit 1;
  if b is not null then
    return b;
  end if;
  insert into public.betriebe (name, test_bis) values (coalesce(nullif(trim(p_name), ''), 'Mein Betrieb'), current_date + 30)
    returning id into b;
  insert into public.mitglieder (betrieb_id, nutzer_id, mitarbeiter_id, rolle) values (b, nutzer, p_mitarbeiter_id, 'chef');
  return b;
end;
$$;

create or replace function public.einladung_annehmen(p_token text)
  returns table (betrieb_id uuid, mitarbeiter_id text, rolle text)
  language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  nutzer uuid := auth.uid();
  e public.einladungen;
begin
  if nutzer is null then
    raise exception 'nicht angemeldet' using errcode = '28000';
  end if;
  select * into e from public.einladungen x where x.token = p_token for update;
  if not found or e.gueltig_bis < now() then
    raise exception 'Einladung ungültig oder abgelaufen' using errcode = 'P0002';
  end if;
  if e.angenommen_am is not null and e.angenommen_von is distinct from nutzer then
    raise exception 'Einladung wurde schon angenommen' using errcode = 'P0002';
  end if;
  insert into public.mitglieder as m (betrieb_id, nutzer_id, mitarbeiter_id, rolle)
    values (e.betrieb_id, nutzer, e.mitarbeiter_id, e.rolle)
    on conflict (betrieb_id, nutzer_id) do update set mitarbeiter_id = excluded.mitarbeiter_id, rolle = excluded.rolle;
  update public.einladungen x set angenommen_am = now(), angenommen_von = nutzer where x.token = p_token;
  return query select e.betrieb_id, e.mitarbeiter_id, e.rolle;
end;
$$;

revoke all on function public.betrieb_anlegen(text, text) from public, anon;
revoke all on function public.einladung_annehmen(text) from public, anon;
grant execute on function public.betrieb_anlegen(text, text) to authenticated;
grant execute on function public.einladung_annehmen(text) to authenticated;
grant execute on function public.ist_mitglied(uuid) to authenticated;
grant execute on function public.hat_rolle(uuid, text[]) to authenticated;

-- ------------------------------------------------------------------ Row Level Security

alter table public.betriebe enable row level security;
alter table public.mitglieder enable row level security;
alter table public.objekte enable row level security;
alter table public.oeffentliche_links enable row level security;
alter table public.push_abos enable row level security;
alter table public.messpunkte enable row level security;
alter table public.einladungen enable row level security;
alter table public.versand enable row level security;

-- Betrieb: lesen alle Mitglieder, ändern nur der Chef (Plan/Stripe ändert nur der Server)
create policy betriebe_lesen on public.betriebe for select to authenticated using (public.ist_mitglied(id));
create policy betriebe_aendern on public.betriebe for update to authenticated
  using (public.hat_rolle(id, array['chef'])) with check (public.hat_rolle(id, array['chef']));
revoke update on public.betriebe from authenticated;
grant update (name) on public.betriebe to authenticated;

-- Mitglieder: das Team sehen; Rollen ändern/entfernen darf der Chef. Anlegen nur über die Funktionen oben.
create policy mitglieder_lesen on public.mitglieder for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy mitglieder_aendern on public.mitglieder for update to authenticated
  using (public.hat_rolle(betrieb_id, array['chef'])) with check (public.hat_rolle(betrieb_id, array['chef']));
create policy mitglieder_entfernen on public.mitglieder for delete to authenticated
  using (public.hat_rolle(betrieb_id, array['chef']) or nutzer_id = auth.uid());

-- Objekte: alle Mitglieder lesen und schreiben (Rechte je Rolle prüft die App; Geld-Sperren folgen)
create policy objekte_lesen on public.objekte for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy objekte_anlegen on public.objekte for insert to authenticated with check (public.ist_mitglied(betrieb_id));
create policy objekte_aendern on public.objekte for update to authenticated
  using (public.ist_mitglied(betrieb_id)) with check (public.ist_mitglied(betrieb_id));
-- kein DELETE: Löschen ist ein Grabstein (geloescht_am), nie ein Datenverlust

-- Öffentliche Links: Mitglieder legen an und sehen; Kunden lesen nur über die Server-Funktion
create policy links_lesen on public.oeffentliche_links for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy links_anlegen on public.oeffentliche_links for insert to authenticated with check (public.ist_mitglied(betrieb_id));
create policy links_aendern on public.oeffentliche_links for update to authenticated
  using (public.ist_mitglied(betrieb_id)) with check (public.ist_mitglied(betrieb_id));
create policy links_entfernen on public.oeffentliche_links for delete to authenticated using (public.ist_mitglied(betrieb_id));

-- Push-Abos: jeder nur seine eigenen Geräte
create policy push_eigene on public.push_abos for all to authenticated
  using (nutzer_id = auth.uid()) with check (nutzer_id = auth.uid() and (betrieb_id is null or public.ist_mitglied(betrieb_id)));

-- Messpunkte: Mitglieder dürfen für ihren Betrieb schreiben; Auswertung nur über den Server
create policy messpunkte_schreiben on public.messpunkte for insert to authenticated with check (public.ist_mitglied(betrieb_id));

-- Einladungen und Versand: lesen für Mitglieder; schreiben nur der Server
create policy einladungen_lesen on public.einladungen for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy versand_lesen on public.versand for select to authenticated using (public.ist_mitglied(betrieb_id));

-- anonyme Besucher sehen nichts direkt
revoke all on public.betriebe, public.mitglieder, public.objekte, public.oeffentliche_links, public.push_abos,
  public.messpunkte, public.einladungen, public.versand from anon;

-- ------------------------------------------------------------------ Realtime

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.objekte;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;

-- ------------------------------------------------------------------ Storage: Dateien (Fotos, PDFs, Unterschriften)
-- Pfad: <betrieb_id>/<zufällige id>-<name>. Lesen über die (nicht erratbare) öffentliche URL,
-- hochladen/ändern/löschen nur Mitglieder im Ordner ihres Betriebs. Auflisten ist nicht erlaubt.

insert into storage.buckets (id, name, public, file_size_limit)
  values ('dateien', 'dateien', true, 52428800)
  on conflict (id) do nothing;

create policy dateien_hochladen on storage.objects for insert to authenticated
  with check (bucket_id = 'dateien' and (storage.foldername(name))[1] in
    (select m.betrieb_id::text from public.mitglieder m where m.nutzer_id = auth.uid()));
create policy dateien_aendern on storage.objects for update to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] in
    (select m.betrieb_id::text from public.mitglieder m where m.nutzer_id = auth.uid()));
create policy dateien_loeschen on storage.objects for delete to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] in
    (select m.betrieb_id::text from public.mitglieder m where m.nutzer_id = auth.uid()));
