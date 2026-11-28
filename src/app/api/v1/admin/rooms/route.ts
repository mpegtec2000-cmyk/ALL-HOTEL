import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RoomCategorySlug } from '@/types/saas'

export async function GET() {
  const costCentersReport = db.getCostCentersReport()
  return NextResponse.json({
    success: true,
    data: {
      categories: db.getRoomCategories(),
      units: db.getRoomUnits(),
      costCenters: costCentersReport.costCenters,
      costCenterTotals: costCentersReport.totals,
    },
  })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (body.type === 'category' && body.slug) {
      const updated = db.updateRoomCategory(body.slug as RoomCategorySlug, body.updates || {})
      return NextResponse.json({
        success: true,
        data: updated,
        costCentersReport: db.getCostCentersReport(),
      })
    }

    if (body.type === 'unit' && body.unitId) {
      const updated = db.updateRoomUnit(body.unitId, body.updates || {})
      return NextResponse.json({
        success: true,
        data: updated,
        costCentersReport: db.getCostCentersReport(),
      })
    }

    if (body.type === 'room_transaction' && body.roomNumber) {
      const txType = body.txType === 'ingreso' ? 'ingreso' : 'gasto'
      const rawAmount = Math.abs(Number(body.amount) || 0)
      if (rawAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'El monto debe ser mayor a 0.' },
          { status: 400 }
        )
      }
      const createdTx = db.addCashTransaction({
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: txType,
        category: body.category || (txType === 'gasto' ? 'mantencion_hotel' : 'pago_recepcion'),
        description: `${body.description || 'Movimiento Centro de Coste'} (Hab. ${body.roomNumber})`,
        amount: txType === 'gasto' ? -rawAmount : rawAmount,
        roomNumber: String(body.roomNumber),
        receiptNumber: body.receiptNumber || `CC-${body.roomNumber}-${Date.now().toString().slice(-3)}`,
        operator: body.operator || 'Admin Centro de Costes',
      })

      return NextResponse.json({
        success: true,
        data: createdTx,
        costCentersReport: db.getCostCentersReport(),
      })
    }

    return NextResponse.json({ success: false, error: 'Parámetros inválidos.' }, { status: 400 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando Centro de Costes de habitación.' },
      { status: 500 }
    )
  }
}
