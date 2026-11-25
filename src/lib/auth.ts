export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'recepcion' | 'operador'
  phone: string
}

export const ADMIN_USERS = [
  {
    id: 'USR-ARH-01',
    name: 'Dirección General All Rent Hoteles',
    email: 'admin@allrenthoteles.cl',
    username: 'admin',
    pins: ['2026', '1234', 'admin', 'allrent2026', 'AllRent2026*'],
    role: 'superadmin' as const,
    phone: '+56 9 9865 1440',
  },
  {
    id: 'USR-ARH-02',
    name: 'Recepción Av. Bulnes 119',
    email: 'recepcion@allrenthoteles.cl',
    username: 'recepcion',
    pins: ['recepcion', '1190', 'recepcion2026'],
    role: 'recepcion' as const,
    phone: '+56 9 9865 1440',
  },
]

export function validateAdminPin(pinOrPassword: string, identifier?: string): AuthUser | null {
  const cleanPin = pinOrPassword.trim()
  const cleanId = identifier?.trim().toLowerCase()

  const found = ADMIN_USERS.find((u) => {
    const pinMatches = u.pins.some((p) => p.toLowerCase() === cleanPin.toLowerCase())
    if (!cleanId) return pinMatches
    return (
      (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
      pinMatches
    )
  })

  if (!found) return null

  return {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    phone: found.phone,
  }
}
