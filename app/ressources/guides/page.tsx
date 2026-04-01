'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const FILTERS = ['Tous', 'Facturation', 'Gestion', 'Comptabilité', 'IA']

const GUIDES = [
  {
    title: 'Comment créer sa première facture conforme en France',
    category: 'Facturation',
    readTime: '5 min',
    gradient: 'linear-gradient(135deg, #0B1F45 0%, #1a3a6e 100%)',
    accent: '#C8973A',
  },
  {
    title: 'Relances impayés : quelle fréquence et quel ton adopter ?',
    category: 'Gestion',
    readTime: '8 min',
    gradient: 'linear-gradient(135deg, #1a3a6e 0%, #C8973A 100%)',
    accent: '#fff',
  },
  {
    title: 'TVA pour les indépendants : ce qu\'il faut savoir',
    category: 'Comptabilité',
    readTime: '6 min',
    gradient: 'linear-gradient(135deg, #0d2a55 0%, #0B1F45 100%)',
    accent: '#C8973A',
  },
  {
    title: 'Comment réduire ses délais de paiement de 40%',
    category: 'Gestion',
    readTime: '7 min',
    gradient: 'linear-gradient(135deg, #C8973A 0%, #b07c2e 100%)',
    accent: '#fff',
  },
  {
    title: 'Facturation électronique obligatoire 2026 : êtes-vous prêt ?',
    category: 'Facturation',
    readTime: '4 min',
    gradient: 'linear-gradient(135deg, #112240 0%, #1a3a6e 100%)',
    accent: '#C8973A',
  },
  {
    title: 'L\'IA au service de la relance client : guide complet',
    category: 'IA',
    readTime: '10 min',
    gradient: 'linear-gradient(135deg, #0B1F45 0%, #C8973A 100%)',
    accent: '#fff',
  },
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Facturation: { bg: 'rgba(200,151,58,0.12)', text: '#C8973A' },
  Gestion: { bg: 'rgba(11,31,69,0.08)', text: '#0B1F45' },
  Comptabilité: { bg: 'rgba(74,98,138,0.12)', text: '#4A628A' },
  IA: { bg: 'rgba(16,185,129,0.10)', text: '#059669' },
}

function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', boxShadow: scrolled ? '0 2px 20px rgba(11,31,69,0.10)' : '0 1px 0 rgba(11,31,69,0.06)', transition: 'box-shadow 0.2s' }}>
      <nav style={{ maxWidth: 1180, margin: '0 auto', padding: '0 2rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: '#0B1F45', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 18, color: '#C8973A' }}>N</div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>Nova<span style={{ color: '#C8973A' }}>Biz</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {[{ label: 'Fonctionnalités', href: '/#fonctionnalites' }, { label: 'Tarifs', href: '/#tarifs' }, { label: 'Ressources', href: '/#ressources' }].map(l => (
            <a key={l.href} href={l.href} style={{ padding: '6px 14px', fontSize: 14, fontWeight: 500, color: '#3D4F6B', borderRadius: 8 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0B1F45'; (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3D4F6B'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <Link href="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#0B1F45', borderRadius: 8, border: '1.5px solid rgba(11,31,69,0.18)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >Se connecter</Link>
          <Link href="/signup" style={{ padding: '8px 18px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#0B1F45', borderRadius: 8, border: '1.5px solid #0B1F45' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
          >Essayer gratuitement</Link>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#070F22', padding: '48px 2rem 32px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, background: '#0B1F45', border: '1px solid rgba(200,151,58,0.4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 16, color: '#C8973A' }}>N</div>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>Nova<span style={{ color: '#C8973A' }}>Biz</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 1.7 }}>La solution de gestion administrative pour les entreprises françaises.</p>
          </div>
          {[
            { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Nouveautés', 'Roadmap'] },
            { title: 'Ressources', links: ['Centre d\'aide', 'Guides pratiques', 'Blog', 'API'] },
            { title: 'Légal', links: ['Mentions légales', 'CGU', 'Confidentialité', 'RGPD'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 9, fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>© 2026 NovaBiz · Tous droits réservés</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>🇫🇷 Conçu et hébergé en France</span>
        </div>
      </div>
    </footer>
  )
}

export default function Guides() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Tous')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const filtered = activeFilter === 'Tous' ? GUIDES : GUIDES.filter(g => g.category === activeFilter)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; background: #FAF8F4; color: #0B1F45; }
        a { text-decoration: none; color: inherit; }
        @media (max-width: 768px) {
          .guides-grid { grid-template-columns: 1fr !important; }
          .footer-grid-inner { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* Hero */}
      <section style={{ background: '#fff', padding: '72px 2rem 64px', borderBottom: '1px solid rgba(11,31,69,0.07)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.10)', border: '1px solid rgba(200,151,58,0.30)', borderRadius: 100, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: '#C8973A', marginBottom: 20 }}>
            Guides pratiques
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: '#0B1F45', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Guides pratiques
          </h1>
          <p style={{ fontSize: 17, color: '#5A6B88', lineHeight: 1.65 }}>
            Tout ce qu'il faut savoir pour bien gérer votre entreprise
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section style={{ padding: '64px 2rem 80px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '8px 18px',
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                border: activeFilter === f ? '1.5px solid #0B1F45' : '1.5px solid rgba(11,31,69,0.15)',
                background: activeFilter === f ? '#0B1F45' : '#fff',
                color: activeFilter === f ? '#fff' : '#3D4F6B',
                transition: 'all 0.15s',
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {filtered.map(guide => {
              const colors = CATEGORY_COLORS[guide.category] ?? { bg: 'rgba(11,31,69,0.08)', text: '#0B1F45' }
              return (
                <a key={guide.title} href="#" style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(11,31,69,0.09)', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(11,31,69,0.12)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  {/* Image placeholder */}
                  <div style={{ height: 140, background: guide.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: guide.accent, opacity: 0.6 }}>NovaBiz</span>
                  </div>
                  <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: colors.bg, color: colors.text }}>
                        {guide.category}
                      </span>
                      <span style={{ fontSize: 12, color: '#8A99B4' }}>· {guide.readTime} de lecture</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1F45', lineHeight: 1.45, flex: 1 }}>{guide.title}</h3>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', marginTop: 4 }}>Lire →</span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
