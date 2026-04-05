'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

interface PaymentLink {
  statut: string
  montant: number
  stripe_session_url: string
  factures: {
    numero_facture: string
    client_nom: string
  } | null
}

export default function PayerPage() {
  const params = useParams()
  const token = params.token as string
  const [link, setLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchLink() {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*, factures(*)')
        .eq('token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setLink(data)
      }
      setLoading(false)
    }
    if (token) fetchLink()
  }, [token])

  if (loading) {
    return (
      <PageShell>
        <p style={{ color: '#888', textAlign: 'center' }}>Chargement…</p>
      </PageShell>
    )
  }

  if (notFound || !link) {
    return (
      <PageShell>
        <p style={{ color: '#888', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
          Lien de paiement invalide ou expiré.
        </p>
      </PageShell>
    )
  }

  if (link.statut === 'paid') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#0B1F45' }}>
            Facture déjà réglée — Merci pour votre paiement.
          </p>
        </div>
      </PageShell>
    )
  }

  const facture = link.factures

  return (
    <PageShell>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          Demande de paiement
        </p>
        {facture?.numero_facture && (
          <p style={{ fontFamily: 'Georgia, serif', color: '#0B1F45', fontSize: '1rem', marginBottom: '0.25rem' }}>
            Facture {facture.numero_facture}
          </p>
        )}
        {facture?.client_nom && (
          <p style={{ color: '#555', fontSize: '0.95rem' }}>
            Client : <strong>{facture.client_nom}</strong>
          </p>
        )}
      </div>

      <div style={{
        border: '1px solid #e8e0d0',
        borderRadius: '8px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        background: '#fff',
        textAlign: 'center',
      }}>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Montant TTC</p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 'bold', color: '#0B1F45' }}>
          {Number(link.montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </p>
      </div>

      <button
        onClick={() => { window.location.href = link.stripe_session_url }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: '#C8973A',
          color: '#fff',
          fontFamily: 'Georgia, serif',
          fontSize: '1rem',
          fontWeight: 'bold',
          padding: '0.85rem 2rem',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        💳 Payer maintenant
      </button>

      <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.75rem', marginTop: '1rem' }}>
        Paiement sécurisé via Stripe
      </p>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.6rem',
          fontWeight: 'bold',
          color: '#0B1F45',
          letterSpacing: '0.05em',
        }}>
          Nova<span style={{ color: '#C8973A' }}>Biz</span>
        </span>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e8e0d0',
        borderRadius: '12px',
        padding: '2rem 2.5rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 2px 16px rgba(11,31,69,0.07)',
      }}>
        {children}
      </div>
    </div>
  )
}
