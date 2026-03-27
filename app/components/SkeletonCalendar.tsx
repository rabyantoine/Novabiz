// Skeleton loader for the Planning calendar page

const SKEL: React.CSSProperties = {
  background: 'linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: '6px',
}

function S({ w, h = 14, style }: { w: number | string; h?: number; style?: React.CSSProperties }) {
  return <div style={{ ...SKEL, width: typeof w === 'number' ? `${w}px` : w, height: `${h}px`, ...style }} />
}

export default function SkeletonCalendar() {
  // 5 weeks × 7 days
  const weeks = Array.from({ length: 5 })
  const days = Array.from({ length: 7 })

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

      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <S w={32} h={32} style={{ borderRadius: '8px' }} />
            <S w={180} h={26} />
            <S w={32} h={32} style={{ borderRadius: '8px' }} />
          </div>
          <S w={148} h={40} style={{ borderRadius: '10px' }} />
        </div>

        {/* Calendar grid */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid rgba(11,31,69,0.08)' }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#8A92A3', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((_, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < 4 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
              {days.map((_, di) => {
                const hasEvent = (wi * 7 + di) % 4 === 1 || (wi * 7 + di) % 7 === 3
                return (
                  <div key={di} style={{ minHeight: '100px', padding: '10px 8px', borderRight: di < 6 ? '1px solid rgba(11,31,69,0.06)' : 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Day number */}
                    <S w={24} h={20} style={{ borderRadius: '50%', alignSelf: 'flex-end', animationDelay: `${(wi * 7 + di) * 0.03}s` }} />
                    {/* Event chips */}
                    {hasEvent && <S w="90%" h={18} style={{ borderRadius: '4px', animationDelay: `${(wi * 7 + di) * 0.04}s` }} />}
                    {hasEvent && di % 3 === 0 && <S w="75%" h={18} style={{ borderRadius: '4px', animationDelay: `${(wi * 7 + di) * 0.05}s` }} />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
