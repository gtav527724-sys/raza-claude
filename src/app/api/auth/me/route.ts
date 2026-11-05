import { NextResponse } from "next/server";
import { googleConfigured, getSessionUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ configured: googleConfigured(), user });
  } catch {
    return NextResponse.json({ configured: googleConfigured(), user: null });
  }
}
