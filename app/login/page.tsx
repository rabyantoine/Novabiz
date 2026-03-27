'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else window.location.href = '/dashboard'
  }

  return (
    <div style={{minHeight:'100vh',background:'#0B1F45',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:'16px',padding:'40px',width:'100%',maxWidth:'400px'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'24px',fontWeight:'800',color:'#0B1F45',marginBottom:'8px'}}>
          Nova<span style={{color:'#C8973A'}}>Biz</span>
        </div>
        <p style={{fontSize:'14px',color:'#8A92A3',marginBottom:'28px'}}>Connectez-vous à votre compte</p>
        <div style={{marginBottom:'16px'}}>
          <label style={{fontSize:'12px',fontWeight:'600',color:'#4A5568',display:'block',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
            style={{width:'100%',border:'1px solid rgba(11,31,69,0.2)',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',color:'#0B1F45',background:'#fff'}}/>
        </div>
        <div style={{marginBottom:'24px'}}>
          <label style={{fontSize:'12px',fontWeight:'600',color:'#4A5568',display:'block',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{width:'100%',border:'1px solid rgba(11,31,69,0.2)',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',color:'#0B1F45',background:'#fff'}}/>
        </div>
        {message && <p style={{color:'red',fontSize:'13px',marginBottom:'16px'}}>{message}</p>}
        <button onClick={handleLogin}
          style={{width:'100%',background:'#C8973A',border:'none',color:'#fff',padding:'13px',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
          Se connecter →
        </button>
        <p style={{textAlign:'center',fontSize:'13px',color:'#8A92A3',marginTop:'20px'}}>
          Pas encore de compte ? <a href="/signup" style={{color:'#C8973A',fontWeight:'600'}}>S&apos;inscrire</a>
        </p>
      </div>
    </div>
  )
}