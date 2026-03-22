'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) window.location.href = '/login'
      else setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) return <div style={{background:'#0B1F45',minHeight:'100vh'}}></div>

  return (
    <div style={{minHeight:'100vh',background:'#FAF8F4',fontFamily:'sans-serif'}}>
      <nav style={{background:'#0B1F45',padding:'0 2rem',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'700',color:'#fff'}}>Nova<span style={{color:'#C8973A'}}>Biz</span></div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'14px',color:'rgba(255,255,255,0.6)'}}>{user.email}</span>
          <button onClick={handleLogout} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'7px 16px',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}>
            Déconnexion
          </button>
        </div>
      </nav>
      <div style={{padding:'40px 2rem',maxWidth:'1100px',margin:'0 auto'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'28px',fontWeight:'800',color:'#0B1F45',marginBottom:'8px'}}>
          Bonjour 👋
        </h1>
        <p style={{fontSize:'14px',color:'#8A92A3',marginBottom:'32px'}}>Bienvenue sur NovaBiz — votre espace de gestion</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px'}}>
          {[
            {label:'Factures ce mois',val:'0',sub:'Créez votre première facture'},
            {label:'Impayés',val:'0€',sub:'Aucun impayé'},
            {label:'Projets actifs',val:'0',sub:'Aucun projet en cours'},
            {label:'Notes de frais',val:'0€',sub:'Aucune dépense ce mois'},
          ].map((k,i) => (
            <div key={i} style={{background:'#fff',border:'1px solid rgba(11,31,69,0.1)',borderRadius:'16px',padding:'20px'}}>
              <div style={{fontSize:'12px',color:'#8A92A3',marginBottom:'6px'}}>{k.label}</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'28px',fontWeight:'800',color:'#0B1F45'}}>{k.val}</div>
              <div style={{fontSize:'12px',color:'#8A92A3',marginTop:'4px'}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'32px',background:'#fff',border:'1px solid rgba(11,31,69,0.1)',borderRadius:'16px',padding:'32px',textAlign:'center'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🚀</div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'700',color:'#0B1F45',marginBottom:'8px'}}>Votre compte est prêt !</h2>
          <p style={{fontSize:'14px',color:'#8A92A3'}}>Les modules factures, relances et projets arrivent très bientôt.</p>
        </div>
      </div>
    </div>
  )
}