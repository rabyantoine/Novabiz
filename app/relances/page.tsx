'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Nav from '@/components/Nav'
import { usePermissions } from '../../lib/usePermissions'

type Facture = {
  id: string
  client_nom: string
  numero_facture: string | null
  montant_ht: number
  montant_ttc: number
  date_emission: string
  date_echeance: string | null
  statut: string
}

type RelanceState = {
  loading: boolean
  objet: string
  corps: string
  error: string
  copied: boolean
}

type RelanceTemplate = {
  id: string
  nom: string
  niveau: 1 | 2 | 3
  objet: string
  corps: string
  est_defaut: boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function joursRetard(dateEcheance: string | null): number {
  if (!dateEcheance) return 0
  const diff = new Date().getTime() - new Date(dateEcheance).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function retardLabel(jours: number): { label: string; bg: string; color: string } {
  if (jours > 30) return { label: `${jours}j de retard`, bg: '#FEE2E2', color: '#DC2626' }
  if (jours > 0)  return { label: `${jours}j de retard`, bg: '#FEF3C7', color: '#D97706' }
  if (jours === 0) return { label: 'Échéance auj.', bg: '#DBEAFE', color: '#2563EB' }
  return { label: `Dans ${Math.abs(jours)}j`, bg: '#F3F4F6', color: '#6B7280' }
}

function niveauRelance(jours: number): 1 | 2 | 3 {
  if (jours > 30) return 3
  if (jours > 0)  return 2
  return 1
}

const NIVEAU_LABELS: Record<1|2|3, string> = { 1: '1er rappel', 2: '2e rappel', 3: 'Mise en demeure' }
const NIVEAU_COLORS: Record<1|2|3, { bg: string; color: string }> = {
  1: { bg: '#DBEAFE', color: '#2563EB' },
  2: { bg: '#FEF3C7', color: '#D97706' },
  3: { bg: '#FEE2E2', color: '#DC2626' },
}
const VARIABLES = ['{{client_nom}}', '{{montant}}', '{{numero_facture}}', '{{date_echeance}}', '{{lien_paiement}}']

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '13px', color: '#1F2937', background: '#fff',
  border: '1px solid rgba(11,31,69,0.15)', borderRadius: '8px',
  padding: '9px 12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif',
}

export default function Relances() {
  const { loading: permLoading, isOwner, can } = usePermissions()
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [relances, setRelances] = useState<Record<string, RelanceState>>({})
  const [paid, setPaid]       = useState<Set<string>>(new Set())
  const [filter, setFilter]   = useState<'toutes' | 'retard' | 'imminente'>('toutes')

  // tabs
  const [activeTab, setActiveTab] = useState<'relances' | 'modeles'>('relances')

  // templates list
  const [templates, setTemplates] = useState<RelanceTemplate[]>([])

  // create form
  const [tplNom, setTplNom]     = useState('')
  const [tplNiveau, setTplNiveau] = useState<1|2|3>(1)
  const [tplObjet, setTplObjet] = useState('')
  const [tplCorps, setTplCorps] = useState('')
  const [tplDefaut, setTplDefaut] = useState(false)
  const [tplSaving, setTplSaving] = useState(false)
  const tplCorpsRef = useRef<HTMLTextAreaElement>(null)

  // edit modal
  const [editModal, setEditModal]   = useState<RelanceTemplate | null>(null)
  const [editNom, setEditNom]       = useState('')
  const [editNiveau, setEditNiveau] = useState<1|2|3>(1)
  const [editObjet, setEditObjet]   = useState('')
  const [editCorps, setEditCorps]   = useState('')
  const [editDefaut, setEditDefaut] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const editCorpsRef = useRef<HTMLTextAreaElement>(null)

  // toast
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadTemplates = async (userId: string) => {
    const { data } = await supabase
      .from('relance_templates')
      .select('id, nom, niveau, objet, corps, est_defaut')
      .eq('user_id', userId)
      .order('niveau', { ascending: true })
    setTemplates((data || []) as RelanceTemplate[])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('factures')
        .select('id, client_nom, numero_facture, montant_ht, montant_ttc, date_emission, date_echeance, statut')
        .eq('user_id', user.id)
        .eq('statut', 'envoyée')
        .order('date_echeance', { ascending: true })
      setFactures(data || [])
      await loadTemplates(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const genererRelance = async (f: Facture) => {
    const jours = joursRetard(f.date_echeance)
    setRelances(r => ({ ...r, [f.id]: { loading: true, objet: '', corps: '', error: '', copied: false } }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/relances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          client_nom: f.client_nom,
          numero_facture: f.numero_facture,
          montant_ht: f.montant_ht,
          montant_ttc: f.montant_ttc,
          date_emission: f.date_emission,
          date_echeance: f.date_echeance,
          jours_retard: jours,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setRelances(r => ({ ...r, [f.id]: { loading: false, objet: data.objet, corps: data.corps, error: '', copied: false } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setRelances(r => ({ ...r, [f.id]: { loading: false, objet: '', corps: '', error: msg, copied: false } }))
    }
  }

  const copier = async (id: string, objet: string, corps: string) => {
    await navigator.clipboard.writeText(`Objet : ${objet}\n\n${corps}`)
    setRelances(r => ({ ...r, [id]: { ...r[id], copied: true } }))
    setTimeout(() => setRelances(r => ({ ...r, [id]: { ...r[id], copied: false } })), 2500)
  }

  const marquerPayee = async (id: string) => {
    await supabase.from('factures').update({ statut: 'payée', date_paiement: new Date().toISOString().split('T')[0] }).eq('id', id)
    setPaid(p => new Set([...p, id]))
  }

  // ── Template CRUD ────────────────────────────────────────────────────
  const insertVariable = (variable: string) => {
    const el = tplCorpsRef.current
    if (!el) { setTplCorps(prev => prev + variable); return }
    const start = el.selectionStart ?? tplCorps.length
    const end   = el.selectionEnd   ?? tplCorps.length
    const newVal = tplCorps.substring(0, start) + variable + tplCorps.substring(end)
    setTplCorps(newVal)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + variable.length; el.focus() }, 0)
  }

  const insertEditVariable = (variable: string) => {
    const el = editCorpsRef.current
    if (!el) { setEditCorps(prev => prev + variable); return }
    const start = el.selectionStart ?? editCorps.length
    const end   = el.selectionEnd   ?? editCorps.length
    const newVal = editCorps.substring(0, start) + variable + editCorps.substring(end)
    setEditCorps(newVal)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + variable.length; el.focus() }, 0)
  }

  const saveTemplate = async () => {
    if (!tplNom.trim() || !tplObjet.trim() || !tplCorps.trim()) return
    setTplSaving(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      if (tplDefaut) {
        await supabase.from('relance_templates')
          .update({ est_defaut: false })
          .eq('user_id', u.id).eq('niveau', tplNiveau)
      }
      await supabase.from('relance_templates').insert({
        user_id: u.id, nom: tplNom.trim(), niveau: tplNiveau,
        objet: tplObjet.trim(), corps: tplCorps.trim(), est_defaut: tplDefaut,
      })
      await loadTemplates(u.id)
      setTplNom(''); setTplObjet(''); setTplCorps(''); setTplDefaut(false); setTplNiveau(1)
      showToast('Modèle sauvegardé ✓')
    } finally {
      setTplSaving(false)
    }
  }

  const openEditModal = (t: RelanceTemplate) => {
    setEditModal(t); setEditNom(t.nom); setEditNiveau(t.niveau)
    setEditObjet(t.objet); setEditCorps(t.corps); setEditDefaut(t.est_defaut)
  }

  const updateTemplate = async () => {
    if (!editModal || !editNom.trim() || !editObjet.trim() || !editCorps.trim()) return
    setEditSaving(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      if (editDefaut) {
        await supabase.from('relance_templates')
          .update({ est_defaut: false })
          .eq('user_id', u.id).eq('niveau', editNiveau).neq('id', editModal.id)
      }
      await supabase.from('relance_templates').update({
        nom: editNom.trim(), niveau: editNiveau, objet: editObjet.trim(),
        corps: editCorps.trim(), est_defaut: editDefaut,
        updated_at: new Date().toISOString(),
      }).eq('id', editModal.id)
      await loadTemplates(u.id)
      setEditModal(null)
      showToast('Modèle mis à jour ✓')
    } finally {
      setEditSaving(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce modèle ? Cette action est irréversible.')) return
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    await supabase.from('relance_templates').delete().eq('id', id)
    await loadTemplates(u.id)
    showToast('Modèle supprimé')
  }

  const filtered = factures
    .filter(f => !paid.has(f.id))
    .filter(f => {
      const j = joursRetard(f.date_echeance)
      if (filter === 'retard') return j > 0
      if (filter === 'imminente') return j <= 0 && j > -7
      return true
    })

  const totalImpayes = factures.filter(f => !paid.has(f.id)).reduce((s, f) => s + Number(f.montant_ttc || 0), 0)
  const nbRetard  = factures.filter(f => !paid.has(f.id) && joursRetard(f.date_echeance) > 0).length
  const nbCritique = factures.filter(f => !paid.has(f.id) && joursRetard(f.date_echeance) > 30).length

  if (loading || permLoading) return (
    <div style={{ background: '#0B1F45', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!permLoading && !isOwner && !can('relances')) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
        <Nav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🔒</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>
            Accès non autorisé
          </h2>
          <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0, textAlign: 'center', maxWidth: '340px' }}>
            Vous n'avez pas accès à ce module. Contactez l'administrateur de votre espace NovaBiz.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ marginTop: '8px', background: '#0B1F45', color: '#C8973A', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'sans-serif' }}>
      <Nav />

      <div style={{ padding: '36px 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>Relances</h1>
            <span style={{ background: 'linear-gradient(135deg, #C8973A, #e8b85a)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.04em' }}>IA</span>
          </div>
          <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>
            {factures.filter(f => !paid.has(f.id)).length} facture{factures.filter(f => !paid.has(f.id)).length !== 1 ? 's' : ''} impayée{factures.filter(f => !paid.has(f.id)).length !== 1 ? 's' : ''} — emails générés par Claude Opus
          </p>
        </div>

        {/* ── Onglets ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {([
            { key: 'relances', label: '🔔 Relances' },
            { key: 'modeles',  label: '📝 Modèles d\'e-mail' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '8px 20px', borderRadius: '20px', border: 'none',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              background: activeTab === t.key ? '#0B1F45' : '#fff',
              color: activeTab === t.key ? '#C8973A' : '#4A5568',
              boxShadow: activeTab === t.key ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ONGLET RELANCES
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'relances' && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total impayés', value: fmt(totalImpayes), sub: `${factures.filter(f => !paid.has(f.id)).length} factures envoyées`, accent: true },
                { label: 'En retard', value: String(nbRetard), sub: 'Date d\'échéance dépassée', accent: false },
                { label: 'Critique (>30j)', value: String(nbCritique), sub: 'Relance ferme recommandée', accent: false },
              ].map((k, i) => (
                <div key={i} style={{
                  background: k.accent ? '#0B1F45' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? '#FFF5F5' : '#fff'),
                  border: `1px solid ${k.accent ? 'transparent' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(11,31,69,0.1)')}`,
                  borderRadius: '16px', padding: '22px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: k.accent ? 'rgba(255,255,255,0.5)' : '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{k.label}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: k.accent ? '#C8973A' : (k.label === 'Critique (>30j)' && nbCritique > 0 ? '#DC2626' : '#0B1F45') }}>{k.value}</div>
                  <div style={{ fontSize: '12px', color: k.accent ? 'rgba(255,255,255,0.4)' : '#8A92A3', marginTop: '4px' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {([
                { key: 'toutes', label: 'Toutes' },
                { key: 'retard', label: '⚠ En retard' },
                { key: 'imminente', label: '⏰ Imminentes' },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: filter === f.key ? '#0B1F45' : '#fff', color: filter === f.key ? '#fff' : '#4A5568', boxShadow: filter === f.key ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste */}
            {filtered.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '56px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
                <p style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45', margin: '0 0 6px' }}>Aucune facture impayée</p>
                <p style={{ fontSize: '14px', color: '#8A92A3', margin: 0 }}>Toutes vos factures sont à jour.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filtered.map(f => {
                  const jours  = joursRetard(f.date_echeance)
                  const badge  = retardLabel(jours)
                  const niveau = niveauRelance(jours)
                  const r      = relances[f.id]
                  const tplsForNiveau = templates.filter(t => t.niveau === niveau)
                  return (
                    <div key={f.id} style={{ background: '#fff', border: `1px solid ${jours > 30 ? 'rgba(220,38,38,0.2)' : 'rgba(11,31,69,0.1)'}`, borderRadius: '16px', overflow: 'hidden' }}>
                      {/* Invoice row */}
                      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0B1F45', color: '#C8973A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                          {f.client_nom.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: '700', color: '#0B1F45' }}>{f.client_nom}</div>
                          <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '2px' }}>
                            {f.numero_facture ? `N° ${f.numero_facture} · ` : ''}
                            Émise le {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                            {f.date_echeance ? ` · Échéance ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                          <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45' }}>{fmt(Number(f.montant_ttc || 0))}</div>
                          <div style={{ fontSize: '11px', color: '#8A92A3' }}>TTC</div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                          {badge.label}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => genererRelance(f)}
                            disabled={r?.loading}
                            style={{
                              background: 'linear-gradient(135deg, #C8973A, #e8b85a)',
                              color: '#fff', border: 'none', padding: '8px 16px',
                              borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                              cursor: r?.loading ? 'not-allowed' : 'pointer',
                              opacity: r?.loading ? 0.7 : 1,
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            {r?.loading ? (
                              <>
                                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                Génération…
                              </>
                            ) : r?.objet ? '✨ Regénérer' : '✨ Générer relance IA'}
                          </button>
                          <button
                            onClick={() => marquerPayee(f.id)}
                            style={{ background: '#D1FAE5', color: '#059669', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            title="Marquer comme payée"
                          >
                            ✓ Payée
                          </button>
                        </div>
                      </div>

                      {/* Error */}
                      {r?.error && (
                        <div style={{ padding: '12px 24px', background: '#FEF2F2', borderTop: '1px solid rgba(220,38,38,0.15)', fontSize: '13px', color: '#DC2626' }}>
                          ⚠ Erreur : {r.error}
                        </div>
                      )}

                      {/* Generated email */}
                      {r?.objet && !r.loading && (
                        <div style={{ borderTop: '1px solid rgba(11,31,69,0.08)', background: '#FAFAF8' }}>
                          <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ background: 'linear-gradient(135deg, #C8973A, #e8b85a)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>IA</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0B1F45' }}>Email généré par Claude Opus</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => copier(f.id, r.objet, r.corps)}
                                style={{ background: r.copied ? '#D1FAE5' : '#fff', color: r.copied ? '#059669' : '#0B1F45', border: '1px solid rgba(11,31,69,0.15)', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                {r.copied ? '✓ Copié !' : '📋 Copier'}
                              </button>
                            </div>
                          </div>

                          {/* Template selector — only if templates exist for this niveau */}
                          {tplsForNiveau.length > 0 && (
                            <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#8A92A3', whiteSpace: 'nowrap' }}>Utiliser un modèle :</span>
                              <select
                                defaultValue=""
                                onChange={e => {
                                  const tpl = tplsForNiveau.find(t => t.id === e.target.value)
                                  if (tpl) setRelances(rv => ({ ...rv, [f.id]: { ...rv[f.id], objet: tpl.objet, corps: tpl.corps } }))
                                  e.target.value = ''
                                }}
                                style={{ fontSize: '12px', color: '#0B1F45', background: '#fff', border: '1px solid rgba(11,31,69,0.15)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', outline: 'none' }}
                              >
                                <option value="" disabled>— Choisir un modèle —</option>
                                {tplsForNiveau.map(t => (
                                  <option key={t.id} value={t.id}>{t.nom}{t.est_defaut ? ' ⭐' : ''}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div style={{ padding: '12px 24px 0' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Objet</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0B1F45', background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '8px', padding: '8px 12px' }}>{r.objet}</div>
                          </div>
                          <div style={{ padding: '12px 24px 20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Corps du message</div>
                            <textarea
                              value={r.corps}
                              onChange={e => setRelances(rv => ({ ...rv, [f.id]: { ...rv[f.id], corps: e.target.value } }))}
                              rows={10}
                              style={{ width: '100%', fontSize: '13px', lineHeight: '1.7', color: '#1F2937', background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '8px', padding: '12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ONGLET MODÈLES
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'modeles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Créer un modèle ── */}
            <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45', margin: '0 0 20px' }}>
                Créer un modèle
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Nom */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>
                    Nom du modèle
                  </label>
                  <input
                    type="text"
                    value={tplNom}
                    onChange={e => setTplNom(e.target.value)}
                    placeholder="ex : Relance douce J+7"
                    style={inputStyle}
                  />
                </div>

                {/* Niveau */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '8px' }}>
                    Niveau de relance
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {([1, 2, 3] as const).map(n => (
                      <button key={n} onClick={() => setTplNiveau(n)} style={{
                        padding: '7px 18px', borderRadius: '20px', border: 'none',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        background: tplNiveau === n ? NIVEAU_COLORS[n].color : NIVEAU_COLORS[n].bg,
                        color: tplNiveau === n ? '#fff' : NIVEAU_COLORS[n].color,
                        transition: 'all 0.15s',
                      }}>
                        {NIVEAU_LABELS[n]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Objet */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>
                    Objet de l'email
                  </label>
                  <input
                    type="text"
                    value={tplObjet}
                    onChange={e => setTplObjet(e.target.value)}
                    placeholder="ex : Rappel facture N° {{numero_facture}}"
                    style={inputStyle}
                  />
                </div>

                {/* Corps */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>
                    Corps de l'email
                  </label>
                  <textarea
                    ref={tplCorpsRef}
                    value={tplCorps}
                    onChange={e => setTplCorps(e.target.value)}
                    rows={8}
                    placeholder="Bonjour {{client_nom}}, ..."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                  />
                  {/* Variables cliquables */}
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#8A92A3', fontWeight: '500' }}>Variables :</span>
                    {VARIABLES.map(v => (
                      <button key={v} onClick={() => insertVariable(v)} style={{
                        background: '#EEF2FF', color: '#4338CA', border: '1px solid rgba(67,56,202,0.2)',
                        borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontFamily: 'monospace',
                        fontWeight: '600', cursor: 'pointer',
                      }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Défaut */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={tplDefaut}
                    onChange={e => setTplDefaut(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#0B1F45', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: '#4A5568', fontWeight: '500' }}>
                    Définir comme modèle par défaut pour ce niveau
                  </span>
                </label>

                {/* Save button */}
                <div>
                  <button
                    onClick={saveTemplate}
                    disabled={tplSaving || !tplNom.trim() || !tplObjet.trim() || !tplCorps.trim()}
                    style={{
                      background: tplSaving || !tplNom.trim() || !tplObjet.trim() || !tplCorps.trim()
                        ? 'rgba(11,31,69,0.3)' : '#0B1F45',
                      color: '#C8973A', border: 'none', borderRadius: '10px',
                      padding: '10px 24px', fontSize: '14px', fontWeight: '700',
                      cursor: tplSaving || !tplNom.trim() || !tplObjet.trim() || !tplCorps.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    {tplSaving ? (
                      <>
                        <span style={{ width: '14px', height: '14px', border: '2px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                        Sauvegarde…
                      </>
                    ) : '💾 Sauvegarder le modèle'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Mes modèles ── */}
            <div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45', margin: '0 0 16px' }}>
                Mes modèles
              </h2>

              {templates.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45', margin: '0 0 4px' }}>Aucun modèle créé</p>
                  <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>Créez votre premier modèle ci-dessus.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {templates.map(t => {
                    const nc = NIVEAU_COLORS[t.niveau]
                    return (
                      <div key={t.id} style={{ background: '#fff', border: '1px solid rgba(11,31,69,0.1)', borderRadius: '14px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        {/* Niveau badge */}
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: nc.bg, color: nc.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {NIVEAU_LABELS[t.niveau]}
                        </span>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <div style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: '700', color: '#0B1F45', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {t.nom}
                            {t.est_defaut && (
                              <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#FEF3C7', color: '#D97706' }}>⭐ Défaut</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8A92A3', marginTop: '3px', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.objet}
                          </div>
                        </div>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => openEditModal(t)} style={{ background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            ✏️ Modifier
                          </button>
                          <button onClick={() => deleteTemplate(t.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            🗑 Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          background: '#0B1F45', color: '#C8973A', padding: '11px 24px',
          borderRadius: '12px', fontSize: '13px', fontWeight: '700',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: 9999,
          animation: 'fadeInUp 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Modal Modification ── */}
      {editModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px',
          }}
        >
          <div style={{ background: '#FAF8F4', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>
                Modifier le modèle
              </h2>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8A92A3', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nom */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>Nom du modèle</label>
                <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} style={inputStyle} />
              </div>

              {/* Niveau */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '8px' }}>Niveau de relance</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([1, 2, 3] as const).map(n => (
                    <button key={n} onClick={() => setEditNiveau(n)} style={{
                      padding: '7px 18px', borderRadius: '20px', border: 'none',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      background: editNiveau === n ? NIVEAU_COLORS[n].color : NIVEAU_COLORS[n].bg,
                      color: editNiveau === n ? '#fff' : NIVEAU_COLORS[n].color,
                    }}>
                      {NIVEAU_LABELS[n]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objet */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>Objet de l'email</label>
                <input type="text" value={editObjet} onChange={e => setEditObjet(e.target.value)} style={inputStyle} />
              </div>

              {/* Corps */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A5568', display: 'block', marginBottom: '5px' }}>Corps de l'email</label>
                <textarea
                  ref={editCorpsRef}
                  value={editCorps}
                  onChange={e => setEditCorps(e.target.value)}
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                />
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8A92A3', fontWeight: '500' }}>Variables :</span>
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertEditVariable(v)} style={{
                      background: '#EEF2FF', color: '#4338CA', border: '1px solid rgba(67,56,202,0.2)',
                      borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontFamily: 'monospace',
                      fontWeight: '600', cursor: 'pointer',
                    }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Défaut */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={editDefaut}
                  onChange={e => setEditDefaut(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0B1F45', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#4A5568', fontWeight: '500' }}>
                  Définir comme modèle par défaut pour ce niveau
                </span>
              </label>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button onClick={() => setEditModal(null)} style={{ background: '#fff', color: '#4A5568', border: '1px solid rgba(11,31,69,0.15)', borderRadius: '10px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button
                  onClick={updateTemplate}
                  disabled={editSaving || !editNom.trim() || !editObjet.trim() || !editCorps.trim()}
                  style={{
                    background: editSaving || !editNom.trim() || !editObjet.trim() || !editCorps.trim()
                      ? 'rgba(11,31,69,0.3)' : '#0B1F45',
                    color: '#C8973A', border: 'none', borderRadius: '10px',
                    padding: '9px 22px', fontSize: '13px', fontWeight: '700',
                    cursor: editSaving || !editNom.trim() || !editObjet.trim() || !editCorps.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {editSaving ? (
                    <>
                      <span style={{ width: '13px', height: '13px', border: '2px solid rgba(200,151,58,0.3)', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Mise à jour…
                    </>
                  ) : 'Mettre à jour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}
