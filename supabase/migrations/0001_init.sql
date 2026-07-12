-- Amabili Storie — schema iniziale.
--
-- Tre tabelle: i merchant (brands), le storie generate, i lead raccolti.
-- Il campo che regge il modello di business è brands.prompt_guida: è il filo
-- comune che ogni storia di quell'ente deve seguire (es. il soggiorno in hotel).

create extension if not exists "pgcrypto";

-- ─── Merchant / edizioni white-label ────────────────────────────────────────
create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9_-]+$'),
  nome          text not null,
  attivo        boolean not null default true,

  -- I tre colori del brand. Il sito li legge come custom property CSS.
  tema          jsonb not null default
                '{"accento":"#e96d4f","accentoSoft":"#f6b27c","scuro":"#43302a"}'::jsonb,
  logo_url      text,

  -- Copy dell'hero: occhiello, titolo, titoloAccento, sottotitolo, cta.
  hero          jsonb not null default '{}'::jsonb,

  -- Il filo comune delle storie dell'ente: finisce nel system prompt.
  prompt_guida  text,

  -- Sottoinsieme di capricci offerto. NULL = tutti.
  capricci      text[],

  -- Un ente che regala le storie agli ospiti non mostra il listino.
  mostra_prezzi boolean not null default true,

  creato_il     timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);

-- ─── Chi può entrare nel backoffice ─────────────────────────────────────────
-- Un utente Supabase Auth diventa amministratore solo se è elencato qui.
create table public.amministratori (
  utente_id uuid primary key references auth.users (id) on delete cascade,
  email     text not null,
  creato_il timestamptz not null default now()
);

create or replace function public.e_amministratore()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.amministratori where utente_id = auth.uid()
  );
$$;

-- ─── Storie generate ────────────────────────────────────────────────────────
create table public.storie (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid references public.brands (id) on delete set null,

  -- I parametri scelti nel wizard, così una storia è riproducibile.
  parametri  jsonb not null,
  -- Il libro: titolo, pagine, fraseAncora, guidaGenitori.
  contenuto  jsonb not null,
  -- "ai" quando l'ha scritta il modello, "fallback" quando è da template.
  fonte      text not null default 'ai' check (fonte in ('ai', 'fallback')),

  email      text,
  creato_il  timestamptz not null default now()
);

create index storie_brand_idx on public.storie (brand_id, creato_il desc);

-- ─── Lead raccolti in anteprima ─────────────────────────────────────────────
create table public.lead (
  id        uuid primary key default gen_random_uuid(),
  email     text not null,
  brand_id  uuid references public.brands (id) on delete set null,
  storia_id uuid references public.storie (id) on delete set null,
  creato_il timestamptz not null default now(),
  unique (email, brand_id)
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.brands         enable row level security;
alter table public.amministratori enable row level security;
alter table public.storie         enable row level security;
alter table public.lead           enable row level security;

-- Il sito pubblico legge i brand attivi per applicare tema e prompt guida.
create policy "brand attivi leggibili da tutti"
  on public.brands for select
  using (attivo = true);

-- Il backoffice vede e modifica tutto, anche i brand disattivati.
create policy "amministratori leggono tutti i brand"
  on public.brands for select
  to authenticated
  using (public.e_amministratore());

create policy "amministratori scrivono i brand"
  on public.brands for all
  to authenticated
  using (public.e_amministratore())
  with check (public.e_amministratore());

create policy "amministratori leggono se stessi"
  on public.amministratori for select
  to authenticated
  using (utente_id = auth.uid());

-- Storie e lead li scrive il server con la service role, che salta le RLS.
-- Nessuna policy = nessun accesso dal browser: i dati dei bambini non escono.
create policy "amministratori leggono le storie"
  on public.storie for select
  to authenticated
  using (public.e_amministratore());

create policy "amministratori leggono i lead"
  on public.lead for select
  to authenticated
  using (public.e_amministratore());

-- ─── aggiornato_il automatico ───────────────────────────────────────────────
create or replace function public.tocca_aggiornato_il()
returns trigger
language plpgsql
as $$
begin
  new.aggiornato_il = now();
  return new;
end;
$$;

create trigger brands_aggiornato_il
  before update on public.brands
  for each row execute function public.tocca_aggiornato_il();
