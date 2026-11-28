import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeHotelQuote } from '@/lib/pricing'
import { BookingSource, PaymentMethod, RoomCategorySlug } from '@/types/saas'

export async function GET() {
  const bookings = db.getBookings()
  return NextResponse.json({ success: true, data: bookings })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      roomCategory,
      assignedRoomNumber,
      checkInDate,
      checkOutDate,
      guestsCount = 2,
      clientName,
      clientEmail,
      clientPhone,
      clientRut,
      vehiclesCount = 0,
      vehiclePlates = [],
      requiresParking = false,
      specialRequests = '',
      source = 'web_online',
      markAsPaidFull = false,
      initialPaymentMode,
      paymentMethod = 'efectivo_recepcion',
      externalCode,
    } = body as {
      roomCategory: RoomCategorySlug
      assignedRoomNumber?: string
      checkInDate: string
      checkOutDate: string
      guestsCount?: number
      clientName: string
      clientEmail: string
      clientPhone: string
      clientRut?: string
      vehiclesCount?: number
      vehiclePlates?: string[]
      requiresParking?: boolean
      specialRequests?: string
      source?: BookingSource
      markAsPaidFull?: boolean
      initialPaymentMode?: 'full_100' | 'deposit_50' | 'unpaid_0'
      paymentMethod?: PaymentMethod
      externalCode?: string
    }

    if (!roomCategory || !checkInDate || !checkOutDate || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios para generar la reserva.' },
        { status: 400 }
      )
    }

    const categories = db.getRoomCategories()
    const quote = computeHotelQuote({
      roomCategory,
      checkInDate,
      checkOutDate,
      customCategories: categories,
    })

    if (!quote || quote.nightsCount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Las fechas seleccionadas no son válidas.' },
        { status: 400 }
      )
    }

    const availableRoom =
      assignedRoomNumber ||
      db.findAvailableRoomNumber(roomCategory, checkInDate, checkOutDate)

    if (!availableRoom) {
      return NextResponse.json(
        {
          success: false,
          error: `No quedan habitaciones disponibles en ${quote.roomCategory.name} para esas fechas. Por favor elige otra habitación o rango.`,
        },
        { status: 409 }
      )
    }

    const effectiveMode =
      initialPaymentMode ||
      (markAsPaidFull || source === 'recepcion_directa' ? 'full_100' : 'unpaid_0')

    const initialAmountPaid =
      effectiveMode === 'full_100'
        ? quote.totalAmount
        : effectiveMode === 'deposit_50'
        ? quote.deposit50Amount
        : 0

    const initialPaymentStatus =
      effectiveMode === 'full_100'
        ? 'paid_full'
        : effectiveMode === 'deposit_50'
        ? 'deposit_paid'
        : 'unpaid'

    const created = db.createBooking({
      source,
      externalCode: externalCode?.trim() || undefined,
      roomCategory,
      roomCategoryName: quote.roomCategory.name,
      assignedRoomNumber: availableRoom,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientRut: clientRut?.trim(),
      checkInDate,
      checkOutDate,
      nightsCount: quote.nightsCount,
      guestsCount: Math.min(quote.roomCategory.maxGuests, Math.max(1, Number(guestsCount))),
      ratePerNight: quote.ratePerNight,
      totalAmount: quote.totalAmount,
      depositRequired: quote.deposit50Amount,
      amountPaid: initialAmountPaid,
      paymentStatus: initialPaymentStatus,
      paymentMethod: initialAmountPaid > 0 ? paymentMethod : undefined,
      paidAt: initialAmountPaid > 0 ? new Date().toISOString() : undefined,
      status: source === 'recepcion_directa' || initialAmountPaid > 0 ? 'confirmed' : 'pending_payment',
      vehiclesCount,
      vehiclePlates,
      requiresParking,
      specialRequests,
    })

    if (created.status === 'confirmed' && created.clientEmail && created.clientEmail.includes('@')) {
      db.resendBookingConfirmationEmail(created.id).catch(() => {})
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al procesar la reserva.' },
      { status: 500 }
    )
  }
}
