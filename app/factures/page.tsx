'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'
import Nav from '@/components/Nav'
import { usePermissions } from '../../lib/usePermissions'

type TypeFacture = 'standard' | 'acompte' | 'solde'

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
  numero_facture?: string
  type_facture: TypeFacture
  pourcentage_acompte: number | null
  acompte_id: string | null
}

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280' },
  envoyée:   { bg: '#FEF3C7', color: '#D97706' },
  payée:     { bg: '#D1FAE5', color: '#059669' },
}

const TYPE_BADGE: Record<TypeFacture, { bg: string; color: string; label: string }> = {
  standard: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Standard' },
  acompte:  { bg: '#FFF7ED', color: '#C2410C', label: 'Acompte' },
  solde:    { bg: '#F0FDF4', color: '#15803D', label: 'Solde' },
}

export default function Factures() {
  const { loading: permLoading, isOwner, can } = usePermissions()
  const [user, setUser] = useState<any>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [showForm, setShowForm] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signaturesSignees, setSignaturesSignees] = useState<Set<string>>(new Set())
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  // ── Mode sélection multiple ──────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [multiPaymentLoading, setMultiPaymentLoading] = useState(false)

  const [form, setForm] = useState({
    client_nom: '',
    montant_ht: '',
    taux_tva: '20',
    description: '',
    date_echeance: '',
    statut: 'brouillon',
    type_facture: 'standard' as TypeFacture,
    pourcentage_acompte: '30',
    acompte_id: '',
  })

  const montantSoldeCalcule = (() => {
    if (form.type_facture !== 'solde' || !form.acompte_id) return null
    const fa = factures.find(f => f.id === form.acompte_id)
    if (!fa || !fa.pourcentage_acompte) return null
    const totalHT = Number(fa.montant_ht) / (Number(fa.pourcentage_acompte) / 100)
    return totalHT - Number(fa.montant_ht)
  })()

  const montantAcompteCalcule = (() => {
    if (form.type_facture !== 'acompte' || !form.montant_ht || !form.pourcentage_acompte) return null
    return parseFloat(form.montant_ht) * (parseFloat(form.pourcentage_acompte) / 100)
  })()

  // Totaux de la sélection
  const totalSelection = [...selectedIds].reduce((sum, id) => {
    const f = factures.find(x => x.id === id)
    return sum + Number(f?.montant_ttc || f?.montant_ht || 0)
  }, 0)

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

  const fetchFactures = async (userId: string) => {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setFactures(data)
  }

  const resetForm = () => setForm({
    client_nom: '', montant_ht: '', taux_tva: '20', description: '',
    date_echeance: '', statut: 'brouillon', type_facture: 'standard',
    pourcentage_acompte: '30', acompte_id: '',
  })

  // ── Paiement simple ──────────────────────────────────────────────────────
  const creerLienPaiement = async (facture: Facture) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setPaymentLoading(facture.id)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facture_id: facture.id,
          montant: facture.montant_ttc,
          user_id: session.user.id,
          client_nom: facture.client_nom,
          numero_facture: facture.numero_facture,
        }),
      })
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      alert('Erreur lors de la création du lien de paiement')
    } finally {
      setPaymentLoading(null)
    }
  }

  // ── Paiement multi-factures ──────────────────────────────────────────────
  const creerLienPaiementMultiple = async () => {
    if (selectedIds.size < 2) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setMultiPaymentLoading(true)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facture_ids: [...selectedIds],
          user_id: session.user.id,
        }),
      })
      const { url } = await res.json()
      if (url) {
        window.open(url, '_blank')
        showToast(`💳 Lien de paiement généré pour ${selectedIds.size} factures — ${totalSelection.toLocaleString('fr-FR')} € TTC`)
        setSelectionMode(false)
        setSelectedIds(new Set())
      } else {
        alert('Erreur lors de la création du lien multi-paiement')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setMultiPaymentLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    const eligibles = factures.filter(f => f.statut !== 'payée').map(f => f.id)
    setSelectedIds(new Set(eligibles))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const type = form.type_facture

    if (!form.client_nom && type !== 'solde') { setError('Le nom du client est requis.'); return }
    if ((type === 'standard' || type === 'acompte') && !form.montant_ht) { setError('Le montant HT est requis.'); return }
    if (type === 'acompte') {
      const pct = parseFloat(form.pourcentage_acompte)
      if (!pct || pct <= 0 || pct >= 100) { setError('Le pourcentage doit être entre 1 et 99%.'); return }
    }
    if (type === 'solde') {
      if (!form.acompte_id) { setError('Sélectionnez la facture d\'acompte liée.'); return }
      if (!montantSoldeCalcule || montantSoldeCalcule <= 0) { setError('Montant de solde invalide.'); return }
    }

    setLoading(true)
    const htFinal = type === 'solde' ? montantSoldeCalcule! : parseFloat(form.montant_ht)
    const tva = parseFloat(form.taux_tva) || 0
    const clientFinal = type === 'solde'
      ? (factures.find(f => f.id === form.acompte_id)?.client_nom || form.client_nom)
      : form.client_nom

    const { error: err } = await supabase.from('factures').insert({
      user_id: user.id,
      client_nom: clientFinal,
      montant_ht: htFinal,
      tva,
      tva_montant: htFinal * (tva / 100),
      montant_ttc: htFinal * (1 + tva / 100),
      description: form.description,
      date_echeance: form.date_echeance || null,
      statut: form.statut,
      type_facture: type,
      pourcentage_acompte: type === 'acompte' ? parseFloat(form.pourcentage_acompte) : null,
      acompte_id: type === 'solde' ? form.acompte_id : null,
    })

    setLoading(false)
    if (err) { setError(err.message); return }

    resetForm()
    setShowForm(false)
    fetchFactures(user.id)
    showToast(type === 'acompte' ? '✅ Facture d\'acompte créée !' : type === 'solde' ? '✅ Facture de solde créée !' : '✅ Facture créée !')
  }

  const handleStatutChange = async (id: string, statut: string) => {
    await supabase.from('factures').update({ statut }).eq('id', id)
    fetchFactures(user.id)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('factures').delete().eq('id', id)
    setFactures(f => f.filter(x => x.id !== id))
  }

  const downloadFacturX = async (factureId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/facturx/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ factureId }),
    })
    if (!res.ok) { alert('Erreur Factur-X'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `facture-facturx.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  const facturesAcompteDisponibles = factures.filter(f => {
    if (f.type_facture !== 'acompte') return false
    return !factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id)
  })

  const totalPayé   = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + Number(f.montant_ht || 0), 0)
  const totalImpayé = factures.filter(f => f.statut === 'envoyée').reduce((s, f) => s + Number(f.montant_ht || 0), 0)

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' }

  const renderChampsTypeSpecifiques = () => {
    if (form.type_facture === 'acompte') return (
      <>
        <div>
          <label style={labelStyle}>Montant total HT de la commande (€) *</label>
          <input type="number" placeholder="Montant total" min="0" step="0.01" value={form.montant_ht}
            onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))} style={inputStyle} />
          <p style={{ fontSize: '12px', color: '#8A92A3', margin: '4px 0 0' }}>Sur lequel l'acompte sera calculé</p>
        </div>
        <div>
          <label style={labelStyle}>Pourcentage d'acompte *</label>
          <div style={{ position: 'relative' }}>
            <input type="number" placeholder="30" min="1" max="99" step="1" value={form.pourcentage_acompte}
              onChange={e => setForm(f => ({ ...f, pourcentage_acompte: e.target.value }))}
              style={{ ...inputStyle, paddingRight: '40px' }} />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A92A3', fontSize: '14px', fontWeight: '600' }}>%</span>
          </div>
          {montantAcompteCalcule !== null && (
            <div style={{ marginTop: '8px', background: '#FFF7ED', border: '1px solid rgba(194,65,12,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#C2410C', fontWeight: '600' }}>
              → {montantAcompteCalcule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT facturé
              {form.taux_tva !== '0' && <span style={{ color: '#9A3412', fontWeight: '400' }}> / {(montantAcompteCalcule * (1 + parseFloat(form.taux_tva) / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC</span>}
            </div>
          )}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8A92A3' }}>Raccourcis :</span>
            {['20', '30', '40', '50'].map(pct => (
              <button key={pct} type="button" onClick={() => setForm(f => ({ ...f, pourcentage_acompte: pct }))}
                style={{ background: form.pourcentage_acompte === pct ? '#C2410C' : 'transparent', color: form.pourcentage_acompte === pct ? '#fff' : '#C2410C', border: '1px solid rgba(194,65,12,0.4)', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </>
    )

    if (form.type_facture === 'solde') return (
      <>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Facture d'acompte liée *</label>
          {facturesAcompteDisponibles.length === 0 ? (
            <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#854D0E' }}>
              ⚠️ Aucune facture d'acompte disponible sans solde.
            </div>
          ) : (
            <select value={form.acompte_id} onChange={e => setForm(f => ({ ...f, acompte_id: e.target.value }))} style={inputStyle}>
              <option value="">— Sélectionner —</option>
              {facturesAcompteDisponibles.map(fa => (
                <option key={fa.id} value={fa.id}>
                  {fa.numero_facture ? `${fa.numero_facture} – ` : ''}{fa.client_nom} — {fa.pourcentage_acompte}% de {(Number(fa.montant_ht) / (Number(fa.pourcentage_acompte) / 100)).toLocaleString('fr-FR')} € HT
                </option>
              ))}
            </select>
          )}
        </div>
        {form.acompte_id && montantSoldeCalcule !== null && (() => {
          const fa = factures.find(f => f.id === form.acompte_id)!
          const totalHT = Number(fa.montant_ht) / (Number(fa.pourcentage_acompte) / 100)
          const tva = parseFloat(form.taux_tva) || 0
          return (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.2)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#15803D', marginBottom: '8px' }}>📊 Récapitulatif</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Total HT', val: `${totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
                    { label: 'Acompte déduit', val: `− ${Number(fa.montant_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` },
                    { label: 'Solde HT', val: `${montantSoldeCalcule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, highlight: true },
                  ].map(({ label, val, highlight }) => (
                    <div key={label}>
                      <div style={{ color: '#8A92A3', fontSize: '11px', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontWeight: '700', color: highlight ? '#15803D' : '#0B1F45', fontSize: highlight ? '15px' : '14px' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {tva > 0 && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(21,128,61,0.15)', color: '#15803D', fontWeight: '600' }}>
                  TTC : {(montantSoldeCalcule * (1 + tva / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </div>}
              </div>
            </div>
          )
        })()}
        {form.acompte_id && (
          <div>
            <label style={labelStyle}>Client</label>
            <input type="text" value={factures.find(f => f.id === form.acompte_id)?.client_nom || ''} readOnly
              style={{ ...inputStyle, background: '#F9FAFB', color: '#8A92A3' }} />
          </div>
        )}
      </>
    )

    return (
      <div>
        <label style={labelStyle}>Montant HT (€) *</label>
        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.montant_ht}
          onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))} style={inputStyle} />
      </div>
    )
  }

  if (dataLoading || permLoading) return <SkeletonLoader rows={6} stats={3} cols={[28, 18, 14, 14, 12, 10]} />

  if (!permLoading && !isOwner && !can('factures')) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
        <Nav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🔒</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>Accès non autorisé</h2>
          <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, textAlign: 'center', maxWidth: '340px' }}>
            Vous n'avez pas accès à ce module. Contactez l'administrateur de votre espace NovaBiz.
          </p>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{ marginTop: '8px', background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Barre de sélection multiple flottante */}
      {selectionMode && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0B1F45', borderRadius: '16px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 200, boxShadow: '0 8px 32px rgba(11,31,69,0.3)', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#C8973A', fontWeight: '700', fontSize: '14px' }}>
            {selectedIds.size} facture{selectedIds.size !== 1 ? 's' : ''} sélectionnée{selectedIds.size !== 1 ? 's' : ''}
          </span>
          {selectedIds.size > 0 && (
            <span style={{ color: '#fff', fontSize: '13px' }}>
              {totalSelection.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC
            </span>
          )}
          <button onClick={selectAll}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
            Tout sélectionner
          </button>
          <button
            onClick={creerLienPaiementMultiple}
            disabled={selectedIds.size < 2 || multiPaymentLoading}
            style={{ background: selectedIds.size >= 2 ? '#C8973A' : 'rgba(200,151,58,0.3)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '700', cursor: selectedIds.size >= 2 ? 'pointer' : 'not-allowed', opacity: multiPaymentLoading ? 0.7 : 1 }}>
            {multiPaymentLoading ? '⏳ Génération...' : `💳 Payer la sélection${selectedIds.size >= 2 ? ` (${selectedIds.size})` : ''}`}
          </button>
          <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()) }}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>
            ✕
          </button>
        </div>
      )}

      <Nav />

      <div style={{ padding: '40px 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Factures</h1>
            <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>{factures.length} facture{factures.length !== 1 ? 's' : ''} au total</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()) }}
              style={{ background: selectionMode ? '#0B1F45' : 'transparent', color: selectionMode ? '#C8973A' : '#0B1F45', border: '1px solid rgba(11,31,69,0.25)', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {selectionMode ? '✕ Annuler sélection' : '☑ Multi-paiement'}
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setError(''); if (showForm) resetForm() }}
              style={{ background: '#0B1F45', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {showForm ? '✕ Annuler' : '+ Nouvelle facture'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total encaissé', val: `${totalPayé.toLocaleString('fr-FR')} €`, sub: `${factures.filter(f => f.statut === 'payée').length} payée(s)` },
            { label: 'En attente', val: `${totalImpayé.toLocaleString('fr-FR')} €`, sub: `${factures.filter(f => f.statut === 'envoyée').length} envoyée(s)` },
            { label: 'Brouillons', val: `${factures.filter(f => f.statut === 'brouillon').length}`, sub: 'À finaliser' },
            { label: 'Acomptes', val: `${factures.filter(f => f.type_facture === 'acompte').length}`, sub: `${factures.filter(f => f.type_facture === 'solde').length} solde(s)` },
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

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              {(['standard', 'acompte', 'solde'] as TypeFacture[]).map(type => {
                const badge = TYPE_BADGE[type]
                const isActive = form.type_facture === type
                return (
                  <button key={type} type="button"
                    onClick={() => setForm(f => ({ ...f, type_facture: type, acompte_id: '', montant_ht: '', client_nom: '' }))}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: isActive ? `2px solid ${badge.color}` : '2px solid rgba(11,31,69,0.12)', background: isActive ? badge.bg : '#fff', color: isActive ? badge.color : '#8A92A3', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {type === 'standard' ? '📄 ' : type === 'acompte' ? '🔶 ' : '✅ '}{badge.label}
                  </button>
                )
              })}
            </div>

            {form.type_facture === 'acompte' && (
              <div style={{ background: '#FFF7ED', border: '1px solid rgba(194,65,12,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#9A3412' }}>
                💡 <strong>Acompte :</strong> Facturez un % du total. La facture de solde sera créée séparément.
              </div>
            )}
            {form.type_facture === 'solde' && (
              <div style={{ background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#15803D' }}>
                💡 <strong>Solde :</strong> Le montant restant est calculé automatiquement depuis la facture d'acompte.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {form.type_facture !== 'solde' && (
                  <div>
                    <label style={labelStyle}>Client *</label>
                    <input type="text" placeholder="Nom du client" value={form.client_nom}
                      onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} style={inputStyle} />
                  </div>
                )}
                {renderChampsTypeSpecifiques()}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    placeholder={form.type_facture === 'acompte' ? 'Acompte sur commande…' : form.type_facture === 'solde' ? 'Solde de la commande…' : 'Détail des prestations…'}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>TVA (%)</label>
                  <select value={form.taux_tva} onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))} style={inputStyle}>
                    <option value="0">0% (exonéré)</option>
                    <option value="5.5">5,5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date d'échéance</label>
                  <input type="date" value={form.date_echeance} onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={inputStyle}>
                    <option value="brouillon">Brouillon</option>
                    <option value="envoyée">Envoyée</option>
                    <option value="payée">Payée</option>
                  </select>
                </div>
              </div>
              {error && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={loading || (form.type_facture === 'solde' && facturesAcompteDisponibles.length === 0)}
                  style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Enregistrement...' : form.type_facture === 'acompte' ? '🔶 Créer l\'acompte' : form.type_facture === 'solde' ? '✅ Créer le solde' : '📄 Créer la facture'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); resetForm() }}
                  style={{ background: 'transparent', border: '1px solid rgba(11,31,69,0.2)', color: '#0B1F45', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {factures.length === 0 ? (
            <div style={{ margin: '16px', borderRadius: '14px', background: 'rgba(11,31,69,0.02)', border: '2px dashed rgba(11,31,69,0.1)', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(200,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#C8973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="10" y="6" width="28" height="36" rx="3"/><line x1="16" y1="17" x2="32" y2="17"/><line x1="16" y1="24" x2="32" y2="24"/><line x1="16" y1="31" x2="24" y2="31"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 8px' }}>Aucune facture pour l'instant</p>
                <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, maxWidth: '320px', lineHeight: '1.5' }}>Créez votre première facture et commencez à suivre votre chiffre d'affaires.</p>
              </div>
              <button onClick={() => { setShowForm(true); setError('') }}
                style={{ marginTop: '8px', background: '#C8973A', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + Créer ma première facture
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                  {selectionMode && <th style={{ padding: '14px 16px', width: '40px' }} />}
                  {['Client', 'Type', 'Montant', 'Échéance', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f, i) => {
                  const type = f.type_facture || 'standard'
                  const badge = TYPE_BADGE[type as TypeFacture] || TYPE_BADGE.standard
                  const isSelected = selectedIds.has(f.id)
                  const acompteRef = type === 'solde' && f.acompte_id ? factures.find(fa => fa.id === f.acompte_id) : null

                  return (
                    <tr key={f.id}
                      onClick={() => selectionMode && f.statut !== 'payée' && toggleSelection(f.id)}
                      style={{
                        borderBottom: i < factures.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none',
                        background: isSelected ? 'rgba(200,151,58,0.06)' : 'transparent',
                        cursor: selectionMode && f.statut !== 'payée' ? 'pointer' : 'default',
                        transition: 'background 0.1s',
                      }}>

                      {/* Checkbox */}
                      {selectionMode && (
                        <td style={{ padding: '16px 8px 16px 16px' }}>
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isSelected ? '#C8973A' : 'rgba(11,31,69,0.2)'}`,
                            background: isSelected ? '#C8973A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: f.statut === 'payée' ? 0.3 : 1,
                          }}>
                            {isSelected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}>✓</span>}
                          </div>
                        </td>
                      )}

                      {/* Client */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{f.client_nom}</div>
                        {f.description && <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</div>}
                        {acompteRef && <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>↳ {acompteRef.numero_facture || 'Acompte lié'}</div>}
                      </td>

                      {/* Type */}
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {type === 'acompte' ? `🔶 Acompte ${f.pourcentage_acompte ? f.pourcentage_acompte + '%' : ''}` : type === 'solde' ? '✅ Solde' : '📄 Standard'}
                        </span>
                      </td>

                      {/* Montant */}
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45' }}>{Number(f.montant_ht).toLocaleString('fr-FR')} € HT</span>
                        {f.montant_ttc && <div style={{ fontSize: '11px', color: '#8A92A3' }}>{Number(f.montant_ttc).toLocaleString('fr-FR')} € TTC</div>}
                      </td>

                      {/* Échéance */}
                      <td style={{ padding: '16px 16px', fontSize: '13px', color: '#8A92A3' }}>
                        {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '16px 16px' }}>
                        <select value={f.statut} onChange={e => { e.stopPropagation(); handleStatutChange(f.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: STATUT_COLORS[f.statut]?.bg || '#F3F4F6', color: STATUT_COLORS[f.statut]?.color || '#6B7280' }}>
                          <option value="brouillon">Brouillon</option>
                          <option value="envoyée">Envoyée</option>
                          <option value="payée">Payée</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {signaturesSignees.has(f.id) && (
                            <span style={{ background: '#D1FAE5', color: '#059669', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>✅ Signé</span>
                          )}
                          {type === 'acompte' && !factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id) && (
                            <button onClick={() => { setForm(p => ({ ...p, type_facture: 'solde', acompte_id: f.id, client_nom: f.client_nom, taux_tva: String(f.tva_montant && f.montant_ht ? Math.round((Number(f.tva_montant) / Number(f.montant_ht)) * 100) : 20) })); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                              style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid rgba(21,128,61,0.3)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                              ✅ Créer solde
                            </button>
                          )}
                          {type === 'acompte' && factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id) && (
                            <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '600' }}>Soldée ✓</span>
                          )}
                          <button onClick={() => envoyerPourSignature(f.id)}
                            style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            ✉️ Signature
                          </button>
                          <button onClick={() => creerLienPaiement(f)} disabled={paymentLoading === f.id}
                            style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: paymentLoading === f.id ? 'not-allowed' : 'pointer', opacity: paymentLoading === f.id ? 0.7 : 1 }}>
                            {paymentLoading === f.id ? '⏳' : '💳 Paiement'}
                          </button>
                          <button onClick={() => downloadFacturX(f.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(200,151,58,0.4)', color: '#C8973A', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            📎 Factur-X
                          </button>
                          <button onClick={() => handleDelete(f.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}