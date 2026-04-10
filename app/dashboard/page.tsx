'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import Nav from '@/components/Nav'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler)

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

function KpiCard({ label, value, sub, accent, trend }: {
  label: string
  value: string
  sub: string
  accent?: boolean
  trend?: number | null
}) {
  return (
    <div style={{
      background: accent ? '#0B1F45' : '#fff',
      border: `1px solid ${accent ? 'transparent' : 'rgba(11,31,69,0.08)'}`,
      borderRadius: '16px',
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: '800', color: accent ? '#C8973A' : '#0B1F45', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: accent ? 'rgba(255,255,255,0.4)' : '#8A92A3' }}>{sub}</span>
        {trend !== null && trend !== undefined && (
          <span style={{ fontSize: '11px', fontWeight: '700', color: trend >= 0 ? '#059669' : '#DC2626' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}

function Alert({ type, msg }: { type: 'danger' | 'warn' | 'info'; msg: string }) {
  const styles = {
    danger: { bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C', icon: '🔴' },
    warn:   { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', icon: '⚠️' },
    info:   { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', icon: 'ℹ️' },
  }
  const s = styles[type]
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{s.icon}</span>
      <span style={{ fontSize: '13px', color: s.text, fontWeight: '500' }}>{msg}</span>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    caMois: 0, caAvant: 0, tvaMois: 0,
    impayes: 0, nbImpayes: 0,
    nbClients: 0, chargesMois: 0, nbFacturesMois: 0,
  })
  const [chart, setChart] = useState<{ label: string; ca: number; charges: number }[]>([])
  const [topClients, setTopClients] = useState<{ nom: string; total: number }[]>([])
  const [echeances, setEcheances] = useState<{ client_nom: string; montant_ttc: number; date_echeance: string }[]>([])
  const [alerts, setAlerts] = useState<{ type: 'danger' | 'warn' | 'info'; msg: string }[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await load(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const load = async (uid: string) => {
    const now = new Date()
    const y = now.getFullYear(), mo = now.getMonth()
    const firstMois  = new Date(y, mo, 1).toISOString().split('T')[0]
    const firstAvant = new Date(y, mo - 1, 1).toISOString().split('T')[0]
    const endAvant   = new Date(y, mo, 0).toISOString().split('T')[0]
    const debut12    = new Date(y, mo - 11, 1).toISOString().split('T')[0]
    const today      = now.toISOString().split('T')[0]
    const in30       = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]

    const [
      { data: fMois },
      { data: fAvant },
      { data: fImp },
      { data: fraisMois },
      { data: clients },
      { data: f12m },
      { data: frais12m },
      { data: ech },
    ] = await Promise.all([
      supabase.from('factures').select('montant_ht,tva_montant,statut').eq('user_id', uid).gte('date_emission', firstMois),
      supabase.from('factures').select('montant_ht').eq('user_id', uid).gte('date_emission', firstAvant).lte('date_emission', endAvant),
      supabase.from('factures').select('montant_ttc,date_echeance').eq('user_id', uid).eq('statut', 'envoyée'),
      supabase.from('frais').select('montant').eq('user_id', uid).gte('date', firstMois),
      supabase.from('clients').select('id').eq('user_id', uid),
      supabase.from('factures').select('montant_ht,date_emission,client_nom').eq('user_id', uid).gte('date_emission', debut12),
      supabase.from('frais').select('montant,date').eq('user_id', uid).gte('date', debut12),
      supabase.from('factures').select('client_nom,montant_ttc,date_echeance').eq('user_id', uid).eq('statut', 'envoyée').gte('date_echeance', today).lte('date_echeance', in30).order('date_echeance'),
    ])

    const caMois     = (fMois || []).reduce((s, f) => s + Number(f.montant_ht || 0), 0)
    const caAvant    = (fAvant || []).reduce((s, f) => s + Number(f.montant_ht || 0), 0)
    const tvaMois    = (fMois || []).reduce((s, f) => s + Number(f.tva_montant || 0), 0)
    const impayes    = (fImp || []).reduce((s, f) => s + Number(f.montant_ttc || 0), 0)
    const chargesMois = (fraisMois || []).reduce((s, f) => s + Number(f.montant || 0), 0)

    setKpis({ caMois, caAvant, tvaMois, impayes, nbImpayes: (fImp || []).length, nbClients: (clients || []).length, chargesMois, nbFacturesMois: (fMois || []).length })
    setEcheances((ech || []).slice(0, 5))

    // Graphique 12 mois
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(y, mo - 11 + i, 1)
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      const my = d.getFullYear(), mm = d.getMonth()
      const ca = (f12m || [])
        .filter(f => { const fd = new Date(f.date_emission); return fd.getFullYear() === my && fd.getMonth() === mm })
        .reduce((s, f) => s + Number(f.montant_ht || 0), 0)
      const charges = (frais12m || [])
        .filter(f => { const fd = new Date(f.date); return fd.getFullYear() === my && fd.getMonth() === mm })
        .reduce((s, f) => s + Number(f.montant || 0), 0)
      return { label, ca, charges }
    })
    setChart(months)

    // Top clients
    const clientMap: Record<string, number> = {}
    ;(f12m || []).forEach(f => {
      const k = f.client_nom || 'Inconnu'
      clientMap[k] = (clientMap[k] || 0) + Number(f.montant_ht || 0)
    })
    setTopClients(Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, total]) => ({ nom, total })))

    // Alertes
    const al: { type: 'danger' | 'warn' | 'info'; msg: string }[] = []
    const retards = (fImp || []).filter(f => f.date_echeance && f.date_echeance < today)
    if (retards.length > 0) al.push({ type: 'danger', msg: `${retards.length} facture${retards.length > 1 ? 's' : ''} en retard de paiement` })
    if (tvaMois > 0) al.push({ type: 'warn', msg: `TVA à reverser ce mois : ${fmt(tvaMois)}` })
    if ((fImp || []).length > 0) al.push({ type: 'info', msg: `${(fImp || []).length} facture${(fImp || []).length > 1 ? 's' : ''} en attente de paiement (${fmt(impayes)})` })
    setAlerts(al)
  }

  if (loading) {
    return (
      <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const trend = kpis.caAvant > 0 ? ((kpis.caMois - kpis.caAvant) / kpis.caAvant) * 100 : null
  const totalCA12m = chart.reduce((s, m) => s + m.ca, 0)
  const maxClient = topClients[0]?.total || 1

  const chartData = {
    labels: chart.map(m => m.label),
    datasets: [
      {
        label: 'CA HT',
        data: chart.map(m => m.ca),
        backgroundColor: 'rgba(11,31,69,0.85)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Dépenses',
        data: chart.map(m => m.charges),
        backgroundColor: 'rgba(200,151,58,0.75)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#8A92A3', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#0B1F45',
        titleColor: 'rgba(255,255,255,0.6)',
        bodyColor: '#C8973A',
        padding: 12,
        callbacks: { label: (ctx: any) => ` ${fmt(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8A92A3', font: { size: 11 } }, border: { display: false } },
      y: {
        grid: { color: 'rgba(11,31,69,0.06)' },
        ticks: { color: '#8A92A3', font: { size: 11 }, callback: (v: any) => `${(v / 1000).toFixed(0)}k€` },
        border: { display: false },
      },
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      <Nav />
      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {/* Raccourcis rapides */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '+ Facture', href: '/factures' },
              { label: '+ Devis', href: '/devis' },
              { label: '+ Client', href: '/crm' },
              { label: '+ Dépense', href: '/frais' },
            ].map(b => (
              <a key={b.href} href={b.href} style={{
                background: '#0B1F45', color: '#C8973A', border: 'none',
                borderRadius: '10px', padding: '8px 16px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {b.label}
              </a>
            ))}
          </div>
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {alerts.map((a, i) => <Alert key={i} type={a.type} msg={a.msg} />)}
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <KpiCard label="CA du mois HT" value={fmt(kpis.caMois)} sub={`${kpis.nbFacturesMois} facture${kpis.nbFacturesMois !== 1 ? 's' : ''} ce mois`} accent trend={trend} />
          <KpiCard label="TVA collectée" value={fmt(kpis.tvaMois)} sub="À reverser sur CA du mois" />
          <KpiCard label="Impayés" value={fmt(kpis.impayes)} sub={`${kpis.nbImpayes} facture${kpis.nbImpayes !== 1 ? 's' : ''} en attente`} />
          <KpiCard label="Dépenses du mois" value={fmt(kpis.chargesMois)} sub={`Marge nette : ${fmt(kpis.caMois - kpis.chargesMois)}`} />
        </div>

        {/* Graphique + Top clients */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '24px' }}>

          {/* Graphique CA vs Dépenses */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 3px' }}>
                  CA vs Dépenses — 12 mois
                </h2>
                <p style={{ fontSize: '12px', color: '#8A92A3', margin: 0 }}>Chiffre d'affaires HT et frais mensuels</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45' }}>{fmt(totalCA12m)}</div>
                <div style={{ fontSize: '11px', color: '#8A92A3' }}>CA total 12 mois</div>
              </div>
            </div>
            <div style={{ height: '260px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Top 5 clients */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 16px' }}>
              Top clients — 12 mois
            </h2>
            {topClients.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8A92A3' }}>Aucune donnée</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {topClients.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#C8973A' }}>{fmt(c.total)}</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(11,31,69,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.total / maxClient) * 100}%`, background: i === 0 ? '#0B1F45' : '#C8973A', borderRadius: '10px', opacity: 1 - i * 0.12 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Échéances + Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Prochaines échéances */}
          <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 16px' }}>
              Échéances à venir (30j)
            </h2>
            {echeances.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8A92A3' }}>Aucune échéance dans les 30 prochains jours 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {echeances.map((e, i) => {
                  const daysLeft = Math.ceil((new Date(e.date_echeance).getTime() - Date.now()) / 86400000)
                  const urgent = daysLeft <= 7
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: urgent ? '#FEF2F2' : '#F8F9FC', borderRadius: '10px', border: `1px solid ${urgent ? '#FCA5A5' : 'rgba(11,31,69,0.06)'}` }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F45' }}>{e.client_nom}</div>
                        <div style={{ fontSize: '11px', color: urgent ? '#DC2626' : '#8A92A3' }}>
                          {fmtDate(e.date_echeance)} · dans {daysLeft}j
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: '700', color: urgent ? '#DC2626' : '#0B1F45' }}>
                        {fmt(Number(e.montant_ttc))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
            {[
              { icon: '🧾', title: 'Factures ce mois', value: `${kpis.nbFacturesMois}`, href: '/factures' },
              { icon: '⚠️', title: 'Impayées', value: `${kpis.nbImpayes}`, href: '/relances' },
              { icon: '👥', title: 'Clients', value: `${kpis.nbClients}`, href: '/crm' },
              { icon: '📊', title: 'Rapports', value: 'Voir', href: '/rapports' },
            ].map((item, i) => (
              <a key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.08)', borderRadius: '16px', padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#C8973A')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(11,31,69,0.08)')}
                >
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '11px', color: '#8A92A3', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45' }}>{item.value}</div>
                </div>
              </a>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}