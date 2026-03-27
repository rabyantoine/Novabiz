// Skeleton loader for table/list pages
// Usage: if (loading) return <SkeletonLoader rows={6} stats={3} />

type Props = {
  rows?: number
  stats?: number
  cols?: number[]  // relative widths in %, e.g. [30, 20, 15, 15, 10, 10]
}

const SKEL: React.CSSProperties = {
  background: 'linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: '6px',
}

function S({ w, h = 14, style }: { w: number | string; h?: number; style?: React.CSSProperties }) {
  return <div style={{ ...SKEL, width: typeof w === 'number' ? `${w}px` : w, height: `${h}px`, ...style }} />
}

export default function SkeletonLoader({ rows = 6, stats = 3, cols = [28, 18, 14, 14, 12, 10] }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Nav */}
      <div style={{ background: '#0B1F45', height: '64px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '32px' }}>
        <div style={{ ...SKEL, width: '96px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', backgroundSize: '200% 100%' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[60, 60, 50, 45, 50, 65, 60].map((w, i) => (
            <div key={i} style={{ ...SKEL, width: `${w}px`, height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', backgroundSize: '200% 100%' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '40px 2rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <S w={180} h={26} />
            <S w={120} h={13} />
          </div>
          <S w={148} h={40} style={{ borderRadius: '10px' }} />
        </div>

        {/* Stat cards */}
        {stats > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats}, 1fr)`, gap: '16px', marginBottom: '32px' }}>
            {Array.from({ length: stats }).map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <S w="55%" h={11} />
                <S w="70%" h={26} />
                <S w="45%" h={11} />
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'flex', gap: '0', padding: '12px 20px', borderBottom: '1px solid rgba(11,31,69,0.08)', background: 'rgba(11,31,69,0.015)' }}>
            {cols.map((w, i) => (
              <div key={i} style={{ flex: w, paddingRight: '12px' }}>
                <S w="70%" h={11} />
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }).map((_, ri) => (
            <div key={ri} style={{ display: 'flex', padding: '17px 20px', borderBottom: ri < rows - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none', alignItems: 'center' }}>
              {cols.map((w, ci) => (
                <div key={ci} style={{ flex: w, paddingRight: '12px' }}>
                  {ci === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <S w="80%" h={14} />
                      <S w="55%" h={11} />
                    </div>
                  ) : (
                    <S w={`${60 + (ci % 3) * 10}%`} h={13} style={{ animationDelay: `${ci * 0.07}s` }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
