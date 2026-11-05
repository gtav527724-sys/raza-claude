import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/session";
import { trustedMutation } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
