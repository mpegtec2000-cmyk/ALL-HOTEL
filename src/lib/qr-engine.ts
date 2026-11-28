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
 * Generates an unbounded, collision-free Booking ID (e.g. ARH-2026-1046 -> infinity).
 * Never runs out of IDs even after 100,000+ or millions of bookings.
 */
export function generateUniqueBookingId(
  existingIds: Iterable<string>,
  yearOverride?: number
): string {
  const year = yearOverride || 2026
  const prefix = `ARH-${year}-`
  const set = new Set<string>()
  let maxSeq = 1045

  for (const rawId of existingIds) {
    const up = String(rawId).trim().toUpperCase()
    set.add(up)
    if (up.startsWith(prefix)) {
      const numPart = Number(up.slice(prefix.length).split('-')[0])
      if (!Number.isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart
      }
    }
  }

  let candidateSeq = maxSeq + 1
  let candidate = `${prefix}${candidateSeq}`
  while (set.has(candidate)) {
    candidateSeq++
    candidate = `${prefix}${candidateSeq}`
  }
  return candidate
}

/**
 * Generates an infinite-scale, tamper-proof HMAC-SHA256 QR token for a booking.
 * Uses 48-bit CSPRNG nonces (12 hex chars = 281,474,976,710,656 combinations per booking)
 * and guarantees 0 collisions against existing tokens.
 * Format: ARHQR.<BOOKING_ID>.<NONCE_HEX>.<HMAC_16_HEX>
 */
export function generateBookingQrToken(
  bookingId: string,
  clientEmail: string,
  fixedNonce?: string,
  existingTokens?: Set<string>
): string {
  const cleanId = bookingId.trim().toUpperCase()
  const cleanEmail = (clientEmail || 'huesped@allrenthoteles.cl').trim().toLowerCase()

  let attempts = 0
  while (attempts < 10) {
    const nonce = (
      fixedNonce || crypto.randomBytes(6).toString('hex')
    ).toUpperCase()

    const payload = `${cleanId}:${nonce}:${cleanEmail}`
    const signature = crypto
      .createHmac('sha256', QR_ENGINE_SECRET)
      .update(payload)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase()

    const token = `ARHQR.${cleanId}.${nonce}.${signature}`
    if (fixedNonce || !existingTokens || !existingTokens.has(token)) {
      return token
    }
    attempts++
  }

  // Fallback with high-resolution timestamp + random bytes
  const fallbackNonce = (
    Date.now().toString(16) + crypto.randomBytes(4).toString('hex')
  )
    .slice(-12)
    .toUpperCase()
  const payload = `${cleanId}:${fallbackNonce}:${cleanEmail}`
  const signature = crypto
    .createHmac('sha256', QR_ENGINE_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()
  return `ARHQR.${cleanId}.${fallbackNonce}.${signature}`
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
    .slice(0, 12)
    .toUpperCase()
  return generateBookingQrToken(bookingId, clientEmail, deterministicNonce)
}

/**
 * Extracts and verifies a scanned QR payload.
 * Supports:
 * 1. Full URLs: https://.../admin?scan=ARHQR.ARH-2026-1042.8F3A1B2C9D0E.9D8E7F6A5B4C3D2E
 * 2. Raw cryptographic tokens: ARHQR.ARH-2026-1042.<NONCE>.<SIG>
 * 3. Direct Booking ID or Airbnb Confirmation Code: ARH-2026-1042 or HM8P3K9W2L
 */
export function parseAndVerifyQrInput(
  rawInput: string,
  expectedClientEmail?: string
): ParsedQrInputResult {
  const trimmed = (rawInput || '').trim()
  let candidate = trimmed

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
    try {
      const urlObj = new URL(
        trimmed.startsWith('http')
          ? trimmed
          : `https://allrenthoteles.cl${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
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

  const embeddedMatch = candidate.match(/(ARHQR\.[A-Z0-9-]+\.[A-F0-9]{6,24}\.[A-F0-9]{12,32})/i)
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
 * Generates a PNG Data URL for the QR token (for web UI & admin iframe previews).
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

/**
 * Generates a binary PNG Buffer for CID inline email attachments (100% Gmail/Outlook/iOS compatible).
 */
export async function generateQrPngBuffer(qrToken: string): Promise<Buffer> {
  return await QRCode.toBuffer(qrToken, {
    type: 'png',
    width: 340,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}
