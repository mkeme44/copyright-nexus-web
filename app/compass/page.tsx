"use client";

import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { useState, useRef, useEffect } from "react";

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-baskerville",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-source-sans",
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface RenewalRecord {
  source: string;
  title: string;
  author?: string;
  claimants?: string;
  claimant?: string;
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
  similarity: number;
  expiration_year?: number;
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

interface ChunkResult {
  chunk_id: string;
  similarity: number;
}

interface QueryResult {
  answer: string;
  chunks: ChunkResult[];
  renewal: RenewalResult;
  question: string;
}

interface HistoryEntry {
  question: string;
  result: QueryResult;
  timestamp: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseStatus(answer: string): {
  status: "public-domain" | "in-copyright" | "undetermined" | null;
  label: string;
} {
  const lower = answer.toLowerCase();
  if (lower.includes("public domain")) return { status: "public-domain", label: "Public Domain" };
  if (lower.includes("in copyright") || lower.includes("copyright protected"))
    return { status: "in-copyright", label: "In Copyright" };
  if (lower.includes("undetermined") || lower.includes("copyright undetermined"))
    return { status: "undetermined", label: "Undetermined" };
  return { status: null, label: "" };
}

function parseConfidence(answer: string): "High" | "Medium" | "Low" | null {
  if (/confidence[:\s]+high/i.test(answer)) return "High";
  if (/confidence[:\s]+medium/i.test(answer)) return "Medium";
  if (/confidence[:\s]+low/i.test(answer)) return "Low";
  return null;
}

const EXAMPLES = [
  "Is 'The Old Man and the Sea' by Hemingway still in copyright?",
  "Can I freely use a book published in 1925?",
  "What about a magazine from 1955 with a copyright notice?",
  "Unpublished letters from someone who died in 1948?",
  "Can I use reports published by a federal government agency?",
];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "public-domain": { bg: "#e1f0ea", color: "#1a5c38", border: "#9fd4b8" },
  "in-copyright":  { bg: "#faeeda", color: "#6b3a00", border: "#f5c47a" },
  "undetermined":  { bg: "#e8eaf8", color: "#2e3480", border: "#a8aee8" },
};

const CONF_STYLES: Record<string, { color: string }> = {
  High:   { color: "#1a5c38" },
  Medium: { color: "#7a5200" },
  Low:    { color: "#8b2500" },
};

// ── Components ─────────────────────────────────────────────────────────────────

function RenewalBadge({ renewal }: { renewal: RenewalResult }) {
  if (!renewal.applicable) return null;

  const byline = renewal.author ? ` by ${renewal.author}` : "";
  const publine = renewal.year ? ` (${renewal.year})` : "";

  return (
    <div
      style={{
        border: "0.5px solid #e0ddd8",
        borderRadius: "6px",
        overflow: "hidden",
        marginTop: "1.25rem",
      }}
    >
      <div
        style={{
          background: "#f2f0ec",
          padding: "0.6rem 1rem",
          borderBottom: "0.5px solid #e0ddd8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666" }}>
          Renewal Database Search
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: "3px",
            background: renewal.found ? "#e1f0ea" : "#f5e8d8",
            color: renewal.found ? "#1a5c38" : "#6b3a00",
          }}
        >
          {renewal.found ? "Renewal Found" : "No Renewal Found"}
        </span>
      </div>
      <div style={{ padding: "0.85rem 1rem" }}>
        <p style={{ fontSize: "13px", color: "#444", marginBottom: "0.65rem" }}>
          Searched for: <strong style={{ fontWeight: 600 }}>&ldquo;{renewal.title}&rdquo;</strong>
          {byline}{publine} across Stanford Renewal DB + NYPL CCE Renewals
        </p>

        {renewal.stanford && (
          <div style={{ background: "#f9f8f6", borderRadius: "4px", padding: "0.65rem 0.85rem", marginBottom: "0.5rem", fontSize: "12.5px", color: "#555" }}>
            <div style={{ fontWeight: 600, color: "#333", marginBottom: "0.3rem" }}>Stanford Renewal DB</div>
            <div>Matched: <em>{renewal.stanford.title}</em> · {Math.round(renewal.stanford.similarity * 100)}% confidence</div>
            {renewal.stanford.renewal_num && (
              <div>Renewal: {renewal.stanford.renewal_num} ({renewal.stanford.renewal_date})</div>
            )}
            {renewal.stanford.expiration_year && (
              <div style={{ color: "#8a5020", fontWeight: 600, marginTop: "0.25rem" }}>
                Expires: January 1, {renewal.stanford.expiration_year + 1}
              </div>
            )}
          </div>
        )}

        {renewal.nypl && (
          <div style={{ background: "#f9f8f6", borderRadius: "4px", padding: "0.65rem 0.85rem", fontSize: "12.5px", color: "#555" }}>
            <div style={{ fontWeight: 600, color: "#333", marginBottom: "0.3rem" }}>NYPL CCE Renewals</div>
            <div>Matched: <em>{renewal.nypl.title}</em> · {Math.round(renewal.nypl.similarity * 100)}% confidence</div>
            {renewal.nypl.renewal_id && (
              <div>Renewal: {renewal.nypl.renewal_id} ({renewal.nypl.rdat})</div>
            )}
            {renewal.nypl.expiration_year && (
              <div style={{ color: "#8a5020", fontWeight: 600, marginTop: "0.25rem" }}>
                Expires: January 1, {renewal.nypl.expiration_year + 1}
              </div>
            )}
          </div>
        )}

        {!renewal.found && (
          <p style={{ fontSize: "12px", color: "#888", fontStyle: "italic", marginTop: "0.35rem" }}>
            No renewal record found in either database — non-renewal is statistically likely for this period.
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ entry }: { entry: HistoryEntry }) {
  const { status, label } = parseStatus(entry.result.answer);
  const confidence = parseConfidence(entry.result.answer);
  const statusStyle = status ? STATUS_STYLES[status] : null;

  // Split answer into sections for better display
  const sections = entry.result.answer.split(/\n(?=\d\.|\*\*\d\.)/);

  return (
    <div
      style={{
        border: "0.5px solid #e0ddd8",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#ffffff",
        marginBottom: "1.5rem",
      }}
    >
      {/* Question header */}
      <div
        style={{
          background: "#1e3a5f",
          padding: "0.9rem 1.25rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "14px", marginTop: "1px", opacity: 0.7 }}>📚</span>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.5,
            fontFamily: "var(--font-baskerville), serif",
            fontStyle: "italic",
          }}
        >
          {entry.question}
        </p>
      </div>

      {/* Status bar */}
      {statusStyle && (
        <div
          style={{
            background: statusStyle.bg,
            borderBottom: `0.5px solid ${statusStyle.border}`,
            padding: "0.6rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: statusStyle.color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          {confidence && (
            <span
              style={{
                fontSize: "11.5px",
                color: CONF_STYLES[confidence]?.color ?? "#555",
              }}
            >
              {confidence} Confidence
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: "11px", color: "#999" }}>
            {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* Answer body */}
      <div style={{ padding: "1.25rem" }}>
        <div
          style={{
            fontSize: "14px",
            lineHeight: 1.75,
            color: "#333",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--font-source-sans), sans-serif",
            fontWeight: 300,
          }}
        >
          {entry.result.answer}
        </div>

        {/* Renewal results */}
        <RenewalBadge renewal={entry.result.renewal} />

        {/* Sources */}
        {entry.result.chunks.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.85rem",
              borderTop: "0.5px solid #e0ddd8",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Sources
            </span>
            {entry.result.chunks.map((c) => (
              <span
                key={c.chunk_id}
                style={{
                  fontSize: "11px",
                  color: "#7480d4",
                  background: "#f0f0fc",
                  padding: "2px 7px",
                  borderRadius: "3px",
                }}
              >
                {c.chunk_id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CompassPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  async function handleSubmit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setQuestion("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const rem = res.headers.get("X-RateLimit-Remaining");
      if (rem !== null) setRemaining(parseInt(rem));

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Something went wrong.");
        return;
      }

      setHistory((prev) => [...prev, { question: q, result: data, timestamp: new Date() }]);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={`${baskerville.variable} ${sourceSans.variable}`}
      style={{
        fontFamily: "var(--font-source-sans), sans-serif",
        fontWeight: 300,
        background: "#f9f8f6",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          background: "#1e3a5f",
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <a
            href="/"
            style={{
              fontFamily: "var(--font-baskerville), serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "rgba(255,255,255,0.9)",
              textDecoration: "none",
            }}
          >
            Copyright<span style={{ color: "#7480d4" }}>Nexus</span>
          </a>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>/</span>
          <span
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
            }}
          >
            Compass
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {remaining !== null && (
            <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>
              {remaining} queries remaining today
            </span>
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "3px",
              background: "#e1f0ea",
              color: "#1a5c38",
            }}
          >
            Live
          </span>
        </div>
      </nav>

      {/* ── Main ── */}
      <div
        style={{
          flex: 1,
          maxWidth: "760px",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Hero — only shown when no history */}
        {history.length === 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#7480d4",
                marginBottom: "0.5rem",
              }}
            >
              AI-Powered Copyright Research
            </p>
            <h1
              style={{
                fontFamily: "var(--font-baskerville), serif",
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                color: "#1e3a5f",
                lineHeight: 1.2,
                marginBottom: "0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              Ask any copyright question
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#777",
                lineHeight: 1.65,
                maxWidth: "520px",
              }}
            >
              Compass searches 1.8 million verified renewal records and US copyright
              law to return a rights determination with confidence level and
              RightsStatements.org URI.
            </p>

            {/* Example questions */}
            <div style={{ marginTop: "1.5rem" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "0.65rem",
                }}
              >
                Try an example
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    style={{
                      background: "#ffffff",
                      border: "0.5px solid #e0ddd8",
                      borderRadius: "5px",
                      padding: "0.6rem 0.9rem",
                      fontSize: "13px",
                      color: "#444",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-source-sans), sans-serif",
                      fontWeight: 300,
                      lineHeight: 1.4,
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#7480d4")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#e0ddd8")
                    }
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.map((entry, i) => (
          <AnswerCard key={i} entry={entry} />
        ))}

        {/* Loading state */}
        {loading && (
          <div
            style={{
              border: "0.5px solid #e0ddd8",
              borderRadius: "8px",
              background: "#ffffff",
              padding: "1.5rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: "2px solid #e0ddd8",
                borderTopColor: "#7480d4",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: "13.5px", color: "#444", fontWeight: 400 }}>
                Searching knowledge base and renewal databases...
              </p>
              <p style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>
                Checking Stanford · NYPL CCE · generating answer
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "0.5px solid #fca5a5",
              borderRadius: "6px",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "13.5px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />

        {/* Input */}
        <div
          style={{
            position: "sticky",
            bottom: "1.5rem",
            marginTop: "auto",
            paddingTop: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "0.5px solid #c8c5bf",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(30,58,95,0.08)",
            }}
          >
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a copyright question…  e.g. Is a book from 1952 with a copyright notice still protected?"
              rows={2}
              style={{
                width: "100%",
                padding: "0.9rem 1rem 0.4rem",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "14px",
                fontFamily: "var(--font-source-sans), sans-serif",
                fontWeight: 300,
                color: "#222",
                background: "transparent",
                lineHeight: 1.55,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.4rem 0.75rem 0.65rem",
              }}
            >
              <span style={{ fontSize: "11px", color: "#bbb" }}>
                Enter to submit · Shift+Enter for new line
              </span>
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || loading}
                style={{
                  background: question.trim() && !loading ? "#1e3a5f" : "#e0ddd8",
                  color: question.trim() && !loading ? "#ffffff" : "#aaa",
                  border: "none",
                  borderRadius: "5px",
                  padding: "0.45rem 1.1rem",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "var(--font-source-sans), sans-serif",
                  cursor: question.trim() && !loading ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "Searching…" : "Ask Compass"}
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <p
            style={{
              fontSize: "11px",
              color: "#bbb",
              textAlign: "center",
              marginTop: "0.6rem",
              lineHeight: 1.5,
            }}
          >
            Research assistance only — not legal advice. For high-stakes decisions,
            consult a copyright attorney or the{" "}
            <a
              href="https://publicrecords.copyright.gov/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7480d4", textDecoration: "none" }}
            >
              U.S. Copyright Office
            </a>
            .
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
