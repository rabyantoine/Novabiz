'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Nav from '@/components/Nav'
import { usePermissions } from '../../lib/usePermissions'

type Facture = {
  id: string
  client_nom: string
  montant_ht: number
  tva_montant: number | null
  montant_ttc: number | null
  date_emission: string
  statut: string
}

type Periode = 'mois_courant' | 'mois_precedent' | 'trimestre' | 'annee'

const PERIODES: { key: Periode; label: string }[] = [
  { key: 'mois_courant', label: 'Mois en cours' },
  { key: 'mois_precedent', label: 'Mois précédent' },
  { key: 'trimestre', label: 'Trimestre en cours' },
  { key: 'annee', label: 'Année en cours' },
]

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280' },
  envoyée: { bg: '#FEF3C7', color: '#D97706' },
  payée: { bg: '#D1FAE5', color: '#059669' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function getPeriodeDates(periode: Periode): { start: string; end: string; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (periode === 'mois_courant') {
    const start = new Date(y, m, 1).toISOString().split('T')[0]
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
    const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return { start, end, label }
  }
  if (periode === 'mois_precedent') {
    const d = new Date(y, m - 1, 1)
    const start = d.toISOString().split('T')[0]
    const end = new Date(y, m, 0).toISOString().split('T')[0]
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return { start, end, label }
  }
  if (periode === 'trimestre') {
    const q = Math.floor(m / 3)
    const start = new Date(y, q * 3, 1).toISOString().split('T')[0]
    const end = new Date(y, q * 3 + 3, 0).toISOString().split('T')[0]
    const label = `T${q + 1} ${y}`
    return { start, end, label }
  }
  // annee
  const start = `${y}-01-01`
  const end = `${y}-12-31`
  const label = String(y)
  return { start, end, label }
}

export default function Rapports() {
  const { loading: permLoading, isOwner, can } = usePermissions()
  const [user, setUser] = useState<any>(null)
  const [periode, setPeriode] = useState<Periode>('mois_courant')
  const [factures, setFactures] = useState<Facture[]>([])
  const [charges, setCharges] = useState<{ montant: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (user) loadData(user.id)
  }, [user, periode])

  const loadData = async (userId: string) => {
    setLoading(true)
    const { start, end } = getPeriodeDates(periode)
    const [{ data: facturesData }, { data: chargesData }] = await Promise.all([
      supabase
        .from('factures')
        .select('id, client_nom, montant_ht, tva_montant, montant_ttc, date_emission, statut')
        .eq('user_id', userId)
        .gte('date_emission', start)
        .lte('date_emission', end)
        .order('date_emission', { ascending: false }),
      supabase
        .from('charges')
        .select('montant')
        .eq('user_id', userId)
        .gte('date_charge', start)
        .lte('date_charge', end),
    ])
    setFactures(facturesData || [])
    setCharges(chargesData || [])
    setLoading(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const exportCSV = () => {
    const { label } = getPeriodeDates(periode)
    const headers = ['Date', 'Client', 'Montant HT (€)', 'TVA (€)', 'Montant TTC (€)', 'Statut']
    const rows = factures.map(f => [
      new Date(f.date_emission).toLocaleDateString('fr-FR'),
      f.client_nom,
      Number(f.montant_ht || 0).toFixed(2),
      Number(f.tva_montant || 0).toFixed(2),
      Number(f.montant_ttc || 0).toFixed(2),
      f.statut,
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `factures_${label.replace(/\s/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('✓ Export CSV téléchargé')
  }

  // KPIs
  const caHT = factures.reduce((s, f) => s + Number(f.montant_ht || 0), 0)
  const tvaCollectee = factures.reduce((s, f) => s + Number(f.tva_montant || 0), 0)
  const totalCharges = charges.reduce((s, c) => s + Number(c.montant || 0), 0)
  const margeNette = caHT - totalCharges
  const nbPayees = factures.filter(f => f.statut === 'payée').length

  const { label: periodeLabel } = getPeriodeDates(periode)

  if (!user || permLoading) return <div style={{ background: '#0B1F45', minHeight: '100vh' }} />

  if (!permLoading && !isOwner && !can('rapports')) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
        <Nav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🔒</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>
            Accès non autorisé
          </h2>
          <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, textAlign: 'center', maxWidth: '340px' }}>
            Vous n'avez pas accès à ce module. Contactez l'administrateur de votre espace NovaBiz.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ marginTop: '8px', background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <Nav />

      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Rapports</h1>
            <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
              Synthèse financière — <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#0B1F45' }}>{periodeLabel}</span>
            </p>
          </div>
          <button
            onClick={exportCSV}
            disabled={factures.length === 0}
            style={{
              background: factures.length === 0 ? '#E5E7EB' : '#0B1F45',
              color: factures.length === 0 ? '#9CA3AF' : '#C8973A',
              border: 'none', padding: '10px 22px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700', cursor: factures.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            📊 Exporter CSV
          </button>
        </div>

        {/* Sélecteur de période */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {PERIODES.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriode(p.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', border: 'none', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                background: periode === p.key ? '#0B1F45' : '#fff',
                color: periode === p.key ? '#C8973A' : '#4A5568',
                boxShadow: periode === p.key ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'CA HT', value: fmt(caHT), sub: `${factures.length} facture${factures.length !== 1 ? 's' : ''}`, accent: true },
                { label: 'TVA collectée', value: fmt(tvaCollectee), sub: 'À reverser', accent: false },
                { label: 'Charges', value: fmt(totalCharges), sub: 'Notes de frais', accent: false },
                { label: 'Marge nette', value: fmt(margeNette), sub: 'CA - Charges', accent: false },
                { label: 'Factures payées', value: String(nbPayees), sub: `sur ${factures.length} total`, accent: false },
              ].map((k, i) => (
                <div key={i} style={{
                  background: k.accent ? '#0B1F45' : '#fff',
                  border: `1px solid ${k.accent ? 'transparent' : 'rgba(11,31,69,0.1)'}`,
                  borderRadius: '16px', padding: '22px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: k.accent ? '#C8973A' : '#0B1F45' }}>{k.value}</div>
                  <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Tableau récapitulatif */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(11,31,69,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: 0 }}>
                  Détail des factures — <span style={{ textTransform: 'capitalize' }}>{periodeLabel}</span>
                </h2>
                <span style={{ fontSize: '12px', color: '#8A92A3' }}>{factures.length} facture{factures.length !== 1 ? 's' : ''}</span>
              </div>

              {factures.length === 0 ? (
                <div style={{ padding: '56px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>
                    Aucune facture sur cette période
                  </p>
                  <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Essayez de changer la période sélectionnée.</p>
                </div>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)', background: '#FAFAF8' }}>
                        {['Date', 'Client', 'Montant HT', 'TVA', 'Montant TTC', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {factures.map((f, i) => (
                        <tr key={f.id} style={{ borderBottom: i < factures.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
                          <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3', whiteSpace: 'nowrap' }}>
                            {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{f.client_nom}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: '#0B1F45' }}>
                              {Number(f.montant_ht || 0).toLocaleString('fr-FR')} €
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3' }}>
                            {Number(f.tva_montant || 0).toLocaleString('fr-FR')} €
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: '#C8973A' }}>
                              {Number(f.montant_ttc || 0).toLocaleString('fr-FR')} €
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                              background: STATUT_COLORS[f.statut]?.bg || '#F3F4F6',
                              color: STATUT_COLORS[f.statut]?.color || '#6B7280',
                            }}>
                              {f.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid rgba(11,31,69,0.1)', background: '#FAF8F4' }}>
                        <td colSpan={2} style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#0B1F45' }}>Total</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '800', color: '#0B1F45' }}>
                            {caHT.toLocaleString('fr-FR')} €
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3', fontWeight: '700' }}>
                          {tvaCollectee.toLocaleString('fr-FR')} €
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '800', color: '#C8973A' }}>
                            {factures.reduce((s, f) => s + Number(f.montant_ttc || 0), 0).toLocaleString('fr-FR')} €
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
