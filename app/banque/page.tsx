'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'

type CompteBancaire = {
  id: string
  user_id: string
  nom: string
  banque: string
  iban: string
  solde_initial: number
  devise: string
  created_at: string
}

type Transaction = {
  id: string
  user_id: string
  compte_id: string
  date_transaction: string
  libelle: string
  montant: number
  categorie: string
  notes: string
  statut_rapprochement: 'non_rapproche' | 'rapproche' | 'ignore'
  created_at: string
}

const CATEGORIES_TX = [
  'Revenus client', 'Salaires', 'Loyer', 'Fournisseurs',
  'Abonnements', 'Impôts & taxes', 'Remboursement', 'Virement interne', 'Autre',
]
const DEVISES = ['EUR', 'USD', 'GBP']

const RAPPROCH_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  non_rapproche: { bg: '#FFF3E0', color: '#E65100', label: 'Non rapprochée' },
  rapproche:     { bg: '#E8F5E9', color: '#2E7D32', label: 'Rapprochée' },
  ignore:        { bg: '#F3F4F6', color: '#6B7280', label: 'Ignorée' },
}

const EMPTY_TX = {
  compte_id: '',
  date_transaction: new Date().toISOString().split('T')[0],
  libelle: '',
  type: 'credit' as 'credit' | 'debit',
  montant: '',
  categorie: '',
  notes: '',
  statut_rapprochement: 'non_rapproche',
}

const EMPTY_COMPTE = {
  nom: '',
  banque: '',
  iban: '',
  solde_initial: '',
  devise: 'EUR',
}

export default function BanquePage() {
  const router = useRouter()

  const [onglet, setOnglet] = useState<'transactions' | 'comptes'>('transactions')
  const [comptes, setComptes] = useState<CompteBancaire[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [compteSelectionne, setCompteSelectionne] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingTx, setLoadingTx] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Filtres transactions
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState('Tous')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [filtreMois, setFiltreMois] = useState('')

  // Modal transaction
  const [showTxModal, setShowTxModal] = useState(false)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [formTx, setFormTx] = useState(EMPTY_TX)

  // Modal compte
  const [showCompteModal, setShowCompteModal] = useState(false)
  const [editingCompteId, setEditingCompteId] = useState<string | null>(null)
  const [formCompte, setFormCompte] = useState(EMPTY_COMPTE)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (compteSelectionne) fetchTransactions()
    else setTransactions([])
  }, [compteSelectionne])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    await fetchComptes()
  }

  async function fetchComptes() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('comptes_bancaires')
      .select('*')
      .order('created_at', { ascending: true })
    if (err) { setError('Erreur lors du chargement des comptes.'); setLoading(false); return }
    const list = data || []
    setComptes(list)
    if (list.length > 0 && !compteSelectionne) setCompteSelectionne(list[0].id)
    setLoading(false)
  }

  async function fetchTransactions() {
    if (!compteSelectionne) return
    setLoadingTx(true)
    setError('')
    const { data, error: err } = await supabase
      .from('transactions_bancaires')
      .select('*')
      .eq('compte_id', compteSelectionne)
      .order('date_transaction', { ascending: false })
    if (err) { setError('Erreur lors du chargement des transactions.'); setLoadingTx(false); return }
    setTransactions(data || [])
    setLoadingTx(false)
  }

  // --- TRANSACTIONS ---

  async function saveTx() {
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const montantBase = parseFloat(formTx.montant) || 0
    const montantFinal = formTx.type === 'debit' ? -Math.abs(montantBase) : Math.abs(montantBase)

    const payload = {
      compte_id: formTx.compte_id || compteSelectionne,
      date_transaction: formTx.date_transaction,
      libelle: formTx.libelle,
      montant: montantFinal,
      categorie: formTx.categorie,
      notes: formTx.notes,
      statut_rapprochement: formTx.statut_rapprochement,
    }

    let err
    if (editingTxId) {
      const { error } = await supabase.from('transactions_bancaires').update(payload).eq('id', editingTxId)
      err = error
    } else {
      const { error } = await supabase.from('transactions_bancaires').insert({ ...payload, user_id: session.user.id })
      err = error
    }
    setSaving(false)
    if (err) { setError("Erreur lors de l'enregistrement."); return }
    closeTxModal()
    fetchTransactions()
  }

  async function markRapprochee(id: string) {
    const { error: err } = await supabase
      .from('transactions_bancaires')
      .update({ statut_rapprochement: 'rapproche' })
      .eq('id', id)
    if (err) { setError('Erreur lors de la mise à jour.'); return }
    fetchTransactions()
  }

  async function markIgnoree(id: string) {
    const { error: err } = await supabase
      .from('transactions_bancaires')
      .update({ statut_rapprochement: 'ignore' })
      .eq('id', id)
    if (err) { setError('Erreur lors de la mise à jour.'); return }
    fetchTransactions()
  }

  async function deleteTx(id: string) {
    if (!confirm('Supprimer cette transaction ?')) return
    const { error: err } = await supabase.from('transactions_bancaires').delete().eq('id', id)
    if (err) { setError('Erreur lors de la suppression.'); return }
    fetchTransactions()
  }

  function openEditTx(t: Transaction) {
    setEditingTxId(t.id)
    setFormTx({
      compte_id: t.compte_id,
      date_transaction: t.date_transaction,
      libelle: t.libelle || '',
      type: t.montant >= 0 ? 'credit' : 'debit',
      montant: String(Math.abs(t.montant)),
      categorie: t.categorie || '',
      notes: t.notes || '',
      statut_rapprochement: t.statut_rapprochement || 'non_rapproche',
    })
    setShowTxModal(true)
  }

  function closeTxModal() {
    setShowTxModal(false)
    setEditingTxId(null)
    setFormTx({ ...EMPTY_TX, compte_id: compteSelectionne })
  }

  // --- COMPTES ---

  async function saveCompte() {
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const payload = {
      nom: formCompte.nom,
      banque: formCompte.banque,
      iban: formCompte.iban,
      solde_initial: parseFloat(formCompte.solde_initial) || 0,
      devise: formCompte.devise,
    }

    let err
    if (editingCompteId) {
      const { error } = await supabase.from('comptes_bancaires').update(payload).eq('id', editingCompteId)
      err = error
    } else {
      const { error } = await supabase.from('comptes_bancaires').insert({ ...payload, user_id: session.user.id })
      err = error
    }
    setSaving(false)
    if (err) { setError("Erreur lors de l'enregistrement du compte."); return }
    closeCompteModal()
    fetchComptes()
  }

  async function deleteCompte(id: string) {
    if (!confirm('Supprimer ce compte et toutes ses transactions ?')) return
    const { error: err } = await supabase.from('comptes_bancaires').delete().eq('id', id)
    if (err) { setError('Erreur lors de la suppression.'); return }
    if (compteSelectionne === id) setCompteSelectionne('')
    fetchComptes()
  }

  function openEditCompte(c: CompteBancaire) {
    setEditingCompteId(c.id)
    setFormCompte({
      nom: c.nom || '',
      banque: c.banque || '',
      iban: c.iban || '',
      solde_initial: String(c.solde_initial ?? 0),
      devise: c.devise || 'EUR',
    })
    setShowCompteModal(true)
  }

  function closeCompteModal() {
    setShowCompteModal(false)
    setEditingCompteId(null)
    setFormCompte(EMPTY_COMPTE)
  }

  // --- CALCULS KPI ---

  const compteActuel = comptes.find(c => c.id === compteSelectionne)
  const sommeTransactions = transactions.reduce((s, t) => s + (t.montant || 0), 0)
  const soldeActuel = (compteActuel?.solde_initial || 0) + sommeTransactions

  const currentMonth = new Date().toISOString().slice(0, 7)
  const entreesMois = transactions
    .filter(t => t.montant > 0 && t.date_transaction?.startsWith(currentMonth))
    .reduce((s, t) => s + t.montant, 0)
  const sortiesMois = transactions
    .filter(t => t.montant < 0 && t.date_transaction?.startsWith(currentMonth))
    .reduce((s, t) => s + t.montant, 0)
  const countNonRapprochees = transactions.filter(t => t.statut_rapprochement === 'non_rapproche').length

  // Solde calculé par compte (pour la vue comptes)
  function soldeCompte(c: CompteBancaire) {
    // On ne calcule pas en cross-table ici — retourner uniquement solde_initial
    // (les transactions sont chargées seulement pour le compte sélectionné)
    return c.solde_initial
  }

  // --- FILTRES ---

  const filteredTx = transactions.filter(t => {
    const matchSearch = t.libelle?.toLowerCase().includes(search.toLowerCase())
    const matchType = filtreType === 'Tous'
      || (filtreType === 'Crédits' && t.montant > 0)
      || (filtreType === 'Débits' && t.montant < 0)
    const matchStatut = filtreStatut === 'Tous'
      || (filtreStatut === 'Non rapprochées' && t.statut_rapprochement === 'non_rapproche')
      || (filtreStatut === 'Rapprochées' && t.statut_rapprochement === 'rapproche')
      || (filtreStatut === 'Ignorées' && t.statut_rapprochement === 'ignore')
    const matchMois = !filtreMois || t.date_transaction?.startsWith(filtreMois)
    return matchSearch && matchType && matchStatut && matchMois
  })

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })

  // --- RENDER ---

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4' }}>
      <Nav />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0B1F45', margin: 0 }}>Banque</h1>
            <p style={{ color: '#888', margin: '4px 0 0' }}>Suivi des flux et rapprochement</p>
          </div>
          {onglet === 'transactions' && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {comptes.length > 0 && (
                <select
                  value={compteSelectionne}
                  onChange={e => setCompteSelectionne(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white', color: '#0B1F45', fontWeight: 600 }}
                >
                  {comptes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              )}
              <button
                onClick={() => { setFormTx({ ...EMPTY_TX, compte_id: compteSelectionne }); setEditingTxId(null); setShowTxModal(true) }}
                disabled={comptes.length === 0}
                style={{ backgroundColor: comptes.length > 0 ? '#C8973A' : '#ccc', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: comptes.length > 0 ? 'pointer' : 'not-allowed' }}
              >
                ＋ Nouvelle transaction
              </button>
            </div>
          )}
          {onglet === 'comptes' && (
            <button
              onClick={() => { setEditingCompteId(null); setFormCompte(EMPTY_COMPTE); setShowCompteModal(true) }}
              style={{ backgroundColor: '#C8973A', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              ＋ Ajouter un compte
            </button>
          )}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid #e5e7eb' }}>
          {(['transactions', 'comptes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setOnglet(tab)}
              style={{
                padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                color: onglet === tab ? '#C8973A' : '#888',
                borderBottom: `2px solid ${onglet === tab ? '#C8973A' : 'transparent'}`,
                marginBottom: -2,
              }}
            >
              {tab === 'transactions' ? 'Transactions' : 'Comptes'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ======================== VUE TRANSACTIONS ======================== */}
        {onglet === 'transactions' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
                <Spinner />
              </div>
            ) : comptes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
                <p style={{ fontSize: 18, fontFamily: 'Georgia, serif', color: '#0B1F45', marginBottom: 8 }}>Aucun compte bancaire</p>
                <p style={{ marginBottom: 24 }}>Commencez par créer un compte dans l'onglet "Comptes".</p>
                <button
                  onClick={() => setOnglet('comptes')}
                  style={{ backgroundColor: '#C8973A', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  Créer mon premier compte
                </button>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  <KpiCard
                    label="Solde actuel"
                    value={`${fmt(soldeActuel)} ${compteActuel?.devise || 'EUR'}`}
                    color={soldeActuel >= 0 ? '#0B1F45' : '#C62828'}
                  />
                  <KpiCard
                    label="Entrées du mois"
                    value={`+${fmt(entreesMois)} €`}
                    color="#2E7D32"
                  />
                  <KpiCard
                    label="Sorties du mois"
                    value={`-${fmt(Math.abs(sortiesMois))} €`}
                    color="#C62828"
                  />
                  <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Non rapprochées</p>
                      <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: countNonRapprochees > 0 ? '#E65100' : '#0B1F45' }}>{countNonRapprochees}</p>
                    </div>
                    {countNonRapprochees > 0 && (
                      <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>À traiter</span>
                    )}
                  </div>
                </div>

                {/* Filtres */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                  <input
                    placeholder="Rechercher par libellé..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 220, padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                  />
                  <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white' }}>
                    <option>Tous</option>
                    <option>Crédits</option>
                    <option>Débits</option>
                  </select>
                  <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white' }}>
                    <option>Tous</option>
                    <option>Non rapprochées</option>
                    <option>Rapprochées</option>
                    <option>Ignorées</option>
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
                        {['DATE', 'LIBELLÉ', 'CATÉGORIE', 'MONTANT', 'STATUT', 'ACTIONS'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingTx ? (
                        <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}><Spinner /></td></tr>
                      ) : filteredTx.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#888' }}>
                          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                          <p style={{ margin: 0 }}>Aucune transaction trouvée</p>
                        </td></tr>
                      ) : filteredTx.map((t, i) => {
                        const isCredit = t.montant >= 0
                        const rap = RAPPROCH_STYLES[t.statut_rapprochement] || RAPPROCH_STYLES.non_rapproche
                        return (
                          <tr key={t.id} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>
                              {t.date_transaction ? new Date(t.date_transaction).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 500, color: '#0B1F45' }}>{t.libelle || '—'}</td>
                            <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>
                              {t.categorie
                                ? <span style={{ backgroundColor: '#EFF6FF', color: '#1d4ed8', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{t.categorie}</span>
                                : '—'}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: isCredit ? '#2E7D32' : '#C62828', fontSize: 14 }}>
                              {isCredit ? '+' : ''}{fmt(t.montant)} €
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ backgroundColor: rap.bg, color: rap.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                {rap.label}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => openEditTx(t)}
                                  style={{ backgroundColor: '#0B1F45', color: 'white', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                                {t.statut_rapprochement !== 'rapproche' && (
                                  <button onClick={() => markRapprochee(t.id)}
                                    style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>✅</button>
                                )}
                                {t.statut_rapprochement !== 'ignore' && (
                                  <button onClick={() => markIgnoree(t.id)}
                                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>🚫</button>
                                )}
                                <button onClick={() => deleteTx(t.id)}
                                  style={{ backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ======================== VUE COMPTES ======================== */}
        {onglet === 'comptes' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spinner /></div>
            ) : comptes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
                <p style={{ fontSize: 18, fontFamily: 'Georgia, serif', color: '#0B1F45', marginBottom: 8 }}>Aucun compte bancaire</p>
                <p style={{ marginBottom: 24 }}>Ajoutez votre premier compte pour commencer.</p>
                <button
                  onClick={() => { setEditingCompteId(null); setFormCompte(EMPTY_COMPTE); setShowCompteModal(true) }}
                  style={{ backgroundColor: '#C8973A', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  ＋ Ajouter un compte
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comptes.map(c => (
                  <div key={c.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#0B1F45', fontSize: 16 }}>{c.nom}</p>
                        <p style={{ margin: '2px 0 0', color: '#888', fontSize: 13 }}>{c.banque || '—'}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>IBAN</p>
                        <p style={{ margin: '2px 0 0', color: '#555', fontSize: 13, fontFamily: 'monospace' }}>
                          {c.iban ? `•••• ${c.iban.slice(-4)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Solde initial</p>
                        <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0B1F45', fontSize: 15 }}>
                          {fmt(c.solde_initial ?? 0)} {c.devise}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Devise</p>
                        <p style={{ margin: '2px 0 0', color: '#555', fontSize: 13 }}>{c.devise}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditCompte(c)}
                        style={{ backgroundColor: '#0B1F45', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>✏️ Éditer</button>
                      <button onClick={() => deleteCompte(c.id)}
                        style={{ backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ======================== MODAL TRANSACTION ======================== */}
      {showTxModal && (
        <Modal onClose={closeTxModal} title={editingTxId ? 'Modifier la transaction' : 'Nouvelle transaction'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Compte</label>
              <select
                value={formTx.compte_id || compteSelectionne}
                onChange={e => setFormTx(f => ({ ...f, compte_id: e.target.value }))}
                style={inputStyle}
              >
                {comptes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={formTx.date_transaction}
                onChange={e => setFormTx(f => ({ ...f, date_transaction: e.target.value }))}
                style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Libellé *</label>
              <input value={formTx.libelle}
                onChange={e => setFormTx(f => ({ ...f, libelle: e.target.value }))}
                style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {(['credit', 'debit'] as const).map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      name="type_tx"
                      value={type}
                      checked={formTx.type === type}
                      onChange={() => setFormTx(f => ({ ...f, type }))}
                    />
                    <span style={{ color: type === 'credit' ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                      {type === 'credit' ? '＋ Crédit' : '－ Débit'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Montant (€)</label>
              <input type="number" min="0" step="0.01" value={formTx.montant}
                onChange={e => setFormTx(f => ({ ...f, montant: e.target.value }))}
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Catégorie</label>
              <select value={formTx.categorie}
                onChange={e => setFormTx(f => ({ ...f, categorie: e.target.value }))}
                style={inputStyle}>
                <option value="">-- Sélectionner --</option>
                {CATEGORIES_TX.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Statut rapprochement</label>
              <select value={formTx.statut_rapprochement}
                onChange={e => setFormTx(f => ({ ...f, statut_rapprochement: e.target.value }))}
                style={inputStyle}>
                <option value="non_rapproche">Non rapprochée</option>
                <option value="rapproche">Rapprochée</option>
                <option value="ignore">Ignorée</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={formTx.notes}
                onChange={e => setFormTx(f => ({ ...f, notes: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          <ModalFooter
            onCancel={closeTxModal}
            onSave={saveTx}
            saving={saving}
            disabled={!formTx.libelle}
          />
        </Modal>
      )}

      {/* ======================== MODAL COMPTE ======================== */}
      {showCompteModal && (
        <Modal onClose={closeCompteModal} title={editingCompteId ? 'Modifier le compte' : 'Nouveau compte bancaire'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nom du compte *</label>
              <input value={formCompte.nom}
                onChange={e => setFormCompte(f => ({ ...f, nom: e.target.value }))}
                placeholder="ex: Compte courant BNP"
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Banque</label>
              <input value={formCompte.banque}
                onChange={e => setFormCompte(f => ({ ...f, banque: e.target.value }))}
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>IBAN (optionnel)</label>
              <input value={formCompte.iban}
                onChange={e => setFormCompte(f => ({ ...f, iban: e.target.value }))}
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Solde initial (€)</label>
              <input type="number" step="0.01" value={formCompte.solde_initial}
                onChange={e => setFormCompte(f => ({ ...f, solde_initial: e.target.value }))}
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Devise</label>
              <select value={formCompte.devise}
                onChange={e => setFormCompte(f => ({ ...f, devise: e.target.value }))}
                style={inputStyle}>
                {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <ModalFooter
            onCancel={closeCompteModal}
            onSave={saveCompte}
            saving={saving}
            disabled={!formCompte.nom}
          />
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// --- Composants utilitaires locaux ---

function Spinner() {
  return (
    <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <p style={{ margin: 0, color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', margin: '0 0 24px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onSave, saving, disabled }: { onCancel: () => void; onSave: () => void; saving: boolean; disabled: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
      <button onClick={onCancel}
        style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}>
        Annuler
      </button>
      <button onClick={onSave} disabled={saving || disabled}
        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: !disabled ? '#C8973A' : '#ccc', color: 'white', cursor: !disabled ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600 }}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#666', marginBottom: 4,
}
