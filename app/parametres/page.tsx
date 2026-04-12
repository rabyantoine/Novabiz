'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Nav from '@/components/Nav'
import IbanInput from '../../components/IbanInput'
import { validateIban } from '../../lib/validateIban'

// ─── Styles communs ───────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '5px',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid rgba(11,31,69,0.2)',
  borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff',
  color: '#0B1F45', boxSizing: 'border-box',
}

// ─── Modules disponibles ──────────────────────────────────────────────────────
const MODULES = [
  { key: 'dashboard',    label: '📊 Dashboard' },
  { key: 'factures',     label: '🧾 Factures' },
  { key: 'devis',        label: '📝 Devis' },
  { key: 'catalogue',    label: '📦 Catalogue' },
  { key: 'crm',          label: '👥 CRM' },
  { key: 'frais',        label: '💸 Frais' },
  { key: 'relances',     label: '🔔 Relances' },
  { key: 'planning',     label: '📅 Planning' },
  { key: 'rapports',     label: '📈 Rapports' },
  { key: 'classeur',     label: '🗂 Classeur' },
  { key: 'fournisseurs', label: '🏭 Fournisseurs' },
  { key: 'achats',       label: '🛒 Achats' },
  { key: 'banque',       label: '🏦 Banque' },
  { key: 'rh',           label: '👤 RH' },
  { key: 'messages',     label: '✉️ Messages' },
  { key: 'parametres',   label: '⚙️ Paramètres' },
]

type Permission = { can_read: boolean; can_write: boolean; can_delete: boolean }
type PermMap = Record<string, Permission>
type Member = {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  statut: string
  created_at: string
  permissions: PermMap
}

const EMPTY_FORM = {
  nom_entreprise: '', siret: '', iban: '', adresse: '', ville: '',
  code_postal: '', telephone: '', email_pro: '', site_web: '', notes: '',
}

const emptyPerms = (): PermMap =>
  Object.fromEntries(MODULES.map(m => [m.key, { can_read: false, can_write: false, can_delete: false }]))

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Parametres() {
  const [user, setUser]       = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'entreprise' | 'equipe'>('entreprise')
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')

  // ── Équipe
  const [members, setMembers]           = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteNom, setInviteNom]       = useState('')
  const [invitePrenom, setInvitePrenom] = useState('')
  const [inviting, setInviting]         = useState(false)
  const [editMember, setEditMember]     = useState<Member | null>(null)
  const [editPerms, setEditPerms]       = useState<PermMap>(emptyPerms())
  const [savingPerms, setSavingPerms]   = useState(false)

  // ─── Init ─────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (user && activeTab === 'equipe') loadMembers(user.id)
  }, [activeTab, user])

  // ─── Profil ───────────────────────────────────────────────────────────────
  const loadProfil = async (userId: string) => {
    const { data } = await supabase.from('profil').select('*').eq('user_id', userId).single()
    if (data) {
      setForm({
        nom_entreprise: data.nom_entreprise || '',
        siret: data.siret || '',
        iban: data.iban || '',
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
    if (form.iban && !validateIban(form.iban).valid) { showToast('❌ IBAN invalide'); return }
    setSaving(true)
    const { error } = await supabase.from('profil').upsert({
      user_id: user.id,
      nom_entreprise: form.nom_entreprise, siret: form.siret, iban: form.iban,
      adresse: form.adresse, ville: form.ville, code_postal: form.code_postal,
      telephone: form.telephone, email_pro: form.email_pro, site_web: form.site_web,
      notes: form.notes, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    error ? showToast('❌ Erreur : ' + error.message) : showToast('✓ Profil sauvegardé avec succès')
  }

  // ─── Équipe ───────────────────────────────────────────────────────────────
  const loadMembers = async (ownerId: string) => {
    setLoadingMembers(true)
    const { data: mems } = await supabase
      .from('team_members')
      .select('id, email, nom, prenom, statut, created_at')
      .eq('owner_id', ownerId)
      .order('created_at')

    if (!mems) { setLoadingMembers(false); return }

    const membersWithPerms: Member[] = await Promise.all(
      mems.map(async (m) => {
        const { data: perms } = await supabase
          .from('team_permissions')
          .select('module, can_read, can_write, can_delete')
          .eq('member_id', m.id)

        const permMap: PermMap = emptyPerms()
        ;(perms || []).forEach(p => {
          permMap[p.module] = { can_read: p.can_read, can_write: p.can_write, can_delete: p.can_delete }
        })
        return { ...m, permissions: permMap }
      })
    )

    setMembers(membersWithPerms)
    setLoadingMembers(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)

    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('owner_id', user.id)
      .eq('email', inviteEmail.trim())
      .single()

    if (existing) {
      showToast('❌ Ce membre existe déjà')
      setInviting(false)
      return
    }

    const { error } = await supabase.from('team_members').insert({
      owner_id: user.id,
      email: inviteEmail.trim(),
      nom: inviteNom.trim() || null,
      prenom: invitePrenom.trim() || null,
      statut: 'invite',
    })

    setInviting(false)
    if (error) { showToast('❌ Erreur : ' + error.message); return }

    showToast('✓ Invitation créée — partagez le lien à votre collaborateur')
    setInviteEmail('')
    setInviteNom('')
    setInvitePrenom('')
    await loadMembers(user.id)
  }

  const openEditPerms = (member: Member) => {
    setEditMember(member)
    // Clone deep
    const clone: PermMap = {}
    MODULES.forEach(m => {
      clone[m.key] = { ...(member.permissions[m.key] || { can_read: false, can_write: false, can_delete: false }) }
    })
    setEditPerms(clone)
  }

  const togglePerm = (module: string, field: 'can_read' | 'can_write' | 'can_delete') => {
    setEditPerms(prev => {
      const updated = { ...prev, [module]: { ...prev[module], [field]: !prev[module][field] } }
      // can_write ou can_delete implique can_read
      if ((field === 'can_write' || field === 'can_delete') && !prev[module][field]) {
        updated[module].can_read = true
      }
      // Si on retire can_read, on retire aussi write et delete
      if (field === 'can_read' && prev[module].can_read) {
        updated[module].can_write = false
        updated[module].can_delete = false
      }
      return updated
    })
  }

  const savePerms = async () => {
    if (!editMember) return
    setSavingPerms(true)

    // Upsert toutes les permissions
    const rows = MODULES.map(m => ({
      member_id: editMember.id,
      module: m.key,
      can_read: editPerms[m.key].can_read,
      can_write: editPerms[m.key].can_write,
      can_delete: editPerms[m.key].can_delete,
    }))

    const { error } = await supabase
      .from('team_permissions')
      .upsert(rows, { onConflict: 'member_id,module' })

    setSavingPerms(false)
    if (error) { showToast('❌ Erreur : ' + error.message); return }

    showToast('✓ Permissions sauvegardées')
    setEditMember(null)
    await loadMembers(user.id)
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Supprimer ce membre ? Il perdra tous ses accès.')) return
    await supabase.from('team_members').delete().eq('id', memberId)
    await loadMembers(user.id)
    showToast('✓ Membre supprimé')
  }

  const getInviteLink = (member: Member) => {
    // Le token est dans la table, on l'affiche via la colonne invite_token
    return `Lien d'invitation envoyé à ${member.email}`
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#0B1F45', color: '#C8973A', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Modal permissions */}
      {editMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>
                  Permissions — {editMember.prenom || ''} {editMember.nom || editMember.email}
                </h2>
                <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>{editMember.email}</p>
              </div>
              <button onClick={() => setEditMember(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#8A92A3', lineHeight: 1 }}>✕</button>
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[{ label: '👁 Lire', sub: 'Voir le module' }, { label: '✏️ Modifier', sub: 'Créer et éditer' }, { label: '🗑 Supprimer', sub: 'Supprimer des données' }].map((l, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#8A92A3' }}><strong style={{ color: '#0B1F45' }}>{l.label}</strong> — {l.sub}</div>
              ))}
            </div>

            {/* Grille permissions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '6px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase' }}>Module</div>
                {['Lire', 'Modifier', 'Supprimer'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', textAlign: 'center' }}>{h}</div>
                ))}
              </div>

              {MODULES.map(m => {
                const p = editPerms[m.key]
                return (
                  <div key={m.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '10px 12px', background: p.can_read ? 'rgba(11,31,69,0.03)' : '#fff', borderRadius: '10px', border: '1px solid rgba(11,31,69,0.07)', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#0B1F45' }}>{m.label}</span>
                    {(['can_read', 'can_write', 'can_delete'] as const).map(field => (
                      <div key={field} style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => togglePerm(m.key, field)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: p[field] ? '#0B1F45' : 'rgba(11,31,69,0.07)',
                            color: p[field] ? '#C8973A' : '#8A92A3',
                            fontSize: '15px', transition: 'all 0.15s',
                          }}
                        >
                          {p[field] ? '✓' : ''}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Actions rapides */}
            <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
              {[
                { label: 'Tout autoriser', action: () => setEditPerms(Object.fromEntries(MODULES.map(m => [m.key, { can_read: true, can_write: true, can_delete: true }]))) },
                { label: 'Lecture seule', action: () => setEditPerms(Object.fromEntries(MODULES.map(m => [m.key, { can_read: true, can_write: false, can_delete: false }]))) },
                { label: 'Tout retirer', action: () => setEditPerms(emptyPerms()) },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{ background: 'rgba(11,31,69,0.07)', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: '#0B1F45', cursor: 'pointer' }}>
                  {a.label}
                </button>
              ))}
            </div>

            {/* Save */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(11,31,69,0.1)' }}>
              <button onClick={() => setEditMember(null)} style={{ background: 'none', border: '1px solid rgba(11,31,69,0.2)', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', color: '#0B1F45', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={savePerms} disabled={savingPerms} style={{ background: '#C8973A', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontSize: '14px', fontWeight: '700', cursor: savingPerms ? 'not-allowed' : 'pointer', opacity: savingPerms ? 0.7 : 1 }}>
                {savingPerms ? 'Enregistrement…' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Nav />

      <div style={{ padding: '36px 2rem', maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Paramètres</h1>
          <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>Gérez votre entreprise et votre équipe</p>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(11,31,69,0.06)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[
            { key: 'entreprise', label: '🏢 Entreprise' },
            { key: 'equipe',     label: '👥 Équipe' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? '#0B1F45' : 'transparent',
                color: activeTab === tab.key ? '#C8973A' : '#8A92A3',
                border: 'none', borderRadius: '9px', padding: '9px 22px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ ONGLET ENTREPRISE ══════════════════ */}
        {activeTab === 'entreprise' && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Entreprise', value: form.nom_entreprise || '—', sub: form.siret ? `SIRET ${form.siret}` : 'SIRET non renseigné', accent: true },
                { label: 'Localisation', value: form.ville || '—', sub: form.code_postal || 'Code postal non renseigné', accent: false },
                { label: 'Contact', value: form.telephone || '—', sub: form.email_pro || 'Email non renseigné', accent: false },
              ].map((k, i) => (
                <div key={i} style={{ background: k.accent ? '#0B1F45' : '#fff', border: `1px solid ${k.accent ? 'transparent' : 'rgba(11,31,69,0.1)'}`, borderRadius: '16px', padding: '22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: k.accent ? '#C8973A' : '#0B1F45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</div>
                  <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Formulaire */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '20px', padding: '32px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 24px' }}>Informations de l'entreprise</h2>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Nom de l'entreprise / Raison sociale</label>
                    <input type="text" placeholder="Ex : SARL Dupont…" value={form.nom_entreprise} onChange={e => setForm(f => ({ ...f, nom_entreprise: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>SIRET</label>
                    <input type="text" placeholder="XXX XXX XXX XXXXX" value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <IbanInput label="IBAN" value={form.iban} onChange={val => setForm(f => ({ ...f, iban: val }))} />
                  </div>
                  <div>
                    <label style={lbl}>Téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email professionnel</label>
                    <input type="email" placeholder="contact@monentreprise.fr" value={form.email_pro} onChange={e => setForm(f => ({ ...f, email_pro: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Site web</label>
                    <input type="url" placeholder="https://www.monentreprise.fr" value={form.site_web} onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Adresse</label>
                    <input type="text" placeholder="15 rue de la Paix" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Ville</label>
                    <input type="text" placeholder="Paris" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Code postal</label>
                    <input type="text" placeholder="75001" value={form.code_postal} onChange={e => setForm(f => ({ ...f, code_postal: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Notes internes</label>
                    <textarea placeholder="Mentions légales…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} style={{ ...inp, resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ marginTop: '28px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" disabled={saving} style={{ background: '#C8973A', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Enregistrement…' : '💾 Sauvegarder'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#8A92A3' }}>Les modifications sont sauvegardées dans votre profil</span>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ══════════════════ ONGLET ÉQUIPE ══════════════════ */}
        {activeTab === 'equipe' && (
          <>
            {/* Inviter un membre */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>Inviter un collaborateur</h2>
              <p style={{ fontSize: '13px', color: '#8A92A3', margin: '0 0 20px' }}>Le collaborateur recevra un lien pour rejoindre votre espace NovaBiz.</p>
              <form onSubmit={handleInvite}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <label style={lbl}>Prénom</label>
                    <input type="text" placeholder="Marie" value={invitePrenom} onChange={e => setInvitePrenom(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Nom</label>
                    <input type="text" placeholder="Dupont" value={inviteNom} onChange={e => setInviteNom(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input type="email" placeholder="marie@exemple.fr" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required style={inp} />
                  </div>
                  <button type="submit" disabled={inviting} style={{ background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.7 : 1, whiteSpace: 'nowrap', height: '42px' }}>
                    {inviting ? '…' : '+ Inviter'}
                  </button>
                </div>
              </form>
            </div>

            {/* Liste membres */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: '0 0 20px' }}>
                Membres de l'équipe
                {members.length > 0 && <span style={{ fontSize: '14px', fontWeight: '400', color: '#8A92A3', marginLeft: '10px' }}>{members.length} membre{members.length > 1 ? 's' : ''}</span>}
              </h2>

              {loadingMembers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                  <div style={{ width: '24px', height: '24px', border: '2px solid rgba(11,31,69,0.15)', borderTopColor: '#0B1F45', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8A92A3' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                  <p style={{ fontSize: '14px', margin: 0 }}>Aucun collaborateur pour l'instant.<br />Invitez votre première personne ci-dessus.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {members.map(m => {
                    const nbModules = MODULES.filter(mod => m.permissions[mod.key]?.can_read).length
                    const statutColor = m.statut === 'actif' ? { bg: '#EAF3DE', color: '#27500A' } : m.statut === 'invite' ? { bg: '#FAEEDA', color: '#633806' } : { bg: '#FAECE7', color: '#712B13' }
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#FAF8F4', borderRadius: '14px', border: '1px solid rgba(11,31,69,0.07)', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Avatar + infos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0B1F45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#C8973A', flexShrink: 0 }}>
                            {(m.prenom?.[0] || m.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0B1F45' }}>
                              {m.prenom || ''} {m.nom || ''} {!m.prenom && !m.nom ? m.email : ''}
                            </div>
                            {(m.prenom || m.nom) && <div style={{ fontSize: '12px', color: '#8A92A3' }}>{m.email}</div>}
                            <div style={{ fontSize: '11px', color: '#8A92A3', marginTop: '2px' }}>{nbModules} module{nbModules !== 1 ? 's' : ''} accessibles</div>
                          </div>
                        </div>
                        {/* Statut + actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', background: statutColor.bg, color: statutColor.color }}>
                            {m.statut === 'actif' ? 'Actif' : m.statut === 'invite' ? 'Invité' : 'Suspendu'}
                          </span>
                          <button onClick={() => openEditPerms(m)} style={{ background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            ⚙️ Permissions
                          </button>
                          <button onClick={() => removeMember(m.id)} style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            🗑
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ marginTop: '16px', padding: '14px 18px', background: 'rgba(11,31,69,0.04)', borderRadius: '12px', border: '1px solid rgba(11,31,69,0.08)' }}>
              <p style={{ fontSize: '12px', color: '#8A92A3', margin: 0 }}>
                ℹ️ Les collaborateurs invités doivent créer un compte NovaBiz avec leur adresse email pour accéder à votre espace. Une fois connectés, ils verront uniquement les modules pour lesquels vous leur avez accordé un accès.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}