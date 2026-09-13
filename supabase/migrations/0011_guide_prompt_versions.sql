-- ASD-8 (AS-28): the guide prompt is versioned, and every story knows which
-- version wrote it.
--
-- A guide prompt is no longer one line of context: it can be a 250-line
-- editorial canon uploaded as .md. When it changes, a story already delivered
-- must stay traceable to the canon that wrote it — so a version is recorded on
-- the story, not only on the brand.
--
-- The versioning lives in a trigger, not in the Server Action: whoever writes
-- `brands.guide_prompt` (the backoffice, Studio, seed.sql) produces a version.
-- Versions are immutable and never deleted: deleting a brand leaves them there,
-- with brand_id null, still pointed at by its stories.
--
-- Apply with the CLI: npx supabase db push. Never from the dashboard.

create table public.guide_prompt_versions (
  id         uuid primary key default gen_random_uuid(),
  -- Deferred: the trigger writes the version BEFORE INSERT on brands, when the
  -- brand row does not exist yet. The check runs at commit, when it does.
  brand_id   uuid references public.brands (id) on delete set null
             deferrable initially deferred,
  version    integer not null check (version > 0),
  content    text not null,
  created_at timestamptz not null default now(),
  unique (brand_id, version)
);

alter table public.brands
  add column guide_prompt_version_id uuid
  references public.guide_prompt_versions (id) on delete set null;

alter table public.stories
  add column guide_prompt_version_id uuid
  references public.guide_prompt_versions (id) on delete set null;

comment on column public.stories.guide_prompt_version_id is
  'The guide prompt version the story was generated with. null = no guide prompt, '
  'or a story generated before migration 0011.';

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Only the backoffice reads them. The trigger writes them (security definer):
-- no write policy, nobody writes them from the browser.
alter table public.guide_prompt_versions enable row level security;

create policy "admins read guide prompt versions"
  on public.guide_prompt_versions for select
  to authenticated
  using (public.is_admin());

-- ─── The brands that already have a guide prompt: it is their version 1 ─────
with created as (
  insert into public.guide_prompt_versions (brand_id, version, content)
  select id, 1, guide_prompt from public.brands where guide_prompt is not null
  returning id, brand_id
)
update public.brands b
   set guide_prompt_version_id = created.id
  from created
 where b.id = created.brand_id;

-- ─── Every new guide prompt is a new version ────────────────────────────────
create function public.version_guide_prompt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.guide_prompt is not distinct from old.guide_prompt then
    return new;
  end if;

  if new.guide_prompt is null then
    new.guide_prompt_version_id := null;
    return new;
  end if;

  insert into public.guide_prompt_versions (brand_id, version, content)
  values (
    new.id,
    coalesce((select max(version) from public.guide_prompt_versions where brand_id = new.id), 0) + 1,
    new.guide_prompt
  )
  returning id into new.guide_prompt_version_id;

  return new;
end;
$$;

create trigger brands_version_guide_prompt
  before insert or update of guide_prompt on public.brands
  for each row execute function public.version_guide_prompt();
