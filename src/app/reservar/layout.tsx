import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar Habitación Online',
  description:
    'Reserva tu habitación en All Rent Hoteles Quintero (Av. Bulnes 119) como invitado o cliente registrado con confirmación instantánea y Pase QR.',
  alternates: {
    canonical: '/reservar',
  },
}

export default function ReservarLayout({ children }: { children: React.ReactNode }) {
  return children
}
