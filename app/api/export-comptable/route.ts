import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return new NextResponse('Paramètre user_id manquant', { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: factures, error } = await supabase
    .from('factures')
    .select('numero_facture, client_nom, date_emission, date_echeance, montant_ht, tva_montant, montant_ttc, statut')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    return new NextResponse('Erreur lors de la récupération des factures', { status: 500 })
  }

  const headers = ['numero_facture', 'client_nom', 'date_emission', 'date_echeance', 'montant_ht', 'tva', 'montant_ttc', 'statut']
  const rows = (factures || []).map(f => [
    f.numero_facture ?? '',
    f.client_nom ?? '',
    f.date_emission ?? '',
    f.date_echeance ?? '',
    f.montant_ht ?? '',
    f.tva_montant ?? '',
    f.montant_ttc ?? '',
    f.statut ?? '',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="factures.csv"',
    },
  })
}
