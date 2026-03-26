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
  { label: 'Rapports', href: '/rapports' },
  { label: 'Paramètres', href: '/parametres' },
]

const PACKS = [
  {
    key: 'decouverte',
    label: 'Découverte',
    credits: 20,
    price: '5€',
    description: 'Idéal pour tester',
    perCredit: '0,25€ / relance',
    color: '#6366F1',
    badge: null,
  },
  {
    key: 'pro',
    label: 'Pro',
    credits: 50,
    price: '10€',
    description: 'Le plus populaire',
    perCredit: '0,20€ / relance',
    color: '#C8973A',
    badge: '⭐ Populaire',
  },
  {
    key: 'business',
    label: 'Business',
    credits: 120,
    price: '20€',
    description: 'Meilleur rapport qualité/prix',
    perCredit: '0,17€ / relance',
    color: '#059669',
    badge: '💎 Meilleur prix',
  },
]

export default function Abonnement() {
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: profil } = await supabase
        .from('profil')
        .select('credits')
        .eq('user_id', user.id)
        .single()
      setCredits(profil?.credits ?? 0)
      setLoading(false)
    }
    init()

    // Gérer le retour depuis Stripe
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      const c = params.get('credits')
      setToast({ msg: `✅ Paiement confirmé ! ${c} crédits ajoutés à votre compte.`, type: 'success' })
      window.history.replaceState({}, '', '/abonnement')
      // Rafraîchir les crédits après 1s (le webhook peut prendre quelques secondes)
      setTimeout(() => init(), 2000)
    } else if (params.get('cancelled') === '1') {
      setToast({ msg: 'Paiement annulé.', type: 'error' })
      window.history.replaceState({}, '', '/abonnement')
    }
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const acheter = async (pack: string) => {
    setLoadingPack(pack)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ pack }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      setToast({ msg: `Erreur : ${msg}`, type: 'error' })
      setLoadingPack(null)
    }
  }

  if (loading) return (
    <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const creditColor = credits === 0 ? '#DC2626' : credits !== null && credits <= 3 ? '#D97706' : '#059669'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 100,
          background: toast.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: toast.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          {toast.msg}
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
                fontSize: '13px', fontWeight: '500', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '8px',
                color: 'rgba(255,255,255,0.55)',
                background: 'transparent',
              }}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ padding: '36px 2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: '#0B1F45', margin: '0 0 8px' }}>
            Crédits Relance IA
          </h1>
          <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>
            Chaque crédit = 1 email de relance généré par Claude Opus
          </p>
        </div>

        {/* Solde actuel */}
        <div style={{
          background: '#0B1F45', borderRadius: '20px', padding: '28px 32px',
          marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Solde actuel
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '52px', fontWeight: '800', color: creditColor, lineHeight: 1 }}>
                {credits ?? '…'}
              </span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>crédits</span>
            </div>
            {credits === 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#FCA5A5', fontWeight: '500' }}>
                ⚠ Plus de crédits — rechargez pour continuer à utiliser la Relance IA
              </div>
            )}
            {credits !== null && credits > 0 && credits <= 3 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#FCD34D', fontWeight: '500' }}>
                ⚡ Bientôt épuisé — pensez à recharger
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Nouveaux inscrits</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>5 crédits offerts 🎁</div>
          </div>
        </div>

        {/* Packs */}
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', marginBottom: '20px' }}>
          Recharger des crédits
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {PACKS.map(pack => (
            <div key={pack.key} style={{
              background: '#fff', borderRadius: '20px', padding: '28px',
              border: `2px solid ${pack.key === 'pro' ? '#C8973A' : 'rgba(11,31,69,0.1)'}`,
              position: 'relative', overflow: 'hidden',
              boxShadow: pack.key === 'pro' ? '0 4px 24px rgba(200,151,58,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              {pack.badge && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: pack.key === 'pro' ? '#FEF3C7' : '#D1FAE5',
                  color: pack.key === 'pro' ? '#92400E' : '#065F46',
                  fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                }}>
                  {pack.badge}
                </div>
              )}
              <div style={{ fontSize: '12px', fontWeight: '700', color: pack.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {pack.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: '36px', fontWeight: '800', color: '#0B1F45' }}>{pack.credits}</span>
                <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>crédits</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0B1F45', marginBottom: '4px' }}>{pack.price}</div>
              <div style={{ fontSize: '12px', color: '#8A92A3', marginBottom: '6px' }}>{pack.perCredit}</div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>{pack.description}</div>
              <button
                onClick={() => acheter(pack.key)}
                disabled={loadingPack === pack.key}
                style={{
                  width: '100%', padding: '12px',
                  background: pack.key === 'pro'
                    ? 'linear-gradient(135deg, #C8973A, #e8b85a)'
                    : '#0B1F45',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: '700', cursor: loadingPack === pack.key ? 'not-allowed' : 'pointer',
                  opacity: loadingPack === pack.key ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loadingPack === pack.key ? (
                  <>
                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Redirection…
                  </>
                ) : `Acheter pour ${pack.price}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid rgba(11,31,69,0.1)' }}>
          <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', marginTop: 0, marginBottom: '16px' }}>
            Questions fréquentes
          </h3>
          {[
            ['Les crédits expirent-ils ?', 'Non, vos crédits sont valables à vie.'],
            ['Que se passe-t-il si la génération échoue ?', 'Le crédit est automatiquement remboursé si l\'IA ne génère pas de réponse.'],
            ['Le paiement est-il sécurisé ?', 'Oui, le paiement est traité par Stripe, leader mondial de la sécurité des paiements. Vos données bancaires ne transitent jamais par NovaBiz.'],
            ['Puis-je avoir une facture ?', 'Stripe envoie automatiquement un reçu à votre email après chaque achat.'],
          ].map(([q, a]) => (
            <div key={q} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid rgba(11,31,69,0.06)' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '4px' }}>{q}</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
