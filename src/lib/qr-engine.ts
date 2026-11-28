import crypto from 'crypto'
import QRCode from 'qrcode'

const QR_ENGINE_SECRET =
  process.env.QR_ENGINE_SECRET || 'ALL_RENT_HOTELES_QUINTERO_QR_MASTER_KEY_2026'

export interface ParsedQrInputResult {
  rawInput: string
  extractedToken: string
  isCryptographicQr: boolean
  bookingIdOrCode: string
  nonce?: string
  signature?: string
  signatureValid: boolean
}

/**
 * Generates a unique, tamper-proof HMAC-SHA256 QR token for a booking.
 * Format: ARHQR.<BOOKING_ID>.<NONCE_8_HEX>.<HMAC_16_HEX>
 */
export function generateBookingQrToken(
  bookingId: string,
  clientEmail: string,
  fixedNonce?: string
): string {
  const cleanId = bookingId.trim().toUpperCase()
  const cleanEmail = (clientEmail || 'huesped@allrenthoteles.cl').trim().toLowerCase()
  const nonce = (
    fixedNonce || crypto.randomBytes(4).toString('hex')
  ).toUpperCase()

  const payload = `${cleanId}:${nonce}:${cleanEmail}`
  const signature = crypto
    .createHmac('sha256', QR_ENGINE_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()

  return `ARHQR.${cleanId}.${nonce}.${signature}`
}

/**
 * Generates a deterministic nonce from bookingId so initial seed bookings
 * always have a valid cryptographic token without regenerating on every boot.
 */
export function generateDeterministicSeedQrToken(
  bookingId: string,
  clientEmail: string
): string {
  const deterministicNonce = crypto
    .createHash('sha256')
    .update(`SEED:${bookingId}:${clientEmail}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  return generateBookingQrToken(bookingId, clientEmail, deterministicNonce)
}

/**
 * Extracts and verifies a scanned QR payload.
 * Supports:
 * 1. Full URLs: https://.../admin?scan=ARHQR.ARH-2026-1042.8F3A1B2C.9D8E7F6A5B4C3D2E
 * 2. Raw cryptographic tokens: ARHQR.ARH-2026-1042.8F3A1B2C.9D8E7F6A5B4C3D2E
 * 3. Direct Booking ID or Airbnb Confirmation Code: ARH-2026-1042 or HM8P3K9W2L
 */
export function parseAndVerifyQrInput(
  rawInput: string,
  expectedClientEmail?: string
): ParsedQrInputResult {
  const trimmed = (rawInput || '').trim()
  let candidate = trimmed

  // If scanned input is a URL, extract `scan`, `qr`, or `codigo` query param
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
    try {
      const urlObj = new URL(
        trimmed.startsWith('http') ? trimmed : `https://allrenthoteles.cl${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
      )
      const fromParam =
        urlObj.searchParams.get('scan') ||
        urlObj.searchParams.get('qr') ||
        urlObj.searchParams.get('codigo')
      if (fromParam) {
        candidate = fromParam.trim()
      }
    } catch {
      const match = trimmed.match(/(ARHQR\.[A-Z0-9-]+\.[A-F0-9]+\.[A-F0-9]+)/i)
      if (match) candidate = match[1]
    }
  }

  // Also check if ARHQR token is embedded inside text
  const embeddedMatch = candidate.match(/(ARHQR\.[A-Z0-9-]+\.[A-F0-9]{6,12}\.[A-F0-9]{12,32})/i)
  if (embeddedMatch) {
    candidate = embeddedMatch[1].toUpperCase()
  }

  if (candidate.toUpperCase().startsWith('ARHQR.')) {
    const parts = candidate.toUpperCase().split('.')
    if (parts.length === 4) {
      const [, bookingId, nonce, sig] = parts
      let signatureValid = true

      if (expectedClientEmail) {
        const expectedToken = generateBookingQrToken(bookingId, expectedClientEmail, nonce)
        const expectedSig = expectedToken.split('.')[3]
        signatureValid = sig === expectedSig
      }

      return {
        rawInput: trimmed,
        extractedToken: candidate.toUpperCase(),
        isCryptographicQr: true,
        bookingIdOrCode: bookingId,
        nonce,
        signature: sig,
        signatureValid,
      }
    }
  }

  return {
    rawInput: trimmed,
    extractedToken: candidate.toUpperCase(),
    isCryptographicQr: false,
    bookingIdOrCode: candidate.toUpperCase(),
    signatureValid: false,
  }
}

/**
 * Generates a PNG Data URL for the QR token so it can be embedded in emails and UI cards.
 */
export async function generateQrImageDataUrl(qrToken: string): Promise<string> {
  try {
    return await QRCode.toDataURL(qrToken, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
  } catch (err) {
    console.error('Error generating QR Data URL:', err)
    return ''
  }
}
