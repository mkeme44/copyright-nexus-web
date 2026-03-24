import Nav from '../components/Nav'
import Link from 'next/link'

export default function OurApproach() {
  return (
    <main>
      <Nav />

      {/* HERO */}
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
        <div className="max-w-[56rem] mx-auto px-6 relative" style={{ zIndex: 1 }}>
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
            Our Approach
          </div>
          <h1
            className="text-[42px] font-bold text-navy leading-[1.15] tracking-[-0.02em] mb-6"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            How Copyright Nexus{' '}
            <em style={{ color: '#7480d4', fontStyle: 'italic' }}>works.</em>
          </h1>
          <p className="text-[17px] font-light text-muted-text leading-[1.75]">
            Copyright determinations done well support responsible access to collections, respect the rights of creators, and give institutions the documented basis they need to justify their decisions. Copyright Nexus was built to make that work more accurate, more efficient, and more accessible for institutions of every size, with or without dedicated legal staff.
          </p>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="bg-white px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-5"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Our Approach
          </h2>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            Copyright Nexus combines a structured knowledge base of U.S. copyright law with direct queries against verified renewal and biographical databases to deliver accurate, documented rights determinations for any work in your collection. Every determination follows the established legal framework for U.S. copyright status, the same framework used by copyright professionals across libraries, archives, and museums, and returns a confidence level that is honest about what the data does and does not support.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85]">
            Each service draws on verified records, applies established legal rules, and documents the reasons for every determination.
          </p>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="bg-off-white px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-5"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Our Methodology
          </h2>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            Our methodology is grounded in U.S. copyright law, combined with work done by the{' '}
            <a href="https://www.lib.umn.edu/copyright/rights-review/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">University of Minnesota</a>
            {' '}and{' '}
            <a href="https://padigital.org/rights-resources/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">PA Digital</a>
            , to establish the decision framework that guides every rights determination.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            Each determination draws on up to five authoritative sources depending on the nature of the work being researched.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            For published works, we search across renewal records from the{' '}
            <a href="https://exhibits.stanford.edu/copyrightrenewals" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">Stanford Copyright Renewal Database</a>
            ,{' '}
            <a href="https://cce-search.nypl.org/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">NYPL Catalog of Copyright Entries</a>
            ,{' '}
            <a href="https://publicrecords.copyright.gov/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">U.S. Copyright Office</a>
            , and the{' '}
            <a href="https://www.hathitrust.org/member-libraries/services-programs/copyright-review/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">HathiTrust Copyright Review Management System</a>
            {' '}to determine whether copyright was maintained or has lapsed.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            For unpublished works, along with following guidance from UMN and PA Digital, we query{' '}
            <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">Wikidata</a>
            {' '}biographical records to establish author death dates and calculate copyright term.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            For government works, we apply the federal authorship rules established under 17 U.S.C. 105. We hope to be able to expand to include U.S. state level works as well.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85]">
            Finally, standardized rights statements from{' '}
            <a href="https://rightsstatements.org" target="_blank" rel="noopener noreferrer" className="text-periwinkle font-semibold no-underline">RightsStatements.org</a>
            {' '}are included with every rights determination made by Copyright Nexus.
          </p>
        </div>
      </section>

      {/* CONFIDENCE LEVELS */}
      <section className="bg-white px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-5"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Confidence Levels
          </h2>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-8">
            Every determination Copyright Nexus returns includes one of three confidence levels.
          </p>

          <div style={{ borderTop: '4px solid #7480d4', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="bg-white px-8 py-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded" style={{ background: '#eef0fb', color: '#7480d4' }}>High</span>
              </div>
              <p className="text-[15px] font-light text-[#4b5563] leading-[1.75]">
                A verified record was found, or the legal rule is unambiguous. The determination is well-supported.
              </p>
            </div>
            <div className="bg-white px-8 py-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded" style={{ background: '#fff8e1', color: '#7a5c00' }}>Medium</span>
              </div>
              <p className="text-[15px] font-light text-[#4b5563] leading-[1.75]">
                The determination is based on available evidence but additional research is recommended before relying on it for high-stakes decisions.
              </p>
            </div>
            <div className="bg-white px-8 py-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>Low</span>
              </div>
              <p className="text-[15px] font-light text-[#4b5563] leading-[1.75]">
                Insufficient data exists to reach a confident determination. Further research is required.
              </p>
            </div>
          </div>

          <p className="text-[15px] font-light text-muted-text leading-[1.75] mt-6">
            Confidence levels reflect exactly what the available evidence supports. Nothing more, nothing less. Responsible copyright research requires honesty about uncertainty, and that is what these levels are designed to provide.
          </p>
        </div>
      </section>

      {/* LIMITATIONS */}
      <section className="bg-off-white px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-5"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Limitations
          </h2>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85]">
            Copyright Nexus is a research assistance platform, not a substitute for legal counsel. Our determinations reflect U.S. copyright law only and are not intended to address copyright status in other jurisdictions. For works with complex ownership histories, foreign publication origins, or high institutional stakes, we recommend consulting a copyright attorney or contacting the U.S. Copyright Office directly.
          </p>
        </div>
      </section>

      {/* FURTHER READING */}
      <section className="bg-white px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-6"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Further Reading
          </h2>
          <div style={{ borderTop: '4px solid #7480d4', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <a href="https://rightsstatements.org" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white px-8 py-5 no-underline" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">RightsStatements.org</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Standardized rights designations for cultural heritage institutions</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', flexShrink: 0, marginLeft: '32px' }}>Visit</span>
            </a>
            <a href="https://www.lib.umn.edu/copyright/rights-review/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white px-8 py-5 no-underline" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">University of Minnesota Rights Review Chart</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Decision chart for copyright status determination</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', flexShrink: 0, marginLeft: '32px' }}>Visit</span>
            </a>
            <a href="https://padigital.org/rights-resources/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white px-8 py-5 no-underline" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">PA Digital Rights Resources</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Rights determination resources for Pennsylvania digital collections</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', flexShrink: 0, marginLeft: '32px' }}>Visit</span>
            </a>
            <a href="https://www.copyright.gov" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white px-8 py-5 no-underline">
              <div>
                <div className="text-[15px] font-semibold text-navy">U.S. Copyright Office</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Official copyright registration and records</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', flexShrink: 0, marginLeft: '32px' }}>Visit</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}
