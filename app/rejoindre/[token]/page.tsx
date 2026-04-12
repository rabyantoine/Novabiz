'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Status = 'loading' | 'valid' | 'expired' | 'already' | 'error' | 'success'

export default function RejoindreToken() {
  const params  = useParams()
  const router  = useRouter()
  const token   = params?.token as string

  const [status, setStatus]     = useState<Status>('loading')
  const [member, setMember]     = useState<any>(null)
  const [owner, setOwner]       = useState<string>('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [joining, setJoining]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    const check = async () => {
      if (!token) { setStatus('error'); return }

      const { data: mem } = await supabase
        .from('team_members')
        .select('id, email, nom, prenom, statut, invite_expires_at, owner_id')
        .eq('invite_token', token)
        .maybeSingle()

      if (!mem) { setStatus('error'); return }
      if (mem.statut === 'actif') { setStatus('already'); return }
      if (mem.invite_expires_at && new Date(mem.invite_expires_at) < new Date()) {
        setStatus('expired'); return
      }

      const { data: profil } = await supabase
        .from('profil')
        .select('nom_entreprise')
        .eq('user_id', mem.owner_id)
        .maybeSingle()

      setMember(mem)
      setEmail(mem.email)
      setOwner(profil?.nom_entreprise || 'NovaBiz')
      setStatus('valid')
    }
    check()
  }, [token])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8)  { setError('Minimum 8 caractères.'); return }
    setJoining(true)

    // Créer ou connecter le compte
    let userId: string | null = null
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({ email, password })
    if (signUpErr || !signUp.user) {
      const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr || !signIn.user) { setError('Erreur : ' + (signUpErr?.message || signInErr?.message)); setJoining(false); return }
      userId = signIn.user.id
    } else {
      userId = signUp.user.id
    }

    // Lier le membre et activer
    const { error: updateErr } = await supabase
      .from('team_members')
      .update({ member_user_id: userId, statut: 'actif', invite_token: null })
      .eq('invite_token', token)

    if (updateErr) { setError('Erreur activation : ' + updateErr.message); setJoining(false); return }

    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid rgba(11,31,69,0.2)',
    borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff',
    color: '#0B1F45', boxSizing: 'border-box',
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: '#0B1F45', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#FAF8F4', borderRadius: '24px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: '#0B1F45' }}>
            Nova<span style={{ color: '#C8973A' }}>Biz</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  )

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#0B1F45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (status === 'error') return <Wrap><div style={{ textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>✗</div><h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: '0 0 8px' }}>Lien invalide</h1><p style={{ fontSize: '14px', color: '#8A92A3', margin: '0 0 24px' }}>Ce lien n'existe pas ou a déjà été utilisé.</p><a href="/login" style={{ color: '#C8973A', fontSize: '14px', fontWeight: '600' }}>← Connexion</a></div></Wrap>

  if (status === 'expired') return <Wrap><div style={{ textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div><h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: '0 0 8px' }}>Invitation expirée</h1><p style={{ fontSize: '14px', color: '#8A92A3', margin: '0 0 24px' }}>Validité 7 jours. Demandez un nouveau lien à votre administrateur.</p><a href="/login" style={{ color: '#C8973A', fontSize: '14px', fontWeight: '600' }}>← Connexion</a></div></Wrap>

  if (status === 'already') return <Wrap><div style={{ textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div><h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: '0 0 8px' }}>Déjà actif</h1><p style={{ fontSize: '14px', color: '#8A92A3', margin: '0 0 24px' }}>Compte déjà activé. Connectez-vous normalement.</p><a href="/login" style={{ display: 'inline-block', background: '#C8973A', color: '#fff', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>Se connecter</a></div></Wrap>

  if (status === 'success') return <Wrap><div style={{ textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div><h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: '0 0 8px' }}>Bienvenue !</h1><p style={{ fontSize: '14px', color: '#8A92A3' }}>Votre accès est activé. Redirection…</p></div></Wrap>

  return (
    <Wrap>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', color: '#C8973A', fontWeight: '600', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invitation</p>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '24px', fontWeight: '800', color: '#0B1F45', margin: '0 0 6px' }}>Rejoindre {owner}</h1>
        <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>Créez votre accès pour collaborer sur NovaBiz.</p>
      </div>

      {member && (
        <div style={{ background: 'rgba(11,31,69,0.05)', borderRadius: '12px', padding: '12px 14px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0B1F45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#C8973A', flexShrink: 0 }}>
            {(member.prenom?.[0] || email[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45' }}>{member.prenom || ''} {member.nom || ''}</div>
            <div style={{ fontSize: '12px', color: '#8A92A3' }}>{member.email}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleJoin}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '4px' }}>Email</label>
            <input type="email" value={email} readOnly style={{ ...inp, background: 'rgba(11,31,69,0.04)', color: '#8A92A3' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '4px' }}>Mot de passe</label>
            <input type="password" placeholder="8 caractères minimum" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0B1F45', marginBottom: '4px' }}>Confirmer</label>
            <input type="password" placeholder="Répéter le mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inp} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', fontSize: '13px', color: '#B91C1C' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={joining} style={{ marginTop: '22px', width: '100%', background: '#C8973A', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '15px', fontWeight: '700', cursor: joining ? 'not-allowed' : 'pointer', opacity: joining ? 0.7 : 1 }}>
          {joining ? 'Activation…' : 'Activer mon accès →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#8A92A3', marginTop: '14px' }}>
          Déjà un compte ? <a href="/login" style={{ color: '#C8973A', fontWeight: '600' }}>Se connecter</a>
        </p>
      </form>
    </Wrap>
  )
}
