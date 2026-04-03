'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Client = {
  id: string
  nom: string
  email: string
  telephone: string
  ville: string
}

type Devis = {
  id: string
  client_id: string | null
  client_nom: string
  titre: string
  montant_ht: number
  statut: string
  created_at: string
}

type Facture = {
  id: string
  client_id: string | null
  client_nom: string
  numero_facture: string
  montant_ht: number
  montant_ttc: number
  statut: string
  date_emission: string
  date_echeance: string
}

type Relance = {
  id: string
  client_id: string | null
  client_nom: string
  montant: number
  statut: string
  created_at: string
}

type DossierClient = {
  client: Client
  devis: Devis[]
  factures: Facture[]
  relances: Relance[]
  ca_total: number
  ca_paye: number
  ca_attente: number
  derniere_activite: string
}

const statutBadge: Record<string, { label: string; color: string; bg: string }> = {
  accepte:     { label: 'Accepté',    color: '#16a34a', bg: '#dcfce7' },
  en_attente:  { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  refuse:      { label: 'Refusé',     color: '#dc2626', bg: '#fee2e2' },
  paye:        { label: 'Payée',      color: '#16a34a', bg: '#dcfce7' },
  payee:       { label: 'Payée',      color: '#16a34a', bg: '#dcfce7' },
  envoye:      { label: 'Envoyée',    color: '#2563eb', bg: '#dbeafe' },
  envoyee:     { label: 'Envoyée',    color: '#2563eb', bg: '#dbeafe' },
  brouillon:   { label: 'Brouillon',  color: '#6b7280', bg: '#f3f4f6' },
  envoye_ok:   { label: 'Envoyée',    color: '#2563eb', bg: '#dbeafe' },
}

function Badge({ statut }: { statut: string }) {
  const s = statutBadge[statut?.toLowerCase()] ?? { label: statut, color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
      color: s.color, background: s.bg
    }}>{s.label}</span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ClasseurPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dossiers, setDossiers] = useState<DossierClient[]>([])
  const [search, setSearch] = useState('')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [onglet, setOnglet] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [{ data: clients }, { data: devis }, { data: factures }, { data: relances }] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('nom'),
        supabase.from('devis').select('*').eq('user_id', user.id),
        supabase.from('factures').select('*').eq('user_id', user.id),
        supabase.from('relances').select('*').eq('user_id', user.id),
      ])

      const liste: DossierClient[] = (clients ?? []).map((c: Client) => {
        const dvs = (devis ?? []).filter((d: Devis) =>
          d.client_id === c.id || (!d.client_id && d.client_nom?.toLowerCase().trim() === c.nom?.toLowerCase().trim())
        )
        const fcts = (factures ?? []).filter((f: Facture) =>
          f.client_id === c.id || (!f.client_id && f.client_nom?.toLowerCase().trim() === c.nom?.toLowerCase().trim())
        )
        const rlcs = (relances ?? []).filter((r: Relance) =>
          r.client_id === c.id || (!r.client_id && r.client_nom?.toLowerCase().trim() === c.nom?.toLowerCase().trim())
        )

        const ca_total = fcts.reduce((s: number, f: Facture) => s + (f.montant_ht || 0), 0)
        const ca_paye = fcts.filter((f: Facture) => ['paye','payee'].includes(f.statut?.toLowerCase())).reduce((s: number, f: Facture) => s + (f.montant_ht || 0), 0)
        const ca_attente = ca_total - ca_paye

        const dates = [
          ...dvs.map((d: Devis) => d.created_at),
          ...fcts.map((f: Facture) => f.date_emission),
          ...rlcs.map((r: Relance) => r.created_at),
        ].filter(Boolean).sort().reverse()

        return {
          client: c,
          devis: dvs,
          factures: fcts,
          relances: rlcs,
          ca_total,
          ca_paye,
          ca_attente,
          derniere_activite: dates[0] ?? '',
        }
      })

      setDossiers(liste)
      setLoading(false)
    }
    load()
  }, [router])

  const filtres = dossiers.filter(d =>
    d.client.nom?.toLowerCase().includes(search.toLowerCase()) ||
    d.client.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.client.ville?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDocs = dossiers.reduce((s, d) => s + d.devis.length + d.factures.length + d.relances.length, 0)
  const caTotal = dossiers.reduce((s, d) => s + d.ca_total, 0)
  const caAttente = dossiers.reduce((s, d) => s + d.ca_attente, 0)

  const getOnglet = (id: string) => onglet[id] ?? 'factures'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4' }}>

      <Nav />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(11,31,69,0.08)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#0B1F45', margin: 0 }}>
                📁 Classeur clients
              </h1>
              <p style={{ fontSize: 14, color: '#8A99B4', margin: '4px 0 0' }}>
                Tous vos dossiers et documents par client
              </p>
            </div>
            <button
              onClick={() => router.push('/crm')}
              style={{
                padding: '10px 20px', borderRadius: 10, background: '#0B1F45',
                color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer'
              }}
            >
              + Nouveau client
            </button>
          </div>

          {/* Barre de recherche */}
          <input
            placeholder="Rechercher un client, email, ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              border: '1.5px solid rgba(11,31,69,0.12)', fontSize: 14,
              background: '#FAF8F4', color: '#0B1F45', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Clients', val: dossiers.length, icon: '👥' },
            { label: 'Documents', val: totalDocs, icon: '📄' },
            { label: 'CA total facturé', val: fmt(caTotal), icon: '💰' },
            { label: 'En attente de paiement', val: fmt(caAttente), icon: '⏳', warn: caAttente > 0 },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 14, padding: '20px 24px',
              border: `1.5px solid ${s.warn ? 'rgba(217,119,6,0.25)' : 'rgba(11,31,69,0.08)'}`,
              boxShadow: '0 2px 8px rgba(11,31,69,0.04)'
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.warn ? '#d97706' : '#0B1F45' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#8A99B4', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Liste des dossiers */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8A99B4', fontSize: 14 }}>
            Chargement des dossiers…
          </div>
        ) : filtres.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16,
            border: '1.5px dashed rgba(11,31,69,0.12)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0B1F45', marginBottom: 8 }}>
              {search ? 'Aucun client trouvé' : 'Aucun client dans le CRM'}
            </div>
            <div style={{ fontSize: 14, color: '#8A99B4', marginBottom: 24 }}>
              {search ? 'Essayez un autre terme de recherche' : 'Ajoutez vos premiers clients pour créer des dossiers'}
            </div>
            {!search && (
              <button
                onClick={() => router.push('/crm')}
                style={{
                  padding: '10px 24px', borderRadius: 10, background: '#C8973A',
                  color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer'
                }}
              >
                Aller au CRM →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtres.map(d => {
              const isOpen = ouvert === d.client.id
              const tab = getOnglet(d.client.id)
              const nbDocs = d.devis.length + d.factures.length + d.relances.length

              return (
                <div key={d.client.id} style={{
                  background: '#fff', borderRadius: 16,
                  border: `1.5px solid ${isOpen ? '#0B1F45' : 'rgba(11,31,69,0.08)'}`,
                  overflow: 'hidden', transition: 'border-color 0.15s'
                }}>
                  {/* En-tête du dossier */}
                  <div
                    onClick={() => setOuvert(isOpen ? null : d.client.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 140px 140px 100px 32px',
                      alignItems: 'center', gap: 16,
                      padding: '18px 24px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#0B1F45', color: '#C8973A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 15, flexShrink: 0
                      }}>
                        {d.client.nom?.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0B1F45', fontSize: 15 }}>{d.client.nom}</div>
                        <div style={{ fontSize: 12, color: '#8A99B4', marginTop: 2 }}>
                          {d.client.email || d.client.ville || '—'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1F45' }}>{nbDocs}</div>
                      <div style={{ fontSize: 11, color: '#8A99B4' }}>document{nbDocs > 1 ? 's' : ''}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F45' }}>{fmt(d.ca_total)}</div>
                      <div style={{ fontSize: 11, color: '#8A99B4' }}>CA total HT</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: d.ca_paye > 0 ? '#16a34a' : '#8A99B4' }}>{fmt(d.ca_paye)}</div>
                      <div style={{ fontSize: 11, color: '#8A99B4' }}>encaissé</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#8A99B4' }}>
                        {d.derniere_activite ? fmtDate(d.derniere_activite) : '—'}
                      </div>
                    </div>

                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isOpen ? '#0B1F45' : 'rgba(11,31,69,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isOpen ? '#C8973A' : '#8A99B4', fontSize: 14,
                      transition: 'all 0.15s',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>›</div>
                  </div>

                  {/* Contenu déroulé */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(11,31,69,0.07)' }}>
                      {/* Onglets */}
                      <div style={{ display: 'flex', gap: 0, padding: '0 24px', background: '#FAF8F4', borderBottom: '1px solid rgba(11,31,69,0.07)' }}>
                        {([
                          { key: 'factures', label: `Factures (${d.factures.length})` },
                          { key: 'devis',    label: `Devis (${d.devis.length})` },
                          { key: 'relances', label: `Relances (${d.relances.length})` },
                        ]).map(t => (
                          <button
                            key={t.key}
                            onClick={() => setOnglet(prev => ({ ...prev, [d.client.id]: t.key }))}
                            style={{
                              padding: '12px 20px', border: 'none', cursor: 'pointer',
                              background: 'transparent', fontSize: 13, fontWeight: 600,
                              color: tab === t.key ? '#0B1F45' : '#8A99B4',
                              borderBottom: tab === t.key ? '2px solid #C8973A' : '2px solid transparent',
                              marginBottom: -1
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Contenu onglet */}
                      <div style={{ padding: '16px 24px 20px' }}>
                        {tab === 'factures' && (
                          d.factures.length === 0 ? (
                            <p style={{ color: '#8A99B4', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aucune facture</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ color: '#8A99B4', fontWeight: 600 }}>
                                  {['Numéro', 'Date', 'Échéance', 'Montant HT', 'Statut'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 10px', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {d.factures.map((f: Facture) => (
                                  <tr key={f.id} style={{ borderTop: '1px solid rgba(11,31,69,0.06)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0B1F45' }}>{f.numero_facture || '—'}</td>
                                    <td style={{ padding: '10px 12px', color: '#5A6B88' }}>{fmtDate(f.date_emission)}</td>
                                    <td style={{ padding: '10px 12px', color: '#5A6B88' }}>{fmtDate(f.date_echeance)}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#C8973A' }}>{fmt(f.montant_ht)}</td>
                                    <td style={{ padding: '10px 12px' }}><Badge statut={f.statut} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        )}

                        {tab === 'devis' && (
                          d.devis.length === 0 ? (
                            <p style={{ color: '#8A99B4', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aucun devis</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ color: '#8A99B4' }}>
                                  {['Titre', 'Date', 'Montant HT', 'Statut'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 10px', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {d.devis.map((dv: Devis) => (
                                  <tr key={dv.id} style={{ borderTop: '1px solid rgba(11,31,69,0.06)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0B1F45' }}>{dv.titre || '—'}</td>
                                    <td style={{ padding: '10px 12px', color: '#5A6B88' }}>{fmtDate(dv.created_at)}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#C8973A' }}>{fmt(dv.montant_ht)}</td>
                                    <td style={{ padding: '10px 12px' }}><Badge statut={dv.statut} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        )}

                        {tab === 'relances' && (
                          d.relances.length === 0 ? (
                            <p style={{ color: '#8A99B4', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aucune relance</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ color: '#8A99B4' }}>
                                  {['Date', 'Montant', 'Statut'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 10px', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {d.relances.map((r: Relance) => (
                                  <tr key={r.id} style={{ borderTop: '1px solid rgba(11,31,69,0.06)' }}>
                                    <td style={{ padding: '10px 12px', color: '#5A6B88' }}>{fmtDate(r.created_at)}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#C8973A' }}>{fmt(r.montant)}</td>
                                    <td style={{ padding: '10px 12px' }}><Badge statut={r.statut} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}