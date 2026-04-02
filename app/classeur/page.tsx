'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Navbar from '../components/Navbar'

type Client = { id: string; nom: string; email: string; telephone: string; ville: string }
type Devis = { id: string; client_id: string | null; client_nom: string; titre: string; montant_ht: number; statut: string; created_at: string }
type Facture = { id: string; client_id: string | null; client_nom: string; numero_facture: string; montant_ht: number; montant_ttc: number; statut: string; date_emission: string; date_echeance: string }
type Relance = { id: string; client_id: string | null; client_nom: string; montant: number; statut: string; created_at: string }
type Dossier = { client: Client; devis: Devis[]; factures: Facture[]; relances: Relance[]; ca_total: number; ca_paye: number }

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  accepte:    { label: 'Accepté',    color: '#16a34a', bg: '#dcfce7' },
  en_attente: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  refuse:     { label: 'Refusé',     color: '#dc2626', bg: '#fee2e2' },
  paye:       { label: 'Payée',      color: '#16a34a', bg: '#dcfce7' },
  payee:      { label: 'Payée',      color: '#16a34a', bg: '#dcfce7' },
  envoye:     { label: 'Envoyée',    color: '#2563eb', bg: '#dbeafe' },
  envoyee:    { label: 'Envoyée',    color: '#2563eb', bg: '#dbeafe' },
  brouillon:  { label: 'Brouillon',  color: '#6b7280', bg: '#f3f4f6' },
}

function Badge({ statut }: { statut: string }) {
  const s = BADGE[statut?.toLowerCase()] ?? { label: statut, color: '#6b7280', bg: '#f3f4f6' }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
}

export default function ClasseurPage() {
  const router = useRouter()
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [tab, setTab] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      loadData()
    })
  }, [])

  async function loadData() {
    const [{ data: clients }, { data: devis }, { data: factures }, { data: relances }] = await Promise.all([
      supabase.from('clients').select('*').order('nom'),
      supabase.from('devis').select('*'),
      supabase.from('factures').select('*'),
      supabase.from('relances').select('*'),
    ])
    const list: Dossier[] = (clients ?? []).map((c: Client) => {
      const cDevis = (devis ?? []).filter((d: Devis) => d.client_id === c.id || d.client_nom === c.nom)
      const cFactures = (factures ?? []).filter((f: Facture) => f.client_id === c.id || f.client_nom === c.nom)
      const cRelances = (relances ?? []).filter((r: Relance) => r.client_id === c.id || r.client_nom === c.nom)
      const ca_total = cFactures.reduce((s: number, f: Facture) => s + (f.montant_ttc || 0), 0)
      const ca_paye = cFactures.filter((f: Facture) => ['paye', 'payee'].includes(f.statut?.toLowerCase())).reduce((s: number, f: Facture) => s + (f.montant_ttc || 0), 0)
      return { client: c, devis: cDevis, factures: cFactures, relances: cRelances, ca_total, ca_paye }
    })
    setDossiers(list)
    setLoading(false)
  }

  const filtered = dossiers.filter(d => d.client.nom.toLowerCase().includes(search.toLowerCase()))
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  const initials = (nom: string) => nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#0B1F45' }}>Chargement du classeur…</div>
    </div>
  )

  return (
    <>
    <Navbar />
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>📁 Classeur clients</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Tous vos dossiers regroupés par client</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Clients', value: dossiers.length },
            { label: 'CA total', value: fmt(dossiers.reduce((s, d) => s + d.ca_total, 0)) },
            { label: 'CA encaissé', value: fmt(dossiers.reduce((s, d) => s + d.ca_paye, 0)) },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5e7eb' }}>
              <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ color: '#0B1F45', fontWeight: 700, fontSize: 20 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un client…"
          style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
        />

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            Aucun client. <a href="/crm" style={{ color: '#C8973A', fontWeight: 600 }}>Ajouter un client →</a>
          </div>
        )}

        {filtered.map(({ client, devis, factures, relances, ca_total, ca_paye }) => {
          const isOpen = open === client.id
          const currentTab = tab[client.id] ?? 'factures'
          return (
            <div key={client.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 12, overflow: 'hidden' }}>

              <button
                onClick={() => setOpen(isOpen ? null : client.id)}
                style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0B1F45', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {initials(client.nom)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0B1F45', fontSize: 15 }}>{client.nom}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{client.email || client.ville || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginRight: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>CA total</div>
                    <div style={{ fontWeight: 700, color: '#0B1F45', fontSize: 14 }}>{fmt(ca_total)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Encaissé</div>
                    <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>{fmt(ca_paye)}</div>
                  </div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 20px 20px' }}>
                  <div style={{ display: 'flex', marginBottom: 16, marginTop: 16, borderBottom: '1px solid #e5e7eb' }}>
                    {[
                      { id: 'factures', label: `Factures (${factures.length})` },
                      { id: 'devis', label: `Devis (${devis.length})` },
                      { id: 'relances', label: `Relances (${relances.length})` },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTab(prev => ({ ...prev, [client.id]: t.id }))}
                        style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: currentTab === t.id ? 700 : 400, color: currentTab === t.id ? '#0B1F45' : '#9ca3af', borderBottom: currentTab === t.id ? '2px solid #C8973A' : '2px solid transparent', marginBottom: -1 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {currentTab === 'factures' && (
                    factures.length === 0
                      ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune facture</p>
                      : factures.map((f: Facture) => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0B1F45' }}>{f.numero_facture}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{f.date_emission ? new Date(f.date_emission).toLocaleDateString('fr-FR') : '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge statut={f.statut} />
                            <span style={{ fontWeight: 700, color: '#0B1F45' }}>{fmt(f.montant_ttc)}</span>
                          </div>
                        </div>
                      ))
                  )}

                  {currentTab === 'devis' && (
                    devis.length === 0
                      ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucun devis</p>
                      : devis.map((d: Devis) => (
                        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0B1F45' }}>{d.titre || 'Sans titre'}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge statut={d.statut} />
                            <span style={{ fontWeight: 700, color: '#0B1F45' }}>{fmt(d.montant_ht)}</span>
                          </div>
                        </div>
                      ))
                  )}

                  {currentTab === 'relances' && (
                    relances.length === 0
                      ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune relance</p>
                      : relances.map((r: Relance) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0B1F45' }}>Relance</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge statut={r.statut} />
                            <span style={{ fontWeight: 700, color: '#0B1F45' }}>{fmt(r.montant)}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}
