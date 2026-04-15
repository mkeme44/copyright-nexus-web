/**
 * copyright-history-engine.ts
 *
 * Pure TypeScript copyright duration logic for the Copyright History tool.
 * No LLM involved — all rules are deterministic from US copyright law.
 *
 * Place at: lib/copyright-history-engine.ts
 *
 * Works in concert with three Supabase RPC functions:
 *   search_renewals        → Stanford DB (246k book renewals, pubs 1923–1963)
 *   search_nypl_renewals   → NYPL CCE (all classes, 1950–1991)
 *   search_usco_renewals   → USCO (~908k RE-prefixed records)
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export type CopyrightStatus = "Public Domain" | "In Copyright" | "Undetermined";

export type RightsURI =
  | "https://rightsstatements.org/vocab/NoC-US/1.0/"
  | "https://rightsstatements.org/vocab/InC/1.0/"
  | "https://rightsstatements.org/vocab/UND/1.0/"
  | "https://rightsstatements.org/vocab/InC-RUU/1.0/";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type TimelineEventType =
  | "publication"
  | "registration"
  | "renewal"
  | "lapse"
  | "today"
  | "expiry";

export interface TimelineEvent {
  year: number;
  event: string;
  detail: string;
  type: TimelineEventType;
  isToday?: boolean;
}

export interface CopyrightStatusResult {
  status: CopyrightStatus;
  rightsStatement: string;
  uri: RightsURI;
  /** Human-readable expiration label */
  expiresLabel: string | null;
  /** Numeric year copyright expires (or expired), null if unknown */
  expiresYear: number | null;
  /** Year work enters (or entered) public domain */
  publicDomainYear: number | null;
  confidence: ConfidenceLevel;
  notes: string;
  /** Array of warnings (URAA, etc.) */
  warnings: string[];
}

export interface RenewalRecord {
  source: "Stanford" | "NYPL" | "USCO";
  matchedTitle: string;
  authorOrClaimant: string;
  originalRegNum: string | null;
  originalRegDate: string | null;
  renewalNum: string | null;
  renewalDate: string | null;
  pubYear: number | null;
  renewalYear: number | null;
  similarity: number;
}

export interface CopyrightHistory {
  /** Normalised query inputs */
  query: {
    title: string;
    author: string | null;
    pubYearHint: number | null;
  };
  /** Best-determined publication year (from records or hint) */
  pubYear: number | null;
  /** Applicable copyright period label */
  periodLabel: string;
  /** Plain-English rule for this period */
  periodRule: string;
  /** True = renewal confirmed; false = searched, not found; null = not applicable */
  renewed: boolean | null;
  /** Year renewal was filed, if known */
  renewalYear: number | null;
  /** All renewal records found across sources */
  renewalRecords: RenewalRecord[];
  /** Which source databases returned at least one record */
  sourcesWithHits: string[];
  /** Deterministic status result */
  copyrightStatus: CopyrightStatusResult;
  /** Ordered timeline for display */
  timeline: TimelineEvent[];
  /** Research link targets */
  researchLinks: { label: string; url: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Fetch the first publication year for a title from Open Library.
 * Returns null on timeout (4 s default), network error, or no match — never throws.
 *
 * Priority in the pub-year chain: user hint → Open Library → null.
 * Supabase renewal records are NEVER used to derive pub year (they are used only
 * for renewal lookup). Using records for pub year derivation creates self-reinforcing
 * false positives when a later edition of a work scores high title similarity.
 *
 * Title validation: OL's author search is fuzzy — searching "Fitzgerald" can return
 * works like "This Side of Paradise" (1920) before "The Great Gatsby" (1925).
 * We scan up to 5 results and return the year only from a doc whose title
 * closely matches the search title (≥80 % of non-trivial words in common).
 */
export async function fetchOpenLibraryYear(
  title: string,
  author: string | null,
  timeoutMs = 4000
): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const qs = new URLSearchParams({
      title,
      fields: "first_publish_year,title",
      limit: "5",
    });
    if (author) qs.set("author", author);

    const res = await fetch(`https://openlibrary.org/search.json?${qs.toString()}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CopyrightNexus/1.0 (crnexus.org; copyright research tool)",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const json = await res.json() as { docs?: { first_publish_year?: number; title?: string }[] };
    const docs = json?.docs ?? [];
    if (!docs.length) return null;

    // Normalize a title: lowercase, strip leading articles, strip non-alphanumeric.
    const normalizeTitle = (t: string): string =>
      t.toLowerCase()
        .replace(/^(the|a|an)\s+/i, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

    const searchNorm = normalizeTitle(title);
    // Words longer than 2 characters are meaningful for matching.
    const searchWords = searchNorm.split(/\s+/).filter((w) => w.length > 2);

    const currentYearNow = new Date().getFullYear();

    for (const doc of docs) {
      const docNorm = normalizeTitle(doc.title ?? "");

      // Require at least 80 % of the search's meaningful words to appear in the doc title.
      // This prevents "Fitzgerald" searches from matching unrelated Fitzgerald titles.
      if (searchWords.length > 0) {
        const matchCount = searchWords.filter((w) => docNorm.includes(w)).length;
        const matchRatio = matchCount / searchWords.length;
        if (matchRatio < 0.8) continue;
      }

      const year = doc.first_publish_year;
      if (typeof year === "number" && year >= 1800 && year <= currentYearNow) {
        return year;
      }
    }

    return null;
  } catch {
    // Timeout, network error, JSON parse failure — degrade gracefully.
    return null;
  }
}

function buildResearchLinks(
  title: string,
  author: string | null
): { label: string; url: string }[] {
  const olUrl = `https://openlibrary.org/search?title=${encodeURIComponent(title)}${
    author ? `&author=${encodeURIComponent(author)}` : ""
  }`;
  return [
    { label: "Open Library", url: olUrl },
    { label: "Stanford Copyright Renewals", url: "https://exhibits.stanford.edu/copyrightrenewals" },
    { label: "NYPL CCE Search", url: "https://cce-search.nypl.org/" },
    { label: "USCO Public Records (CPRS)", url: "https://publicrecords.copyright.gov/" },
    { label: "Copyright Office Catalog", url: "https://cocatalog.loc.gov/" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Period classification
// ─────────────────────────────────────────────────────────────────────────────

function getPeriodLabel(pubYear: number): string {
  const pdCutoff = new Date().getFullYear() - 96;
  if (pubYear <= pdCutoff) return `Pre-${pdCutoff + 1}`;
  if (pubYear <= 1963) return "1930–1963";
  if (pubYear <= 1977) return "1964–1977";
  if (pubYear <= 1989) return "1978–1989";
  return "1989–present";
}

function getPeriodRule(pubYear: number): string {
  const pdCutoff = new Date().getFullYear() - 96;
  if (pubYear <= pdCutoff)
    return `Maximum 95-year term has expired. Works published in ${pdCutoff} or earlier are in the public domain.`;
  if (pubYear <= 1963)
    return "Copyright notice required + renewal required in 28th year. ~93% of works were not renewed.";
  if (pubYear <= 1977)
    return "Copyright notice required. Renewal was made automatic by the Copyright Renewal Act of 1992.";
  if (pubYear <= 1989)
    return "Copyright notice required (5-year cure window existed). No renewal required.";
  return "No formalities required — copyright is automatic upon creation.";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Core status determination
// ─────────────────────────────────────────────────────────────────────────────

export function determineStatus(
  pubYear: number | null,
  renewed: boolean | null,
  renewalYear: number | null,
  hasNotice?: boolean | null
): CopyrightStatusResult {
  const noPublicationYear: CopyrightStatusResult = {
    status: "Undetermined",
    rightsStatement: "Copyright Undetermined",
    uri: "https://rightsstatements.org/vocab/UND/1.0/",
    expiresLabel: null,
    expiresYear: null,
    publicDomainYear: null,
    confidence: "Low",
    notes:
      "Publication year unknown. Provide a year for a definitive determination.",
    warnings: [],
  };

  if (pubYear === null) return noPublicationYear;

  // ── Rolling public domain cutoff ─────────────────────────────────────────
  // Works published in (currentYear − 96) or earlier have had their 95-year
  // maximum term expire. This boundary advances every January 1 — never
  // hardcode a year here. Matches the formula used in the Compass engine.
  const currentYear = new Date().getFullYear();
  const pdCutoff = currentYear - 96; // e.g. 2026 − 96 = 1930
  if (pubYear <= pdCutoff) {
    const exp = pubYear + 95;
    return {
      status: "Public Domain",
      rightsStatement: "No Copyright – United States",
      uri: "https://rightsstatements.org/vocab/NoC-US/1.0/",
      expiresLabel: `Expired January 1, ${exp + 1}`,
      expiresYear: exp + 1,
      publicDomainYear: exp + 1,
      confidence: "High",
      notes: `Published in ${pubYear}. The maximum 95-year term (${pubYear} + 95 = ${exp}) expired on January 1, ${exp + 1}.`,
      warnings: [],
    };
  }

  // ── Renewal window (rolling lower bound through 1963) ────────────────────
  if (pubYear <= 1963) {
    if (hasNotice === false) {
      return {
        status: "Public Domain",
        rightsStatement: "No Copyright – United States",
        uri: "https://rightsstatements.org/vocab/NoC-US/1.0/",
        expiresLabel: "Expired (no copyright notice on publication)",
        expiresYear: null,
        publicDomainYear: pubYear,
        confidence: "High",
        notes:
          "Copyright notice was mandatory for works published in this period. " +
          "Absence of notice caused immediate forfeiture of copyright.",
        warnings: [],
      };
    }

    if (renewed === true) {
      const exp = pubYear + 95;
      const inCopyright = CURRENT_YEAR <= exp;
      return {
        status: inCopyright ? "In Copyright" : "Public Domain",
        rightsStatement: inCopyright
          ? "In Copyright"
          : "No Copyright – United States",
        uri: inCopyright
          ? "https://rightsstatements.org/vocab/InC/1.0/"
          : "https://rightsstatements.org/vocab/NoC-US/1.0/",
        expiresLabel: `${inCopyright ? "Expires" : "Expired"} January 1, ${exp + 1}`,
        expiresYear: exp + 1,
        publicDomainYear: exp + 1,
        confidence: "High",
        notes:
          `Renewal confirmed${renewalYear ? ` (filed ${renewalYear})` : ""}. ` +
          `95-year term: ${pubYear} + 95 = ${exp}.`,
        warnings:
          pubYear >= 1928
            ? [
                "URAA Caveat: If this work was first published outside the United States, " +
                  "the Uruguay Round Agreements Act (1994) may have retroactively restored copyright. " +
                  "Verify country of first publication.",
              ]
            : [],
      };
    }

    if (renewed === false) {
      const initialExp = pubYear + 28;
      return {
        status: "Public Domain",
        rightsStatement: "No Copyright – United States",
        uri: "https://rightsstatements.org/vocab/NoC-US/1.0/",
        expiresLabel: `Expired January 1, ${initialExp + 1} (non-renewal)`,
        expiresYear: initialExp + 1,
        publicDomainYear: initialExp + 1,
        confidence: "High",
        notes:
          "No renewal record found in Stanford, NYPL, or USCO databases. " +
          `Copyright lapsed after the 28-year initial term (expired January 1, ${initialExp + 1}). ` +
          "Approximately 93% of books from this era were not renewed.",
        warnings:
          pubYear >= 1928
            ? [
                "URAA Caveat: If this work was first published outside the United States, " +
                  "verify country of first publication before concluding public domain.",
              ]
            : [],
      };
    }

    // Renewal status not yet determined
    return {
      status: "Undetermined",
      rightsStatement: "Copyright Undetermined",
      uri: "https://rightsstatements.org/vocab/UND/1.0/",
      expiresLabel: null,
      expiresYear: null,
      publicDomainYear: null,
      confidence: "Low",
      notes:
        "Renewal status unknown. Search the Stanford, NYPL, and USCO renewal databases. " +
        "If no renewal is found after a thorough search, this work is very likely in the public domain.",
      warnings: [],
    };
  }

  // ── 1964–1977: notice required, renewal automatic ───────────────────────
  if (pubYear <= 1977) {
    if (hasNotice === false) {
      return {
        status: "Public Domain",
        rightsStatement: "No Copyright – United States",
        uri: "https://rightsstatements.org/vocab/NoC-US/1.0/",
        expiresLabel: "Expired (no copyright notice on publication)",
        expiresYear: null,
        publicDomainYear: pubYear,
        confidence: "High",
        notes:
          "Copyright notice was mandatory for works published through 1977. " +
          "Absence of notice caused immediate forfeiture of copyright.",
        warnings: [],
      };
    }
    const exp = pubYear + 95;
    const inCopyright = CURRENT_YEAR <= exp;
    return {
      status: inCopyright ? "In Copyright" : "Public Domain",
      rightsStatement: inCopyright
        ? "In Copyright"
        : "No Copyright – United States",
      uri: inCopyright
        ? "https://rightsstatements.org/vocab/InC/1.0/"
        : "https://rightsstatements.org/vocab/NoC-US/1.0/",
      expiresLabel: `${inCopyright ? "Expires" : "Expired"} January 1, ${exp + 1}`,
      expiresYear: exp + 1,
      publicDomainYear: exp + 1,
      confidence: "High",
      notes:
        "Renewal was made automatic by the Copyright Renewal Act of 1992. " +
        `95-year term from publication: ${pubYear} + 95 = ${exp}.`,
      warnings: [],
    };
  }

  // ── 1978–Feb 28 1989: notice required, no renewal ───────────────────────
  if (pubYear <= 1989) {
    const expWFH = pubYear + 95;
    return {
      status: "In Copyright",
      rightsStatement: "In Copyright",
      uri: "https://rightsstatements.org/vocab/InC/1.0/",
      expiresLabel:
        `Works for hire: expires January 1, ${expWFH + 1}. ` +
        "Individual authors: expires 70 years after the author's death.",
      expiresYear: expWFH + 1,
      publicDomainYear: expWFH + 1,
      confidence: "High",
      notes:
        "Copyright automatic under the 1976 Act. No renewal required. " +
        "Notice was still required until March 1, 1989 — " +
        "a 5-year cure window existed if notice was omitted. " +
        "Consult registration records if notice is absent.",
      warnings: [],
    };
  }

  // ── March 1989+: no formalities required ────────────────────────────────
  const expWFH = pubYear + 95;
  return {
    status: "In Copyright",
    rightsStatement: "In Copyright",
    uri: "https://rightsstatements.org/vocab/InC/1.0/",
    expiresLabel:
      `Works for hire: expires January 1, ${expWFH + 1}. ` +
      "Individual authors: expires 70 years after the author's death.",
    expiresYear: expWFH + 1,
    publicDomainYear: expWFH + 1,
    confidence: "High",
    notes:
      "Copyright is automatic — no notice, registration, or renewal required. " +
      "Term: life of author + 70 years (individual), " +
      "or 95 years from publication / 120 years from creation for corporate works.",
    warnings: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Timeline builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildTimeline(
  pubYear: number | null,
  renewed: boolean | null,
  renewalYear: number | null,
  renewalRecords: RenewalRecord[],
  status: CopyrightStatusResult,
  title: string
): TimelineEvent[] {
  if (!pubYear) return [];

  const events: TimelineEvent[] = [];

  // Publication — combined with term-start since they always share the same year
  let pubDetail: string;
  if (pubYear < 1930) {
    pubDetail = "Work published; 95-year maximum term begins.";
  } else if (pubYear <= 1963) {
    pubDetail = "Initial 28-year copyright term begins.";
  } else if (pubYear <= 1977) {
    pubDetail = "Initial 28-year copyright term begins. Renewal automatic per the Copyright Renewal Act of 1992.";
  } else {
    pubDetail = "Work first published in the United States.";
  }
  events.push({
    year: pubYear,
    event: "First Publication",
    detail: pubDetail,
    type: "publication",
  });

  // Renewal or lapse (1930–1963 only)
  if (pubYear >= 1930 && pubYear <= 1963) {
    const renewalWindowStart = pubYear + 27;
    const renewalWindowEnd = pubYear + 28;
    const extensionYears = 95 - 28; // always 67

    if (renewed === true && renewalYear) {
      const bestRecord = renewalRecords[0];
      const claimant =
        bestRecord?.authorOrClaimant
          ?.split(";")[0]
          ?.trim()
          ?.split("|")[0]
          ?.trim() || "rights holder";
      events.push({
        year: renewalYear,
        event: "Renewal Filed",
        detail: `"${title}" renewed by ${claimant}, extending copyright for another ${extensionYears} years.`,
        type: "renewal",
      });
    } else if (renewed === false) {
      events.push({
        year: renewalWindowEnd + 1,
        event: "Copyright Lapsed",
        detail: `No renewal filed during ${renewalWindowStart}–${renewalWindowEnd}. Copyright forfeited; work entered public domain.`,
        type: "lapse",
      });
    } else {
      events.push({
        year: renewalWindowStart,
        event: "Renewal Window",
        detail: `Renewal would have been required between ${renewalWindowStart}–${renewalWindowEnd}.`,
        type: "renewal",
      });
    }
  }

  // Today marker (only if still in copyright)
  if (status.status === "In Copyright") {
    events.push({
      year: CURRENT_YEAR,
      event: "Today",
      detail: "Still protected by copyright.",
      type: "today",
      isToday: true,
    });
  }

  // Expiry / public domain entry
  if (status.expiresYear) {
    if (status.status === "Public Domain" && status.expiresYear <= CURRENT_YEAR) {
      events.push({
        year: status.expiresYear,
        event: `January 1, ${status.expiresYear} — Entered Public Domain`,
        detail: status.notes.split(".")[0] + ".",
        type: "expiry",
      });
    } else if (status.expiresYear > CURRENT_YEAR) {
      const yearsLeft = status.expiresYear - CURRENT_YEAR;
      events.push({
        year: status.expiresYear,
        event: `January 1, ${status.expiresYear} — Enters Public Domain`,
        detail: `Available for unrestricted use in ${yearsLeft} year${yearsLeft !== 1 ? "s" : ""}.`,
        type: "expiry",
      });
    }
  }

  return events.sort((a, b) => a.year - b.year);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Record normaliser (Supabase row → RenewalRecord)
// ─────────────────────────────────────────────────────────────────────────────

export function normaliseRenewalRecord(
  raw: Record<string, unknown>,
  source: "Stanford" | "NYPL" | "USCO"
): RenewalRecord {
  return {
    source,
    matchedTitle: String(raw.title || raw.matched_title || ""),
    authorOrClaimant: String(
      raw.claimant ||
        raw.claimants ||
        raw.author ||
        raw.authors ||
        ""
    ),
    originalRegNum: String(
      raw.reg_num || raw.oreg || raw.registration_number || ""
    ) || null,
    originalRegDate: String(raw.reg_date || raw.odat || raw.pub_date || "") || null,
    renewalNum: String(
      raw.renewal_num || raw.renewal_id || raw.registration_number || ""
    ) || null,
    renewalDate: String(raw.renewal_date || raw.rdat || raw.reg_date || "") || null,
    pubYear: (raw.pub_year as number) || (raw.original_pub_year as number) || null,
    renewalYear:
      (raw.renewal_year as number) || (raw.reg_year as number) || null,
    similarity: (raw.similarity_score as number) || 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main assembler
// ─────────────────────────────────────────────────────────────────────────────

export function assembleCopyrightHistory(params: {
  title: string;
  author: string | null;
  pubYearHint: number | null;
  /** Year fetched from Open Library — used when user provides no hint. */
  openLibraryYear?: number | null;
  stanfordRows: Record<string, unknown>[];
  nyplRows: Record<string, unknown>[];
  uscoRows: Record<string, unknown>[];
}): CopyrightHistory {
  const { title, author, pubYearHint, openLibraryYear = null, stanfordRows, nyplRows, uscoRows } =
    params;

  const SIMILARITY_CUTOFF = 0.45;

  // Normalise and filter by similarity
  const stanfordRecords = stanfordRows
    .filter((r) => (r.similarity_score as number) >= SIMILARITY_CUTOFF)
    .map((r) => normaliseRenewalRecord(r, "Stanford"));
  const nyplRecords = nyplRows
    .filter((r) => (r.similarity_score as number) >= SIMILARITY_CUTOFF)
    .map((r) => normaliseRenewalRecord(r, "NYPL"));
  const uscoRecords = uscoRows
    .filter((r) => (r.similarity_score as number) >= SIMILARITY_CUTOFF)
    .map((r) => normaliseRenewalRecord(r, "USCO"));

  const allRecords = [...stanfordRecords, ...nyplRecords, ...uscoRecords];

  // ── Step 1: Publication year ─────────────────────────────────────────────
  // Priority: user hint (always authoritative) → Open Library → null.
  //
  // Supabase renewal records are intentionally NOT used to derive pub year.
  // Using records for year derivation creates self-reinforcing false positives:
  // a later collected-works edition (e.g. a 1934 omnibus of a 1925 novel) can
  // score very high title similarity and cause the engine to lock onto the wrong
  // year, which then filters out the original edition's renewal records entirely.
  // Renewal records tell us about copyright filings; they do not reliably
  // identify the legally-significant first publication year.
  //
  // Open Library's first_publish_year is fetched with title validation (see
  // fetchOpenLibraryYear) to ensure we get the year for the correct work, not
  // for a different work by the same author.
  //
  // If neither hint nor OL year is available, pubYear remains null and the
  // engine returns Undetermined — prompting the user to provide a year.
  const pubYear: number | null = pubYearHint ?? openLibraryYear ?? null;

  // ── Step 2: Filter to records consistent with the pub year ───────────────
  // Only records whose pubYear is within ±5 years of the known pub year,
  // or whose renewalYear falls in the expected window (pubYear+21 to
  // pubYear+35), are used for renewal determination.
  //
  // ±5 (not ±2) is intentional: Open Library and Supabase data can differ by
  // a few years due to edition variation, and the tighter filter was causing
  // valid records to be excluded. A 10-year window is still narrow enough to
  // prevent cross-contamination between unrelated works.
  const renewalEligibleRecords = pubYear
    ? allRecords.filter((r) => {
        if (r.pubYear) return Math.abs(r.pubYear - pubYear!) <= 5;
        if (r.renewalYear)
          return r.renewalYear >= pubYear! + 21 && r.renewalYear <= pubYear! + 35;
        return false;
      })
    : allRecords;

  // ── Step 3: Renewal determination ────────────────────────────────────────
  // Rolling lower bound matches Compass: currentYear − 96 + 1 (= currentYear − 95).
  // Works below this boundary have already cleared the 95-year term — no
  // renewal check needed and `renewed` stays null (N/A).
  const renewalWindowStart = CURRENT_YEAR - 95; // e.g. 2026 − 95 = 1931
  let renewed: boolean | null = null;
  if (pubYear && pubYear >= renewalWindowStart && pubYear <= 1963) {
    renewed = renewalEligibleRecords.length > 0;
  }

  // Best renewal year (from consistent records only)
  const renewalYears = renewalEligibleRecords
    .map((r) => r.renewalYear)
    .filter((y): y is number => !!y && y >= 1950 && y <= 1995);
  const renewalYear = renewalYears.length > 0 ? Math.min(...renewalYears) : null;

  const copyrightStatus = determineStatus(pubYear, renewed, renewalYear);

  const timeline = buildTimeline(
    pubYear,
    renewed,
    renewalYear,
    renewalEligibleRecords,
    copyrightStatus,
    title
  );

  const sourcesWithHits = [
    stanfordRecords.length > 0 ? "Stanford" : null,
    nyplRecords.length > 0 ? "NYPL" : null,
    uscoRecords.length > 0 ? "USCO" : null,
  ].filter(Boolean) as string[];

  return {
    query: { title, author, pubYearHint },
    pubYear,
    periodLabel: pubYear ? getPeriodLabel(pubYear) : "Unknown",
    periodRule: pubYear ? getPeriodRule(pubYear) : "Publication year required.",
    renewed,
    renewalYear,
    renewalRecords: allRecords,
    sourcesWithHits,
    copyrightStatus,
    timeline,
    researchLinks: buildResearchLinks(title, author),
  };
}
