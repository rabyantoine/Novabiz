'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'

type Fournisseur = {
  id: string
  nom: string
  contact: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal: string
  pays: string
  siret: string
  tva_intra: string
  categorie: string
  notes: string
  statut: string
  created_at: string
}

const CATEGORIES = ['Informatique', 'Fournitures', 'Services', 'Logistique', 'Marketing', 'Finance', 'Autre']

export default function FournisseursPage() {
  const router = useRouter()

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('Tous')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom: '', contact: '', email: '', telephone: '',
    adresse: '', ville: '', code_postal: '', pays: 'France',
    siret: '', tva_intra: '', categorie: '', notes: '', statut: 'actif'
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    fetchFournisseurs()
  }

  async function fetchFournisseurs() {
    setLoading(true)
    const { data } = await supabase
      .from('fournisseurs')
      .select('*')
      .order('created_at', { ascending: false })
    setFournisseurs(data || [])
    setLoading(false)
  }

  async function saveFournisseur() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    if (editingId) {
      await supabase.from('fournisseurs').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editingId)
    } else {
      await supabase.from('fournisseurs').insert({ ...form, user_id: session.user.id })
    }
    setSaving(false)
    setShowModal(false)
    resetForm()
    fetchFournisseurs()
  }

  async function deleteFournisseur(id: string) {
    if (!confirm('Supprimer ce fournisseur ?')) return
    await supabase.from('fournisseurs').delete().eq('id', id)
    fetchFournisseurs()
  }

  function openEdit(f: Fournisseur) {
    setEditingId(f.id)
    setForm({
      nom: f.nom || '', contact: f.contact || '', email: f.email || '',
      telephone: f.telephone || '', adresse: f.adresse || '', ville: f.ville || '',
      code_postal: f.code_postal || '', pays: f.pays || 'France',
      siret: f.siret || '', tva_intra: f.tva_intra || '',
      categorie: f.categorie || '', notes: f.notes || '', statut: f.statut || 'actif'
    })
    setShowModal(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      nom: '', contact: '', email: '', telephone: '',
      adresse: '', ville: '', code_postal: '', pays: 'France',
      siret: '', tva_intra: '', categorie: '', notes: '', statut: 'actif'
    })
  }

  const filtered = fournisseurs.filter(f => {
    const matchSearch = f.nom?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()) ||
      f.ville?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filtreCategorie === 'Tous' || f.categorie === filtreCategorie
    return matchSearch && matchCat
  })

  const actifs = fournisseurs.filter(f => f.statut === 'actif').length
  const inactifs = fournisseurs.filter(f => f.statut === 'inactif').length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4' }}>
      <Nav />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0B1F45', margin: 0 }}>Fournisseurs</h1>
            <p style={{ color: '#666', marginTop: 4 }}>{fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} au total</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }} style={{
            backgroundColor: '#C8973A', color: 'white', border: 'none',
            borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}>+ Nouveau fournisseur</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total fournisseurs', value: fournisseurs.length, color: '#0B1F45' },
            { label: 'Actifs', value: actifs, color: '#16a34a' },
            { label: 'Inactifs', value: inactifs, color: '#dc2626' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: 0, color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
              <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            placeholder="Rechercher par nom, email, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 250, padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
          />
          <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, backgroundColor: 'white' }}>
            <option>Tous</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                {['NOM', 'CONTACT', 'EMAIL', 'TÉLÉPHONE', 'VILLE', 'CATÉGORIE', 'STATUT', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
                  <p style={{ margin: 0 }}>Aucun fournisseur trouvé</p>
                </td></tr>
              ) : filtered.map((f, i) => (
                <tr key={f.id} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0B1F45' }}>{f.nom}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{f.contact || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{f.email || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{f.telephone || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{f.ville || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {f.categorie ? <span style={{ backgroundColor: '#EFF6FF', color: '#1d4ed8', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{f.categorie}</span> : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      backgroundColor: f.statut === 'actif' ? '#dcfce7' : '#fee2e2',
                      color: f.statut === 'actif' ? '#16a34a' : '#dc2626',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600
                    }}>{f.statut}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(f)} style={{ backgroundColor: '#0B1F45', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>✏️ Éditer</button>
                      <button onClick={() => deleteFournisseur(f.id)} style={{ backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', margin: '0 0 24px' }}>
              {editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Nom *', key: 'nom', full: true },
                { label: 'Contact', key: 'contact' },
                { label: 'Email', key: 'email' },
                { label: 'Téléphone', key: 'telephone' },
                { label: 'Adresse', key: 'adresse', full: true },
                { label: 'Ville', key: 'ville' },
                { label: 'Code postal', key: 'code_postal' },
                { label: 'SIRET', key: 'siret' },
                { label: 'TVA Intracom.', key: 'tva_intra' },
              ].map(({ label, key, full }) => (
                <div key={key} style={{ gridColumn: full ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}>
                  <option value="">-- Sélectionner --</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={saveFournisseur} disabled={saving || !form.nom} style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                backgroundColor: form.nom ? '#C8973A' : '#ccc', color: 'white',
                cursor: form.nom ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600
              }}>{saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}