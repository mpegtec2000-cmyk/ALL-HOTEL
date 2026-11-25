import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const existing = db.getBookingByCode(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada.' },
        { status: 404 }
      )
    }

    const updated = db.saveCheckIn(existing.id, {
      bookingId: existing.id,
      estimatedArrival: body.estimatedArrival || '12:00',
      vehiclesCount: Number(body.vehiclesCount) || 0,
      vehiclePlates: Array.isArray(body.vehiclePlates) ? body.vehiclePlates : [],
      guestList: Array.isArray(body.guestList) ? body.guestList : [],
      rulesAccepted: Boolean(body.rulesAccepted),
      rulesAcceptedAt: new Date().toISOString(),
      notes: body.notes || '',
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error procesando el check-in digital.' },
      { status: 500 }
    )
  }
}
