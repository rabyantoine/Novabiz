'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

type Doc = {
  id: string
  nom: string
  categorie: string
  type_fichier: string | null
  taille_ko: number | null
  tags: string[] | null
  date_upload: string
}

const CATS = [
  { id: 'facture',  label: 'Factures',       color: '#7A4D0A', bg: '#FEF3DC' },
  { id: 'devis',    label: 'Devis',           color: '#0C447C', bg: '#E6F1FB' },
  { id: 'contrat',  label: 'Contrats',        color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'frais',    label: 'Notes de frais',  color: '#993C1D', bg: '#FAECE7' },
  { id: 'rh',       label: 'RH',              color: '#534AB7', bg: '#EEEDFE' },
  { id: 'autre',    label: 'Autres',          color: '#5F5E5A', bg: '#F1EFE8' },
]

function getCat(id: string) { return CATS.find(c => c.id === id) ?? CATS[5] }

function autoDetect(nom: string): string {
  const n = nom.toLowerCase()
  if (/facture|invoice|fact/.test(n)) return 'facture'
  if (/devis|quote|offre/.test(n))    return 'devis'
  if (/contrat|contract|cgv/.test(n)) return 'contrat'
  if (/frais|expense|depense/.test(n))return 'frais'
  if (/paie|rh|salaire|bulletin/.test(n)) return 'rh'
  return 'autre'
}

const FILE_ICONS: Record<string, string> = {
  PDF: '📄', DOCX: '📝', DOC: '📝', XLSX: '📊', XLS: '📊',
  PNG: '🖼️', JPG: '🖼️', JPEG: '🖼️',
}

const NAV_LINKS = [
  { href: '/crm',        label: 'CRM' },
  { href: '/devis',      label: 'Devis' },
  { href: '/frais',      label: 'Frais' },
  { href: '/relances',   label: 'Relances IA' },
  { href: '/classeur',   label: 'Classeur' },
  { href: '/rapports',   label: 'Rapports' },
  { href: '/parametres', label: 'Paramètres' },
]

export default function ClasseurPage() {
  const [docs, setDocs]           = useState<Doc[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [vue, setVue]             = useState<'grille' | 'liste'>('grille')
  const [modal, setModal]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ nom: '', categorie: 'autre', tags: '' })
  const fileRef                   = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('date_upload', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  // ── Détection doublons ──
  const nomCount: Record<string, number> = {}
  docs.forEach(d => { nomCount[d.nom] = (nomCount[d.nom] ?? 0) + 1 })
  const doublons = new Set(
    Object.entries(nomCount).filter(([, n]) => n > 1).map(([k]) => k)
  )

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setForm({ nom: f.name, categorie: autoDetect(f.name), tags: '' })
    setModal(true)
    e.target.value = ''
  }

  async function save() {
    if (!form.nom.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const ext  = form.nom.split('.').pop()?.toUpperCase() ?? null
    await supabase.from('documents').insert({
      nom:          form.nom.trim(),
      categorie:    form.categorie,
      type_fichier: ext,
      taille_ko:    Math.floor(Math.random() * 2000) + 10,
      tags:         tags.length ? tags : null,
    })
    setSaving(false)
    setModal(false)
    setForm({ nom: '', categorie: 'autre', tags: '' })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    await supabase.from('documents').delete().eq('id', id)
    load()
  }

  const filtered = docs.filter(d => {
    const okCat    = filterCat === 'all' || d.categorie === filterCat
    const q        = search.toLowerCase()
    const okSearch = !q || d.nom.toLowerCase().includes(q) ||
      d.tags?.some(t => t.toLowerCase().includes(q))
    return okCat && okSearch
  })

  const stats = CATS.map(c => ({
    ...c,
    count: docs.filter(d => d.categorie === c.id).length,
  }))

  // ── Styles partagés ──
  const input = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E2E8F0', borderRadius: 10,
    fontSize: 14, boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'system-ui,sans-serif' }}>

      {/* ─── NAV ─── */}
      <nav style={{
        background: '#0B1F45', padding: '0 2rem', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 800,
          color: '#fff', textDecoration: 'none',
        }}>
          Nova<span style={{ color: '#C8973A' }}>Biz</span>
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{
              color:      l.href === '/classeur' ? '#C8973A' : 'rgba(255,255,255,0.7)',
              fontSize:   13,
              textDecoration: 'none',
              padding:    '6px 10px',
              borderRadius: 8,
              background: l.href === '/classeur' ? 'rgba(200,151,58,0.12)' : 'transparent',
              fontWeight: l.href === '/classeur' ? 600 : 400,
            }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* ─── HEADER ─── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Georgia,serif', fontSize: 30, fontWeight: 800,
              color: '#0B1F45', margin: 0,
            }}>Classeur Intelligent</h1>
            <p style={{ color: '#64748B', margin: '6px 0 0', fontSize: 14 }}>
              Centralisez et retrouvez tous vos documents administratifs en quelques secondes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setVue(v => v === 'grille' ? 'liste' : 'grille')}
              style={{
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 10, padding: '9px 16px',
                color: '#0B1F45', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >{vue === 'grille' ? '☰ Liste' : '⊞ Grille'}</button>

            <button
              onClick={() => fileRef.current?.click()}
              style={{
                background: '#0B1F45', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 20px',
                fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >+ Ajouter un document</button>
            <input
              ref={fileRef} type="file" style={{ display: 'none' }}
              onChange={onFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </div>
        </div>

        {/* ─── ALERTE DOUBLONS ─── */}
        {doublons.size > 0 && (
          <div style={{
            background: '#FEF3DC', border: '1px solid #C8973A', borderRadius: 12,
            padding: '12px 16px', marginBottom: '1.25rem',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
            <div>
              <strong style={{ color: '#7A4D0A', fontSize: 13 }}>Doublons détectés</strong>
              <p style={{ margin: '2px 0 0', color: '#854F0B', fontSize: 12 }}>
                {[...doublons].join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* ─── STATS CATÉGORIES ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: '1.25rem' }}>
          {stats.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}
              style={{
                background:   filterCat === c.id ? c.bg : '#fff',
                border:       `1px solid ${filterCat === c.id ? c.color : '#E2E8F0'}`,
                borderRadius: 12, padding: '12px 10px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{
                fontSize: 22, fontWeight: 800,
                color: c.color, fontFamily: 'Georgia,serif',
              }}>{c.count}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{c.label}</div>
            </button>
          ))}
        </div>

        {/* ─── RECHERCHE ─── */}
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou tag..."
            style={{
              width: '100%', padding: '10px 14px 10px 40px',
              border: '1px solid #E2E8F0', borderRadius: 10,
              fontSize: 14, background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ─── LISTE / GRILLE ─── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>
            Chargement…
          </div>

        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: '#fff', borderRadius: 16, border: '1px dashed #E2E8F0',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <h3 style={{ color: '#0B1F45', fontFamily: 'Georgia,serif', margin: '0 0 8px' }}>
              {search || filterCat !== 'all' ? 'Aucun résultat' : 'Classeur vide'}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
              {search || filterCat !== 'all'
                ? 'Modifiez vos filtres.'
                : 'Cliquez sur "+ Ajouter un document" pour commencer.'}
            </p>
          </div>

        ) : vue === 'grille' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
            {filtered.map(doc => {
              const c     = getCat(doc.categorie)
              const isDup = doublons.has(doc.nom)
              const ext   = doc.type_fichier ?? ''
              return (
                <div key={doc.id} style={{
                  background:   '#fff',
                  border:       `1px solid ${isDup ? '#C8973A' : '#E2E8F0'}`,
                  borderRadius: 14, padding: '16px', position: 'relative',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: c.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, marginBottom: 10,
                  }}>
                    {FILE_ICONS[ext] ?? '🗂️'}
                  </div>

                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#0B1F45',
                    marginBottom: 6, wordBreak: 'break-word', lineHeight: 1.4,
                  }}>{doc.nom}</div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100 }}>{c.label}</span>
                    {ext && <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: 10, padding: '2px 8px', borderRadius: 100 }}>{ext}</span>}
                    {isDup && <span style={{ background: '#FEF3DC', color: '#C8973A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>Doublon</span>}
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {doc.tags.map(t => (
                        <span key={t} style={{ background: '#F8FAFC', color: '#475569', fontSize: 10, padding: '2px 6px', borderRadius: 6 }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    {doc.taille_ko ? `${doc.taille_ko} Ko · ` : ''}
                    {new Date(doc.date_upload).toLocaleDateString('fr-FR')}
                  </div>

                  <button
                    onClick={() => remove(doc.id)}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#CBD5E1', fontSize: 15, padding: 4, lineHeight: 1,
                    }}
                  >✕</button>
                </div>
              )
            })}
          </div>

        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Nom', 'Catégorie', 'Type', 'Taille', 'Date', 'Tags', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 14px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const c     = getCat(doc.categorie)
                  const isDup = doublons.has(doc.nom)
                  return (
                    <tr key={doc.id} style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                      background:   isDup ? '#FFFBF3' : 'transparent',
                    }}>
                      <td style={{ padding: '11px 14px', color: '#0B1F45', fontWeight: 500 }}>
                        {doc.nom}
                        {isDup && (
                          <span style={{ marginLeft: 8, background: '#FEF3DC', color: '#C8973A', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>Doublon</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 100 }}>{c.label}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#64748B' }}>{doc.type_fichier ?? '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{doc.taille_ko ? `${doc.taille_ko} Ko` : '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {doc.tags?.map(t => (
                          <span key={t} style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, padding: '2px 6px', borderRadius: 6, marginRight: 4 }}>#{t}</span>
                        ))}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={() => remove(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 15 }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL AJOUT ─── */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: '#0B1F45', margin: 0 }}>
                Ajouter un document
              </h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94A3B8', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nom du fichier
                </label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value, categorie: autoDetect(e.target.value) }))}
                  style={input}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Catégorie
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
                    auto-détectée d&apos;après le nom
                  </span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {CATS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setForm(f => ({ ...f, categorie: c.id }))}
                      style={{
                        padding: '8px 10px', borderRadius: 10,
                        border:     `1px solid ${form.categorie === c.id ? c.color : '#E2E8F0'}`,
                        background: form.categorie === c.id ? c.bg : '#fff',
                        color:      form.categorie === c.id ? c.color : '#64748B',
                        fontSize:   12, fontWeight: form.categorie === c.id ? 700 : 400,
                        cursor:     'pointer',
                      }}
                    >{c.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Tags
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
                    séparés par des virgules
                  </span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="ex : client-dupont, 2024, urgent"
                  style={input}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={() => setModal(false)}
                  style={{
                    flex: 1, padding: '11px',
                    border: '1px solid #E2E8F0', borderRadius: 10,
                    background: '#fff', color: '#64748B', fontWeight: 600,
                    cursor: 'pointer', fontSize: 14,
                  }}
                >Annuler</button>
                <button
                  onClick={save}
                  disabled={saving || !form.nom.trim()}
                  style={{
                    flex: 2, padding: '11px', border: 'none', borderRadius: 10,
                    background: saving || !form.nom.trim() ? '#CBD5E1' : '#0B1F45',
                    color: '#fff', fontWeight: 700,
                    cursor: saving || !form.nom.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                  }}
                >{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
