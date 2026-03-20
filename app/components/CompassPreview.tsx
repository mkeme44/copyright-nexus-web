type CompassPreviewProps = {
  size?: 'sm' | 'lg'
}

const smQuery = 'Is The Old Man and the Sea by Hemingway still under copyright?'
const lgQuery = 'What is the status of unpublished letters from someone who died in 1948?'

export default function CompassPreview({ size = 'sm' }: CompassPreviewProps) {
  const isLg = size === 'lg'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#111d2e',
        border: '1px solid rgba(116,128,212,0.18)',
        boxShadow: isLg
          ? '0 20px 50px rgba(13,31,53,0.25), 0 4px 12px rgba(0,0,0,0.12)'
          : '0 25px 60px rgba(13,31,53,0.35), 0 8px 20px rgba(0,0,0,0.15)',
        transform: isLg ? 'none' : 'rotate(-1deg)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-[7px] px-4 py-[10px] border-b"
        style={{ background: '#0d1826', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,90,90,0.45)' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,180,60,0.45)' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(60,200,100,0.45)' }} />
        <span className="text-[11px] mx-auto tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Copyright Compass
        </span>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* Input */}
        <div
          className="rounded-md p-3 mb-[18px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(116,128,212,0.18)' }}
        >
          <span
            className="block text-[10px] font-semibold tracking-[0.12em] uppercase mb-[7px]"
            style={{ color: 'rgba(116,128,212,0.65)' }}
          >
            Question
          </span>
          <div className="text-[13px] italic leading-relaxed" style={{ color: 'rgba(240,237,232,0.78)' }}>
            {isLg ? lgQuery : smQuery}
          </div>
        </div>

        {/* Result header */}
        <div className="flex justify-between items-center mb-[14px]">
          <span
            className="text-[11px] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-full"
            style={isLg
              ? { background: 'rgba(60,180,100,0.12)', color: '#5bb882', border: '1px solid rgba(60,180,100,0.25)' }
              : { background: 'rgba(116,128,212,0.15)', color: '#9ba6e0', border: '1px solid rgba(116,128,212,0.28)' }
            }
          >
            {isLg ? 'Public Domain' : 'In Copyright'}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
            High confidence
          </span>
        </div>

        {/* Work title */}
        <div
          className="text-[16px] font-bold mb-3 leading-snug"
          style={{ fontFamily: 'Libre Baskerville, Georgia, serif', color: '#f0ede8' }}
        >
          {isLg ? 'Unpublished personal correspondence' : 'The Old Man and the Sea'}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 mb-[14px]">
          {(isLg ? [
            ['Creator died', '1948'],
            ['Term expired', 'January 1, 2019'],
            ['Rule applied', 'Life + 70 years'],
            ['Death confirmed', 'Wikidata'],
          ] : [
            ['Published', '1952'],
            ['Expires', 'January 1, 2048'],
            ['Renewal', 'RE52130 · 1980'],
            ['Claimant', 'Scribner'],
          ]).map(([label, value]) => (
            <div key={label}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-[2px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {label}
              </div>
              <div className="text-[12px]" style={{ color: 'rgba(240,237,232,0.72)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Rights statement */}
        <div
          className="px-3 py-[10px] rounded-r mb-3"
          style={{
            background: 'rgba(116,128,212,0.09)',
            borderLeft: isLg ? '2px solid #5bb882' : '2px solid #7480d4',
          }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-[3px]" style={{ color: 'rgba(116,128,212,0.65)' }}>
            Rights Statement
          </div>
          <div className="text-[12px] font-semibold" style={{ color: isLg ? '#5bb882' : '#9ba6e0' }}>
            {isLg ? 'NoC-US — No Copyright United States' : 'InC — In Copyright · rightsstatements.org'}
          </div>
        </div>

        {/* Source tags */}
        <div className="flex gap-[5px] flex-wrap">
          {(isLg ? ['Wikidata', 'Knowledge base'] : ['NYPL CCE', 'Stanford', 'USCO']).map(tag => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-[3px] rounded"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.32)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Example questions — sm only */}
        {!isLg && (
          <div className="mt-[14px] pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Try asking
            </div>
            {[
              'Can I freely digitize a magazine from 1955 with a copyright notice?',
              'Unpublished letters from someone who died in 1948?',
              'What about a federal government report?',
            ].map((q, i, arr) => (
              <div
                key={q}
                className="text-[12px] py-[6px] leading-snug"
                style={{
                  color: 'rgba(240,237,232,0.38)',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                {q}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}