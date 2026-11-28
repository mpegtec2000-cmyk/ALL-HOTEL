import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentMethod } from '@/types/saas'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      extraNights = 1,
      extraAmount,
      paymentMethod = 'efectivo_recepcion',
      notes = '',
      operatorName = 'Portería All Rent Hoteles',
    } = body as {
      extraNights?: number
      extraAmount?: number
      paymentMethod?: PaymentMethod
      notes?: string
      operatorName?: string
    }

    const updated = db.extendBookingStayInPorteria({
      bookingId: id,
      extraNights: Number(extraNights) || 0,
      extraAmount: extraAmount !== undefined ? Number(extraAmount) : undefined,
      paymentMethod,
      notes,
      operatorName,
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error extending booking stay in Portería:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar días o cobro extra en Portería.' },
      { status: 500 }
    )
  }
}
