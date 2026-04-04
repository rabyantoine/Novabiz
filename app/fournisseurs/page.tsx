'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Nav from '@/components/Nav'

type Fournisseur = {
  id: string
  user_id: string
  nom: string
  contact: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  siret: string | null
  categorie: string | null
  notes: string | null
  actif: boolean
  created_at: string
}

const CATEGORIES = [
  'Matières premières', 'Logiciels & SaaS', 'Transport & logistique',
  'Marketing & communication', 'Services professionnels', 'Matériel & équipement',
  'Fournitures de bureau', 'Sous-traitance', 'Divers',
]

const EMPTY_FORM = {
  nom: '',
  contact: '',
  email: '',
  telephone: '',
  adresse: '',
  ville: '',
  siret: '',
  categorie: '',
  notes: '',
  actif: true,
}

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchFournisseurs = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('fournisseurs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setFournisseurs(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchFournisseurs() }, [fetchFournisseurs])

  const filtered = fournisseurs.filter(f => {
    const matchCat = filterCategorie === 'tous' || f.categorie === filterCategorie
    const matchSearch = !search ||
      f.nom.toLowerCase().includes(search.toLowerCase()) ||
      (f.contact || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.ville || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (f: Fournisseur) => {
    setEditId(f.id)
    setForm({
      nom: f.nom,
      contact: f.contact || '',
      email: f.email || '',
      telephone: f.telephone || '',
      adresse: f.adresse || '',
      ville: f.ville || '',
      siret: f.siret || '',
      categorie: f.categorie || '',
      notes: f.notes || '',
      actif: f.actif,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const payload = {
      nom: form.nom.trim(),
      contact: form.contact.trim() || null,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      ville: form.ville.trim() || null,
      siret: form.siret.trim() || null,
      categorie: form.categorie || null,
      notes: form.notes.trim() || null,
      actif: form.actif,
      user_id: user.id,
    }
    let err
    if (editId) {
      ;({ error: err } = await supabase.from('fournisseurs').update(payload).eq('id', editId))
    } else {
      ;({ error: err } = await supabase.from('fournisseurs').insert([payload]))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowModal(false)
    fetchFournisseurs()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('fournisseurs').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchFournisseurs()
  }

  const toggleActif = async (f: Fournisseur) => {
    await supabase.from('fournisseurs').update({ actif: !f.actif }).eq('id', f.id)
    fetchFournisseurs()
  }

  const totalActifs = fournisseurs.filter(f => f.actif).length
  const categories = [...new Set(fournisseurs.map(f => f.categorie).filter(Boolean))]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />

      {/* Header */}
      <div style={{ background: '#0B1F45', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            Fournisseurs
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>
            Gérez vos fournisseurs et prestataires
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: '#C8973A', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          + Nouveau fournisseur
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Fournisseurs actifs', value: totalActifs, color: '#0B1F45' },
            { label: 'Total fournisseurs', value: fournisseurs.length, color: '#C8973A' },
            { label: 'Catégories', value: categories.length, color: '#059669' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              border: '1px solid #e8e4dc', display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{ width: 4, height: 36, borderRadius: 4, background: s.color }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0B1F45' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Rechercher par nom, contact, ville..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e2d9c9', background: '#fff', fontSize: 14,
              outline: 'none', color: '#0B1F45',
            }}
          />
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid #e2d9c9',
            background: '#fff', fontSize: 14, color: '#0B1F45', outline: 'none', cursor: 'pointer',
          }}>
            <option value="tous">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
            <p style={{ color: '#64748b', fontSize: 16 }}>Aucun fournisseur trouvé.</p>
            <button onClick={openCreate} style={{
              marginTop: 16, background: '#C8973A', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer',
            }}>
              Ajouter le premier
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(f => (
              <div key={f.id} style={{
                background: '#fff', borderRadius: 12, border: '1px solid',
                borderColor: f.actif ? '#e8e4dc' : '#f1ede6',
                padding: 20, opacity: f.actif ? 1 : 0.65,
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,31,69,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {f.categorie && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: '#F1F5F9', color: '#475569',
                        }}>
                          {f.categorie}
                        </span>
                      )}
                      {!f.actif && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: '#94a3b8' }}>
                          Inactif
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1F45', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.nom}
                    </h3>
                    {f.contact && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>👤 {f.contact}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(f)} title="Modifier" style={{
                      width: 30, height: 30, borderRadius: 6, border: '1px solid #e2d9c9',
                      background: '#fff', cursor: 'pointer', fontSize: 14,
                    }}>✏️</button>
                    <button onClick={() => setDeleteId(f.id)} title="Supprimer" style={{
                      width: 30, height: 30, borderRadius: 6, border: '1px solid #fde2e2',
                      background: '#fff', cursor: 'pointer', fontSize: 14,
                    }}>🗑️</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#64748b' }}>
                  {f.email && <div>✉️ {f.email}</div>}
                  {f.telephone && <div>📞 {f.telephone}</div>}
                  {f.ville && <div>📍 {f.ville}</div>}
                  {f.siret && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>SIRET : {f.siret}</div>}
                </div>

                {f.notes && (
                  <p style={{
                    fontSize: 12, color: '#94a3b8', margin: '12px 0 0', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {f.notes}
                  </p>
                )}

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1ede6', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => toggleActif(f)}
                    title={f.actif ? 'Désactiver' : 'Activer'}
                    style={{
                      width: 34, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: f.actif ? '#C8973A' : '#e2e8f0', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, left: f.actif ? 16 : 2,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', display: 'block',
                    }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Créer / Éditer */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.45)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540,
            boxShadow: '0 20px 60px rgba(11,31,69,0.25)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: 20, margin: 0 }}>
                {editId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nom <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom de l'entreprise ou du prestataire" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Nom du contact" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} style={inputStyle}>
                    <option value="">— Choisir —</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contact@fournisseur.fr" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="01 23 45 67 89" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                    placeholder="Rue, numéro..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                    placeholder="Paris" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>SIRET</label>
                <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                  placeholder="000 000 000 00000" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Informations complémentaires..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1ede6' }}>
                <label style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>Fournisseur actif</label>
                <button onClick={() => setForm(f => ({ ...f, actif: !f.actif }))} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: form.actif ? '#C8973A' : '#e2e8f0', position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: form.actif ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', display: 'block',
                  }} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2d9c9',
                background: '#fff', color: '#64748b', fontWeight: 500, cursor: 'pointer',
              }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                background: saving ? '#94a3b8' : '#0B1F45', color: '#fff',
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15,
              }}>
                {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Ajouter le fournisseur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.45)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380,
            boxShadow: '0 20px 60px rgba(11,31,69,0.25)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: 18, marginBottom: 8 }}>
              Supprimer ce fournisseur ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2d9c9',
                background: '#fff', color: '#64748b', fontWeight: 500, cursor: 'pointer',
              }}>
                Annuler
              </button>
              <button onClick={handleDelete} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2d9c9', background: '#fff', fontSize: 14,
  outline: 'none', color: '#0B1F45', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4,
}
