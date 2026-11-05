import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE,
  googleConfigured,
  publicOrigin,
  sessionCookieOptions,
  signPayload,
  verifyPayload,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}
interface UserInfo {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

/** Move everything the visitor did before logging in into their Google account. */
async function adoptAnonymousData(did: string, userId: number) {
  if (!did || !/^[a-zA-Z0-9-]{16,64}$/.test(did)) return;
  const from = `d:${did}`;
  const to = `u:${userId}`;
  await db.execute(sql`
    UPDATE liked_songs SET owner = ${to}
    WHERE owner = ${from}
      AND track_id NOT IN (SELECT track_id FROM liked_songs WHERE owner = ${to})`);
  await db.execute(sql`UPDATE playlists SET owner = ${to} WHERE owner = ${from}`);
  await db.execute(sql`UPDATE recent_plays SET owner = ${to} WHERE owner = ${from}`);
  await db.execute(sql`
    UPDATE recent_searches SET owner = ${to}
    WHERE owner = ${from}
      AND query NOT IN (SELECT query FROM recent_searches WHERE owner = ${to})`);
}

function appHandoffPage(token: string, origin: string) {
  const deep = `sonara://auth?t=${encodeURIComponent(token)}`;
  const web = `${origin}/api/auth/claim?t=${encodeURIComponent(token)}`;
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SONARA</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050508;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
a{display:inline-block;margin-top:18px;padding:14px 28px;border-radius:999px;background:#c6ff3f;color:#000;font-weight:700;text-decoration:none}small{opacity:.55;display:block;margin-top:18px}</style></head>
<body><div><h2>Login ho gaya ✓</h2><p>SONARA app khul rahi hai…</p><a href="${deep}">Open SONARA app</a>
<small>Agar app na khule to <a style="all:unset;text-decoration:underline;cursor:pointer" href="${web}">yahan tap karein</a></small></div>
<script>setTimeout(function(){location.href=${JSON.stringify(deep)}},350)</script></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const fail = (code: string) => NextResponse.redirect(`${origin}/settings?login=${code}`);
  if (!googleConfigured()) return fail("not-configured");

  const { searchParams } = new URL(req.url);
  if (searchParams.get("error")) return fail("cancelled");
  const code = searchParams.get("code");
  const state = verifyPayload<{ platform: string; did: string }>(searchParams.get("state"));
  if (!code || !state) return fail("invalid-state");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(12000),
    });
    const tok = (await tokenRes.json()) as TokenResponse;
    if (!tok.access_token) return fail("token-failed");

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
      signal: AbortSignal.timeout(12000),
    });
    const info = (await infoRes.json()) as UserInfo;
    if (!info.sub) return fail("profile-failed");

    const expires = new Date(Date.now() + (tok.expires_in ?? 3300) * 1000);
    const [existing] = await db.select().from(users).where(eq(users.googleSub, info.sub)).limit(1);
    let userId: number;
    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          email: info.email ?? existing.email,
          name: info.name ?? existing.name,
          picture: info.picture ?? existing.picture,
          accessToken: tok.access_token,
          refreshToken: tok.refresh_token ?? existing.refreshToken,
          tokenExpiresAt: expires,
        })
        .where(eq(users.id, existing.id));
    } else {
      const [created] = await db
        .insert(users)
        .values({
          googleSub: info.sub,
          email: info.email ?? "",
          name: info.name ?? "",
          picture: info.picture ?? "",
          accessToken: tok.access_token,
          refreshToken: tok.refresh_token ?? null,
          tokenExpiresAt: expires,
        })
        .returning({ id: users.id });
      userId = created.id;
    }

    await adoptAnonymousData(state.did, userId);

    if (state.platform === "android") {
      return appHandoffPage(signPayload({ uid: userId, kind: "claim" }, 300), origin);
    }
    const res = NextResponse.redirect(`${origin}/?login=ok`);
    res.cookies.set(
      SESSION_COOKIE,
      signPayload({ uid: userId }, 60 * 60 * 24 * 180),
      sessionCookieOptions(req),
    );
    return res;
  } catch (err) {
    console.error("google callback", err);
    return fail("error");
  }
}
