/**
 * lib/copyright-engine.ts
 *
 * Server-side copyright determination logic.
 * Data flow:
 *   1. Extract work info — title / author / year / work_type
 *   2. Run all lookups in parallel:
 *        a. Supabase knowledge chunks (always)
 *        b. Stanford + NYPL + USCO renewal DBs  (published 1923–1963 works)
 *        c. Wikidata author death-date lookup    (unpublished works)
 *   3. CRMS cross-validation (if any renewal hit found — sequential, needs renewal numbers)
 *   4. Generate structured answer via GPT-4o
 *
 * Renewal databases searched for 1923–1963 published works:
 *   search_renewals        → Stanford (246k book renewals)
 *   search_nypl_renewals   → NYPL CCE (445k all-class records, 1950–1991)
 *   search_usco_renewals   → USCO CPRS (~908k RE-prefixed records)
 *
 * Cross-validation:
 *   crms_verify_renewal    → HathiTrust CRMS (human-reviewed htid→renewal_id)
 *
 * Biographical lookup:
 *   Wikidata SPARQL / entity API → author death dates for unpublished works
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
  wikidata: WikidataResult | null;
  question: string;
  needs_clarification?: boolean;
  /**
   * Deterministic status computed from structured engine data — never from GPT text.
   * null = no specific determination (general rule question); show no badge.
   */
  status: "in-copyright" | "public-domain" | "undetermined" | null;
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
  usco?: RenewalRecord | null;
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
  crms_verified?: boolean;
}

export interface WikidataResult {
  authorName: string;
  /** Wikidata entity ID (e.g. "Q23434") — null if author not found */
  wikidataId: string | null;
  /** true = found in Wikidata; false = not found */
  found: boolean;
  /** null = alive / unknown; number = year of death */
  deathYear: number | null;
  /** ISO-ish date string from Wikidata, e.g. "+1961-07-02T00:00:00Z" */
  deathDate: string | null;
  /**
   * Computed copyright expiry year: deathYear + 70 (or null if alive / unknown).
   * For unpublished works: copyright = life of author + 70 years.
   */
  copyrightExpiry: number | null;
  /** true = Wikidata found the person but has no death date — likely still living */
  likelyAlive: boolean;
  /**
   * Short description from Wikidata's wbsearchentities response (e.g. "American novelist").
   * null if not found or no description available.
   */
  entityDescription: string | null;
  /**
   * true = the matched Wikidata entity's description does NOT contain writing-related
   * terms, so the name match may be a different person with the same name.
   * When true, the Wikidata result should be treated as uncertain.
   */
  lowConfidenceMatch: boolean;
}

interface WorkInfo {
  title: string | null;
  author: string | null;
  year: number | null;
  needs_renewal_check: boolean;
  /** "unpublished" triggers Wikidata lookup; "published" or "unknown" does not */
  work_type: "published" | "unpublished" | "unknown";
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
// Returns title, author, year, renewal flag, AND work_type for routing lookups.

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
    model: "gpt-4o",
    temperature: 0,
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `Extract bibliographic information from a copyright question. Consider the full conversation history — the user may have provided a title or year in a previous message.

Respond with ONLY a JSON object, no markdown:
{
  "title": "exact title or null",
  "author": "author name or null",
  "year": 1952,
  "needs_renewal_check": true,
  "work_type": "published"
}

Rules:
- title: extract from the CURRENT question first. Only use conversation history if the current question is clearly a short follow-up about the SAME work (for example, user replies with just a year, a name, or yes). If the current question introduces a new subject, new time period, or new collection, return null for title and author.
- author: extract ANY person named as the creator, sender, or subject of authorship in the CURRENT question. Author attribution appears in many phrasings — capture the name in ALL of these forms:
    "by [Name]", "written by [Name]", "authored by [Name]", "composed by [Name]"
    "[Name]'s letters / papers / diaries / manuscripts / correspondence"
    "letters from [Name]", "letters of [Name]", "letters to [Name] from [Name]" — use the SENDER not the recipient
    "works of [Name]", "writings of [Name]", "poems of [Name]"
    "created by [Name]", "produced by [Name]"
    If the question names only ONE person in a clear authorship context, extract that person as author.
    Apply the same follow-up rule as title: only carry from history if current question is a short follow-up.
- year: publication year as integer from current question or follow-up context, or null
- needs_renewal_check: true only if the current question (not just history) involves or could involve a published work in the 1923-1963 range
- work_type:
    "unpublished" — if the question mentions letters, manuscripts, diaries, personal papers, archival materials, correspondence, or explicitly says "unpublished"
    "published"   — if the question mentions books, magazines, newspapers, journals, or published works
    "unknown"     — if unclear`,
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
    return {
      title: null,
      author: null,
      year: null,
      needs_renewal_check: false,
      work_type: "unknown",
    };
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

    if (error || !data?.length) {
      console.log(`[Compass] Stanford: no hit${error ? ` (error: ${error.message})` : ""}`);
      return null;
    }
    const best = data[0];
    if ((best.similarity_score ?? 0) < 0.65) {
      console.log(`[Compass] Stanford: below threshold (${Math.round((best.similarity_score ?? 0) * 100)}%)`);
      return null;
    }

    console.log(`[Compass] Stanford: HIT "${best.title}" — ${Math.round(best.similarity_score * 100)}% match, reg ${best.renewal_num ?? best.reg_num}`);
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
  } catch (err) {
    console.log(`[Compass] Stanford: exception — ${err}`);
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

    if (error || !data?.length) {
      console.log(`[Compass] NYPL: no hit${error ? ` (error: ${error.message})` : ""}`);
      return null;
    }
    const best = data[0];
    if ((best.similarity_score ?? 0) < 0.4) {
      console.log(`[Compass] NYPL: below threshold (${Math.round((best.similarity_score ?? 0) * 100)}%)`);
      return null;
    }

    console.log(`[Compass] NYPL: HIT "${best.title}" — ${Math.round(best.similarity_score * 100)}% match, renewal ${best.renewal_id}`);
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

// ── USCO renewal lookup ────────────────────────────────────────────────────────
// Requires search_usco_renewals() RPC deployed via supabase_usco_search_function.sql.
// USCO column mapping: registration_number (RE-prefix), authors, original_pub_year, reg_year.

async function lookupUSCO(
  title: string,
  author: string | null,
  year: number | null
): Promise<RenewalRecord | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_usco_renewals", {
      search_title: title,
      search_author: author,
      search_pub_year: year,
      result_limit: 5,
    });

    if (error || !data?.length) {
      console.log(`[Compass] USCO: no hit${error ? ` (error: ${error.message})` : ""}`);
      return null;
    }
    const best = data[0];
    if ((best.similarity_score ?? 0) < 0.55) {
      console.log(`[Compass] USCO: below threshold (${Math.round((best.similarity_score ?? 0) * 100)}%)`);
      return null;
    }

    console.log(`[Compass] USCO: HIT "${best.title}" — ${Math.round(best.similarity_score * 100)}% match, reg ${best.registration_number}`);
    // Normalise USCO column names to the shared RenewalRecord shape
    const pub_year = best.original_pub_year ?? best.pub_year ?? null;
    return {
      source: "USCO CPRS",
      title: best.title ?? best.matched_title ?? title,
      author: best.authors ?? best.author ?? undefined,
      claimants: best.claimants ?? best.authors ?? undefined,
      pub_year,
      reg_num: best.registration_number ?? undefined,
      reg_date: best.reg_date ?? undefined,
      renewal_id: best.registration_number ?? undefined,
      renewal_year: best.reg_year ?? undefined,
      similarity: best.similarity_score,
      expiration_year: pub_year ? pub_year + 95 : undefined,
    };
  } catch (err) {
    // Graceful fallback — USCO search function may not yet be deployed
    console.log(`[Compass] USCO: exception (search function may not be deployed) — ${err}`);
    return null;
  }
}

// ── HathiTrust CRMS cross-validation ──────────────────────────────────────────
// Checks a renewal registration number against the CRMS human-reviewed table.
// Returns true if the renewal was independently verified by a CRMS reviewer.
// Requires crms_verify_renewal() RPC (supabase_crms_setup.sql).

async function crmsVerify(renewalId: string): Promise<boolean> {
  if (!renewalId?.trim()) return false;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("crms_verify_renewal", {
      renewal_id: renewalId.trim(),
    });
    if (error || data === null || data === undefined) {
      console.log(`[Compass] CRMS: check for "${renewalId}" — no result${error ? ` (error: ${error.message})` : ""}`);
      return false;
    }
    let verified = false;
    if (typeof data === "boolean") verified = data;
    else if (Array.isArray(data)) verified = data.length > 0;
    else verified = !!data;

    console.log(`[Compass] CRMS: "${renewalId}" — ${verified ? "✓ VERIFIED by human reviewer" : "not in CRMS"}`);
    return verified;
  } catch (err) {
    console.log(`[Compass] CRMS: exception checking "${renewalId}" — ${err}`);
    return false;
  }
}

// ── Wikidata author death-date lookup ─────────────────────────────────────────
// Used for unpublished works where copyright term = life of author + 70 years.
// Two-step: entity search by name → entity fetch → parse P31 (human) + P570 (death date).

const WIKIDATA_USER_AGENT =
  "CopyrightNexus/1.0 (https://copyright-nexus.com; copyright research tool)";

async function lookupWikidata(authorName: string): Promise<WikidataResult> {
  const NOT_FOUND: WikidataResult = {
    authorName,
    wikidataId: null,
    found: false,
    deathYear: null,
    deathDate: null,
    copyrightExpiry: null,
    likelyAlive: false,
    entityDescription: null,
    lowConfidenceMatch: false,
  };

  // Terms that indicate the Wikidata entity is a writer / creator.
  // If the entity description contains NONE of these, the match may be a
  // different person with the same name (e.g. a politician, athlete, etc.).
  const WRITING_TERMS =
    /author|writer|novelist|poet|playwright|dramatist|essayist|journalist|journalist|biographer|diarist|screenwriter|lyricist|librettist|critic|columnist|editor|publisher|literary|fiction|non-fiction|nonfiction|prose|verse|story|stories|memoir|correspondence/i;

  if (!authorName?.trim()) return NOT_FOUND;

  console.log(`[Compass] Wikidata: querying for author "${authorName}"`);

  try {
    // Step 1: Search for entity by author name
    const searchUrl = new URL("https://www.wikidata.org/w/api.php");
    searchUrl.searchParams.set("action", "wbsearchentities");
    searchUrl.searchParams.set("search", authorName.trim());
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("type", "item");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("limit", "5");

    const searchResp = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": WIKIDATA_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!searchResp.ok) return NOT_FOUND;

    const searchData = await searchResp.json();
    const candidates: { id: string; description?: string }[] = searchData.search ?? [];
    if (!candidates.length) {
      console.log(`[Compass] Wikidata: no entity found for "${authorName}"`);
      return NOT_FOUND;
    }

    // Step 2: Check up to 3 candidates — find one that is a human (P31=Q5)
    for (const candidate of candidates.slice(0, 3)) {
      const qid = candidate.id;
      const entityDescription = candidate.description ?? null;

      const entityResp = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
        {
          headers: { "User-Agent": WIKIDATA_USER_AGENT },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!entityResp.ok) continue;

      const entityData = await entityResp.json();
      const entity = entityData.entities?.[qid];
      if (!entity?.claims) continue;

      // Must be instance of human (P31 → Q5)
      const isHuman = (entity.claims.P31 ?? []).some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.mainsnak?.datavalue?.value?.id === "Q5"
      );
      if (!isHuman) continue;

      // Date of death: P570
      const deathClaims = entity.claims.P570 ?? [];
      const lowConfidenceMatch =
        !!entityDescription && !WRITING_TERMS.test(entityDescription);

      if (lowConfidenceMatch) {
        console.log(`[Compass] Wikidata: ${qid} description "${entityDescription}" — NOT writing-related, flagging low-confidence`);
      }

      if (!deathClaims.length) {
        // Person found in Wikidata but no death date → likely still alive
        console.log(`[Compass] Wikidata: found ${qid} for "${authorName}" — description: "${entityDescription ?? "none"}" — no death date, likely still living → IN COPYRIGHT${lowConfidenceMatch ? " (LOW CONFIDENCE — check description)" : ""}`);
        return {
          authorName,
          wikidataId: qid,
          found: true,
          deathYear: null,
          deathDate: null,
          copyrightExpiry: null,
          likelyAlive: true,
          entityDescription,
          lowConfidenceMatch,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deathValue = deathClaims[0]?.mainsnak?.datavalue?.value as any;
      if (!deathValue?.time) continue;

      // Wikidata time format: "+1961-07-02T00:00:00Z"
      const yearMatch = (deathValue.time as string).match(/[+-]?(\d{4})/);
      if (!yearMatch) continue;

      const deathYear = parseInt(yearMatch[1], 10);
      const expiry = deathYear + 70;
      const currentYear = new Date().getFullYear();
      console.log(
        `[Compass] Wikidata: found ${qid} for "${authorName}" — description: "${entityDescription ?? "none"}" — died ${deathYear} → copyright until Jan 1, ${expiry + 1} — ${currentYear <= expiry ? "IN COPYRIGHT" : "PUBLIC DOMAIN"}${lowConfidenceMatch ? " (LOW CONFIDENCE — check description)" : ""}`
      );
      return {
        authorName,
        wikidataId: qid,
        found: true,
        deathYear,
        deathDate: deathValue.time as string,
        copyrightExpiry: expiry,
        likelyAlive: false,
        entityDescription,
        lowConfidenceMatch,
      };
    }

    console.log(`[Compass] Wikidata: candidates checked but none matched as human with death date for "${authorName}"`);
    return NOT_FOUND;
  } catch (err) {
    // Network error or timeout — fail gracefully
    console.log(`[Compass] Wikidata: exception looking up "${authorName}" — ${err}`);
    return NOT_FOUND;
  }
}

// ── Renewal ID normalizer ──────────────────────────────────────────────────────
// Different databases use inconsistent zero-padding, e.g.:
//   NYPL:  "RE51399"
//   USCO:  "RE0000051399"
// Normalize to the canonical short form (prefix + no leading zeros) so CRMS
// lookups match regardless of which source produced the renewal number.

function normalizeRenewalId(id: string): string {
  const trimmed = id.trim();
  // Match a letter prefix (e.g. RE, R) followed by optional leading zeros and the actual number
  const match = trimmed.match(/^([A-Za-z]+)0*([1-9]\d*)$/);
  if (!match) return trimmed.toUpperCase();
  return `${match[1].toUpperCase()}${match[2]}`;
}

// ── Combined renewal lookup ────────────────────────────────────────────────────
// Runs Stanford + NYPL + USCO in parallel, then CRMS-validates any hits found.

async function performRenewalLookup(
  info: WorkInfo
): Promise<RenewalResult> {
  if (!info.needs_renewal_check || !info.title) {
    console.log(`[Compass] Renewal lookup: skipped (needs_renewal_check=${info.needs_renewal_check}, title=${info.title ?? "null"})`);
    return { applicable: false };
  }
  if (info.year && !(info.year >= 1923 && info.year <= 1963)) {
    console.log(`[Compass] Renewal lookup: skipped (year ${info.year} outside 1923–1963 window)`);
    return { applicable: false };
  }

  console.log(`[Compass] Renewal lookup: querying Stanford + NYPL + USCO for "${info.title}"${info.author ? ` by ${info.author}` : ""}${info.year ? ` (${info.year})` : ""}`);
  // All three renewal databases in parallel
  const [stanford, nypl, usco] = await Promise.all([
    lookupStanford(info.title, info.author, info.year),
    lookupNYPL(info.title, info.author, info.year),
    lookupUSCO(info.title, info.author, info.year),
  ]);

  // CRMS cross-validation — collect all renewal numbers from hits, normalize,
  // and deduplicate so RE51399 and RE0000051399 don't produce two CRMS calls.
  const rawRenewalNumbers = [
    stanford?.renewal_num,
    stanford?.reg_num,
    nypl?.renewal_id,
    usco?.renewal_id,
    usco?.reg_num,
  ].filter((n): n is string => !!n && n.trim().length > 0);

  const renewalNumbers = [...new Set(rawRenewalNumbers.map(normalizeRenewalId))];
  console.log(`[Compass] CRMS: normalized renewal IDs to check: ${renewalNumbers.length > 0 ? renewalNumbers.join(", ") : "none"}`);

  if (renewalNumbers.length > 0) {
    const verifications = await Promise.all(renewalNumbers.map(crmsVerify));
    const anyCrmsVerified = verifications.some(Boolean);

    if (anyCrmsVerified) {
      if (stanford) stanford.crms_verified = true;
      if (nypl) nypl.crms_verified = true;
      if (usco) usco.crms_verified = true;
    }
  }

  const found = !!(stanford || nypl || usco);
  const crmsVerified = !!(
    stanford?.crms_verified || nypl?.crms_verified || usco?.crms_verified
  );
  console.log(
    `[Compass] Renewal summary: ${found ? "FOUND" : "NOT FOUND"} | ` +
    `Stanford=${stanford ? "✓" : "✗"} NYPL=${nypl ? "✓" : "✗"} USCO=${usco ? "✓" : "✗"} | ` +
    `CRMS=${crmsVerified ? "✓ VERIFIED" : "not verified"}`
  );

  return {
    applicable: true,
    found,
    title: info.title,
    author: info.author,
    year: info.year,
    stanford,
    nypl,
    usco,
  };
}

// ── Context formatters ─────────────────────────────────────────────────────────

function formatRenewalContext(renewal: RenewalResult): string {
  if (!renewal.applicable) return "";

  const byline = renewal.author ? ` by ${renewal.author}` : "";
  const publine = renewal.year ? ` (pub. ${renewal.year})` : "";
  const lines = [
    "\n\n--- RENEWAL DATABASE LOOKUP ---",
    `Work: "${renewal.title}"${byline}${publine}`,
    "Sources checked: Stanford Renewal DB + New York Public Library Catalog of Copyright Entries (NYPL CCE) + USCO CPRS",
  ];

  if (renewal.found) {
    lines.push("RESULT: RENEWAL CONFIRMED — Work IS IN COPYRIGHT\n");

    if (renewal.stanford) {
      const s = renewal.stanford;
      const exp = s.expiration_year;
      const crmsTag = s.crms_verified ? " ✓ CRMS-verified" : "";
      lines.push(
        "  [Stanford Renewal DB]" + crmsTag,
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
      const crmsTag = n.crms_verified ? " ✓ CRMS-verified" : "";
      lines.push(
        "  [NYPL CCE Renewals]" + crmsTag,
        `  Matched title:  ${n.title}`,
        `  Original reg:   ${n.oreg} (${n.odat})`,
        `  Renewal:        ${n.renewal_id} (${n.rdat})`,
        `  Claimant:       ${n.claimants ?? "unknown"}`,
        `  Confidence:     ${Math.round(n.similarity * 100)}%`,
        exp ? `  Expires:        January 1, ${exp + 1}` : "  Expires: unknown"
      );
    }

    if (renewal.usco) {
      const u = renewal.usco;
      const exp = u.expiration_year;
      const crmsTag = u.crms_verified ? " ✓ CRMS-verified" : "";
      lines.push(
        "  [USCO CPRS]" + crmsTag,
        `  Matched title:  ${u.title}`,
        `  Reg number:     ${u.reg_num ?? u.renewal_id ?? "unknown"}`,
        `  Registered:     ${u.reg_date ?? "unknown"}`,
        `  Author/Claimant: ${u.claimants ?? u.author ?? "unknown"}`,
        `  Confidence:     ${Math.round(u.similarity * 100)}%`,
        exp ? `  Expires:        January 1, ${exp + 1}` : "  Expires: unknown"
      );
    }

    const crmsVerified = !!(
      renewal.stanford?.crms_verified ||
      renewal.nypl?.crms_verified ||
      renewal.usco?.crms_verified
    );
    if (crmsVerified) {
      lines.push(
        "",
        "  ✓ CRMS NOTE: This renewal is independently confirmed by a human",
        "  reviewer in HathiTrust's Copyright Review Management System.",
        "  Confidence level: HIGH (human-verified)"
      );
    }

    lines.push(
      "\nRights Statement: In Copyright",
      "URI: https://rightsstatements.org/vocab/InC/1.0/"
    );
  } else {
    lines.push(
      "RESULT: NO RENEWAL RECORD FOUND in Stanford, NYPL, or USCO databases.",
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

function formatWikidataContext(wikidata: WikidataResult): string {
  if (!wikidata) return "";

  const currentYear = new Date().getFullYear();
  const entityUrl = wikidata.wikidataId
    ? `https://www.wikidata.org/wiki/${wikidata.wikidataId}`
    : null;

  const lines = ["\n\n--- WIKIDATA BIOGRAPHICAL LOOKUP ---"];
  lines.push(`Author: ${wikidata.authorName}`);
  if (entityUrl) lines.push(`Wikidata entity URL: ${entityUrl}`);

  if (!wikidata.found) {
    lines.push(
      "RESULT: Author not found in Wikidata.",
      "Death date cannot be confirmed automatically.",
      "Copyright term (life + 70 years) cannot be calculated.",
      "Recommend manual research: Wikidata, LC Name Authority File, Wikipedia, obituary databases.",
      "Status: UNDETERMINED until death date is established."
    );
  } else if (wikidata.likelyAlive) {
    lines.push(
      wikidata.entityDescription ? `Entity description: "${wikidata.entityDescription}"` : "",
      "RESULT: Author found in Wikidata — no death date recorded.",
      "Author is likely still living.",
      "Copyright status: IN COPYRIGHT (life + 70 years not yet elapsed).",
      "Rights Statement: In Copyright",
      "URI: https://rightsstatements.org/vocab/InC/1.0/"
    );
    if (wikidata.lowConfidenceMatch) {
      lines.push(
        "",
        "⚠  LOW CONFIDENCE MATCH: The matched Wikidata entity's description does not",
        `   clearly identify this person as an author or writer ("${wikidata.entityDescription}").`,
        "   This may be a different person with the same name.",
        "   Manual verification is strongly recommended before relying on this result."
      );
    }
  } else {
    const pd = wikidata.copyrightExpiry! + 1;
    const inCopyright = currentYear <= wikidata.copyrightExpiry!;
    lines.push(
      wikidata.entityDescription ? `Entity description: "${wikidata.entityDescription}"` : "",
      `RESULT: Death date confirmed — ${wikidata.deathYear}`,
      `Death date (raw): ${wikidata.deathDate}`,
      `Copyright term: ${wikidata.deathYear} + 70 years = expires January 1, ${pd}`,
      `Current status: ${inCopyright ? "IN COPYRIGHT" : "PUBLIC DOMAIN"}`,
      "",
      inCopyright
        ? `Rights Statement: In Copyright\nURI: https://rightsstatements.org/vocab/InC/1.0/`
        : `Rights Statement: No Copyright - United States\nURI: https://rightsstatements.org/vocab/NoC-US/1.0/`
    );
    if (wikidata.lowConfidenceMatch) {
      lines.push(
        "",
        "⚠  LOW CONFIDENCE MATCH: The matched Wikidata entity's description does not",
        `   clearly identify this person as an author or writer ("${wikidata.entityDescription}").`,
        "   This may be a different person with the same name.",
        "   Manual verification is strongly recommended before relying on this result."
      );
    }
  }

  lines.push("--- END WIKIDATA LOOKUP ---");
  return lines.join("\n");
}

// ── Answer generation ──────────────────────────────────────────────────────────

async function generateAnswer(
  question: string,
  chunks: ChunkResult[],
  renewal: RenewalResult,
  wikidata: WikidataResult | null,
  history: ConversationTurn[]
): Promise<string> {
  const openai = getOpenAI();
  const renewalContext = formatRenewalContext(renewal);
  const wikidataContext = wikidata ? formatWikidataContext(wikidata) : "";

  const contextParts = chunks.map(
    (c) => `[Knowledge Base — ${c.chunk_id}]\n${c.content}`
  );
  if (renewalContext) contextParts.push(renewalContext);
  if (wikidataContext) contextParts.push(wikidataContext);
  const context = contextParts.join("\n\n---\n\n");

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are Copyright Compass, an expert AI assistant helping cultural heritage professionals determine copyright status of works in their collections.

## DATA SOURCES AVAILABLE TO YOU

**Renewal databases** (automatically queried for 1923–1963 published works — results in context):
- Stanford Renewal DB: 246k book renewals
- New York Public Library Catalog of Copyright Entries (NYPL CCE): 445k all-class records (1950–1991) — link: https://archive.org/details/copyrightrecords
- USCO CPRS: ~908k RE-prefixed renewal records

**Cross-validation**: When a renewal hit is found, it is automatically checked against the HathiTrust CRMS human-reviewed database. A ✓ CRMS-verified tag means a librarian independently confirmed the renewal — treat these as high-confidence.

**Wikidata** (automatically queried for unpublished works — results in context when applicable):
- Used to look up author death dates and calculate copyright term (life + 70 years)

## HOW TO RESPOND

**Case 1 — General rule question** (e.g., government works, post-1977 works, unpublished works by category):
Answer the applicable rule directly from the provided context. No structured format required.

**Case 2 — Specific work identified AND renewal data is in context:**
Give a definitive determination using this exact markdown format:

**CONFIDENCE:** High / Medium / Low
(Elevate to High if CRMS-verified; note it explicitly)

**REASONING:** [cite renewal record number and database if applicable; concise legal basis]

**ACTION ITEMS:** [genuine remaining steps only — omit this field entirely if status is clear. When present, write as consecutive numbered sentences in plain prose. Do NOT use bullet points, sub-bullets, or indented formatting.]

**RIGHTS STATEMENT:** [RightsStatements.org label]
URI: [full URI]

**Case 3 — Unpublished work AND Wikidata data is in context:**
Give a determination based on the Wikidata death-date result using the same structured format above. If the author was not found in Wikidata, tell the user the status is undetermined and suggest manual research sources.
When providing a Public Domain or In Copyright determination for an unpublished work, always include a scope note after the RIGHTS STATEMENT making clear that this determination applies to the unpublished work only. Example: "⚠ Scope note: This determination applies to unpublished works only. If [author name] also created published works, those works may have different copyright status depending on their publication date and whether copyright was renewed."

**Case 4 — Question involves 1923–1963 range but NO specific title is available:**
Do NOT output "Undetermined" with a list of tasks for the user.
Instead, explain briefly that the answer depends on whether copyright was renewed, and ask for the title so you can check the databases yourself. Keep it to 1–2 sentences.

**Case 5 — Follow-up that provides a title or more detail:**
Use the full conversation history to understand what work is being discussed, then provide a determination using the data now in context.

## RULES
- NEVER tell users to "search the Stanford database," "check the NYPL," or "look up USCO" — that is your job and you do it automatically.
- NEVER tell users to check Wikidata for unpublished works — you query it automatically.
- When mentioning the NYPL renewal database in your response, always write its full name as a markdown hyperlink: [New York Public Library Catalog of Copyright Entries](https://archive.org/details/copyrightrecords). Never abbreviate it to just "NYPL CCE" in the response text.
- When Wikidata death-date data is in context, always cite it explicitly in your REASONING. Use the Wikidata entity URL from context to write a linked attribution, e.g.: "[Author name] died in [year] according to [Wikidata](url)." Follow this immediately with: "Researchers should independently verify this date before relying on this determination."
- When NO RENEWAL RECORD was found: state clearly the work is likely Public Domain (for US works). Include the URAA caveat for potentially foreign works.
- When a RENEWAL WAS FOUND: state clearly the work is In Copyright and give the expiration year.
- When CRMS-verified: explicitly mention this in your reasoning as it represents human confirmation.
- Be direct and concise. Cultural heritage professionals are experienced researchers who need clear determinations, not lengthy explanations of what they should go do.`,
    },
  ];

  for (const turn of history) {
    messages.push({ role: "user", content: turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  }

  messages.push({
    role: "user",
    content: context
      ? `CONTEXT:\n${context}\n\n---\n\nQUESTION: ${question}`
      : question,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages,
  });

  return response.choices[0].message.content ?? "No answer generated.";
}

// ── Status computation ─────────────────────────────────────────────────────────
// Derives the canonical status from structured engine data only — never from GPT text.
// Returns null for general rule questions where no specific determination applies.

function computeStatus(
  renewal: RenewalResult,
  wikidata: WikidataResult | null,
  workYear: number | null
): "in-copyright" | "public-domain" | "undetermined" | null {
  // Renewal window: engine searched the databases and got a definitive answer
  if (renewal.applicable) {
    return renewal.found ? "in-copyright" : "public-domain";
  }

  // Pre-1923: outside the renewal window, always public domain in the US
  if (workYear && workYear < 1923) {
    return "public-domain";
  }

  // Wikidata lookup ran (unpublished work with a named author)
  if (wikidata) {
    // Not found in Wikidata — can't determine status
    if (!wikidata.found) return "undetermined";
    // Found but the match may be the wrong person — treat as undetermined
    if (wikidata.lowConfidenceMatch) return "undetermined";
    // Found, clearly a human, no death date → likely still living
    if (wikidata.likelyAlive) return "in-copyright";
    // Found, death date confirmed → compute against current year
    if (wikidata.deathYear !== null && wikidata.copyrightExpiry !== null) {
      const currentYear = new Date().getFullYear();
      return currentYear <= wikidata.copyrightExpiry ? "in-copyright" : "public-domain";
    }
    // Found but death date couldn't be parsed
    return "undetermined";
  }

  // No structured determination possible (general rule question, post-1963 work, etc.)
  return null;
}

// ── Public entry point ─────────────────────────────────────────────────────────

export async function runQuery(
  question: string,
  history: ConversationTurn[] = []
): Promise<QueryResult> {
  // Build the effective search question — for follow-ups, include prior context
  const searchQuestion =
    history.length > 0
      ? `${history.map((t) => t.question).join(" ")} ${question}`
      : question;

  console.log(`\n[Compass] ── New query ──────────────────────────────────`);
  console.log(`[Compass] Question: "${question.slice(0, 120)}"`);

  // Step 1: Extract work info (determines which lookups to run)
  const workInfo = await extractWorkInfo(question, history);
  console.log(`[Compass] Work info: type=${workInfo.work_type} | title=${workInfo.title ?? "null"} | author=${workInfo.author ?? "null"} | year=${workInfo.year ?? "null"} | renewal_check=${workInfo.needs_renewal_check}`);

  // Step 2: Run all lookups in parallel
  const shouldLookupWikidata =
    workInfo.work_type === "unpublished" && !!workInfo.author;
  console.log(`[Compass] Routing: renewal=${workInfo.needs_renewal_check} | wikidata=${shouldLookupWikidata}`);

  const [chunks, renewal, wikidata] = await Promise.all([
    searchChunks(searchQuestion),
    performRenewalLookup(workInfo),
    shouldLookupWikidata
      ? lookupWikidata(workInfo.author!)
      : Promise.resolve(null),
  ]);

  const needsClarification =
    workInfo.needs_renewal_check &&
    !workInfo.title &&
    !renewal.applicable;

  const status = computeStatus(renewal, wikidata, workInfo.year);
  console.log(`[Compass] Status: ${status ?? "null (general rule — no badge)"}`);

  const answer = await generateAnswer(
    question,
    chunks,
    renewal,
    wikidata,
    history
  );

  return {
    question,
    answer,
    chunks,
    renewal,
    wikidata,
    needs_clarification: needsClarification,
    status,
  };
}
