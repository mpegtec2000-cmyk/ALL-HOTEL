import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateQrImageDataUrl } from '@/lib/qr-engine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      qrInput = '',
      action = 'inspect',
      operatorName = 'Admin Portería All Rent',
      vehiclePlate = '',
      notes = '',
    } = body as {
      qrInput: string
      action?: 'inspect' | 'checkin_entry' | 'checkout_exit'
      operatorName?: string
      vehiclePlate?: string
      notes?: string
    }

    if (!qrInput || !qrInput.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes escanear o ingresar un código QR válido.',
        },
        { status: 400 }
      )
    }

    const result = db.scanAndProcessQr({
      qrInput,
      action,
      operatorName,
      vehiclePlate,
      notes,
    })

    let qrDataUrl = ''
    if (result.booking?.qrToken) {
      qrDataUrl = await generateQrImageDataUrl(result.booking.qrToken)
    }

    return NextResponse.json({
      success: result.valid,
      data: {
        ...result,
        qrDataUrl,
      },
    })
  } catch (error) {
    console.error('QR Scan API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al verificar el código QR en la base de datos.',
      },
      { status: 500 }
    )
  }
}
