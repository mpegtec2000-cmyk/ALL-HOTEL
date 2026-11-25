import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ success: true, data: db.getBlockedDates() })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.date) {
      return NextResponse.json({ success: false, error: 'Fecha requerida.' }, { status: 400 })
    }
    const created = db.addBlockedDate({
      date: body.date,
      roomCategory: body.roomCategory || 'all',
      roomNumber: body.roomNumber || undefined,
      reason: body.reason || 'Mantención',
    })
    return NextResponse.json({ success: true, data: created })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando bloqueo.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido.' }, { status: 400 })
  }
  const ok = db.removeBlockedDate(id)
  return NextResponse.json({ success: ok })
}
