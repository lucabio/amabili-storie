import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Next 16: what used to be `middleware.js` is now called `proxy.js` and runs on
 * the Node runtime (the edge is not supported here).
 *
 * It does one thing only: refresh the Supabase session token, because a Server
 * Component cannot write cookies. Without this, the admin would be logged out
 * when the token expires.
 */
export async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not remove: this is the call that renews the token and rewrites the cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // The customer area has a session to refresh too, not just the backoffice.
  matcher: ["/admin/:path*", "/area/:path*"],
};
