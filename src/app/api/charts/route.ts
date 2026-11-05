import { NextResponse } from "next/server";
import { topCharts } from "@/lib/itunes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracks = await topCharts(20);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("Charts failed", err);
    return NextResponse.json({ tracks: [], offline: true });
  }
}
