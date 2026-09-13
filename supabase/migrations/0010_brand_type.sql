-- ASD-7 (AS-22): a merchant is either a whim merchant or a story merchant.
--
-- 'whim'  = the parent picks a whim from the catalogue, and the plot is that
--           whim's narrative arc. Every brand until today.
-- 'story' = the plot is always the same and lives in guide_prompt: the parent
--           only customises the characters, plus when they stayed and what the
--           child liked the most.
--
-- The default makes every existing brand 'whim', so nothing changes for them.
-- The value is data, and like every other stored value the check knows it by
-- name.
--
-- Apply with the CLI: npx supabase db push. Never from the dashboard.

alter table public.brands
  add column type text not null default 'whim'
  constraint brands_type_check check (type in ('whim', 'story'));

comment on column public.brands.type is
  'whim = the parent picks a whim, the plot is its arc. '
  'story = the plot is always the same and comes from guide_prompt.';
