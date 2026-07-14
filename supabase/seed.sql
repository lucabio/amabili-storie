-- Dati di esempio per lo sviluppo locale.
--
-- "famiglia_serena" è il caso d'uso che guida il modello di business: un hotel
-- che regala ai propri ospiti storie ambientate nel soggiorno in struttura.
-- Si raggiunge da /?version=famiglia_serena

insert into public.brands (slug, nome, tema, hero, prompt_guida, capricci, mostra_prezzi, accetta_pagamenti)
values (
  'famiglia_serena',
  'Hotel Famiglia Serena',
  '{"accento":"#2e8b8b","accentoSoft":"#7fc9c0","scuro":"#1f3a3a"}'::jsonb,
  jsonb_build_object(
    'occhiello', 'Hotel Famiglia Serena',
    'titolo', 'La storia della vostra vacanza, e del capriccio che',
    'titoloAccento', 'avete superato insieme',
    'sottotitolo', 'Un libro illustrato che regaliamo ai nostri piccoli ospiti: il protagonista è vostro figlio, e la storia si svolge qui, in hotel.',
    'cta', 'Crea la storia — è un regalo nostro'
  ),
  'La storia si svolge durante il soggiorno della famiglia all''Hotel Famiglia Serena, un albergo di montagna in Val Gardena, caldo e accogliente. Nomina almeno una volta, in modo naturale e mai pubblicitario, un dettaglio della struttura: la colazione con le torte fatte in casa, la piscina coperta, il bosco dietro l''albergo, o Nina la golden retriever dell''hotel. Il personale è gentile e chiama il bambino per nome. La vacanza è lo sfondo, non il tema: il tema resta il capriccio da superare.',
  array['sonno', 'buio', 'cibo', 'vacanza', 'bagnetto'],
  false,
  false
)
on conflict (slug) do nothing;
