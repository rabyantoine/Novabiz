import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  // Traiter uniquement les paiements réussis
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const user_id = session.metadata?.user_id
    const credits = parseInt(session.metadata?.credits || '0')

    if (!user_id || !credits) {
      return NextResponse.json({ error: 'Métadonnées manquantes' }, { status: 400 })
    }

    // Récupérer le solde actuel
    const { data: profil } = await supabaseAdmin
      .from('profil')
      .select('credits')
      .eq('user_id', user_id)
      .single()

    const currentCredits = profil?.credits ?? 0

    // Créditer le compte
    if (profil) {
      await supabaseAdmin
        .from('profil')
        .update({ credits: currentCredits + credits })
        .eq('user_id', user_id)
    } else {
      // Créer le profil s'il n'existe pas encore
      await supabaseAdmin
        .from('profil')
        .insert({ user_id, credits })
    }

    console.log(`✅ Crédité ${credits} crédits pour user ${user_id} (nouveau solde: ${currentCredits + credits})`)
  }

  return NextResponse.json({ received: true })
}
