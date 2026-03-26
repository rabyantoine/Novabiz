'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Facture = {
  id: string
  client_nom: string
  numero_facture: string | null
  montant_ht: number
  montant_ttc: number
  date_emission: string
  date_echeance: string | null
  statut: string
}

type RelanceState = {
  loading: boolean
  objet: string
  corps: string
  error: string
  copied: boolean
}

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

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function joursRetard(dateEcheance: string | null): number {
  if (!dateEcheance) return 0
  const diff = new Date().getTime() - new Date(dateEcheance).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function retardLabel(jours: number): { label: string; bg: string; color: string } {
  if (jours > 30) return { label: `${jours}j de retard`, bg: '#FEE2E2', color: '#DC2626' }
  if (jours > 0)  return { label: `${jours}j de retard`, bg: '#FEF3C7', color: '#D97706' }
  if (jours === 0) return { label: 'Échéance auj.', bg: '#DBEAFE', color: '#2563EB' }
  return { label: `Dans ${Math.abs(jours)}j`, bg: '#F3F4F6', color: '#6B7280' }
}

export default function Relances() {
  const [user, setUser] = useState<any>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [relances, setRelances] = useState<Record<string, RelanceState>>({})
  const [paid, setPaid] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'toutes' | 'retard' | 'imminente'>('toutes')
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: profil } = await supabase.from('profil').select('credits').eq('user_id', user.id).single()
      setCreditsLeft(profil?.credits ?? 0)
      const { data } = await supabase
        .from('factures')
        .select('id, client_nom, numero_facture, montant_ht, montant_ttc, date_emission, date_echeance, statut')
        .eq('user_id', user.id)
        .eq('statut', 'envoyée')
        .order('date_echeance', { ascending: true })
      setFactures(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const genererRelance = async (f: Facture) => {
    const jours = joursRetard(f.date_echeance)
    setRelances(r => ({ ...r, [f.id]: { loading: true, objet: '', corps: '', error: '', copied: false } }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/relances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          client_nom: f.client_nom,
          numero_facture: f.numero_facture,
          montant_ht: f.montant_ht,
          montant_ttc: f.montant_ttc,
          date_emission: f.date_emission,
          date_echeance: f.date_echeance,
          jours_retard: jours,
        }),
      })
      const data = await res.json()
      if (res.status === 402) {
        // Plus de crédits
        setRelances(r => ({ ...r, [f.id]: { loading: false, objet: '', corps: '', error: 'NO_CREDITS', copied: false } }))
        return
      }
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      // Mettre à jour le compteur de crédits
      if (data.credits_restants !== undefined) setCreditsLeft(data.credits_restants)
      setRelances(r => ({ ...r, [f.id]: { loading: false, objet: data.objet, corps: data.corps, error: '', copied: false } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setRelances(r => ({ ...r, [f.id]: { loading: false, objet: '', corps: '', error: msg, copied: false } }))
    }
  }

  const copier = async (id: string, objet: string, corps: string) => {
    await navigator.clipboard.writeText(`Objet : ${objet}\n\n${corps}`)
    setRelances(r => ({ ...r, [id]: { ...r[id], copied: true } }))
    setTimeout(() => setRelances(r => ({ ...r, [id]: { ...r[id], copied: false } })), 2500)
  }

  const marquerPayee = async (id: string) => {
    await supabase.from('factures').update({ statut: 'payée', date_paiement: new Date().toISOString().split('T')[0] }).eq('id', id)
    setPaid(p => new Set([...p, id]))
  }

  const filtered = factures
    .filter(f => !paid.has(f.id))
    .filter(f => {
      const j = joursRetard(f.date_echeance)
      if (filter === 'retard') return j > 0
      if (filter === 'imminente') return j <= 0 && j > -7
      return true
    })

  const totalImpayes = factures.filter(f => !paid.has(f.id)).reduce((s, f) => s + Number(f.montant_ttc || 0), 0)
  const nbRetard = factures.filter(f => !paid.has(f.id) && joursRetard(f.date_echeance) > 0).length
  const nbCritique = factures.filter(f => !paid.has(f.id) && joursRetard(f.date_echeance) > 30).length

  if (loading) return (
    <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
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
                color: l.href === '/relances' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                background: l.href === '/relances' ? 'rgba(200,151,58,0.12)' : 'transparent',
              }}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {creditsLeft !== null && (
            <a href="/abonnement" style={{
              display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none',
              background: creditsLeft === 0 ? 'rgba(220,38,38,0.15)' : 'rgba(200,151,58,0.12)',
              border: `1px solid ${creditsLeft === 0 ? 'rgba(220,38,38,0.3)' : 'rgba(200,151,58,0.3)'}`,
              borderRadius: '20px', padding: '4px 12px',
            }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: creditsLeft === 0 ? '#FCA5A5' : '#C8973A' }}>
                {creditsLeft} crédit{creditsLeft !== 1 ? 's' : ''}
              </span>
            </a>
          )}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ padding: '36px 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>Relances</h1>
            <span style={{ background: 'linear-gradient(135deg, #C8973A, #e8b85a)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.04em' }}>IA</span>
          </div>
          <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
            {factures.filter(f => !paid.has(f.id)).length} facture{factures.filter(f => !paid.has(f.id)).length !== 1 ? 's' : ''} impayée{factures.filter(f => !paid.has(f.id)).length !== 1 ? 's' : ''} — emails générés par Claude Opus
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total impayés', value: fmt(totalImpayes), sub: `${factures.filter(f => !paid.has(f.id)).length} factures envoyées`, accent: true },
            { label: 'En retard', value: String(nbRetard), sub: 'Date d\'échéance dépassée', accent: false },
            { label: 'Critique (>30j)', value: String(nbCritique), sub: 'Relance ferme recommandée', accent: false },
          ].map((k, i) => (
            <div key={i} style={{
              background: k.accent ? '#0B1F45' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? '#FFF5F5' : '#fff'),
              border: `1px solid ${k.accent ? 'transparent' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(11,31,69,0.1)')}`,
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: k.accent ? '#C8973A' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? '#DC2626' : '#0B1F45') }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {([
            { key: 'toutes', label: 'Toutes' },
            { key: 'retard', label: '⚠ En retard' },
            { key: 'imminente', label: '⏰ Imminentes' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: filter === f.key ? '#0B1F45' : '#fff', color: filter === f.key ? '#fff' : '#4A5568', boxShadow: filter === f.key ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '56px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>Aucune facture impayée</p>
            <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Toutes vos factures sont à jour.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(f => {
              const jours = joursRetard(f.date_echeance)
              const badge = retardLabel(jours)
              const r = relances[f.id]
              return (
                <div key={f.id} style={{ background: '#fff', border: `1px solid ${jours > 30 ? 'rgba(220,38,38,0.2)' : 'rgba(11,31,69,0.1)'}`, borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Invoice row */}
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0B1F45', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                      {f.client_nom.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45' }}>{f.client_nom}</div>
                      <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px' }}>
                        {f.numero_facture ? `N° ${f.numero_facture} · ` : ''}
                        Émise le {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                        {f.date_echeance ? ` · Échéance ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}` : ''}
                      </div>
                    </div>
                    {/* Amount */}
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45' }}>{fmt(Number(f.montant_ttc || 0))}</div>
                      <div style={{ fontSize: '11px', color: '#8A92A3' }}>TTC</div>
                    </div>
                    {/* Badge retard */}
                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => genererRelance(f)}
                        disabled={r?.loading}
                        style={{
                          background: 'linear-gradient(135deg, #C8973A, #e8b85a)',
                          color: '#fff', border: 'none', padding: '8px 16px',
                          borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                          cursor: r?.loading ? 'not-allowed' : 'pointer',
                          opacity: r?.loading ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        {r?.loading ? (
                          <>
                            <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                            Génération…
                          </>
                        ) : r?.objet ? '✨ Regénérer' : '✨ Générer relance IA'}
                      </button>
                      <button
                        onClick={() => marquerPayee(f.id)}
                        style={{ background: '#D1FAE5', color: '#059669', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        title="Marquer comme payée"
                      >
                        ✓ Payée
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {r?.error && r.error !== 'NO_CREDITS' && (
                    <div style={{ padding: '12px 24px', background: '#FEF2F2', borderTop: '1px solid rgba(220,38,38,0.15)', fontSize: '13px', color: '#DC2626' }}>
                      ⚠ Erreur : {r.error}
                    </div>
                  )}
                  {r?.error === 'NO_CREDITS' && (
                    <div style={{ padding: '16px 24px', background: '#FEF3C7', borderTop: '1px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '600' }}>
                        ⚡ Vous n'avez plus de crédits Relance IA
                      </span>
                      <a href="/abonnement" style={{ background: 'linear-gradient(135deg, #C8973A, #e8b85a)', color: '#fff', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                        Recharger mes crédits →
                      </a>
                    </div>
                  )}

                  {/* Generated email */}
                  {r?.objet && !r.loading && (
                    <div style={{ borderTop: '1px solid rgba(11,31,69,0.08)', background: '#FAFAF8' }}>
                      {/* Email header */}
                      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'linear-gradient(135deg, #C8973A, #e8b85a)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>IA</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0B1F45' }}>Email généré par Claude Opus</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => copier(f.id, r.objet, r.corps)}
                            style={{ background: r.copied ? '#D1FAE5' : '#fff', color: r.copied ? '#059669' : '#0B1F45', border: '1px solid rgba(11,31,69,0.15)', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            {r.copied ? '✓ Copié !' : '📋 Copier'}
                          </button>
                        </div>
                      </div>
                      {/* Objet */}
                      <div style={{ padding: '12px 24px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Objet</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#0B1F45', background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '8px', padding: '8px 12px' }}>{r.objet}</div>
                      </div>
                      {/* Corps */}
                      <div style={{ padding: '12px 24px 20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Corps du message</div>
                        <textarea
                          value={r.corps}
                          onChange={e => setRelances(rv => ({ ...rv, [f.id]: { ...rv[f.id], corps: e.target.value } }))}
                          rows={10}
                          style={{ width: '100%', fontSize: '13px', lineHeight: '1.7', color: '#1F2937', background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '8px', padding: '12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
