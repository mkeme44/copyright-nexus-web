import Nav from '../components/Nav'
import Link from 'next/link'

export default function About() {
  return (
    <main>
      <Nav />

      {/* HERO */}
      <section className="bg-off-white px-12 py-8">
        <div className="max-w-[780px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-px bg-periwinkle" />
            <span className="text-[11px] font-semibold tracking-[0.13em] uppercase text-periwinkle">
              About
            </span>
          </div>
          <h1
            className="text-[42px] font-bold text-navy leading-[1.15] tracking-[-0.02em] mb-6"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            How Copyright Nexus Started
          </h1>
          <p className="text-[17px] font-light text-muted-text leading-[1.75]">
            Copyright Nexus is an independent academic platform and is not affiliated with any institution, publisher, or rights organization.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white px-12 py-8">
        <div className="max-w-[780px] mx-auto">
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            Copyright Nexus has its roots in a practical problem that professionals in cultural heritage institutions face every day. How do you get from a copyright question to a reliable answer efficiently, accurately, and without a law degree?
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            The story begins at the Connecticut Digital Archive (CTDA), where Mike Kemezis worked under the direction of Greg Colati, then the Associate University Librarian. Greg wanted something akin to the Creative Commons license chooser, a clear and accessible instrument that guides any creator to the right license for their work. That vision set the project in motion.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            The first tool Mike built was an HTML clickthrough website that translated the copyright decision flowcharts developed by the University of Minnesota and PA Digital into a linked series of web pages, walking users through the decision logic step by step. It was a working tool built for working professionals, and it did its job.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            When Mike moved to CT Humanities, he wanted to rebuild it. The CTDA had migrated systems and taken the original tool offline, but the need had not gone away. Working to reconstruct the decision tree, he found himself thinking about the problem differently. A decision tree was useful but did not provide the depth needed for reliable guidance, and any version he built would likely need to be rebuilt again within a few years. There had to be a better way.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85] mb-6">
            That question led to Copyright Nexus as it exists today. Rather than rebuilding a static decision tree, Mike set out to build something that could reason through copyright status dynamically, drawing on live renewal databases, biographical records, and a structured knowledge base grounded in established copyright law. The result is a platform designed to grow with the field rather than fall behind it.
          </p>
          <p className="text-[16px] font-light text-[#4b5563] leading-[1.85]">
            The project that would become Copyright Nexus was initially developed during Mike's tenure at CT Humanities, whose support made that work possible.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-off-white px-12 py-16">
        <div className="max-w-[780px] mx-auto">
          <h2
            className="text-[28px] font-bold text-navy leading-[1.2] mb-4"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            Contact
          </h2>
          <p className="text-[16px] font-light text-muted-text leading-[1.75] mb-6">
            Questions about the platform, the methodology, or potential institutional partnerships? Get in touch.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-periwinkle text-white text-[14px] font-semibold px-6 py-3 rounded no-underline"
          >
            Send a message
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0d1f35' }} className="px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[17px] font-bold" style={{ fontFamily: 'Libre Baskerville, Georgia, serif', color: '#f0ede8' }}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L12.8 9.2L20 11L12.8 12.8L11 20L9.2 12.8L2 11L9.2 9.2Z" stroke="#7480d4" strokeWidth="1.3" fill="rgba(116,128,212,0.12)" />
              </svg>
              Copyright Nexus
            </div>
            <div className="flex items-center gap-6">
              <Link href="/compass" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>Compass</Link>
              <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
              <Link href="/navigator" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>Navigator</Link>
              <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
              <Link href="/our-approach" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>Our Approach</Link>
              <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
              <Link href="/about" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>About</Link>
              <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
              <a href="https://github.com/mkeme44" target="_blank" rel="noopener noreferrer" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>GitHub</a>
              <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
              <Link href="/contact" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>Contact</Link>
            </div>
          </div>
          <div className="pt-5 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[12px] font-light" style={{ color: 'rgba(240,237,232,0.45)' }}>
              Copyright Nexus provides research assistance only and does not constitute legal advice. For high-stakes determinations, consult a copyright attorney or the U.S. Copyright Office directly.
            </p>
            <p className="text-[12px] font-light" style={{ color: 'rgba(240,237,232,0.45)' }}>
              Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license.
            </p>
            <p className="text-[12px] font-light" style={{ color: 'rgba(240,237,232,0.45)' }}>
              &copy; 2026 Copyright Nexus
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}