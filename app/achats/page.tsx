'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import Nav from '../../components/Nav'

const supabase = createClient()

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
  montant_ht: '',
  taux_tva: '20',
  categorie: '',
  notes: '',
  statut: 'a_payer',
}

export default function AchatsPage() {
  const router = useRouter()

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
      montant_ht: ht,
      taux_tva: tva,
      montant_ttc: ttc,
      categorie: form.categorie,
      notes: form.notes,
      statut: form.statut,
    }

    let err
    if (editingId) {
      const { error } = await supabase.from('achats').update(payload).eq('id', editingId)
      err = error
    } else {
      const { error } = await supabase.from('achats').insert({ ...payload, user_id: session.user.id })
      err = error
    }

    setSaving(false)
    if (err) { setError("Erreur lors de l'enregistrement."); return }
    closeModal()
    fetchAchats()
  }

  async function markPayee(id: string) {
    const { error: err } = await supabase.from('achats').update({ statut: 'payee' }).eq('id', id)
    if (err) { setError('Erreur lors de la mise à jour.'); return }
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

  const ttcPreview = (() => {
    const ht = parseFloat(form.montant_ht) || 0
    const tva = parseFloat(form.taux_tva) || 0
    return (ht * (1 + tva / 100)).toFixed(2)
  })()

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
                      <span style={{ backgroundColor: statut.bg, color: statut.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        {STATUT_LABELS[a.statut] || a.statut}
                      </span>
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

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}
              >
                Annuler
              </button>
              <button
                onClick={saveAchat}
                disabled={saving || !form.fournisseur_nom}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  backgroundColor: form.fournisseur_nom ? '#C8973A' : '#ccc',
                  color: 'white', cursor: form.fournisseur_nom ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
