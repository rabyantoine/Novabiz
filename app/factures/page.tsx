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
  envoyée: { bg: '#FEF3C7', color: '#D97706' },
  payée: { bg: '#D1FAE5', color: '#059669' },
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

  // Montant calculé automatiquement pour les factures de solde
  const montantSoldeCalcule = (() => {
    if (form.type_facture !== 'solde' || !form.acompte_id) return null
    const factureAcompte = factures.find(f => f.id === form.acompte_id)
    if (!factureAcompte) return null
    const totalHT = Number(factureAcompte.montant_ht) / (Number(factureAcompte.pourcentage_acompte || 0) / 100)
    const acompteHT = Number(factureAcompte.montant_ht)
    return totalHT - acompteHT
  })()

  // Montant calculé automatiquement pour les factures d'acompte
  const montantAcompteCalcule = (() => {
    if (form.type_facture !== 'acompte' || !form.montant_ht || !form.pourcentage_acompte) return null
    return parseFloat(form.montant_ht) * (parseFloat(form.pourcentage_acompte) / 100)
  })()

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

  const resetForm = () => {
    setForm({
      client_nom: '',
      montant_ht: '',
      taux_tva: '20',
      description: '',
      date_echeance: '',
      statut: 'brouillon',
      type_facture: 'standard',
      pourcentage_acompte: '30',
      acompte_id: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const type = form.type_facture

    // Validations spécifiques
    if (!form.client_nom) { setError('Le nom du client est requis.'); return }

    if (type === 'standard' || type === 'acompte') {
      if (!form.montant_ht) { setError('Le montant HT est requis.'); return }
    }

    if (type === 'acompte') {
      if (!form.pourcentage_acompte || parseFloat(form.pourcentage_acompte) <= 0 || parseFloat(form.pourcentage_acompte) >= 100) {
        setError('Le pourcentage d\'acompte doit être entre 1 et 99%.'); return
      }
    }

    if (type === 'solde') {
      if (!form.acompte_id) { setError('Veuillez sélectionner la facture d\'acompte liée.'); return }
      if (montantSoldeCalcule === null || montantSoldeCalcule <= 0) { setError('Impossible de calculer le montant du solde. Vérifiez la facture d\'acompte.'); return }
    }

    setLoading(true)

    // Calcul du montant HT final
    let htFinal: number
    if (type === 'solde') {
      htFinal = montantSoldeCalcule!
    } else {
      htFinal = parseFloat(form.montant_ht)
    }

    const tva = parseFloat(form.taux_tva) || 0

    const payload: any = {
      user_id: user.id,
      client_nom: form.client_nom,
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
    }

    const { error: err } = await supabase.from('factures').insert(payload)
    setLoading(false)
    if (err) { setError(err.message); return }

    resetForm()
    setShowForm(false)
    fetchFactures(user.id)
    showToast(
      type === 'acompte' ? '✅ Facture d\'acompte créée !' :
      type === 'solde'   ? '✅ Facture de solde créée !' :
                           '✅ Facture créée !'
    )
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ factureId }),
    })

    if (!res.ok) { alert('Erreur lors de la génération Factur-X'); return }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-facturx.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Factures d'acompte non soldées (pour le sélecteur de solde)
  const facturesAcompteDisponibles = factures.filter(f => {
    if (f.type_facture !== 'acompte') return false
    // Exclure celles qui ont déjà une facture de solde liée
    const dejaSoldee = factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id)
    return !dejaSoldee
  })

  const totalPayé = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)
  const totalImpayé = factures.filter(f => f.statut === 'envoyée').reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)

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

  // ─── Champs conditionnels du formulaire selon le type ───────────────────────
  const renderChampsTypeSpecifiques = () => {
    if (form.type_facture === 'acompte') {
      return (
        <>
          {/* Montant de base (total de la commande) */}
          <div>
            <label style={labelStyle}>Montant total HT de la commande (€) *</label>
            <input
              type="number"
              placeholder="Montant total de la commande"
              min="0"
              step="0.01"
              value={form.montant_ht}
              onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: '#8A92A3', margin: '4px 0 0' }}>
              Montant total de la commande sur lequel l'acompte sera calculé
            </p>
          </div>

          {/* Pourcentage d'acompte */}
          <div>
            <label style={labelStyle}>Pourcentage d'acompte *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                placeholder="30"
                min="1"
                max="99"
                step="1"
                value={form.pourcentage_acompte}
                onChange={e => setForm(f => ({ ...f, pourcentage_acompte: e.target.value }))}
                style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A92A3', fontSize: '14px', fontWeight: '600' }}>%</span>
            </div>
            {montantAcompteCalcule !== null && (
              <div style={{ marginTop: '8px', background: '#FFF7ED', border: '1px solid rgba(194,65,12,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#C2410C', fontWeight: '600' }}>
                → Montant facturé : <strong>{montantAcompteCalcule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT</strong>
                {form.taux_tva !== '0' && (
                  <span style={{ color: '#9A3412', fontWeight: '400' }}>
                    {' '}/ {(montantAcompteCalcule * (1 + parseFloat(form.taux_tva) / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Raccourcis % */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8A92A3' }}>Raccourcis :</span>
              {['20', '30', '40', '50'].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pourcentage_acompte: pct }))}
                  style={{
                    background: form.pourcentage_acompte === pct ? '#C2410C' : 'transparent',
                    color: form.pourcentage_acompte === pct ? '#fff' : '#C2410C',
                    border: '1px solid rgba(194,65,12,0.4)',
                    borderRadius: '20px',
                    padding: '3px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </>
      )
    }

    if (form.type_facture === 'solde') {
      return (
        <>
          {/* Sélection de la facture d'acompte */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Facture d'acompte liée *</label>
            {facturesAcompteDisponibles.length === 0 ? (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#854D0E' }}>
                ⚠️ Aucune facture d'acompte disponible sans solde. Créez d'abord une facture d'acompte.
              </div>
            ) : (
              <select
                value={form.acompte_id}
                onChange={e => setForm(f => ({ ...f, acompte_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— Sélectionner une facture d'acompte —</option>
                {facturesAcompteDisponibles.map(fa => (
                  <option key={fa.id} value={fa.id}>
                    {fa.numero_facture ? `${fa.numero_facture} – ` : ''}{fa.client_nom} — {Number(fa.pourcentage_acompte)}% de {(Number(fa.montant_ht) / (Number(fa.pourcentage_acompte) / 100)).toLocaleString('fr-FR')} € HT
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Récapitulatif calculé */}
          {form.acompte_id && montantSoldeCalcule !== null && (
            <div style={{ gridColumn: '1 / -1' }}>
              {(() => {
                const fa = factures.find(f => f.id === form.acompte_id)!
                const totalHT = Number(fa.montant_ht) / (Number(fa.pourcentage_acompte) / 100)
                const acompteHT = Number(fa.montant_ht)
                const soldeHT = totalHT - acompteHT
                const tva = parseFloat(form.taux_tva) || 0
                return (
                  <div style={{ background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.2)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px' }}>
                    <div style={{ fontWeight: '700', color: '#15803D', marginBottom: '8px' }}>📊 Récapitulatif de la commande</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ color: '#8A92A3', fontSize: '11px', marginBottom: '2px' }}>Total commande HT</div>
                        <div style={{ fontWeight: '700', color: '#0B1F45' }}>{totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                      </div>
                      <div>
                        <div style={{ color: '#8A92A3', fontSize: '11px', marginBottom: '2px' }}>Acompte déjà facturé</div>
                        <div style={{ fontWeight: '700', color: '#C2410C' }}>− {acompteHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                      </div>
                      <div>
                        <div style={{ color: '#8A92A3', fontSize: '11px', marginBottom: '2px' }}>Solde à facturer HT</div>
                        <div style={{ fontWeight: '700', color: '#15803D', fontSize: '15px' }}>{soldeHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                      </div>
                    </div>
                    {tva > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(21,128,61,0.15)', color: '#15803D', fontWeight: '600' }}>
                        Montant TTC : {(soldeHT * (1 + tva / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Client auto-rempli depuis l'acompte */}
          {form.acompte_id && (
            <div>
              <label style={labelStyle}>Client</label>
              <input
                type="text"
                value={factures.find(f => f.id === form.acompte_id)?.client_nom || form.client_nom}
                readOnly
                style={{ ...inputStyle, background: '#F9FAFB', color: '#8A92A3' }}
              />
            </div>
          )}
        </>
      )
    }

    // Standard
    return (
      <>
        <div>
          <label style={labelStyle}>Montant HT (€) *</label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.montant_ht}
            onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </>
    )
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px'
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff'
  }

  // ─── Libellé type pour la liste ─────────────────────────────────────────────
  const getFactureAcompteRef = (f: Facture) => {
    if (f.type_facture !== 'solde' || !f.acompte_id) return null
    return factures.find(fa => fa.id === f.acompte_id)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
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
          <button
            onClick={() => { setShowForm(!showForm); setError(''); if (showForm) resetForm() }}
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

            {/* Sélecteur de type */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              {(['standard', 'acompte', 'solde'] as TypeFacture[]).map(type => {
                const badge = TYPE_BADGE[type]
                const isActive = form.type_facture === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type_facture: type, acompte_id: '', montant_ht: '', client_nom: '' }))}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: isActive ? `2px solid ${badge.color}` : '2px solid rgba(11,31,69,0.12)',
                      background: isActive ? badge.bg : '#fff',
                      color: isActive ? badge.color : '#8A92A3',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type === 'standard' && '📄 '}
                    {type === 'acompte' && '🔶 '}
                    {type === 'solde' && '✅ '}
                    {badge.label}
                  </button>
                )
              })}
            </div>

            {/* Explication contextuelle */}
            {form.type_facture === 'acompte' && (
              <div style={{ background: '#FFF7ED', border: '1px solid rgba(194,65,12,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#9A3412' }}>
                💡 <strong>Facture d'acompte :</strong> Facturez un pourcentage du total de la commande. La facture de solde sera créée séparément pour le reste.
              </div>
            )}
            {form.type_facture === 'solde' && (
              <div style={{ background: '#F0FDF4', border: '1px solid rgba(21,128,61,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#15803D' }}>
                💡 <strong>Facture de solde :</strong> Le montant restant dû est calculé automatiquement depuis la facture d'acompte sélectionnée.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Client — affiché pour standard et acompte, auto pour solde */}
                {form.type_facture !== 'solde' && (
                  <div>
                    <label style={labelStyle}>Client *</label>
                    <input
                      type="text"
                      placeholder="Nom du client"
                      value={form.client_nom}
                      onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Champs spécifiques au type */}
                {renderChampsTypeSpecifiques()}

                {/* Description */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    placeholder={
                      form.type_facture === 'acompte' ? 'Acompte sur commande — ex : Développement site web phase 1…' :
                      form.type_facture === 'solde'   ? 'Solde de la commande — ex : Développement site web phase finale…' :
                      'Détail des prestations…'
                    }
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* TVA */}
                <div>
                  <label style={labelStyle}>TVA (%)</label>
                  <select
                    value={form.taux_tva}
                    onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="0">0% (exonéré)</option>
                    <option value="5.5">5,5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>

                {/* Date d'échéance */}
                <div>
                  <label style={labelStyle}>Date d'échéance</label>
                  <input
                    type="date"
                    value={form.date_echeance}
                    onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                {/* Statut */}
                <div>
                  <label style={labelStyle}>Statut</label>
                  <select
                    value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    style={inputStyle}
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
                  disabled={loading || (form.type_facture === 'solde' && facturesAcompteDisponibles.length === 0)}
                  style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enregistrement...' :
                   form.type_facture === 'acompte' ? '🔶 Créer la facture d\'acompte' :
                   form.type_facture === 'solde'   ? '✅ Créer la facture de solde' :
                   '📄 Créer la facture'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); resetForm() }}
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
                  {['Client', 'Type', 'Montant', 'Échéance', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f, i) => {
                  const type = f.type_facture || 'standard'
                  const badge = TYPE_BADGE[type as TypeFacture] || TYPE_BADGE.standard
                  const acompteRef = getFactureAcompteRef(f)
                  return (
                    <tr key={f.id} style={{ borderBottom: i < factures.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>

                      {/* Client */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{f.client_nom}</div>
                        {f.description && (
                          <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.description}
                          </div>
                        )}
                        {acompteRef && (
                          <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>
                            ↳ Acompte : {acompteRef.numero_facture || acompteRef.client_nom}
                          </div>
                        )}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {type === 'acompte' && `🔶 Acompte ${f.pourcentage_acompte ? f.pourcentage_acompte + '%' : ''}`}
                          {type === 'solde'   && '✅ Solde'}
                          {type === 'standard' && '📄 Standard'}
                        </span>
                      </td>

                      {/* Montant */}
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45' }}>
                          {Number(f.montant_ht).toLocaleString('fr-FR')} € HT
                        </span>
                        {f.montant_ttc && (
                          <div style={{ fontSize: '11px', color: '#8A92A3' }}>
                            {Number(f.montant_ttc).toLocaleString('fr-FR')} € TTC
                          </div>
                        )}
                      </td>

                      {/* Échéance */}
                      <td style={{ padding: '16px 16px', fontSize: '13px', color: '#8A92A3' }}>
                        {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '16px 16px' }}>
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

                      {/* Actions */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {signaturesSignees.has(f.id) && (
                            <span style={{ background: '#D1FAE5', color: '#059669', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                              ✅ Signé
                            </span>
                          )}

                          {/* Créer solde — uniquement sur les acomptes sans solde lié */}
                          {type === 'acompte' && !factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id) && (
                            <button
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  type_facture: 'solde',
                                  acompte_id: f.id,
                                  client_nom: f.client_nom,
                                  taux_tva: String(f.tva_montant && f.montant_ht ? Math.round((f.tva_montant / f.montant_ht) * 100) : 20),
                                }))
                                setShowForm(true)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid rgba(21,128,61,0.3)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              ✅ Créer solde
                            </button>
                          )}

                          {type === 'acompte' && factures.some(s => s.type_facture === 'solde' && s.acompte_id === f.id) && (
                            <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '600' }}>
                              Soldée ✓
                            </span>
                          )}

                          <button
                            onClick={() => envoyerPourSignature(f.id)}
                            style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            ✉️ Signature
                          </button>
                          <button
                            onClick={() => creerLienPaiement(f)}
                            disabled={paymentLoading === f.id}
                            style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: paymentLoading === f.id ? 'not-allowed' : 'pointer', opacity: paymentLoading === f.id ? 0.7 : 1 }}
                          >
                            {paymentLoading === f.id ? '⏳' : '💳 Paiement'}
                          </button>
                          <button
                            onClick={() => downloadFacturX(f.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(200,151,58,0.4)', color: '#C8973A', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                            title="Télécharger Factur-X (PDF/A-3 + XML EN 16931)"
                          >
                            📎 Factur-X
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                          >
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