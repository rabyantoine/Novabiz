'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../lib/supabase'

const supabase = createClient()

type Produit = {
  id: string
  nom: string
  reference: string | null
  description: string | null
  type: 'produit' | 'service'
  prix_ht: number
  tva: number
  unite: string
  actif: boolean
  created_at: string
}

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Factures', href: '/factures' },
  { label: 'Devis', href: '/devis' },
  { label: 'Catalogue', href: '/produits' },
  { label: 'CRM', href: '/crm' },
  { label: 'Frais', href: '/frais' },
  { label: 'Relances', href: '/relances' },
  { label: 'Planning', href: '/planning' },
  { label: 'Rapports', href: '/rapports' },
  { label: 'Classeur', href: '/classeur' },
  { label: 'Paramètres', href: '/parametres' },
]

const TVA_OPTIONS = [0, 5.5, 10, 20]
const UNITE_OPTIONS = ['unité', 'heure', 'jour', 'mois', 'forfait', 'km']

const EMPTY_FORM = {
  nom: '',
  reference: '',
  description: '',
  type: 'produit' as 'produit' | 'service',
  prix_ht: '',
  tva: '20',
  unite: 'unité',
  actif: true,
}

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'tous' | 'produit' | 'service'>('tous')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProduits(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchProduits() }, [fetchProduits])

  const filtered = produits.filter(p => {
    const matchType = filterType === 'tous' || p.type === filterType
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (p: Produit) => {
    setEditId(p.id)
    setForm({
      nom: p.nom,
      reference: p.reference || '',
      description: p.description || '',
      type: p.type,
      prix_ht: String(p.prix_ht),
      tva: String(p.tva),
      unite: p.unite,
      actif: p.actif,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    if (!form.prix_ht || isNaN(Number(form.prix_ht))) { setError('Le prix HT est invalide.'); return }
    setSaving(true)
    setError('')
    const payload = {
      nom: form.nom.trim(),
      reference: form.reference.trim() || null,
      description: form.description.trim() || null,
      type: form.type,
      prix_ht: Number(form.prix_ht),
      tva: Number(form.tva),
      unite: form.unite,
      actif: form.actif,
    }
    let err
    if (editId) {
      ;({ error: err } = await supabase.from('produits').update(payload).eq('id', editId))
    } else {
      ;({ error: err } = await supabase.from('produits').insert([payload]))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowModal(false)
    fetchProduits()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('produits').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchProduits()
  }

  const toggleActif = async (p: Produit) => {
    await supabase.from('produits').update({ actif: !p.actif }).eq('id', p.id)
    fetchProduits()
  }

  const totalProduits = produits.filter(p => p.type === 'produit' && p.actif).length
  const totalServices = produits.filter(p => p.type === 'service' && p.actif).length
  const prixMoyen = produits.length > 0
    ? (produits.reduce((s, p) => s + p.prix_ht, 0) / produits.length).toFixed(2)
    : '0.00'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#0B1F45', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/dashboard" style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '700', color: '#fff', textDecoration: 'none' }}>NovaBiz</a>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
              color: l.href === '/produits' ? '#C8973A' : 'rgba(255,255,255,0.55)',
              background: l.href === '/produits' ? 'rgba(200,151,58,0.12)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>{l.label}</a>
          ))}
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
          Déconnexion
        </button>
      </nav>

      {/* Header */}
      <div style={{ background: '#0B1F45', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            Catalogue Produits &amp; Services
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>
            Gérez votre catalogue pour l&apos;utiliser dans vos devis et factures
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: '#C8973A', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          + Nouveau
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Produits actifs', value: totalProduits, color: '#0B1F45' },
            { label: 'Services actifs', value: totalServices, color: '#C8973A' },
            { label: 'Prix moyen HT', value: `${prixMoyen} €`, color: '#059669' },
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
            type="text" placeholder="Rechercher par nom, référence..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e2d9c9', background: '#fff', fontSize: 14,
              outline: 'none', color: '#0B1F45'
            }}
          />
          {(['tous', 'produit', 'service'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid',
              borderColor: filterType === t ? '#0B1F45' : '#e2d9c9',
              background: filterType === t ? '#0B1F45' : '#fff',
              color: filterType === t ? '#fff' : '#64748b',
              fontWeight: filterType === t ? 600 : 400, fontSize: 14, cursor: 'pointer'
            }}>
              {t === 'tous' ? 'Tous' : t === 'produit' ? '📦 Produits' : '⚙️ Services'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#64748b', fontSize: 16 }}>Aucun produit ou service trouvé.</p>
            <button onClick={openCreate} style={{
              marginTop: 16, background: '#C8973A', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer'
            }}>
              Créer le premier
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 12, border: '1px solid',
                borderColor: p.actif ? '#e8e4dc' : '#f1ede6',
                padding: 20, opacity: p.actif ? 1 : 0.65,
                transition: 'box-shadow 0.15s',
                cursor: 'default'
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,31,69,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: p.type === 'produit' ? '#EFF6FF' : '#F0FDF4',
                        color: p.type === 'produit' ? '#1D4ED8' : '#15803D'
                      }}>
                        {p.type === 'produit' ? '📦 Produit' : '⚙️ Service'}
                      </span>
                      {!p.actif && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: '#94a3b8' }}>
                          Inactif
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1F45', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nom}
                    </h3>
                    {p.reference && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Réf. {p.reference}</div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(p)} title="Modifier" style={{
                      width: 30, height: 30, borderRadius: 6, border: '1px solid #e2d9c9',
                      background: '#fff', cursor: 'pointer', fontSize: 14, color: '#64748b'
                    }}>✏️</button>
                    <button onClick={() => setDeleteId(p.id)} title="Supprimer" style={{
                      width: 30, height: 30, borderRadius: 6, border: '1px solid #fde2e2',
                      background: '#fff', cursor: 'pointer', fontSize: 14, color: '#ef4444'
                    }}>🗑️</button>
                  </div>
                </div>

                {p.description && (
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {p.description}
                  </p>
                )}

                {/* Prix + unité */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1ede6' }}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0B1F45' }}>
                      {Number(p.prix_ht).toFixed(2)} €
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>HT / {p.unite}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>TVA {p.tva}%</span>
                    <button
                      onClick={() => toggleActif(p)}
                      title={p.actif ? 'Désactiver' : 'Activer'}
                      style={{
                        width: 34, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: p.actif ? '#C8973A' : '#e2e8f0', position: 'relative', transition: 'background 0.2s'
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2, left: p.actif ? 16 : 2,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', display: 'block'
                      }} />
                    </button>
                  </div>
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
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(11,31,69,0.25)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: 20, margin: 0 }}>
                {editId ? 'Modifier le produit' : 'Nouveau produit / service'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#F8F6F1', borderRadius: 10, padding: 4 }}>
              {(['produit', 'service'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: form.type === t ? '#0B1F45' : 'transparent',
                  color: form.type === t ? '#fff' : '#64748b',
                  fontWeight: form.type === t ? 600 : 400, fontSize: 14, transition: 'all 0.15s'
                }}>
                  {t === 'produit' ? '📦 Produit' : '⚙️ Service'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nom */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Nom <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Développement web, Bureau ergonomique..."
                  style={inputStyle} />
              </div>

              {/* Référence */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Référence / SKU
                </label>
                <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="Ex: DEV-001"
                  style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Description détaillée..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {/* Prix + unité */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Prix HT (€) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="number" min="0" step="0.01" value={form.prix_ht}
                    onChange={e => setForm(f => ({ ...f, prix_ht: e.target.value }))}
                    placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Unité
                  </label>
                  <select value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
                    style={inputStyle}>
                    {UNITE_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* TVA */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Taux de TVA
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TVA_OPTIONS.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tva: String(t) }))} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${form.tva === String(t) ? '#C8973A' : '#e2d9c9'}`,
                      background: form.tva === String(t) ? '#FDF7EE' : '#fff',
                      color: form.tva === String(t) ? '#C8973A' : '#64748b',
                      fontWeight: form.tva === String(t) ? 700 : 400, fontSize: 14
                    }}>
                      {t}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix TTC preview */}
              {form.prix_ht && !isNaN(Number(form.prix_ht)) && (
                <div style={{ background: '#F0F7FF', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1D4ED8' }}>
                  💡 Prix TTC : <strong>{(Number(form.prix_ht) * (1 + Number(form.tva) / 100)).toFixed(2)} €</strong>
                </div>
              )}

              {/* Actif toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1ede6' }}>
                <label style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>Produit actif</label>
                <button onClick={() => setForm(f => ({ ...f, actif: !f.actif }))} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: form.actif ? '#C8973A' : '#e2e8f0', position: 'relative', transition: 'background 0.2s'
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: form.actif ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', display: 'block'
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
                background: '#fff', color: '#64748b', fontWeight: 500, cursor: 'pointer'
              }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                background: saving ? '#94a3b8' : '#0B1F45', color: '#fff',
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15
              }}>
                {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.45)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380,
            boxShadow: '0 20px 60px rgba(11,31,69,0.25)', textAlign: 'center'
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: 18, marginBottom: 8 }}>
              Supprimer ce produit ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2d9c9',
                background: '#fff', color: '#64748b', fontWeight: 500, cursor: 'pointer'
              }}>
                Annuler
              </button>
              <button onClick={handleDelete} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer'
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
  outline: 'none', color: '#0B1F45', boxSizing: 'border-box'
}
