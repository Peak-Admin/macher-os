-- Paket Aktivierung: eindeutiges Anfrage-Postfach je Betrieb (anfragen@<postfach>.macher-os.de).
-- Setzt die Fundament-Migration (Tabelle public.betriebe) voraus. Mehrfach ausführbar.

create or replace function public.postfach_slug(name text) returns text
language sql immutable as $$
  select coalesce(nullif(
    left(trim(both '-' from regexp_replace(
      regexp_replace(
        replace(replace(replace(replace(lower(coalesce(name, '')), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
        '\m(gmbh|co|kg|ug|ag|ohg|gbr|ek|e k|haftungsbeschraenkt|inh)\M', ' ', 'g'),
      '[^a-z0-9]+', '-', 'g')), 40), ''), 'betrieb');
$$;

alter table public.betriebe add column if not exists postfach text;
create unique index if not exists betriebe_postfach_eindeutig on public.betriebe (postfach);

-- Postfach beim Anlegen vergeben; bei Namensgleichheit mit einem anderen Betrieb ein Kürzel der ID anhängen
create or replace function public.postfach_vergeben() returns trigger
language plpgsql as $$
declare
  basis text := public.postfach_slug(new.name);
begin
  if new.postfach is null or new.postfach = '' then
    new.postfach := basis;
    if exists (select 1 from public.betriebe b where b.postfach = new.postfach and b.id <> new.id) then
      new.postfach := basis || '-' || left(replace(new.id::text, '-', ''), 6);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists betriebe_postfach on public.betriebe;
create trigger betriebe_postfach before insert or update of name on public.betriebe
  for each row when (new.postfach is null or new.postfach = '') execute function public.postfach_vergeben();

-- Bestand nachziehen
update public.betriebe set postfach = null where postfach = '';
update public.betriebe set name = name where postfach is null;

-- Mitglieder dürfen ihr Postfach lesen (RLS der Tabelle gilt), aber nicht ändern
revoke update (postfach) on public.betriebe from authenticated;
