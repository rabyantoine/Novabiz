import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { client_nom, montant_ttc, montant_ht, date_echeance, date_emission, numero_facture, jours_retard } = await req.json()

    const tonalite = jours_retard > 30
      ? 'ferme mais professionnel, rappelant les conséquences possibles (frais de retard, contentieux)'
      : jours_retard > 0
        ? 'aimable mais insistant, rappelant poliment l\'échéance dépassée'
        : 'préventif et courtois, rappelant l\'échéance imminente'

    const message = await client.messages.create({
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
      return NextResponse.json({ error: 'Réponse vide du modèle' }, { status: 500 })
    }

    // Extract JSON from the response (may have surrounding text)
    const raw = textBlock.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format de réponse invalide' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ objet: parsed.objet, corps: parsed.corps })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
