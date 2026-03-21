'use client'

import Link from 'next/link'
import Nav from './components/Nav'
import CompassPreview from './components/CompassPreview'

export default function Home() {
  return (
    <main>
      <Nav />

      {/* HERO */}
      <section className="bg-white px-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e5f0 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(116,128,212,0.06) 0%, transparent 65%)' }} />
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 gap-16 items-center py-24 relative z-10">
          <div>
            <h1 className="text-[50px] font-bold text-navy leading-[1.1] tracking-[-0.025em] mb-6" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
              Your starting point for{' '}
              <em className="italic text-periwinkle">confident</em>{' '}
              copyright research.
            </h1>
            <p className="text-[17px] font-light text-muted-text leading-[1.75] mb-9 max-w-[460px]">
              Cultural heritage professionals make copyright determinations every day that impact what to digitize, how to share, and what collections are made accessible to the people they serve. Copyright Nexus offers you the research infrastructure to make those determinations accurately and confidently.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/services" className="bg-periwinkle text-white text-[14px] font-semibold px-6 py-3 rounded no-underline hover:bg-[#6570c4] transition-colors duration-150" style={{ boxShadow: '0 4px 14px rgba(116,128,212,0.4)' }}>
                Copyright Services
              </Link>
              <Link href="/our-approach" className="text-navy text-[14px] font-semibold no-underline px-6 py-3 rounded transition-colors duration-150 hover:bg-gray-50" style={{ border: '1px solid #1e3a5f' }}>
                Our Approach
              </Link>
            </div>
          </div>
          <div>
            <CompassPreview size="sm" />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-off-white px-12 py-16">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[36px] font-bold text-navy leading-[1.2] tracking-[-0.02em] mb-7" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
            Good copyright research{' '}
            <em className="italic text-periwinkle">opens</em>{' '}
            collections.
          </h2>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.8] mb-5">
            Every item in your collection has a copyright status, and knowing it accurately is what allows your institution to share content responsibly and expansively. For institutions without dedicated legal staff, getting to that determination thoroughly and efficiently is one of the most persistent challenges in collections work.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.8] mb-5">
            Good copyright research does not favor any outcome. It gives your institution{' '}
            <strong className="text-navy font-semibold">a well researched answer</strong>,
            one that supports responsible access, respects the rights of creators, and holds up to scrutiny regardless of where it lands.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.8]">
            Copyright Nexus was built for institutions that want to do this right. It is not a substitute for legal counsel, but it is the rigorous, documented starting point that responsible copyright research deserves.
          </p>
        </div>
      </section>

      {/* COMPASS SHOWCASE */}
      <section className="bg-white px-12 py-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[36px] font-bold text-navy leading-[1.2] mb-5" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
              Meet{' '}
              <em className="italic text-periwinkle">Copyright Compass.</em>
            </h2>
            <p className="text-[15px] font-light text-[#4b5563] leading-[1.8] mb-4">
              Compass is our flagship AI-powered research service. Ask any copyright question you have about a published title, a publication era, an unpublished manuscript, archival correspondence, or a government document, and Compass will search across verified copyright and biographical databases to provide trusted guidance on the copyright status of your collections.
            </p>
            <p className="text-[15px] font-light text-[#4b5563] leading-[1.8] mb-4">
              With each determination, Compass returns a confidence level with a specific explanation of how the rights status was reached, alongside a recommended RightsStatements.org designation for the work.
            </p>
            <p className="text-[15px] font-light text-[#4b5563] leading-[1.8] mb-7">
              Compass does not offer any legal opinions. Instead, it is the most thorough, documented starting point available in your copyright journey.
            </p>
            <Link href="/compass" className="inline-block bg-periwinkle text-white text-[14px] font-semibold px-6 py-3 rounded no-underline hover:bg-[#6570c4] transition-colors duration-150" style={{ boxShadow: '0 4px 14px rgba(116,128,212,0.4)' }}>
              Open Copyright Compass
            </Link>
          </div>
          <div>
            <CompassPreview size="lg" />
          </div>
        </div>
      </section>

      {/* SUITE */}
      <section className="bg-off-white px-12 py-16">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-12">
            <h2 className="text-[36px] font-bold text-navy leading-[1.2] mb-4" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
              Built on the same{' '}
              <em className="italic text-periwinkle">foundation.</em>{' '}
              Designed for specific{' '}
              <em className="italic text-periwinkle">workflows.</em>
            </h2>
            <p className="text-[16px] font-light text-muted-text leading-[1.7]">
              Every service in the Copyright Nexus suite draws on the same verified research infrastructure.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8" style={{ borderTop: '4px solid #7480d4', borderLeft: '4px solid #7480d4', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 className="text-[19px] font-bold text-navy mb-1" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
                  Copyright Compass
                </h3>
                <span className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-periwinkle mb-3">
                  AI-powered research
                </span>
                <p className="text-[14px] font-light text-muted-text leading-[1.7] mb-5">
                  Share information about a work and receive rights guidance powered by trusted copyright and biographical databases.
                </p>
                <Link href="/compass" className="inline-block text-[13px] font-semibold text-white bg-periwinkle px-4 py-2 rounded no-underline hover:bg-[#6570c4] transition-colors duration-150">
                  Open Compass
                </Link>
              </div>
              <div className="bg-white p-8" style={{ borderTop: '4px solid #7480d4', borderLeft: '4px solid #7480d4', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 className="text-[19px] font-bold text-navy mb-1" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
                  Copyright Navigator
                </h3>
                <span className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-periwinkle mb-3">
                  Step-by-step guided analysis
                </span>
                <p className="text-[14px] font-light text-muted-text leading-[1.7] mb-5">
                  Answer straightforward questions about publication date, copyright notice, and renewals for your items to arrive at a clear rights determination. No prior copyright expertise required.
                </p>
                <a href="https://forms.gle/W7Xio92dLx5h7FHR9" target="_blank" rel="noopener noreferrer" className="inline-block text-[13px] font-semibold text-white bg-periwinkle px-4 py-2 rounded no-underline hover:bg-[#6570c4] transition-colors duration-150">
                  Open Navigator
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8" style={{ borderTop: '4px solid #7480d4', borderLeft: '4px solid #7480d4', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 className="text-[19px] font-bold text-navy mb-1" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
                  Copyright History
                </h3>
                <span className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-periwinkle mb-3">
                  Published work renewal timeline
                </span>
                <p className="text-[14px] font-light text-muted-text leading-[1.7] mb-5">
                  Search by title and author to retrieve the full copyright lifecycle of a specific work, including original registration, renewal records, current status, and projected expiration date.
                </p>
                <span className="inline-block text-[13px] font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded">
                  Coming Soon
                </span>
              </div>
              <div className="bg-white p-8" style={{ borderTop: '4px solid #7480d4', borderLeft: '4px solid #7480d4', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 className="text-[19px] font-bold text-navy mb-1" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
                  Rights Scan
                </h3>
                <span className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-periwinkle mb-3">
                  Rights review for digital collections
                </span>
                <p className="text-[14px] font-light text-muted-text leading-[1.7] mb-5">
                  Provide a link or upload a list of items and receive a rights assessment for each, ready to integrate into your digital asset management workflow.
                </p>
                <span className="inline-block text-[13px] font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-white px-12 py-16">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[36px] font-bold text-navy leading-[1.2] mb-6" style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}>
            Built using{' '}
            <em className="italic text-periwinkle">verified</em>{' '}
            sources.{' '}
            <em className="italic text-periwinkle">Transparent</em>{' '}
            about our process.
          </h2>
          <p className="text-[16px] font-light text-muted-text leading-[1.75] mb-4">
            Copyright Nexus draws on authoritative databases and reference materials to answer every question. Copyright Nexus is transparent about the confidence level of each determination because accuracy requires honesty about uncertainty. When data about an item is found, we will tell you where to find it. If no data is found, we tell you what that means and recommend next steps.
          </p>
          <p className="text-[15px] font-light text-muted-text mb-8">
            Want to understand the methodology behind every determination?{' '}
            <Link href="/our-approach" className="font-semibold text-periwinkle no-underline border-b pb-px" style={{ borderColor: 'rgba(116,128,212,0.35)' }}>
              Learn more about Our Approach
            </Link>
          </p>

          <div style={{ borderTop: '4px solid #7480d4', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center justify-between bg-white px-8 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">Stanford Copyright Renewal Database</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Book renewal records for publications from 1923 to 1963</div>
              </div>
              <a href="https://exhibits.stanford.edu/copyrightrenewals" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', textDecoration: 'none', flexShrink: 0, marginLeft: '32px' }}>View source</a>
            </div>
            <div className="flex items-center justify-between bg-white px-8 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">NYPL Catalog of Copyright Entries</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Records spanning 1950 to 1991</div>
              </div>
              <a href="https://cce-search.nypl.org/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', textDecoration: 'none', flexShrink: 0, marginLeft: '32px' }}>View source</a>
            </div>
            <div className="flex items-center justify-between bg-white px-8 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">U.S. Copyright Office Records</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Renewal registrations</div>
              </div>
              <a href="https://publicrecords.copyright.gov/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', textDecoration: 'none', flexShrink: 0, marginLeft: '32px' }}>View source</a>
            </div>
            <div className="flex items-center justify-between bg-white px-8 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div className="text-[15px] font-semibold text-navy">HathiTrust Copyright Review Management System</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Human-reviewed public domain determinations</div>
              </div>
              <a href="https://www.hathitrust.org/member-libraries/services-programs/copyright-review/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', textDecoration: 'none', flexShrink: 0, marginLeft: '32px' }}>View source</a>
            </div>
            <div className="flex items-center justify-between bg-white px-8 py-5">
              <div>
                <div className="text-[15px] font-semibold text-navy">Wikidata</div>
                <div className="text-[13px] font-light text-muted-text mt-1">Open knowledge base for author biographical records and death dates</div>
              </div>
              <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: '#7480d4', textDecoration: 'none', flexShrink: 0, marginLeft: '32px' }}>View source</a>
            </div>
          </div>
        </div>
      </section>
      </main>
  )
}