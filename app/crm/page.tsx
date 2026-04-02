'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'

type Client = {
  id: string
  user_id: string
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  notes: string
  created_at: string
}

type ClientWithStats = Client & {
  nb_factures: number
  ca_total: number
  last_facture: string | null
}

const NAV = [
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

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  brouillon: { bg: '#F3F4F6', color: '#6B7280' },
  envoyée: { bg: '#FEF3C7', color: '#D97706' },
  payée: { bg: '#D1FAE5', color: '#059669' },
}

const EMPTY_FORM = {
  nom: '', email: '', telephone: '', adresse: '', ville: '', notes: '',
}

export default function CRM() {
  const [user, setUser] = useState<any>(null)
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [clientFactures, setClientFactures] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await loadClients(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadClients = async (userId: string) => {
    const { data: clientsRaw } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const { data: factures } = await supabase
      .from('factures')
      .select('client_nom, montant_ht, created_at')
      .eq('user_id', userId)

    const enriched = (clientsRaw || []).map((c: Client) => {
      const facts = (factures || []).filter(f => f.client_nom === c.nom)
      return {
        ...c,
        nb_factures: facts.length,
        ca_total: facts.reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0),
        last_facture: facts.length > 0
          ? facts.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0].created_at
          : null,
      }
    })
    setClients(enriched)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const openAdd = () => {
    setEditClient(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: ClientWithStats) => {
    setEditClient(c)
    setForm({ nom: c.nom, email: c.email, telephone: c.telephone, adresse: c.adresse, ville: c.ville || '', notes: c.notes || '' })
    setError('')
    setShowForm(true)
    setSelectedClient(null)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError('')
    if (editClient) {
      const { error: err } = await supabase.from('clients').update({
        nom: form.nom, email: form.email, telephone: form.telephone,
        adresse: form.adresse, ville: form.ville, notes: form.notes,
      }).eq('id', editClient.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('clients').insert({
        user_id: user.id,
        nom: form.nom, email: form.email, telephone: form.telephone,
        adresse: form.adresse, ville: form.ville, notes: form.notes,
      })
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowForm(false)
    await loadClients(user.id)
    showToast(editClient ? '✓ Client mis à jour' : '✓ Client ajouté')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await supabase.from('clients').delete().eq('id', id)
    setClients(c => c.filter(x => x.id !== id))
    if (selectedClient?.id === id) setSelectedClient(null)
    showToast('Client supprimé')
  }

  const openDetail = async (c: ClientWithStats) => {
    setSelectedClient(c)
    setShowForm(false)
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_nom', c.nom)
      .order('created_at', { ascending: false })
    setClientFactures(data || [])
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const filtered = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ville || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalCA = clients.reduce((s, c) => s + c.ca_total, 0)
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  if (loading) return <SkeletonLoader rows={6} stats={4} cols={[26, 18, 12, 10, 12, 14]} />

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
                color: l.href === '/crm' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
                background: l.href === '/crm' ? 'rgba(200,151,58,0.12)' : 'transparent',
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

      <div style={{ padding: '36px 2rem', maxWidth: '1300px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>CRM Clients</h1>
            <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
              {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={openAdd}
            style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Nouveau client
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total clients', value: String(clients.length), sub: `+${newThisMonth} ce mois`, accent: true },
            { label: 'CA total généré', value: fmt(totalCA), sub: 'Toutes factures confondues', accent: false },
            { label: 'Avec factures', value: String(clients.filter(c => c.nb_factures > 0).length), sub: 'Clients actifs', accent: false },
            { label: 'CA moyen / client', value: clients.length > 0 ? fmt(totalCA / clients.length) : '—', sub: 'Valeur moyenne', accent: false },
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

        <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1fr 380px' : '1fr', gap: '24px' }}>
          {/* Left: list */}
          <div>
            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍  Rechercher un client (nom, email, ville…)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '11px 16px', border: '1px solid rgba(11,31,69,0.15)', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {/* Form */}
            {showForm && (
              <div style={{ background: '#fff', border: '2px solid #C8973A', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', margin: '0 0 20px' }}>
                  {editClient ? '✏️ Modifier le client' : '+ Nouveau client'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { key: 'nom', label: 'Nom / Raison sociale *', placeholder: 'Ex: SARL Dupont', type: 'text' },
                    { key: 'email', label: 'Email', placeholder: 'contact@exemple.fr', type: 'email' },
                    { key: 'telephone', label: 'Téléphone', placeholder: '06 00 00 00 00', type: 'tel' },
                    { key: 'ville', label: 'Ville', placeholder: 'Paris', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px' }}>{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px' }}>Adresse</label>
                    <input
                      type="text"
                      placeholder="15 rue de la Paix"
                      value={form.adresse}
                      onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px' }}>Notes internes</label>
                    <textarea
                      placeholder="Informations utiles, conditions particulières…"
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {error && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Enregistrement…' : (editClient ? 'Mettre à jour' : 'Ajouter le client')}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    style={{ background: 'transparent', border: '1px solid rgba(11,31,69,0.2)', color: '#0B1F45', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                search ? (
                  <div style={{ padding: '56px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>Aucun résultat</p>
                    <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Essayez un autre terme de recherche.</p>
                  </div>
                ) : (
                  <div style={{ margin: '16px', borderRadius: '14px', background: 'rgba(11,31,69,0.02)', border: '2px dashed rgba(11,31,69,0.1)', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(200,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#C8973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="24" cy="16" r="9"/>
                        <path d="M7 42c0-9.389 7.611-17 17-17s17 7.611 17 17"/>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 8px' }}>Votre carnet d'adresses est vide</p>
                      <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, maxWidth: '340px', lineHeight: '1.5' }}>Ajoutez vos premiers clients pour centraliser leurs informations et suivre votre activité.</p>
                    </div>
                    <button
                      onClick={openAdd}
                      style={{ marginTop: '8px', background: '#C8973A', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      + Ajouter mon premier client
                    </button>
                  </div>
                )
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
                      {['Client', 'Contact', 'Ville', 'Factures', 'CA total', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c.id}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,31,69,0.06)' : 'none', background: selectedClient?.id === c.id ? 'rgba(200,151,58,0.04)' : 'transparent', cursor: 'pointer' }}
                        onClick={() => openDetail(c)}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0B1F45', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                              {c.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#0B1F45' }}>{c.nom}</div>
                              {c.last_facture && <div style={{ fontSize: '11px', color: '#8A92A3' }}>Dernière facture : {new Date(c.last_facture).toLocaleDateString('fr-FR')}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {c.email && <div style={{ fontSize: '13px', color: '#0B1F45' }}>{c.email}</div>}
                          {c.telephone && <div style={{ fontSize: '12px', color: '#8A92A3' }}>{c.telephone}</div>}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8A92A3' }}>{c.ville || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {c.nb_factures}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: '#0B1F45' }}>{fmt(c.ca_total)}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(c)}
                              style={{ background: 'rgba(11,31,69,0.06)', border: 'none', color: '#0B1F45', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                              ✏️ Éditer
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
                </table>
              )}
            </div>
          </div>

          {/* Right: client detail panel */}
          {selectedClient && (
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '24px', height: 'fit-content', position: 'sticky', top: '80px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#0B1F45', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: '700', fontSize: '18px' }}>
                    {selectedClient.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45' }}>{selectedClient.nom}</div>
                    <div style={{ fontSize: '12px', color: '#8A92A3' }}>Client depuis {new Date(selectedClient.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)}
                  style={{ background: 'transparent', border: 'none', color: '#8A92A3', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              {/* Contact info */}
              <div style={{ background: '#FAF8F4', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                {[
                  { icon: '✉️', val: selectedClient.email },
                  { icon: '📞', val: selectedClient.telephone },
                  { icon: '📍', val: [selectedClient.adresse, selectedClient.ville].filter(Boolean).join(', ') },
                ].filter(r => r.val).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#4A5568' }}>
                    <span>{r.icon}</span><span>{r.val}</span>
                  </div>
                ))}
                {selectedClient.notes && (
                  <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '8px', borderTop: '1px solid rgba(11,31,69,0.08)', paddingTop: '8px', fontStyle: 'italic' }}>
                    {selectedClient.notes}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#0B1F45', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>CA TOTAL</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#C8973A' }}>{fmt(selectedClient.ca_total)}</div>
                </div>
                <div style={{ background: '#FAF8F4', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#8A92A3', marginBottom: '4px' }}>FACTURES</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45' }}>{selectedClient.nb_factures}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => openEdit(selectedClient)}
                  style={{ flex: 1, background: '#0B1F45', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ✏️ Modifier
                </button>
                <a href={`/devis?client=${encodeURIComponent(selectedClient.nom)}`}
                  style={{ flex: 1, background: '#C8973A', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📄 Devis
                </a>
              </div>

              {/* Factures history */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Historique factures</div>
                {clientFactures.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#8A92A3', textAlign: 'center', padding: '16px 0' }}>Aucune facture</p>
                ) : (
                  clientFactures.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(11,31,69,0.06)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45' }}>
                          {f.description ? (f.description.length > 30 ? f.description.substring(0, 30) + '…' : f.description) : 'Facture'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8A92A3' }}>{new Date(f.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Georgia,serif', fontSize: '13px', fontWeight: '700', color: '#0B1F45' }}>
                          {Number(f.montant_ht || 0).toLocaleString('fr-FR')} €
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                          background: STATUT_COLORS[f.statut]?.bg || '#F3F4F6',
                          color: STATUT_COLORS[f.statut]?.color || '#6B7280',
                        }}>
                          {f.statut}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
