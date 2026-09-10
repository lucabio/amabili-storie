import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";

/**
 * The two questions the backoffice has to keep apart: "who are you?" and "can
 * you come in?". Keeping them separate is what lets the login page say *why*
 * you cannot. Collapsed into a single `null`, someone who is authenticated but
 * not an admin sees the email form come back and thinks the code did not work.
 *
 * @returns { user, isAdmin } — the logged-in user (or null) and whether they are
 * listed in the `amministratori` table.
 */
export async function adminSession() {
  if (!supabaseConfigured()) return { user: null, isAdmin: false };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data } = await supabase
    .from("amministratori")
    .select("utente_id")
    .eq("utente_id", user.id)
    .maybeSingle();

  return { user, isAdmin: Boolean(data) };
}

/**
 * Being logged in is not enough: you are an admin only if you are listed in the
 * `amministratori` table. That way the backoffice does not open up to anyone who
 * can sign up on Supabase.
 *
 * @returns the user if they are an admin, otherwise null.
 */
export async function adminUser() {
  const { user, isAdmin } = await adminSession();
  return isAdmin ? user : null;
}
