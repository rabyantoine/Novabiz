'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const FEATURED = {
  title: 'Facturation électronique 2026 : tout ce que les PME doivent savoir',
  category: 'Facturation',
  date: '24 mars 2026',
  readTime: '6 min',
  desc: 'À partir du 1er septembre 2026, la facturation électronique devient obligatoire pour toutes les entreprises françaises assujetties à la TVA. Voici ce que vous devez mettre en place dès maintenant pour être en conformité.',
}

const ARTICLES = [
  {
    title: 'Comment l\'IA transforme la relance client en 2026',
    category: 'IA',
    date: '18 mars 2026',
    excerpt: 'Les outils d\'intelligence artificielle permettent aujourd\'hui d\'automatiser les relances tout en personnalisant chaque message selon le profil du client.',
  },
  {
    title: '5 erreurs courantes sur les devis qui font fuir les clients',
    category: 'Gestion',
    date: '11 mars 2026',
    excerpt: 'Un devis mal rédigé peut coûter cher. Découvrez les pièges à éviter pour maximiser vos taux de conversion.',
  },
  {
    title: 'Trésorerie : les indicateurs clés à surveiller chaque semaine',
    category: 'Comptabilité',
    date: '4 mars 2026',
    excerpt: 'Anticiper les tensions de trésorerie est essentiel pour la pérennité de votre entreprise. Voici les métriques à suivre sans modération.',
  },
  {
    title: 'TPE & PME : quelles aides fiscales en 2026 ?',
    category: 'Comptabilité',
    date: '25 février 2026',
    excerpt: 'De nombreux dispositifs d\'aide sont méconnus des entrepreneurs. Tour d\'horizon des crédits d\'impôt et exonérations disponibles cette année.',
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

export default function Blog() {
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; background: #FAF8F4; color: #0B1F45; }
        a { text-decoration: none; color: inherit; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
          .featured-inner { flex-direction: column !important; }
          .featured-image { height: 200px !important; min-width: unset !important; }
        }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* Hero */}
      <section style={{ background: '#fff', padding: '72px 2rem 64px', borderBottom: '1px solid rgba(11,31,69,0.07)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.10)', border: '1px solid rgba(200,151,58,0.30)', borderRadius: 100, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: '#C8973A', marginBottom: 20 }}>
            Blog & conseils
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: '#0B1F45', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Blog NovaBiz
          </h1>
          <p style={{ fontSize: 17, color: '#5A6B88', lineHeight: 1.65 }}>
            Actualités, conseils et bonnes pratiques pour les entrepreneurs
          </p>
        </div>
      </section>

      <section style={{ padding: '64px 2rem 80px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>

          {/* Featured article */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8A99B4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Article mis en avant
            </div>
            <a href="#" style={{ display: 'flex', background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1.5px solid rgba(11,31,69,0.09)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              className="featured-inner"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(11,31,69,0.12)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {/* Image */}
              <div className="featured-image" style={{ minWidth: 360, background: 'linear-gradient(135deg, #0B1F45 0%, #C8973A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.18)', textAlign: 'center', lineHeight: 1.3 }}>NovaBiz Blog</span>
              </div>
              {/* Content */}
              <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(200,151,58,0.12)', color: '#C8973A' }}>
                    {FEATURED.category}
                  </span>
                  <span style={{ fontSize: 12, color: '#8A99B4' }}>{FEATURED.date} · {FEATURED.readTime} de lecture</span>
                </div>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#0B1F45', lineHeight: 1.3 }}>
                  {FEATURED.title}
                </h2>
                <p style={{ fontSize: 15, color: '#5A6B88', lineHeight: 1.7 }}>
                  {FEATURED.desc}
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, background: '#0B1F45', color: '#fff', padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' }}>
                  Lire l'article →
                </span>
              </div>
            </a>
          </div>

          {/* Recent articles grid */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A99B4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            Articles récents
          </div>
          <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 72 }}>
            {ARTICLES.map(article => {
              const colors = CATEGORY_COLORS[article.category] ?? { bg: 'rgba(11,31,69,0.08)', text: '#0B1F45' }
              return (
                <a key={article.title} href="#" style={{ display: 'block', background: '#fff', borderRadius: 16, padding: '24px 26px', border: '1.5px solid rgba(11,31,69,0.09)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(11,31,69,0.10)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: colors.bg, color: colors.text }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#8A99B4' }}>{article.date}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F45', lineHeight: 1.4, marginBottom: 10 }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#5A6B88', lineHeight: 1.65, marginBottom: 14 }}>
                    {article.excerpt}
                  </p>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#C8973A' }}>Lire l'article →</span>
                </a>
              )
            })}
          </div>

          {/* Newsletter */}
          <div style={{ background: '#0B1F45', borderRadius: 20, padding: '48px 48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
              Recevez nos conseils chaque semaine
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.60)', marginBottom: 28, lineHeight: 1.65 }}>
              Des conseils pratiques, des guides et les actualités fiscales directement dans votre boîte mail.
            </p>
            <div style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                style={{ flex: 1, minWidth: 200, padding: '12px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, outline: 'none' }}
              />
              <button style={{ padding: '12px 24px', borderRadius: 10, background: '#C8973A', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b07c2e' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#C8973A' }}
              >
                S'inscrire
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>
              Pas de spam. Désabonnement en 1 clic.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
