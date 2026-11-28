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
    const {
      bookingId = 'ARH-2026-1043',
      recipientEmail,
      senderEmail,
      senderAppPassword,
      saveCredentialsToAccount1 = true,
    } = body as {
      bookingId?: string
      recipientEmail?: string
      senderEmail?: string
      senderAppPassword?: string
      saveCredentialsToAccount1?: boolean
    }

    const emailLog = await db.resendBookingConfirmationEmail(bookingId, {
      overrideRecipientEmail: recipientEmail?.trim() || undefined,
      overrideSenderEmail: senderEmail?.trim() || undefined,
      overrideSenderAppPassword: senderAppPassword?.trim() || undefined,
      saveCredentialsToAccount1,
    })

    if (!emailLog) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada para enviar correo con QR.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: emailLog,
      smtpSent: emailLog.deliveryStatus === 'sent_smtp',
      deliveryStatus: emailLog.deliveryStatus,
      errorDetail: emailLog.errorDetail,
    })
  } catch (error) {
    console.error('Error sending/resending confirmation email with QR:', error)
    return NextResponse.json(
      { success: false, error: 'Error al despachar el correo con código QR.' },
      { status: 500 }
    )
  }
}
