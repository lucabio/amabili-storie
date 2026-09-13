#!/usr/bin/env bash
#
# The people of the local stack.
#
# The backoffice login refuses to create anyone (`shouldCreateUser: false`), so an
# admin must already exist before a 6-digit code can be asked for. `supabase db reset`
# wipes auth.users, so run this again after one.
#
# Local only, by construction: the key comes from `supabase status`, never from
# .env.local — that file may well be pointing at the remote project right now.
#
# The address has to be REAL. Local auth sends through Resend SMTP
# (`[auth.email.smtp]` in config.toml), so a made-up address gets seeded fine and
# then never receives the code — you end up with an admin you cannot log in as.
# Set that block to `enabled = false` to go back to Mailpit, <http://127.0.0.1:54334>.
#
# usage: scripts/seed-local-users.sh you@example.com [more@example.com ...]
set -euo pipefail
cd "$(dirname "$0")/.."

api="http://127.0.0.1:54331"
key=$(npx supabase status -o env | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
[ -n "$key" ] || { echo "the local stack is not up: npx supabase start" >&2; exit 1; }

[ "$#" -gt 0 ] || { echo "usage: $0 you@example.com — a real address, the code is emailed" >&2; exit 1; }

for email in "$@"; do
  curl -sS -X POST "$api/auth/v1/admin/users" \
    -H "apikey: $key" -H "Authorization: Bearer $key" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"email_confirm\":true}" >/dev/null

  docker exec supabase_db_amb-str-local psql -U postgres -q -c \
    "insert into public.admins (user_id, email)
     select id, email from auth.users where email = '$email'
     on conflict do nothing;"

  echo "admin ready: $email"
done
