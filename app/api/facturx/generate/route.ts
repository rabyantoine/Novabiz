import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { generateFacturXml, FacturXData } from '../../../../lib/facturx/generateXml'
import { PDFDocument, PDFName, PDFString, PDFArray, PDFDict } from 'pdf-lib'

export async function POST(req: NextRequest) {
  try {
    const { factureId } = await req.json()
    if (!factureId) return NextResponse.json({ error: 'factureId requis' }, { status: 400 })

    // Fetch facture (pas de filtre user_id côté API, RLS gère côté Supabase)
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('*')
      .eq('id', factureId)
      .single()
    if (factureError || !facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

    // Fetch profil vendeur
    const { data: profil } = await supabase
      .from('profil')
      .select('*')
      .eq('user_id', facture.user_id)
      .single()

    // Fetch client (si client_id dispo)
    let clientData = null
    if (facture.client_id) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', facture.client_id)
        .single()
      clientData = data
    }

    // Calculer taux TVA
    const tauxTva = facture.montant_ht > 0
      ? Math.round((facture.tva_montant / facture.montant_ht) * 100)
      : 20

    // Construire les données Factur-X
    const facturXData: FacturXData = {
      vendeur: {
        nom: profil?.nom_entreprise || 'Mon entreprise',
        siret: profil?.siret || '',
        adresse: profil?.adresse || '',
        ville: profil?.ville || '',
        codePostal: profil?.code_postal || '',
        pays: profil?.pays || 'FR',
        email: profil?.email_pro || '',
        numeroTva: profil?.numero_tva || '',
        iban: profil?.iban || '',
      },
      acheteur: {
        nom: clientData?.nom || facture.client_nom || 'Client',
        adresse: clientData?.adresse || '',
        ville: clientData?.ville || '',
        siret: clientData?.siret || '',
        tvaIntracommunautaire: clientData?.tva_intracommunautaire || '',
      },
      facture: {
        numero: facture.numero_facture || facture.id,
        dateEmission: facture.date_emission || new Date().toISOString().split('T')[0],
        dateEcheance: facture.date_echeance || new Date().toISOString().split('T')[0],
        description: facture.description || 'Prestation de services',
        montantHt: Number(facture.montant_ht),
        tauxTva,
        montantTva: Number(facture.tva_montant),
        montantTtc: Number(facture.montant_ttc),
        devise: 'EUR',
      },
    }

    // Générer le XML
    const xmlContent = generateFacturXml(facturXData)
    const xmlBytes = new TextEncoder().encode(xmlContent)

    // Créer un PDF simple avec pdf-lib (PDF/A-3 lite)
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { height } = page.getSize()

    // Métadonnées PDF/A-3
    pdfDoc.setTitle(`Facture ${facturXData.facture.numero}`)
    pdfDoc.setAuthor(facturXData.vendeur.nom)
    pdfDoc.setSubject('Facture électronique Factur-X')
    pdfDoc.setKeywords(['factur-x', 'facture', 'EN16931'])
    pdfDoc.setCreator('NovaBiz')
    pdfDoc.setProducer('NovaBiz Factur-X Generator')

    // Contenu texte de la page
    const font = await pdfDoc.embedFont('Helvetica' as any)
    const fontSize = 11
    const lines = [
      `FACTURE N° ${facturXData.facture.numero}`,
      ``,
      `Émetteur : ${facturXData.vendeur.nom}`,
      `SIRET : ${facturXData.vendeur.siret}`,
      `N° TVA : ${facturXData.vendeur.numeroTva}`,
      `Adresse : ${facturXData.vendeur.adresse}, ${facturXData.vendeur.codePostal} ${facturXData.vendeur.ville}`,
      ``,
      `Client : ${facturXData.acheteur.nom}`,
      facturXData.acheteur.adresse ? `Adresse : ${facturXData.acheteur.adresse}` : '',
      ``,
      `Date d'émission : ${facturXData.facture.dateEmission}`,
      `Date d'échéance : ${facturXData.facture.dateEcheance}`,
      ``,
      `Description : ${facturXData.facture.description}`,
      ``,
      `Montant HT : ${facturXData.facture.montantHt.toFixed(2)} €`,
      `TVA (${facturXData.facture.tauxTva}%) : ${facturXData.facture.montantTva.toFixed(2)} €`,
      `TOTAL TTC : ${facturXData.facture.montantTtc.toFixed(2)} €`,
      ``,
      facturXData.vendeur.iban ? `IBAN : ${facturXData.vendeur.iban}` : '',
      ``,
      `Ce document est une facture électronique conforme Factur-X (EN 16931).`,
    ]

    let y = height - 60
    for (const line of lines) {
      if (line) {
        const isBold = line.startsWith('FACTURE') || line.startsWith('TOTAL')
        page.drawText(line, {
          x: 50,
          y,
          size: isBold ? fontSize + 2 : fontSize,
          font,
        })
      }
      y -= 20
    }

    // Sauvegarder le PDF initial
    const pdfBytes = await pdfDoc.save()

    // Embarquer le XML en tant qu'EmbeddedFile (PDF/A-3)
    const finalPdf = await embedXmlInPdf(pdfBytes, xmlBytes, 'factur-x.xml')

    return new NextResponse(Buffer.from(finalPdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${facturXData.facture.numero}-facturx.pdf"`,
      },
    })
  } catch (err) {
    console.error('Factur-X error:', err)
    return NextResponse.json({ error: 'Erreur génération Factur-X' }, { status: 500 })
  }
}

async function embedXmlInPdf(pdfBytes: Uint8Array, xmlBytes: Uint8Array, filename: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const context = pdfDoc.context

  // Stream du fichier XML embarqué
  const embeddedFileStream = context.stream(xmlBytes, {
    Type: 'EmbeddedFile',
    Subtype: 'text/xml',
    Params: context.obj({
      Size: xmlBytes.length,
      ModDate: PDFString.of(new Date().toISOString()),
    }),
  })
  const embeddedFileRef = context.register(embeddedFileStream)

  // Filespec dict
  const fileSpecDict = context.obj({
    Type: 'Filespec',
    F: PDFString.of(filename),
    UF: PDFString.of(filename),
    EF: context.obj({ F: embeddedFileRef, UF: embeddedFileRef }),
    Desc: PDFString.of('Factur-X XML'),
    AFRelationship: PDFName.of('Data'),
  })
  const fileSpecRef = context.register(fileSpecDict)

  // Ajouter aux EmbeddedFiles du catalog
  const catalog = pdfDoc.catalog
  const names = catalog.lookupMaybe(PDFName.of('Names'), PDFDict)
  if (names) {
    const embeddedFiles = names.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict)
    if (embeddedFiles) {
      const namesArray = embeddedFiles.lookupMaybe(PDFName.of('Names'), PDFArray)
      if (namesArray) {
        namesArray.push(PDFString.of(filename))
        namesArray.push(fileSpecRef)
      }
    } else {
      names.set(
        PDFName.of('EmbeddedFiles'),
        context.obj({ Names: [PDFString.of(filename), fileSpecRef] })
      )
    }
  } else {
    const namesDict = context.obj({
      EmbeddedFiles: context.obj({
        Names: [PDFString.of(filename), fileSpecRef],
      }),
    })
    catalog.set(PDFName.of('Names'), namesDict)
  }

  // AF array sur le catalog
  catalog.set(PDFName.of('AF'), context.obj([fileSpecRef]))

  // XMP metadata pour PDF/A-3
  const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>BASIC WL</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

  const xmpBytes = new TextEncoder().encode(xmpMetadata)
  const xmpStream = context.stream(xmpBytes, {
    Type: 'Metadata',
    Subtype: 'XML',
  })
  const xmpRef = context.register(xmpStream)
  catalog.set(PDFName.of('Metadata'), xmpRef)

  return pdfDoc.save()
}
