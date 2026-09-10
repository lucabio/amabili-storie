import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminSession, adminUser } from "./session";

vi.mock("@/lib/supabase/server", () => ({
  supabaseConfigured: () => fake.configured,
  createServerSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: fake.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: fake.adminRow }) }),
      }),
    }),
  }),
}));

/** What Supabase answers in this test. */
const fake = { configured: true, user: null, adminRow: null };

const SILVIA = { id: "cfce152c", email: "amabilisilvia@hotmail.com" };

beforeEach(() => {
  Object.assign(fake, { configured: true, user: null, adminRow: null });
});

describe("adminSession", () => {
  it("tells apart someone who signed in but is not an admin from someone who did not sign in", async () => {
    fake.user = SILVIA;

    // The bug: this case and the next one both gave the same `null`, and the
    // login page could not say why you were not getting in.
    expect(await adminSession()).toEqual({ user: SILVIA, isAdmin: false });
    expect(await adminUser()).toBeNull();
  });

  it("without a session there is no user", async () => {
    expect(await adminSession()).toEqual({ user: null, isAdmin: false });
    expect(await adminUser()).toBeNull();
  });

  it("whoever is listed among the admins gets in", async () => {
    fake.user = SILVIA;
    fake.adminRow = { user_id: SILVIA.id };

    expect(await adminSession()).toEqual({ user: SILVIA, isAdmin: true });
    expect(await adminUser()).toBe(SILVIA);
  });

  it("without Supabase configured nobody gets in", async () => {
    fake.configured = false;
    fake.user = SILVIA;
    fake.adminRow = { user_id: SILVIA.id };

    expect(await adminSession()).toEqual({ user: null, isAdmin: false });
  });
});
