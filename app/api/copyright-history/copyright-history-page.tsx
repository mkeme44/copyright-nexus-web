"use client";

/**
 * app/copyright-history/page.tsx
 *
 * Copyright History Tool — Copyright Nexus
 *
 * Shows the complete copyright lifecycle for a specific work:
 *   - Publication year and applicable period
 *   - Registration and renewal records from all three databases
 *   - Current status with RightsStatements.org URI
 *   - Visual timeline from publication → (renewal) → today → expiry
 *   - Confidence level and legal basis
 *
 * Brand: navy #1e3a5f · periwinkle #7480d4
 * Fonts: Libre Baskerville (headings) · Source Sans 3 (body)
 */

import { useState, useRef } from "react";
import type { CopyrightHistory, RenewalRecord, TimelineEvent } from "@/lib/copyright-history-engine";

// ─────────────────────────────────────────────────────────────────────────────
//  Types we need on the client
// ─────────────────────────────────────────────────────────────────────────────

type StatusColor = "green" | "red" | "amber";

function statusColor(status: string): StatusColor {
  if (status === "Public Domain") return "green";
  if (status === "In Copyright") return "red";
  return "amber";
}

const STATUS_STYLES: Record<StatusColor, { bg: string; text: string; border: string; dot: string }> = {
  green: { bg: "#e8f5ee", text: "#1a5c38", border: "#a3d9b8", dot: "#2d9e5f" },
  red:   { bg: "#fdecea", text: "#8b1a1a", border: "#f5aeae", dot: "#c0392b" },
  amber: { bg: "#fef8e6", text: "#7a5c0a", border: "#f0d78a", dot: "#c9920d" },
};

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  publication: { bg: "#1e3a5f", text: "#ffffff", border: "#1e3a5f" },
  registration: { bg: "#2a4f82", text: "#ffffff", border: "#2a4f82" },
  renewal:      { bg: "#7480d4", text: "#ffffff", border: "#7480d4" },
  lapse:        { bg: "#c0392b", text: "#ffffff", border: "#c0392b" },
  today:        { bg: "#4a4a5a", text: "#ffffff", border: "#4a4a5a" },
  expiry:       { bg: "#e8f5ee", text: "#1a5c38", border: "#2d9e5f" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  const s = STATUS_STYLES[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: "3px",
        padding: "3px 10px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function ConfidencePill({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    High:   { bg: "#e8f5ee", text: "#1a5c38" },
    Medium: { bg: "#fef8e6", text: "#7a5c0a" },
    Low:    { bg: "#fdecea", text: "#8b1a1a" },
  };
  const c = colors[level] ?? colors["Medium"];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: "2px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {level} confidence
    </span>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;
  const minYear = events[0].year;
  const maxYear = events[events.length - 1].year;
  const span = maxYear - minYear || 1;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Year rail */}
      <div
        style={{
          position: "relative",
          height: 2,
          background: "#ddd8d0",
          borderRadius: 1,
          margin: "32px 0 48px",
        }}
      >
        {events.map((ev, i) => {
          const pct = ((ev.year - minYear) / span) * 100;
          const ec = EVENT_COLORS[ev.type] ?? EVENT_COLORS["today"];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: ev.isToday ? 14 : 10,
                  height: ev.isToday ? 14 : 10,
                  borderRadius: "50%",
                  background: ec.bg,
                  border: `2px solid ${ec.border}`,
                  margin: "0 auto",
                  position: "relative",
                  zIndex: 2,
                }}
              />
              {/* Label below */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  textAlign: "center",
                  minWidth: 80,
                  maxWidth: 120,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1e3a5f",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.year}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#555",
                    lineHeight: 1.3,
                    marginTop: 2,
                  }}
                >
                  {ev.event}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RenewalRecordCard({ rec }: { rec: RenewalRecord }) {
  const sourceColors: Record<string, string> = {
    Stanford: "#7480d4",
    NYPL:     "#2a6099",
    USCO:     "#1e3a5f",
  };
  return (
    <div
      style={{
        border: "1px solid #ddd8d0",
        borderLeft: `4px solid ${sourceColors[rec.source] ?? "#7480d4"}`,
        borderRadius: "0 4px 4px 0",
        padding: "14px 16px",
        background: "#fafaf8",
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: sourceColors[rec.source] ?? "#7480d4",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {rec.source}
        </span>
        <span style={{ color: "#777", fontSize: 11 }}>
          {(rec.similarity * 100).toFixed(0)}% match
        </span>
      </div>
      <div style={{ color: "#1a1a2e", fontWeight: 600, marginBottom: 6 }}>
        {rec.matchedTitle}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {rec.originalRegNum && (
          <>
            <span style={{ color: "#666" }}>Original reg</span>
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {rec.originalRegNum}{rec.originalRegDate ? ` (${rec.originalRegDate})` : ""}
            </span>
          </>
        )}
        {rec.renewalNum && (
          <>
            <span style={{ color: "#666" }}>Renewal</span>
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {rec.renewalNum}{rec.renewalDate ? ` (${rec.renewalDate})` : ""}
            </span>
          </>
        )}
        {rec.authorOrClaimant && (
          <>
            <span style={{ color: "#666" }}>Claimant</span>
            <span>{rec.authorOrClaimant.split(";")[0].trim()}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CopyrightHistoryPage() {
  const [titleInput, setTitleInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyrightHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function handleSearch() {
    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/copyright-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          author: authorInput.trim() || undefined,
          pubYear: yearInput.trim() ? parseInt(yearInput.trim(), 10) : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const data: CopyrightHistory = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  const cs = result?.copyrightStatus;
  const color = cs ? statusColor(cs.status) : "amber";
  const ss = STATUS_STYLES[color];

  return (
    <div
      style={{
        fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
        background: "#f4f2ed",
        minHeight: "100vh",
        color: "#1a1a2e",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "#1e3a5f",
          borderBottom: "3px solid #7480d4",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            Copyright Nexus
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#7480d4",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Copyright History
          </div>
        </div>
        {/* Tool nav */}
        <nav style={{ display: "flex", gap: 6 }}>
          {[
            { label: "Compass", href: "/compass", desc: "AI Chat" },
            { label: "Navigator", href: "/navigator", desc: "Decision Tree" },
            { label: "History", href: "/copyright-history", desc: "Record Lookup", active: true },
          ].map((t) => (
            <a
              key={t.label}
              href={t.href}
              style={{
                padding: "6px 14px",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: t.active ? 700 : 500,
                color: t.active ? "#1e3a5f" : "#a0b4cc",
                background: t.active ? "#ffffff" : "transparent",
                textDecoration: "none",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
                border: t.active ? "none" : "1px solid transparent",
              }}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── Hero / search ───────────────────────────────────────────────── */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #ddd8d0",
          padding: "40px 40px 32px",
          maxWidth: 840,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#1e3a5f",
            margin: "0 0 6px",
            lineHeight: 1.2,
          }}
        >
          Copyright History Lookup
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#555",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          Enter a work's title to retrieve its complete copyright record —
          from initial registration through renewal (or lapse) to current status
          and projected public domain date.
        </p>

        {/* Search form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Title (wide) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "2 1 260px" }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#555",
                }}
              >
                Title *
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. The Old Man and the Sea"
                style={{
                  border: "1.5px solid #ccc8c0",
                  borderRadius: 3,
                  padding: "10px 13px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  color: "#1a1a2e",
                  background: "#fafaf8",
                  outline: "none",
                }}
              />
            </div>
            {/* Author */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 170px" }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#555",
                }}
              >
                Author
              </label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Hemingway"
                style={{
                  border: "1.5px solid #ccc8c0",
                  borderRadius: 3,
                  padding: "10px 13px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  color: "#1a1a2e",
                  background: "#fafaf8",
                  outline: "none",
                }}
              />
            </div>
            {/* Year */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "0 1 110px" }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#555",
                }}
              >
                Pub. Year
              </label>
              <input
                type="number"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 1952"
                min={1800}
                max={new Date().getFullYear()}
                style={{
                  border: "1.5px solid #ccc8c0",
                  borderRadius: 3,
                  padding: "10px 13px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  color: "#1a1a2e",
                  background: "#fafaf8",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !titleInput.trim()}
            style={{
              alignSelf: "flex-start",
              background: loading || !titleInput.trim() ? "#8a9fb5" : "#1e3a5f",
              color: "#ffffff",
              border: "none",
              borderRadius: 3,
              padding: "11px 28px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: loading || !titleInput.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Searching databases…" : "Search Copyright Records"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#fdecea",
              border: "1px solid #f5aeae",
              borderRadius: 3,
              color: "#8b1a1a",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </section>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {result && cs && (
        <div
          ref={resultRef}
          style={{ maxWidth: 840, margin: "0 auto", padding: "32px 40px" }}
        >

          {/* Work header */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ddd8d0",
              borderTop: `4px solid ${ss.dot}`,
              borderRadius: "0 0 4px 4px",
              padding: "24px 28px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1e3a5f",
                    margin: "0 0 4px",
                  }}
                >
                  "{result.query.title}"
                </h2>
                {result.query.author && (
                  <div style={{ fontSize: 14, color: "#555" }}>
                    {result.query.author}
                  </div>
                )}
              </div>
              <StatusBadge status={cs.status} />
            </div>

            {/* Key facts row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "12px 24px",
                padding: "16px 0",
                borderTop: "1px solid #eee",
                borderBottom: "1px solid #eee",
                marginBottom: 16,
              }}
            >
              {[
                { label: "Publication Year", value: result.pubYear?.toString() ?? "Unknown" },
                { label: "Period", value: result.periodLabel },
                { label: "Renewed", value: result.renewed === true ? "Yes" : result.renewed === false ? "No" : "N/A" },
                { label: "Expiration", value: cs.expiresYear?.toString() ?? "See notes" },
                { label: "Rights Statement", value: cs.rightsStatement },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#888",
                      marginBottom: 3,
                    }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Legal notes */}
            <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <ConfidencePill level={cs.confidence} />
                <span>{cs.notes}</span>
              </div>
              {cs.warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "#fef8e6",
                    border: "1px solid #f0d78a",
                    borderRadius: 3,
                    color: "#7a5c0a",
                    fontSize: 12,
                  }}
                >
                  ⚠ {w}
                </div>
              ))}
            </div>

            {/* URI */}
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                background: "#f4f2ed",
                borderRadius: 3,
                fontSize: 12,
                color: "#555",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700 }}>RightsStatements.org URI:</span>
              <a
                href={cs.uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#7480d4", fontFamily: "monospace", fontSize: 11 }}
              >
                {cs.uri}
              </a>
            </div>
          </div>

          {/* Timeline */}
          {result.timeline.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #ddd8d0",
                borderRadius: 4,
                padding: "24px 28px",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e3a5f",
                  margin: "0 0 4px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Copyright Timeline
              </h3>
              <p style={{ fontSize: 12, color: "#777", margin: "0 0 8px" }}>
                {result.periodRule}
              </p>
              <Timeline events={result.timeline} />

              {/* Event list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 16,
                  borderTop: "1px solid #eee",
                  paddingTop: 16,
                }}
              >
                {result.timeline.map((ev, i) => {
                  const ec = EVENT_COLORS[ev.type] ?? EVENT_COLORS["today"];
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 44,
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1e3a5f",
                          paddingTop: 2,
                        }}
                      >
                        {ev.year}
                      </div>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: ec.border,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
                          {ev.event}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                          {ev.detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Renewal records */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ddd8d0",
              borderRadius: 4,
              padding: "24px 28px",
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#1e3a5f",
                margin: "0 0 4px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Renewal Database Records
            </h3>
            <p style={{ fontSize: 12, color: "#777", margin: "0 0 14px" }}>
              Searched: Stanford (246k records) · NYPL CCE (591k records) · USCO (~908k records)
            </p>

            {result.renewalRecords.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.renewalRecords.map((rec, i) => (
                  <RenewalRecordCard key={i} rec={rec} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px 18px",
                  background: result.pubYear && result.pubYear >= 1923 && result.pubYear <= 1963
                    ? "#e8f5ee"
                    : "#f4f2ed",
                  border: `1px solid ${result.pubYear && result.pubYear >= 1923 && result.pubYear <= 1963
                    ? "#a3d9b8"
                    : "#ddd8d0"}`,
                  borderRadius: 3,
                  fontSize: 13,
                  color: result.pubYear && result.pubYear >= 1923 && result.pubYear <= 1963
                    ? "#1a5c38"
                    : "#555",
                }}
              >
                {result.pubYear && result.pubYear >= 1923 && result.pubYear <= 1963
                  ? "✓ No renewal records found in any database. Approximately 93% of books from 1930–1963 were not renewed. This strongly suggests the copyright was never renewed and the work is in the public domain."
                  : result.pubYear && result.pubYear >= 1964 && result.pubYear <= 1977
                  ? "Renewal research is not required for works published 1964–1977. Renewal was made automatic by the Copyright Renewal Act of 1992."
                  : result.pubYear && result.pubYear >= 1978
                  ? "Renewal research is not applicable for works published after 1977."
                  : "Enter a publication year to determine whether renewal research applies."}
              </div>
            )}
          </div>

          {/* Research links */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ddd8d0",
              borderRadius: 4,
              padding: "20px 28px",
            }}
          >
            <h3
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#1e3a5f",
                margin: "0 0 12px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Verify Independently
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.researchLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    background: "#f4f2ed",
                    border: "1px solid #ddd8d0",
                    borderRadius: 3,
                    fontSize: 12,
                    color: "#1e3a5f",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div
          style={{
            maxWidth: 840,
            margin: "48px auto",
            padding: "0 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              marginBottom: 12,
              opacity: 0.3,
            }}
          >
            📚
          </div>
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7 }}>
            Enter a title above to retrieve the complete copyright history.
            <br />
            Adding author and publication year significantly improves match accuracy.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              ["The Old Man and the Sea", "Hemingway", "1952"],
              ["Gone with the Wind", "Mitchell", "1936"],
              ["Invisible Man", "Ellison", "1952"],
              ["Grapes of Wrath", "Steinbeck", "1939"],
            ].map(([t, a, y]) => (
              <button
                key={t}
                onClick={() => {
                  setTitleInput(t);
                  setAuthorInput(a);
                  setYearInput(y);
                }}
                style={{
                  padding: "6px 14px",
                  background: "#ffffff",
                  border: "1px solid #ddd8d0",
                  borderRadius: 3,
                  fontSize: 12,
                  color: "#555",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
