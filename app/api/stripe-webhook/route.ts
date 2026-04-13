import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[webhook] Signature invalide:', err.message)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const token = session.metadata?.token
    const factureIdsRaw = session.metadata?.facture_ids

    if (!token) {
      console.error('[webhook] Token manquant dans metadata')
      return NextResponse.json({ received: true })
    }

    // Marque le payment_link comme payé
    await supabaseAdmin
      .from('payment_links')
      .update({ statut: 'paid' })
      .eq('token', token)

    // Récupère les IDs de factures depuis metadata (source de vérité)
    let factureIds: string[] = []

    if (factureIdsRaw) {
      try {
        factureIds = JSON.parse(factureIdsRaw)
      } catch {
        console.error('[webhook] Impossible de parser facture_ids:', factureIdsRaw)
      }
    }

    // Fallback : cherche dans payment_links si metadata vide
    if (factureIds.length === 0) {
      const { data: pl } = await supabaseAdmin
        .from('payment_links')
        .select('facture_id, facture_ids')
        .eq('token', token)
        .single()

      if (pl) {
        factureIds = pl.facture_ids?.length > 0 ? pl.facture_ids : [pl.facture_id]
      }
    }

    // Marque toutes les factures concernées comme payées
    if (factureIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('factures')
        .update({
          statut: 'payée',
          date_paiement: new Date().toISOString().split('T')[0],
        })
        .in('id', factureIds)

      if (error) {
        console.error('[webhook] Erreur mise à jour factures:', error)
      } else {
        console.log(`[webhook] ${factureIds.length} facture(s) marquée(s) payée(s):`, factureIds)
      }
    }
  }

  return NextResponse.json({ received: true })
}