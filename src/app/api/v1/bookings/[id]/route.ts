import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const booking = db.getBookingByCode(id)
  if (!booking) {
    return NextResponse.json(
      { success: false, error: 'No se encontró ninguna reserva con ese código.' },
      { status: 404 }
    )
  }
  return NextResponse.json({ success: true, data: booking })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const updates = await request.json()
    const updated = db.updateBooking(id, updates)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando reserva.' },
      { status: 500 }
    )
  }
}
