import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { facture_id, montant, user_id, client_nom, numero_facture } = await req.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'eur',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(montant * 100),
        product_data: {
          name: `Facture ${numero_facture} — ${client_nom}`,
        },
      },
    }],
    success_url: process.env.NEXT_PUBLIC_APP_URL + '/payer/success',
    cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/payer/cancel',
    metadata: { facture_id, user_id },
  })

  const token = crypto.randomUUID()

  await supabaseAdmin.from('payment_links').insert({
    facture_id,
    user_id,
    token,
    stripe_session_id: session.id,
    stripe_session_url: session.url,
    montant,
    statut: 'pending',
  })

  return NextResponse.json({ url: session.url, token })
}
