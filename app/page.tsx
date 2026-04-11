'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

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
      "Envoi par email directement depuis l'interface",
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
    desc: "Visualisez votre chiffre d'affaires, vos marges et la trésorerie prévisionnelle. Des rapports clairs pour piloter votre activité sereinement.",
    bullets: [
      "CA mensuel, trimestriel et annuel en un coup d'œil",
      'Prévision de trésorerie sur 90 jours',
      'Top clients et analyse des revenus',
      'Export comptable pour votre expert-comptable',
    ],
    color: '#112240',
    accent: '#C8973A',
  },
]

const plans = [
  {
    id: 'solo',
    label: 'Solo',
    subtitle: 'Auto-entrepreneur',
    price: { mensuel: 9, annuel: 7 },
    popular: false,
    description: "L'essentiel pour facturer et suivre votre activité seul.",
    features: [
      'Devis & factures illimités',
      '1 utilisateur',
      'Notes de frais',
      'Export comptable CSV',
      'Classeur Intelligent (50 docs)',
    ],
    bienvenue: null,
    cta: 'Commencer gratuitement →',
  },
  {
    id: 'starter',
    label: 'Starter',
    subtitle: "TPE · jusqu'à 5 utilisateurs",
    price: { mensuel: 29, annuel: 23 },
    popular: true,
    description: "Tout ce qu'il faut pour piloter une petite structure au quotidien.",
    features: [
      'Tout Solo inclus',
      'CRM clients complet',
      '10 relances IA / mois',
      'Classeur Intelligent (500 docs)',
      'Tableau de bord',
      'Support par email',
    ],
    bienvenue: "15 jours d'essai gratuit · Sans engagement",
    cta: 'Commencer gratuitement →',
  },
  {
    id: 'pme',
    label: 'PME',
    subtitle: "Jusqu'à 10 utilisateurs",
    price: { mensuel: 59, annuel: 47 },
    popular: false,
    description: 'La solution complète pour une PME qui veut tout centraliser.',
    features: [
      'Tout Starter inclus',
      'Relances IA illimitées',
      'Classeur Intelligent illimité',
      'Multi-entreprises',
      'Rapports avancés',
      'Support prioritaire',
      'Accès expert-comptable',
    ],
    bienvenue: "1 mois offert à l'inscription · Sans engagement",
    cta: 'Commencer gratuitement →',
  },
  {
    id: 'enterprise',
    label: 'Entreprise',
    subtitle: 'Utilisateurs illimités',
    price: null,
    popular: false,
    description: 'Un accompagnement sur-mesure pour les structures plus complexes.',
    features: [
      'Tout PME inclus',
      'Intégrations sur-mesure',
      'SLA garanti',
      'Onboarding dédié',
      'Formation équipe incluse',
      'Facturation électronique 2026',
    ],
    bienvenue: null,
    cta: 'Nous contacter',
  },
]

const MODULES = [
  { icon: '📄', label: 'Factures', desc: 'PDF aux normes françaises' },
  { icon: '📝', label: 'Devis', desc: 'Conversion 1 clic' },
  { icon: '👥', label: 'CRM', desc: 'Relation client 360°' },
  { icon: '🏦', label: 'Banque', desc: 'Suivi transactions' },
  { icon: '🤖', label: 'Relances IA', desc: 'Impayés automatisés' },
  { icon: '📊', label: 'Rapports', desc: 'Pilotage temps réel' },
  { icon: '🗂️', label: 'Classeur', desc: 'Documents centralisés' },
  { icon: '🛒', label: 'Achats', desc: 'Fournisseurs & dépenses' },
]

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return val
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activePlan, setActivePlan] = useState('starter')
  const [annuel, setAnnuel] = useState(false)
  const [chaosSettled, setChaosSettled] = useState(false)
  const [heroScrollY, setHeroScrollY] = useState(0)

  const chaosRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  const dashboard = useScrollReveal(0.2)
  const modules = useScrollReveal(0.1)
  const signature = useScrollReveal(0.2)
  const pricing = useScrollReveal(0.15)
  const cta = useScrollReveal(0.3)
  const features = useScrollReveal(0.1)
  const steps = useScrollReveal(0.15)
  const testimonials = useScrollReveal(0.1)
  const resources = useScrollReveal(0.1)

  const ca = useCountUp(18450, dashboard.visible)
  const factures = useCountUp(34, dashboard.visible)
  const impayes = useCountUp(2300, dashboard.visible)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
      if (heroRef.current) {
        setHeroScrollY(Math.min(window.scrollY, 600))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = chaosRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setChaosSettled(true), 900)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const feat = FEATURES[activeFeature]

  const heroScale = 1 + heroScrollY * 0.0003
  const heroOpacity = 1 - heroScrollY * 0.001

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; background: #FAF8F4; color: #0B1F45; overflow-x: hidden; }
        a { text-decoration: none; color: inherit; }

        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-left { opacity: 0; transform: translateX(-48px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .reveal-left.visible { opacity: 1; transform: translateX(0); }
        .reveal-right { opacity: 0; transform: translateX(48px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .reveal-right.visible { opacity: 1; transform: translateX(0); }
        .reveal-scale { opacity: 0; transform: scale(0.92); transition: opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1); }
        .reveal-scale.visible { opacity: 1; transform: scale(1); }
        .reveal-drop { opacity: 0; transform: translateY(-60px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .reveal-drop.visible { opacity: 1; transform: translateY(0); }

        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        .delay-5 { transition-delay: 0.5s; }
        .delay-6 { transition-delay: 0.6s; }
        .delay-7 { transition-delay: 0.7s; }
        .delay-8 { transition-delay: 0.8s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up  { animation: fadeUp 0.6s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.12s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.24s ease both; }

        @keyframes chaosFloat {
          0%   { transform: translate(var(--tx), var(--ty)) rotate(var(--tr)) scale(1); opacity: 0.7; }
          50%  { transform: translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) rotate(calc(var(--tr) * 0.5)) scale(1.05); opacity: 0.9; }
          100% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
        }
        .chaos-item {
          transition: transform 1.2s cubic-bezier(.22,1,.36,1), opacity 0.8s ease;
        }
        .chaos-item.floating {
          animation: chaosFloat 2s ease-in-out infinite alternate;
        }
        .chaos-item.settled {
          transform: translate(0,0) rotate(0deg) !important;
          opacity: 1 !important;
        }

        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 6px 24px rgba(200,151,58,0.35); }
          50%       { box-shadow: 0 6px 36px rgba(200,151,58,0.65), 0 0 0 8px rgba(200,151,58,0.12); }
        }
        .pulse-gold { animation: pulse-gold 2.2s ease-in-out infinite; }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .module-card {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.2s;
        }
        .module-card.visible { opacity: 1; transform: translateY(0); }
        .module-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(11,31,69,0.14) !important; }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup { display: none !important; }
          .hero-title { font-size: 36px !important; }
          .reassurance-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .features-tabs { overflow-x: auto; flex-wrap: nowrap !important; justify-content: flex-start !important; padding-bottom: 4px; }
          .features-tabs::-webkit-scrollbar { display: none; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .resources-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .section-title { font-size: 28px !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .modules-grid { grid-template-columns: repeat(2,1fr) !important; }
          .sig-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff',
        boxShadow: scrolled ? '0 2px 20px rgba(11,31,69,0.10)' : '0 1px 0 rgba(11,31,69,0.06)',
        transition: 'box-shadow 0.2s',
      }}>
        <nav style={{
          maxWidth: 1180, margin: '0 auto', padding: '0 2rem',
          height: 68, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, background: '#0B1F45', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 18, color: '#C8973A',
            }}>N</div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Nova<span style={{ color: '#C8973A' }}>Biz</span>
            </span>
          </Link>

          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Tarifs', href: '#tarifs' },
              { label: 'Ressources', href: '#ressources' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ padding: '6px 14px', fontSize: 14, fontWeight: 500, color: '#3D4F6B', borderRadius: 8, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0B1F45'; (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3D4F6B'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >{l.label}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#0B1F45', borderRadius: 8, border: '1.5px solid rgba(11,31,69,0.18)', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >Se connecter</Link>
            <Link href="/signup" style={{ padding: '8px 18px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#0B1F45', borderRadius: 8, border: '1.5px solid #0B1F45', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
            >Essayer gratuitement</Link>
          </div>
        </nav>
      </header>

      {/* ── S1 · HERO — zoom-in au scroll ──────────────────── */}
      <section ref={heroRef} style={{ background: '#fff', padding: '88px 2rem 80px', overflow: 'hidden' }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 64, alignItems: 'center',
          transform: `scale(${heroScale})`,
          opacity: heroOpacity,
          transformOrigin: 'center top',
          transition: 'none',
        }} className="hero-grid">
          <div className="fade-up">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(200,151,58,0.10)', border: '1px solid rgba(200,151,58,0.35)',
              borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600,
              color: '#C8973A', marginBottom: 24,
            }}>
              <span>✦</span> Gestion 100 % française
            </div>
            <h1 className="hero-title" style={{
              fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 700,
              lineHeight: 1.12, color: '#0B1F45', letterSpacing: '-0.02em', marginBottom: 22,
            }}>
              NovaBiz simplifie la gestion administrative de votre entreprise
            </h1>
            <p style={{ fontSize: 17, color: '#5A6B88', lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
              Devis, factures, relances automatiques et pilotage en temps réel — tout ce dont vous avez besoin pour vous concentrer sur votre cœur de métier.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <Link href="/signup" className="pulse-gold" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#C8973A', color: '#fff', padding: '13px 26px',
                borderRadius: 10, fontSize: 15, fontWeight: 700,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b07c2e' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C8973A' }}
              >Essayer gratuitement →</Link>
              <a href="#fonctionnalites" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1.5px solid #0B1F45', color: '#0B1F45',
                padding: '12px 22px', borderRadius: 10, fontSize: 15, fontWeight: 600, transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F0EA' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >▶ Voir une démo</a>
            </div>
            <p style={{ fontSize: 13, color: '#8A99B4', fontWeight: 500 }}>15 jours gratuits · Sans carte bancaire</p>
          </div>

          {/* Dashboard mockup hero */}
          <div className="fade-up-2 hero-mockup" style={{
            background: '#0B1F45', borderRadius: 20, padding: 28,
            boxShadow: '0 32px 80px rgba(11,31,69,0.22)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <span style={{ fontFamily: 'Georgia,serif', color: '#fff', fontWeight: 700, fontSize: 16 }}>Nova<span style={{ color: '#C8973A' }}>Biz</span></span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'CA ce mois', value: '18 450 €', delta: '+12%' },
                { label: 'Factures émises', value: '34', delta: '+5' },
                { label: 'Impayés', value: '2 300 €', delta: '-8%', warn: true },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 14px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: k.warn ? '#f87171' : '#4ade80' }}>{k.delta}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>Dernières factures</div>
              {[
                { ref: 'FAC-2024', client: 'Acme SAS', amount: '4 200 €', status: 'Payée' },
                { ref: 'FAC-2023', client: 'Studio Pixel', amount: '1 850 €', status: 'En attente' },
                { ref: 'FAC-2022', client: 'Dupont & Co.', amount: '6 700 €', status: 'Envoyée' },
              ].map((inv, i) => (
                <div key={inv.ref} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px',
                  padding: '11px 16px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{inv.ref}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{inv.client}</span>
                  <span style={{ fontSize: 13, color: '#C8973A', fontWeight: 700, textAlign: 'right' }}>{inv.amount}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'right', color: inv.status === 'Payée' ? '#4ade80' : inv.status === 'En attente' ? '#fbbf24' : 'rgba(255,255,255,0.6)' }}>{inv.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RÉASSURANCE ────────────────────────────────────── */}
      <section style={{ background: '#F3F0EA', padding: '28px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }} className="reassurance-grid">
          {[
            { icon: '🇫🇷', text: 'Hébergé en France' },
            { icon: '🔒', text: 'Données sécurisées RGPD' },
            { icon: '✅', text: 'Conforme facturation électronique' },
            { icon: '💬', text: 'Support en français' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#fff', borderRadius: 12, border: '1px solid rgba(11,31,69,0.07)' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1F45' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── S2 · CHAOS → ORDRE ─────────────────────────────── */}
      <section style={{ background: '#FAF8F4', padding: '96px 2rem', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Avant NovaBiz
            </div>
            <h2 className="section-title" style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em', marginBottom: 16 }}>
              {chaosSettled ? 'Tout se range, tout se fait.' : 'Fichiers partout. Rien de centralisé.'}
            </h2>
            <p style={{ fontSize: 16, color: '#5A6B88', maxWidth: 480, margin: '0 auto 48px', transition: 'opacity 0.5s' }}>
              {chaosSettled
                ? 'NovaBiz centralise tout votre administratif. Ça se fait tout seul, vous n\'avez rien à penser.'
                : 'Excel, emails, PDF éparpillés... La paperasse vous vole du temps chaque jour.'}
            </p>
          </div>

          <div ref={chaosRef} style={{
            position: 'relative', height: 340,
            background: chaosSettled ? '#0B1F45' : '#fff',
            borderRadius: 24,
            border: chaosSettled ? 'none' : '1.5px solid rgba(11,31,69,0.10)',
            overflow: 'hidden',
            transition: 'background 1s ease',
          }}>
            {[
              { icon: '📊', label: 'rapport_Q3_final_v2.xlsx', tx: '-120px', ty: '-60px', tr: '-14deg', top: '12%', left: '5%' },
              { icon: '📄', label: 'facture_client_ok.pdf', tx: '80px', ty: '-80px', tr: '10deg', top: '8%', left: '30%' },
              { icon: '📧', label: 'Re: Re: Re: devis urgent', tx: '140px', ty: '-40px', tr: '6deg', top: '15%', left: '58%' },
              { icon: '📝', label: 'devis_v3_FINAL.docx', tx: '-60px', ty: '60px', tr: '-8deg', top: '48%', left: '8%' },
              { icon: '💸', label: 'notes_frais_mars.csv', tx: '100px', ty: '80px', tr: '12deg', top: '55%', left: '38%' },
              { icon: '🗂️', label: 'archive_2023_old.zip', tx: '-90px', ty: '40px', tr: '-6deg', top: '60%', left: '65%' },
              { icon: '⚠️', label: 'IMPAYÉ — Relancer !!!', tx: '60px', ty: '-100px', tr: '18deg', top: '30%', left: '80%' },
              { icon: '📅', label: 'agenda_rdv_clients.ics', tx: '-140px', ty: '20px', tr: '-20deg', top: '75%', left: '18%' },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`chaos-item ${chaosSettled ? 'settled' : 'floating'}`}
                style={{
                  position: 'absolute',
                  top: chaosSettled ? `${10 + (i % 2) * 36}%` : item.top,
                  left: chaosSettled ? `${6 + i * 11.5}%` : item.left,
                  ['--tx' as string]: item.tx,
                  ['--ty' as string]: item.ty,
                  ['--tr' as string]: item.tr,
                  animationDelay: `${i * 0.18}s`,
                  transition: 'all 1.1s cubic-bezier(.22,1,.36,1)',
                  transitionDelay: chaosSettled ? `${i * 0.07}s` : '0s',
                  background: chaosSettled ? 'rgba(255,255,255,0.08)' : '#fff',
                  border: chaosSettled ? '1px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(11,31,69,0.12)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, fontWeight: 600,
                  color: chaosSettled ? 'rgba(255,255,255,0.85)' : '#3D4F6B',
                  whiteSpace: 'nowrap',
                  boxShadow: chaosSettled ? 'none' : '0 4px 16px rgba(11,31,69,0.10)',
                  zIndex: 2,
                  width: 'max-content',
                  maxWidth: 200,
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{item.label}</span>
              </div>
            ))}

            {chaosSettled && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8, zIndex: 1,
                opacity: 1, animation: 'fadeUp 0.6s ease both',
              }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#fff' }}>
                  Nova<span style={{ color: '#C8973A' }}>Biz</span>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Tout centralisé. Tout automatisé.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── S3 · DASHBOARD ANIMÉ ───────────────────────────── */}
      <section style={{ background: '#fff', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div ref={dashboard.ref} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">
            <div className={`reveal${dashboard.visible ? ' visible' : ''}`}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Votre entreprise en temps réel
              </div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', lineHeight: 1.2, marginBottom: 18, letterSpacing: '-0.01em' }}>
                Un dashboard qui vous dit tout, sans effort
              </h2>
              <p style={{ fontSize: 16, color: '#5A6B88', lineHeight: 1.7, marginBottom: 32 }}>
                CA, factures, impayés, trésorerie prévisionnelle — tout s'affiche en temps réel dès que vous ouvrez NovaBiz. Prenez les bonnes décisions sans perdre de temps.
              </p>
              <Link href="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0B1F45', color: '#fff', padding: '12px 24px',
                borderRadius: 10, fontSize: 15, fontWeight: 600, transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#162d5e' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0B1F45' }}
              >Voir le dashboard →</Link>
            </div>

            <div className={`reveal-right${dashboard.visible ? ' visible' : ''} delay-2`} style={{
              background: '#0B1F45', borderRadius: 20, padding: 28,
              boxShadow: '0 32px 80px rgba(11,31,69,0.22)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontFamily: 'Georgia,serif', color: '#fff', fontWeight: 700, fontSize: 15 }}>Nova<span style={{ color: '#C8973A' }}>Biz</span> · Dashboard</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'CA ce mois', value: ca.toLocaleString('fr-FR') + ' €', delta: '+12%', green: true },
                  { label: 'Factures', value: String(factures), delta: '+5 ce mois', green: true },
                  { label: 'Impayés', value: impayes.toLocaleString('fr-FR') + ' €', delta: '-8%', green: false },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{k.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: k.green ? '#4ade80' : '#f87171' }}>{k.delta}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12, fontWeight: 600 }}>CA mensuel (€)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 60 }}>
                  {[40, 55, 38, 72, 60, 85, 100].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height: dashboard.visible ? `${h}%` : '0%',
                        background: i === 6 ? '#C8973A' : 'rgba(255,255,255,0.18)',
                        borderRadius: '4px 4px 0 0',
                        transition: `height 0.8s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.07}s`,
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {['Sep','Oct','Nov','Déc','Jan','Fév','Mar'].map(m => (
                    <span key={m} style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', flex: 1, textAlign: 'center' }}>{m}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.40)' }}>Factures récentes</div>
                {[
                  { client: 'Acme SAS', amount: '4 200 €', status: 'Payée' },
                  { client: 'Studio Pixel', amount: '1 850 €', status: 'En attente' },
                ].map((inv, i) => (
                  <div key={inv.client} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: i < 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{inv.client}</span>
                    <span style={{ fontSize: 12, color: '#C8973A', fontWeight: 700 }}>{inv.amount}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: inv.status === 'Payée' ? '#4ade80' : '#fbbf24' }}>{inv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── S4 · MODULES ───────────────────────────────────── */}
      <section style={{ background: '#FAF8F4', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div ref={modules.ref} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className={`reveal${modules.visible ? ' visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              La plateforme complète
            </div>
            <h2 className={`section-title reveal${modules.visible ? ' visible' : ''} delay-1`} style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em', marginBottom: 16 }}>
              Tout ce dont vous avez besoin
            </h2>
            <p className={`reveal${modules.visible ? ' visible' : ''} delay-2`} style={{ fontSize: 16, color: '#5A6B88', maxWidth: 480, margin: '0 auto' }}>
              8 modules intégrés, zéro outil externe. NovaBiz est la seule app dont votre entreprise a besoin.
            </p>
          </div>

          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {MODULES.map((mod, i) => (
              <div
                key={mod.label}
                className={`module-card${modules.visible ? ' visible' : ''}`}
                style={{
                  transitionDelay: modules.visible ? `${i * 0.07}s` : '0s',
                  background: '#fff',
                  borderRadius: 16,
                  padding: '28px 24px',
                  border: '1.5px solid rgba(11,31,69,0.09)',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{mod.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1F45', marginBottom: 6 }}>{mod.label}</div>
                <div style={{ fontSize: 13, color: '#8A99B4', fontWeight: 500 }}>{mod.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S5 · SIGNATURE & PAIEMENT (chute depuis le haut) ── */}
      <section style={{ background: '#fff', padding: '96px 2rem', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Sans friction
            </div>
            <h2 className="section-title" style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em', marginBottom: 16 }}>
              Signe. Encaisse. Automatiquement.
            </h2>
            <p style={{ fontSize: 16, color: '#5A6B88', maxWidth: 520, margin: '0 auto' }}>
              Signature électronique eIDAS et paiement Stripe intégrés directement dans NovaBiz. Votre client reçoit un lien, signe, paie. Vous n'avez rien à faire.
            </p>
          </div>

          <div ref={signature.ref} className="sig-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* Signature mockup */}
            <div className={`reveal-drop${signature.visible ? ' visible' : ''}`} style={{
              background: '#0B1F45', borderRadius: 20, padding: 28,
              boxShadow: '0 32px 80px rgba(11,31,69,0.22)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(200,151,58,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✍️</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Signature électronique</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Conforme eIDAS · Valeur légale</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.10)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginBottom: 8 }}>DEVIS N° DEV-2024-089</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Acme SAS</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#C8973A' }}>8 400,00 €</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, height: 80, border: '1px dashed rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Zone de signature</span>
              </div>
              <div style={{ background: '#C8973A', borderRadius: 10, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Signer le document →
              </div>
            </div>

            {/* Paiement mockup */}
            <div className={`reveal-drop${signature.visible ? ' visible' : ''} delay-2`} style={{
              background: '#fff', borderRadius: 20, padding: 28,
              border: '1.5px solid rgba(11,31,69,0.10)',
              boxShadow: '0 20px 60px rgba(11,31,69,0.10)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(11,31,69,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💳</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F45' }}>Paiement sécurisé</div>
                  <div style={{ fontSize: 11, color: '#8A99B4' }}>Propulsé par Stripe</div>
                </div>
              </div>
              <div style={{ background: '#F8F9FA', borderRadius: 12, padding: '16px', marginBottom: 16, border: '1px solid rgba(11,31,69,0.07)' }}>
                <div style={{ fontSize: 11, color: '#8A99B4', marginBottom: 8 }}>FACTURE N° FAC-2024-034</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1F45', marginBottom: 4 }}>Studio Pixel</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#C8973A' }}>1 850,00 €</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8A99B4', marginBottom: 6, fontWeight: 600 }}>NUMÉRO DE CARTE</div>
                <div style={{ background: '#F8F9FA', border: '1px solid rgba(11,31,69,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#3D4F6B', display: 'flex', justifyContent: 'space-between' }}>
                  <span>4242 4242 4242 ••••</span>
                  <span>💳</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8A99B4', marginBottom: 6, fontWeight: 600 }}>EXPIRATION</div>
                  <div style={{ background: '#F8F9FA', border: '1px solid rgba(11,31,69,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#3D4F6B' }}>12 / 28</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#8A99B4', marginBottom: 6, fontWeight: 600 }}>CVC</div>
                  <div style={{ background: '#F8F9FA', border: '1px solid rgba(11,31,69,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#3D4F6B' }}>•••</div>
                </div>
              </div>
              <div style={{ background: '#0B1F45', borderRadius: 10, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Payer 1 850,00 € →
              </div>
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#8A99B4' }}>🔒 Paiement chiffré SSL · Stripe</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── S6 · COMMENT ÇA MARCHE ─────────────────────────── */}
      <section style={{ background: '#FAF8F4', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div ref={steps.ref} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className={`reveal${steps.visible ? ' visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Simple comme bonjour
            </div>
            <h2 className={`section-title reveal${steps.visible ? ' visible' : ''} delay-1`} style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Comment ça marche ?
            </h2>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>
            {[
              { num: '01', title: 'Créez votre compte', desc: 'Inscription en 2 minutes, sans carte bancaire. Configurez votre profil entreprise en quelques étapes.' },
              { num: '02', title: 'Importez vos clients', desc: 'Ajoutez vos clients manuellement ou importez-les via CSV en quelques secondes.' },
              { num: '03', title: 'Gérez votre activité', desc: 'Créez devis, factures, relancez les impayés et suivez votre CA en temps réel.' },
            ].map((step, i) => (
              <div key={step.num} className={`reveal${steps.visible ? ' visible' : ''} delay-${i + 1}`} style={{
                background: '#fff', borderRadius: 16, padding: '36px 32px',
                border: '1.5px solid rgba(11,31,69,0.09)',
              }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 56, fontWeight: 700, color: '#C8973A', lineHeight: 1, marginBottom: 18, opacity: 0.85 }}>{step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F45', marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#5A6B88', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S7 · FONCTIONNALITÉS ───────────────────────────── */}
      <section id="fonctionnalites" style={{ background: '#fff', padding: '96px 2rem' }}>
        <div ref={features.ref} style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className={`reveal${features.visible ? ' visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Ce que NovaBiz fait pour vous
            </div>
            <h2 className={`section-title reveal${features.visible ? ' visible' : ''} delay-1`} style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>
              Tout en un, rien à installer
            </h2>
          </div>

          <div className="features-tabs" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
            {FEATURES.map((f, i) => (
              <button key={f.id} onClick={() => setActiveFeature(i)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                border: activeFeature === i ? '1.5px solid #0B1F45' : '1.5px solid rgba(11,31,69,0.12)',
                background: activeFeature === i ? '#0B1F45' : '#fff',
                color: activeFeature === i ? '#fff' : '#3D4F6B',
                transition: 'all 0.15s',
              }}>
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div className={`reveal-left${features.visible ? ' visible' : ''}`}>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 30, fontWeight: 700, color: '#0B1F45', lineHeight: 1.25, marginBottom: 16 }}>{feat.title}</h3>
              <p style={{ fontSize: 16, color: '#5A6B88', lineHeight: 1.7, marginBottom: 28 }}>{feat.desc}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feat.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(200,151,58,0.12)', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 15, color: '#3D4F6B', lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`reveal-right${features.visible ? ' visible' : ''} delay-2`} style={{
              background: feat.color, borderRadius: 20, padding: 36, minHeight: 320,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(11,31,69,0.18)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{feat.icon}</div>
              <div style={{ fontSize: 22, fontFamily: 'Georgia,serif', color: '#fff', fontWeight: 700, marginBottom: 12 }}>{feat.label}</div>
              {feat.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: feat.accent, fontWeight: 700, fontSize: 13 }}>✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── S8 · TARIFS (zoom-in) ──────────────────────────── */}
      <section id="tarifs" style={{ padding: '100px 2rem', background: '#FAF8F4' }}>
        <div ref={pricing.ref} style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`reveal${pricing.visible ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8973A', marginBottom: 14 }}>Tarifs</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 800, color: '#0B1F45', marginBottom: 16 }}>Un seul outil. Tout inclus.</h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 460, margin: '0 auto 28px' }}>
              CRM, devis, factures, relances IA, classeur et rapports — dans un seul abonnement.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 100, padding: '6px 8px' }}>
              <button onClick={() => setAnnuel(false)} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', background: !annuel ? '#0B1F45' : 'transparent', color: !annuel ? '#fff' : '#64748B', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>Mensuel</button>
              <button onClick={() => setAnnuel(true)} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', background: annuel ? '#0B1F45' : 'transparent', color: annuel ? '#fff' : '#64748B', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                Annuel
                <span style={{ background: '#C8973A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>-20%</span>
              </button>
            </div>
          </div>

          <div className={`reveal-scale${pricing.visible ? ' visible' : ''} delay-2`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }} className="pricing-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plans.map(plan => (
                <button key={plan.id} onClick={() => setActivePlan(plan.id)} style={{
                  background: activePlan === plan.id ? '#fff' : 'transparent',
                  border: activePlan === plan.id ? '1px solid rgba(11,31,69,0.12)' : '1px solid transparent',
                  borderRadius: 14, padding: '20px 24px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s',
                  boxShadow: activePlan === plan.id ? '0 4px 24px rgba(11,31,69,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 18, fontFamily: 'Georgia, serif', fontWeight: 700, color: activePlan === plan.id ? '#0B1F45' : '#94A3B8' }}>{plan.label}</span>
                        {plan.popular && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#C8973A', color: '#fff', padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em' }}>POPULAIRE</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>{plan.subtitle}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {plan.price ? (
                        <>
                          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800, color: activePlan === plan.id ? '#C8973A' : '#CBD5E1' }}>
                            {annuel ? plan.price.annuel : plan.price.mensuel}€
                          </span>
                          <span style={{ fontSize: 13, color: '#94A3B8' }}>/mois</span>
                        </>
                      ) : (
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: activePlan === plan.id ? '#C8973A' : '#CBD5E1' }}>Sur devis</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {(() => {
              const currentPlan = plans.find(p => p.id === activePlan) ?? plans[1]
              return (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(11,31,69,0.10)', padding: '32px', boxShadow: '0 8px 40px rgba(11,31,69,0.08)' }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 800, color: '#0B1F45', margin: 0 }}>{currentPlan.label}</h3>
                      {currentPlan.popular && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#C8973A', color: '#fff', padding: '4px 10px', borderRadius: 100 }}>LE PLUS CHOISI</span>
                      )}
                    </div>
                    {currentPlan.price ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 800, color: '#C8973A', lineHeight: 1 }}>
                          {annuel ? currentPlan.price.annuel : currentPlan.price.mensuel}€
                        </span>
                        <span style={{ fontSize: 14, color: '#94A3B8' }}>/ mois HT</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 800, color: '#C8973A' }}>Sur mesure</span>
                    )}
                    {annuel && currentPlan.price && (
                      <p style={{ fontSize: 13, color: '#0F6E56', marginTop: 6, fontWeight: 600 }}>
                        Soit {currentPlan.price.annuel * 12}€ / an — vous économisez {(currentPlan.price.mensuel - currentPlan.price.annuel) * 12}€
                      </p>
                    )}
                    <p style={{ fontSize: 14, color: '#64748B', marginTop: 12, lineHeight: 1.6 }}>{currentPlan.description}</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(11,31,69,0.08)', paddingTop: 24, marginBottom: 28 }}>
                    {currentPlan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', fontSize: 14, color: '#374151', borderBottom: '1px solid rgba(11,31,69,0.05)' }}>
                        <span style={{ color: '#C8973A', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  {currentPlan.bienvenue && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>🎁</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 2 }}>Offre de bienvenue</div>
                        <div style={{ fontSize: 13, color: '#15803D' }}>{currentPlan.bienvenue}</div>
                      </div>
                    </div>
                  )}
                  <Link href="/signup" style={{ display: 'block', textAlign: 'center', background: '#0B1F45', color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, transition: 'background 0.15s' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget as HTMLElement).style.background = '#162F5F'}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget as HTMLElement).style.background = '#0B1F45'}
                  >
                    {currentPlan.id === 'enterprise' ? 'Nous contacter' : 'Commencer gratuitement →'}
                  </Link>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 12 }}>15 jours gratuits · Sans engagement · Sans carte bancaire</p>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ── RESSOURCES ─────────────────────────────────────── */}
      <section id="ressources" style={{ background: '#fff', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div ref={resources.ref} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className={`reveal${resources.visible ? ' visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Pour aller plus loin</div>
            <h2 className={`section-title reveal${resources.visible ? ' visible' : ''} delay-1`} style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>Ressources & accompagnement</h2>
          </div>
          <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { icon: '📚', title: "Centre d'aide", desc: 'Trouvez des réponses à toutes vos questions dans notre documentation complète.', link: '/ressources/centre-aide' },
              { icon: '📖', title: 'Guides pratiques', desc: 'Des guides pas-à-pas pour configurer NovaBiz et optimiser votre gestion.', link: '/ressources/guides' },
              { icon: '💡', title: 'Blog & conseils', desc: 'Conseils, actualités fiscales et bonnes pratiques pour les entrepreneurs français.', link: '/ressources/blog' },
            ].map((card, i) => (
              <a key={card.title} href={card.link} className={`reveal${resources.visible ? ' visible' : ''} delay-${i + 1}`} style={{ display: 'block', background: '#fff', borderRadius: 16, padding: '32px 28px', border: '1.5px solid rgba(11,31,69,0.10)', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(11,31,69,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
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

      {/* ── TÉMOIGNAGES ────────────────────────────────────── */}
      <section style={{ background: '#FAF8F4', padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div ref={testimonials.ref} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className={`reveal${testimonials.visible ? ' visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Ils nous font confiance</div>
            <h2 className={`section-title reveal${testimonials.visible ? ' visible' : ''} delay-1`} style={{ fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, color: '#0B1F45', letterSpacing: '-0.01em' }}>Ce qu'en disent nos clients</h2>
          </div>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { quote: "NovaBiz m'a fait gagner 3h par semaine sur ma gestion. Les relances automatiques ont réduit mes impayés de moitié.", name: 'Sophie Martin', role: 'Consultante RH indépendante', initials: 'SM' },
              { quote: 'Enfin un outil simple qui fait tout. Devis, factures, relances... Je ne perds plus de temps avec la paperasse.', name: 'Karim Benali', role: 'Gérant TPE BTP', initials: 'KB' },
              { quote: "L'intégration IA pour les relances est bluffante. Mes clients paient plus vite et le ton est toujours adapté.", name: 'Élodie Rousseau', role: 'Directrice agence marketing', initials: 'ER' },
            ].map((t, i) => (
              <div key={t.name} className={`reveal${testimonials.visible ? ' visible' : ''} delay-${i + 1}`} style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 26px', border: '1.5px solid rgba(11,31,69,0.09)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ fontSize: 16, letterSpacing: 2 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: 15, color: '#3D4F6B', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0B1F45', color: '#C8973A', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F45' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#8A99B4', marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S9 · CTA FINAL ─────────────────────────────────── */}
      <section style={{ background: '#0B1F45', padding: '100px 2rem' }}>
        <div ref={cta.ref} style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 className={`reveal${cta.visible ? ' visible' : ''}`} style={{ fontFamily: 'Georgia,serif', fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.02em' }}>
            Prêt à reprendre le contrôle de votre gestion ?
          </h2>
          <p className={`reveal${cta.visible ? ' visible' : ''} delay-1`} style={{ fontSize: 17, color: 'rgba(255,255,255,0.60)', marginBottom: 40, lineHeight: 1.65 }}>
            Rejoignez des centaines d'entrepreneurs qui font confiance à NovaBiz pour gérer leur activité au quotidien.
          </p>
          <div className={`reveal${cta.visible ? ' visible' : ''} delay-2`}>
            <Link href="/signup" className="pulse-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8973A', color: '#fff', padding: '16px 36px', borderRadius: 12, fontSize: 17, fontWeight: 700 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b07c2e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C8973A' }}
            >Commencer gratuitement →</Link>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 16 }}>15 jours gratuits · Sans carte bancaire · Annulation à tout moment</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ background: '#070F22', padding: '48px 2rem 32px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: '#0B1F45', border: '1px solid rgba(200,151,58,0.4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 16, color: '#C8973A' }}>N</div>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>Nova<span style={{ color: '#C8973A' }}>Biz</span></span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', lineHeight: 1.7 }}>La solution de gestion administrative pour les entreprises françaises.</p>
            </div>
            {[
              { label: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Nouveautés', 'Roadmap'] },
              { label: 'Ressources', links: ["Centre d'aide", 'Guides pratiques', 'Blog', 'API'] },
              { label: 'Légal', links: ['Mentions légales', 'CGU', 'Confidentialité', 'RGPD'] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.label}</div>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 9, fontWeight: 500, transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
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
    </>
  )
}