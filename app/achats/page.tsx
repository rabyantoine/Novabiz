'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import { usePermissions } from '../../lib/usePermissions'

type Achat = {
  id: string
  user_id: string
  fournisseur_nom: string
  numero_facture: string
  date_facture: string
  date_echeance: string
  montant_ht: number
  taux_tva: number
  montant_ttc: number
  categorie: string
  notes: string
  statut: 'a_payer' | 'payee' | 'en_retard'
  created_at: string
  date_paiement_programme: string | null
}

const CATEGORIES = ['Matières premières', 'Prestataire', 'Abonnement logiciel', 'Équipement', 'Transport', 'Autre']
const TVA_OPTIONS = [0, 5.5, 10, 20]

const STATUT_LABELS: Record<string, string> = {
  a_payer: 'À payer',
  payee: 'Payée',
  en_retard: 'En retard',
}

const STATUT_STYLES: Record<string, { bg: string; color: string }> = {
  a_payer: { bg: '#FFF3E0', color: '#E65100' },
  payee: { bg: '#E8F5E9', color: '#2E7D32' },
  en_retard: { bg: '#FFEBEE', color: '#C62828' },
}

const EMPTY_FORM = {
  fournisseur_nom: '',
  numero_facture: '',
  date_facture: '',
  date_echeance: '',
  date_paiement_programme: '',
  montant_ht: '',
  taux_tva: '20',
  categorie: '',
  notes: '',
  statut: 'a_payer',
}

export default function AchatsPage() {
  const router = useRouter()
  const { loading: permLoading, isOwner, can } = usePermissions()

  const [achats, setAchats] = useState<Achat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [filtreMois, setFiltreMois] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [doublons, setDoublons] = useState<any[]>([])
  const [showDoublonWarning, setShowDoublonWarning] = useState(false)
  const [pendingSave, setPendingSave] = useState<any>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    await autoUpdateRetard()
    await fetchAchats()
  }

  async function autoUpdateRetard() {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('achats')
      .update({ statut: 'en_retard' })
      .eq('statut', 'a_payer')
      .lt('date_echeance', today)
  }

  async function fetchAchats() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('achats')
      .select('*')
      .order('date_facture', { ascending: false })
    if (err) { setError('Erreur lors du chargement des achats.'); setLoading(false); return }
    setAchats(data || [])
    setLoading(false)
  }

  async function saveAchat() {
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const ht = parseFloat(form.montant_ht) || 0
    const tva = parseFloat(form.taux_tva) || 0
    const ttc = parseFloat((ht * (1 + tva / 100)).toFixed(2))

    const payload = {
      fournisseur_nom: form.fournisseur_nom,
      numero_facture: form.numero_facture,
      date_facture: form.date_facture,
      date_echeance: form.date_echeance,
      date_paiement_programme: form.date_paiement_programme || null,
      montant_ht: ht,
      taux_tva: tva,
      montant_ttc: ttc,
      categorie: form.categorie,
      notes: form.notes,
      statut: form.statut,
    }

    if (editingId) {
      const { error } = await supabase.from('achats').update(payload).eq('id', editingId)
      setSaving(false)
      if (error) { setError("Erreur lors de l'enregistrement."); return }
      closeModal(); fetchAchats()
      return
    }

    // Détection doublons uniquement pour un nouvel achat
    if (form.date_facture && form.fournisseur_nom) {
      const dateRef = new Date(form.date_facture)
      const dateMinus30 = new Date(dateRef); dateMinus30.setDate(dateMinus30.getDate() - 30)
      const datePlus30  = new Date(dateRef); datePlus30.setDate(datePlus30.getDate() + 30)

      const { data: found } = await supabase
        .from('achats')
        .select('id, numero_facture, date_facture, montant_ttc')
        .eq('user_id', session.user.id)
        .eq('fournisseur_nom', form.fournisseur_nom)
        .eq('montant_ttc', ttc)
        .gte('date_facture', dateMinus30.toISOString().split('T')[0])
        .lte('date_facture', datePlus30.toISOString().split('T')[0])
        .limit(3)

      if (found && found.length > 0) {
        setSaving(false)
        setDoublons(found)
        setPendingSave({ ...payload, user_id: session.user.id })
        setShowDoublonWarning(true)
        return
      }
    }

    const { error } = await supabase.from('achats').insert({ ...payload, user_id: session.user.id })
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement."); return }
    closeModal(); fetchAchats()
  }

  async function confirmSave() {
    if (!pendingSave) return
    setSaving(true)
    const { error } = await supabase.from('achats').insert(pendingSave)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement."); return }
    closeModal(); fetchAchats()
  }

  async function markPayee(id: string) {
    const { error: err } = await supabase.from('achats').update({ statut: 'payee' }).eq('id', id)
    if (err) { setError('Erreur lors de la mise à jour.'); return }
    fetchAchats()
  }

  async function markPayeProgramme(id: string) {
    const { error: err } = await supabase
      .from('achats')
      .update({ statut: 'payee', date_paiement_programme: null })
      .eq('id', id)
    if (err) { setError('Erreur lors de la mise à jour.'); return }
    showToast('✓ Achat marqué comme payé')
    fetchAchats()
  }

  async function deleteAchat(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    const { error: err } = await supabase.from('achats').delete().eq('id', id)
    if (err) { setError('Erreur lors de la suppression.'); return }
    fetchAchats()
  }

  function openEdit(a: Achat) {
    setEditingId(a.id)
    setForm({
      fournisseur_nom: a.fournisseur_nom || '',
      numero_facture: a.numero_facture || '',
      date_facture: a.date_facture || '',
      date_echeance: a.date_echeance || '',
      date_paiement_programme: a.date_paiement_programme || '',
      montant_ht: String(a.montant_ht ?? ''),
      taux_tva: String(a.taux_tva ?? '20'),
      categorie: a.categorie || '',
      notes: a.notes || '',
      statut: a.statut || 'a_payer',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDoublons([])
    setShowDoublonWarning(false)
    setPendingSave(null)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = achats.filter(a => {
    const matchSearch =
      a.fournisseur_nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.numero_facture?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filtreStatut === 'Tous' || a.statut === filtreStatut
    const matchMois = !filtreMois || (a.date_facture && a.date_facture.startsWith(filtreMois))
    return matchSearch && matchStatut && matchMois
  })

  const totalAPayer = achats
    .filter(a => a.statut === 'a_payer')
    .reduce((sum, a) => sum + (a.montant_ttc || 0), 0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const totalPayeCeMois = achats
    .filter(a => a.statut === 'payee' && a.date_facture?.startsWith(currentMonth))
    .reduce((sum, a) => sum + (a.montant_ttc || 0), 0)

  const countEnRetard = achats.filter(a => a.statut === 'en_retard').length

  const today30 = new Date(); today30.setDate(today30.getDate() + 30)
  const today30str = today30.toISOString().split('T')[0]
  const paiementsProgrammes = achats.filter(a =>
    a.date_paiement_programme &&
    a.statut !== 'payee' &&
    a.date_paiement_programme <= today30str
  )

  function urgenceStyle(date: string): { background: string; border: string } {
    const in7 = new Date(); in7.setDate(in7.getDate() + 7)
    if (date < today) return { background: '#FEE2E2', border: '1px solid #EF4444' }
    if (date <= in7.toISOString().split('T')[0]) return { background: '#FEF3C7', border: '1px solid #F59E0B' }
    return { background: '#F0FDF4', border: '1px solid #22C55E' }
  }

  const ttcPreview = (() => {
    const ht = parseFloat(form.montant_ht) || 0
    const tva = parseFloat(form.taux_tva) || 0
    return (ht * (1 + tva / 100)).toFixed(2)
  })()

  if (!permLoading && !isOwner && !can('achats')) {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4' }}>
      <Nav />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0B1F45', margin: 0 }}>Achats</h1>
            <p style={{ color: '#888', marginTop: 4, margin: '4px 0 0' }}>Factures fournisseurs</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }}
            style={{ backgroundColor: '#C8973A', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            ＋ Nouvelle facture
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Total à payer</p>
            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: '#E65100' }}>
              {totalAPayer.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Payé ce mois</p>
            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: '#2E7D32' }}>
              {totalPayeCeMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Factures en retard</p>
              <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: countEnRetard > 0 ? '#C62828' : '#0B1F45' }}>
                {countEnRetard}
              </p>
            </div>
            {countEnRetard > 0 && (
              <span style={{ backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                Retard
              </span>
            )}
          </div>
        </div>

        {/* Paiements programmés à venir */}
        {paiementsProgrammes.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#0B1F45', margin: '0 0 16px' }}>
              📅 Paiements programmés à venir
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paiementsProgrammes.map(a => {
                const style = urgenceStyle(a.date_paiement_programme!)
                const initiale = (a.fournisseur_nom || '?')[0].toUpperCase()
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderRadius: 12, background: style.background, border: style.border }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0B1F45', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {initiale}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: '#0B1F45', fontSize: 14 }}>{a.fournisseur_nom}</span>
                      {a.numero_facture && <span style={{ color: '#666', fontSize: 13, marginLeft: 10 }}>N°{a.numero_facture}</span>}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0B1F45', fontSize: 15, whiteSpace: 'nowrap' }}>
                      {(a.montant_ttc ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                    <div style={{ color: '#555', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {new Date(a.date_paiement_programme!).toLocaleDateString('fr-FR')}
                    </div>
                    <button
                      onClick={() => markPayeProgramme(a.id)}
                      style={{ background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ✓ Marquer payé
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            placeholder="Rechercher par fournisseur ou n° facture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 260, padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
          />
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white' }}
          >
            <option value="Tous">Tous</option>
            <option value="a_payer">À payer</option>
            <option value="payee">Payée</option>
            <option value="en_retard">En retard</option>
          </select>
          <input
            type="month"
            value={filtreMois}
            onChange={e => setFiltreMois(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white' }}
          />
        </div>

        {/* Tableau */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                {['FOURNISSEUR', 'N° FACTURE', 'DATE', 'ÉCHÉANCE', 'HT', 'TVA%', 'TTC', 'STATUT', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#888' }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 60, textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
                  <p style={{ margin: 0 }}>Aucune facture trouvée</p>
                </td></tr>
              ) : filtered.map((a, i) => {
                const echeanceRetard = a.date_echeance && a.date_echeance < today && a.statut !== 'payee'
                const statut = STATUT_STYLES[a.statut] || STATUT_STYLES.a_payer
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0B1F45' }}>{a.fournisseur_nom || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>{a.numero_facture || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>
                      {a.date_facture ? new Date(a.date_facture).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: echeanceRetard ? '#C62828' : '#555', fontWeight: echeanceRetard ? 600 : 400 }}>
                      {a.date_echeance ? new Date(a.date_echeance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>
                      {(a.montant_ht ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>{a.taux_tva ?? 0}%</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0B1F45', fontSize: 13 }}>
                      {(a.montant_ttc ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        <span style={{ backgroundColor: statut.bg, color: statut.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {STATUT_LABELS[a.statut] || a.statut}
                        </span>
                        {a.date_paiement_programme && (
                          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                            📅 Prévu le {new Date(a.date_paiement_programme).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openEdit(a)}
                          style={{ backgroundColor: '#0B1F45', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                        >✏️ Éditer</button>
                        {a.statut !== 'payee' && (
                          <button
                            onClick={() => markPayee(a.id)}
                            style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                          >✅</button>
                        )}
                        <button
                          onClick={() => deleteAchat(a.id)}
                          style={{ backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', margin: '0 0 24px' }}>
              {editingId ? 'Modifier la facture' : 'Nouvelle facture'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Fournisseur *</label>
                <input
                  value={form.fournisseur_nom}
                  onChange={e => setForm(f => ({ ...f, fournisseur_nom: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Numéro de facture</label>
                <input
                  value={form.numero_facture}
                  onChange={e => setForm(f => ({ ...f, numero_facture: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Date de facture</label>
                <input
                  type="date"
                  value={form.date_facture}
                  onChange={e => setForm(f => ({ ...f, date_facture: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Date d'échéance</label>
                <input
                  type="date"
                  value={form.date_echeance}
                  onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Date de paiement programmé (optionnel)</label>
                <input
                  type="date"
                  value={form.date_paiement_programme}
                  onChange={e => setForm(f => ({ ...f, date_paiement_programme: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Montant HT (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.montant_ht}
                  onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Taux TVA %</label>
                <select
                  value={form.taux_tva}
                  onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                >
                  {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Montant TTC (calculé)</label>
                <input
                  readOnly
                  value={`${parseFloat(ttcPreview).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: '#f9fafb', color: '#0B1F45', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Catégorie</label>
                <select
                  value={form.categorie}
                  onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                >
                  <option value="">-- Sélectionner --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Statut</label>
                <select
                  value={form.statut}
                  onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                >
                  <option value="a_payer">À payer</option>
                  <option value="payee">Payée</option>
                  <option value="en_retard">En retard</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {showDoublonWarning && (
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 12, padding: '16px 20px', marginTop: 20 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0B1F45', fontSize: 14 }}>
                  ⚠️ Doublon potentiel détecté
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>Un achat similaire existe déjà :</p>
                <ul style={{ margin: '0 0 16px', paddingLeft: 18 }}>
                  {doublons.map(d => (
                    <li key={d.id} style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      Facture N°{d.numero_facture || '—'} — {(d.montant_ttc ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € — {d.date_facture ? new Date(d.date_facture).toLocaleDateString('fr-FR') : '—'}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setShowDoublonWarning(false); setPendingSave(null) }}
                    style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #0B1F45', background: 'transparent', color: '#0B1F45', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmSave}
                    disabled={saving}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C8973A', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    {saving ? 'Enregistrement...' : 'Sauvegarder quand même'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}
              >
                Annuler
              </button>
              <button
                onClick={saveAchat}
                disabled={saving || !form.fournisseur_nom || showDoublonWarning}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  backgroundColor: form.fournisseur_nom && !showDoublonWarning ? '#C8973A' : '#ccc',
                  color: 'white', cursor: form.fournisseur_nom && !showDoublonWarning ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#0B1F45', color: '#C8973A', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
