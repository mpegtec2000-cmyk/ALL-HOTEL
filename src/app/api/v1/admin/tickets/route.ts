import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InspectionTicket } from '@/types/saas'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: db.getAllTickets(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.bookingId || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: 'Reserva e ítems de inspección requeridos.' },
        { status: 400 }
      )
    }

    const hasIssue = body.items.some((i: { status: string }) => i.status === 'issue')
    const ticket: InspectionTicket = {
      id: `TCK-${Date.now().toString().slice(-5)}`,
      bookingId: body.bookingId,
      roomNumber: body.roomNumber,
      type: body.type || 'alistamiento_previo',
      title: body.title || `Inspección ${body.bookingId}`,
      operatorName: body.operatorName || 'Recepción All Rent',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: hasIssue ? 'con_observaciones' : 'aprobado',
      items: body.items,
      generalNotes: body.generalNotes || '',
    }

    const updated = db.saveTicket(body.bookingId, ticket)
    return NextResponse.json({ success: true, data: updated, ticket })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error guardando ticket de habitación.' },
      { status: 500 }
    )
  }
}
