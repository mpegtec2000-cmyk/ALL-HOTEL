import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const list = db.getSolicitudes()
  const stats = {
    total: list.length,
    nuevas: list.filter((s) => s.estado === 'nueva').length,
    contactadas: list.filter((s) => s.estado === 'contactado').length,
    cotizadas: list.filter((s) => s.estado === 'cotizado').length,
    convertidas: list.filter((s) => s.estado === 'convertida').length,
  }
  return NextResponse.json({ success: true, data: list, stats })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.nombre || !body.telefono) {
      return NextResponse.json(
        { success: false, error: 'Nombre y teléfono son obligatorios.' },
        { status: 400 }
      )
    }
    const created = db.addSolicitud({
      nombre: body.nombre,
      telefono: body.telefono,
      correo: body.correo || 'sin-correo@consulta.cl',
      checkInDeseado: body.checkInDeseado || 'Por definir',
      noches: Number(body.noches) || 1,
      huespedes: Number(body.huespedes) || 2,
      habitacionInteres: body.habitacionInteres || 'Superior Matrimonial',
      motivoViaje: body.motivoViaje || 'Turismo / Descanso Playa Quintero',
      mensaje: body.mensaje || '',
      origen: body.origen || 'formulario_web',
      presupuestoEstimado: Number(body.presupuestoEstimado) || undefined,
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al registrar solicitud.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido.' }, { status: 400 })
    }
    const updated = db.updateSolicitud(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando solicitud.' },
      { status: 500 }
    )
  }
}
