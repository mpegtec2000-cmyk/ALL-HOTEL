import type { Metadata } from 'next'
import { Montserrat, Allura } from 'next/font/google'
import SpeedOptimizerAndCookies from '@/components/SpeedOptimizerAndCookies'
import './globals.css'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://allrenthoteles.cl'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'All Rent Hoteles Quintero | Av. Bulnes 119, Frente a la Playa',
    template: '%s | All Rent Hoteles Quintero',
  },
  description:
    'Tu estadía, nuestra prioridad. Hotel exclusivo en Av. Bulnes 119 frente a la playa principal de Quintero, junto a la Armada. Estacionamiento gratuito, habitaciones con baño privado desde $39.500, Check-in QR 12:00 hrs y reserva online.',
  keywords: [
    'All Rent Hoteles',
    'Hotel en Quintero',
    'Alojamiento frente a la playa Quintero',
    'Av Bulnes 119 Quintero',
    'Hotel seguro Quintero',
    'Habitaciones Quintero baño privado',
    'Reserva online hotel Quintero',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'All Rent Hoteles Quintero — Tu estadía, nuestra prioridad',
    description:
      'A pasos de la playa principal de Quintero (Av. Bulnes 119). Habitaciones desde $39.500 a $79.500, estacionamiento seguro gratuito y Check-in 12:00 a 12:00 hrs.',
    url: SITE_URL,
    siteName: 'All Rent Hoteles Quintero',
    type: 'website',
    locale: 'es_CL',
    images: [
      {
        url: '/images/Warmly Lit AI Rent Hotel Facade.png',
        width: 1200,
        height: 630,
        alt: 'All Rent Hoteles Quintero - Fachada en Av. Bulnes 119',
      },
      {
        url: '/brand/logo-square.png',
        width: 800,
        height: 800,
        alt: 'All Rent Hoteles Quintero Logo Oficial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Rent Hoteles Quintero — Frente a la Playa Principal',
    description:
      'Reserva online en Av. Bulnes 119, Quintero. Habitaciones con baño privado, estacionamiento gratuito y Pase QR digital.',
    images: ['/images/Warmly Lit AI Rent Hotel Facade.png'],
  },
}

const HOTEL_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: 'All Rent Hoteles Quintero',
  description:
    'Hotel costero en Av. Bulnes 119 frente a la playa principal de Quintero, en zona residencial resguardada junto a la Armada. Habitaciones con baño privado, estacionamiento interior gratuito CCTV, Wi-Fi fibra óptica y kitchenette.',
  url: SITE_URL,
  telephone: '+56998651440',
  email: 'reservas@allrenthoteles.cl',
  priceRange: '$39.500 - $79.500 CLP',
  checkinTime: '12:00',
  checkoutTime: '12:00',
  currenciesAccepted: 'CLP',
  paymentAccepted: 'Tarjeta de Crédito, Redcompra, Webpay, Flow, Transferencia Bancaria',
  image: [
    `${SITE_URL}/images/Warmly Lit AI Rent Hotel Facade.png`,
    `${SITE_URL}/images/hab-superior-matrimonial.webp`,
    `${SITE_URL}/images/terraza-vista-atardecer.webp`,
  ],
  logo: `${SITE_URL}/brand/logo-square.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Bulnes 119',
    addressLocality: 'Quintero',
    addressRegion: 'Valparaíso',
    postalCode: '2490000',
    addressCountry: 'CL',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -32.7767,
    longitude: -71.5267,
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento privado gratuito CCTV', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi fibra óptica gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Kitchenette equipada y patio interior', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Frente a la playa principal de Quintero', value: true },
  ],
  makesOffer: [
    {
      '@type': 'Offer',
      name: 'Superior Matrimonial (Baño privado)',
      price: '63500',
      priceCurrency: 'CLP',
    },
    {
      '@type': 'Offer',
      name: 'Standard Matrimonial (Baño privado exterior)',
      price: '53500',
      priceCurrency: 'CLP',
    },
    {
      '@type': 'Offer',
      name: 'Doble Dos Camas (Baño privado exterior)',
      price: '49500',
      priceCurrency: 'CLP',
    },
    {
      '@type': 'Offer',
      name: 'Single Individual (Baño privado exterior)',
      price: '39500',
      priceCurrency: 'CLP',
    },
    {
      '@type': 'Offer',
      name: 'Familiar con Terraza (Baño privado)',
      price: '79500',
      priceCurrency: 'CLP',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CL" className={`${montserrat.variable} ${allura.variable}`}>
      <body className="bg-[#000000] text-white selection:bg-[#B0E454] selection:text-[#000000]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HOTEL_JSON_LD) }}
        />
        {children}
        <SpeedOptimizerAndCookies />
      </body>
    </html>
  )
}
