-- Ordini e coda di approvazione.
--
-- Un ordine è una cosa diversa da una storia: ha un pagamento e domani avrà una
-- spedizione. Tenerli separati significa che l'arrivo di Stripe non tocca la coda.

create table public.ordini (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references public.brands (id) on delete set null,
  email        text not null,

  -- Quello che il wizard ha mandato: capriccio, nomi, tratti dei personaggi.
  parametri    jsonb not null,

  formato      text not null check (formato in ('ebook', 'cartaceo')),
  -- In centesimi. Il denaro non si tiene mai in virgola mobile.
  prezzo_cents integer not null check (prezzo_cents > 0),
  stato        text not null default 'pagato' check (stato in ('pagato', 'rimborsato')),

  -- true = nato dal checkout simulato. Il giorno del lancio:
  --   delete from public.ordini where finto;
  finto        boolean not null default false,

  creato_il    timestamptz not null default now()
);

create index ordini_brand_idx on public.ordini (brand_id, creato_il desc);

-- ─── La storia diventa una cosa che si rivede ───────────────────────────────
alter table public.storie
  add column ordine_id           uuid references public.ordini (id) on delete set null,
  add column stato               text not null default 'in_generazione'
                                 check (stato in ('in_generazione', 'in_revisione',
                                                 'approvata', 'rifiutata', 'fallita')),
  -- La versione uscita dall'AI, prima delle correzioni a mano. La differenza con
  -- `contenuto` è il diario di cosa correggiamo sempre — cioè cosa c'è da
  -- aggiustare nel prompt. Si scrive una volta e non si tocca più.
  add column contenuto_originale jsonb,
  add column revisionata_da      uuid references public.amministratori (utente_id) on delete set null,
  add column revisionata_il      timestamptz,
  add column note_revisione      text,
  add column errore              text,
  -- L'id della run del workflow, per ritrovarla nei log.
  add column run_id              text;

create index storie_coda_idx on public.storie (stato, creato_il);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Gli ordini li legge solo il backoffice. Scrive il server con la service role,
-- che le RLS le bypassa: dal browser qui non si arriva.
alter table public.ordini enable row level security;

create policy "amministratori leggono gli ordini"
  on public.ordini for select
  to authenticated
  using (public.e_amministratore());

-- `storie` ha già RLS e la policy di lettura per gli amministratori (0001).
