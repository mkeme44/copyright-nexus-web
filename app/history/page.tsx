'use client'

import { useState, useEffect, useRef } from 'react'
import Nav from '../components/Nav'

// ── Types ──────────────────────────────────────────────────────────────────────

type CopyrightStatus = 'Public Domain' | 'In Copyright' | 'Undetermined'
type ConfidenceLevel = 'High' | 'Medium' | 'Low'
type TimelineEventType = 'publication' | 'registration' | 'renewal' | 'lapse' | 'today' | 'expiry'

interface TimelineEvent {
  year: number
  event: string
  detail: string
  type: TimelineEventType
  isToday?: boolean
}

interface RenewalRecord {
  source: 'Stanford' | 'NYPL' | 'USCO'
  matchedTitle: string
  authorOrClaimant: string
  originalRegNum: string | null
  originalRegDate: string | null
  renewalNum: string | null
  renewalDate: string | null
  pubYear: number | null
  renewalYear: number | null
  similarity: number
}

interface CopyrightStatusResult {
  status: CopyrightStatus
  rightsStatement: string
  uri: string
  expiresLabel: string | null
  expiresYear: number | null
  publicDomainYear: number | null
  confidence: ConfidenceLevel
  notes: string
  warnings: string[]
}

interface CopyrightHistory {
  query: { title: string; author: string | null; pubYearHint: number | null }
  pubYear: number | null
  periodLabel: string
  periodRule: string
  renewed: boolean | null
  renewalYear: number | null
  renewalRecords: RenewalRecord[]
  sourcesWithHits: string[]
  copyrightStatus: CopyrightStatusResult
  timeline: TimelineEvent[]
  researchLinks: { label: string; url: string }[]
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function statusColors(status: CopyrightStatus) {
  if (status === 'Public Domain') {
    return {
      bg: 'rgba(34,197,94,0.10)',
      color: '#15803d',
      border: 'rgba(34,197,94,0.28)',
      dot: '#22c55e',
      headerBg: '#f0fdf4',
      headerBorder: '#bbf7d0',
    }
  }
  if (status === 'In Copyright') {
    return {
      bg: 'rgba(239,68,68,0.09)',
      color: '#b91c1c',
      border: 'rgba(239,68,68,0.25)',
      dot: '#ef4444',
      headerBg: '#fef2f2',
      headerBorder: '#fecaca',
    }
  }
  return {
    bg: 'rgba(234,179,8,0.10)',
    color: '#854d0e',
    border: 'rgba(234,179,8,0.28)',
    dot: '#eab308',
    headerBg: '#fefce8',
    headerBorder: '#fde68a',
  }
}

function confidenceColors(confidence: ConfidenceLevel) {
  if (confidence === 'High') return { bg: '#dcfce7', color: '#15803d' }
  if (confidence === 'Medium') return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

function timelineDotColor(type: TimelineEventType): string {
  switch (type) {
    case 'publication':   return '#7480d4'
    case 'registration':  return '#1e3a5f'
    case 'renewal':       return '#15803d'
    case 'lapse':         return '#dc2626'
    case 'today':         return '#7480d4'
    case 'expiry':        return '#6b7280'
    default:              return '#9ba6e0'
  }
}

// ── Input style helper ─────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  color: '#1a1a1a',
  backgroundColor: '#f8f7f5',
  border: '1.5px solid #e5e7eb',
  borderRadius: '0.5rem',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#1e3a5f',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [title, setTitle]       = useState('')
  const [author, setAuthor]     = useState('')
  const [pubYear, setPubYear]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<CopyrightHistory | null>(null)
  const resultsRef              = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/copyright-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:   title.trim(),
          author:  author.trim() || null,
          pubYear: pubYear ? parseInt(pubYear, 10) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
      }

      const data: CopyrightHistory = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '3.5rem 1.5rem 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#eef0fb',
            color: '#7480d4',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '1.25rem',
          }}>
            Copyright History
          </div>
          <h1 style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            color: '#1e3a5f',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}>
            Published work{' '}
            <em style={{ color: '#7480d4', fontStyle: 'italic' }}>renewal timeline</em>
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 300, lineHeight: 1.75, maxWidth: '38rem', margin: 0 }}>
            Search by title and author to retrieve the full copyright lifecycle of a specific work —
            original registration, renewal records, current status, and projected expiration date.
          </p>
        </div>
      </section>

      {/* ── Main ── */}
      <section style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Search form */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
            padding: '1.75rem 2rem',
            marginBottom: '2rem',
          }}>
            <form onSubmit={handleSearch}>
              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Book Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. The Great Gatsby"
                  required
                  style={inputBase}
                  onFocus={e => (e.target.style.borderColor = '#7480d4')}
                  onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Author + Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>
                    Author{' '}
                    <span style={{ color: '#9ba6e0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="e.g. F. Scott Fitzgerald"
                    style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#7480d4')}
                    onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Publication Year{' '}
                    <span style={{ color: '#9ba6e0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      optional
                    </span>
                  </label>
                  <input
                    type="number"
                    value={pubYear}
                    onChange={e => setPubYear(e.target.value)}
                    placeholder="e.g. 1925"
                    min={1800}
                    max={new Date().getFullYear()}
                    style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#7480d4')}
                    onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#9ba6e0', fontWeight: 300, lineHeight: 1.5 }}>
                    Providing a year significantly improves accuracy, especially for works published 1930–1963.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  style={{
                    backgroundColor: loading || !title.trim() ? '#c7cdf0' : '#7480d4',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {loading ? 'Searching records…' : 'Search Copyright Records'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ba6e0',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    ← New search
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error state */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div className="thinking-dot" />
                <div className="thinking-dot" style={{ animationDelay: '0.18s' }} />
                <div className="thinking-dot" style={{ animationDelay: '0.36s' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#9ba6e0', fontWeight: 300 }}>
                Searching...
              </span>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div ref={resultsRef}>
              <HistoryResults result={result} />
            </div>
          )}
        </div>
      </section>

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
      `}</style>
    </main>
  )
}

// ── Results ────────────────────────────────────────────────────────────────────

const RENEWAL_DISPLAY_THRESHOLD = 0.75

function HistoryResults({ result }: { result: CopyrightHistory }) {
  const s  = result.copyrightStatus
  const sc = statusColors(s.status)
  const cc = confidenceColors(s.confidence)

  const displayRecords = result.renewalRecords.filter(r => r.similarity >= RENEWAL_DISPLAY_THRESHOLD)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Slim status strip ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.625rem',
        padding: '0.875rem 1.25rem',
        backgroundColor: sc.headerBg,
        borderRadius: '0.75rem',
        border: `1px solid ${sc.headerBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: sc.bg,
            color: sc.color,
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            border: `1px solid ${sc.border}`,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sc.dot }} />
            {s.status}
          </span>
          <span style={{
            backgroundColor: cc.bg,
            color: cc.color,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.3rem 0.625rem',
            borderRadius: '9999px',
          }}>
            {s.confidence} confidence
          </span>
        </div>
        {s.publicDomainYear && (
          <span style={{ fontSize: '0.875rem', color: sc.color, fontWeight: 600 }}>
            {s.status === 'Public Domain'
              ? `In public domain since ${s.publicDomainYear}`
              : `Enters public domain ${s.publicDomainYear}`}
          </span>
        )}
      </div>

      {/* ── Timeline ── */}
      {result.timeline.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700,
              fontSize: '1.15rem',
              color: '#1e3a5f',
              margin: 0,
            }}>
              Copyright Timeline for{' '}
              <em>{result.query.title}</em>
              {result.query.author && ` by ${result.query.author}`}
            </h2>
          </div>

          <div style={{ padding: '2rem 2rem 2rem 3.5rem' }}>
            {result.timeline.map((event, i) => {
              const dot = timelineDotColor(event.type)
              const isLast = i === result.timeline.length - 1
              return (
                <div
                  key={i}
                  style={{ position: 'relative', paddingBottom: isLast ? 0 : '1.875rem' }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-1.5rem',
                    top: '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: dot,
                    border: '2.5px solid #ffffff',
                    boxShadow: `0 0 0 2px ${dot}`,
                    zIndex: 1,
                  }} />

                  {/* Connector line — runs from below this dot to the top of the next */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      left: 'calc(-1.5rem + 7px)',
                      top: '19px',
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e5e7eb',
                      zIndex: 0,
                    }} />
                  )}

                  {/* Year + Event label */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    {event.type !== 'expiry' && (
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', fontVariantNumeric: 'tabular-nums', minWidth: '2.75rem' }}>
                        {event.year}
                      </span>
                    )}
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: dot, letterSpacing: '0.02em' }}>
                      {event.event}
                    </span>
                    {event.isToday && (
                      <span style={{
                        fontSize: '0.68rem',
                        backgroundColor: '#eef0fb',
                        color: '#7480d4',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        Now
                      </span>
                    )}
                  </div>

                  {/* Detail */}
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: 300, lineHeight: 1.65 }}>
                    {event.detail}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Renewal Records ── */}
      {displayRecords.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            <h2 style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700,
              fontSize: '1.15rem',
              color: '#1e3a5f',
              margin: 0,
            }}>
              Renewal Records Found
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#9ba6e0', fontWeight: 600 }}>
              {displayRecords.length} record{displayRecords.length !== 1 ? 's' : ''} across{' '}
              {[...new Set(displayRecords.map(r => r.source))].join(', ')}
            </span>
          </div>
          <div style={{ padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayRecords.map((rec, i) => (
              <RenewalRecordCard key={i} record={rec} />
            ))}
          </div>
        </div>
      )}

      {/* ── No renewal found (applicable period) ── */}
      {result.renewed === false && displayRecords.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1rem',
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803d', marginBottom: '0.25rem' }}>
              No renewal records found
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: 300, lineHeight: 1.65 }}>
              Searched Stanford Copyright Renewals, NYPL CCE, and USCO databases. No matching renewal was found.
              Approximately 93% of works from this era were not renewed — an absent renewal strongly supports
              a public domain determination.
            </p>
          </div>
        </div>
      )}

      {/* ── Research links ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontWeight: 700,
            fontSize: '1.15rem',
            color: '#1e3a5f',
            margin: 0,
          }}>
            Research Further
          </h2>
        </div>
        <div style={{
          padding: '1.25rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.75rem',
        }}>
          {result.researchLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8f7f5',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                textDecoration: 'none',
                color: '#1e3a5f',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#7480d4'
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#eef0fb'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#f8f7f5'
              }}
            >
              {link.label}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4, flexShrink: 0, marginLeft: '0.5rem' }}>
                <path d="M3 9L9 3M9 3H5M9 3V7" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* ── Data Attribution ── */}
      <div style={{
        padding: '0.75rem 1.125rem',
        backgroundColor: '#f8f7f5',
        borderRadius: '0.625rem',
        border: '1px solid #e5e7eb',
        fontSize: '0.72rem',
        color: '#6b7280',
        fontWeight: 300,
        lineHeight: 1.7,
      }}>
        <span style={{ fontWeight: 700, color: '#1e3a5f' }}>Data sources: </span>
        <a href="https://exhibits.stanford.edu/copyrightrenewals" target="_blank" rel="noopener noreferrer" style={{ color: '#7480d4', textDecoration: 'none', fontWeight: 600 }}>Stanford Copyright Renewal Database</a>
        {' '}(CC BY 3.0) · {' '}
        <a href="https://cce-search.nypl.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#7480d4', textDecoration: 'none', fontWeight: 600 }}>NYPL Catalog of Copyright Entries</a>
        {' '}(CC0) · {' '}
        <a href="https://publicrecords.copyright.gov/" target="_blank" rel="noopener noreferrer" style={{ color: '#7480d4', textDecoration: 'none', fontWeight: 600 }}>US Copyright Office CPRS</a>
        {' '}(public domain)
        {result.sourcesWithHits.length > 0 && (
          <span> · <strong style={{ fontWeight: 600, color: '#1e3a5f' }}>Matched in: {result.sourcesWithHits.join(', ')}</strong></span>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        padding: '0.875rem 1.125rem',
        backgroundColor: '#eef0fb',
        borderRadius: '0.625rem',
        borderLeft: '3px solid #7480d4',
      }}>
        <p style={{ fontSize: '0.875rem', color: '#1e3a5f', fontWeight: 400, lineHeight: 1.6, margin: 0 }}>
          <strong style={{ fontWeight: 700 }}>
            Copyright History provides research guidance only and does not constitute legal advice.
          </strong>{' '}
          For high-stakes determinations, consult a copyright attorney or a rights specialist.
        </p>
      </div>
    </div>
  )
}

// ── Renewal Record Card ────────────────────────────────────────────────────────

function RenewalRecordCard({ record }: { record: RenewalRecord }) {
  const sourceColors: Record<string, { bg: string; color: string; border: string }> = {
    Stanford: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    NYPL:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    USCO:     { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  }
  const sc = sourceColors[record.source] ?? sourceColors.USCO

  return (
    <div style={{
      padding: '1rem 1.25rem',
      backgroundColor: '#f8f7f5',
      borderRadius: '0.625rem',
      border: '1px solid #e5e7eb',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '0.875rem',
        flexWrap: 'wrap',
      }}>
        <span style={{
          backgroundColor: sc.bg,
          color: sc.color,
          border: `1px solid ${sc.border}`,
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
        }}>
          {record.source}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#9ba6e0', fontWeight: 600 }}>
          {Math.round(record.similarity * 100)}% title match
        </span>
      </div>

      {/* Fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Matched Title
          </div>
          <div style={{ fontSize: '0.875rem', color: '#1e3a5f', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>
            {record.matchedTitle || '—'}
          </div>
        </div>

        {record.authorOrClaimant && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Author / Claimant
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3a3a3a', fontWeight: 400, lineHeight: 1.4 }}>
              {record.authorOrClaimant.split(';')[0].trim()}
            </div>
          </div>
        )}

        {record.renewalNum && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Renewal Number
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3a3a3a', fontFamily: 'monospace', fontWeight: 500 }}>
              {record.renewalNum}
            </div>
          </div>
        )}

        {(record.renewalDate || record.renewalYear) && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Renewal Date
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3a3a3a', fontWeight: 400 }}>
              {record.renewalDate || record.renewalYear}
            </div>
          </div>
        )}

        {record.pubYear && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Pub. Year
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3a3a3a', fontWeight: 400 }}>
              {record.pubYear}
            </div>
          </div>
        )}

        {record.originalRegNum && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ba6e0', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Orig. Registration
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3a3a3a', fontFamily: 'monospace', fontWeight: 400 }}>
              {record.originalRegNum}
            </div>
          </div>
        )}
      </div>

      {/* Citation / verify row */}
      <div style={{
        marginTop: '0.875rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.68rem', color: '#9ba6e0', fontWeight: 300, fontFamily: 'monospace' }}>
          {record.renewalNum || record.originalRegNum || 'no record number'}
        </span>
        <a
          href={
            record.source === 'Stanford' ? 'https://exhibits.stanford.edu/copyrightrenewals' :
            record.source === 'NYPL'     ? `https://cce-search.nypl.org/?q=${encodeURIComponent(record.matchedTitle)}` :
            'https://publicrecords.copyright.gov/'
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.72rem',
            color: '#7480d4',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}
        >
          Verify at {record.source} ↗
        </a>
      </div>
    </div>
  )
}
