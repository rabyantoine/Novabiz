import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic()
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const accessToken = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const { client_nom, montant_ttc, montant_ht, date_echeance, date_emission, numero_facture, jours_retard } = await req.json()

    const tonalite = jours_retard > 30
      ? 'ferme mais professionnel'
      : jours_retard > 0
      ? 'aimable mais insistant'
      : 'preventif et courtois'

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Genere un email de relance de facture impayee en francais.
        Client: ${client_nom}, Facture: ${numero_facture || 'N/A'}, Montant TTC: ${Number(montant_ttc).toLocaleString('fr-FR')} EUR
        Echeance: ${new Date(date_echeance).toLocaleDateString('fr-FR')}, Retard: ${jours_retard} jours
        Ton: ${tonalite}
        Signe: Le service comptabilite
        Reponds UNIQUEMENT avec un JSON valide: {"objet":"...","corps":"..."}`,
      }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Reponse vide' }, { status: 500 })
    }

    const raw = textBlock.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ objet: parsed.objet, corps: parsed.corps })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
