import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Where the magic link of the access email lands.
 *
 * Supabase sends back here with a `code` to exchange for a session. The exchange
 * only succeeds in the browser that asked for the code — it is the PKCE flow,
 * and the verifier sits in a cookie of that browser. Whoever opens the email on
 * their phone while working on their laptop ends up here with an error: we send
 * them back to the login, where the 6-digit code works anyway.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const failure = searchParams.get("error");

  // Where to return after signing in. Internal paths only (via `next` of
  // CustomerLoginForm): never a redirect to the outside. The backoffice does not
  // pass `next` and stays on /admin.
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") ? next : "/admin";
  const loginPage = destination.startsWith("/area") ? "/area/login" : "/admin/login";

  const toLogin = (reason) =>
    NextResponse.redirect(`${origin}${loginPage}?errore=${reason}`);

  if (failure) {
    return toLogin(searchParams.get("error_code") === "otp_expired" ? "scaduto" : "link");
  }
  if (!code) return toLogin("link");

  const supabase = await createServerSupabase();
  if (!supabase) return toLogin("link");

  // Here cookies can be written: we are in a Route Handler, not in a Server
  // Component. It is this call that deposits the session.
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return toLogin("link");

  return NextResponse.redirect(`${origin}${destination}`);
}
