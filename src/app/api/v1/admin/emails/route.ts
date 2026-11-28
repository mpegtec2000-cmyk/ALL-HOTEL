import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: db.getEmailOutbox(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookingId } = body as { bookingId?: string }
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el código de reserva (bookingId).' },
        { status: 400 }
      )
    }

    const emailLog = await db.resendBookingConfirmationEmail(bookingId)
    if (!emailLog) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada para enviar correo con QR.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: emailLog,
    })
  } catch (error) {
    console.error('Error sending/resending confirmation email with QR:', error)
    return NextResponse.json(
      { success: false, error: 'Error al despachar el correo con código QR.' },
      { status: 500 }
    )
  }
}
