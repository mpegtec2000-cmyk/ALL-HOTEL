import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RoomCategorySlug } from '@/types/saas'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') as RoomCategorySlug | null
  const summary = db.getAvailabilitySummary(category || undefined)
  return NextResponse.json({ success: true, data: summary })
}
