'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Nav from '@/components/Nav'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type KPIs = {
  caMois: number
  tvaMois: number
  impayes: number
  chargesMois: number
  margeNette: number
  nbFacturesMois: number
  nbImpayes: number
  nbClients: number
}

type ChartMonth = { label: string; ca: number }

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? '#0B1F45' : '#fff',
      border: `1px solid ${accent ? 'transparent' : 'rgba(11,31,69,0.1)'}`,
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: '600', color: accent ? 'rgba(255,255,255,0.55)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: '30px', fontWeight: '800', color: accent ? '#C8973A' : '#0B1F45', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: accent ? 'rgba(255,255,255,0.45)' : '#8A92A3' }}>{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [chartData, setChartData] = useState<ChartMonth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await loadData(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadData = async (userId: string) => {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    // 12 months window
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]

    const [
      { data: facturesMois },
      { data: facturesImpayes },
      { data: chargesData },
      { data: clientsData },
      { data: factures12m },
    ] = await Promise.all([
      supabase
        .from('factures')
        .select('montant_ht, tva_montant, montant_ttc, statut')
        .eq('user_id', userId)
        .gte('date_emission', firstOfMonth),
      supabase
        .from('factures')
        .select('montant_ttc, date_echeance')
        .eq('user_id', userId)
        .eq('statut', 'envoyée'),
      supabase
        .from('charges')
        .select('montant')
        .eq('user_id', userId)
        .gte('date_charge', firstOfMonth),
      supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('factures')
        .select('montant_ht, date_emission')
        .eq('user_id', userId)
        .gte('date_emission', twelveMonthsAgo),
    ])

    const caMois = (facturesMois || []).reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)
    const tvaMois = (facturesMois || []).reduce((s, f) => s + (Number(f.tva_montant) || 0), 0)
    const impayes = (facturesImpayes || []).reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0)
    const nbImpayes = (facturesImpayes || []).length
    const chargesMois = (chargesData || []).reduce((s, c) => s + (Number(c.montant) || 0), 0)
    const margeNette = caMois - chargesMois

    setKpis({
      caMois,
      tvaMois,
      impayes,
      chargesMois,
      margeNette,
      nbFacturesMois: (facturesMois || []).length,
      nbImpayes,
      nbClients: clientsData?.length ?? 0,
    })

    // Build 12-month chart
    const months: ChartMonth[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      const y = d.getFullYear()
      const m = d.getMonth()
      const ca = (factures12m || [])
        .filter(f => {
          if (!f.date_emission) return false
          const fd = new Date(f.date_emission)
          return fd.getFullYear() === y && fd.getMonth() === m
        })
        .reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)
      months.push({ label, ca })
    }
    setChartData(months)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user || loading) {
    return (
      <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const chartJsData = {
    labels: chartData.map(m => m.label),
    datasets: [{
      label: 'CA HT (€)',
      data: chartData.map(m => m.ca),
      fill: true,
      borderColor: '#C8973A',
      backgroundColor: 'rgba(200,151,58,0.12)',
      pointBackgroundColor: '#C8973A',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.4,
      borderWidth: 2.5,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0B1F45',
        titleColor: 'rgba(255,255,255,0.6)',
        bodyColor: '#C8973A',
        bodyFont: { family: 'Georgia, serif', size: 16, weight: 'bold' as const },
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8A92A3', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(11,31,69,0.06)' },
        ticks: {
          color: '#8A92A3',
          font: { size: 11 },
          callback: (v: any) => `${(v / 1000).toFixed(0)}k€`,
        },
        border: { display: false },
      },
    },
  }

  const totalCA12m = chartData.reduce((s, m) => s + m.ca, 0)
  const prevMonth = chartData[10]?.ca ?? 0
  const curMonth = chartData[11]?.ca ?? 0
  const evol = prevMonth > 0 ? ((curMonth - prevMonth) / prevMonth) * 100 : null

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      <Nav />

      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <KpiCard
            label="CA du mois HT"
            value={fmt(kpis!.caMois)}
            sub={`${kpis!.nbFacturesMois} facture${kpis!.nbFacturesMois !== 1 ? 's' : ''} ce mois`}
            accent
          />
          <KpiCard
            label="TVA collectée"
            value={fmt(kpis!.tvaMois)}
            sub="À reverser sur CA du mois"
          />
          <KpiCard
            label="Impayés"
            value={fmt(kpis!.impayes)}
            sub={`${kpis!.nbImpayes} facture${kpis!.nbImpayes !== 1 ? 's' : ''} en attente`}
          />
          <KpiCard
            label="Marge nette"
            value={fmt(kpis!.margeNette)}
            sub={`Charges : ${fmt(kpis!.chargesMois)}`}
          />
        </div>

        {/* Chart */}
        <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', margin: '0 0 4px' }}>
                Évolution du CA sur 12 mois
              </h2>
              <p style={{ fontSize: '12px', color: '#8A92A3', margin: 0 }}>Chiffre d'affaires HT mensuel</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '800', color: '#0B1F45' }}>{fmt(totalCA12m)}</div>
              <div style={{ fontSize: '12px', color: '#8A92A3' }}>
                Total 12 mois
                {evol !== null && (
                  <span style={{ marginLeft: '8px', color: evol >= 0 ? '#059669' : '#DC2626', fontWeight: '600' }}>
                    {evol >= 0 ? '▲' : '▼'} {Math.abs(evol).toFixed(0)}% vs mois préc.
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <Line data={chartJsData} options={chartOptions} />
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            {
              icon: '🧾',
              title: 'Factures ce mois',
              value: `${kpis!.nbFacturesMois}`,
              link: '/factures',
              linkLabel: 'Voir les factures →',
            },
            {
              icon: '⚠️',
              title: 'Factures impayées',
              value: `${kpis!.nbImpayes}`,
              link: '/factures',
              linkLabel: 'Gérer les relances →',
            },
            {
              icon: '👥',
              title: 'Clients actifs',
              value: `${kpis!.nbClients}`,
              link: '#',
              linkLabel: 'Voir les clients →',
            },
            {
              icon: '💰',
              title: 'Charges du mois',
              value: fmt(kpis!.chargesMois),
              link: '#',
              linkLabel: 'Voir les charges →',
            },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '12px', color: '#8A92A3', marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', marginBottom: '10px' }}>{item.value}</div>
              <a href={item.link} style={{ fontSize: '12px', color: '#C8973A', fontWeight: '600', textDecoration: 'none' }}>{item.linkLabel}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
