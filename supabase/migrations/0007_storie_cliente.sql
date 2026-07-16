-- I clienti vedono le proprie storie.
--
-- Chi ha lasciato la mail entra con email + OTP: `auth.email()` è verificata dal
-- codice, quindi si vede solo ciò che è legato alla mail che si controlla. La
-- policy vale per QUALSIASI stato (l'area mostra anche "in lavorazione"); il
-- download del PDF resta vincolato a `approvata`, ma nel codice, non qui.
--
-- Le policy di SELECT si sommano in OR: gli amministratori continuano a vedere
-- tutto con la loro (0001). Nessuna policy di scrittura: scrive solo il server
-- con la service role.

create policy "clienti leggono le proprie storie"
  on public.storie for select
  to authenticated
  using (email = auth.email());

-- La lettura dell'area filtra per email: un indice la tiene rapida.
create index if not exists storie_email_idx on public.storie (email);
