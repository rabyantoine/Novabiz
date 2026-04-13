'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import SkeletonCalendar from '../components/SkeletonCalendar'
import Nav from '@/components/Nav'
import { usePermissions } from '../../lib/usePermissions'

type PlanItem = {
  id: string
  titre: string
  description: string | null
  date_debut: string
  date_fin: string | null
  type: string
  statut: string
  couleur: string
}

type FormState = {
  titre: string
  description: string
  date_debut: string
  date_fin: string
  type: string
  statut: string
  couleur: string
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const COULEURS_PRESET = [
  '#C8973A', '#0B1F45', '#059669', '#DC2626',
  '#7C3AED', '#2563EB', '#DB2777', '#D97706',
]

const TYPE_ICONS: Record<string, string> = {
  tâche: '✓',
  réunion: '●',
  rappel: '◆',
  deadline: '▲',
}

const EMPTY_FORM: FormState = {
  titre: '',
  description: '',
  date_debut: '',
  date_fin: '',
  type: 'tâche',
  statut: 'à faire',
  couleur: '#C8973A',
}

function toDateKey(iso: string) {
  return iso.slice(0, 10)
}

function isoToLocalInput(iso: string) {
  return iso.slice(0, 16)
}

export default function Planning() {
  const { loading: permLoading, isOwner, can } = usePermissions()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<PlanItem[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth()) // 0-indexed
  const [modal, setModal] = useState<{ open: boolean; date?: string; editing?: PlanItem }>({ open: false })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<PlanItem | null>(null)
  const [loading, setLoading] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      await fetchItems(user.id, year, month)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (user) fetchItems(user.id, year, month)
  }, [year, month])

  const fetchItems = async (uid: string, y: number, m: number) => {
    const start = new Date(y, m, 1).toISOString()
    const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString()
    const { data } = await supabase
      .from('planning')
      .select('*')
      .eq('user_id', uid)
      .gte('date_debut', start)
      .lte('date_debut', end)
      .order('date_debut', { ascending: true })
    if (data) setItems(data)
  }

  const openAdd = (dateStr: string) => {
    const localDate = `${dateStr}T09:00`
    setForm({ ...EMPTY_FORM, date_debut: localDate })
    setDetail(null)
    setModal({ open: true, date: dateStr })
    setError('')
  }

  const openEdit = (item: PlanItem) => {
    setForm({
      titre: item.titre,
      description: item.description || '',
      date_debut: isoToLocalInput(item.date_debut),
      date_fin: item.date_fin ? isoToLocalInput(item.date_fin) : '',
      type: item.type,
      statut: item.statut,
      couleur: item.couleur,
    })
    setDetail(null)
    setModal({ open: true, editing: item })
    setError('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Le titre est requis.'); return }
    if (!form.date_debut) { setError('La date est requise.'); return }
    setSaving(true)
    setError('')

    const payload = {
      user_id: user.id,
      titre: form.titre.trim(),
      description: form.description || null,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
      type: form.type,
      statut: form.statut,
      couleur: form.couleur,
    }

    let err
    if (modal.editing) {
      ;({ error: err } = await supabase.from('planning').update(payload).eq('id', modal.editing.id))
    } else {
      ;({ error: err } = await supabase.from('planning').insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    setModal({ open: false })
    fetchItems(user.id, year, month)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('planning').delete().eq('id', id)
    setDetail(null)
    setModal({ open: false })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1)
  // Monday-based: getDay() returns 0=Sun, adjust so Mon=0
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Map items by date
  const byDate: Record<string, PlanItem[]> = {}
  items.forEach(item => {
    const k = toDateKey(item.date_debut)
    if (!byDate[k]) byDate[k] = []
    byDate[k].push(item)
  })

  // Grid cells: leading empty + days
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - startDow - daysInMonth).fill(null),
  ]

  if (loading || permLoading) return <SkeletonCalendar />

  if (!permLoading && !isOwner && !can('planning')) {
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

      <div style={{ padding: '36px 2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header + nav mois */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: '800', color: '#0B1F45', margin: '0 0 4px' }}>Planning</h1>
            <p style={{ fontSize: '13px', color: '#8A92A3', margin: 0 }}>{items.length} événement{items.length !== 1 ? 's' : ''} ce mois</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={prevMonth} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(11,31,69,0.15)', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: '700', color: '#0B1F45', minWidth: '160px', textAlign: 'center' }}>
              {MOIS[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(11,31,69,0.15)', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <button
              onClick={() => openAdd(todayKey)}
              style={{ background: '#0B1F45', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' }}
            >
              + Ajouter
            </button>
          </div>
        </div>

        {/* Calendrier */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid rgba(11,31,69,0.1)', overflow: 'hidden' }}>
          {/* En-têtes jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(11,31,69,0.08)' }}>
            {JOURS.map(j => (
              <div key={j} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{j}</div>
            ))}
          </div>

          {/* Grille */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`e-${idx}`} style={{ minHeight: '100px', borderRight: idx % 7 !== 6 ? '1px solid rgba(11,31,69,0.05)' : 'none', borderBottom: '1px solid rgba(11,31,69,0.05)', background: '#FAFAF8' }} />
              }
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayItems = byDate[dateKey] || []
              const isToday = dateKey === todayKey
              const isWeekend = (idx % 7) === 5 || (idx % 7) === 6

              return (
                <div
                  key={dateKey}
                  onClick={() => openAdd(dateKey)}
                  style={{
                    minHeight: '100px',
                    padding: '8px',
                    borderRight: idx % 7 !== 6 ? '1px solid rgba(11,31,69,0.05)' : 'none',
                    borderBottom: '1px solid rgba(11,31,69,0.05)',
                    cursor: 'pointer',
                    background: isWeekend ? '#FDFCFA' : '#fff',
                    transition: 'background 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,151,58,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isWeekend ? '#FDFCFA' : '#fff')}
                >
                  {/* Numéro du jour */}
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: isToday ? '800' : '500',
                    color: isToday ? '#fff' : isWeekend ? '#8A92A3' : '#0B1F45',
                    background: isToday ? '#0B1F45' : 'transparent',
                    marginBottom: '4px',
                  }}>{day}</div>

                  {/* Événements */}
                  {dayItems.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      onClick={e => { e.stopPropagation(); setDetail(item) }}
                      style={{
                        background: item.couleur,
                        color: '#fff',
                        borderRadius: '5px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        opacity: item.statut === 'terminé' ? 0.5 : 1,
                      }}
                    >
                      <span style={{ marginRight: '3px', fontSize: '9px' }}>{TYPE_ICONS[item.type] || '●'}</span>
                      {item.titre}
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#8A92A3', fontWeight: '600', paddingLeft: '2px' }}>+{dayItems.length - 3} autres</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Légende types */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_ICONS).map(([type, icon]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8A92A3' }}>
              <span style={{ fontSize: '11px', color: '#0B1F45', fontWeight: '700' }}>{icon}</span>
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: detail.couleur, display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#8A92A3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{detail.type}</span>
                </div>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: '800', color: '#0B1F45', margin: 0 }}>{detail.titre}</h3>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#8A92A3', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {detail.description && (
              <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '16px', lineHeight: 1.6 }}>{detail.description}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#8A92A3' }}>
                📅 <strong style={{ color: '#0B1F45' }}>Début :</strong> {new Date(detail.date_debut).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {detail.date_fin && (
                <div style={{ fontSize: '13px', color: '#8A92A3' }}>
                  🏁 <strong style={{ color: '#0B1F45' }}>Fin :</strong> {new Date(detail.date_fin).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#8A92A3' }}>
                ◉ <strong style={{ color: '#0B1F45' }}>Statut :</strong> <span style={{ textTransform: 'capitalize' }}>{detail.statut}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => openEdit(detail)}
                style={{ flex: 1, background: '#0B1F45', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(detail.id)}
                style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {modal.open && (
        <div
          onClick={() => setModal({ open: false })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,69,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            ref={modalRef}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: '700', color: '#0B1F45', margin: 0 }}>
                {modal.editing ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <button onClick={() => setModal({ open: false })} style={{ background: 'transparent', border: 'none', fontSize: '22px', color: '#8A92A3', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleSave}>
              {/* Titre */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Titre *</label>
                <input
                  type="text"
                  placeholder="Ex : Réunion client, Rendu projet…"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Type + Statut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                    <option value="tâche">Tâche</option>
                    <option value="réunion">Réunion</option>
                    <option value="rappel">Rappel</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={inputStyle}>
                    <option value="à faire">À faire</option>
                    <option value="en cours">En cours</option>
                    <option value="terminé">Terminé</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Date de début *</label>
                  <input
                    type="datetime-local"
                    value={form.date_debut}
                    onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Date de fin</label>
                  <input
                    type="datetime-local"
                    value={form.date_fin}
                    onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Détails, notes…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Couleur */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Couleur</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {COULEURS_PRESET.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, couleur: c }))}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: c, border: form.couleur === c ? '3px solid #0B1F45' : '3px solid transparent',
                        outline: form.couleur === c ? '2px solid #C8973A' : 'none',
                        cursor: 'pointer', padding: 0,
                        transition: 'transform 0.1s',
                        transform: form.couleur === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.couleur}
                    onChange={e => setForm(f => ({ ...f, couleur: e.target.value }))}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(11,31,69,0.2)', cursor: 'pointer', padding: '2px' }}
                    title="Couleur personnalisée"
                  />
                </div>
              </div>

              {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, background: '#C8973A', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Enregistrement…' : modal.editing ? 'Sauvegarder' : 'Créer l\'événement'}
                </button>
                {modal.editing && (
                  <button
                    type="button"
                    onClick={() => handleDelete(modal.editing!.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', padding: '11px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#0B1F45',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(11,31,69,0.2)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#0B1F45',
}
