-- Partner-Schnittstelle, Ausbau: Ereignisse aus der App an HeyLotte, Begrenzung, Zustellung im Minutentakt.
--
-- 1. Ereignisse aus der App: Die App schreibt jedes fachliche Ereignis ins Ereignisprotokoll (Sammlung
--    `ereignisprotokoll`, API-Name in `daten.api`, z. B. `invoice.overdue`). Kommt so ein Eintrag beim Abgleich in
--    `objekte` an, merkt ein Trigger ihn für jeden passenden Partner-Zugang mit Webhook in `partner_auslieferungen` vor.
--    Doppelte Meldungen (mehrere Geräte, wiederholter Abgleich) verhindert `schluessel`.
-- 2. Begrenzung: `partner_aufrufe_seit` zählt die Aufrufe eines Zugangs (für 429 „zu viele Aufrufe“).
-- 3. Zustellung: pg_cron stößt jede Minute `/api/partner/zustellen` an (pg_net), wenn etwas fällig ist.
--    Adresse und Token stehen im Vault (`partner_app_url`, `partner_zustell_token`); ohne Adresse passiert nichts
--    und der tägliche Cron sowie der nächste Aufruf des Partners stellen zu.

-- ------------------------------------------------------------------ Auslieferungen: Schlüssel gegen Doppelte

alter table public.partner_auslieferungen add column if not exists schluessel text;
create unique index if not exists partner_auslieferungen_schluessel on public.partner_auslieferungen (zugang_id, schluessel);

-- ------------------------------------------------------------------ Begrenzung

create index if not exists api_aufrufe_zugang on public.api_aufrufe (zugang_id, zeit);

create or replace function public.partner_aufrufe_seit(p_zugang uuid, p_seit timestamptz)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.api_aufrufe where zugang_id = p_zugang and zeit >= p_seit;
$$;
revoke all on function public.partner_aufrufe_seit(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.partner_aufrufe_seit(uuid, timestamptz) to service_role;

-- ------------------------------------------------------------------ Ereignisse aus der App

-- Objekt klein halten: Werte über 2000 Zeichen (Fotos, lange Texte) weglassen
create or replace function public.partner_kleines_objekt(d jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(d) = 'object' then d else '{}'::jsonb end) e
  where length(e.value::text) <= 2000;
$$;

create or replace function public.partner_ereignis_aus_app()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d jsonb := new.daten;
  api text := new.daten->>'api';
  bezug jsonb := new.daten->'bezug';
  zeit timestamptz;
  schl text;
  objekt jsonb;
  felder jsonb;
  typ_name text;
  z record;
  evt text;
  nutzer text;
begin
  if d is null or api is null or api = '' then return null; end if;
  -- Beispieldaten, Abgleichs-Vermerke und Ereignisse, die die Schnittstelle selbst ausgelöst hat, nicht melden
  if coalesce(d->>'beispiel', 'false') = 'true' or d->>'quelle' = 'sync' or d ? 'geloeschtAm' then return null; end if;
  begin
    zeit := (d->>'zeit')::timestamptz;
  exception when others then
    return null;
  end;
  -- Nach langer Offline-Zeit nachgereichte Einträge sind keine Neuigkeit mehr
  if zeit is null or zeit < now() - interval '1 hour' then return null; end if;

  -- „Überfällig“ meldet jedes Gerät – einmal je Rechnung und Fälligkeit genügt
  schl := case when api = 'invoice.overdue'
    then api || ':' || coalesce(bezug->>'id', '') || ':' || coalesce(d->'daten'->>'faelligAm', '')
    else 'p:' || new.id end;

  if jsonb_typeof(bezug) = 'object' and bezug ? 'id' then
    select o.daten into objekt from public.objekte o
      where o.betrieb_id = new.betrieb_id and o.sammlung = bezug->>'typ' and o.id = bezug->>'id' and o.daten is not null;
  end if;
  felder := case when objekt is null then null else public.partner_kleines_objekt(objekt) end;
  typ_name := coalesce(
    jsonb_build_object('kunden', 'customer', 'aufgaben', 'task', 'auftraege', 'job', 'angebote', 'quote', 'rechnungen', 'invoice', 'termine', 'appointment')->>(bezug->>'typ'),
    bezug->>'typ');

  for z in
    select * from public.partner_zugaenge
    where betrieb_id = new.betrieb_id and widerrufen_am is null and webhook_url is not null and webhook_geheimnis is not null
      and erstellt_am <= zeit
  loop
    if not exists (select 1 from unnest(z.ereignisse) x where x = '*' or x = api or (x like '%.*' and starts_with(api, left(x, length(x) - 1)))) then
      continue;
    end if;
    evt := 'evt_' || gen_random_uuid();
    select n.partner_nutzer_id into nutzer from public.partner_nutzer n
      where n.zugang_id = z.id and n.mitarbeiter_id = d->>'mitarbeiterId' order by n.erstellt_am limit 1;
    insert into public.partner_auslieferungen (id, zugang_id, betrieb_id, typ, schluessel, nutzlast)
    values (evt, z.id, new.betrieb_id, api, schl, jsonb_strip_nulls(jsonb_build_object(
      'id', evt,
      'event', api,
      'created_at', to_char(zeit at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'organization_id', new.betrieb_id,
      'workspace_id', z.partner_workspace_id,
      -- in Handwerk OS ausgelöst (Mensch, Automation oder Fristprüfung) – nicht über den Partner
      'source', 'handwerk-os',
      'origin', d->>'quelle',
      'user_id', nutzer,
      'employee_id', d->>'mitarbeiterId',
      'object', case when typ_name is null then null else jsonb_build_object('type', typ_name, 'id', bezug->>'id') end,
      'data', case when felder is null then null else jsonb_strip_nulls(jsonb_build_object(
        'number', felder->>'nummer',
        'title', coalesce(felder->>'titel', felder->>'name'),
        'status', coalesce(felder->>'status', felder->>'phase'),
        'customer_id', felder->>'kundeId',
        'job_id', felder->>'auftragId',
        'due_date', coalesce(felder->>'faelligAm', felder->>'faellig'),
        'fields', felder)) end,
      'details', d->'daten')))
    on conflict (zugang_id, schluessel) do nothing;
  end loop;
  return null;
end $$;

drop trigger if exists partner_ereignis_aus_app on public.objekte;
create trigger partner_ereignis_aus_app after insert on public.objekte
  for each row when (new.sammlung = 'ereignisprotokoll')
  execute function public.partner_ereignis_aus_app();

-- ------------------------------------------------------------------ Zustellung im Minutentakt (Supabase: pg_cron + pg_net + Vault)

-- Prüft das Token, mit dem pg_cron die Zustellung anstößt (nur der Server darf fragen)
create or replace function public.partner_zustell_token_pruefen(p_token text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  t text;
begin
  if to_regclass('vault.decrypted_secrets') is null or p_token is null then return false; end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1' into t using 'partner_zustell_token';
  return t is not null and length(t) >= 32 and t = p_token;
end $$;
revoke all on function public.partner_zustell_token_pruefen(text) from public, anon, authenticated;
grant execute on function public.partner_zustell_token_pruefen(text) to service_role;

create or replace function public.partner_zustellung_anstossen()
returns void language plpgsql security definer set search_path = public as $$
declare
  adresse text;
  t text;
begin
  if not exists (select 1 from public.partner_auslieferungen where status in ('wartend', 'fehler') and naechster_versuch <= now()) then return; end if;
  if to_regclass('vault.decrypted_secrets') is null or to_regnamespace('net') is null then return; end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1' into adresse using 'partner_app_url';
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1' into t using 'partner_zustell_token';
  if adresse is null or t is null then return; end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 10000)'
    using rtrim(adresse, '/') || '/api/partner/zustellen', '{}'::jsonb,
          jsonb_build_object('authorization', 'Bearer ' || t, 'content-type', 'application/json');
end $$;
revoke all on function public.partner_zustellung_anstossen() from public, anon, authenticated;

-- Nur wo es die Erweiterungen gibt (Supabase); die lokale Prüf-Datenbank überspringt das
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
  -- dynamisch, weil es `vault` und `cron` lokal nicht gibt
  if to_regclass('vault.secrets') is not null then
    execute $q$
      select vault.create_secret(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
        'partner_zustell_token', 'Token, mit dem pg_cron /api/partner/zustellen anstößt')
      where not exists (select 1 from vault.secrets where name = 'partner_zustell_token')
    $q$;
  end if;
  if to_regnamespace('cron') is not null then
    execute $q$ select cron.schedule('partner-zustellung', '* * * * *', 'select public.partner_zustellung_anstossen()') $q$;
  end if;
end $$;
