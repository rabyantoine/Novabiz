'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  {
    icon: '🚀',
    title: 'Démarrage',
    articles: [
      'Créer son compte NovaBiz',
      'Configurer son profil entreprise',
      'Importer ses clients via CSV',
    ],
  },
  {
    icon: '📄',
    title: 'Devis & Factures',
    articles: [
      'Créer son premier devis',
      'Convertir un devis en facture',
      'Envoyer une facture par email',
    ],
  },
  {
    icon: '🤖',
    title: 'Relances IA',
    articles: [
      'Comprendre les crédits de relance',
      'Choisir le bon ton pour ses relances',
      'Consulter l\'historique des relances',
    ],
  },
  {
    icon: '💳',
    title: 'Facturation & Paiement',
    articles: [
      'Gérer son abonnement',
      'Changer de plan tarifaire',
      'Annuler son abonnement',
    ],
  },
]

function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100, background: '#fff',
      boxShadow: scrolled ? '0 2px 20px rgba(11,31,69,0.10)' : '0 1px 0 rgba(11,31,69,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
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

export default function CentreAide() {
  const [scrolled, setScrolled] = useState(false)

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
          .aide-grid { grid-template-columns: 1fr !important; }
          .footer-grid-inner { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* Hero */}
      <section style={{ background: '#fff', padding: '72px 2rem 64px', borderBottom: '1px solid rgba(11,31,69,0.07)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.10)', border: '1px solid rgba(200,151,58,0.30)', borderRadius: 100, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: '#C8973A', marginBottom: 20 }}>
            Centre d'aide
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: '#0B1F45', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Centre d'aide NovaBiz
          </h1>
          <p style={{ fontSize: 17, color: '#5A6B88', lineHeight: 1.65, marginBottom: 32 }}>
            Trouvez rapidement des réponses à toutes vos questions
          </p>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un article, une fonctionnalité..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                borderRadius: 12,
                border: '1.5px solid rgba(11,31,69,0.15)',
                fontSize: 15,
                color: '#0B1F45',
                background: '#fff',
                outline: 'none',
                boxShadow: '0 2px 12px rgba(11,31,69,0.06)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '72px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="aide-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.title} style={{ background: '#fff', borderRadius: 16, padding: '32px 32px 28px', border: '1.5px solid rgba(11,31,69,0.09)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,151,58,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {cat.icon}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F45' }}>{cat.title}</h2>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {cat.articles.map(article => (
                    <li key={article}>
                      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 14, color: '#3D4F6B', fontWeight: 500, borderBottom: '1px solid rgba(11,31,69,0.06)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C8973A' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3D4F6B' }}
                      >
                        <span style={{ color: 'rgba(11,31,69,0.25)', fontSize: 12 }}>→</span>
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, fontWeight: 700, color: '#C8973A' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Voir tous les articles →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact block */}
      <section style={{ background: '#F3F0EA', padding: '56px 2rem', marginBottom: 0 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#0B1F45', marginBottom: 12 }}>
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p style={{ fontSize: 15, color: '#5A6B88', marginBottom: 28, lineHeight: 1.65 }}>
            Notre équipe support est disponible du lundi au vendredi de 9h à 18h pour répondre à toutes vos questions.
          </p>
          <a href="mailto:support@novabiz.fr" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0B1F45', color: '#fff', padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
          >
            Contacter le support
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
