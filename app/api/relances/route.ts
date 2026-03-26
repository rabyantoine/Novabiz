import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic()

// Client Supabase avec service role pour les opérations serveur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification via le token Bearer
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const accessToken = authHeader.replace('Bearer ', '')

    // Récupérer l'utilisateur depuis le token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Vérifier les crédits disponibles
    const { data: profil, error: profilError } = await supabaseAdmin
      .from('profil')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    // Si pas de profil, créer avec 5 crédits
    let credits = profil?.credits ?? 0
    if (profilError || !profil) {
      await supabaseAdmin.from('profil').upsert({ user_id: user.id, credits: 5 }, { onConflict: 'user_id' })
      credits = 5
    }

    if (credits <= 0) {
      return NextResponse.json({ error: 'Crédits insuffisants. Rechargez votre compte pour continuer.', code: 'NO_CREDITS' }, { status: 402 })
    }

    // Débiter 1 crédit atomiquement
    const { error: debitError } = await supabaseAdmin
      .from('profil')
      .update({ credits: credits - 1 })
      .eq('user_id', user.id)
      .eq('credits', credits) // protection contre les race conditions

    if (debitError) {
      return NextResponse.json({ error: 'Erreur débit crédit' }, { status: 500 })
    }

    // Appel API Anthropic
    const { client_nom, montant_ttc, montant_ht, date_echeance, date_emission, numero_facture, jours_retard } = await req.json()

    const tonalite = jours_retard > 30
      ? 'ferme mais professionnel, rappelant les conséquences possibles (frais de retard, contentieux)'
      : jours_retard > 0
        ? 'aimable mais insistant, rappelant poliment l\'échéance dépassée'
        : 'préventif et courtois, rappelant l\'échéance imminente'

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Tu es un assistant pour une TPE/PME française. Génère un email de relance de facture impayée.

Données de la facture :
- Client : ${client_nom}
- Numéro : ${numero_facture || 'N/A'}
- Montant HT : ${montant_ht ? Number(montant_ht).toLocaleString('fr-FR') + ' €' : 'N/A'}
- Montant TTC : ${Number(montant_ttc).toLocaleString('fr-FR')} €
- Date d'émission : ${new Date(date_emission).toLocaleDateString('fr-FR')}
- Date d'échéance : ${new Date(date_echeance).toLocaleDateString('fr-FR')}
- Retard : ${jours_retard > 0 ? jours_retard + ' jour(s) de retard' : 'échéance dans ' + Math.abs(jours_retard) + ' jour(s)'}

Ton : ${tonalite}

Règles :
- Langue française, style professionnel
- L'expéditeur signe "Le service comptabilité"
- Le client est vouvoyé
- Inclure le montant TTC et la référence facture dans le corps
- Corps en texte brut (pas de markdown)
- Pour la 1ère relance (≤15j) : rappel amical
- Pour la 2ème relance (15-30j) : mention des pénalités de retard légales (taux BCE + 10 pts)
- Pour relance sévère (>30j) : mentionner possible transmission au service contentieux

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "objet": "Objet de l'email ici",
  "corps": "Corps de l'email ici avec des \\n pour les sauts de ligne"
}`,
      }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      // Rembourser le crédit si l'IA échoue
      await supabaseAdmin.from('profil').update({ credits: credits }).eq('user_id', user.id)
      return NextResponse.json({ error: 'Réponse vide du modèle' }, { status: 500 })
    }

    const raw = textBlock.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      await supabaseAdmin.from('profil').update({ credits: credits }).eq('user_id', user.id)
      return NextResponse.json({ error: 'Format de réponse invalide' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ objet: parsed.objet, corps: parsed.corps, credits_restants: credits - 1 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
