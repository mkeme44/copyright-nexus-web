/**
 * app/api/copyright-history/route.ts
 *
 * Next.js 14 App Router API route for the Copyright History tool.
 *
 * POST /api/copyright-history
 * Body: { title: string, author?: string, pubYear?: number }
 *
 * Queries Stanford, NYPL, and USCO renewal databases via Supabase RPC,
 * then runs pure-TS copyright determination logic.
 * No LLM calls — all deterministic.
 *
 * Rate limited to 30 requests / minute per IP (same pattern as Compass).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleCopyrightHistory } from "@/lib/copyright-history-engine";

// ── Supabase client (server-side only, service role key never exposed to client)

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY not configured.");
  }
  return createClient(url, key);
}

// ── Simple in-memory rate limiter (30 req/min per IP)

const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── RPC helpers with retry

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpcWithRetry(
  supabase: ReturnType<typeof createClient>,
  fn: string,
  params: Record<string, unknown>
): Promise<unknown[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(fn, params);
      if (error) throw error;
      return (data as unknown[]) ?? [];
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  console.error(`[copyright-history] ${fn} failed after ${RETRY_ATTEMPTS} attempts:`, lastErr);
  return [];
}

// ── POST handler

export async function POST(req: NextRequest) {
  // Rate limit
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // Parse body
  let title: string, author: string | null, pubYear: number | null;
  try {
    const body = await req.json();
    title = String(body.title ?? "").trim();
    author = body.author ? String(body.author).trim() : null;
    pubYear = body.pubYear ? parseInt(String(body.pubYear), 10) : null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  // Validate year
  if (pubYear && (pubYear < 1800 || pubYear > new Date().getFullYear())) {
    return NextResponse.json(
      { error: "pubYear must be between 1800 and the current year." },
      { status: 400 }
    );
  }

  // Only run renewal lookups if year is in the applicable range (1923–1963)
  const needsRenewalLookup = !pubYear || (pubYear >= 1923 && pubYear <= 1963);

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error("[copyright-history] Supabase init failed:", err);
    return NextResponse.json(
      { error: "Database connection failed." },
      { status: 503 }
    );
  }

  const baseParams = {
    search_title: title,
    search_author: author,
    search_pub_year: pubYear,
    result_limit: 5,
  };

  // Run all three DB queries in parallel when renewal lookup is needed
  const [stanfordRows, nyplRows, uscoRows] = needsRenewalLookup
    ? await Promise.all([
        rpcWithRetry(supabase, "search_renewals", baseParams),
        rpcWithRetry(supabase, "search_nypl_renewals", baseParams),
        rpcWithRetry(supabase, "search_usco_renewals", baseParams),
      ])
    : [[], [], []];

  const history = assembleCopyrightHistory({
    title,
    author,
    pubYearHint: pubYear,
    stanfordRows: stanfordRows as Record<string, unknown>[],
    nyplRows: nyplRows as Record<string, unknown>[],
    uscoRows: uscoRows as Record<string, unknown>[],
  });

  return NextResponse.json(history);
}
