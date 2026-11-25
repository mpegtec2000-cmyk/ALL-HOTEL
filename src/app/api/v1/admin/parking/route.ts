import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const list = db.getParkingRecords()
  return NextResponse.json({
    success: true,
    data: list,
    metrics: {
      activeVehicles: list.filter((p) => p.status === 'estacionado').length,
      totalRegistered: list.length,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.guestName || !body.vehiclePlate) {
      return NextResponse.json(
        { success: false, error: 'Nombre y patente del vehículo son obligatorios.' },
        { status: 400 }
      )
    }
    const rec = db.addParkingRecord({
      bookingId: body.bookingId || undefined,
      roomNumber: body.roomNumber || undefined,
      guestName: body.guestName,
      guestRut: body.guestRut || undefined,
      guestPhone: body.guestPhone || undefined,
      vehiclePlate: String(body.vehiclePlate).trim().toUpperCase(),
      vehicleModel: body.vehicleModel || undefined,
      parkingSpot: body.parkingSpot || 'Estacionamiento Interior Seguro',
      status: body.status || 'estacionado',
      notes: body.notes || '',
    })
    return NextResponse.json({ success: true, data: rec }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error registrando vehículo.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json()
    const updated = db.checkoutParkingRecord(id)
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error registrando salida vehicular.' },
      { status: 500 }
    )
  }
}
