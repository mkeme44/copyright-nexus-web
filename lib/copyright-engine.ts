/**
 * lib/copyright-engine.ts
 *
 * Server-side copyright determination logic.
 * Ported from query_compass.py — keeps the same data flow:
 *   1. Embed the question
 *   2. Search Supabase knowledge chunks
 *   3. Extract work info (title/author/year) via LLM
 *   4. Lookup Stanford + NYPL renewal DBs if applicable
 *   5. Generate structured answer via GPT-4
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ── Clients ────────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  return createClient(url, key);
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey: key });
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface QueryResult {
  answer: string;
  chunks: ChunkResult[];
  renewal: RenewalResult;
  question: string;
}

interface ChunkResult {
  chunk_id: string;
  similarity: number;
  content: string;
}

interface RenewalResult {
  applicable: boolean;
  found?: boolean;
  title?: string;
  author?: string | null;
  year?: number | null;
  stanford?: RenewalRecord | null;
  nypl?: RenewalRecord | null;
}

interface RenewalRecord {
  source: string;
  title: string;
  author?: string;
  claimants?: string;
  pub_year?: number;
  reg_num?: string;
  reg_date?: string;
  renewal_num?: string;
  renewal_date?: string;
  renewal_id?: string;
  oreg?: string;
  odat?: string;
  rdat?: string;
  renewal_year?: number;
  claimant?: string;
  similarity: number;
  expiration_year?: number;
}

interface WorkInfo {
  title: string | null;
  author: string | null;
  year: number | null;
  needs_renewal_check: boolean;
}

// ── Embedding ──────────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.slice(0, 30000),
  });
  return response.data[0].embedding;
}

// ── Filter detection ───────────────────────────────────────────────────────────

function detectFilters(question: string) {
  const q = question.toLowerCase();
  const filters: {
    filter_date?: string[];
    filter_material?: string[];
  } = {};

  const yearMatch = question.match(/\b(1[89]\d{2}|20[012]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year < 1930) filters.filter_date = ["pre-1930"];
    else if (year <= 1963) filters.filter_date = ["1930-1963"];
    else if (year <= 1977) filters.filter_date = ["1964-1977"];
    else if (year <= 1989) filters.filter_date = ["1978-1989"];
    else filters.filter_date = ["post-1989"];
  }

  if (/published|book|magazine|newspaper|printed/.test(q)) {
    filters.filter_material = ["published"];
  } else if (/unpublished|letter|manuscript|diary|personal/.test(q)) {
    filters.filter_material = ["unpublished"];
  } else if (/government|federal|agency|congress/.test(q)) {
    filters.filter_material = ["government"];
  }

  return filters;
}

// ── Chunk search ───────────────────────────────────────────────────────────────

async function searchChunks(question: string): Promise<ChunkResult[]> {
  const supabase = getSupabase();
  const embedding = await generateEmbedding(question);
  const filters = detectFilters(question);

  const { data, error } = await supabase.rpc("match_copyright_chunks", {
    query_embedding: embedding,
    match_threshold: 0.65,
    match_count: 3,
    filter_topic: null,
    filter_date: filters.filter_date ?? null,
    filter_material: filters.filter_material ?? null,
  });

  if (error) throw new Error(`Chunk search failed: ${error.message}`);
  return (data as ChunkResult[]) ?? [];
}

// ── Work info extraction ───────────────────────────────────────────────────────

async function extractWorkInfo(question: string): Promise<WorkInfo> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    temperature: 0,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content: `Extract bibliographic information from copyright questions.
Respond with ONLY a JSON object, no other text, no markdown:
{
  "title": "exact title or null",
  "author": "author name or null",
  "year": 1952,
  "needs_renewal_check": true
}
Rules:
- title: exact commonly-known title, or null if no specific work mentioned
- author: last name or full name, or null
- year: publication year as integer, or null
- needs_renewal_check: true if published work MIGHT be in 1923-1963 range`,
      },
      { role: "user", content: question },
    ],
  });

  try {
    const text = (response.choices[0].message.content ?? "")
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```$/m, "")
      .trim();
    return JSON.parse(text) as WorkInfo;
  } catch {
    return { title: null, author: null, year: null, needs_renewal_check: false };
  }
}

// ── Stanford renewal lookup ────────────────────────────────────────────────────

async function lookupStanford(
  title: string,
  author: string | null,
  year: number | null
): Promise<RenewalRecord | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_renewals", {
      search_title: title,
      search_author: author,
      search_pub_year: year,
      result_limit: 5,
    });

    if (error || !data?.length) return null;
    const best = data[0];
    if ((best.similarity_score ?? 0) < 0.55) return null;

    const pub_year = best.pub_year;
    return {
      source: "Stanford Renewal DB",
      title: best.title,
      author: best.author,
      pub_year,
      reg_num: best.reg_num,
      reg_date: best.reg_date,
      renewal_num: best.renewal_num,
      renewal_date: best.renewal_date,
      claimant: best.claimant,
      similarity: best.similarity_score,
      expiration_year: pub_year ? pub_year + 95 : undefined,
    };
  } catch {
    return null;
  }
}

// ── NYPL renewal lookup ────────────────────────────────────────────────────────

async function lookupNYPL(
  title: string,
  author: string | null,
  year: number | null
): Promise<RenewalRecord | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_nypl_renewals", {
      search_title: title,
      search_author: author,
      search_pub_year: year,
      result_limit: 5,
    });

    if (error || !data?.length) return null;
    const best = data[0];
    if ((best.similarity_score ?? 0) < 0.4) return null;

    const pub_year = best.pub_year;
    return {
      source: "NYPL CCE Renewals",
      title: best.title,
      author: best.author,
      claimants: best.claimants,
      pub_year,
      oreg: best.oreg,
      odat: best.odat,
      renewal_id: best.renewal_id,
      rdat: best.rdat,
      renewal_year: best.renewal_year,
      similarity: best.similarity_score,
      expiration_year: pub_year ? pub_year + 95 : undefined,
    };
  } catch {
    return null;
  }
}

// ── Combined renewal lookup ────────────────────────────────────────────────────

async function lookupRenewal(question: string): Promise<RenewalResult> {
  const info = await extractWorkInfo(question);

  if (!info.needs_renewal_check || !info.title) return { applicable: false };
  if (info.year && !(info.year >= 1923 && info.year <= 1963)) return { applicable: false };

  const [stanford, nypl] = await Promise.all([
    lookupStanford(info.title, info.author, info.year),
    lookupNYPL(info.title, info.author, info.year),
  ]);

  return {
    applicable: true,
    found: !!(stanford || nypl),
    title: info.title,
    author: info.author,
    year: info.year,
    stanford,
    nypl,
  };
}

// ── Context builder ────────────────────────────────────────────────────────────

function formatRenewalContext(renewal: RenewalResult): string {
  if (!renewal.applicable) return "";

  const byline = renewal.author ? ` by ${renewal.author}` : "";
  const publine = renewal.year ? ` (pub. ${renewal.year})` : "";
  const lines = [
    "\n\n--- RENEWAL DATABASE LOOKUP ---",
    `Work: "${renewal.title}"${byline}${publine}`,
    "Sources checked: Stanford Renewal DB + NYPL CCE Renewals (all classes, 1950–1991)",
  ];

  if (renewal.found) {
    lines.push("RESULT: RENEWAL CONFIRMED — Work IS IN COPYRIGHT\n");

    if (renewal.stanford) {
      const s = renewal.stanford;
      const exp = s.expiration_year;
      lines.push(
        "  [Stanford Renewal DB]",
        `  Matched title:  ${s.title}`,
        `  Original reg:   ${s.reg_num} (${s.reg_date})`,
        `  Renewal:        ${s.renewal_num} (${s.renewal_date})`,
        `  Renewed by:     ${s.claimant ?? "unknown"}`,
        `  Confidence:     ${Math.round(s.similarity * 100)}%`,
        exp ? `  Expires:        January 1, ${exp + 1}` : "  Expires: unknown"
      );
    }

    if (renewal.nypl) {
      const n = renewal.nypl;
      const exp = n.expiration_year;
      lines.push(
        "  [NYPL CCE Renewals]",
        `  Matched title:  ${n.title}`,
        `  Original reg:   ${n.oreg} (${n.odat})`,
        `  Renewal:        ${n.renewal_id} (${n.rdat})`,
        `  Claimant:       ${n.claimants ?? "unknown"}`,
        `  Confidence:     ${Math.round(n.similarity * 100)}%`,
        exp ? `  Expires:        January 1, ${exp + 1}` : "  Expires: unknown"
      );
    }

    lines.push(
      "\nRights Statement: In Copyright",
      "URI: https://rightsstatements.org/vocab/InC/1.0/"
    );
  } else {
    lines.push(
      "RESULT: NO RENEWAL RECORD FOUND in either database.",
      "Implication: Copyright almost certainly was NOT renewed.",
      "This work is very likely PUBLIC DOMAIN.",
      "",
      "Rights Statement: No Copyright - United States",
      "URI: https://rightsstatements.org/vocab/NoC-US/1.0/",
      "",
      "⚠  URAA CAVEAT: If this work was first published OUTSIDE the US,",
      "   the URAA (1994) may have retroactively restored copyright.",
      "",
      "For manual verification:",
      "  Stanford:  https://exhibits.stanford.edu/copyrightrenewals",
      "  NYPL:      https://cce-search.nypl.org/",
      "  USCO CPRS: https://publicrecords.copyright.gov/"
    );
  }

  lines.push("--- END RENEWAL LOOKUP ---");
  return lines.join("\n");
}

// ── Answer generation ──────────────────────────────────────────────────────────

async function generateAnswer(
  question: string,
  chunks: ChunkResult[],
  renewal: RenewalResult
): Promise<string> {
  const openai = getOpenAI();
  const renewalContext = formatRenewalContext(renewal);

  if (!chunks.length && !renewalContext) {
    return "I couldn't find relevant information for your question. Try specifying the publication date and whether the work is published or unpublished.";
  }

  const contextParts = chunks.map(
    (c) => `[Knowledge Base — ${c.chunk_id}]\n${c.content}`
  );
  if (renewalContext) contextParts.push(renewalContext);

  const context = contextParts.join("\n\n---\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are Copyright Compass, an expert assistant helping cultural heritage professionals determine copyright status of materials in their collections.

Answer based ONLY on the provided context. Always include:

1. COPYRIGHT STATUS — Public Domain / In Copyright / Undetermined
2. RIGHTS STATEMENT — Exact RightsStatements.org label and URI
3. CONFIDENCE — High / Medium / Low with brief explanation
4. REASONING — Concise legal basis
5. ACTION ITEMS — Any remaining research steps needed

When renewal lookup results appear in context:
- RENEWAL CONFIRMED → In Copyright, state expiration year. Confidence: High.
- NO RENEWAL FOUND (both DBs searched) → Public Domain (NoC-US). High confidence for US works. Flag URAA caveat for foreign works.
- Always cite the specific renewal record number or database when a record was found.

Be direct and practical.`,
      },
      {
        role: "user",
        content: `CONTEXT:\n${context}\n\n---\n\nQUESTION: ${question}`,
      },
    ],
  });

  return response.choices[0].message.content ?? "No answer generated.";
}

// ── Public entry point ─────────────────────────────────────────────────────────

export async function runQuery(question: string): Promise<QueryResult> {
  const [chunks, renewal] = await Promise.all([
    searchChunks(question),
    lookupRenewal(question),
  ]);

  const answer = await generateAnswer(question, chunks, renewal);

  return { question, answer, chunks, renewal };
}
