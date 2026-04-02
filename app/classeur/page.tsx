'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const features = [
  {
    id: 'devis',
    label: 'Devis & Factures',
    icon: '📄',
    title: 'Créez et envoyez vos devis en 2 minutes',
    description:
      'Transformez vos devis en factures en un clic. Personnalisez vos modèles, suivez les paiements et téléchargez vos documents PDF en quelques secondes.',
    points: [
      'Conversion devis → facture en 1 clic',
      'Modèles personnalisables à votre image',
      'Export PDF et envoi par email intégré',
      'Suivi des paiements en temps réel',
    ],
  },
  {
    id: 'relances',
    label: 'Relances IA',
    icon: '🤖',
    title: 'Réduisez vos impayés grâce à l\'IA',
    description:
      'NovaBiz rédige automatiquement des emails de relance personnalisés selon le profil de chaque client. Choisissez le ton : courtois, ferme ou urgent.',
    points: [
      'Rédaction automatique par IA (Claude)',
      '3 tons disponibles : courtois, ferme, urgent',
      'Historique complet des relances',
      'Réduction moyenne de 68% des impayés',
    ],
  },
  {
    id: 'crm',
    label: 'CRM Clients',
    icon: '👥',
    title: 'Centralisez toutes vos relations clients',
    description:
      'Un CRM simple et efficace pour gérer vos contacts, suivre vos opportunités et garder un historique complet de chaque interaction avec vos clients.',
    points: [
      'Fiche client complète avec historique',
      'Lien automatique devis / factures / relances',
      'Import & export CSV facile',
      'Vue d\'ensemble de votre portefeuille',
    ],
  },
  {
    id: 'pilotage',
    label: 'Pilotage',
    icon: '📊',
    title: 'Pilotez votre activité en temps réel',
    description:
      'Tableaux de bord, rapports comptables, export CSV — suivez vos KPIs financiers et prenez les bonnes décisions au bon moment.',
    points: [
      'Dashboard KPIs financiers',
      'Rapports mensuels et annuels',
      'Export comptable CSV',
      'Suivi CA et taux d\'encaissement',
    ],
  },
]

const plans = [
  {
    id: 'freelance',
    label: 'Freelance',
    subtitle: 'Indépendant & auto-entrepreneur',
    price: 19,
    description: 'La solution idéale pour démarrer et gérer votre activité seul, simplement.',
    features: [
      'Devis & factures illimités',
      '5 relances IA / mois',
      'CRM jusqu\'à 50 clients',
      'Export PDF',
      'Support email',
    ],
  },
  {
    id: 'tpe',
    label: 'TPE',
    subtitle: '2 à 9 salariés',
    price: 39,
    description: 'Pour les petites équipes qui veulent automatiser et gagner du temps.',
    features: [
      'Tout Freelance, plus :',
      '20 relances IA / mois',
      'CRM clients illimité',
      'Dashboard & rapports',
      '3 utilisateurs inclus',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'pme',
    label: 'PME',
    subtitle: '10 salariés et plus',
    price: 79,
    description: 'Multi-utilisateurs, automatisations avancées et reporting complet.',
    features: [
      'Tout TPE, plus :',
      'Relances IA illimitées',
      'Utilisateurs illimités',
      'API & intégrations',
      'Export comptable avancé',
      'Support dédié 24/7',
    ],
  },
  {
    id: 'enterprise',
    label: 'Entreprise',
    subtitle: 'Sur mesure',
    price: null,
    description: 'Un accompagnement personnalisé pour les besoins spécifiques et les grandes structures.',
    features: [
      'Tout PME, plus :',
      'Onboarding personnalisé',
      'Intégration ERP / CRM',
      'SLA garanti',
      'Responsable de compte dédié',
    ],
  },
]

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState('devis')
  const [activePlan, setActivePlan] = useState('tpe')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const currentFeature = features.find(f => f.id === activeFeature)!
  const currentPlan = plans.find(p => p.id === activePlan)!

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#FAF8F4', color: '#0B1F45', minHeight: '100vh' }}>

      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
        borderBottom: '1px solid rgba(11,31,69,0.08)',
        backdropFilter: 'blur(12px)',
        transition: 'box-shadow 0.2s',
        boxShadow: scrolled ? '0 2px 20px rgba(11,31,69,0.08)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: '#0B1F45', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#C8973A', fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 16 }}>N</span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0B1F45' }}>
              Nova<span style={{ color: '#C8973A' }}>Biz</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Tarifs', href: '#tarifs' },
              { label: 'Ressources', href: '#ressources' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: '#4A5568', textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#F3F0EA'; (e.target as HTMLElement).style.color = '#0B1F45' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#4A5568' }}
              >{item.label}</a>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: '#4A5568', textDecoration: 'none', padding: '8px 14px' }}>
              Se connecter
            </Link>
            <Link href="/signup" style={{
              background: '#0B1F45', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '10px 22px', borderRadius: 10, textDecoration: 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#162F5F')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0B1F45')}
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '80px 2rem 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFF8EC', border: '1px solid rgba(200,151,58,0.3)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8973A', display: 'block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C8973A', letterSpacing: '0.05em' }}>Gestion d'entreprise simplifiée</span>
            </div>
            <h1 style={{
              fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 800,
              color: '#0B1F45', lineHeight: 1.1, marginBottom: 20,
            }}>
              NovaBiz simplifie la gestion administrative de votre entreprise
            </h1>
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              Centralisez vos devis, factures, relances et paiements dans un seul outil.
              Gagnez du temps, réduisez les impayés et pilotez votre activité plus facilement.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                background: '#C8973A', color: '#fff', fontWeight: 600, fontSize: 15,
                padding: '14px 32px', borderRadius: 10, textDecoration: 'none',
                display: 'inline-block', transition: 'all 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B8852A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C8973A')}
              >
                Essayer gratuitement →
              </Link>
              <a href="#fonctionnalites" style={{
                background: 'transparent', color: '#0B1F45', fontWeight: 500, fontSize: 15,
                padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
                border: '1px solid rgba(11,31,69,0.2)', display: 'inline-block',
              }}>
                Voir une démo
              </a>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 16 }}>
              15 jours d'essai gratuit · Sans carte bancaire · Sans engagement
            </p>
          </div>

          {/* Right — Dashboard mockup */}
          <div style={{ position: 'relative', paddingTop: 40 }}>
            {/* Main card */}
            <div style={{
              background: '#0B1F45', borderRadius: '20px 20px 0 0',
              padding: '24px 28px', boxShadow: '0 -8px 60px rgba(11,31,69,0.15)',
            }}>
              {/* Fake topbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: 60, height: 8, borderRadius: 4, background: 'rgba(200,151,58,0.4)' }} />
              </div>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'CA ce mois', value: '12 480 €', up: true },
                  { label: 'Factures émises', value: '23', up: true },
                  { label: 'Impayés', value: '1 200 €', up: false },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: k.up ? '#4ADE80' : '#F87171', marginTop: 4 }}>{k.up ? '▲ +12%' : '▼ -3%'}</div>
                  </div>
                ))}
              </div>
              {/* Fake table */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>DERNIÈRES FACTURES</span>
                  <span style={{ fontSize: 11, color: '#C8973A' }}>Voir tout</span>
                </div>
                {[
                  { client: 'Martin Électricité', amount: '2 400 €', status: 'Payée', color: '#4ADE80' },
                  { client: 'Sarl Durand BTP', amount: '5 800 €', status: 'En attente', color: '#FBBF24' },
                  { client: 'Atelier Morin', amount: '960 €', status: 'Relancée', color: '#60A5FA' },
                ].map((row, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(200,151,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#C8973A', fontWeight: 700 }}>
                        {row.client[0]}
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{row.client}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.amount}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: row.color, background: `${row.color}20`, padding: '3px 10px', borderRadius: 100 }}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RÉASSURANCE ─────────────────────────────────────────── */}
      <section style={{ background: '#F3F0EA', borderTop: '1px solid rgba(11,31,69,0.06)', borderBottom: '1px solid rgba(11,31,69,0.06)', padding: '22px 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' }}>
          {[
            { icon: '🇫🇷', text: 'Hébergé en France' },
            { icon: '🔒', text: 'Données sécurisées RGPD' },
            { icon: '✅', text: 'Conforme facturation électronique' },
            { icon: '💬', text: 'Support en français' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4A5568' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ padding: '100px 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8973A', marginBottom: 14 }}>Fonctionnalités</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 800, color: '#0B1F45', marginBottom: 16 }}>
              Tout ce qu'il faut. Rien de superflu.
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>
              NovaBiz regroupe tous les outils dont une PME a besoin au quotidien.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, background: '#F8F7F4', borderRadius: 14, padding: 6, width: 'fit-content', margin: '0 auto 40px' }}>
            {features.map(f => (
              <button key={f.id} onClick={() => setActiveFeature(f.id)} style={{
                padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                transition: 'all 0.18s',
                background: activeFeature === f.id ? '#0B1F45' : 'transparent',
                color: activeFeature === f.id ? '#fff' : '#64748B',
                boxShadow: activeFeature === f.id ? '0 2px 12px rgba(11,31,69,0.2)' : 'none',
              }}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Feature panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Text */}
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 800, color: '#0B1F45', lineHeight: 1.2, marginBottom: 18 }}>
                {currentFeature.title}
              </h3>
              <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.75, marginBottom: 28 }}>
                {currentFeature.description}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {currentFeature.points.map(point => (
                  <li key={point} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', fontSize: 15, color: '#374151', borderBottom: '1px solid rgba(11,31,69,0.06)' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(200,151,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#C8973A', fontWeight: 700 }}>✓</span>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ color: '#C8973A', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                En savoir plus →
              </Link>
            </div>
            {/* Visual */}
            <div style={{ background: '#F3F0EA', borderRadius: 20, padding: 40, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(200,151,58,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>{currentFeature.icon}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#0B1F45', marginBottom: 10 }}>{currentFeature.label}</div>
                <div style={{ fontSize: 14, color: '#64748B', maxWidth: 220, margin: '0 auto', lineHeight: 1.6 }}>{currentFeature.description.slice(0, 80)}…</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TARIFS ───────────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: '100px 2rem', background: '#FAF8F4' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8973A', marginBottom: 14 }}>Tarifs</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 800, color: '#0B1F45', marginBottom: 16 }}>
              Des forfaits adaptés à chaque entreprise
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>
              NovaBiz s'adapte à votre structure — ne payez que pour ce dont vous avez besoin.
            </p>
          </div>

          {/* Layout 2 colonnes comme Kolecto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
            {/* Gauche — liste des plans */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                      <div style={{ fontSize: 18, fontFamily: 'Georgia, serif', fontWeight: 700, color: activePlan === plan.id ? '#0B1F45' : '#94A3B8', marginBottom: 4 }}>
                        {plan.label}
                        {plan.popular && <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 700, background: '#C8973A', color: '#fff', padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em' }}>POPULAIRE</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>{plan.subtitle}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {plan.price ? (
                        <>
                          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800, color: activePlan === plan.id ? '#C8973A' : '#CBD5E1' }}>{plan.price}€</span>
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>/mois HT</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 600, color: activePlan === plan.id ? '#C8973A' : '#CBD5E1' }}>Sur devis</span>
                      )}
                    </div>
                  </div>
                  {activePlan === plan.id && (
                    <p style={{ fontSize: 14, color: '#64748B', marginTop: 12, lineHeight: 1.6 }}>
                      {plan.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Droite — détail du plan sélectionné */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid rgba(11,31,69,0.1)', boxShadow: '0 8px 40px rgba(11,31,69,0.08)', position: 'sticky', top: 90 }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 6 }}>{currentPlan.subtitle}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 800, color: '#0B1F45' }}>{currentPlan.label}</div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {currentPlan.price ? (
                    <>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 800, color: '#C8973A' }}>{currentPlan.price}€</span>
                      <span style={{ fontSize: 14, color: '#94A3B8' }}>/mois HT</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 800, color: '#C8973A' }}>Sur mesure</span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: '#64748B', marginTop: 12, lineHeight: 1.6 }}>{currentPlan.description}</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(11,31,69,0.08)', paddingTop: 24, marginBottom: 28 }}>
                {currentPlan.features.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', fontSize: 14, color: '#374151', borderBottom: '1px solid rgba(11,31,69,0.05)' }}>
                    <span style={{ color: '#C8973A', fontWeight: 700 }}>✓</span>
                    {feat}
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', background: '#0B1F45', color: '#fff',
                fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, textDecoration: 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#162F5F')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0B1F45')}
              >
                {currentPlan.id === 'enterprise' ? 'Nous contacter' : 'Commencer gratuitement →'}
              </Link>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 12 }}>15 jours gratuits · Sans engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESSOURCES ───────────────────────────────────────────── */}
      <section id="ressources" style={{ padding: '100px 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8973A', marginBottom: 14 }}>Ressources</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 800, color: '#0B1F45', marginBottom: 16 }}>
              Tout pour bien démarrer
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '📚', title: 'Centre d\'aide', desc: 'Guides pas à pas, tutoriels vidéos et FAQ pour maîtriser NovaBiz rapidement.', link: '#', cta: 'Accéder au centre d\'aide' },
              { icon: '📖', title: 'Guides pratiques', desc: 'Modèles de devis, conseils comptables, bonnes pratiques pour les PME et indépendants.', link: '#', cta: 'Lire les guides' },
              { icon: '💡', title: 'Blog & conseils', desc: 'Articles et conseils sur la gestion d\'entreprise, la trésorerie et la facturation.', link: '#', cta: 'Lire le blog' },
            ].map(card => (
              <div key={card.title} style={{ background: '#FAF8F4', borderRadius: 16, padding: 32, border: '1px solid rgba(11,31,69,0.06)', transition: 'all 0.18s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(11,31,69,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 36, marginBottom: 20 }}>{card.icon}</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0B1F45', marginBottom: 12 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>{card.desc}</p>
                <a href={card.link} style={{ fontSize: 14, fontWeight: 600, color: '#C8973A', textDecoration: 'none' }}>{card.cta} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────── */}
      <section style={{ background: '#0B1F45', padding: '100px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>
            Prêt à simplifier votre gestion ?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 40, lineHeight: 1.7 }}>
            Rejoignez les PME qui utilisent NovaBiz pour gagner du temps et réduire leurs impayés.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', background: '#C8973A', color: '#fff',
            fontWeight: 600, fontSize: 16, padding: '16px 40px', borderRadius: 12, textDecoration: 'none',
          }}>
            Essayer NovaBiz gratuitement →
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
            15 jours gratuits · Sans carte bancaire · Sans engagement
          </p>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: '#070F22', padding: '48px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: 'rgba(200,151,58,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#C8973A', fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 14 }}>N</span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              Nova<span style={{ color: '#C8973A' }}>Biz</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Fonctionnalités', 'Tarifs', 'Ressources', 'Mentions légales'].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 NovaBiz — Fait avec soin en France 🇫🇷
          </p>
        </div>
      </footer>
    </div>
  )
}
