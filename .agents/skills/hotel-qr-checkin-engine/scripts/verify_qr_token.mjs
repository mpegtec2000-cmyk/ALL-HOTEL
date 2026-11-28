#!/usr/bin/env node
import crypto from 'node:crypto'

const SECRET = process.env.QR_ENGINE_SECRET || 'ALL_RENT_HOTELES_QR_MASTER_SECRET_2026'

export function generateQrToken(bookingId, clientEmail, fixedNonce) {
  const cleanId = String(bookingId).trim().toUpperCase()
  const nonce = (fixedNonce || crypto.randomBytes(4).toString('hex')).toUpperCase()
  const payload = `${cleanId}:${nonce}:${String(clientEmail || '').trim().toLowerCase()}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16).toUpperCase()
  return `ARHQR.${cleanId}.${nonce}.${sig}`
}

export function verifyQrToken(token, clientEmail) {
  const parts = String(token).trim().split('.')
  if (parts.length !== 4 || parts[0] !== 'ARHQR') {
    return { valid: false, reason: 'Invalid ARHQR format' }
  }
  const [, bookingId, nonce, sig] = parts
  const expected = generateQrToken(bookingId, clientEmail, nonce).split('.')[3]
  return {
    valid: sig === expected,
    bookingId,
    nonce,
    signatureMatch: sig === expected,
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const sample = generateQrToken('ARH-2026-1042', 'v.contreras@gmail.com')
  console.log('Generated QR Token:', sample)
  console.log('Verification Result:', verifyQrToken(sample, 'v.contreras@gmail.com'))
}
