'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'

type ComptableAcces = {
  id: string
  user_id: string
  nom_comptable: string
  email_comptable: string
  token: string
  actif: boolean
  derniere_visite: string | null
  created_at: string
}

export default function ComptablePage() {
  const router = useRouter()
  const [accesList, setAccesList] = useState<ComptableAcces[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom_comptable: '', email_comptable: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      loadAcces(session.user.id)
    })
  }, [])

  async function loadAcces(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('comptable_acces')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setAccesList(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom_comptable || !form.email_comptable) return
    setSubmitting(true)
    const { error } = await supabase.from('comptable_acces').insert({
      user_id: userId,
      nom_comptable: form.nom_comptable,
      email_comptable: form.email_comptable,
    })
    if (!error) {
      setForm({ nom_comptable: '', email_comptable: '' })
      setShowForm(false)
      loadAcces(userId)
      showToast('Accès créé avec succès')
    }
    setSubmitting(false)
  }

  async function handleDesactiver(id: string) {
    await supabase.from('comptable_acces').update({ actif: false }).eq('id', id)
    setAccesList(prev => prev.map(a => a.id === id ? { ...a, actif: false } : a))
    showToast('Accès désactivé')
  }

  function copyLink(token: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/comptable/${token}`
    navigator.clipboard.writeText(url)
    showToast('Lien copié dans le presse-papier')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function formatDate(d: string | null) {
    if (!d) return 'Jamais'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'Georgia, serif' }}>
      <Nav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1F45', margin: 0 }}>
            🧑‍💼 Espace Comptable
          </h1>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              background: '#C8973A', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontSize: 14,
              fontFamily: 'Georgia, serif', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {showForm ? 'Annuler' : 'Créer un accès comptable'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff', border: '1px solid #E5DDD0', borderRadius: 12,
              padding: 24, marginBottom: 28,
            }}
          >
            <h2 style={{ fontSize: 16, color: '#0B1F45', marginTop: 0, marginBottom: 20 }}>
              Nouvel accès comptable
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#0B1F45', display: 'block', marginBottom: 6 }}>
                  Nom du comptable
                </label>
                <input
                  value={form.nom_comptable}
                  onChange={e => setForm(f => ({ ...f, nom_comptable: e.target.value }))}
                  placeholder="Ex : Marie Dupont"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1C9BC',
                    borderRadius: 8, fontSize: 14, fontFamily: 'Georgia, serif',
                    background: '#FAF8F4', color: '#0B1F45', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#0B1F45', display: 'block', marginBottom: 6 }}>
                  Email du comptable
                </label>
                <input
                  type="email"
                  value={form.email_comptable}
                  onChange={e => setForm(f => ({ ...f, email_comptable: e.target.value }))}
                  placeholder="comptable@cabinet.fr"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1C9BC',
                    borderRadius: 8, fontSize: 14, fontFamily: 'Georgia, serif',
                    background: '#FAF8F4', color: '#0B1F45', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#0B1F45', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '11px 24px', fontSize: 14,
                  fontFamily: 'Georgia, serif', cursor: 'pointer', fontWeight: 600,
                  alignSelf: 'flex-start',
                }}
              >
                {submitting ? 'Génération…' : 'Générer le lien'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: '#0B1F45', opacity: 0.5 }}>Chargement…</p>
        ) : accesList.length === 0 ? (
          <p style={{ color: '#0B1F45', opacity: 0.5 }}>Aucun accès comptable créé.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {accesList.map(acces => {
              const lien = `${process.env.NEXT_PUBLIC_APP_URL}/comptable/${acces.token}`
              return (
                <div
                  key={acces.id}
                  style={{
                    background: '#fff', border: '1px solid #E5DDD0', borderRadius: 12,
                    padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0B1F45' }}>{acces.nom_comptable}</span>
                      <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 10 }}>{acces.email_comptable}</span>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: acces.actif ? '#D1FAE5' : '#F3F4F6',
                      color: acces.actif ? '#059669' : '#6B7280',
                    }}>
                      {acces.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>

                  <div
                    onClick={() => copyLink(acces.token)}
                    title="Cliquer pour copier"
                    style={{
                      fontSize: 13, color: '#C8973A', cursor: 'pointer',
                      background: '#FEF9F0', border: '1px dashed #C8973A',
                      borderRadius: 6, padding: '7px 12px', wordBreak: 'break-all',
                      userSelect: 'none',
                    }}
                  >
                    🔗 {lien}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      Dernière visite : {formatDate(acces.derniere_visite)}
                    </span>
                    {acces.actif && (
                      <button
                        onClick={() => handleDesactiver(acces.id)}
                        style={{
                          background: 'transparent', color: '#DC2626', border: '1px solid #DC2626',
                          borderRadius: 6, padding: '5px 14px', fontSize: 12,
                          fontFamily: 'Georgia, serif', cursor: 'pointer',
                        }}
                      >
                        Désactiver
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28,
          background: '#0B1F45', color: '#fff', padding: '12px 20px',
          borderRadius: 10, fontSize: 14, fontFamily: 'Georgia, serif',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
