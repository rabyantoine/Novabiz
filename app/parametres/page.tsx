'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

const EMPTY_FORM = {
  nom_entreprise: '',
  siret: '',
  adresse: '',
  ville: '',
  code_postal: '',
  telephone: '',
  email_pro: '',
  site_web: '',
  notes: '',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)',
  borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff',
  color: '#0B1F45', boxSizing: 'border-box',
}

export default function Parametres() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await loadProfil(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadProfil = async (userId: string) => {
    const { data } = await supabase
      .from('profil')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) {
      setForm({
        nom_entreprise: data.nom_entreprise || '',
        siret: data.siret || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        code_postal: data.code_postal || '',
        telephone: data.telephone || '',
        email_pro: data.email_pro || '',
        site_web: data.site_web || '',
        notes: data.notes || '',
      })
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profil').upsert({
      user_id: user.id,
      nom_entreprise: form.nom_entreprise,
      siret: form.siret,
      adresse: form.adresse,
      ville: form.ville,
      code_postal: form.code_postal,
      telephone: form.telephone,
      email_pro: form.email_pro,
      site_web: form.site_web,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (error) {
      showToast('❌ Erreur : ' + error.message)
    } else {
      showToast('✓ Profil sauvegardé avec succès')
    }
  }

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
                fontSize: '13px', fontWeight: '500', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '8px',
                color: l.href === '/parametres' ? '#C8973A' : 'rgba(255,255,255,0.55)',
                background: l.href === '/parametres' ? 'rgba(200,151,58,0.12)' : 'transparent',
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

      <div style={{ padding: '36px 2rem', maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Paramètres</h1>
          <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>Informations de votre entreprise utilisées sur vos documents</p>
        </div>

        {/* KPI-style info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Entreprise', value: form.nom_entreprise || '—', sub: form.siret ? `SIRET ${form.siret}` : 'SIRET non renseigné', accent: true },
            { label: 'Localisation', value: form.ville || '—', sub: form.code_postal || 'Code postal non renseigné', accent: false },
            { label: 'Contact', value: form.telephone || '—', sub: form.email_pro || 'Email non renseigné', accent: false },
          ].map((k, i) => (
            <div key={i} style={{
              background: k.accent ? '#0B1F45' : '#fff',
              border: `1px solid ${k.accent ? 'transparent' : 'rgba(11,31,69,0.1)'}`,
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: k.accent ? '#C8973A' : '#0B1F45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '20px', padding: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 24px' }}>Informations de l'entreprise</h2>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Nom entreprise */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nom de l'entreprise / Raison sociale</label>
                <input
                  type="text"
                  placeholder="Ex : SARL Dupont, Auto-entrepreneur Jean Martin…"
                  value={form.nom_entreprise}
                  onChange={e => setForm(f => ({ ...f, nom_entreprise: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* SIRET */}
              <div>
                <label style={lbl}>SIRET</label>
                <input
                  type="text"
                  placeholder="XXX XXX XXX XXXXX"
                  value={form.siret}
                  onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label style={lbl}>Téléphone</label>
                <input
                  type="tel"
                  placeholder="06 00 00 00 00"
                  value={form.telephone}
                  onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Email pro */}
              <div>
                <label style={lbl}>Email professionnel</label>
                <input
                  type="email"
                  placeholder="contact@monentreprise.fr"
                  value={form.email_pro}
                  onChange={e => setForm(f => ({ ...f, email_pro: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Site web */}
              <div>
                <label style={lbl}>Site web</label>
                <input
                  type="url"
                  placeholder="https://www.monentreprise.fr"
                  value={form.site_web}
                  onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Adresse */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Adresse</label>
                <input
                  type="text"
                  placeholder="15 rue de la Paix"
                  value={form.adresse}
                  onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Ville */}
              <div>
                <label style={lbl}>Ville</label>
                <input
                  type="text"
                  placeholder="Paris"
                  value={form.ville}
                  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Code postal */}
              <div>
                <label style={lbl}>Code postal</label>
                <input
                  type="text"
                  placeholder="75001"
                  value={form.code_postal}
                  onChange={e => setForm(f => ({ ...f, code_postal: e.target.value }))}
                  style={inp}
                />
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notes internes</label>
                <textarea
                  placeholder="Mentions légales, informations complémentaires à faire apparaître sur vos factures…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#C8973A', color: '#fff', border: 'none',
                  padding: '12px 32px', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Enregistrement…' : '💾 Sauvegarder'}
              </button>
              <span style={{ fontSize: '12px', color: '#8A92A3' }}>Les modifications sont sauvegardées dans votre profil</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
