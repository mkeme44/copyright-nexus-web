/**
 * lib/copyright-engine.ts
 *
 * Server-side copyright determination logic.
 * Data flow:
 *   1. Embed the question (+ history context for follow-ups)
 *   2. Search Supabase knowledge chunks
 *   3. Extract work info — title/author/year — with history awareness
 *   4. Lookup Stanford + NYPL renewal DBs if a specific title is known
 *   5. Generate structured answer OR ask a clarifying question via GPT-4
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

export interface ConversationTurn {
  question: string;
  answer: string;
}

export interface QueryResult {
  answer: string;
  chunks: ChunkResult[];
  renewal: RenewalResult;
  question: string;
  needs_clarification?: boolean;
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
// Passes conversation history so follow-up answers (e.g. "Life Magazine")
// can be understood in context of the prior question.

async function extractWorkInfo(
  question: string,
  history: ConversationTurn[]
): Promise<WorkInfo> {
  const openai = getOpenAI();

  const historyText =
    history.length > 0
      ? history
          .map((t) => `User: ${t.question}\nAssistant: ${t.answer}`)
          .join("\n") + "\n\n"
      : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    temperature: 0,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `Extract bibliographic information from a copyright question. Consider the full conversation history — the user may have provided a title or year in a previous message.

Respond with ONLY a JSON object, no markdown:
{
  "title": "exact title or null",
  "author": "author name or null",
  "year": 1952,
  "needs_renewal_check": true
}

Rules:
- title: specific work title extracted from question OR conversation history, or null
- author: last name or full name, or null
- year: publication year as integer (from question or history), or null
- needs_renewal_check: true if published work is or might be in the 1923-1963 range`,
      },
      {
        role: "user",
        content: historyText
          ? `Conversation so far:\n${historyText}Current question: ${question}`
          : question,
      },
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

async function lookupRenewal(
  question: string,
  history: ConversationTurn[]
): Promise<{ renewal: RenewalResult; workInfo: WorkInfo }> {
  const info = await extractWorkInfo(question, history);

  if (!info.needs_renewal_check || !info.title) {
    return { renewal: { applicable: false }, workInfo: info };
  }
  if (info.year && !(info.year >= 1923 && info.year <= 1963)) {
    return { renewal: { applicable: false }, workInfo: info };
  }

  const [stanford, nypl] = await Promise.all([
    lookupStanford(info.title, info.author, info.year),
    lookupNYPL(info.title, info.author, info.year),
  ]);

  return {
    renewal: {
      applicable: true,
      found: !!(stanford || nypl),
      title: info.title,
      author: info.author,
      year: info.year,
      stanford,
      nypl,
    },
    workInfo: info,
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
      "   the URAA (1994) may have retroactively restored copyright."
    );
  }

  lines.push("--- END RENEWAL LOOKUP ---");
  return lines.join("\n");
}

// ── Answer generation ──────────────────────────────────────────────────────────

async function generateAnswer(
  question: string,
  chunks: ChunkResult[],
  renewal: RenewalResult,
  history: ConversationTurn[]
): Promise<string> {
  const openai = getOpenAI();
  const renewalContext = formatRenewalContext(renewal);

  const contextParts = chunks.map(
    (c) => `[Knowledge Base — ${c.chunk_id}]\n${c.content}`
  );
  if (renewalContext) contextParts.push(renewalContext);
  const context = contextParts.join("\n\n---\n\n");

  // Build message history for conversational context
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are Copyright Compass, an expert AI assistant helping cultural heritage professionals determine copyright status of works in their collections. You have direct access to 1.8 million renewal records from the Stanford and NYPL CCE databases — those searches have already been run and the results are provided in your context.

## HOW TO RESPOND

**Case 1 — General rule question** (e.g., government works, post-1977 works, unpublished works by category):
Answer the applicable rule directly from the provided context. No structured format required.

**Case 2 — Specific work identified AND renewal data is in context:**
Give a definitive determination using this exact markdown format:

**COPYRIGHT STATUS:** Public Domain / In Copyright / Undetermined

**RIGHTS STATEMENT:** [RightsStatements.org label]
URI: [full URI]

**CONFIDENCE:** High / Medium / Low

**REASONING:** [cite renewal record number and database if applicable; concise legal basis]

**ACTION ITEMS:** [genuine remaining steps only — omit this field entirely if status is clear]

**Case 3 — Question involves 1923–1963 range but NO specific title is available:**
Do NOT output "Undetermined" with a list of tasks for the user.
Instead, explain briefly that the answer depends on whether copyright was renewed, and ask for the title so you can check the databases yourself. Keep it to 1–2 sentences. Example: "To check the renewal records for you, I'll need the title. What's the name of the magazine?"

**Case 4 — Follow-up that provides a title or more detail:**
Use the full conversation history to understand what work is being discussed, then provide a determination using the renewal data now in context.

## RULES
- NEVER tell users to "search the Stanford database" or "check the NYPL" — that is your job and you do it automatically.
- When NO RENEWAL RECORD was found: state clearly the work is likely Public Domain (for US works). Include the URAA caveat for potentially foreign works.
- When a RENEWAL WAS FOUND: state clearly the work is In Copyright and give the expiration year.
- Be direct and concise. Cultural heritage professionals are experienced researchers who need clear determinations, not lengthy explanations of what they should go do.`,
    },
  ];

  // Add conversation history for context
  for (const turn of history) {
    messages.push({ role: "user", content: turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  }

  // Add current question with context
  messages.push({
    role: "user",
    content: context
      ? `CONTEXT:\n${context}\n\n---\n\nQUESTION: ${question}`
      : question,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    temperature: 0.2,
    messages,
  });

  return response.choices[0].message.content ?? "No answer generated.";
}

// ── Public entry point ─────────────────────────────────────────────────────────

export async function runQuery(
  question: string,
  history: ConversationTurn[] = []
): Promise<QueryResult> {
  // Build the effective search question — for follow-ups, include prior context
  // so the embedding search finds relevant chunks even for short follow-up messages
  const searchQuestion =
    history.length > 0
      ? `${history.map((t) => t.question).join(" ")} ${question}`
      : question;

  const [chunks, { renewal, workInfo }] = await Promise.all([
    searchChunks(searchQuestion),
    lookupRenewal(question, history),
  ]);

  // Detect if we need clarification: question is in the renewal-required range
  // but no title could be identified even with history context
  const needsClarification =
    workInfo.needs_renewal_check &&
    !workInfo.title &&
    !renewal.applicable;

  const answer = await generateAnswer(question, chunks, renewal, history);

  return {
    question,
    answer,
    chunks,
    renewal,
    needs_clarification: needsClarification,
  };
}
