'use client'

import { useState } from 'react'
import Nav from '../components/Nav'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type Option = {
  label: string
  sublabel?: string
  next: string
}

type Step = {
  id: string
  question: string
  hint?: string
  options: Option[]
}

type Result = {
  status: 'Public Domain' | 'In Copyright' | 'Undetermined'
  confidence: 'High' | 'Medium' | 'Low'
  rightsStatement: string
  uri: string
  explanation: string
  researchNote?: string
}

// ── Decision Tree ──────────────────────────────────────────────────────────────

const STEPS: Record<string, Step> = {
  material_type: {
    id: 'material_type',
    question: 'What type of material are you evaluating?',
    hint: 'Choose the category that best describes this work.',
    options: [
      { label: 'Published work', sublabel: 'Books, magazines, newspapers, photographs distributed to the public, films, sheet music', next: 'pub_date' },
      { label: 'Unpublished work', sublabel: 'Personal letters, manuscripts, diaries, photographs in private collections', next: 'unpub_creator' },
      { label: 'US Government document', sublabel: 'Works created by federal employees as part of official duties', next: 'gov_level' },
      { label: 'Not sure if published', sublabel: 'Uncertain whether copies were distributed to the public', next: 'pub_determination' },
    ],
  },

  pub_determination: {
    id: 'pub_determination',
    question: 'Were copies of this work distributed to the public?',
    hint: 'Publication means copies were sold, rented, lent, or otherwise made available to the general public.',
    options: [
      { label: 'Yes', sublabel: 'Sold in stores, distributed free to the public, or made available for download', next: 'pub_date' },
      { label: 'No', sublabel: 'Kept private, given only to specific individuals, or limited circulation', next: 'unpub_creator' },
    ],
  },

  pub_date: {
    id: 'pub_date',
    question: 'When was this work published?',
    hint: 'Use the date of first publication, not creation or copyright registration.',
    options: [
      { label: 'Before 1930', next: 'result:public_domain_pre1930' },
      { label: '1930 – 1963', next: 'notice_1930' },
      { label: '1964 – 1977', next: 'notice_1964' },
      { label: '1978 – February 28, 1989', next: 'notice_1978' },
      { label: 'March 1, 1989 or later', next: 'result:in_copyright_modern' },
    ],
  },

  notice_1930: {
    id: 'notice_1930',
    question: 'Does the work have a copyright notice?',
    hint: 'Look for the \u00a9 symbol, the word "Copyright," or "Copr." followed by a year and name. Check the title page, cover, first and last pages.',
    options: [
      { label: 'Yes, a copyright notice is present', next: 'renewal_check' },
      { label: 'No copyright notice found', next: 'result:public_domain_no_notice' },
    ],
  },

  renewal_check: {
    id: 'renewal_check',
    question: 'Was copyright renewed during the 28th year after publication?',
    hint: 'Renewal was required for works published 1930\u20131963. Only about 15% of copyrights were renewed. Check the Stanford Copyright Renewal Database, NYPL CCE, or U.S. Copyright Office records.',
    options: [
      { label: 'Yes, a renewal record was found', next: 'result:in_copyright_renewed' },
      { label: 'No renewal record found after searching', next: 'result:public_domain_not_renewed' },
      { label: 'Unknown \u2014 not yet researched', next: 'result:undetermined_renewal' },
    ],
  },

  notice_1964: {
    id: 'notice_1964',
    question: 'Does the work have a copyright notice?',
    hint: 'Look for the \u00a9 symbol, the word "Copyright," or "Copr." followed by a year and name. For works in this period, renewal was automatic \u2014 no research needed if notice is present.',
    options: [
      { label: 'Yes, a copyright notice is present', next: 'result:in_copyright_1964' },
      { label: 'No copyright notice found', next: 'result:public_domain_no_notice' },
    ],
  },

  notice_1978: {
    id: 'notice_1978',
    question: 'Does the work have a copyright notice?',
    hint: 'Notice was still required until March 1, 1989. However, the 1976 Act allowed a "cure" for omitted notice under certain conditions.',
    options: [
      { label: 'Yes, a copyright notice is present', next: 'result:in_copyright_with_notice' },
      { label: 'No copyright notice found', next: 'cure_check' },
    ],
  },

  cure_check: {
    id: 'cure_check',
    question: 'Was the omission of notice corrected?',
    hint: 'A "cure" required the work to be registered within 5 years of publication AND reasonable effort made to add notice to remaining copies.',
    options: [
      { label: 'Yes, the work was registered within 5 years and notice was added', next: 'result:in_copyright_with_notice' },
      { label: 'No cure was applied', next: 'result:public_domain_no_notice' },
      { label: 'Unknown \u2014 cure status not established', next: 'result:undetermined_cure' },
    ],
  },

  gov_level: {
    id: 'gov_level',
    question: 'What level of government created this work?',
    hint: 'Only works created by federal government employees within their official duties are automatically public domain under 17 U.S.C. \u00a7 105.',
    options: [
      { label: 'Federal government', sublabel: 'Created by U.S. federal employees as part of official duties', next: 'result:public_domain_federal' },
      { label: 'State or local government', sublabel: 'State agencies, municipalities, counties', next: 'pub_date' },
      { label: 'Not sure', next: 'result:undetermined_gov' },
    ],
  },

  unpub_creator: {
    id: 'unpub_creator',
    question: 'What is known about the creator of this work?',
    hint: 'For unpublished works, copyright term is calculated differently depending on whether the creator is known.',
    options: [
      { label: 'Known individual creator', sublabel: 'A specific person who can be identified by name', next: 'unpub_death' },
      { label: 'Unknown creator', sublabel: 'Creator cannot be identified', next: 'unpub_creation_date' },
      { label: 'Corporate or organizational authorship', sublabel: 'Created by or for an institution, company, or organization', next: 'unpub_org' },
    ],
  },

  unpub_death: {
    id: 'unpub_death',
    question: 'When did the creator die?',
    hint: 'For unpublished works by known creators, copyright lasts for the life of the author plus 70 years.',
    options: [
      { label: 'Before 1955', next: 'result:public_domain_unpub' },
      { label: '1955 or later', next: 'result:in_copyright_unpub' },
      { label: 'Creator is still living', next: 'result:in_copyright_unpub' },
      { label: 'Death date is unknown', next: 'result:undetermined_death' },
    ],
  },

  unpub_creation_date: {
    id: 'unpub_creation_date',
    question: 'When was this work created?',
    hint: 'For unpublished works with unknown creators, the creation date determines copyright term.',
    options: [
      { label: 'Before 1905', next: 'result:public_domain_unpub' },
      { label: '1905 – 1955', next: 'result:undetermined_unknown_creator' },
      { label: '1956 or later', next: 'result:in_copyright_ruu' },
      { label: 'Creation date unknown', next: 'result:undetermined_unknown_creator' },
    ],
  },

  unpub_org: {
    id: 'unpub_org',
    question: 'Is the organization still operating?',
    hint: 'For unpublished corporate works, copyright lasts 120 years from creation. If the organization is defunct, rights ownership may be unclear.',
    options: [
      { label: 'Yes, still operating', next: 'result:in_copyright_corporate' },
      { label: 'No, the organization is defunct', next: 'result:undetermined_defunct' },
      { label: 'Unknown', next: 'result:undetermined_defunct' },
    ],
  },
}

// ── Results ────────────────────────────────────────────────────────────────────

const RESULTS: Record<string, Result> = {
  public_domain_pre1930: {
    status: 'Public Domain',
    confidence: 'High',
    rightsStatement: 'No Copyright \u2014 United States',
    uri: 'https://rightsstatements.org/vocab/NoC-US/1.0/',
    explanation: 'All works published in the United States before January 1, 1930 are in the public domain. The maximum copyright term of 95 years has expired. No further research is needed \u2014 copyright notice, renewal status, and author death date are irrelevant.',
  },
  public_domain_no_notice: {
    status: 'Public Domain',
    confidence: 'High',
    rightsStatement: 'No Copyright \u2014 United States',
    uri: 'https://rightsstatements.org/vocab/NoC-US/1.0/',
    explanation: 'Copyright notice was mandatory for published works in this period. A work published without notice generally entered the public domain immediately upon publication. Before concluding, check multiple copies if possible \u2014 notice may have been on a dust jacket now missing.',
  },
  public_domain_not_renewed: {
    status: 'Public Domain',
    confidence: 'High',
    rightsStatement: 'No Copyright \u2014 United States',
    uri: 'https://rightsstatements.org/vocab/NoC-US/1.0/',
    explanation: 'Copyright renewal was required for works published 1930\u20131963. No renewal record was found after a thorough search. Only about 15% of copyrights were renewed overall. Document your search methodology as part of your rights determination.',
    researchNote: 'Verify at: Stanford Copyright Renewal Database \u2014 exhibits.stanford.edu/copyrightrenewals | NYPL CCE \u2014 cce-search.nypl.org | USCO CPRS \u2014 publicrecords.copyright.gov',
  },
  public_domain_unpub: {
    status: 'Public Domain',
    confidence: 'High',
    rightsStatement: 'No Copyright \u2014 United States',
    uri: 'https://rightsstatements.org/vocab/NoC-US/1.0/',
    explanation: 'The life-plus-70-years copyright term has expired. For known creators who died before 1955, copyright expired no later than January 1, 2025. For unknown creators whose work was created before 1905, the 120-year term has passed.',
  },
  public_domain_federal: {
    status: 'Public Domain',
    confidence: 'High',
    rightsStatement: 'No Copyright \u2014 United States',
    uri: 'https://rightsstatements.org/vocab/NoC-US/1.0/',
    explanation: 'Under 17 U.S.C. \u00a7 105, works created by U.S. federal government employees within the scope of their official duties are not eligible for copyright protection. Note: this applies to U.S. copyright only. Other countries may still grant protection to U.S. government works.',
  },
  in_copyright_modern: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'Works published on or after March 1, 1989 are protected by copyright with no formalities required. For individual authors, the term is life plus 70 years. For works made for hire, the term is 95 years from publication or 120 years from creation, whichever expires first.',
  },
  in_copyright_renewed: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'A renewal record was found, confirming copyright was maintained. The total term is 95 years from publication. Permission from the rights holder is required for uses beyond fair use or other exceptions.',
  },
  in_copyright_1964: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'Works published 1964\u20131977 with a copyright notice are in copyright for 95 years from publication. The Copyright Renewal Act of 1992 made renewal automatic for this period \u2014 no renewal research is needed.',
  },
  in_copyright_with_notice: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'A copyright notice was present, establishing copyright protection. For individual authors, the term is life plus 70 years. For works made for hire, the term is 95 years from publication or 120 years from creation, whichever expires first.',
  },
  in_copyright_unpub: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'For unpublished works by a known creator who died in 1955 or later, copyright has not yet expired. The term extends to January 1 of the year following the 70th anniversary of the creator\'s death. Permission from the rights holder or estate is required.',
  },
  in_copyright_corporate: {
    status: 'In Copyright',
    confidence: 'High',
    rightsStatement: 'In Copyright',
    uri: 'https://rightsstatements.org/vocab/InC/1.0/',
    explanation: 'Unpublished works created by or for an organization are protected for 120 years from creation. Contact the organization directly for permission requests.',
  },
  in_copyright_ruu: {
    status: 'In Copyright',
    confidence: 'Medium',
    rightsStatement: 'In Copyright \u2014 Rights-holder(s) Unlocatable or Unidentifiable',
    uri: 'https://rightsstatements.org/vocab/InC-RUU/1.0/',
    explanation: 'This work is presumed to be in copyright, but the creator cannot be identified. If you have conducted a reasonable search and cannot locate the rights holder, this statement is appropriate. Document your search efforts thoroughly.',
    researchNote: 'A reasonable search should include: institutional records, copyright registration databases, biographical resources, and online databases. Document all steps taken.',
  },
  undetermined_renewal: {
    status: 'Undetermined',
    confidence: 'Medium',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The copyright notice was present but renewal status has not been established. Research is required before a final determination can be made. If renewal is confirmed, the work is in copyright for 95 years from publication. If no renewal is found, the work is in the public domain.',
    researchNote: 'Search renewal records at: Stanford Copyright Renewal Database \u2014 exhibits.stanford.edu/copyrightrenewals | NYPL CCE \u2014 cce-search.nypl.org | USCO CPRS \u2014 publicrecords.copyright.gov | Copyright Office paid search \u2014 $200/hr, 2-hr minimum',
  },
  undetermined_cure: {
    status: 'Undetermined',
    confidence: 'Low',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The work was published without notice during a period when notice was required, but whether a cure was applied cannot be determined. Check Copyright Office registration records to see if the work was registered within 5 years of publication.',
    researchNote: 'Check registration at: U.S. Copyright Office \u2014 copyright.gov/records (covers 1978\u2013present online)',
  },
  undetermined_death: {
    status: 'Undetermined',
    confidence: 'Medium',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The creator is known but their death date has not been established. Copyright term cannot be calculated without this information. Research the creator\'s biographical records to find the death date.',
    researchNote: 'Research sources: Wikidata (wikidata.org), Library of Congress Name Authority File, Wikipedia, biographical dictionaries, obituary databases.',
  },
  undetermined_unknown_creator: {
    status: 'Undetermined',
    confidence: 'Low',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The creator is unknown and the creation date falls in a range where copyright may or may not have expired. The status depends on the unknown author\'s death date. Research to identify the creator is recommended.',
    researchNote: 'If a thorough search fails to identify the creator, consider using the InC-RUU (Rights-holder Unlocatable or Unidentifiable) statement instead.',
  },
  undetermined_defunct: {
    status: 'Undetermined',
    confidence: 'Medium',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The organization that created this work is defunct or its status is unknown. Rights ownership is unclear \u2014 the copyright may have transferred to a successor organization or been abandoned. Research is required to determine the current rights holder.',
    researchNote: 'Research steps: check for successor organizations, review dissolution records and asset transfers, search state incorporation records.',
  },
  undetermined_gov: {
    status: 'Undetermined',
    confidence: 'Low',
    rightsStatement: 'Copyright Undetermined',
    uri: 'https://rightsstatements.org/vocab/UND/1.0/',
    explanation: 'The level of government authorship could not be determined. Federal government works are in the public domain, but state and local government works may be protected. Identify the authoring agency before making a final determination.',
  },
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function statusColors(status: Result['status']) {
  if (status === 'Public Domain') return { bg: 'rgba(60,180,100,0.12)', color: '#3a9e66', border: 'rgba(60,180,100,0.28)', dot: '#3a9e66' }
  if (status === 'In Copyright') return { bg: 'rgba(220,80,60,0.09)', color: '#b94a3b', border: 'rgba(220,80,60,0.22)', dot: '#b94a3b' }
  return { bg: 'rgba(180,140,40,0.1)', color: '#8a6d00', border: 'rgba(180,140,40,0.28)', dot: '#c49a00' }
}

function confidenceColors(confidence: Result['confidence']) {
  if (confidence === 'High') return { bg: '#eef0fb', color: '#7480d4' }
  if (confidence === 'Medium') return { bg: '#fff8e1', color: '#7a5c00' }
  return { bg: '#f3f4f6', color: '#6b7280' }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NavigatorPage() {
  const [history, setHistory] = useState<string[]>(['material_type'])
  const [result, setResult] = useState<Result | null>(null)

  const currentStepId = history[history.length - 1]
  const currentStep = STEPS[currentStepId]
  const progress = result ? 100 : Math.min(Math.round((history.length / 6) * 85), 85)

  function handleOption(next: string) {
    if (next.startsWith('result:')) {
      const key = next.replace('result:', '')
      setResult(RESULTS[key])
    } else {
      setHistory(prev => [...prev, next])
    }
  }

  function handleBack() {
    if (result) {
      setResult(null)
    } else if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1))
    }
  }

  function handleReset() {
    setHistory(['material_type'])
    setResult(null)
  }

  return (
    <main style={{ fontFamily: "'Source Sans 3', -apple-system, sans-serif", minHeight: '100vh', backgroundColor: '#f8f7f5' }}>
      <Nav />

      {/* Hero */}
      <section
        style={{
          backgroundColor: '#ffffff',
          paddingTop: '3rem',
          paddingBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e5f0 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }} />
        <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 1 }}>
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
              marginBottom: '1.25rem',
            }}
          >
            Copyright Navigator
          </div>
          <h1
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              color: '#1e3a5f',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}
          >
            Step-by-step copyright{' '}
            <em style={{ color: '#7480d4', fontStyle: 'italic' }}>determination</em>
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 300, lineHeight: 1.75, maxWidth: '38rem' }}>
            Answer a series of yes/no questions about your material and Navigator will determine the copyright status and recommend a RightsStatements.org designation.
          </p>
        </div>
      </section>

      {/* Navigator card */}
      <section style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

          {/* Progress bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ba6e0', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                {result ? 'Complete' : `Step ${history.length}`}
              </span>
              {history.length > 1 && (
                <button
                  onClick={handleBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ba6e0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  &#8592; Back
                </button>
              )}
            </div>
            <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#7480d4',
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Card */}
          {!result ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#e5e7eb',
              }}
            >
              {/* Question header */}
              <div style={{ padding: '2rem 2rem 1.5rem' }}>
                <h2
                  style={{
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.25rem, 2vw, 1.55rem)',
                    color: '#1e3a5f',
                    lineHeight: 1.35,
                    marginBottom: currentStep.hint ? '0.75rem' : 0,
                  }}
                >
                  {currentStep.question}
                </h2>
                {currentStep.hint && (
                  <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 300, lineHeight: 1.65, margin: 0 }}>
                    {currentStep.hint}
                  </p>
                )}
              </div>

              {/* Options */}
              <div style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column' as const, gap: '0.625rem' }}>
                {currentStep.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleOption(option.next)}
                    style={{
                      width: '100%',
                      textAlign: 'left' as const,
                      background: 'none',
                      cursor: 'pointer',
                      padding: '0.875rem 1.125rem',
                      borderRadius: '0.625rem',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderColor: '#e5e7eb',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      gap: '0.2rem',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#7480d4'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9f9ff'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f', lineHeight: 1.3 }}>
                      {option.label}
                    </span>
                    {option.sublabel && (
                      <span style={{ fontSize: '0.9rem', fontWeight: 300, color: '#6b7280', lineHeight: 1.5 }}>
                        {option.sublabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Result card
            <ResultCard result={result} onReset={handleReset} />
          )}

          {/* Disclaimer */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.875rem 1.125rem',
              backgroundColor: '#eef0fb',
              borderRadius: '0.625rem',
              border: 'none',
              borderLeft: '3px solid #7480d4',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: '#1e3a5f', fontWeight: 400, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ fontWeight: 700 }}>Navigator provides research guidance only and does not constitute legal advice.</strong>{' '}
              For high-stakes determinations, consult a copyright attorney.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

// ── Result card ────────────────────────────────────────────────────────────────

function ResultCard({ result, onReset }: { result: Result; onReset: () => void }) {
  const sc = statusColors(result.status)
  const cc = confidenceColors(result.confidence)

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
      }}
    >
      {/* Status header */}
      <div
        style={{
          padding: '1.75rem 2rem',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: sc.bg,
              color: sc.color,
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              padding: '0.4rem 0.875rem',
              borderRadius: '9999px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: sc.border,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: sc.dot, display: 'inline-block' }} />
            {result.status}
          </span>
          <span
            style={{
              backgroundColor: cc.bg,
              color: cc.color,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              padding: '0.3rem 0.625rem',
              borderRadius: '9999px',
            }}
          >
            {result.confidence} confidence
          </span>
        </div>
      </div>

      {/* Rights statement */}
      <div
        style={{
          margin: '1.5rem 2rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#f8f7f5',
          borderRadius: '0.625rem',
          borderLeftWidth: '3px',
          borderLeftStyle: 'solid',
          borderLeftColor: '#7480d4',
        }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ba6e0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.375rem' }}>
          Recommended Rights Statement
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a5f', marginBottom: '0.375rem' }}>
          {result.rightsStatement}
        </div>
        <a
          href={result.uri}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.78rem', color: '#7480d4', fontWeight: 400, wordBreak: 'break-all' as const }}
        >
          {result.uri}
        </a>
      </div>

      {/* Explanation */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: result.researchNote ? '0' : '1.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ba6e0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
          Explanation
        </div>
        <p style={{ fontSize: '1rem', color: '#4b5563', fontWeight: 300, lineHeight: 1.75, margin: 0 }}>
          {result.explanation}
        </p>
      </div>

      {/* Research note */}
      {result.researchNote && (
        <div
          style={{
            margin: '1.25rem 2rem',
            padding: '0.875rem 1.125rem',
            backgroundColor: '#eef0fb',
            borderRadius: '0.625rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7480d4', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.375rem' }}>
            Research Steps
          </div>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
            {result.researchNote}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: '1.25rem 2rem 1.75rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap' as const,
          alignItems: 'center',
        }}
      >
        <button
          onClick={onReset}
          style={{
            backgroundColor: '#7480d4',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Start a new determination
        </button>
        <Link
          href="/compass"
          style={{
            fontSize: '0.875rem',
            color: '#7480d4',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Try Compass for complex questions
        </Link>
      </div>
    </div>
  )
}
