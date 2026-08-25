import { describe, it, expect, vi } from "vitest";

/**
 * Verifies the Auth.js callback wiring that maps a user id into the JWT and back
 * into the session. We mock next-auth so we can capture the callbacks the config
 * registers, then assert they thread `user.id` -> `token.userId` -> `session.user.id`.
 * This guards against regressions in the session<->user id plumbing (used by all
 * route-level `getUserId()` enforcement) without standing up a real Auth.js server.
 */

interface JwtArgs {
  token: Record<string, unknown>;
  user?: { id?: string };
}
interface SessionArgs {
  session: { user: { id?: string } };
  token: Record<string, unknown>;
}

const captured: {
  jwt?: (arg: JwtArgs) => Record<string, unknown>;
  session?: (arg: SessionArgs) => { user: { id?: string } };
} = {};

vi.mock("next-auth", () => ({
  __esModule: true,
  default: vi.fn(() => ({})),
}));

vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/db/schema", () => ({
  users: {},
  accounts: {},
  sessions: {},
  verificationTokens: {},
}));
vi.mock("@/lib/errors", () => ({
  ForbiddenError: class ForbiddenError extends Error {},
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

const nextAuthMod = await import("next-auth");
vi.mocked(nextAuthMod.default).mockImplementation(((config: { callbacks: { jwt: (a: JwtArgs) => Record<string, unknown>; session: (a: SessionArgs) => { user: { id?: string } } } }) => {
  captured.jwt = config.callbacks.jwt;
  captured.session = config.callbacks.session;
  return {};
}) as never);

const { assertOwnership } = await import("@/lib/auth");

describe("auth callbacks still work", () => {
  it("jwt callback stores user.id on the token", () => {
    const token = captured.jwt!({ token: {}, user: { id: "user-abc" } });
    expect(token["userId"]).toBe("user-abc");
  });

  it("session callback copies token.userId into session.user.id", () => {
    const session = captured.session!({ session: { user: { id: "" } }, token: { userId: "user-abc" } });
    expect(session.user.id).toBe("user-abc");
  });

  it("assertOwnership throws for a non-owner (403 path used by routes)", () => {
    expect(() => assertOwnership("a", "b")).toThrow();
    expect(() => assertOwnership("a", "a")).not.toThrow();
  });
});
