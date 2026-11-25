'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarCheck,
  Menu,
  X,
  QrCode,
  ShieldCheck,
  Phone,
  Sun,
  MapPin,
  Clock,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '#espacio', label: 'El Hotel' },
  { href: '#habitaciones', label: 'Habitaciones & Tarifas' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#galeria', label: 'Galería' },
  { href: '#contacto', label: 'Reseñas & Contacto' },
  { href: '#ubicacion', label: 'Ubicación' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null)
  const [activeHash, setActiveHash] = useState('#espacio')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })

    fetch('/api/v1/weather')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && typeof res.data?.tempC === 'number') {
          setWeatherTemp(res.data.tempC)
        }
      })
      .catch(() => {})

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#000000] border-b border-white/15 ${
        scrolled ? 'shadow-[0_12px_40px_rgba(0,0,0,0.95)] py-2.5' : 'py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Official Brand Logo (Preserved & Highlighted) */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-12 w-38 sm:h-14 sm:w-44 transition-transform duration-300 group-hover:scale-[1.03]">
            <Image
              src="/brand/logo-neon.png"
              alt="All Rent Hoteles Quintero"
              fill
              priority
              sizes="180px"
              className="object-contain object-left drop-shadow-[0_0_14px_rgba(57,255,20,0.38)]"
            />
          </div>
        </Link>

        {/* Desktop Single-Line Navigation Pill */}
        <nav
          aria-label="Navegación principal"
          className="hidden xl:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeHash === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActiveHash(link.href)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-white/10 text-[#39FF14]'
                    : 'text-white/80 hover:text-[#39FF14] hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        {/* Compact Desktop Links for lg breakpoint */}
        <nav
          aria-label="Navegación compacta"
          className="hidden lg:flex xl:hidden items-center gap-5 text-xs font-bold"
        >
          {NAV_LINKS.slice(0, 5).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-white/80 hover:text-[#39FF14] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions — Guaranteed Single-Line No-Wrap */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {weatherTemp !== null && (
            <div
              className="hidden 2xl:inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold bg-white/[0.04] border border-white/10 rounded-full px-3.5 py-2 text-white/85"
              title="Clima actual en Playa Principal de Quintero"
            >
              <Sun className="w-3.5 h-3.5 text-[#39FF14] shrink-0" />
              <span>Quintero {weatherTemp}°C</span>
            </div>
          )}

          <Link
            href="/mi-reserva"
            className="whitespace-nowrap inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-white hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#39FF14] shrink-0" />
            <span>Mi Reserva</span>
          </Link>

          <Link
            href="/reservar"
            className="whitespace-nowrap inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#39FF14] text-[#000000] hover:bg-[#52ff33] shadow-[0_0_24px_rgba(57,255,20,0.4)] hover:shadow-[0_0_32px_rgba(57,255,20,0.68)] transition-all"
          >
            <CalendarCheck className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Reservar Online</span>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white hover:text-[#39FF14] transition"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#000000] backdrop-blur-2xl border-b border-white/15 px-5 pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#39FF14]" /> Check-in 12:00 a Check-out 12:00
            </span>
            {weatherTemp !== null && (
              <span className="inline-flex items-center gap-1 text-[#39FF14] font-bold">
                <Sun className="w-3.5 h-3.5" /> {weatherTemp}°C
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-bold text-white/90 hover:text-[#39FF14] py-2 border-b border-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <Link
              href="/reservar"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(57,255,20,0.35)]"
            >
              <CalendarCheck className="w-4 h-4" />
              Reservar con Pago Online
            </Link>
            <Link
              href="/mi-reserva"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-bold text-xs uppercase tracking-wider"
            >
              <QrCode className="w-4 h-4 text-[#39FF14]" />
              Mi Reserva / Pase QR
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#39FF14]" /> Av. Bulnes 119, Quintero
            </span>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1 text-white/75 hover:text-[#39FF14] font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#39FF14]" /> Admin SaaS
            </Link>
          </div>
          <a
            href="tel:+56998651440"
            className="flex items-center justify-center gap-2 text-xs font-bold text-[#39FF14] pt-1"
          >
            <Phone className="w-3.5 h-3.5" /> +56 9 9865 1440 (Central de Reservas)
          </a>
        </div>
      )}
    </header>
  )
}
