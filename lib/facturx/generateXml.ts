export interface FacturXData {
  vendeur: {
    nom: string
    siret: string
    adresse: string
    ville: string
    codePostal: string
    pays: string
    email: string
    numeroTva: string
    iban?: string
  }
  acheteur: {
    nom: string
    adresse?: string
    ville?: string
    siret?: string
    tvaIntracommunautaire?: string
  }
  facture: {
    numero: string
    dateEmission: string   // format YYYYMMDD
    dateEcheance: string   // format YYYYMMDD
    description: string
    montantHt: number
    tauxTva: number        // ex: 20 pour 20%
    montantTva: number
    montantTtc: number
    devise: string         // EUR
  }
}

export function generateFacturXml(data: FacturXData): string {
  const { vendeur, acheteur, facture } = data

  const formatDate = (d: string) => d.replace(/-/g, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(facture.numero)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(facture.dateEmission)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(facture.description || 'Prestation de services')}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${facture.montantHt.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${facture.tauxTva.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${facture.montantHt.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(vendeur.nom)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${vendeur.siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(vendeur.adresse || '')}</ram:LineOne>
          <ram:CityName>${escapeXml(vendeur.ville || '')}</ram:CityName>
          <ram:PostcodeCode>${vendeur.codePostal || ''}</ram:PostcodeCode>
          <ram:CountryID>${vendeur.pays || 'FR'}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(vendeur.email || '')}</ram:URIID>
        </ram:URIUniversalCommunication>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(vendeur.numeroTva || '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(acheteur.nom)}</ram:Name>
        ${acheteur.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${acheteur.siret}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        ${acheteur.adresse ? `<ram:PostalTradeAddress><ram:LineOne>${escapeXml(acheteur.adresse)}</ram:LineOne><ram:CityName>${escapeXml(acheteur.ville || '')}</ram:CityName><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>` : ''}
        ${acheteur.tvaIntracommunautaire ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(acheteur.tvaIntracommunautaire)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${escapeXml(facture.numero)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery/>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${escapeXml(facture.numero)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>${facture.devise}</ram:InvoiceCurrencyCode>
      ${vendeur.iban ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${vendeur.iban.replace(/\s/g, '')}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>` : ''}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${facture.montantTva.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${facture.montantHt.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${facture.tauxTva.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDate(facture.dateEcheance)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${facture.montantHt.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${facture.montantHt.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${facture.devise}">${facture.montantTva.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${facture.montantTtc.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${facture.montantTtc.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
