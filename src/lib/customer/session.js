import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Whoever left their email gets into their own area with email + OTP. Unlike the
 * backoffice, here you do not need to belong to any table: any authenticated
 * user is a valid customer. Which stories they see is decided by RLS
 * (`email = auth.email()`), not by a check here.
 *
 * @returns the logged-in user, or null.
 */
export async function customerUser() {
  if (!supabaseConfigured()) return null;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
