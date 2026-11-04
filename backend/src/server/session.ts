import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export type Role = "user" | "staff" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  role: Role;
  image: string | null;
}

/** Current user for this request (deduplicated per render). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Bypass the signed cookie cache so role, ban and phone-verification changes apply immediately
  // (the session itself is still served from Redis, so this stays cheap).
  const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) return null;
  const u = session.user as typeof session.user & {
    role?: string | null;
    phoneNumber?: string | null;
    phoneNumberVerified?: boolean | null;
    banned?: boolean | null;
  };
  if (u.banned) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    phoneNumber: u.phoneNumber ?? null,
    phoneNumberVerified: Boolean(u.phoneNumberVerified),
    role: (u.role === "admin" || u.role === "staff" ? u.role : "user") as Role,
    image: u.image ?? null,
  };
});

export const isStaff = (user: Pick<SessionUser, "role"> | null): boolean =>
  user?.role === "admin" || user?.role === "staff";

/** For pages: sends anonymous visitors to the login page and back afterwards. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user)) redirect("/");
  return user;
}

export class AuthError extends Error {
  /** "unauthenticated": nobody is signed in (HTTP 401). "forbidden": signed in but not allowed (HTTP 403). */
  readonly reason: "unauthenticated" | "forbidden";

  constructor(message = "Please sign in to continue.", reason: AuthError["reason"] = "unauthenticated") {
    super(message);
    this.name = "AuthError";
    this.reason = reason;
  }
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function assertStaff(minimum: "staff" | "admin" = "staff"): Promise<SessionUser> {
  const user = await assertUser();
  if (minimum === "admin" ? user.role !== "admin" : !isStaff(user)) throw new AuthError("Not allowed.", "forbidden");
  return user;
}
