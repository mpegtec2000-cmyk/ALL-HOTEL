import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      metrics: db.getDashboardMetrics(),
      settings: db.getSettings(),
    },
  })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const settings = db.updateSettings(body)
    return NextResponse.json({ success: true, data: settings })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error guardando ajustes del hotel.' },
      { status: 500 }
    )
  }
}
