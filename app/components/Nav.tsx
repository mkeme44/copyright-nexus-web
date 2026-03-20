'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Nav() {
  const [servicesOpen, setServicesOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-8 h-[64px] flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2 no-underline">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 2L12.8 9.2L20 11L12.8 12.8L11 20L9.2 12.8L2 11L9.2 9.2Z" stroke="#7480d4" strokeWidth="1.3" fill="rgba(116,128,212,0.12)" />
          </svg>
          <span style={{ fontFamily: 'Libre Baskerville, Georgia, serif' }} className="text-[18px] font-bold text-navy tracking-tight">
            Copyright Nexus
          </span>
        </Link>

        <div className="flex items-center gap-8">

          <div className="relative">
            <button
              className="text-[16px] text-muted-text hover:text-navy transition-colors duration-150 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
              onClick={() => setServicesOpen(!servicesOpen)}
            >
              Services
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: '1px' }}>
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {servicesOpen && (
              <div
                className="absolute top-[calc(100%+12px)] left-0 bg-white rounded-lg py-2 z-50"
                style={{ minWidth: '200px', boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)' }}
              >
                <Link href="/compass" className="flex items-center justify-between px-4 py-[10px] text-[15px] text-navy no-underline hover:bg-gray-50 transition-colors" onClick={() => setServicesOpen(false)}>
                  Compass
                  </Link>
                <Link href="/navigator" className="flex items-center justify-between px-4 py-[10px] text-[15px] text-navy no-underline hover:bg-gray-50 transition-colors" onClick={() => setServicesOpen(false)}>
                  Navigator                  
                </Link>
                             </div>
            )}
          </div>

          <Link href="/our-approach" className="text-[16px] text-muted-text hover:text-navy transition-colors duration-150 no-underline">
            Our Approach
          </Link>
          <Link href="/about" className="text-[16px] text-muted-text hover:text-navy transition-colors duration-150 no-underline">
            About
          </Link>
          <Link
            href="/compass"
            className="text-[16px] font-semibold text-white bg-periwinkle px-5 py-2 rounded hover:bg-[#6570c4] transition-colors duration-150 no-underline"
            style={{ boxShadow: '0 1px 4px rgba(116,128,212,0.35)' }}
          >
            Open Compass
          </Link>
        </div>

      </div>
    </nav>
  )
}