import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administración PMS & Escáner QR',
  description: 'Panel administrativo interno de All Rent Hoteles.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
    },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
