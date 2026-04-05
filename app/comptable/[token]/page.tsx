'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type ComptableAcces = {
  id: string
  user_id: string
  nom_comptable: string
  email_comptable: string
  token: string
  actif: boolean
}

type Facture = {
  id: string
  numero_facture: string
  client_nom: string
  montant_ttc: number
  tva_montant: number
  statut: string
  date_echeance: string
}

type Frais = {
  id: string
  description: string
  montant: number
  categorie: string
  date: string
}

type Achat = {
  id: string
  fournisseur_nom: string
  numero_facture: string
  montant_ttc: number
  statut: string
  date_facture: string
}

const TABS = ['Factures', 'Frais', 'Achats', 'Résumé'] as const
type Tab = typeof TABS[number]

export default function ComptableTokenPage() {
  const { token } = useParams<{ token: string }>()
  const [acces, setAcces] = useState<ComptableAcces | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Factures')
  const [factures, setFactures] = useState<Facture[]>([])
  const [frais, setFrais] = useState<Frais[]>([])
  const [achats, setAchats] = useState<Achat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    async function init() {
      const { data, error } = await supabase
        .from('comptable_acces')
        .select('*')
        .eq('token', token)
        .eq('actif', true)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setAcces(data)

      await supabase
        .from('comptable_acces')
        .update({ derniere_visite: new Date().toISOString() })
        .eq('token', token)

      const [{ data: facturesData }, { data: fraisData }, { data: achatsData }] = await Promise.all([
        supabase.from('factures').select('*').eq('user_id', data.user_id).order('created_at', { ascending: false }),
        supabase.from('frais').select('*').eq('user_id', data.user_id).order('created_at', { ascending: false }),
        supabase.from('achats').select('*').eq('user_id', data.user_id).order('created_at', { ascending: false }),
      ])

      setFactures(facturesData || [])
      setFrais(fraisData || [])
      setAchats(achatsData || [])
      setLoading(false)
    }
    init()
  }, [token])

  function fmt(n: number | null | undefined) {
    return (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  function handleExportCSV() {
    const headers = ['numero_facture', 'client_nom', 'date_emission', 'date_echeance', 'montant_ht', 'tva', 'montant_ttc', 'statut']
    const rows = factures.map(f => [
      f.numero_facture ?? '',
      f.client_nom ?? '',
      (f as any).date_emission ?? '',
      f.date_echeance ?? '',
      (f as any).montant_ht ?? '',
      f.tva_montant ?? '',
      f.montant_ttc ?? '',
      f.statut ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'factures.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const payees = factures.filter(f => f.statut === 'payée' || f.statut === 'payee')
  const caTotal = payees.reduce((s, f) => s + (f.montant_ttc ?? 0), 0)
  const tvaTotal = payees.reduce((s, f) => s + (f.tva_montant ?? 0), 0)
  const fraisTotal = frais.reduce((s, f) => s + (f.montant ?? 0), 0)
  const achatsTotal = achats.reduce((s, a) => s + (a.montant_ttc ?? 0), 0)

  const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
    brouillon: { bg: '#F3F4F6', color: '#6B7280' },
    envoyée: { bg: '#FEF3C7', color: '#D97706' },
    payée: { bg: '#D1FAE5', color: '#059669' },
    payée_partielle: { bg: '#DBEAFE', color: '#2563EB' },
    en_attente: { bg: '#FEF3C7', color: '#D97706' },
    payee: { bg: '#D1FAE5', color: '#059669' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#0B1F45' }}>
      Chargement…
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#0B1F45' }}>
        <p style={{ fontSize: 20, fontWeight: 700 }}>Lien invalide ou désactivé.</p>
        <p style={{ fontSize: 14, opacity: 0.6 }}>Veuillez contacter votre client pour obtenir un nouveau lien.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'Georgia, serif' }}>
      <header style={{ background: '#0B1F45', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#C8973A', fontWeight: 700, fontSize: 20 }}>NovaBiz — Espace Comptable</span>
        <span style={{ color: '#fff', fontSize: 14, opacity: 0.85 }}>
          {acces?.nom_comptable}
        </span>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5DDD0', marginBottom: 28 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px', fontSize: 14, fontFamily: 'Georgia, serif',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#0B1F45' : '#9CA3AF',
                fontWeight: activeTab === tab ? 700 : 400,
                borderBottom: activeTab === tab ? '3px solid #C8973A' : '3px solid transparent',
                marginBottom: -2,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Factures */}
        {activeTab === 'Factures' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  {['N° Facture', 'Client', 'Montant TTC', 'Statut', 'Échéance'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#0B1F45', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 20, color: '#9CA3AF', textAlign: 'center' }}>Aucune facture</td></tr>
                ) : factures.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F0EBE1' }}>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{f.numero_facture || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{f.client_nom}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmt(f.montant_ttc)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                        ...(STATUT_COLORS[f.statut] ?? { bg: '#F3F4F6', color: '#6B7280' }),
                        background: (STATUT_COLORS[f.statut] ?? { bg: '#F3F4F6' }).bg,
                        color: (STATUT_COLORS[f.statut] ?? { color: '#6B7280' }).color,
                      }}>
                        {f.statut}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmtDate(f.date_echeance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Frais */}
        {activeTab === 'Frais' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  {['Description', 'Montant', 'Catégorie', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#0B1F45', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {frais.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 20, color: '#9CA3AF', textAlign: 'center' }}>Aucun frais</td></tr>
                ) : frais.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F0EBE1' }}>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{f.description}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmt(f.montant)}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{f.categorie || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmtDate(f.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Achats */}
        {activeTab === 'Achats' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  {['Fournisseur', 'N° Facture', 'Montant TTC', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#0B1F45', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {achats.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 20, color: '#9CA3AF', textAlign: 'center' }}>Aucun achat</td></tr>
                ) : achats.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #F0EBE1' }}>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{a.fournisseur_nom}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{a.numero_facture || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmt(a.montant_ttc)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                        background: (STATUT_COLORS[a.statut] ?? { bg: '#F3F4F6' }).bg,
                        color: (STATUT_COLORS[a.statut] ?? { color: '#6B7280' }).color,
                      }}>
                        {a.statut}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#0B1F45' }}>{fmtDate(a.date_facture)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Résumé */}
        {activeTab === 'Résumé' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'CA total (factures payées)', value: fmt(caTotal), color: '#059669' },
                { label: 'TVA collectée', value: fmt(tvaTotal), color: '#2563EB' },
                { label: 'Total frais', value: fmt(fraisTotal), color: '#DC2626' },
                { label: 'Total achats', value: fmt(achatsTotal), color: '#D97706' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #E5DDD0', borderRadius: 12, padding: 20 }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleExportCSV}
              style={{
                background: '#C8973A', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px 24px', fontSize: 14,
                fontFamily: 'Georgia, serif', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Exporter CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
