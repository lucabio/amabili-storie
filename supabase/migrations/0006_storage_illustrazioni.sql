-- Le illustrazioni generate dal backoffice.
--
-- Bucket pubblico: le immagini finiscono nella pagina del libro (che il
-- genitore apre con l'uuid) e nel PDF. La chiave della storia resta l'uuid
-- imprevedibile — l'immagine di per sé non rivela nulla su chi sia il bambino.
--
-- Scrittura: solo il server con la service role, che le RLS le bypassa. Non
-- serve nessuna policy di insert/update: dal browser qui non si scrive. Un
-- bucket `public` serve i suoi oggetti in lettura senza bisogno di policy.

insert into storage.buckets (id, name, public)
values ('illustrazioni', 'illustrazioni', true)
on conflict (id) do nothing;
