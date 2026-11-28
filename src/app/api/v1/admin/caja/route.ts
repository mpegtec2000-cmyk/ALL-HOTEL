import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      transactions: db.getCashTransactions(),
      summary: db.getCashSummary(),
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawAmt = Math.abs(Number(body.amount) || 0)
    if (!body.description || rawAmt <= 0) {
      return NextResponse.json(
        { success: false, error: 'Descripción y monto válido son obligatorios.' },
        { status: 400 }
      )
    }

    const tx = db.addCashTransaction({
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: body.type === 'gasto' ? 'gasto' : 'ingreso',
      category: body.category || 'otro',
      description: body.description,
      amount: body.type === 'gasto' ? -rawAmt : rawAmt,
      bookingId: body.bookingId || undefined,
      roomNumber: body.roomNumber ? String(body.roomNumber) : undefined,
      receiptNumber: body.receiptNumber || `MOV-${Date.now().toString().slice(-4)}`,
      operator: body.operator || 'Administración All Rent',
    })

    return NextResponse.json({
      success: true,
      data: tx,
      summary: db.getCashSummary(),
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error registrando movimiento en caja.' },
      { status: 500 }
    )
  }
}
