import Nav from '../components/Nav'
import Link from 'next/link'

export default function About() {
  return (
    <main>
      <Nav />

      {/* HERO */}
      <section
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(circle, #d1d5e8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          paddingTop: '6rem',
          paddingBottom: '4rem',
        }}
      >
        <div className="max-w-[780px] mx-auto px-12">
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
            About
          </div>
          <h1
            className="text-[42px] font-bold text-navy leading-[1.15] tracking-[-0.02em] mb-6"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }}
          >
            How Copyright Nexus{' '}
            <em style={{ color: '#7480d4', fontStyle: 'italic' }}>Started</em>
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

    </main>
  )
}
