'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'
import Nav from '@/components/Nav'

type Facture = {
  id: string
  client_nom: string
  montant_ht: number
  tva_montant: number | null
  montant_ttc: number | null
  description: string
  date_emission: string
  date_echeance: string
  statut: 'brouillon' | 'envoyée' | 'payée'
  created_at: string
}

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280' },
  envoyée: { bg: '#FEF3C7', color: '#D97706' },
  payée: { bg: '#D1FAE5', color: '#059669' },
}

export default function Factures() {
  const [user, setUser] = useState<any>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [showForm, setShowForm] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signaturesSignees, setSignaturesSignees] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_nom: '',
    montant_ht: '',
    taux_tva: '20',
    description: '',
    date_echeance: '',
    statut: 'brouillon',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await Promise.all([fetchFactures(user.id), loadSignatures(user.id)])
      setDataLoading(false)
    }
    init()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const loadSignatures = async (userId: string) => {
    const { data } = await supabase
      .from('signatures')
      .select('document_id')
      .eq('user_id', userId)
      .eq('document_type', 'facture')
      .eq('statut', 'signe')
    setSignaturesSignees(new Set((data || []).map((s: { document_id: string }) => s.document_id)))
  }

  const envoyerPourSignature = async (factureId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('signatures').insert({
      document_type: 'facture',
      document_id: factureId,
      user_id: session.user.id,
    })

    const { data } = await supabase
      .from('signatures')
      .select('token')
      .eq('document_id', factureId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data?.token) { showToast('Erreur : token non généré.'); return }

    const lien = `${window.location.origin}/signer/${data.token}`
    await navigator.clipboard.writeText(lien)
    showToast('✉️ Lien de signature copié ! Envoyez-le à votre client.')
  }

  const fetchFactures = async (userId: string) => {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setFactures(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_nom || !form.montant_ht) { setError('Client et montant requis.'); return }
    setLoading(true)
    setError('')
    const ht = parseFloat(form.montant_ht)
    const tva = parseFloat(form.taux_tva) || 0
    const { error: err } = await supabase.from('factures').insert({
      user_id: user.id,
      client_nom: form.client_nom,
      montant_ht: ht,
      tva,
      tva_montant: ht * (tva / 100),
      montant_ttc: ht * (1 + tva / 100),
      description: form.description,
      date_echeance: form.date_echeance || null,
      statut: form.statut,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setForm({ client_nom: '', montant_ht: '', taux_tva: '20', description: '', date_echeance: '', statut: 'brouillon' })
    setShowForm(false)
    fetchFactures(user.id)
  }

  const handleStatutChange = async (id: string, statut: string) => {
    await supabase.from('factures').update({ statut }).eq('id', id)
    fetchFactures(user.id)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('factures').delete().eq('id', id)
    setFactures(f => f.filter(x => x.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalPayé = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)
  const totalImpayé = factures.filter(f => f.statut === 'envoyée').reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)

  if (dataLoading) return <SkeletonLoader rows={6} stats={3} cols={[28, 18, 14, 14, 12, 10]} />

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
      <Nav />

      <div style={{ padding: '40px 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Factures</h1>
            <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>{factures.length} facture{factures.length !== 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            style={{ background: '#0B1F45', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            {showForm ? '✕ Annuler' : '+ Nouvelle facture'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total encaissé', val: `${totalPayé.toLocaleString('fr-FR')} €`, sub: `${factures.filter(f => f.statut === 'payée').length} facture(s) payée(s)` },
            { label: 'En attente', val: `${totalImpayé.toLocaleString('fr-FR')} €`, sub: `${factures.filter(f => f.statut === 'envoyée').length} facture(s) envoyée(s)` },
            { label: 'Brouillons', val: `${factures.filter(f => f.statut === 'brouillon').length}`, sub: 'À finaliser' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#8A92A3', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45' }}>{k.val}</div>
              <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '4px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        {showForm && (
          <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.12)', borderRadius: '16px', padding: '28px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 20px' }}>Nouvelle facture</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Client *</label>
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={form.client_nom}
                    onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Montant HT (€) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.montant_ht}
                    onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Description</label>
                  <textarea
                    placeholder="Détail des prestations..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>TVA (%)</label>
                  <select
                    value={form.taux_tva}
                    onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="0">0% (exonéré)</option>
                    <option value="5.5">5,5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Date d'échéance</label>
                  <input
                    type="date"
                    value={form.date_echeance}
                    onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Statut</label>
                  <select
                    value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="envoyée">Envoyée</option>
                    <option value="payée">Payée</option>
                  </select>
                </div>
              </div>
              {error && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enregistrement...' : 'Créer la facture'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  style={{ background: 'transparent', border: '1px solid rgba(11,31,69,0.2)', color: '#0B1F45', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des factures */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {factures.length === 0 ? (
            <div style={{ margin: '16px', borderRadius: '14px', background: 'rgba(11,31,69,0.02)', border: '2px dashed rgba(11,31,69,0.1)', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(200,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#C8973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="10" y="6" width="28" height="36" rx="3"/>
                  <line x1="16" y1="17" x2="32" y2="17"/>
                  <line x1="16" y1="24" x2="32" y2="24"/>
                  <line x1="16" y1="31" x2="24" y2="31"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 8px' }}>Aucune facture pour l'instant</p>
                <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, maxWidth: '320px', lineHeight: '1.5' }}>Créez votre première facture et commencez à suivre votre chiffre d'affaires.</p>
              </div>
              <button
                onClick={() => { setShowForm(true); setError('') }}
                style={{ marginTop: '8px', background: '#C8973A', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                + Créer ma première facture
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                  {['Client', 'Montant', 'Échéance', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < factures.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{f.client_nom}</div>
                      {f.description && <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45' }}>
                        {Number(f.montant_ht).toLocaleString('fr-FR')} € HT
                      </span>
                      {f.montant_ttc && (
                        <div style={{ fontSize: '11px', color: '#8A92A3' }}>{Number(f.montant_ttc).toLocaleString('fr-FR')} € TTC</div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#8A92A3' }}>
                      {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <select
                        value={f.statut}
                        onChange={e => handleStatutChange(f.id, e.target.value)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: STATUT_COLORS[f.statut]?.bg || '#F3F4F6',
                          color: STATUT_COLORS[f.statut]?.color || '#6B7280',
                        }}
                      >
                        <option value="brouillon">Brouillon</option>
                        <option value="envoyée">Envoyée</option>
                        <option value="payée">Payée</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {signaturesSignees.has(f.id) && (
                          <span style={{ background: '#D1FAE5', color: '#059669', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                            ✅ Signé
                          </span>
                        )}
                        <button
                          onClick={() => envoyerPourSignature(f.id)}
                          style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          ✉️ Signature
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
