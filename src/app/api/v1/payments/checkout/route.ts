import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentMethod } from '@/types/saas'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      bookingId,
      gateway = 'webpay_tarjeta',
      paymentMode = 'full_100',
      cardNumber = '',
      cardHolder = '',
      installments = 1,
      transferReference = '',
    } = body as {
      bookingId: string
      gateway: PaymentMethod
      paymentMode: 'full_100' | 'deposit_50' | 'balance_50'
      cardNumber?: string
      cardHolder?: string
      installments?: number
      transferReference?: string
    }

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Código de reserva requerido para procesar el pago.' },
        { status: 400 }
      )
    }

    const booking = db.getBookingByCode(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada.' },
        { status: 404 }
      )
    }

    // Detect card brand cleanly from digits (never store full PAN - PCI best practice)
    const digits = cardNumber.replace(/\D/g, '')
    const last4 = digits.slice(-4) || '8842'
    let cardBrand = 'Redcompra Débito'
    if (gateway === 'transferencia') {
      cardBrand = 'Transferencia Bancaria'
    } else if (gateway === 'mercadopago') {
      cardBrand = 'Mercado Pago Wallet'
    } else if (digits.startsWith('4')) {
      cardBrand = Number(installments) > 1 ? 'Visa Crédito' : 'Visa Débito / Crédito'
    } else if (digits.startsWith('5') || digits.startsWith('2')) {
      cardBrand = 'Mastercard Webpay'
    } else if (digits.startsWith('3')) {
      cardBrand = 'American Express'
    }

    // Optional declined test card check (per Stripe/Transbank test convention 4000...0002)
    if (digits.endsWith('0002')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transacción rechazada por el banco emisor (Tarjeta de prueba declinada). Intenta con otra tarjeta.',
        },
        { status: 402 }
      )
    }

    const result = db.processBookingPayment({
      bookingId: booking.id,
      gateway,
      paymentMode,
      cardLast4: last4,
      cardBrand: cardHolder ? `${cardBrand} (${cardHolder.toUpperCase().slice(0, 18)})` : cardBrand,
      installments: Number(installments) || 1,
      externalReference:
        transferReference ||
        (gateway === 'mercadopago'
          ? `MP-${Math.floor(10000000 + Math.random() * 90000000)}`
          : `TBK-${Math.floor(100000 + Math.random() * 900000)}`),
    })

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No se pudo registrar el pago.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.booking,
      payment: result.payment,
    })
  } catch (error) {
    console.error('Payment checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la pasarela de pagos.' },
      { status: 500 }
    )
  }
}
