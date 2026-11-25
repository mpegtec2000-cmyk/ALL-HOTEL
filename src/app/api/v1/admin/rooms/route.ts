import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RoomCategorySlug } from '@/types/saas'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      categories: db.getRoomCategories(),
      units: db.getRoomUnits(),
    },
  })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    if (body.type === 'category' && body.slug) {
      const updated = db.updateRoomCategory(body.slug as RoomCategorySlug, body.updates || {})
      return NextResponse.json({ success: true, data: updated })
    }
    if (body.type === 'unit' && body.unitId) {
      const updated = db.updateRoomUnit(body.unitId, body.updates || {})
      return NextResponse.json({ success: true, data: updated })
    }
    return NextResponse.json({ success: false, error: 'Parámetros inválidos.' }, { status: 400 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando habitación.' },
      { status: 500 }
    )
  }
}
