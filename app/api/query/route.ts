/**
 * app/api/query/route.ts
 *
 * POST /api/query
 *
 * Request body:  { "question": "Is The Old Man and the Sea still in copyright?" }
 * Response:      { answer, chunks, renewal, question } on success
 *                { error } on failure
 *
 * Rate limited: 20 queries per IP per day (configurable via RATE_LIMIT_PER_DAY)
 */

import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/copyright-engine";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining, limit } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Rate limit reached",
        message: `You've used all ${limit} queries for today. Resets at midnight UTC.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── Parse request ────────────────────────────────────────────────────────────
  let question: string;
  try {
    const body = await req.json();
    question = (body.question ?? "").trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with a 'question' field." },
      { status: 400 }
    );
  }

  if (!question) {
    return NextResponse.json(
      { error: "Question cannot be empty." },
      { status: 400 }
    );
  }

  if (question.length > 1000) {
    return NextResponse.json(
      { error: "Question too long. Please keep it under 1000 characters." },
      { status: 400 }
    );
  }

  // ── Run the copyright engine ─────────────────────────────────────────────────
  try {
    const result = await runQuery(question);

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/query] Error:", message);

    return NextResponse.json(
      { error: "Query failed. Please try again.", detail: message },
      { status: 500 }
    );
  }
}

// Disallow GET requests with a helpful message
export async function GET() {
  return NextResponse.json(
    { error: "Use POST with { question: '...' } in the request body." },
    { status: 405 }
  );
}
