import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Mode multi-factures ──────────────────────────────────────────────────
    if (body.facture_ids && Array.isArray(body.facture_ids) && body.facture_ids.length > 0) {
      const { facture_ids, user_id } = body

      // Récupère toutes les factures concernées
      const { data: factures, error: fetchError } = await supabaseAdmin
        .from('factures')
        .select('id, client_nom, montant_ttc, montant_ht, description, numero_facture, type_facture')
        .in('id', facture_ids)
        .eq('user_id', user_id)

      if (fetchError || !factures || factures.length === 0) {
        return NextResponse.json({ error: 'Factures introuvables' }, { status: 400 })
      }

      // Vérifie que toutes les factures appartiennent au même client
      const clients = [...new Set(factures.map(f => f.client_nom))]

      // Calcul du montant total TTC (en centimes Stripe)
      const totalTTC = factures.reduce((sum, f) => sum + Number(f.montant_ttc || f.montant_ht), 0)
      const totalCentimes = Math.round(totalTTC * 100)

      // Description combinée
      const numeros = factures
        .map(f => f.numero_facture || `Facture ${f.id.slice(0, 8)}`)
        .join(' + ')

      const clientNom = clients.length === 1 ? clients[0] : clients.join(' / ')

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novabiz-murex.vercel.app'

      // Crée d'abord l'entrée payment_links pour récupérer le token
      const { data: paymentLink, error: insertError } = await supabaseAdmin
        .from('payment_links')
        .insert({
          facture_id: facture_ids[0], // facture principale (pour compatibilité)
          facture_ids,
          user_id,
          montant: totalTTC,
          statut: 'pending',
        })
        .select('token')
        .single()

      if (insertError || !paymentLink) {
        return NextResponse.json({ error: 'Erreur création lien' }, { status: 500 })
      }

      const token = paymentLink.token

      // Session Stripe avec line_items détaillés par facture
      const lineItems = factures.map(f => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: f.numero_facture
              ? `${f.numero_facture} — ${f.client_nom}`
              : `Facture — ${f.client_nom}`,
            description: f.description || undefined,
          },
          unit_amount: Math.round(Number(f.montant_ttc || f.montant_ht) * 100),
        },
        quantity: 1,
      }))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${appUrl}/payer/${token}/success`,
        cancel_url: `${appUrl}/payer/${token}/cancel`,
        metadata: {
          token,
          user_id,
          facture_ids: JSON.stringify(facture_ids),
          mode: 'multi',
        },
        customer_email: undefined,
      })

      // Met à jour payment_links avec l'ID et l'URL Stripe
      await supabaseAdmin
        .from('payment_links')
        .update({
          stripe_session_id: session.id,
          stripe_session_url: session.url,
        })
        .eq('token', token)

      return NextResponse.json({ url: session.url, token })
    }

    // ── Mode mono-facture (comportement existant) ────────────────────────────
    const { facture_id, montant, user_id, client_nom, numero_facture } = body

    if (!facture_id || !montant || !user_id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novabiz-murex.vercel.app'

    const { data: paymentLink, error: insertError } = await supabaseAdmin
      .from('payment_links')
      .insert({
        facture_id,
        facture_ids: [facture_id],
        user_id,
        montant,
        statut: 'pending',
      })
      .select('token')
      .single()

    if (insertError || !paymentLink) {
      return NextResponse.json({ error: 'Erreur création lien' }, { status: 500 })
    }

    const token = paymentLink.token

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: numero_facture
                ? `${numero_facture} — ${client_nom}`
                : `Facture — ${client_nom}`,
            },
            unit_amount: Math.round(Number(montant) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/payer/${token}/success`,
      cancel_url: `${appUrl}/payer/${token}/cancel`,
      metadata: {
        token,
        user_id,
        facture_ids: JSON.stringify([facture_id]),
        mode: 'single',
      },
    })

    await supabaseAdmin
      .from('payment_links')
      .update({
        stripe_session_id: session.id,
        stripe_session_url: session.url,
      })
      .eq('token', token)

    return NextResponse.json({ url: session.url, token })
  } catch (err: any) {
    console.error('[create-payment]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}