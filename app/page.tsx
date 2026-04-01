'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ─── DATA ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    id: 'devis',
    icon: '📄',
    label: 'Devis & Factures',
    title: 'Créez et envoyez vos documents en quelques clics',
    desc: 'Transformez vos devis en factures automatiquement. Suivez les paiements en temps réel et restez en conformité avec la facturation électronique obligatoire.',
    bullets: [
      'Génération PDF instantanée aux normes françaises',
      'Conversion devis → facture en 1 clic',
      'Numérotation automatique et archivage',
      'Envoi par email directement depuis l\'interface',
    ],
    color: '#0B1F45',
    accent: '#C8973A',
  },
  {
    id: 'relances',
    icon: '🤖',
    label: 'Relances IA',
    title: 'Ne perdez plus de temps à courir après les paiements',
    desc: 'Notre IA analyse vos clients et envoie des relances personnalisées au bon moment, avec le bon ton. Réduisez vos impayés sans effort.',
    bullets: [
      'Détection automatique des factures en retard',
      'Messages personnalisés selon le profil client',
      'Escalade progressive et intelligente',
      'Tableau de bord des encours en temps réel',
    ],
    color: '#1a3a6e',
    accent: '#C8973A',
  },
  {
    id: 'crm',
    icon: '👥',
    label: 'CRM Clients',
    title: 'Centralisez toute la relation client en un seul endroit',
    desc: 'Fiche client complète avec historique des échanges, devis, factures et notes. Retrouvez toutes les informations en quelques secondes.',
    bullets: [
      'Fiche client 360° avec historique complet',
      'Suivi des opportunités commerciales',
      'Import/export CSV de vos contacts',
      'Tags et segmentation personnalisés',
    ],
    color: '#0d2a55',
    accent: '#C8973A',
  },
  {
    id: 'pilotage',
    icon: '📊',
    label: 'Pilotage',
    title: 'Prenez les bonnes décisions avec des données fiables',
    desc: 'Visualisez votre chiffre d\'affaires, vos marges et la trésorerie prévisionnelle. Des rapports clairs pour piloter votre activité sereinement.',
    bullets: [
      'CA mensuel, trimestriel et annuel en un coup d\'œil',
      'Prévision de trésorerie sur 90 jours',
      'Top clients et analyse des revenus',
      'Export comptable pour votre expert-comptable',
    ],
    color: '#112240',
    accent: '#C8973A',
  },
]

const PLANS = [
  {
    id: 'freelance',
    label: 'Freelance',
    badge: null,
    price: '19',
    desc: 'Parfait pour les indépendants et auto-entrepreneurs qui veulent professionnaliser leur gestion.',
    features: [
      'Jusqu\'à 20 devis/factures par mois',
      'CRM jusqu\'à 50 contacts',
      'Relances automatiques',
      'Export PDF',
      'Support email',
    ],
  },
  {
    id: 'tpe',
    label: 'TPE',
    badge: 'Populaire',
    price: '39',
    desc: 'La solution complète pour les petites entreprises en croissance, avec toutes les fonctionnalités avancées.',
    features: [
      'Documents illimités',
      'CRM jusqu\'à 500 contacts',
      'Relances IA personnalisées',
      'Tableau de bord complet',
      'Multi-utilisateurs (3 comptes)',
      'Support prioritaire',
    ],
  },
  {
    id: 'pme',
    label: 'PME',
    badge: null,
    price: '79',
    desc: 'Pour les entreprises qui ont besoin de collaboration avancée et d\'intégrations avec leurs outils existants.',
    features: [
      'Tout le plan TPE',
      'CRM contacts illimités',
      'Multi-utilisateurs illimités',
      'API & intégrations',
      'Rapports personnalisés',
      'Account manager dédié',
    ],
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    badge: null,
    price: null,
    desc: 'Une solution sur mesure pour les grandes structures avec des besoins spécifiques en sécurité et conformité.',
    features: [
      'Tout le plan PME',
      'SSO & SAML',
      'SLA garanti 99,9%',
      'Onboarding personnalisé',
      'Formations équipe',
      'Contrat sur mesure',
    ],
  },
]

/* ─── COMPONENT ─────────────────────────────────────────────── */

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activePlan, setActivePlan] = useState(1)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const plan = PLANS[activePlan]
  const feat = FEATURES[activeFeature]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; background: #FAF8F4; color: #0B1F45; }
        a { text-decoration: none; color: inherit; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s ease both; }
        .fade-up-2 { animation: fadeUp 0.55s 0.12s ease both; }
        .fade-up-3 { animation: fadeUp 0.55s 0.24s ease both; }
      `}</style>

      {/* ── 1. NAVBAR ───────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        boxShadow: scrolled ? '0 2px 20px rgba(11,31,69,0.10)' : '0 1px 0 rgba(11,31,69,0.06)',
        transition: 'box-shadow 0.2s',
      }}>
        <nav style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 2rem',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36,
              background: '#0B1F45',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize: 18,
              color: '#C8973A',
            }}>N</div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              color: '#0B1F45',
              letterSpacing: '-0.01em',
            }}>Nova<span style={{ color: '#C8973A' }}>Biz</span></span>
          </Link>

          {/* Links */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Tarifs', href: '#tarifs' },
              { label: 'Ressources', href: '#ressources' },
            ].map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{ padding: '6px 14px', fontSize: 14, fontWeight: 500, color: '#3D4F6B', borderRadius: 8 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0B1F45'; (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3D4F6B'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >{l.label}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/login" style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#0B1F45',
              borderRadius: 8,
              border: '1.5px solid rgba(11,31,69,0.18)',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >Se connecter</Link>
            <Link href="/signup" style={{
              padding: '8px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#0B1F45',
              borderRadius: 8,
              border: '1.5px solid #0B1F45',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
            >Essayer gratuitement</Link>
          </div>
        </nav>
      </header>

      {/* ── 2. HERO ─────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '88px 2rem 80px' }}>
        <div style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}>
          {/* Left */}
          <div className="fade-up">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(200,151,58,0.10)',
              border: '1px solid rgba(200,151,58,0.35)',
              borderRadius: 100,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#C8973A',
              marginBottom: 24,
            }}>
              <span>✦</span> Gestion 100 % française
            </div>

            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.12,
              color: '#0B1F45',
              letterSpacing: '-0.02em',
              marginBottom: 22,
            }}>
              NovaBiz simplifie la gestion administrative de votre entreprise
            </h1>

            <p style={{
              fontSize: 17,
              color: '#5A6B88',
              lineHeight: 1.65,
              marginBottom: 36,
              maxWidth: 480,
            }}>
              Devis, factures, relances automatiques et pilotage en temps réel — tout ce dont vous avez besoin pour vous concentrer sur votre cœur de métier.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <Link href="/signup" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#C8973A',
                color: '#fff',
                padding: '13px 26px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                boxShadow: '0 4px 16px rgba(200,151,58,0.30)',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b07c2e' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#C8973A' }}
              >Essayer gratuitement →</Link>

              <a href="#fonctionnalites" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1.5px solid #0B1F45',
                color: '#0B1F45',
                padding: '12px 22px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >▶ Voir une démo</a>
            </div>

            <p style={{ fontSize: 13, color: '#8A99B4', fontWeight: 500 }}>
              15 jours gratuits · Sans carte bancaire
            </p>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="fade-up-2" style={{
            background: '#0B1F45',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 32px 80px rgba(11,31,69,0.22)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <span style={{ fontFamily: 'Georgia,serif', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                Nova<span style={{ color: '#C8973A' }}>Biz</span>
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'CA ce mois', value: '18 450 €', delta: '+12%' },
                { label: 'Factures émises', value: '34', delta: '+5' },
                { label: 'Impayés', value: '2 300 €', delta: '-8%', warn: true },
              ].map(k => (
                <div key={k.label} style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '14px 14px 12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: k.warn ? '#f87171' : '#4ade80' }}>{k.delta}</div>
                </div>
              ))}
            </div>

            {/* Invoices table */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                Dernières factures
              </div>
              {[
                { ref: 'FAC-2024', client: 'Acme SAS', amount: '4 200 €', status: 'Payée' },
                { ref: 'FAC-2023', client: 'Studio Pixel', amount: '1 850 €', status: 'En attente' },
                { ref: 'FAC-2022', client: 'Dupont & Co.', amount: '6 700 €', status: 'Envoyée' },
              ].map((inv, i) => (
                <div key={inv.ref} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 80px 80px',
                  padding: '11px 16px',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{inv.ref}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{inv.client}</span>
                  <span style={{ fontSize: 13, color: '#C8973A', fontWeight: 700, textAlign: 'right' }}>{inv.amount}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'right',
                    color: inv.status === 'Payée' ? '#4ade80' : inv.status === 'En attente' ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                  }}>{inv.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. RÉASSURANCE ──────────────────────────────────── */}
      <section style={{ background: '#F3F0EA', padding: '28px 2rem' }}>
        <div style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 8,
        }}>
          {[
            { icon: '🇫🇷', text: 'Hébergé en France' },
            { icon: '🔒', text: 'Données sécurisées RGPD' },
            { icon: '✅', text: 'Conforme facturation électronique' },
            { icon: '💬', text: 'Support en français' },
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 18px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid rgba(11,31,69,0.07)',
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1F45' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. FONCTIONNALITÉS ──────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: '#fff', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Ce que NovaBiz fait pour vous
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Tout en un, rien à installer
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActiveFeature(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFeature === i ? '1.5px solid #0B1F45' : '1.5px solid rgba(11,31,69,0.12)',
                  background: activeFeature === i ? '#0B1F45' : '#fff',
                  color: activeFeature === i ? '#fff' : '#3D4F6B',
                  transition: 'all 0.15s',
                }}
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            {/* Text */}
            <div>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 30, fontWeight: 700, color: '#0B1F45', lineHeight: 1.25, marginBottom: 16 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: 16, color: '#5A6B88', lineHeight: 1.7, marginBottom: 28 }}>
                {feat.desc}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feat.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(200,151,58,0.12)',
                      color: '#C8973A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
                    }}>✓</span>
                    <span style={{ fontSize: 15, color: '#3D4F6B', lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual */}
            <div style={{
              background: feat.color,
              borderRadius: 20,
              padding: 36,
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(11,31,69,0.18)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{feat.icon}</div>
              <div style={{ fontSize: 22, fontFamily: 'Georgia,serif', color: '#fff', fontWeight: 700, marginBottom: 12 }}>
                {feat.label}
              </div>
              {feat.bullets.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginTop: 10,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <span style={{ color: feat.accent, fontWeight: 700, fontSize: 13 }}>✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TARIFS ───────────────────────────────────────── */}
      <section id="tarifs" style={{ background: '#FAF8F4', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Tarification simple
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Un prix juste pour chaque étape
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'start' }}>
            {/* Plan list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PLANS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlan(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 22px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    border: activePlan === i ? '2px solid #0B1F45' : '1.5px solid rgba(11,31,69,0.12)',
                    background: activePlan === i ? '#0B1F45' : '#fff',
                    color: activePlan === i ? '#fff' : '#0B1F45',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</span>
                      {p.badge && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: activePlan === i ? '#C8973A' : '#C8973A',
                          color: '#fff',
                        }}>{p.badge}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 3, color: activePlan === i ? 'rgba(255,255,255,0.60)' : '#8A99B4' }}>
                      {p.price ? `${p.price} €/mois` : 'Sur devis'}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: activePlan === i ? '#C8973A' : '#C8973A' }}>›</span>
                </button>
              ))}
            </div>

            {/* Plan detail */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: '36px 36px 32px',
              border: '1.5px solid rgba(11,31,69,0.10)',
              boxShadow: '0 8px 40px rgba(11,31,69,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0B1F45', fontFamily: 'Georgia,serif' }}>
                  {plan.label}
                </div>
                {plan.badge && (
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: '#C8973A',
                    color: '#fff',
                  }}>{plan.badge}</span>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                {plan.price ? (
                  <div>
                    <span style={{ fontSize: 46, fontWeight: 800, color: '#0B1F45' }}>{plan.price} €</span>
                    <span style={{ fontSize: 15, color: '#8A99B4', marginLeft: 4 }}>/mois HT</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#0B1F45' }}>Sur devis</div>
                )}
              </div>

              <p style={{ fontSize: 14, color: '#5A6B88', lineHeight: 1.65, marginBottom: 28 }}>
                {plan.desc}
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(200,151,58,0.12)',
                      color: '#C8973A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>✓</span>
                    <span style={{ fontSize: 14, color: '#3D4F6B' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup" style={{
                display: 'block',
                textAlign: 'center',
                padding: '14px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                background: '#0B1F45',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(11,31,69,0.18)',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
              >
                {plan.price ? 'Commencer gratuitement' : 'Nous contacter'}
              </Link>

              {plan.price && (
                <p style={{ textAlign: 'center', fontSize: 12, color: '#8A99B4', marginTop: 12 }}>
                  15 jours gratuits · Sans carte bancaire
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. RESSOURCES ───────────────────────────────────── */}
      <section id="ressources" style={{ background: '#fff', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Pour aller plus loin
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Ressources & accompagnement
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              {
                icon: '📚',
                title: 'Centre d\'aide',
                desc: 'Trouvez des réponses à toutes vos questions dans notre documentation complète.',
                link: '#',
              },
              {
                icon: '📖',
                title: 'Guides pratiques',
                desc: 'Des guides pas-à-pas pour configurer NovaBiz et optimiser votre gestion.',
                link: '#',
              },
              {
                icon: '💡',
                title: 'Blog & conseils',
                desc: 'Conseils, actualités fiscales et bonnes pratiques pour les entrepreneurs français.',
                link: '#',
              },
            ].map(card => (
              <a
                key={card.title}
                href={card.link}
                style={{
                  display: 'block',
                  background: '#fff',
                  borderRadius: 16,
                  padding: '32px 28px',
                  border: '1.5px solid rgba(11,31,69,0.10)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(11,31,69,0.12)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F45', marginBottom: 10 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#5A6B88', lineHeight: 1.65, marginBottom: 18 }}>{card.desc}</p>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#C8973A' }}>En savoir plus →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA FINAL ────────────────────────────────────── */}
      <section style={{ background: '#0B1F45', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'Georgia,serif',
            fontSize: 38,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: 18,
            letterSpacing: '-0.01em',
          }}>
            Prêt à reprendre le contrôle de votre gestion ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.65 }}>
            Rejoignez des centaines d'entrepreneurs qui font confiance à NovaBiz pour gérer leur activité au quotidien.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#C8973A',
            color: '#fff',
            padding: '15px 32px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            boxShadow: '0 6px 24px rgba(200,151,58,0.35)',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b07c2e' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#C8973A' }}
          >
            Commencer gratuitement →
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: 14 }}>
            15 jours gratuits · Sans carte bancaire · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* ── 8. FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: '#070F22', padding: '48px 2rem 32px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32,
                  background: '#0B1F45',
                  border: '1px solid rgba(200,151,58,0.4)',
                  borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia,serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#C8973A',
                }}>N</div>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  Nova<span style={{ color: '#C8973A' }}>Biz</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 1.7 }}>
                La solution de gestion administrative pour les entreprises françaises.
              </p>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Produit
              </div>
              {['Fonctionnalités', 'Tarifs', 'Nouveautés', 'Roadmap'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 9, fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >{l}</a>
              ))}
            </div>

            {/* Ressources */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Ressources
              </div>
              {['Centre d\'aide', 'Guides pratiques', 'Blog', 'API'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 9, fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >{l}</a>
              ))}
            </div>

            {/* Légal */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Légal
              </div>
              {['Mentions légales', 'CGU', 'Confidentialité', 'RGPD'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 9, fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>
              © 2026 NovaBiz · Tous droits réservés
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              🇫🇷 Conçu et hébergé en France
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
