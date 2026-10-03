-- Partner-Schnittstelle (Action API v1) – erster Partner: HeyLotte.
--
-- HeyLotte versteht, Handwerk OS entscheidet und führt aus. HeyLotte bekommt nie den Service-Key und keinen
-- direkten Zugriff auf `objekte`: Sie ruft `/v1/actions/<aktion>` mit einem eigenen Schlüssel je Betrieb auf.
-- Die Server-Funktion prüft Schlüssel → Betrieb → Nutzer-Zuordnung → Rolle → Recht, führt aus, protokolliert
-- jeden Aufruf und meldet Ereignisse signiert an die Webhook-Adresse des Partners zurück.
--
-- Alle Tabellen schreibt nur der Server (Service-Role). Chef (und Büro beim Protokoll) dürfen lesen –
-- die geheimen Spalten (Schlüssel-Hash, Webhook-Geheimnis) nie.

-- ------------------------------------------------------------------ Zugänge (ein Schlüssel je Betrieb und Partner)

create table if not exists public.partner_zugaenge (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe on delete cascade,
  partner text not null default 'heylotte',
  name text not null default 'HeyLotte',
  -- Kennung des Betriebs beim Partner, z. B. `lotte_workspace_673`
  partner_workspace_id text,
  -- SHA-256 (hex) des API-Schlüssels; der Schlüssel selbst wird nirgends gespeichert
  schluessel_hash text not null unique,
  -- letzte vier Zeichen – zum Wiedererkennen
  schluessel_ende text,
  -- Ereignisse an den Partner (https); ohne Adresse werden keine Ereignisse gesendet
  webhook_url text,
  webhook_geheimnis text,
  -- API-Namen (`customer.created`), `*` = alle, `customer.*` = alle zu einem Objekt
  ereignisse text[] not null default array['*'],
  erstellt_am timestamptz not null default now(),
  zuletzt_genutzt_am timestamptz,
  -- gesetzt = Schlüssel gesperrt (Rotation: neuen Zugang anlegen, alten widerrufen)
  widerrufen_am timestamptz,
  unique (partner, partner_workspace_id)
);
create index if not exists partner_zugaenge_betrieb on public.partner_zugaenge (betrieb_id);

-- ------------------------------------------------------------------ Nutzer-Zuordnung (Partner-Nutzer → Mitarbeiter)

create table if not exists public.partner_nutzer (
  zugang_id uuid not null references public.partner_zugaenge on delete cascade,
  -- Kennung des Nutzers beim Partner, z. B. `lotte_user_928`
  partner_nutzer_id text not null,
  -- Mitarbeiter in Handwerk OS; die Rolle kommt aus `mitglieder` bzw. dem Mitarbeiter selbst
  mitarbeiter_id text not null,
  erstellt_am timestamptz not null default now(),
  primary key (zugang_id, partner_nutzer_id)
);

-- ------------------------------------------------------------------ Protokoll jedes Aufrufs (Audit + Idempotenz)

create table if not exists public.api_aufrufe (
  id text primary key,
  betrieb_id uuid not null references public.betriebe on delete cascade,
  zugang_id uuid references public.partner_zugaenge on delete set null,
  partner_nutzer_id text,
  mitarbeiter_id text,
  version text not null default 'v1',
  aktion text not null,
  idempotenz_schluessel text,
  -- HTTP-Status der Antwort; 0 = wird gerade ausgeführt
  status integer not null default 0,
  -- Antwort an den Partner – wird bei gleichem Idempotenz-Schlüssel wiederholt
  ergebnis jsonb,
  -- betroffenes Objekt `{ typ, id }`
  bezug jsonb,
  zeit timestamptz not null default now(),
  unique (zugang_id, idempotenz_schluessel)
);
create index if not exists api_aufrufe_betrieb on public.api_aufrufe (betrieb_id, zeit);

-- ------------------------------------------------------------------ Ereignisse an den Partner (Warteschlange)

create table if not exists public.partner_auslieferungen (
  id text primary key,
  zugang_id uuid not null references public.partner_zugaenge on delete cascade,
  betrieb_id uuid not null references public.betriebe on delete cascade,
  -- API-Name, z. B. `customer.created`
  typ text not null,
  nutzlast jsonb not null,
  status text not null default 'wartend' check (status in ('wartend', 'zugestellt', 'fehler', 'aufgegeben')),
  versuche integer not null default 0,
  naechster_versuch timestamptz default now(),
  antwort_code integer,
  letzter_fehler text,
  zugestellt_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists partner_auslieferungen_faellig on public.partner_auslieferungen (status, naechster_versuch);

-- ------------------------------------------------------------------ Row Level Security

alter table public.partner_zugaenge enable row level security;
alter table public.partner_nutzer enable row level security;
alter table public.api_aufrufe enable row level security;
alter table public.partner_auslieferungen enable row level security;

revoke all on public.partner_zugaenge, public.partner_nutzer, public.api_aufrufe, public.partner_auslieferungen from anon, authenticated;

-- Zugänge: der Chef sieht, welche Partner verbunden sind – ohne Schlüssel-Hash und Webhook-Geheimnis
grant select (id, betrieb_id, partner, name, partner_workspace_id, schluessel_ende, webhook_url, ereignisse, erstellt_am, zuletzt_genutzt_am, widerrufen_am)
  on public.partner_zugaenge to authenticated;
create policy partner_zugaenge_lesen on public.partner_zugaenge for select to authenticated
  using (public.hat_rolle(betrieb_id, array['chef']));

grant select on public.partner_nutzer to authenticated;
create policy partner_nutzer_lesen on public.partner_nutzer for select to authenticated
  using (exists (select 1 from public.partner_zugaenge z where z.id = zugang_id and public.hat_rolle(z.betrieb_id, array['chef'])));

-- Protokoll: Chef und Büro sehen, was über die Schnittstelle passiert ist
grant select on public.api_aufrufe to authenticated;
create policy api_aufrufe_lesen on public.api_aufrufe for select to authenticated
  using (public.hat_rolle(betrieb_id, array['chef', 'buero']));

-- Auslieferungen: nur der Server
