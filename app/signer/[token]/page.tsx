'use client'

import { use, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

type Signature = {
  id: string
  token: string
  document_type: string
  document_id: string
  statut: 'en_attente' | 'signe' | 'expire'
  expires_at: string
  signed_at: string | null
  signer_name: string | null
  signature_data: string | null
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'not_found' }
  | { kind: 'expired' }
  | { kind: 'already_signed'; signed_at: string }
  | { kind: 'ready'; record: Signature }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export default function SignerPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)

  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [signerName, setSignerName] = useState('')
  const [canvasEmpty, setCanvasEmpty] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    fetchSignature()
  }, [token])

  async function fetchSignature() {
    const { data, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      setState({ kind: 'not_found' })
      return
    }

    const record = data as Signature

    if (record.statut === 'expire') {
      setState({ kind: 'expired' })
      return
    }

    if (record.statut === 'signe') {
      setState({ kind: 'already_signed', signed_at: record.signed_at ?? '' })
      return
    }

    if (new Date(record.expires_at) < new Date()) {
      setState({ kind: 'expired' })
      return
    }

    setState({ kind: 'ready', record })
  }

  // --- Canvas drawing ---

  function getPos(canvas: HTMLCanvasElement, e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'clientX' in e ? e.clientX : e.clientX
    const clientY = 'clientY' in e ? e.clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    lastPos.current = getPos(canvas, e.nativeEvent)
  }, [])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return

    const pos = getPos(canvas, e.nativeEvent)
    ctx.beginPath()
    ctx.strokeStyle = '#0B1F45'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setCanvasEmpty(false)
  }, [])

  const stopDrawing = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const startDrawingTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    lastPos.current = getPos(canvas, e.touches[0])
  }, [])

  const drawTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return

    const pos = getPos(canvas, e.touches[0])
    ctx.beginPath()
    ctx.strokeStyle = '#0B1F45'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setCanvasEmpty(false)
  }, [])

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setCanvasEmpty(true)
  }

  // --- Submit ---

  async function handleSign() {
    if (state.kind !== 'ready') return
    const canvas = canvasRef.current
    if (!canvas) return

    setSubmitting(true)
    const signatureData = canvas.toDataURL('image/png')

    const { error } = await supabase
      .from('signatures')
      .update({
        statut: 'signe',
        signer_name: signerName,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .eq('id', state.record.id)

    setSubmitting(false)
    if (error) {
      setState({ kind: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' })
      return
    }
    setState({ kind: 'success' })
  }

  // --- Render ---

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#0B1F45' }}>
            Nova<span style={{ color: '#C8973A' }}>Biz</span>
          </span>
        </div>

        {state.kind === 'loading' && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
              <Spinner />
              <p style={{ marginTop: 16 }}>Chargement du document…</p>
            </div>
          </Card>
        )}

        {state.kind === 'not_found' && (
          <Card>
            <StatusScreen
              icon="🔍"
              title="Lien introuvable"
              message="Ce lien de signature n'existe pas ou a déjà été supprimé."
              color="#6B7280"
            />
          </Card>
        )}

        {state.kind === 'expired' && (
          <Card>
            <StatusScreen
              icon="⏰"
              title="Lien expiré"
              message="Ce lien de signature a expiré. Veuillez contacter l'émetteur du document pour obtenir un nouveau lien."
              color="#C62828"
            />
          </Card>
        )}

        {state.kind === 'already_signed' && (
          <Card>
            <StatusScreen
              icon="✅"
              title="Document déjà signé"
              message={`Ce document a été signé le ${new Date(state.signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`}
              color="#2E7D32"
            />
          </Card>
        )}

        {state.kind === 'success' && (
          <Card>
            <StatusScreen
              icon="✅"
              title="Document signé avec succès"
              message="Votre signature a bien été enregistrée. Vous pouvez fermer cette page."
              color="#2E7D32"
            />
          </Card>
        )}

        {state.kind === 'error' && (
          <Card>
            <StatusScreen
              icon="❌"
              title="Erreur"
              message={state.message}
              color="#C62828"
            />
          </Card>
        )}

        {state.kind === 'ready' && (
          <Card>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#0B1F45', margin: '0 0 4px' }}>
              Signature du {state.record.document_type} n°{state.record.document_id}
            </h1>
            <p style={{ color: '#888', margin: '0 0 28px', fontSize: 14 }}>
              Veuillez remplir le formulaire ci-dessous pour signer ce document.
            </p>

            {/* Nom complet */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>
                Votre nom complet *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Prénom Nom"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Canvas */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>
                Signature *
              </label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white', cursor: 'crosshair' }}>
                <canvas
                  ref={canvasRef}
                  width={512}
                  height={180}
                  style={{ display: 'block', width: '100%', height: 180, touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawingTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0' }}>
                Dessinez votre signature dans le cadre ci-dessus.
              </p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <button
                onClick={clearCanvas}
                style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', fontSize: 13, color: '#6B7280', cursor: 'pointer' }}
              >
                Effacer
              </button>
            </div>

            {/* Date d'expiration */}
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
              Ce lien expire le {new Date(state.record.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>

            <button
              onClick={handleSign}
              disabled={submitting || !signerName.trim() || canvasEmpty}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: (!signerName.trim() || canvasEmpty) ? '#D1D5DB' : '#C8973A',
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: (!signerName.trim() || canvasEmpty) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {submitting ? 'Signature en cours…' : 'Signer le document'}
            </button>
          </Card>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9CA3AF' }}>
          Propulsé par NovaBiz · Signature électronique sécurisée
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {children}
    </div>
  )
}

function StatusScreen({ icon, title, message, color }: { icon: string; title: string; message: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontFamily: 'Georgia, serif', color, fontSize: 22, margin: '0 0 12px' }}>{title}</h2>
      <p style={{ color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{message}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}
