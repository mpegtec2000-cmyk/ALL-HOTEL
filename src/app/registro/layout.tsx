import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registro y Portal de Clientes',
  description:
    'Crea tu cuenta de cliente en All Rent Hoteles Quintero para reservar más rápido, guardar tu matrícula y acceder a tus Pases QR.',
  alternates: {
    canonical: '/registro',
  },
}

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children
}
