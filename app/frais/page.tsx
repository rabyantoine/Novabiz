'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'

type Charge = {
  id: string
  user_id: string
  libelle: string
  montant: number
  categorie: string | null
  date_charge: string
  tva_deductible: number
  created_at: string
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Factures', href: '/factures' },
  { label: 'Devis', href: '/devis' },
  { label: 'CRM', href: '/crm' },
  { label: 'Frais', href: '/frais' },
  { label: 'Relances', href: '/relances' },
  { label: 'Planning', href: '/planning' },
  { label: 'Rapports', href: '/rapports' },
  { label: 'Paramètres', href: '/parametres' },
]

const CATEGORIES = [
  'Loyer & charges', 'Transport', 'Repas & restauration', 'Téléphone & internet',
  'Logiciels & abonnements', 'Matériel & fournitures', 'Marketing & communication',
  'Formation', 'Comptabilité & juridique', 'Divers',
]

const CAT_COLORS: Record<string, string> = {
  'Loyer & charges': '#0B1F45',
  'Transport': '#2563EB',
  'Repas & restauration': '#D97706',
  'Téléphone & internet': '#7C3AED',
  'Logiciels & abonnements': '#059669',
  'Matériel & fournitures': '#C8973A',
  'Marketing & communication': '#DB2777',
  'Formation': '#0891B2',
  'Comptabilité & juridique': '#4F46E5',
  'Divers': '#6B7280',
}

const EMPTY_FORM = {
  libelle: '',
  montant: '',
  categorie: 'Divers',
  date_charge: new Date().toISOString().split('T')[0],
  tva_deductible: '0',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function Frais() {
  const [user, setUser] = useState<any>(null)
  const [charges, setCharges] = useState<Charge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCharge, setEditCharge] = useState<Charge | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [filterCat, setFilterCat] = useState('toutes')
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await loadCharges(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadCharges = async (userId: string) => {
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('user_id', userId)
      .order('date_charge', { ascending: false })
    setCharges(data || [])
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const openAdd = () => {
    setEditCharge(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: Charge) => {
    setEditCharge(c)
    setForm({
      libelle: c.libelle,
      montant: String(c.montant),
      categorie: c.categorie || 'Divers',
      date_charge: c.date_charge,
      tva_deductible: String(c.tva_deductible || 0),
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.libelle.trim() || !form.montant) { setError('Libellé et montant sont obligatoires.'); return }
    setSaving(true)
    setError('')
    const payload = {
      libelle: form.libelle.trim(),
      montant: parseFloat(form.montant),
      categorie: form.categorie,
      date_charge: form.date_charge,
      tva_deductible: parseFloat(form.tva_deductible) || 0,
    }
    if (editCharge) {
      const { error: err } = await supabase.from('charges').update(payload).eq('id', editCharge.id)
      if (err) { setError(err.message); setSaving(false); return }
      showToast('✓ Frais mis à jour')
    } else {
      const { error: err } = await supabase.from('charges').insert({ ...payload, user_id: user.id })
      if (err) { setError(err.message); setSaving(false); return }
      showToast('✓ Frais ajouté')
    }
    setSaving(false)
    setShowForm(false)
    setEditCharge(null)
    await loadCharges(user.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette note de frais ?')) return
    await supabase.from('charges').delete().eq('id', id)
    setCharges(c => c.filter(x => x.id !== id))
    showToast('Frais supprimé')
  }

  // Filters
  const chargesThisMonth = charges.filter(c => c.date_charge?.startsWith(filterMonth))

  const filtered = chargesThisMonth.filter(c =>
    filterCat === 'toutes' || c.categorie === filterCat
  )

  // KPIs
  const totalMois = chargesThisMonth.reduce((s, c) => s + Number(c.montant), 0)
  const tvaMois = chargesThisMonth.reduce((s, c) => s + Number(c.tva_deductible || 0), 0)
  const totalAnnee = charges
    .filter(c => c.date_charge?.startsWith(filterMonth.split('-')[0]))
    .reduce((s, c) => s + Number(c.montant), 0)

  // Répartition par catégorie ce mois
  const byCategory: Record<string, number> = {}
  chargesThisMonth.forEach(c => {
    const cat = c.categorie || 'Divers'
    byCategory[cat] = (byCategory[cat] || 0) + Number(c.montant)
  })
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  // Month selector helpers
  const changeMonth = (delta: number) => {
    const [y, m] = filterMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthLabel = new Date(filterMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (loading) return <SkeletonLoader rows={6} stats={3} cols={[26, 18, 14, 14, 14, 10]} />

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav style={{ background: '#0B1F45', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/dashboard" style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '700', color: '#fff', textDecoration: 'none' }}>
            Nova<span style={{ color: '#C8973A' }}>Biz</span>
          </a>
          <div style={{ display: 'flex', gap: '4px' }}>
            {NAV.map(l => (
              <a key={l.href} href={l.href} style={{
                fontSize: '13px', fontWeight: '500', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '8px',
                color: l.href === '/frais' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                background: l.href === '/frais' ? 'rgba(200,151,58,0.12)' : 'transparent',
              }}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Notes de frais</h1>
              <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>{filtered.length} dépense{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid rgba(11,31,69,0.12)', borderRadius: '10px', padding: '6px 10px' }}>
              <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B1F45', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>‹</button>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45', minWidth: '130px', textAlign: 'center', textTransform: 'capitalize' }}>{monthLabel}</span>
              <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B1F45', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>›</button>
            </div>
          </div>
          <button onClick={openAdd}
            style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Ajouter un frais
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total du mois', value: fmt(totalMois), sub: `${chargesThisMonth.length} note${chargesThisMonth.length !== 1 ? 's' : ''} de frais`, accent: true },
            { label: 'TVA déductible', value: fmt(tvaMois), sub: 'Ce mois-ci', accent: false },
            { label: 'Total année', value: fmt(totalAnnee), sub: filterMonth.split('-')[0], accent: false },
            { label: 'Moyenne / mois', value: fmt(totalAnnee / 12), sub: 'Sur l\'année en cours', accent: false },
          ].map((k, i) => (
            <div key={i} style={{
              background: k.accent ? '#0B1F45' : '#fff',
              border: `1px solid ${k.accent ? 'transparent' : 'rgba(11,31,69,0.1)'}`,
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: k.accent ? '#C8973A' : '#0B1F45' }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: sortedCats.length > 0 ? '1fr 280px' : '1fr', gap: '24px' }}>
          <div>
            {/* Form */}
            {showForm && (
              <div style={{ background: '#fff', border: '2px solid #C8973A', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', margin: '0 0 20px' }}>
                  {editCharge ? '✏️ Modifier le frais' : '+ Nouveau frais'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Libellé *</label>
                    <input
                      type="text"
                      placeholder="Ex: Abonnement Notion, Billet train Paris…"
                      value={form.libelle}
                      onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                      style={inp}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={lbl}>Montant TTC (€) *</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.montant}
                      onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>TVA déductible (€)</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.tva_deductible}
                      onChange={e => setForm(f => ({ ...f, tva_deductible: e.target.value }))}
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Catégorie</label>
                    <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} style={inp}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Date</label>
                    <input
                      type="date"
                      value={form.date_charge}
                      onChange={e => setForm(f => ({ ...f, date_charge: e.target.value }))}
                      style={inp}
                    />
                  </div>
                </div>
                {error && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Enregistrement…' : (editCharge ? 'Mettre à jour' : 'Ajouter')}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditCharge(null); setError('') }}
                    style={{ background: 'transparent', border: '1px solid rgba(11,31,69,0.2)', color: '#0B1F45', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Category filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCat('toutes')}
                style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filterCat === 'toutes' ? '#0B1F45' : '#fff', color: filterCat === 'toutes' ? '#fff' : '#4A5568', boxShadow: filterCat === 'toutes' ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
                Toutes
              </button>
              {Object.keys(byCategory).map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filterCat === cat ? CAT_COLORS[cat] || '#0B1F45' : '#fff', color: filterCat === cat ? '#fff' : '#4A5568', boxShadow: filterCat === cat ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ margin: '16px', borderRadius: '14px', background: 'rgba(11,31,69,0.02)', border: '2px dashed rgba(11,31,69,0.1)', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(200,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#C8973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 6h28v36l-4-3-5 3-5-3-5 3-5-3-4 3V6z"/>
                      <line x1="16" y1="18" x2="32" y2="18"/>
                      <line x1="16" y1="25" x2="32" y2="25"/>
                      <line x1="16" y1="32" x2="24" y2="32"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 8px' }}>Aucune dépense ce mois</p>
                    <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, maxWidth: '340px', lineHeight: '1.5' }}>Enregistrez vos notes de frais pour suivre vos charges et optimiser votre marge nette.</p>
                  </div>
                  <button
                    onClick={openAdd}
                    style={{ marginTop: '8px', background: '#C8973A', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Ajouter ma première dépense
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                      {['Date', 'Libellé', 'Catégorie', 'TVA déd.', 'Montant', ''].map(h => (
                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3', whiteSpace: 'nowrap' }}>
                          {new Date(c.date_charge + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{c.libelle}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                            background: `${CAT_COLORS[c.categorie || 'Divers'] || '#6B7280'}18`,
                            color: CAT_COLORS[c.categorie || 'Divers'] || '#6B7280',
                          }}>
                            {c.categorie || 'Divers'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3' }}>
                          {Number(c.tva_deductible) > 0 ? `${Number(c.tva_deductible).toLocaleString('fr-FR')} €` : '—'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '800', color: '#0B1F45' }}>
                            {Number(c.montant).toLocaleString('fr-FR')} €
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(c)}
                              style={{ background: 'rgba(11,31,69,0.06)', border: 'none', color: '#0B1F45', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              ✏️
                            </button>
                            <button onClick={() => handleDelete(c.id)}
                              style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(11,31,69,0.1)', background: '#FAF8F4' }}>
                      <td colSpan={4} style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#0B1F45' }}>Total affiché</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '800', color: '#C8973A' }}>
                          {fmt(filtered.reduce((s, c) => s + Number(c.montant), 0))}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Répartition par catégorie */}
          {sortedCats.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '22px', height: 'fit-content', position: 'sticky', top: '80px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Répartition du mois</div>
              {sortedCats.map(([cat, total]) => {
                const pct = totalMois > 0 ? (total / totalMois) * 100 : 0
                const color = CAT_COLORS[cat] || '#6B7280'
                return (
                  <div key={cat} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#0B1F45' }}>{cat}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0B1F45' }}>{fmt(total)}</span>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A92A3', marginTop: '3px' }}>{pct.toFixed(0)}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(11,31,69,0.2)',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff',
  color: '#0B1F45', boxSizing: 'border-box',
}
