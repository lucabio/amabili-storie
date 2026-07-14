-- Il sito principale diventa un brand, e i pagamenti diventano opzionali.
--
-- Tre cose:
--   1. brands.accetta_pagamenti: un ente può regalare le storie (l'hotel) invece
--      di venderle. È diverso da mostra_prezzi, che nasconde solo il listino in
--      vetrina ma lascia comunque un checkout a pagamento.
--   2. Il sito principale (amabilistorie.com, senza ?version=) smette di essere
--      la costante BRAND_DEFAULT in src/lib/brand/schema.js e diventa una riga
--      come le altre, modificabile dal backoffice. BRAND_DEFAULT resta nel
--      codice come rete di sicurezza per quando Supabase non è configurato.
--   3. ordini.prezzo_cents ammette lo zero: un libro regalato costa zero.

-- ─── 1. accetta_pagamenti ────────────────────────────────────────────────────
alter table public.brands
  add column accetta_pagamenti boolean not null default true;

comment on column public.brands.accetta_pagamenti is
  'false = l''ente regala le storie: niente checkout, niente prezzi. '
  'Diverso da mostra_prezzi, che nasconde solo il listino in vetrina.';

-- ─── 2. Il sito principale diventa una riga ─────────────────────────────────
-- Copy dell'hero e tema identici a BRAND_DEFAULT (src/lib/brand/schema.js):
-- questa riga deve produrre esattamente la home che si vede oggi.
insert into public.brands
  (slug, nome, tema, hero, prompt_guida, capricci, mostra_prezzi, accetta_pagamenti)
values (
  'amabili',
  'Amabili Storie',
  '{"accento":"#e96d4f","accentoSoft":"#f6b27c","scuro":"#43302a"}'::jsonb,
  jsonb_build_object(
    'occhiello', 'Amabili Storie',
    'titolo', 'Il libro personalizzato che risolve',
    'titoloAccento', 'il capriccio di stasera',
    'sottotitolo', 'Tuo figlio diventa il protagonista di una storia illustrata, creata in pochi minuti, che lo aiuta davvero: dormire da solo, salutare il pannolino, accogliere il fratellino…',
    'cta', 'Crea la storia gratis'
  ),
  null,
  null,
  true,
  true
)
on conflict (slug) do nothing;

-- ─── 3. Un libro regalato costa zero ─────────────────────────────────────────
-- Stesso errore da non ripetere della 0004: il vincolo vecchio (> 0) è ancora
-- attivo mentre si scrive, quindi prima si droppa, poi si aggiornano i dati
-- (qui non ce ne sono da aggiornare: nessun ordine gratuito esiste ancora),
-- poi si rimette con la soglia nuova.
alter table public.ordini
  drop constraint ordini_prezzo_cents_check;

alter table public.ordini
  add constraint ordini_prezzo_cents_check check (prezzo_cents >= 0);
