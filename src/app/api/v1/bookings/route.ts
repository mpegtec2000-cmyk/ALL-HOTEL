import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeHotelQuote } from '@/lib/pricing'
import { BookingSource, RoomCategorySlug } from '@/types/saas'

export async function GET() {
  const bookings = db.getBookings()
  return NextResponse.json({ success: true, data: bookings })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      roomCategory,
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
    } = body as {
      roomCategory: RoomCategorySlug
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

    const availableRoom = db.findAvailableRoomNumber(roomCategory, checkInDate, checkOutDate)
    if (!availableRoom) {
      return NextResponse.json(
        {
          success: false,
          error: `No quedan unidades disponibles en ${quote.roomCategory.name} para esas fechas. Por favor elige otra categoría o rango.`,
        },
        { status: 409 }
      )
    }

    const created = db.createBooking({
      source,
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
      amountPaid: 0,
      paymentStatus: 'unpaid',
      status: source === 'recepcion_directa' ? 'confirmed' : 'pending_payment',
      vehiclesCount,
      vehiclePlates,
      requiresParking,
      specialRequests,
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al procesar la reserva.' },
      { status: 500 }
    )
  }
}
