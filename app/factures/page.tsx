'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Facture = {
  id: string
  client: string
  montant: number
  description: string
  date_echeance: string
  statut: 'brouillon' | 'envoyée' | 'payée'
  created_at: string
}

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280' },
  envoyée: { bg: '#FEF3C7', color: '#D97706' },
  payée: { bg: '#D1FAE5', color: '#059669' },
}

export default function Factures() {
  const [user, setUser] = useState<any>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client: '',
    montant: '',
    description: '',
    date_echeance: '',
    statut: 'brouillon',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      fetchFactures(user.id)
    }
    init()
  }, [])

  const fetchFactures = async (userId: string) => {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setFactures(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client || !form.montant) { setError('Client et montant requis.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('factures').insert({
      user_id: user.id,
      client: form.client,
      montant: parseFloat(form.montant),
      description: form.description,
      date_echeance: form.date_echeance || null,
      statut: form.statut,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setForm({ client: '', montant: '', description: '', date_echeance: '', statut: 'brouillon' })
    setShowForm(false)
    fetchFactures(user.id)
  }

  const handleStatutChange = async (id: string, statut: string) => {
    await supabase.from('factures').update({ statut }).eq('id', id)
    fetchFactures(user.id)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('factures').delete().eq('id', id)
    setFactures(f => f.filter(x => x.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalPayé = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + f.montant, 0)
  const totalImpayé = factures.filter(f => f.statut === 'envoyée').reduce((s, f) => s + f.montant, 0)

  if (!user) return <div style={{ background: '#0B1F45', minHeight: '100vh' }}></div>

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#0B1F45', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/dashboard" style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '700', color: '#fff', textDecoration: 'none' }}>
            Nova<span style={{ color: '#C8973A' }}>Biz</span>
          </a>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([
              { label: 'Dashboard', href: '/dashboard', active: false },
              { label: 'Factures', href: '/factures', active: true },
              { label: 'Devis', href: '/devis', active: false },
              { label: 'CRM', href: '/crm', active: false },
              { label: 'Frais', href: '/frais', active: false },
              { label: 'Relances', href: '/relances', active: false },
              { label: 'Planning', href: '/planning', active: false },
            ] as const).map(l => (
              <a key={l.href} href={l.href} style={{
                fontSize: '13px', fontWeight: '500', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '8px',
                color: l.active ? '#C8973A' : 'rgba(255,255,255,0.55)',
                background: l.active ? 'rgba(200,151,58,0.12)' : 'transparent',
              }}>{l.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ padding: '40px 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Factures</h1>
            <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>{factures.length} facture{factures.length !== 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
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
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Client *</label>
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={form.client}
                    onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Montant (€) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.montant}
                    onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Description</label>
                  <textarea
                    placeholder="Détail des prestations..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Date d'échéance</label>
                  <input
                    type="date"
                    value={form.date_echeance}
                    onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0B1F45', marginBottom: '6px' }}>Statut</label>
                  <select
                    value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
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
                  disabled={loading}
                  style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enregistrement...' : 'Créer la facture'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
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
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
              <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>Aucune facture pour l'instant</p>
              <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Cliquez sur « + Nouvelle facture » pour commencer.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                  {['Client', 'Montant', 'Échéance', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < factures.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{f.client}</div>
                      {f.description && <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45' }}>
                        {f.montant.toLocaleString('fr-FR')} €
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#8A92A3' }}>
                      {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
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
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => handleDelete(f.id)}
                        style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
