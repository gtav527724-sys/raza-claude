import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";

export const SESSION_COOKIE = "sonara_session";
export const DEVICE_COOKIE = "sonara_did";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180;

function secret() {
  return (
    process.env.AUTH_SECRET ||
    createHash("sha256")
      .update(
        `sonara|${process.env.GOOGLE_CLIENT_SECRET ?? ""}|${process.env.DATABASE_URL ?? "dev"}`,
      )
      .digest("hex")
  );
}

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString("base64url");
}

/** Sign a small JSON payload (HMAC-SHA256). Used for sessions, OAuth state, app claim tokens. */
export function signPayload(payload: Record<string, unknown>, ttlSec: number) {
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPayload<T extends Record<string, unknown>>(token: string | undefined | null) {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & {
      exp?: number;
    };
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Public origin of this deployment (works behind Vercel / Railway proxies). */
export function publicOrigin(req: Request) {
  const fixed = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fixed) return fixed.replace(/\/+$/, "");
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : url.protocol.replace(":", ""));
  return `${proto}://${host}`;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  picture: string;
}

export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  const data = verifyPayload<{ uid: number }>(jar.get(SESSION_COOKIE)?.value);
  return data?.uid ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const [u] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, picture: u.picture };
}

/**
 * Data owner key. Signed-in users own their data across devices;
 * everyone else gets a private per-device bucket (cookie set by proxy.ts).
 */
export async function getOwner(): Promise<string> {
  const jar = await cookies();
  const data = verifyPayload<{ uid: number }>(jar.get(SESSION_COOKIE)?.value);
  if (data?.uid) return `u:${data.uid}`;
  const did = jar.get(DEVICE_COOKIE)?.value;
  if (did && /^[a-zA-Z0-9-]{16,64}$/.test(did)) return `d:${did}`;
  return "public";
}

export function sessionCookieOptions(req: Request) {
  const secure = publicOrigin(req).startsWith("https");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
