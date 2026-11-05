import { NextResponse, type NextRequest } from "next/server";

/**
 * Gives every visitor a private, long-lived device id so likes / playlists /
 * history are stored per person (and survive APK restarts) even before login.
 */
export function proxy(req: NextRequest) {
  if (req.cookies.get("sonara_did")?.value) return NextResponse.next();

  const id = crypto.randomUUID();
  const headers = new Headers(req.headers);
  const existing = headers.get("cookie");
  headers.set("cookie", `${existing ? `${existing}; ` : ""}sonara_did=${id}`);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("sonara_did", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons/|covers/|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)",
  ],
};
