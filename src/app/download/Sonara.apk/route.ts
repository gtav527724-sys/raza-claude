import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CANDIDATES = [
  path.join(process.cwd(), "android", "build", "sonara.apk"),
  "/app/android/build/sonara.apk",
];

export async function GET() {
  const file = CANDIDATES.find((p) => existsSync(p));
  if (!file) {
    return new NextResponse("APK is still being packaged — try again in a minute.", {
      status: 404,
    });
  }
  const buf = readFileSync(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="Sonara.apk"',
      "Content-Length": String(buf.length),
      "Cache-Control": "no-store",
    },
  });
}
