'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Factures', href: '/factures' },
  { label: 'Devis', href: '/devis' },
  { label: 'CRM', href: '/crm' },
  { label: 'Frais', href: '/frais' },
  { label: 'Relances', href: '/relances' },
  { label: 'Planning', href: '/planning' },
  { label: 'Abonnement', href: '/abonnement' },
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Gratuit',
    description: 'Pour démarrer votre activité',
    features: [
      '5 factures / mois',
      '3 devis / mois',
      '10 clients',
      'Tableau de bord basique',
      'Export PDF',
    ],
    missing: [
      'Relances IA',
      'Planning avancé',
      'Rapports personnalisés',
      'Support prioritaire',
    ],
    cta: 'Plan actuel',
    current: true,
    accent: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: '/ mois HT',
    description: 'Pour les indépendants actifs',
    features: [
      'Factures illimitées',
      'Devis illimités',
      'Clients illimités',
      'Tableau de bord complet',
      'Export PDF & Excel',
      'Relances IA (Claude Opus)',
      'Planning interactif',
    ],
    missing: [
      'Rapports personnalisés',
      'Support prioritaire',
    ],
    cta: 'Passer au Pro',
    current: false,
    accent: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 79,
    period: '/ mois HT',
    description: 'Pour les équipes et PME',
    features: [
      'Tout ce qui est inclus dans Pro',
      'Multi-utilisateurs (5 comptes)',
      'Rapports personnalisés',
      'API NovaBiz',
      'Support prioritaire 24/7',
      'Comptable invité (lecture)',
      'Intégrations (Stripe, QuickBooks)',
    ],
    missing: [],
    cta: 'Passer au Business',
    current: false,
    accent: false,
  },
]

const HISTORIQUE = [
  { date: '01/03/2026', plan: 'Starter', montant: 0, statut: 'Gratuit' },
  { date: '01/02/2026', plan: 'Starter', montant: 0, statut: 'Gratuit' },
  { date: '01/01/2026', plan: 'Starter', montant: 0, statut: 'Gratuit' },
]

export default function Abonnement() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [annual, setAnnual] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleUpgrade = (planName: string) => {
    showToast(`Redirection vers le paiement ${planName}… (démo)`)
  }

  if (!user || loading) {
    return (
      <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: '#0B1F45', color: '#fff', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', zIndex: 100, boxShadow: '0 8px 32px rgba(11,31,69,0.25)' }}>
          {toastMsg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ background: '#0B1F45', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/dashboard" style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '700', color: '#fff', textDecoration: 'none' }}>
            Nova<span style={{ color: '#C8973A' }}>Biz</span>
          </a>
          <div style={{ display: 'flex', gap: '4px' }}>
            {NAV.map(l => (
              <a key={l.href} href={l.href} style={{
                fontSize: '13px',
                fontWeight: '500',
                color: l.href === '/abonnement' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                background: l.href === '/abonnement' ? 'rgba(200,151,58,0.12)' : 'transparent',
              }}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{user.email}</div>
          <button onClick={handleLogout} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '700', color: '#0B1F45', margin: 0 }}>
            Abonnement
          </h1>
          <p style={{ color: '#8A92A3', fontSize: '14px', marginTop: '6px' }}>
            Gérez votre plan et votre facturation NovaBiz.
          </p>
        </div>

        {/* Plan actuel */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '28px 32px', marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(11,31,69,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#8A92A3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Plan actuel</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '700', color: '#0B1F45' }}>Starter — Gratuit</div>
              <div style={{ fontSize: '13px', color: '#8A92A3', marginTop: '2px' }}>Actif depuis le 1 janvier 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: 'rgba(34,197,94,0.1)', color: '#15803d', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: '600' }}>
              ✓ Actif
            </span>
          </div>
        </div>

        {/* Toggle annuel/mensuel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '14px', color: !annual ? '#0B1F45' : '#8A92A3', fontWeight: !annual ? '600' : '400' }}>Mensuel</span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: annual ? '#C8973A' : 'rgba(11,31,69,0.15)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: annual ? '25px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
          <span style={{ fontSize: '14px', color: annual ? '#0B1F45' : '#8A92A3', fontWeight: annual ? '600' : '400' }}>
            Annuel
            <span style={{ marginLeft: '6px', background: 'rgba(200,151,58,0.15)', color: '#C8973A', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
              −20%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '48px' }}>
          {PLANS.map(plan => {
            const price = annual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price
            return (
              <div key={plan.id} style={{
                background: plan.accent ? '#0B1F45' : '#fff',
                border: plan.accent ? '2px solid #C8973A' : '1px solid rgba(11,31,69,0.1)',
                borderRadius: '20px',
                padding: '32px 28px',
                display: 'flex', flexDirection: 'column', gap: '0',
                position: 'relative',
              }}>
                {plan.accent && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#C8973A', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    Le plus populaire
                  </div>
                )}

                <div style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '700', color: plan.accent ? '#fff' : '#0B1F45', marginBottom: '6px' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '13px', color: plan.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', marginBottom: '20px' }}>
                  {plan.description}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: '38px', fontWeight: '800', color: plan.accent ? '#C8973A' : '#0B1F45' }}>
                    {price === 0 ? '0€' : `${price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: '13px', color: plan.accent ? 'rgba(255,255,255,0.45)' : '#8A92A3' }}>
                      {annual ? '/ mois facturé annuellement' : plan.period}
                    </span>
                  )}
                </div>
                {annual && plan.price > 0 && (
                  <div style={{ fontSize: '12px', color: plan.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginBottom: '20px' }}>
                    soit {price * 12}€ / an HT
                  </div>
                )}

                <div style={{ width: '100%', height: '1px', background: plan.accent ? 'rgba(255,255,255,0.1)' : 'rgba(11,31,69,0.08)', margin: '16px 0 20px' }} />

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: plan.accent ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                      <span style={{ color: '#C8973A', fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: plan.accent ? 'rgba(255,255,255,0.3)' : 'rgba(11,31,69,0.25)', textDecoration: 'line-through' }}>
                      <span style={{ flexShrink: 0, marginTop: '1px' }}>✕</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !plan.current && handleUpgrade(plan.name)}
                  disabled={plan.current}
                  style={{
                    marginTop: '28px',
                    width: '100%', padding: '12px',
                    background: plan.current ? 'rgba(11,31,69,0.06)' : plan.accent ? '#C8973A' : '#0B1F45',
                    color: plan.current ? '#8A92A3' : '#fff',
                    border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '600',
                    cursor: plan.current ? 'default' : 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { if (!plan.current) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                >
                  {plan.current ? '✓ Plan actuel' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Historique de facturation */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(11,31,69,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', margin: 0 }}>
              Historique de facturation
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(11,31,69,0.02)' }}>
                {['Date', 'Plan', 'Montant', 'Statut', 'Reçu'].map(h => (
                  <th key={h} style={{ padding: '10px 28px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORIQUE.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(11,31,69,0.06)' }}>
                  <td style={{ padding: '14px 28px', fontSize: '14px', color: '#374151' }}>{row.date}</td>
                  <td style={{ padding: '14px 28px', fontSize: '14px', color: '#0B1F45', fontWeight: '500' }}>{row.plan}</td>
                  <td style={{ padding: '14px 28px', fontSize: '14px', fontFamily: 'Georgia,serif', color: '#0B1F45' }}>
                    {row.montant === 0 ? '—' : `${row.montant}€`}
                  </td>
                  <td style={{ padding: '14px 28px' }}>
                    <span style={{ background: 'rgba(34,197,94,0.1)', color: '#15803d', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                      {row.statut}
                    </span>
                  </td>
                  <td style={{ padding: '14px 28px', fontSize: '13px', color: row.montant === 0 ? '#8A92A3' : '#C8973A', cursor: row.montant === 0 ? 'default' : 'pointer' }}>
                    {row.montant === 0 ? '—' : '⬇ Télécharger'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info paiement */}
        <div style={{ marginTop: '24px', background: 'rgba(11,31,69,0.03)', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '12px', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <p style={{ margin: 0, fontSize: '13px', color: '#8A92A3', lineHeight: '1.5' }}>
            Paiements sécurisés par <strong style={{ color: '#0B1F45' }}>Stripe</strong>. Vos données bancaires ne sont jamais stockées sur nos serveurs. Résiliez à tout moment depuis cette page.
          </p>
        </div>

      </div>
    </div>
  )
}
