export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'recepcion' | 'operador'
  phone: string
}

export function validateAdminPin(pinOrPassword: string, identifier?: string): AuthUser | null {
  const cleanPin = pinOrPassword.trim()
  const cleanId = identifier?.trim().toLowerCase()

  const envAdminPin = process.env.ADMIN_PIN?.trim()
  const envReceptionPin = process.env.RECEPTION_PIN?.trim()

  const adminPins = envAdminPin
    ? [envAdminPin]
    : ['2026', '1234', 'admin', 'allrent2026', 'AllRent2026*']
  const receptionPins = envReceptionPin
    ? [envReceptionPin]
    : ['recepcion', '1190', 'recepcion2026']

  const users = [
    {
      id: 'USR-ARH-01',
      name: 'Dirección General All Rent Hoteles',
      email: 'admin@allrenthoteles.cl',
      username: 'admin',
      pins: adminPins,
      role: 'superadmin' as const,
      phone: '+56 9 9865 1440',
    },
    {
      id: 'USR-ARH-02',
      name: 'Recepción Av. Bulnes 119',
      email: 'recepcion@allrenthoteles.cl',
      username: 'recepcion',
      pins: receptionPins,
      role: 'recepcion' as const,
      phone: '+56 9 9865 1440',
    },
  ]

  const found = users.find((u) => {
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
