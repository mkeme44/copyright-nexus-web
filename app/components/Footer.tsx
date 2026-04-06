// app/components/Footer.tsx
// Matches the homepage footer exactly.
// Add <Footer /> to app/layout.tsx to render sitewide.

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#0d1f35' }} className="px-12 py-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-2 text-[17px] font-bold"
            style={{ fontFamily: 'Libre Baskerville, Georgia, serif', color: '#f0ede8' }}
          >
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 2L12.8 9.2L20 11L12.8 12.8L11 20L9.2 12.8L2 11L9.2 9.2Z"
                stroke="#7480d4"
                strokeWidth="1.3"
                fill="rgba(116,128,212,0.12)"
              />
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
            <a
              href="https://github.com/mkeme44"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-light no-underline"
              style={{ color: 'rgba(240,237,232,0.72)' }}
            >
              GitHub
            </a>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>·</span>
            <Link href="mailto:contact@crnexus.org" className="text-[14px] font-light no-underline" style={{ color: 'rgba(240,237,232,0.72)' }}>Contact</Link>
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
  );
}
