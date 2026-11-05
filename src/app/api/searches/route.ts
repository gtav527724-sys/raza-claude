import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recentSearches } from "@/db/schema";
import { searchSchema, trustedMutation } from "@/lib/server/security";
import { getOwner } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getOwner();
    const rows = await db
      .select()
      .from(recentSearches)
      .where(eq(recentSearches.owner, owner))
      .orderBy(desc(recentSearches.createdAt))
      .limit(8);
    return NextResponse.json({ searches: rows.map((r) => r.query) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load searches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const parsed = searchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    const owner = await getOwner();
    await db
      .insert(recentSearches)
      .values({ owner, query: parsed.data.query })
      .onConflictDoUpdate({
        target: [recentSearches.owner, recentSearches.query],
        set: { createdAt: sql`now()` },
      });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const blocked = trustedMutation(req);
  if (blocked) return blocked;
  try {
    const owner = await getOwner();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    if (searchParams.get("all")) {
      await db.delete(recentSearches).where(eq(recentSearches.owner, owner));
    } else if (query) {
      await db
        .delete(recentSearches)
        .where(and(eq(recentSearches.owner, owner), eq(recentSearches.query, query)));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear searches" }, { status: 500 });
  }
}
