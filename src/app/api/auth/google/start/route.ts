import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { DEVICE_COOKIE, googleConfigured, publicOrigin, signPayload } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Scopes: profile for login + read-only YouTube so the user's own YT playlists/likes can be imported. */
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/settings?login=not-configured`);
  }
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") === "android" ? "android" : "web";
  const did = req.headers.get("cookie")?.match(new RegExp(`${DEVICE_COOKIE}=([^;]+)`))?.[1] ?? "";

  // State is signed (not cookie-bound) because the Android flow finishes in a
  // different browser than the WebView that started it.
  const state = signPayload({ n: randomBytes(8).toString("hex"), platform, did }, 600);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent select_account",
    state,
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
