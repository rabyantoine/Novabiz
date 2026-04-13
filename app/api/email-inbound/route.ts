import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sécurité : vérifie le secret Resend
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    // Vérification optionnelle du secret dans le header
    const secret = req.headers.get('x-resend-secret')
    if (RESEND_WEBHOOK_SECRET && secret !== RESEND_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // ── Structure du payload Resend Inbound ────────────────────────────────
    // body.from        : "John Doe <john@acme.com>"
    // body.subject     : "Facture F-2025-042"
    // body.to          : ["factures@votredomaine.com"]
    // body.attachments : [{ filename, content (base64), content_type }]
    // body.text        : corps de l'email en texte brut
    // body.html        : corps HTML
    // body.headers     : { ... }

    const { from, subject, attachments, to } = body

    if (!from) {
      return NextResponse.json({ error: 'Expéditeur manquant' }, { status: 400 })
    }

    // Extraire email et nom de l'expéditeur
    const emailMatch = from.match(/<(.+?)>/)
    const emailExpediteur = emailMatch ? emailMatch[1] : from
    const nomMatch = from.match(/^(.+?)\s*</)
    const nomExpediteur = nomMatch ? nomMatch[1].trim() : emailExpediteur

    // Identifier le destinataire (= quel user NovaBiz)
    // Convention : factures+{user_id}@domaine.com OU lookup par email configuré
    const toAddress = Array.isArray(to) ? to[0] : to
    const userIdMatch = toAddress?.match(/factures\+([^@]+)@/)
    let userId: string | null = null

    if (userIdMatch) {
      userId = userIdMatch[1]
    } else {
      // Fallback : cherche dans profil si un user a configuré cet email entrant
      const { data: profil } = await supabaseAdmin
        .from('profil')
        .select('user_id')
        .limit(1)
        .single()
      userId = profil?.user_id || null
    }

    if (!userId) {
      console.error('[email-inbound] Impossible de déterminer le user_id')
      return NextResponse.json({ error: 'User introuvable' }, { status: 400 })
    }

    // ── Traitement des pièces jointes PDF ───────────────────────────────────
    const pdfs = (attachments || []).filter((a: any) =>
      a.content_type === 'application/pdf' ||
      a.filename?.toLowerCase().endsWith('.pdf')
    )

    const resultats: any[] = []

    for (const pdf of pdfs) {
      const filename = pdf.filename || `facture-email-${Date.now()}.pdf`
      const contentBase64 = pdf.content

      if (!contentBase64) continue

      // Decode base64 → Buffer
      const buffer = Buffer.from(contentBase64, 'base64')

      // Upload dans Supabase Storage
      const storagePath = `${userId}/${Date.now()}-${filename}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('factures-fournisseurs')
        .upload(storagePath, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        console.error('[email-inbound] Upload Storage échoué:', uploadError)
        continue
      }

      // URL signée (valable 10 ans)
      const { data: urlData } = await supabaseAdmin.storage
        .from('factures-fournisseurs')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10)

      const fichierUrl = urlData?.signedUrl || null

      // ── INSERT dans achats ───────────────────────────────────────────────
      const { data: achat, error: achatError } = await supabaseAdmin
        .from('achats')
        .insert({
          user_id: userId,
          fournisseur_nom: nomExpediteur,
          numero_facture: subject || filename,
          date_facture: new Date().toISOString().split('T')[0],
          montant_ht: 0,       // à compléter manuellement
          taux_tva: 20,
          montant_tva: 0,
          montant_ttc: 0,
          statut: 'a_payer',
          notes: `Reçu par email de ${emailExpediteur}${subject ? ` — Objet : ${subject}` : ''}`,
          fichier_url: fichierUrl,
          source: 'email',
          email_expediteur: emailExpediteur,
          email_sujet: subject || null,
        })
        .select('id')
        .single()

      if (achatError) {
        console.error('[email-inbound] INSERT achats échoué:', achatError)
        continue
      }

      // ── INSERT dans documents (classeur) ────────────────────────────────
      await supabaseAdmin.from('documents').insert({
        user_id: userId,
        nom: filename,
        categorie: 'facture_fournisseur',
        type_fichier: 'pdf',
        taille_ko: Math.round(buffer.byteLength / 1024),
        fichier_url: fichierUrl,
        tags: ['email', 'auto-import', nomExpediteur],
      })

      resultats.push({ achat_id: achat?.id, fichier: filename })
      console.log(`[email-inbound] ✓ Facture importée : ${filename} → achat ${achat?.id}`)
    }

    // Si aucun PDF trouvé, on log quand même l'email comme achat sans fichier
    if (pdfs.length === 0) {
      await supabaseAdmin.from('achats').insert({
        user_id: userId,
        fournisseur_nom: nomExpediteur,
        numero_facture: subject || 'Email sans pièce jointe',
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: 0,
        taux_tva: 20,
        montant_tva: 0,
        montant_ttc: 0,
        statut: 'a_payer',
        notes: `Email reçu de ${emailExpediteur} — aucun PDF trouvé. À compléter manuellement.`,
        source: 'email',
        email_expediteur: emailExpediteur,
        email_sujet: subject || null,
      })
      console.log(`[email-inbound] ⚠️ Email sans PDF de ${emailExpediteur}`)
    }

    return NextResponse.json({
      success: true,
      imported: resultats.length,
      resultats,
    })
  } catch (err: any) {
    console.error('[email-inbound] Erreur:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
