import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi Reserva & Pase QR Digital',
  description: 'Consulta el estado de tu reserva y descarga tu Pase QR de Check-in en All Rent Hoteles Quintero.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MiReservaLayout({ children }: { children: React.ReactNode }) {
  return children
}
