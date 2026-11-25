import { RoomCategorySlug } from '@/types/saas'
import { calculateNights, getRoomCategoryBySlug } from './pricing'

export interface ParsedAirbnbEmail {
  isAirbnbValid: boolean
  eventType: 'reservation_confirmed' | 'reservation_modified' | 'reservation_cancelled' | 'ignored'
  airbnbCode: string
  guestName: string
  guestEmail: string
  guestPhone: string
  guestsCount: number
  roomCategory: RoomCategorySlug
  checkInDate: string // YYYY-MM-DD
  checkOutDate: string // YYYY-MM-DD
  nightsCount: number
  totalAmountCLP: number
  notes: string
}

const MONTH_MAP: Record<string, string> = {
  ene: '01', enero: '01', jan: '01', january: '01',
  feb: '02', febrero: '02', february: '02',
  mar: '03', marzo: '03', march: '03',
  abr: '04', abril: '04', apr: '04', april: '04',
  may: '05', mayo: '05',
  jun: '06', junio: '06', june: '06',
  jul: '07', julio: '07', july: '07',
  ago: '08', agosto: '08', aug: '08', august: '08',
  sep: '09', sept: '09', septiembre: '09', september: '09',
  oct: '10', octubre: '10', october: '10',
  nov: '11', noviembre: '11', november: '11',
  dic: '12', diciembre: '12', dec: '12', december: '12',
}

function stripHtmlAndDecode(raw: string): string {
  // Decode quoted-printable soft breaks & hex sequences if present
  const decoded = raw
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return ''
      }
    })

  return decoded
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#36;/g, '$')
    .replace(/[ \t]+/g, ' ')
}

function parseFlexibleDate(str: string, fallbackYear = new Date().getFullYear()): string | null {
  const s = str.trim().toLowerCase().replace(/\./g, '')

  // 1. ISO YYYY-MM-DD
  const iso = s.match(/\b(202\d)-(\d{1,2})-(\d{1,2})\b/)
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmySlash = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](202\d)\b/)
  if (dmySlash) {
    return `${dmySlash[3]}-${dmySlash[2].padStart(2, '0')}-${dmySlash[1].padStart(2, '0')}`
  }

  // 3. Spanish/English textual: "28 de nov de 2026", "28 nov 2026", "nov 28, 2026"
  const esMatch = s.match(/\b(\d{1,2})\s*(?:de\s+)?([a-záéíóú]{3,10})(?:\s+(?:de\s+|del\s+)?(202\d))?\b/)
  if (esMatch) {
    const day = esMatch[1].padStart(2, '0')
    const mKey = esMatch[2].slice(0, 3)
    const month = MONTH_MAP[esMatch[2]] || MONTH_MAP[mKey]
    const year = esMatch[3] || String(fallbackYear)
    if (month) return `${year}-${month}-${day}`
  }

  const enMatch = s.match(/\b([a-z]{3,9})\s+(\d{1,2}),?\s*(202\d)?\b/)
  if (enMatch) {
    const mKey = enMatch[1].slice(0, 3)
    const month = MONTH_MAP[enMatch[1]] || MONTH_MAP[mKey]
    const day = enMatch[2].padStart(2, '0')
    const year = enMatch[3] || String(fallbackYear)
    if (month) return `${year}-${month}-${day}`
  }

  return null
}

export function detectRoomCategoryFromText(text: string): RoomCategorySlug {
  const norm = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (norm.includes('familiar') || norm.includes('terraza')) {
    return 'familiar_terraza'
  }
  if (norm.includes('dos camas') || norm.includes('doble') || norm.includes('twin') || norm.includes('2 camas')) {
    return 'doble_dos_camas'
  }
  if (norm.includes('single') || norm.includes('individual') || norm.includes('ejecutiv')) {
    return 'single_individual'
  }
  if (norm.includes('standard') || norm.includes('estandar') || norm.includes('bano privado exterior') || norm.includes('exterior')) {
    return 'standard_matrimonial'
  }
  if (norm.includes('superior') || norm.includes('suite')) {
    return 'superior_matrimonial'
  }

  return 'superior_matrimonial'
}

/**
 * Parses an Airbnb reservation receipt/notification email (Spanish or English, HTML or plain text)
 */
export function parseAirbnbEmailPayload(input: {
  subject?: string
  from?: string
  textBody?: string
  htmlBody?: string
}): ParsedAirbnbEmail {
  const subject = (input.subject || '').trim()
  const rawBody = input.textBody || input.htmlBody || ''
  const cleanText = `${subject}\n${stripHtmlAndDecode(rawBody)}`
  const lower = cleanText.toLowerCase()

  // Detect event type
  let eventType: ParsedAirbnbEmail['eventType'] = 'reservation_confirmed'
  if (
    lower.includes('cancelada') ||
    lower.includes('canceló') ||
    lower.includes('canceled') ||
    lower.includes('cancelled')
  ) {
    eventType = 'reservation_cancelled'
  } else if (
    lower.includes('modificó') ||
    lower.includes('modificada') ||
    lower.includes('alteration') ||
    lower.includes('cambio de reserva')
  ) {
    eventType = 'reservation_modified'
  }

  // Extract Airbnb Confirmation Code (Typically 10 uppercase alphanumeric starting with H, e.g., HM8K9P2Q4R)
  const codeRegexes = [
    /(?:c[óo]digo\s+de\s+confirmaci[óo]n|confirmation\s+code|c[óo]digo\s+airbnb)[ \t:]*([A-Z0-9]{8,12})/i,
    /\b(HM[A-Z0-9]{7,9})\b/,
    /\b(H[A-Z0-9]{8,10})\b/,
  ]
  let airbnbCode = ''
  for (const rx of codeRegexes) {
    const m = cleanText.match(rx)
    if (m && m[1] && !/^(CONFIRMADA|CANCELADA|RESERVACION)$/i.test(m[1])) {
      airbnbCode = m[1].toUpperCase()
      break
    }
  }
  if (!airbnbCode) {
    airbnbCode = `HM${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  }

  // Extract Guest Name (single-line horizontal whitespace only)
  let guestName = ''
  const guestPatterns = [
    /(?:hu[ée]sped|guest|viajero|titular)[ \t:]+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:[ \t]+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/i,
    /¡?reserva\s+confirmada!?\s*[-–:]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:[ \t]+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})[ \t]+llega/i,
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+[ \t]+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)[ \t]+(?:llega[ \t]+el|arrives)/i,
  ]
  for (const gp of guestPatterns) {
    const m = cleanText.match(gp)
    if (m && m[1]) {
      guestName = m[1].trim().replace(/[ \t]+(llega|el|check|adultos).*$/i, '')
      break
    }
  }
  if (!guestName) guestName = 'Huésped Airbnb'

  // Extract Check-In and Check-Out Dates
  let checkInDate = ''
  let checkOutDate = ''

  const checkInMatch = cleanText.match(
    /(?:llegada|check-in|checkin|ingreso)[\s:]*([A-Za-záéíóú.,\s]*\d{1,4}[\/\-.\sA-Za-záéíóú0-9,]{3,22})/i
  )
  const checkOutMatch = cleanText.match(
    /(?:salida|check-out|checkout|egreso)[\s:]*([A-Za-záéíóú.,\s]*\d{1,4}[\/\-.\sA-Za-záéíóú0-9,]{3,22})/i
  )

  if (checkInMatch?.[1]) {
    checkInDate = parseFlexibleDate(checkInMatch[1]) || ''
  }
  if (checkOutMatch?.[1]) {
    checkOutDate = parseFlexibleDate(checkOutMatch[1]) || ''
  }

  // Fallback: scan all dates in text if labeled ones weren't found
  if (!checkInDate || !checkOutDate) {
    const dateCandidates: string[] = []
    const globalDateRx =
      /\b(202\d-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]202\d|\d{1,2}\s+(?:de\s+)?[a-záéíóú]{3,10}(?:\s+(?:de\s+)?202\d)?)\b/gi
    let match: RegExpExecArray | null
    while ((match = globalDateRx.exec(cleanText)) !== null) {
      const parsed = parseFlexibleDate(match[1])
      if (parsed && !dateCandidates.includes(parsed)) {
        dateCandidates.push(parsed)
      }
    }
    if (!checkInDate && dateCandidates[0]) checkInDate = dateCandidates[0]
    if (!checkOutDate && dateCandidates[1]) checkOutDate = dateCandidates[1]
  }

  // Safe default tomorrow -> +2 nights if email lacked explicit dates
  if (!checkInDate) {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    checkInDate = d.toISOString().split('T')[0]
  }
  if (!checkOutDate || checkOutDate <= checkInDate) {
    const d = new Date(checkInDate + 'T12:00:00')
    d.setDate(d.getDate() + 2)
    checkOutDate = d.toISOString().split('T')[0]
  }

  const nightsCount = Math.max(1, calculateNights(checkInDate, checkOutDate))

  // Detect Room Category
  const roomCategory = detectRoomCategoryFromText(cleanText)
  const catObj = getRoomCategoryBySlug(roomCategory)

  // Guests count
  let guestsCount = Math.min(2, catObj.maxGuests)
  const guestsMatch = cleanText.match(/(\d+)\s*(?:hu[ée]sped(?:es)?|adulto(?:s)?|persona(?:s)?|guests?)/i)
  if (guestsMatch?.[1]) {
    guestsCount = Math.min(catObj.maxGuests, Math.max(1, parseInt(guestsMatch[1], 10)))
  }

  // Phone & Email if included in receipt
  const phoneMatch = cleanText.match(/(\+?56[ \t]*9(?:[ \t]*\d){8}|\+\d{10,14})/)
  const guestPhone = phoneMatch ? phoneMatch[1].replace(/[ \t]+/g, '') : '+56900000000'

  const emailMatches = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  const guestEmail =
    emailMatches.find(
      (e) => !e.toLowerCase().includes('airbnb.com') && !e.toLowerCase().includes('allrenthoteles.cl')
    ) || `${airbnbCode.toLowerCase()}@guest.airbnb.com`

  // Extract CLP Payout / Total Amount
  let totalAmountCLP = 0
  const amountPatterns = [
    /(?:ganancia|recibes|total\s+pagado|payout|monto\s+total|total\s+clp|total)[\s:$CLP]*\$?\s*([\d]{2,3}(?:[.,]\d{3})+)/i,
    /\$\s*([\d]{2,3}(?:\.\d{3})+)\s*(?:CLP)?/i,
    /CLP\s*\$?\s*([\d]{2,3}(?:[.,]\d{3})+)/i,
  ]
  for (const ap of amountPatterns) {
    const m = cleanText.match(ap)
    if (m?.[1]) {
      const numeric = parseInt(m[1].replace(/[.,]/g, ''), 10)
      if (numeric >= 20000 && numeric <= 15000000) {
        totalAmountCLP = numeric
        break
      }
    }
  }
  if (!totalAmountCLP) {
    totalAmountCLP = catObj.pricePerNight * nightsCount
  }

  const isAirbnbValid =
    lower.includes('airbnb') ||
    Boolean(cleanText.match(/\bH[A-Z0-9]{8,10}\b/)) ||
    lower.includes('código de confirmación') ||
    lower.includes('confirmation code')

  return {
    isAirbnbValid,
    eventType,
    airbnbCode,
    guestName,
    guestEmail,
    guestPhone,
    guestsCount,
    roomCategory,
    checkInDate,
    checkOutDate,
    nightsCount,
    totalAmountCLP,
    notes: `Sincronizado automáticamente vía Comprobante Email Airbnb (${airbnbCode}). Check-in 12:00 / Check-out 12:00.`,
  }
}

export const SAMPLE_AIRBNB_EMAIL_TEMPLATES = [
  {
    label: 'Reserva Superior Matrimonial (2 noches)',
    from: 'automated@airbnb.com',
    subject: '¡Reserva confirmada! Camila Rojas llega el 04 dic 2026',
    body: `Airbnb - Comprobante Oficial de Reserva para Anfitrión (All Rent Hoteles)
Código de confirmación: HM9X4L7K2P
Propiedad: All Rent Hoteles Quintero - Habitación Superior Matrimonial (Baño privado)
Huésped: Camila Rojas
Teléfono: +56 9 8412 9930
Huéspedes: 2 adultos
Llegada: 04 de diciembre de 2026 (Check-in desde las 12:00)
Salida: 06 de diciembre de 2026 (Check-out hasta las 12:00)
Ganancia total anfitrión (CLP): $127.000 CLP

El pago se enviará automáticamente 24 horas después del check-in del huésped.`,
  },
  {
    label: 'Reserva Familiar con Terraza (3 noches)',
    from: 'automated@airbnb.com',
    subject: '¡Reserva confirmada! Sebastián Arriagada llega el 11 dic 2026',
    body: `Airbnb - Notificación de Nueva Reserva Confirmada
Código de confirmación: HMQ82W5N9T
Alojamiento: Suite Familiar con Terraza Vista Mar - All Rent Hoteles Av. Bulnes 119
Huésped: Sebastián Arriagada
Teléfono: +56 9 7623 1104
Huéspedes: 4 huéspedes
Llegada: 2026-12-11 (12:00 PM)
Salida: 2026-12-14 (12:00 PM)
Total pagado: $238.500 CLP`,
  },
  {
    label: 'Cancelación de Reserva Airbnb',
    from: 'automated@airbnb.com',
    subject: 'Reserva cancelada: Código HM9X4L7K2P',
    body: `Airbnb - Actualización de Reserva
La reserva con Código de confirmación: HM9X4L7K2P de Camila Rojas para Habitación Superior Matrimonial (Llegada: 2026-12-04, Salida: 2026-12-06) ha sido cancelada. Tu calendario ha quedado liberado.`,
  },
]
