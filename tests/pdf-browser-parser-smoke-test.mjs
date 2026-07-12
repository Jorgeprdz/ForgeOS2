import assert from "node:assert/strict";
import { parseVidaMujerPdfTextToAcceptedQuotePacket } from "../docs/static-preview/quote-preview-live/forge-pdf-browser-parser.js";

const compactPdfText = `
Solucionline Cotización Producto Vida Mujer Titular Prospecto Vida Mujer Edad 33 Sexo Femenino No Fumador
Coberturas Básico BAIT 60 P 20 años PCF A AV UI 1 REN BIT 60 P
Vida Mujer 20 años 50,000 Prima 2,926.93
50,000 40.00 27.89 67.00
Prima Total Anual 3,061.82
Recomendados ADAPTA 5 REN 100,000 350.70 BMA 20 años 50,000 47.50 PEP A 17 años 50,000 79.50 CLP 1 REN 100,000 350.70
Prima Total con Recomendados 3,890.21
Edad 52 Prima Anual 3,062 Prima Anual Acumulada con AVE 152,136 Valor de Rescate AVE 107,486 Valor en Efectivo 40,000 Recuperación Total 147,486 Suma Asegurada Básico 50,000
96.94 % Recuperación
`;

const fragmentedPdfText = `
Vida Mujer BAIT 60 P BIT 60 P 20 años
50,000 2,926.93 40.00 27.89 67.00
3,061.82
ADAPTA 100,000 350.70 BMA 50,000 47.50 PEP 50,000 79.50 CLP 100,000 350.70
3,890.21
52 3,062 152,136 107,486 40,000 147,486 50,000
`;

for (const [name, sampleText] of Object.entries({ compactPdfText, fragmentedPdfText })) {
  const packet = parseVidaMujerPdfTextToAcceptedQuotePacket(sampleText, {
    currentUdiValue: 8.82994,
    fileName: `${name}.pdf`
  });

  assert.equal(packet.product, "Vida Mujer", name);
  assert.equal(packet.productFamily, "life", name);
  assert.equal(packet.nativeResult.product, "Vida Mujer", name);
  assert.equal(packet.sumAssured, 50000, name);
  assert.equal(packet.annualPremium, 3062, name);
  assert.equal(packet.annualPremiumWithRecommended, 3890, name);
  assert.equal(packet.paymentYears, 20, name);
  assert.equal(packet.nativeResult.totalContributed, 152136, name);
  assert.equal(packet.nativeResult.cashValue, 40000, name);
  assert.equal(packet.nativeResult.aveSurrenderValue, 107486, name);
  assert.equal(packet.nativeResult.recoveryTotal, 147486, name);
  assert.equal(packet.currencyMetadata.currentUdiValue, 8.82994, name);
  assert.equal(packet.missing_information.length, 0, name);
}

console.log("PASS pdf browser parser smoke R11C");
