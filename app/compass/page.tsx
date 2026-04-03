"use client";

import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import Nav from "../components/Nav";
import ReactMarkdown from "react-markdown";

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
  needs_clarification?: boolean;
  status: "in-copyright" | "public-domain" | "undetermined" | null;
}

interface HistoryEntry {
  question: string;
  result: QueryResult;
  timestamp: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  "public-domain": "Public Domain",
  "in-copyright": "In Copyright",
  "undetermined": "Undetermined",
};

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

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  "public-domain": { bg: "rgba(60,180,100,0.12)",  color: "#3a9e66", border: "rgba(60,180,100,0.28)",  dot: "#3a9e66"  },
  "in-copyright":  { bg: "rgba(220,80,60,0.09)",   color: "#b94a3b", border: "rgba(220,80,60,0.22)",   dot: "#b94a3b"  },
  "undetermined":  { bg: "rgba(180,140,40,0.10)",  color: "#8a6d00", border: "rgba(180,140,40,0.28)",  dot: "#c49a00"  },
};

const CONF_STYLES: Record<string, { bg: string; color: string }> = {
  High:   { bg: "#eef0fb", color: "#7480d4" },
  Medium: { bg: "#fff8e1", color: "#7a5c00" },
  Low:    { bg: "#f3f4f6", color: "#6b7280" },
};

// ── Components ─────────────────────────────────────────────────────────────────

const CompassIcon = () => (
  <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "#7480d4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  </div>
);

function RenewalBadge({ renewal }: { renewal: RenewalResult }) {
  if (!renewal.applicable) return null;

  const byline = renewal.author ? ` by ${renewal.author}` : "";
  const publine = renewal.year ? ` (${renewal.year})` : "";

  return (
    <div style={{ border: "1px solid #e2e5f0", borderRadius: "0.75rem", overflow: "hidden", marginTop: "1.25rem" }}>
      <div style={{ backgroundColor: "#eef0fb", padding: "0.6rem 1.125rem", borderBottom: "1px solid #e2e5f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9ba6e0" }}>
          Renewal Database Search
        </span>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "9999px", backgroundColor: renewal.found ? "rgba(60,180,100,0.12)" : "rgba(220,80,60,0.09)", color: renewal.found ? "#3a9e66" : "#b94a3b", border: `1px solid ${renewal.found ? "rgba(60,180,100,0.28)" : "rgba(220,80,60,0.22)"}` }}>
          {renewal.found ? "Renewal Found" : "No Renewal Found"}
        </span>
      </div>
      <div style={{ padding: "0.875rem 1.125rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#4b5563", fontWeight: 300, marginBottom: "0.625rem", lineHeight: 1.6 }}>
          Searched for: <strong style={{ fontWeight: 600, color: "#1e3a5f" }}>&ldquo;{renewal.title}&rdquo;</strong>
          {byline}{publine} across Stanford Copyright Renewal Database + New York Public Library Catalog of Copyright Entries
        </p>
        {renewal.stanford && (
          <div style={{ backgroundColor: "#f8f7f5", borderRadius: "0.5rem", padding: "0.625rem 0.875rem", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#4b5563", fontWeight: 300 }}>
            <div style={{ fontWeight: 600, color: "#1e3a5f", marginBottom: "0.25rem" }}>Stanford Copyright Renewal Database</div>
            <div>Matched: <em>{renewal.stanford.title}</em> · {Math.round(renewal.stanford.similarity * 100)}% match</div>
            {renewal.stanford.renewal_num && <div>Renewal: {renewal.stanford.renewal_num} ({renewal.stanford.renewal_date})</div>}
            {renewal.stanford.expiration_year && <div style={{ color: "#b94a3b", fontWeight: 600, marginTop: "0.25rem" }}>Enters the Public Domain: January 1, {renewal.stanford.expiration_year + 1}</div>}
          </div>
        )}
        {renewal.nypl && (
          <div style={{ backgroundColor: "#f8f7f5", borderRadius: "0.5rem", padding: "0.625rem 0.875rem", fontSize: "0.85rem", color: "#4b5563", fontWeight: 300 }}>
            <div style={{ fontWeight: 600, color: "#1e3a5f", marginBottom: "0.25rem" }}>
              <a href="https://archive.org/details/copyrightrecords" target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"}
                onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"}>
                New York Public Library Catalog of Copyright Entries
              </a>
            </div>
            <div>Matched: <em>{renewal.nypl.title}</em> · {Math.round(renewal.nypl.similarity * 100)}% match</div>
            {renewal.nypl.renewal_id && <div>Renewal: {renewal.nypl.renewal_id} ({renewal.nypl.rdat})</div>}
            {renewal.nypl.expiration_year && <div style={{ color: "#b94a3b", fontWeight: 600, marginTop: "0.25rem" }}>Enters the Public Domain: January 1, {renewal.nypl.expiration_year + 1}</div>}
          </div>
        )}
        {!renewal.found && (
          <p style={{ fontSize: "0.78rem", color: "#9ba6e0", fontStyle: "italic", marginTop: "0.375rem" }}>
            No renewal record found in either database — non-renewal is statistically likely for this period.
          </p>
        )}
      </div>
    </div>
  );
}

// User message bubble — right-aligned, italic Baskerville
function UserBubble({ question }: { question: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
      <div
        style={{
          backgroundColor: "#e8ebf8",
          borderRadius: "1.125rem 1.125rem 0.25rem 1.125rem",
          padding: "0.875rem 1.25rem",
          maxWidth: "82%",
          fontFamily: "var(--font-baskerville), serif",
          fontStyle: "italic",
          fontSize: "1rem",
          color: "#1e3a5f",
          lineHeight: 1.55,
        }}
      >
        {question}
      </div>
    </div>
  );
}

// Compass response — left-aligned, no card, flows on background
function CompassResponse({ entry }: { entry: HistoryEntry }) {
  const status = entry.result.status ?? null;
  const label = status ? (STATUS_LABELS[status] ?? "") : "";
  const confidence = parseConfidence(entry.result.answer);
  const statusStyle = status ? STATUS_STYLES[status] : null;
  const confStyle = confidence ? CONF_STYLES[confidence] : null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Icon + name + timestamp row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <CompassIcon />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e3a5f", fontFamily: "var(--font-source-sans), sans-serif" }}>
          Copyright Compass
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.73rem", color: "#9ba6e0" }}>
          {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Work title */}
      {entry.result.renewal.applicable && entry.result.renewal.title && (
        <div style={{ paddingLeft: "2.125rem", marginBottom: "0.625rem" }}>
          <span style={{
            fontFamily: "var(--font-baskerville), serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#1e3a5f",
            fontStyle: "italic"
          }}>
            {entry.result.renewal.stanford?.title
              || entry.result.renewal.nypl?.title
              || entry.result.renewal.title}
          </span>
        </div>
      )}

      {/* Status pills — shown when a determination was made */}
      {statusStyle && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" as const, paddingLeft: "2.125rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", backgroundColor: statusStyle.bg, color: statusStyle.color, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", padding: "0.35rem 0.825rem", borderRadius: "9999px", border: `1px solid ${statusStyle.border}` }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: statusStyle.dot, display: "inline-block" }} />
            {label}
          </span>
          {confidence && confStyle && (
            <span style={{ backgroundColor: confStyle.bg, color: confStyle.color, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "0.3rem 0.6rem", borderRadius: "9999px" }}>
              {confidence} confidence
            </span>
          )}
        </div>
      )}

      {/* Answer text */}
      <div style={{ paddingLeft: "2.125rem" }}>
        <div className="compass-answer" style={{ fontSize: "1rem", lineHeight: 1.75, color: "#374151", fontFamily: "var(--font-source-sans), sans-serif", fontWeight: 300 }}>
          <ReactMarkdown>{entry.result.answer}</ReactMarkdown>
        </div>
        <RenewalBadge renewal={entry.result.renewal} />
         </div>
    </div>
  );
}

// Combined chat turn: user bubble + compass response
function ChatEntry({ entry }: { entry: HistoryEntry }) {
  return (
    <>
      <UserBubble question={entry.question} />
      <CompassResponse entry={entry} />
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CompassPage() {
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length > 0) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [history]);

  async function handleSubmit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setQuestion("");
    setPendingQuestion(q);

    try {
      const conversationHistory = history.map((h) => ({
        question: h.question,
        answer: h.result.answer,
      }));

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: conversationHistory }),
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
      setPendingQuestion("");
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
        background: "#f8f7f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav />

      {/* ── Hero ── */}
      <section
        style={{
          backgroundColor: "#ffffff",
          paddingTop: "3rem",
          paddingBottom: "2rem",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(#e2e5f0 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.6 }} />
        <div style={{ maxWidth: "56rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "1.5rem", paddingRight: "1.5rem", position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontFamily: "var(--font-baskerville), serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "#1e3a5f",
              lineHeight: 1.2,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Copyright{" "}
            <em style={{ color: "#7480d4", fontStyle: "italic" }}>Compass</em>
          </h1>
          <p style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 300, lineHeight: 1.75, maxWidth: "38rem" }}>
            Ask any copyright question. Compass searches 1.8 million verified renewal records and U.S. copyright law to return a rights determination with confidence level and RightsStatements.org URI.
          </p>
        </div>
      </section>

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
          fontFamily: "var(--font-source-sans), sans-serif",
          fontWeight: 300,
        }}
      >
        {history.length === 0 && !loading ? (

          /* ── LANDING STATE: big centered input ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

            {/* Prominent input box */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1.5px solid #c8cfe8",
                borderRadius: "1.25rem",
                overflow: "hidden",
                boxShadow: "0 4px 28px rgba(30,58,95,0.13), 0 1px 6px rgba(30,58,95,0.07)",
              }}
            >
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a copyright question… e.g. Is a book from 1952 with a copyright notice still protected?"
                rows={3}
                className="compass-input"
                style={{
                  width: "100%",
                  padding: "1.25rem 1.5rem 0.75rem",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "1.05rem",
                  fontFamily: "var(--font-source-sans), sans-serif",
                  fontWeight: 300,
                  color: "#1e3a5f",
                  background: "transparent",
                  lineHeight: 1.65,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 1.25rem 1rem",
                  borderTop: "1px solid #eef0fb",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#9ba6e0", fontWeight: 300 }}>
                  Enter to submit · Shift+Enter for new line
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || loading}
                  style={{
                    background: question.trim() && !loading ? "#7480d4" : "#f0f1f8",
                    color: question.trim() && !loading ? "#ffffff" : "#b0b7d8",
                    border: "none",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 1.5rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-source-sans), sans-serif",
                    cursor: question.trim() && !loading ? "pointer" : "not-allowed",
                    transition: "background 0.15s",
                  }}
                >
                  Ask Compass
                </button>
              </div>
            </div>

            {/* Error (landing state) */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "0.75rem",
                  padding: "1rem 1.25rem",
                  fontSize: "0.95rem",
                  color: "#991b1b",
                  fontWeight: 300,
                }}
              >
                {error}
              </div>
            )}

            {/* Example questions */}
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "#aaa",
                  marginBottom: "0.65rem",
                }}
              >
                Try an example
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "0.625rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.95rem",
                      color: "#1e3a5f",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-source-sans), sans-serif",
                      fontWeight: 300,
                      lineHeight: 1.4,
                      transition: "border-color 0.15s, background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#7480d4";
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9f9ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer — visible on landing, gone in chat */}
            <div
              style={{
                padding: "0.875rem 1.125rem",
                backgroundColor: "#eef0fb",
                borderRadius: "0.625rem",
                border: "none",
                borderLeft: "3px solid #7480d4",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#1e3a5f", fontWeight: 400, lineHeight: 1.6, margin: 0 }}>
                <strong style={{ fontWeight: 700 }}>Compass provides research assistance only and does not constitute legal advice.</strong>{" "}
                For high-stakes decisions, consult a copyright attorney or the{" "}
                <a href="https://publicrecords.copyright.gov/" target="_blank" rel="noopener noreferrer" style={{ color: "#7480d4", textDecoration: "none", fontWeight: 600 }}>
                  U.S. Copyright Office
                </a>.
              </p>
            </div>
          </div>

        ) : (

          /* ── CHAT STATE: answers scroll, input sticks to bottom ── */
          <>
            {/* Conversation history */}
            {history.map((entry, i) => (
              <ChatEntry key={i} entry={entry} />
            ))}

            {/* Loading — matches chat style */}
            {loading && (
              <>
                <UserBubble question={pendingQuestion} />
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                    <CompassIcon />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e3a5f", fontFamily: "var(--font-source-sans), sans-serif" }}>
                      Copyright Compass
                    </span>
                  </div>
                  <div style={{ paddingLeft: "2.125rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <div className="thinking-dot" />
                      <div className="thinking-dot" style={{ animationDelay: "0.18s" }} />
                      <div className="thinking-dot" style={{ animationDelay: "0.36s" }} />
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#9ba6e0", fontWeight: 300 }}>
                      Searching...
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Error (chat state) */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "0.75rem",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.25rem",
                  fontSize: "0.95rem",
                  color: "#991b1b",
                  fontWeight: 300,
                }}
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />

            {/* Sticky input */}
            <div style={{ position: "sticky", bottom: 0, marginTop: "auto", paddingTop: "0.75rem", paddingBottom: "1.25rem", backgroundColor: "#f8f7f5" }}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #d4d7e3",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(30,58,95,0.12), 0 1px 4px rgba(30,58,95,0.06)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask a follow-up question…"
                  rows={2}
                  className="compass-input"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1.25rem 0.5rem",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    fontSize: "1rem",
                    fontFamily: "var(--font-source-sans), sans-serif",
                    fontWeight: 300,
                    color: "#1e3a5f",
                    background: "transparent",
                    lineHeight: 1.6,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.375rem 1rem 0.625rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#9ba6e0", fontWeight: 300 }}>
                    Enter to submit · Shift+Enter for new line
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!question.trim() || loading}
                    style={{
                      background: question.trim() && !loading ? "#7480d4" : "#f0f1f8",
                      color: question.trim() && !loading ? "#ffffff" : "#b0b7d8",
                      border: "none",
                      borderRadius: "0.375rem",
                      padding: "0.45rem 1.125rem",
                      fontSize: "0.875rem",
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

              {/* Small disclaimer — like "Claude is AI and can make mistakes" */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.73rem",
                  color: "#6b7280",
                  fontWeight: 400,
                  marginTop: "0.625rem",
                  lineHeight: 1.5,
                }}
              >
                For high-stakes decisions, consult a copyright attorney or the{" "}
                <a
                  href="https://publicrecords.copyright.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7480d4", textDecoration: "none" }}
                >
                  U.S. Copyright Office
                </a>.
              </p>
            </div>
          </>
        )}
      </div>


      <style>{`
        @keyframes thinking-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .thinking-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7480d4;
          animation: thinking-bounce 1.3s ease-in-out infinite;
          flex-shrink: 0;
        }
        .compass-input::placeholder { color: #9ba6e0; }
        .compass-answer p { margin: 0 0 0.75rem 0; }
        .compass-answer p:last-child { margin-bottom: 0; }
        .compass-answer h1,
        .compass-answer h2,
        .compass-answer h3 {
          font-family: var(--font-baskerville), serif;
          font-weight: 700;
          color: #1e3a5f;
          margin: 1.25rem 0 0.5rem;
          line-height: 1.3;
        }
        .compass-answer h1 { font-size: 1.2rem; }
        .compass-answer h2 { font-size: 1.1rem; }
        .compass-answer h3 { font-size: 1rem; }
        .compass-answer strong { font-weight: 600; color: #1e3a5f; }
        .compass-answer em { font-style: italic; }
        .compass-answer ul, .compass-answer ol {
          padding-left: 1.4rem;
          margin: 0.5rem 0 0.75rem;
        }
        .compass-answer li { margin-bottom: 0.3rem; }
        .compass-answer a { color: #7480d4; text-decoration: none; }
        .compass-answer a:hover { text-decoration: underline; }
        .compass-answer hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
