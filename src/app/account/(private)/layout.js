import { redirect } from "next/navigation";

import { customerUser } from "@/lib/customer/session";

/**
 * Everything under `(private)` demands a logged-in user. `/account/login` sits
 * outside the group, so it does not go through here. The real check is
 * server-side: an unauthenticated user is sent back to the login before seeing
 * anything at all.
 */
export default async function PrivateLayout({ children }) {
  const user = await customerUser();
  if (!user) redirect("/account/login");

  return children;
}
