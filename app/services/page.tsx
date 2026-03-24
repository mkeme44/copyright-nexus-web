// app/services/page.tsx
// Copyright Nexus — Services Overview Page

import Nav from '../components/Nav';
import CompassPreview from '../components/CompassPreview';

export const metadata = {
  title: 'Services — Copyright Nexus',
  description:
    'A suite of copyright research services for cultural heritage professionals. Determine copyright status confidently with AI-powered guidance.',
};

export default function ServicesPage() {
  return (
    <main style={{ fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#ffffff',
          paddingTop: '6rem',
          paddingBottom: '4rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e5f0 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }} />
        <div
          style={{
            maxWidth: '56rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#eef0fb',
              color: '#7480d4',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              marginBottom: '1.5rem',
            }}
          >
            The Suite
          </div>

          <h1
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              color: '#1e3a5f',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
            }}
          >
            Four services built for one{' '}
            <em style={{ color: '#7480d4', fontStyle: 'italic' }}>purpose</em>
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              fontWeight: 300,
              lineHeight: 1.75,
              maxWidth: '42rem',
              marginBottom: '2rem',
            }}
          >
            Copyright Nexus is a suite of research services designed to help
            librarians, archivists, and digital collections managers determine
            copyright status accurately — without needing dedicated legal staff.
            Each service addresses a different part of the research workflow.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const }}>
            <a
              href="/compass"
              style={{
                display: 'inline-block',
                backgroundColor: '#7480d4',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
              }}
            >
              Open Compass
            </a>
            <a
              href="/our-approach"
              style={{
                display: 'inline-block',
                backgroundColor: 'transparent',
                color: '#1e3a5f',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                borderWidth: '1.5px',
                borderStyle: 'solid',
                borderColor: '#1e3a5f',
              }}
            >
              Our Approach
            </a>
          </div>
        </div>
      </section>

      {/* ── Compass ─────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#ffffff',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        <div
          style={{
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  fontWeight: 700,
                  fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                  color: '#1e3a5f',
                  lineHeight: 1.2,
                  marginBottom: '1rem',
                }}
              >
                Copyright{' '}
                <em style={{ color: '#7480d4', fontStyle: 'italic' }}>Compass</em>
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: 300,
                  lineHeight: 1.75,
                  marginBottom: '1.25rem',
                }}
              >
                The flagship service. Describe any work in plain language and
                Compass determines copyright status using AI-powered reasoning
                across multiple renewal databases and copyright law sources.
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: 300,
                  lineHeight: 1.75,
                  marginBottom: '1.75rem',
                }}
              >
                Every determination includes a confidence level, a recommended
                RightsStatements.org designation with URI, the legal basis for
                the decision, and specific research steps if further verification
                is needed.
              </p>

              <ServiceFeature text="Checks Stanford, NYPL, and USCO renewal databases" />
              <ServiceFeature text="Returns RightsStatements.org URI with every answer" />
              <ServiceFeature text="Flags URAA caveats for foreign works automatically" />
              <ServiceFeature text="Covers published, unpublished, and government works" />

              <div style={{ marginTop: '1.75rem' }}>
                <a
                  href="/compass"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#7480d4',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                  }}
                >
                  Open Compass
                </a>
              </div>
            </div>

            <div>
              <CompassPreview size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigator ────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#f8f7f5',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        <div
          style={{
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
            <div>
              <NavigatorMockup />
            </div>

            <div>
              <h2
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  fontWeight: 700,
                  fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                  color: '#1e3a5f',
                  lineHeight: 1.2,
                  marginBottom: '1rem',
                }}
              >
                Copyright{' '}
                <em style={{ color: '#7480d4', fontStyle: 'italic' }}>Navigator</em>
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: 300,
                  lineHeight: 1.75,
                  marginBottom: '1.25rem',
                }}
              >
                A structured, step-by-step decision tree for professionals who
                prefer a guided workflow over a conversational interface.
                Navigator walks you through the same copyright determination
                logic one question at a time.
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: 300,
                  lineHeight: 1.75,
                  marginBottom: '1.75rem',
                }}
              >
                Well-suited for training, batch workflows, or situations where
                you want to document your decision process step by step.
              </p>

              <ServiceFeature text="No ambiguity — binary yes/no questions throughout" />
              <ServiceFeature text="Covers all major copyright scenarios and periods" />
              <ServiceFeature text="Produces a recommended rights statement at each endpoint" />

              <div style={{ marginTop: '1.75rem' }}>
                <a
                  href="/navigator"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#7480d4',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                  }}
                >
                  Open Navigator
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming Soon ──────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#ffffff',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        <div
          style={{
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '3rem' }}>
            <p
              style={{
                color: '#9ba6e0',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                marginBottom: '0.5rem',
              }}
            >
              In Development
            </p>
            <h2
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontWeight: 700,
                fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                color: '#1e3a5f',
                lineHeight: 1.2,
              }}
            >
              Two more services are{' '}
              <em style={{ color: '#7480d4', fontStyle: 'italic' }}>on the way</em>
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <ComingSoonCard
              title="Copyright History"
              description="Look up the full copyright lifecycle for a title or author. Search renewal records, registration dates, and expiration years across the Stanford, NYPL, and USCO databases from a single interface."
              detail="Python lookup script is complete. Web UI is in development."
              features={[
                'Title and author search across all renewal databases',
                'Full lifecycle: registration, renewal, expiration',
                'Export-ready results for collection management',
              ]}
            />

            <ComingSoonCard
              title="Rights Scan"
              description="Submit a URL from an Islandora or OAI-PMH digital collection and Rights Scan retrieves the metadata and runs a copyright determination automatically."
              detail="Backend development underway. Islandora/OAI-PMH support first."
              features={[
                'Batch processing for digital collection URLs',
                'Metadata fetch plus automated rights determination',
                'CONTENTdm and Internet Archive support planned',
              ]}
            />
          </div>
        </div>
      </section>

    </main>
  );
}


// ── Sub-components ─────────────────────────────────────────────────────────────

function ServiceFeature({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        marginBottom: '0.625rem',
      }}
    >
      <span
        style={{
          color: '#7480d4',
          fontWeight: 700,
          marginTop: '0.1rem',
          flexShrink: 0,
          fontSize: '0.9rem',
        }}
      >
        &#10003;
      </span>
      <span
        style={{
          color: '#4b5563',
          fontSize: '0.95rem',
          fontWeight: 300,
          lineHeight: 1.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function NavigatorMockup() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#ef4444' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#f59e0b' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#22c55e' }} />
        <span
          style={{
            marginLeft: '0.75rem',
            color: '#9ba6e0',
            fontSize: '0.75rem',
            fontWeight: 400,
          }}
        >
          Copyright Navigator
        </span>
      </div>

      <div style={{ backgroundColor: '#f3f4f6', height: '4px' }}>
        <div style={{ backgroundColor: '#7480d4', height: '100%', width: '40%' }} />
      </div>

      <div style={{ padding: '1.5rem' }}>
        <p
          style={{
            color: '#9ba6e0',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
            marginBottom: '0.5rem',
          }}
        >
          Step 2 of 5
        </p>
        <p
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontSize: '1rem',
            fontWeight: 700,
            color: '#1e3a5f',
            marginBottom: '1.25rem',
            lineHeight: 1.4,
          }}
        >
          Was this work published before January 1, 1930?
        </p>

        <MockChoice label="Yes — published before 1930" active={true} />
        <MockChoice label="No — published 1930 or later" active={false} />
        <MockChoice label="I am not sure" active={false} />

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              backgroundColor: '#7480d4',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'default',
            }}
          >
            Continue
          </span>
        </div>
      </div>
    </div>
  );
}

function MockChoice({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.875rem',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        backgroundColor: active ? '#eef0fb' : '#f9fafb',
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: active ? '#7480d4' : '#e5e7eb',
        cursor: 'default',
      }}
    >
      <span
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '9999px',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: active ? '#7480d4' : '#d1d5db',
          backgroundColor: active ? '#7480d4' : 'transparent',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: '0.85rem',
          color: active ? '#1e3a5f' : '#6b7280',
          fontWeight: active ? 600 : 300,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ComingSoonCard({
  title,
  description,
  detail,
  features,
}: {
  title: string;
  description: string;
  detail: string;
  features: string[];
}) {
  return (
    <div
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        borderRadius: '0.75rem',
        padding: '2rem',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute' as const,
          top: '1rem',
          right: '1rem',
          backgroundColor: '#eef0fb',
          color: '#7480d4',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase' as const,
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
        }}
      >
        Coming Soon
      </div>

      <h3
        style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontWeight: 700,
          fontSize: '1.35rem',
          color: '#1e3a5f',
          lineHeight: 1.2,
          marginBottom: '0.875rem',
          paddingRight: '6rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#6b7280',
          fontWeight: 300,
          lineHeight: 1.7,
          marginBottom: '1.25rem',
        }}
      >
        {description}
      </p>

      <div style={{ marginBottom: '1.25rem' }}>
        {features[0] && <ServiceFeature text={features[0]} />}
        {features[1] && <ServiceFeature text={features[1]} />}
        {features[2] && <ServiceFeature text={features[2]} />}
      </div>

      <p
        style={{
          fontSize: '0.8rem',
          color: '#9ba6e0',
          fontWeight: 400,
          fontStyle: 'italic',
          paddingTop: '0.875rem',
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: '#e5e7eb',
        }}
      >
        {detail}
      </p>
    </div>
  );
}
