import Link from "next/link";
import { redirect } from "next/navigation";

import { adminUser } from "@/lib/admin/session";
import { supabaseConfigured } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Merchant" },
  { href: "/admin/storie", label: "Storie" },
];

/** Everything in this group requires an admin session. */
export default async function ManagementLayout({ children }) {
  // Without Supabase the parent layout already shows the setup instructions.
  if (!supabaseConfigured()) return null;

  const user = await adminUser();
  if (!user) redirect("/admin/login");

  return (
    <div>
      <nav className="mb-8 flex gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-bordo bg-white px-4 py-2 text-sm font-bold text-inchiostro-soft"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
