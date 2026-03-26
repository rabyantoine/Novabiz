import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PACKS = {
  decouverte: { credits: 20, price: 500, label: 'Pack Decouverte - 20 credits' },
  pro:         { credits: 50, price: 1000, label: 'Pack Pro - 50 credits' },
  business:    { credits: 120, price: 2000, label: 'Pack Business - 120 credits' },
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }
    const accessToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }
    const { pack } = await req.json()
    const packData = PACKS[pack as keyof typeof PACKS]
    if (!packData) {
      return NextResponse.json({ error: 'Pack invalide' }, { status: 400 })
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novabiz-murex.vercel.app'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: packData.label }, unit_amount: packData.price }, quantity: 1 }],
      mode: 'payment',
      success_url: baseUrl + '/abonnement?success=1&credits=' + packData.credits,
      cancel_url: baseUrl + '/abonnement?cancelled=1',
      metadata: { user_id: user.id, credits: String(packData.credits), pack },
      customer_email: user.email,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur Stripe'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
