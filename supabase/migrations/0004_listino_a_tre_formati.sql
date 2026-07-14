-- Il listino diventa a tre formati: eBook, brossura, rilegato.
--
-- Il wizard (Configuratore.jsx) offriva già "softcover"/"hardcover" a
-- schermo, ma il vincolo qui sotto conosceva solo 'ebook'/'cartaceo': un
-- ordine "brossura" sarebbe stato rifiutato dal database. Il listino unico
-- vive ora in src/lib/ordini/schema.js (LISTINO); questo vincolo deve
-- restare in sincronia con le sue chiavi.
--
-- Gli ordini 'cartaceo' esistenti (se mai ce ne fossero, da CHECKOUT_FINTO)
-- diventano 'rilegato': è il formato cartaceo che esisteva prima che ne
-- arrivasse un secondo.
update public.ordini set formato = 'rilegato' where formato = 'cartaceo';

alter table public.ordini
  drop constraint ordini_formato_check;

alter table public.ordini
  add constraint ordini_formato_check check (formato in ('ebook', 'brossura', 'rilegato'));
