import { NextResponse } from "next/server";
import { z } from "zod";

export const trackIdSchema = z.object({ trackId: z.number().int().positive() }).strict();
export const playlistSchema = z.object({ name: z.string().trim().min(1).max(48) }).strict();
export const searchSchema = z.object({ query: z.string().trim().min(1).max(160) }).strict();

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/** In-memory sliding-window limiter; serverless-safe per warm instance. */
export function rateLimit(req: Request, scope: string, baseMax = 60, windowMs = 60_000) {
  // Generous: many users can share one proxy IP (mobile carriers, WebView).
  const max = baseMax * 5;
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  const current = buckets.get(key);
  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count <= max) return null;
  return NextResponse.json(
    { error: "Too many requests — please wait a moment." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((current.reset - now) / 1000)) },
    },
  );
}

/** Blocks cross-site form/API mutations. Custom header forces CORS preflight. */
export function trustedMutation(req: Request) {
  if (req.headers.get("x-sonara-client") === "app") return null;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) {
    return NextResponse.json({ error: "Untrusted request" }, { status: 403 });
  }
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    // invalid origin
  }
  return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
}

export function sanitizeText(value: string, max = 160) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

export const log = {
  info(event: string, meta: Record<string, unknown> = {}) {
    console.info(JSON.stringify({ level: "info", event, at: new Date().toISOString(), ...meta }));
  },
  error(event: string, error: unknown, meta: Record<string, unknown> = {}) {
    console.error(
      JSON.stringify({
        level: "error",
        event,
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
        ...meta,
      }),
    );
  },
};

/** Parse JSON with a hard size limit and Zod validation. */
export async function parseJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 32_768) throw new Error("Payload too large");
  return schema.parse(await req.json());
}
