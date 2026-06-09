/**
 * Utilitário de geração de Pix Copia e Cola estático em conformidade com o padrão do BC (Banco Central do Brasil)
 * Baseado na especificação EMV / BR Code.
 */

// Função auxiliar para calcular o CRC16-CCITT (Polinômio: 0x1021, valor inicial: 0xFFFF)
export function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Formata tamanho no padrão EMV (ex: 2 -> "02", 14 -> "14")
function formatEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

interface PixPayloadParams {
  chavePix: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  infoAdicional?: string;
  txId?: string;
}

/**
 * Gera a string completa de pagamento Pix Copia e Cola (BR Code)
 */
export function generatePixPayload({
  chavePix,
  merchantName,
  merchantCity,
  amount,
  infoAdicional = 'Honest Market',
  txId = '***'
}: PixPayloadParams): string {
  // Limpa caracteres especiais do nome/cidade para evitar quebra no padrão EMV
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .slice(0, 25);

  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);

  const cleanChave = chavePix.trim();

  // 1. Merchant Account Information - Pix (ID 26)
  const gui = formatEMV('00', 'br.gov.bcb.pix');
  const key = formatEMV('01', cleanChave);
  const info = infoAdicional ? formatEMV('02', infoAdicional) : '';
  const merchantAccountInfo = formatEMV('26', `${gui}${key}${info}`);

  // Assemble the merchant parts
  const payloadParts: string[] = [
    formatEMV('00', '01'), // Payload Format Indicator (ID 00)
    formatEMV('01', '11'), // Point of Initiation Method (ID 01) (11 = Recorrente/Reutilizável)
    merchantAccountInfo,   // Merchant Account Info (ID 26)
    formatEMV('52', '0000'), // Merchant Category Code (ID 52)
    formatEMV('53', '986'), // Transaction Currency (ID 53) (986 = BRL)
  ];

  // Adiciona o valor se for maior que zero (ID 54)
  if (amount > 0) {
    payloadParts.push(formatEMV('54', amount.toFixed(2)));
  }

  // Country Code (ID 58)
  payloadParts.push(formatEMV('58', 'BR'));

  // Merchant Name (ID 59)
  payloadParts.push(formatEMV('59', cleanName || 'HONEST MARKET'));

  // Merchant City (ID 60)
  payloadParts.push(formatEMV('60', cleanCity || 'SAO PAULO'));

  // Additional Data Field Template (ID 62)
  const referenceLabel = formatEMV('05', txId || '***');
  payloadParts.push(formatEMV('62', referenceLabel));

  // Concatena tudo e adiciona o placeholder do CRC16 (ID 63)
  const prePayload = payloadParts.join('') + '6304';

  // Calcula o CRC16 e junta à string final
  const crc = calculateCRC16(prePayload);
  return `${prePayload}${crc}`;
}
