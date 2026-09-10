-- Sample data for local development.
--
-- "famiglia_serena" is the use case that drives the business model: a hotel that
-- gives its guests stories set during their stay.
-- Reachable at /?version=famiglia_serena
--
-- The slug, the copy and the guide prompt stay Italian: they are the product,
-- and the product speaks to Italian parents. Only the column and jsonb key names
-- are English (migration 0008).

insert into public.brands (slug, name, theme, hero, guide_prompt, whims, show_prices, accepts_payments)
values (
  'famiglia_serena',
  'Hotel Famiglia Serena',
  '{"accent":"#2e8b8b","accentSoft":"#7fc9c0","dark":"#1f3a3a"}'::jsonb,
  jsonb_build_object(
    'eyebrow', 'Hotel Famiglia Serena',
    'title', 'La storia della vostra vacanza, e del capriccio che',
    'titleAccent', 'avete superato insieme',
    'subtitle', 'Un libro illustrato che regaliamo ai nostri piccoli ospiti: il protagonista è vostro figlio, e la storia si svolge qui, in hotel.',
    'cta', 'Crea la storia — è un regalo nostro'
  ),
  'La storia si svolge durante il soggiorno della famiglia all''Hotel Famiglia Serena, un albergo di montagna in Val Gardena, caldo e accogliente. Nomina almeno una volta, in modo naturale e mai pubblicitario, un dettaglio della struttura: la colazione con le torte fatte in casa, la piscina coperta, il bosco dietro l''albergo, o Nina la golden retriever dell''hotel. Il personale è gentile e chiama il bambino per nome. La vacanza è lo sfondo, non il tema: il tema resta il capriccio da superare.',
  array['sonno', 'buio', 'cibo', 'vacanza', 'bagnetto'],
  false,
  false
)
on conflict (slug) do nothing;
