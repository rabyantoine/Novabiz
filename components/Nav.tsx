'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const LINKS = [
  { label: 'Dashboard',  href: '/dashboard' },
  { label: 'Factures',   href: '/factures' },
  { label: 'Devis',      href: '/devis' },
  { label: 'Catalogue',  href: '/produits' },
  { label: 'CRM',        href: '/crm' },
  { label: 'Frais',      href: '/frais' },
  { label: 'Relances',   href: '/relances' },
  { label: 'Planning',   href: '/planning' },
  { label: 'Rapports',   href: '/rapports' },
  { label: 'Classeur',   href: '/classeur' },
  { label: 'Paramètres', href: '/parametres' },
]

export default function Nav() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
          {LINKS.map(l => {
            const active = pathname === l.href
            return (
              <a key={l.href} href={l.href} style={{
                fontSize: '13px',
                fontWeight: active ? '700' : '500',
                color: active ? '#C8973A' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'transparent',
                borderBottom: active ? '2px solid #C8973A' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}>
                {l.label}
              </a>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{email}</span>
        <button onClick={handleLogout} style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.7)',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          cursor: 'pointer',
        }}>
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
