'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard' },
  { label: 'Factures',   href: '/factures' },
  { label: 'Devis',      href: '/devis' },
  { label: 'CRM',        href: '/crm' },
  { label: 'Frais',      href: '/frais' },
  { label: 'Relances',   href: '/relances' },
  { label: 'Planning',   href: '/planning' },
  { label: 'Rapports',   href: '/rapports' },
  { label: 'Paramètres', href: '/parametres' },
]

function getInitials(email: string): string {
  const local = email.split('@')[0]
  const parts = local.split(/[._\-+]/)
  if (parts.length >= 2 && parts[1].length > 0) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [activePath, setActivePath] = useState('')
  const [hoverItem, setHoverItem] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActivePath(window.location.pathname)

    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = user?.email ? getInitials(user.email) : '…'

  return (
    <nav style={{
      background: '#0B1F45',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>

      {/* Left: logo + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <a href="/dashboard" style={{
          fontFamily: 'Georgia,serif',
          fontSize: '20px',
          fontWeight: '700',
          color: '#fff',
          textDecoration: 'none',
        }}>
          Nova<span style={{ color: '#C8973A' }}>Biz</span>
        </a>

        <div style={{ display: 'flex', gap: '2px' }}>
          {NAV.map(l => {
            const isActive = activePath === l.href
            return (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: isActive ? '#C8973A' : 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(200,151,58,0.12)' : 'transparent',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                {l.label}
              </a>
            )
          })}
        </div>
      </div>

      {/* Right: user avatar + dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          title={user?.email ?? ''}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: open ? '#b07c2e' : '#C8973A',
            border: `2px solid ${open ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}`,
            color: '#fff',
            fontFamily: 'Georgia,serif',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: open ? '0 0 0 3px rgba(200,151,58,0.3)' : 'none',
            transition: 'background 0.15s, box-shadow 0.15s, border-color 0.15s',
          }}
        >
          {initials}
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(11,31,69,0.22)',
            border: '1px solid rgba(11,31,69,0.1)',
            minWidth: '220px',
            overflow: 'hidden',
            animation: 'fadeDown 0.15s ease',
          }}>

            {/* User info */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(11,31,69,0.08)',
              background: '#FAF8F4',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#0B1F45',
                color: '#C8973A',
                fontFamily: 'Georgia,serif',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}>
                {initials}
              </div>
              <div style={{ fontSize: '11px', color: '#8A92A3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                Connecté en tant que
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#0B1F45',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '188px',
              }}>
                {user?.email ?? '…'}
              </div>
            </div>

            {/* Mon compte */}
            <a
              href="/parametres"
              onClick={() => setOpen(false)}
              onMouseEnter={() => setHoverItem('parametres')}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#0B1F45',
                textDecoration: 'none',
                background: hoverItem === 'parametres' ? 'rgba(11,31,69,0.04)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Mon compte
            </a>

            <div style={{ height: '1px', background: 'rgba(11,31,69,0.07)', margin: '0 12px' }} />

            {/* Se déconnecter */}
            <button
              onClick={handleLogout}
              onMouseEnter={() => setHoverItem('logout')}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#DC2626',
                background: hoverItem === 'logout' ? 'rgba(220,38,38,0.05)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Se déconnecter
            </button>

          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}
