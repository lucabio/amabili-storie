# Amabili Storie

Libri illustrati personalizzati che aiutano un bambino a superare un capriccio.
Next.js 16 (App Router, JavaScript) + Supabase + Vercel AI Gateway. Deploy su Vercel.

## Avvio rapido

```bash
npm install
npm run dev
```

Apri <http://localhost:3000>. **Funziona senza configurare niente**: senza Supabase vedi
il brand di default, e senza chiave AI le storie escono da template scritti a mano. Serve
a sviluppare l'interfaccia senza dipendere da servizi esterni.

## Configurazione completa

```bash
cp .env.example .env.local
```

### Supabase

1. Crea il progetto su [supabase.com](https://supabase.com).
2. SQL Editor → esegui `supabase/migrations/0001_init.sql`.
3. Facoltativo, per avere un merchant di esempio: esegui anche `supabase/seed.sql`.
4. Project Settings → API: copia URL, chiave `anon` e chiave `service_role` in `.env.local`.

### Diventare amministratore

Il backoffice non si apre a chiunque si registri: bisogna essere elencati in
`amministratori`. Crea l'utente da Supabase (Authentication → Add user, con **Auto
Confirm User**), poi:

```sql
insert into public.amministratori (utente_id, email)
select id, email from auth.users where email = 'tua@email.it';
```

Poi entra da `/admin`.

### Il login del backoffice

Niente password: si entra con un **codice a 6 cifre** che arriva per mail. La stessa
mail porta anche un **magic link**, come via di riserva — ma quello funziona solo nel
browser da cui è partita la richiesta (è il flusso PKCE, il verificatore sta in un
cookie lì). Se leggi la mail sul telefono e lavori sul portatile, usa il codice.

Tre cose da configurare nella dashboard di Supabase, una volta sola:

1. **SMTP** (Project Settings → Authentication → SMTP): l'SMTP integrato manda poche
   mail all'ora ed è solo per giocare. Noi usiamo Resend: host `smtp.resend.com`,
   utente `resend`, password = la API key di Resend. **La chiave sta qui, non nel
   `.env.local`**: le mail di accesso le spedisce Supabase, non l'app.
2. **Il template** (Authentication → Emails → *Magic Link*): incolla
   `supabase/templates/accesso-backoffice.html`. Deve contenere `{{ .Token }}`, altrimenti
   il codice non arriva e il login non funziona: quello di default manda solo il link.
3. **Redirect URL** (Authentication → URL Configuration): aggiungi
   `http://localhost:3000/auth/callback` e `https://dev.amabilistorie.com/auth/callback`,
   altrimenti il magic link viene rifiutato.

Chiedere un codice per un'email che non esiste non produce nulla e non lo dice: il form
va avanti lo stesso, così non si può scoprire quali indirizzi sono validi.

### Generazione con AI

Metti `AI_GATEWAY_API_KEY` (Vercel → AI Gateway → API keys) in `.env.local`. Su Vercel
non serve: il Gateway si autentica da solo via OIDC.

## Come funziona il multi-brand

Un ente — un hotel, per dire — ha la sua versione del portale:

```
/?version=famiglia_serena
```

Il brand definisce colori, testi dell'hero, capricci offerti, listino sì/no e — la parte
che conta davvero — il **prompt guida**: il filo comune che ogni storia di quell'ente
deve seguire (il soggiorno in hotel, la colazione, il cane della struttura…). Si
configura tutto da `/admin`, senza toccare il codice.

## Ambienti

| Branch | URL |
|---|---|
| `main` | amabilistorie.com |
| `dev` | dev.amabilistorie.com |

La grafica di riferimento sta nel repo `amabili-storie-demo` (demo.amabilistorie.com).
