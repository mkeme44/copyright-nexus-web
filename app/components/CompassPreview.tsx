type CompassPreviewProps = {
  size?: 'sm' | 'lg'
}

const CompassIcon = ({ size = 22 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#7480d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={Math.round(size * 0.52)} height={Math.round(size * 0.52)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  </div>
)

export default function CompassPreview({ size = 'sm' }: CompassPreviewProps) {
  const isLg = size === 'lg'

  return (
    <div
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: isLg
          ? '0 20px 50px rgba(13,31,53,0.10), 0 4px 12px rgba(0,0,0,0.06)'
          : '0 25px 60px rgba(13,31,53,0.18), 0 8px 20px rgba(0,0,0,0.08)',
        transform: isLg ? 'none' : 'rotate(-1deg)',
        background: '#f8f7f5',
        position: 'relative',
      }}
    >
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e2e5f0 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6, pointerEvents: 'none' }} />

      {/* Chrome bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
        <CompassIcon size={22} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a5f', letterSpacing: '-0.01em' }}>Copyright Compass</span>
      </div>

      {/* Chat area */}
      <div style={{ padding: '16px 16px 10px', position: 'relative', zIndex: 1 }}>

        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
          <div style={{
            backgroundColor: '#e8ebf8',
            color: '#1e3a5f',
            fontSize: isLg ? '12px' : '11.5px',
            fontWeight: 300,
            lineHeight: 1.55,
            padding: '8px 12px',
            borderRadius: '16px 16px 4px 16px',
            maxWidth: '82%',
          }}>
            {isLg
              ? 'What is the status of unpublished letters from someone who died in 1948?'
              : 'Is The Old Man and the Sea by Hemingway still under copyright?'}
          </div>
        </div>

        {/* Compass response */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <CompassIcon size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                backgroundColor: isLg ? 'rgba(60,180,100,0.12)' : 'rgba(220,80,60,0.09)',
                color: isLg ? '#3a9e66' : '#b94a3b',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                padding: '3px 9px', borderRadius: '9999px',
                border: `1px solid ${isLg ? 'rgba(60,180,100,0.28)' : 'rgba(220,80,60,0.22)'}`,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '9999px', backgroundColor: isLg ? '#3a9e66' : '#b94a3b', display: 'inline-block' }} />
                {isLg ? 'Public Domain' : 'In Copyright'}
              </span>
              <span style={{
                backgroundColor: '#eef0fb', color: '#7480d4',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                padding: '3px 8px', borderRadius: '9999px',
              }}>
                High
              </span>
            </div>

            {/* Work title */}
            <div style={{
              fontFamily: 'Libre Baskerville, Georgia, serif',
              fontSize: isLg ? '13px' : '12.5px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#1e3a5f',
              marginBottom: '7px',
              lineHeight: 1.3,
            }}>
              {isLg ? 'Unpublished personal correspondence' : 'The Old Man and the Sea'}
            </div>

            {/* Answer text */}
            <div style={{ fontSize: isLg ? '11.5px' : '11px', fontWeight: 300, color: '#374151', lineHeight: 1.65, marginBottom: '10px' }}>
              {isLg ? (
                <>
                  <strong style={{ fontWeight: 600, color: '#1e3a5f' }}>COPYRIGHT STATUS — Public Domain.</strong>{' '}
                  Unpublished works by authors who died in 1948 entered the public domain on January 1, 2019 under the life-plus-70 rule. No renewal check is required for unpublished works.
                </>
              ) : (
                <>
                  <strong style={{ fontWeight: 600, color: '#1e3a5f' }}>COPYRIGHT STATUS — In Copyright.</strong>{' '}
                  Published in 1952 with a confirmed renewal (RE-52-130, 1980), this work remains protected until January 1, 2048.
                </>
              )}
            </div>

            {/* Renewal badge */}
            <div style={{ borderRadius: '8px', border: '1px solid #e2e5f0', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ backgroundColor: '#eef0fb', padding: '6px 12px', borderBottom: isLg ? 'none' : '1px solid #e2e5f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#7480d4', fontWeight: 600 }}>Renewal Records</span>
                {isLg ? (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#9ba6e0' }}>Not applicable</span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '9999px', backgroundColor: 'rgba(60,180,100,0.12)', color: '#3a9e66', border: '1px solid rgba(60,180,100,0.28)' }}>
                    Renewed ✓
                  </span>
                )}
              </div>
              {!isLg && (
                <div style={{ padding: '8px 12px', backgroundColor: '#ffffff' }}>
                  <p style={{ fontSize: '10px', color: '#4b5563', fontWeight: 300, marginBottom: '6px', lineHeight: 1.5 }}>
                    Searched for: <strong style={{ fontWeight: 600, color: '#1e3a5f' }}>&ldquo;The Old Man and the Sea&rdquo;</strong> across Stanford Copyright Renewal Database + NYPL CCE
                  </p>
                  <div style={{ backgroundColor: '#f8f7f5', borderRadius: '6px', padding: '5px 8px', fontSize: '10px', color: '#4b5563', fontWeight: 300 }}>
                    <div style={{ fontWeight: 600, color: '#1e3a5f', marginBottom: '2px' }}>Stanford Copyright Renewal Database</div>
                    <div>Matched: <em>The Old Man and the Sea</em> · 97% match</div>
                    <div style={{ color: '#b94a3b', fontWeight: 600, marginTop: '2px' }}>Enters the Public Domain: January 1, 2048</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rights statement */}
            <div style={{
              padding: '6px 10px',
              borderRadius: '0 4px 4px 0',
              borderLeft: `2px solid ${isLg ? '#3a9e66' : '#7480d4'}`,
              backgroundColor: 'rgba(116,128,212,0.06)',
            }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(116,128,212,0.65)', marginBottom: '2px' }}>
                Recommended Rights Statement
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: isLg ? '#3a9e66' : '#7480d4' }}>
                {isLg ? 'NoC-US — No Copyright · United States' : 'InC — In Copyright'}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ padding: '8px 14px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e5f0',
          borderRadius: '10px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ flex: 1, fontSize: '10.5px', color: '#c0c4d8', fontWeight: 300 }}>
            Ask about a work, publication era, or collection…
          </span>
          <div style={{ width: '24px', height: '24px', borderRadius: '7px', backgroundColor: '#f0f1f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b0b7d8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
