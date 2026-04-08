/**
 * app/api/copyright-history/route.ts
 *
 * Next.js 14 App Router API route for the Copyright History tool.
 * Rate limited to 30 requests / minute per IP.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleCopyrightHistory, fetchOpenLibraryYear } from "@/lib/copyright-history-engine";

// ── Supabase client ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY not configured.");
  return createClient(url, key);
}

// ── Rate limiter ─────────────────────────────────────────────────────────────

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

// ── RPC with retry ────────────────────────────────────────────────────────────

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpcWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  fn: string,
  params: Record<string, unknown>
): Promise<unknown[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await supabase.rpc(fn, params);
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

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t0 = Date.now();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

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

  if (pubYear && (pubYear < 1800 || pubYear > new Date().getFullYear())) {
    return NextResponse.json(
      { error: "pubYear must be between 1800 and the current year." },
      { status: 400 }
    );
  }

  // ── Log request ──────────────────────────────────────────────────────────────
  console.log(`[History] ${"─".repeat(60)}`);
  console.log(`[History] Query: title="${title}" | author=${author ? `"${author}"` : "null"} | pubYear=${pubYear ?? "null (not provided)"}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error("[History] Supabase init failed:", err);
    return NextResponse.json({ error: "Database connection failed." }, { status: 503 });
  }

  const needsRenewalLookup = !pubYear || (pubYear >= 1923 && pubYear <= 1963);
  console.log(
    `[History] Renewal lookup: ${
      needsRenewalLookup
        ? pubYear
          ? `YES — pub year ${pubYear} is in the 1923–1963 renewal window`
          : "YES — no pub year provided, searching all databases"
        : `NO — pub year ${pubYear} is outside the renewal window`
    }`
  );
  if (!pubYear) {
    console.log(`[History] Open Library: fetching pub year for "${title}"${author ? ` by "${author}"` : ""} (4 s timeout)`);
  }

  const baseParams = {
    search_title: title,
    search_author: author,
    search_pub_year: pubYear,
    result_limit: 5,
  };

  // All four fetches fire in parallel. Open Library is only called when the user
  // didn't supply a year (user hint always wins; no need to burn the OL request).
  const [stanfordRows, nyplRows, uscoRows, openLibraryYear] = await Promise.all([
    needsRenewalLookup ? rpcWithRetry(supabase, "search_renewals", baseParams)       : Promise.resolve([]),
    needsRenewalLookup ? rpcWithRetry(supabase, "search_nypl_renewals", baseParams)  : Promise.resolve([]),
    needsRenewalLookup ? rpcWithRetry(supabase, "search_usco_renewals", baseParams)  : Promise.resolve([]),
    !pubYear           ? fetchOpenLibraryYear(title, author)                         : Promise.resolve(null),
  ]);

  // ── Log database results ─────────────────────────────────────────────────────
  function logDbResult(label: string, rows: unknown[]) {
    if (!needsRenewalLookup) {
      console.log(`[History] ${label.padEnd(10)} skipped (outside renewal window)`);
      return;
    }
    if (!rows.length) {
      console.log(`[History] ${label.padEnd(10)} 0 rows returned`);
      return;
    }
    const top = rows[0] as Record<string, unknown>;
    const sim = top.similarity_score as number | undefined;
    const topTitle = (top.title ?? top.matched_title ?? "?") as string;
    const recordId = (top.renewal_num ?? top.renewal_id ?? top.registration_number ?? top.reg_num ?? "—") as string;
    console.log(
      `[History] ${label.padEnd(10)} ${rows.length} row${rows.length !== 1 ? "s" : ""} | ` +
      `top: "${topTitle}" @ ${sim !== undefined ? Math.round(sim * 100) + "%" : "?%"} | ` +
      `record: ${recordId}`
    );
  }

  logDbResult("Stanford", stanfordRows);
  logDbResult("NYPL", nyplRows);
  logDbResult("USCO", uscoRows);

  if (!pubYear) {
    console.log(
      `[History] Open Library: ${
        openLibraryYear !== null ? `returned ${openLibraryYear}` : "no result (timeout, 404, or no match)"
      }`
    );
  }

  // ── Assemble result ──────────────────────────────────────────────────────────
  const history = assembleCopyrightHistory({
    title,
    author,
    pubYearHint: pubYear,
    openLibraryYear: openLibraryYear as number | null,
    stanfordRows: stanfordRows as Record<string, unknown>[],
    nyplRows: nyplRows as Record<string, unknown>[],
    uscoRows: uscoRows as Record<string, unknown>[],
  });

  // ── Log assembled result ─────────────────────────────────────────────────────
  const pubYearSource =
    pubYear                                         ? "user-provided hint"
    : openLibraryYear && history.pubYear === openLibraryYear ? "Open Library"
    : history.pubYear                               ? "Supabase records (high-confidence)"
    :                                                 "unknown — could not determine";

  console.log(`[History] Pub year: ${history.pubYear ?? "null"} (source: ${pubYearSource})`);
  console.log(`[History] Period:   ${history.periodLabel}`);

  if (history.renewed === null) {
    console.log(`[History] Renewal:  N/A (not in 1923–1963 window)`);
  } else if (history.renewed === true) {
    console.log(`[History] Renewal:  FOUND — year ${history.renewalYear ?? "unknown"} | sources: ${history.sourcesWithHits.join(", ")}`);
  } else {
    console.log(`[History] Renewal:  NOT FOUND in any database${history.sourcesWithHits.length ? ` (hits above cutoff: ${history.sourcesWithHits.join(", ")})` : ""}`);
  }

  const cs = history.copyrightStatus;
  console.log(
    `[History] Status:   ${cs.status} | confidence: ${cs.confidence} | ` +
    `expires: ${cs.expiresYear ?? "N/A"} | URI: ${cs.uri}`
  );
  if (cs.warnings.length) {
    cs.warnings.forEach(w => console.log(`[History] ⚠ Warning: ${w.slice(0, 120)}`));
  }

  console.log(`[History] ── Done in ${Date.now() - t0}ms`);

  return NextResponse.json(history);
}
