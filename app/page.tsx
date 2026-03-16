import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import Link from "next/link";

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

type ToolStatus = "live" | "beta" | "alpha";

interface Tool {
  icon: string;
  name: string;
  status: ToolStatus;
  description: string;
  note?: string;
  href: string | null;
  linkLabel: string;
  internal?: boolean;
}

const tools: Tool[] = [
  {
    icon: "🧭",
    name: "Copyright Compass",
    status: "live",
    description:
      "Ask any copyright question in plain language. Searches 1.8 million verified renewal records and the copyright knowledge base to return a rights determination with confidence level and RightsStatements.org URI.",
    href: "/compass",
    linkLabel: "Launch Compass",
    internal: true,
  },
  {
    icon: "🗺️",
    name: "Copyright Navigator",
    status: "beta",
    description:
      "Step-by-step guided analysis. Answer structured questions about publication date, notice, and renewal to walk the correct legal path to a determination — no prior copyright knowledge needed.",
    note: "Beta: core decision logic is complete; interface refinements ongoing.",
    href: "https://forms.gle/W7Xio92dLx5h7FHR9",
    linkLabel: "Launch Navigator",
  },
  {
    icon: "📜",
    name: "Copyright History",
    status: "beta",
    description:
      "Search by title and author to retrieve the full copyright lifecycle of a specific work — original registration, renewal records, current status, and expiration date from verified databases.",
    note: "Beta: lookup accuracy is strong; deploying to the web shortly.",
    href: null,
    linkLabel: "Deploying soon",
  },
  {
    icon: "🔬",
    name: "Rights Scan",
    status: "alpha",
    description:
      "Batch rights review for digital collections. Upload a list of works and receive a rights assessment for each, ready to export into your digital asset management workflow.",
    note: "Alpha: under active development. Early testers welcome — expect rough edges.",
    href: null,
    linkLabel: "Coming soon",
  },
];

const sources = [
  { name: "Stanford Renewals", detail: "246k book renewals, 1923–1963 publications" },
  { name: "NYPL CCE Renewals", detail: "591k records, all classes, 1950–1991 renewals" },
  { name: "USCO Copyright Office", detail: "908k RE-prefix renewal registrations" },
  { name: "HathiTrust CRMS", detail: "67k human-reviewed determinations" },
];

const statusConfig: Record<ToolStatus, { label: string; bg: string; color: string }> = {
  live:  { label: "Live",  bg: "#e1f0ea", color: "#1a5c38" },
  beta:  { label: "Beta",  bg: "#e8eaf8", color: "#2e3480" },
  alpha: { label: "Alpha", bg: "#faeeda", color: "#6b3a00" },
};

const s = {
  wrap: {
    fontFamily: "var(--font-source-sans), sans-serif",
    fontWeight: 300,
    color: "#1a1a1a",
    background: "#f9f8f6",
    minHeight: "100vh",
  } as React.CSSProperties,
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "0.5px solid #e0ddd8",
    background: "#ffffff",
  } as React.CSSProperties,
  logo: {
    fontFamily: "var(--font-baskerville), serif",
    fontWeight: 700,
    fontSize: "15px",
    color: "#1e3a5f",
    textDecoration: "none",
  } as React.CSSProperties,
};

export default function Home() {
  return (
    <div className={`${baskerville.variable} ${sourceSans.variable}`} style={s.wrap}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <span style={s.logo}>
          Copyright<span style={{ color: "#7480d4" }}>Nexus</span>
        </span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {[["Tools", "#tools"], ["Data Sources", "#data-sources"], ["About", "#about"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: "13px", color: "#666", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: "#1e3a5f", padding: "3.5rem 2rem 3rem" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7480d4", marginBottom: "0.9rem" }}>
            Cultural Heritage Copyright Research
          </p>
          <h1
            style={{
              fontFamily: "var(--font-baskerville), serif",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              lineHeight: 1.18,
              color: "#ffffff",
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
              maxWidth: "600px",
            }}
          >
            Four tools for every copyright question your collection raises
          </h1>
          <p style={{ fontSize: "1rem", fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: "2rem", maxWidth: "500px" }}>
            Built for librarians, archivists, and museum curators — grounded in
            1.8 million verified renewal records and US copyright law.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/compass"
              style={{
                background: "#7480d4",
                color: "#fff",
                padding: "0.65rem 1.4rem",
                fontFamily: "var(--font-source-sans), sans-serif",
                fontSize: "13.5px",
                fontWeight: 600,
                borderRadius: "4px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Open Copyright Compass
            </Link>
            <a
              href="#tools"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.8)",
                border: "0.5px solid rgba(255,255,255,0.3)",
                padding: "0.65rem 1.4rem",
                fontFamily: "var(--font-source-sans), sans-serif",
                fontSize: "13.5px",
                fontWeight: 400,
                borderRadius: "4px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View all tools
            </a>
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section id="tools" style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7480d4", marginBottom: "0.35rem" }}>
          The Suite
        </p>
        <h2 style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1.75rem" }}>
          Tools at every stage of your workflow
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1px",
            background: "#e0ddd8",
            border: "0.5px solid #e0ddd8",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {tools.map((tool) => {
            const sc = statusConfig[tool.status];
            const isLinked = !!tool.href;
            const linkEl = isLinked ? (
              tool.internal ? (
                <Link href={tool.href!} style={{ fontSize: "12.5px", fontWeight: 600, color: "#7480d4", textDecoration: "none", marginTop: "auto", paddingTop: "0.6rem", display: "block" }}>
                  {tool.linkLabel} →
                </Link>
              ) : (
                <a href={tool.href!} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12.5px", fontWeight: 600, color: "#7480d4", textDecoration: "none", marginTop: "auto", paddingTop: "0.6rem", display: "block" }}>
                  {tool.linkLabel} →
                </a>
              )
            ) : (
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#bbb", marginTop: "auto", paddingTop: "0.6rem", display: "block" }}>
                {tool.linkLabel}
              </span>
            );

            return (
              <div key={tool.name} style={{ background: "#ffffff", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "18px" }}>{tool.icon}</span>
                  <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: "3px", background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>
                  {tool.name}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 300, color: "#555", lineHeight: 1.6 }}>
                  {tool.description}
                </p>
                {tool.note && (
                  <p style={{ fontSize: "11.5px", color: "#888", lineHeight: 1.5, fontStyle: "italic", borderTop: "0.5px solid #e0ddd8", paddingTop: "0.65rem", marginTop: "0.25rem" }}>
                    {tool.note}
                  </p>
                )}
                {linkEl}
              </div>
            );
          })}
        </div>

        {/* Version explainer */}
        <div style={{ border: "0.5px solid #e0ddd8", borderLeft: "3px solid #7480d4", borderRadius: "0 6px 6px 0", padding: "0.9rem 1.1rem", marginTop: "1.25rem", background: "#f9f8f6" }}>
          <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.6 }}>
            <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>Live</strong> — production-ready.{" "}
            <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>Beta</strong> — fully functional, being refined; feedback welcome.{" "}
            <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>Alpha</strong> — under active development; features may change.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "#e0ddd8", border: "0.5px solid #e0ddd8", borderRadius: "8px", overflow: "hidden", marginTop: "2rem" }}>
          {[{ num: "1.8M+", label: "Renewal records indexed" }, { num: "4", label: "Verified data sources" }, { num: "1923–", label: "Publication years covered" }].map((s) => (
            <div key={s.label} style={{ background: "#ffffff", padding: "1.1rem 1.4rem" }}>
              <div style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "1.5rem", fontWeight: 700, color: "#1e3a5f" }}>{s.num}</div>
              <div style={{ fontSize: "11.5px", color: "#888", marginTop: "3px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ── */}
      <section id="data-sources" style={{ padding: "0 2rem 3rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7480d4", marginBottom: "0.35rem" }}>
          Data Sources
        </p>
        <h2 style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1.25rem" }}>
          Built on verified records
        </h2>
        <div style={{ background: "#f2f0ec", borderRadius: "8px", padding: "1.75rem" }}>
          <p style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1.1rem" }}>
            Renewal databases searched on every query
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem" }}>
            {sources.map((src) => (
              <div key={src.name}>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1a1a" }}>{src.name}</div>
                <div style={{ fontSize: "11.5px", color: "#666", marginTop: "3px" }}>{src.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ padding: "0 2rem 3rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7480d4", marginBottom: "0.35rem" }}>
          About
        </p>
        <h2 style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1rem" }}>
          Why Copyright Nexus exists
        </h2>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, maxWidth: "600px" }}>
          Copyright Nexus is a suite of tools developed to support museums, archives, and libraries
          in navigating the complex landscape of copyright clearance. Our mission is to provide
          accessible, practical resources that empower cultural institutions to make informed
          decisions about the use and sharing of their collections.
        </p>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, maxWidth: "600px", marginTop: "0.85rem" }}>
          The tools are built on publicly available renewal records from the Stanford Copyright
          Renewal Database, the NYPL Catalog of Copyright Entries, the U.S. Copyright Office,
          and HathiTrust CRMS — cross-referenced to give the most complete picture possible.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#1e3a5f", padding: "2rem", marginTop: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--font-baskerville), serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
            Copyright<span style={{ color: "#7480d4" }}>Nexus</span>
          </span>
          <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>Built for libraries, archives, and museums</span>
        </div>
        <div style={{ maxWidth: "900px", margin: "1.25rem auto 0", borderTop: "0.5px solid rgba(255,255,255,0.1)", paddingTop: "1rem", fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
          This suite provides research assistance only and does not constitute legal advice.
          For high-stakes decisions, consult a copyright attorney or contact the U.S. Copyright Office directly.
          © {new Date().getFullYear()} Copyright Nexus.
        </div>
      </footer>
    </div>
  );
}
