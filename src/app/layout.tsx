import type { Metadata } from 'next'
import { Montserrat, Allura } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

const allura = Allura({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'All Rent Hoteles | Av. Bulnes 119, Frente a la Playa de Quintero',
  description:
    'Tu estadía, nuestra prioridad. Hotel exclusivo en Av. Bulnes 119 frente a la playa principal de Quintero, en la zona más segura junto a los marinos. Estacionamiento gratuito, habitaciones con baño privado y reserva online con pago inmediato.',
  keywords: [
    'All Rent Hoteles',
    'Hotel en Quintero',
    'Alojamiento frente a la playa Quintero',
    'Av Bulnes 119 Quintero',
    'Hotel seguro Quintero',
    'Reserva online hotel Quintero',
  ],
  openGraph: {
    title: 'All Rent Hoteles Quintero — Tu estadía, nuestra prioridad',
    description:
      'A pasos de la playa principal de Quintero. Habitaciones desde $39.500, estacionamiento seguro gratuito y Check-in 12:00 a 12:00.',
    type: 'website',
    locale: 'es_CL',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${allura.variable}`}>
      <body className="bg-[#000000] text-white selection:bg-[#39FF14] selection:text-[#000000]">
        {children}
      </body>
    </html>
  )
}
