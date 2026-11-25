import { NextResponse } from 'next/server'
import { validateAdminPin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { pin, identifier } = await request.json()
    if (!pin) {
      return NextResponse.json({ success: false, error: 'Ingresa tu clave o PIN.' }, { status: 400 })
    }
    const user = validateAdminPin(String(pin), identifier)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'PIN o credenciales incorrectas.' },
        { status: 401 }
      )
    }
    return NextResponse.json({ success: true, user })
  } catch {
    return NextResponse.json({ success: false, error: 'Error de autenticación.' }, { status: 500 })
  }
}
