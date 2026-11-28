import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || ''
  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Correo requerido.' },
      { status: 400 }
    )
  }

  const profile = db.getClientProfileByEmail(email)
  if (!profile.client) {
    return NextResponse.json(
      { success: false, error: 'Cliente no encontrado.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    client: profile.client,
    bookings: profile.bookings,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action = 'login' } = body as {
      action: 'register' | 'login'
      name?: string
      email?: string
      phone?: string
      rutOrPassport?: string
      password?: string
      vehiclePlate?: string
    }

    if (action === 'register') {
      if (!body.name || !body.email || !body.phone || !body.rutOrPassport || !body.password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Completa nombre, RUT/Pasaporte, correo, teléfono y contraseña para crear tu cuenta.',
          },
          { status: 400 }
        )
      }

      const res = db.registerClientAccount({
        name: body.name,
        email: body.email,
        phone: body.phone,
        rutOrPassport: body.rutOrPassport,
        password: body.password,
        vehiclePlate: body.vehiclePlate,
      })

      if (!res.success) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 409 }
        )
      }

      return NextResponse.json({
        success: true,
        client: res.client,
        bookings: res.bookings,
      })
    }

    if (action === 'login') {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { success: false, error: 'Ingresa tu correo y contraseña.' },
          { status: 400 }
        )
      }

      const res = db.authenticateClientAccount(body.email, body.password)
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        client: res.client,
        bookings: res.bookings,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción inválida.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in client auth API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de cuentas de clientes.' },
      { status: 500 }
    )
  }
}
