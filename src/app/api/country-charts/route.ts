import { NextResponse } from "next/server";
import { topCharts } from "@/lib/itunes";

export const dynamic = "force-dynamic";

const COUNTRIES = new Set(["us", "gb", "in", "pk", "ca", "au", "de", "fr", "jp", "kr", "br", "mx"]);

export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get("country")?.toLowerCase() ?? "us";
  const country = COUNTRIES.has(requested) ? requested : "us";
  try {
    return NextResponse.json({ country, tracks: await topCharts(50, country) });
  } catch {
    return NextResponse.json({ country, tracks: [] });
  }
}
