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

## Il giro completo

Il genitore sceglie un capriccio, personalizza i protagonisti — nome, età, e i **tratti
opzionali**: capelli, occhi, corporatura, e una descrizione libera, che è il campo che vale
di più — e riceve un'**anteprima gratuita di 3 pagine**, istantanea.

Se compra, nasce un ordine e parte un **workflow durevole** che scrive le 22 pagine, avvisa
il genitore per mail, e deposita la storia in `/admin/storie` in attesa di revisione: **una
storia acquistata non arriva a un bambino senza che un umano l'abbia letta**. Lì la
correggete a mano e la approvate. All'approvazione parte la mail "il libro è pronto", col
link a `/storie/<uuid>` — dove il genitore legge. L'uuid è la chiave: una storia non
approvata dà 404.

Una storia fallita o rifiutata si **rigenera** dal backoffice, riusando la stessa riga: così
il link già in mano al genitore continua a funzionare.

**Un brand vende o regala.** `accetta_pagamenti` decide se c'è un checkout: l'Hotel Famiglia
Serena regala le storie ai propri ospiti (niente prezzi, ordine a prezzo zero), il sito
principale le vende. E anche la home è un brand (`slug = amabili`): si modifica dal
backoffice, non serve un deploy.

**Il pagamento non c'è ancora.** Per provare il giro serve `CHECKOUT_FINTO=1` in `.env.local`:
crea l'ordine e genera il libro senza far pagare nessuno. Gli ordini nati così hanno
`finto = true`, e si cancellano tutti con `delete from public.ordini where finto`.

**`RESEND_API_KEY` ora serve davvero all'app**, non solo a Supabase: le mail al genitore le
manda il portale, non il servizio di autenticazione.

Se l'AI non è configurata, un libro acquistato **fallisce** invece di ripiegare sui template:
lo trovate in coda come `fallita`, con l'errore in chiaro. È voluto — un cliente che ha pagato
non può ricevere in silenzio una storia identica a tutte le altre.

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
