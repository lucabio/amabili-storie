-- Il listino diventa a tre formati: eBook, brossura, rilegato.
--
-- Il wizard (Configuratore.jsx) offriva già "softcover"/"hardcover" a
-- schermo, ma il vincolo qui sotto conosceva solo 'ebook'/'cartaceo': un
-- ordine "brossura" sarebbe stato rifiutato dal database. Il listino unico
-- vive ora in src/lib/ordini/schema.js (LISTINO); questo vincolo deve
-- restare in sincronia con le sue chiavi.
--
-- L'ordine di queste tre istruzioni non è un dettaglio.
--
-- Il vincolo si toglie PRIMA di aggiornare i dati, non dopo: finché è in piedi,
-- conosce solo 'ebook' e 'cartaceo', e rifiuterebbe la riga che stiamo scrivendo
-- ('rilegato' non è ancora un valore legale). Non è il vincolo nuovo a bocciare
-- i dati vecchi — è quello vecchio a bocciare i dati nuovi.
--
-- Fra il drop e l'add la tabella resta un istante senza guardia: è proprio la
-- finestra che serve per cambiare i dati, e la transazione la tiene chiusa a
-- chiunque altro.
alter table public.ordini
  drop constraint ordini_formato_check;

-- Gli ordini 'cartaceo' esistenti (se ce ne sono, da CHECKOUT_FINTO) diventano
-- 'rilegato': era il formato cartaceo che esisteva prima che ne arrivasse un
-- secondo.
update public.ordini set formato = 'rilegato' where formato = 'cartaceo';

alter table public.ordini
  add constraint ordini_formato_check check (formato in ('ebook', 'brossura', 'rilegato'));
