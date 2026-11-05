import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  publicOrigin,
  sessionCookieOptions,
  signPayload,
  verifyPayload,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Android: the system browser finished Google login; the WebView claims the session here. */
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const t = new URL(req.url).searchParams.get("t");
  const data = verifyPayload<{ uid: number; kind: string }>(t);
  if (!data || data.kind !== "claim") {
    return NextResponse.redirect(`${origin}/settings?login=invalid-state`);
  }
  const res = NextResponse.redirect(`${origin}/?login=ok`);
  res.cookies.set(
    SESSION_COOKIE,
    signPayload({ uid: data.uid }, 60 * 60 * 24 * 180),
    sessionCookieOptions(req),
  );
  return res;
}
