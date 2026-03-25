'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Devis = {
  id: string
  user_id: string
  client_nom: string
  titre: string
  description: string
  montant_ht: number
  taux_tva: number
  montant_ttc: number
  statut: 'brouillon' | 'envoyé' | 'accepté' | 'refusé'
  date_validite: string | null
  created_at: string
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Factures', href: '/factures' },
  { label: 'Devis', href: '/devis' },
  { label: 'CRM', href: '/crm' },
  { label: 'Frais', href: '/frais' },
  { label: 'Planning', href: '/planning' },
]

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280', label: 'Brouillon' },
  envoyé:    { bg: '#DBEAFE', color: '#1D4ED8', label: 'Envoyé' },
  accepté:   { bg: '#D1FAE5', color: '#059669', label: 'Accepté' },
  refusé:    { bg: '#FEE2E2', color: '#DC2626', label: 'Refusé' },
}

const EMPTY_FORM = {
  client_nom: '', titre: '', description: '',
  montant_ht: '', taux_tva: '20', statut: 'brouillon', date_validite: '',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function DevisPage() {
  const [user, setUser] = useState<any>(null)
  const [devisList, setDevisList] = useState<Devis[]>([])
  const [clients, setClients] = useState<{ nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDevis, setEditDevis] = useState<Devis | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clientParam = params.get('client')
    if (clientParam) {
      setForm(f => ({ ...f, client_nom: clientParam }))
      setShowForm(true)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await Promise.all([loadDevis(user.id), loadClients(user.id)])
      setLoading(false)
    }
    init()
  }, [])

  const loadDevis = async (userId: string) => {
    const { data } = await supabase
      .from('devis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setDevisList(data || [])
  }

  const loadClients = async (userId: string) => {
    const { data } = await supabase
      .from('clients')
      .select('nom')
      .eq('user_id', userId)
      .order('nom')
    setClients(data || [])
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const openAdd = () => {
    setEditDevis(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (d: Devis) => {
    setEditDevis(d)
    setForm({
      client_nom: d.client_nom,
      titre: d.titre,
      description: d.description || '',
      montant_ht: String(d.montant_ht),
      taux_tva: String(d.taux_tva),
      statut: d.statut,
      date_validite: d.date_validite || '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.client_nom.trim() || !form.titre.trim() || !form.montant_ht) {
      setError('Client, titre et montant HT sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    const ht = parseFloat(form.montant_ht)
    const tva = parseFloat(form.taux_tva) || 0
    const payload = {
      client_nom: form.client_nom.trim(),
      titre: form.titre.trim(),
      description: form.description,
      montant_ht: ht,
      taux_tva: tva,
      statut: form.statut,
      date_validite: form.date_validite || null,
    }
    if (editDevis) {
      const { error: err } = await supabase.from('devis').update(payload).eq('id', editDevis.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('devis').insert({ ...payload, user_id: user.id })
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowForm(false)
    await loadDevis(user.id)
    showToast(editDevis ? '✓ Devis mis à jour' : '✓ Devis créé')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devis ?')) return
    await supabase.from('devis').delete().eq('id', id)
    setDevisList(l => l.filter(d => d.id !== id))
    showToast('Devis supprimé')
  }

  const handleStatutChange = async (id: string, statut: string) => {
    await supabase.from('devis').update({ statut }).eq('id', id)
    setDevisList(l => l.map(d => d.id === id ? { ...d, statut: statut as Devis['statut'] } : d))
  }

  const handleConvertToFacture = async (d: Devis) => {
    setConverting(d.id)
    const tvaRate = Number(d.taux_tva) || 0
    const tvaAmount = Number(d.montant_ht) * (tvaRate / 100)
    const { error: err } = await supabase.from('factures').insert({
      user_id: user.id,
      client_nom: d.client_nom,
      montant_ht: d.montant_ht,
      tva: tvaRate,
      tva_montant: tvaAmount,
      montant_ttc: Number(d.montant_ht) + tvaAmount,
      description: `[Converti depuis devis] ${d.titre}${d.description ? ' — ' + d.description : ''}`,
      statut: 'brouillon',
    })
    if (err) {
      setConverting(null)
      showToast('Erreur : ' + err.message)
      return
    }
    await supabase.from('devis').update({ statut: 'accepté' }).eq('id', d.id)
    setDevisList(l => l.map(x => x.id === d.id ? { ...x, statut: 'accepté' as const } : x))
    setConverting(null)
    showToast('⚡ Facture créée depuis le devis !')
  }

  const filtered = filterStatut === 'tous'
    ? devisList
    : devisList.filter(d => d.statut === filterStatut)

  const totalAccepte = devisList.filter(d => d.statut === 'accepté').reduce((s, d) => s + d.montant_ht, 0)
  const totalEnCours = devisList.filter(d => d.statut === 'envoyé').reduce((s, d) => s + d.montant_ht, 0)
  const ht = parseFloat(form.montant_ht) || 0
  const ttcPreview = ht * (1 + (parseFloat(form.taux_tva) || 0) / 100)

  if (loading) return (
    <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {/* Toast */}
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
                fontSize: '13px', fontWeight: '500',
                color: l.href === '/devis' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
                background: l.href === '/devis' ? 'rgba(200,151,58,0.12)' : 'transparent',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Devis</h1>
            <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>{devisList.length} devis au total</p>
          </div>
          <button onClick={openAdd}
            style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Nouveau devis
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Devis acceptés', value: fmt(totalAccepte), sub: `${devisList.filter(d => d.statut === 'accepté').length} devis`, accent: true },
            { label: 'En attente', value: fmt(totalEnCours), sub: `${devisList.filter(d => d.statut === 'envoyé').length} envoyés`, accent: false },
            { label: 'Brouillons', value: String(devisList.filter(d => d.statut === 'brouillon').length), sub: 'À finaliser', accent: false },
            { label: 'Taux acceptation', value: devisList.length > 0 ? `${Math.round(devisList.filter(d => d.statut === 'accepté').length / devisList.length * 100)}%` : '—', sub: 'Sur tous les devis', accent: false },
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

        {/* Form */}
        {showForm && (
          <div style={{ background: '#fff', border: '2px solid #C8973A', borderRadius: '16px', padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', margin: '0 0 20px' }}>
              {editDevis ? '✏️ Modifier le devis' : '+ Nouveau devis'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={lbl}>Client *</label>
                <input
                  list="clients-list"
                  placeholder="Nom du client ou société"
                  value={form.client_nom}
                  onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))}
                  style={inp}
                />
                <datalist id="clients-list">
                  {clients.map(c => <option key={c.nom} value={c.nom} />)}
                </datalist>
              </div>
              <div>
                <label style={lbl}>Titre du devis *</label>
                <input
                  placeholder="Ex: Développement site vitrine"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  style={inp}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Description / Détail des prestations</label>
                <textarea
                  placeholder="Décrivez les prestations incluses…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={lbl}>Montant HT (€) *</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.montant_ht}
                  onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Taux TVA (%)</label>
                <select value={form.taux_tva} onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))} style={inp}>
                  <option value="0">0% (exonéré)</option>
                  <option value="5.5">5,5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Valide jusqu'au</label>
                <input type="date" value={form.date_validite} onChange={e => setForm(f => ({ ...f, date_validite: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={inp}>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoyé">Envoyé</option>
                  <option value="accepté">Accepté</option>
                  <option value="refusé">Refusé</option>
                </select>
              </div>
            </div>

            {ht > 0 && (
              <div style={{ marginTop: '16px', background: '#FAF8F4', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div><span style={{ fontSize: '12px', color: '#8A92A3' }}>HT </span><span style={{ fontFamily: 'Georgia,serif', fontWeight: '700', color: '#0B1F45' }}>{fmt(ht)}</span></div>
                <div style={{ color: '#8A92A3' }}>+</div>
                <div><span style={{ fontSize: '12px', color: '#8A92A3' }}>TVA </span><span style={{ fontFamily: 'Georgia,serif', fontWeight: '700', color: '#0B1F45' }}>{fmt(ht * (parseFloat(form.taux_tva) || 0) / 100)}</span></div>
                <div style={{ color: '#8A92A3' }}>=</div>
                <div><span style={{ fontSize: '12px', color: '#8A92A3' }}>TTC </span><span style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#C8973A' }}>{fmt(ttcPreview)}</span></div>
              </div>
            )}

            {error && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : (editDevis ? 'Mettre à jour' : 'Créer le devis')}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ background: 'transparent', border: '1px solid rgba(11,31,69,0.2)', color: '#0B1F45', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['tous', 'brouillon', 'envoyé', 'accepté', 'refusé'].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                background: filterStatut === s ? '#0B1F45' : '#fff',
                color: filterStatut === s ? '#fff' : '#4A5568',
                boxShadow: filterStatut === s ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              {s === 'tous' ? 'Tous' : STATUT_STYLE[s]?.label}
              {s !== 'tous' && (
                <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>
                  {devisList.filter(d => d.statut === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
              <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>
                {filterStatut !== 'tous' ? `Aucun devis "${filterStatut}"` : 'Aucun devis pour l\'instant'}
              </p>
              <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Cliquez sur « + Nouveau devis » pour commencer.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                  {['Client', 'Titre', 'Montant HT', 'TTC', 'Validité', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const ttc = d.montant_ttc ?? d.montant_ht * (1 + d.taux_tva / 100)
                  const isConverting = converting === d.id
                  return (
                    <tr key={d.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{d.client_nom}</div>
                        <div style={{ fontSize: '11px', color: '#8A92A3' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td style={{ padding: '14px 18px', maxWidth: '200px' }}>
                        <div style={{ fontWeight: '500', fontSize: '13px', color: '#0B1F45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</div>
                        {d.description && <div style={{ fontSize: '11px', color: '#8A92A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</div>}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: '#0B1F45' }}>{fmt(d.montant_ht)}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: '#C8973A' }}>{fmt(ttc)}</span>
                        <div style={{ fontSize: '11px', color: '#8A92A3' }}>TVA {d.taux_tva}%</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: d.date_validite && new Date(d.date_validite) < new Date() ? '#DC2626' : '#8A92A3' }}>
                        {d.date_validite ? new Date(d.date_validite).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <select
                          value={d.statut}
                          onChange={e => handleStatutChange(d.id, e.target.value)}
                          style={{
                            padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            background: STATUT_STYLE[d.statut]?.bg || '#F3F4F6',
                            color: STATUT_STYLE[d.statut]?.color || '#6B7280',
                          }}
                        >
                          {Object.entries(STATUT_STYLE).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {d.statut !== 'refusé' && (
                            <button
                              onClick={() => handleConvertToFacture(d)}
                              disabled={isConverting}
                              title="Convertir en facture en 1 clic"
                              style={{
                                background: isConverting ? '#8A92A3' : '#0B1F45',
                                color: '#C8973A', border: 'none', padding: '5px 12px',
                                borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: isConverting ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isConverting ? '⏳' : '⚡'} Facturer
                            </button>
                          )}
                          <button onClick={() => openEdit(d)}
                            style={{ background: 'rgba(11,31,69,0.06)', border: 'none', color: '#0B1F45', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(d.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            🗑
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

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(11,31,69,0.2)',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff',
  color: '#0B1F45', boxSizing: 'border-box',
}
