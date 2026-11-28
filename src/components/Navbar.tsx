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
  UserCheck,
} from 'lucide-react'
import { COOKIE_KEYS, fastCachedFetch, getClientSessionCookie } from '@/lib/speed-cookies'

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
  const [clientName, setClientName] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })

    const clientSession = getClientSessionCookie()
    if (clientSession?.name) {
      setClientName(clientSession.name.split(' ')[0])
    }

    fastCachedFetch<{ success?: boolean; data?: { tempC?: number } }>(
      '/api/v1/weather',
      COOKIE_KEYS.WEATHER_CACHE,
      900,
      (fresh) => {
        if (fresh?.success && typeof fresh.data?.tempC === 'number') {
          setWeatherTemp(fresh.data.tempC)
        }
      }
    )
      .then((res) => {
        if (res?.success && typeof res.data?.tempC === 'number') {
          setWeatherTemp(res.data.tempC)
        }
      })
      .catch(() => {})

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#000000] border-b border-white/15 shadow-[inset_0_-1px_0_0_rgba(176,228,84,0.22),0_14px_40px_rgba(0,0,0,0.92)] ${
        scrolled ? 'py-2.5' : 'py-3.5'
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
              className="object-contain object-left drop-shadow-[0_0_14px_rgba(176,228,84,0.38)]"
            />
          </div>
        </Link>

        {/* Desktop Single-Line Navigation Pill */}
        <nav
          aria-label="Navegación principal"
          className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full lux-subcard"
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
                    ? 'bg-white/10 text-[#B0E454] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'text-white/80 hover:text-[#B0E454] hover:bg-white/[0.04]'
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
              className="whitespace-nowrap text-white/80 hover:text-[#B0E454] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions — Guaranteed Single-Line No-Wrap */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {weatherTemp !== null && (
            <div
              className="hidden 2xl:inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold lux-subcard rounded-full px-3.5 py-2 text-white/85"
              title="Clima actual en Playa Principal de Quintero"
            >
              <Sun className="w-3.5 h-3.5 text-[#B0E454] shrink-0" />
              <span>Quintero {weatherTemp}°C</span>
            </div>
          )}

          <Link
            href="/registro"
            className="whitespace-nowrap inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-full lux-subcard text-white hover:text-[#B0E454] transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#B0E454] shrink-0" />
            <span>{clientName ? `Cuenta (${clientName})` : 'Registro / Cliente'}</span>
          </Link>

          <Link
            href="/mi-reserva"
            className="whitespace-nowrap inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full lux-subcard text-white hover:text-[#B0E454] transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#B0E454] shrink-0" />
            <span>Mi Reserva</span>
          </Link>

          <Link
            href="/reservar"
            className="whitespace-nowrap inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full lux-btn"
          >
            <CalendarCheck className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Reservar Online</span>
          </Link>

          <Link
            href="/admin"
            title="Ingresar al Sistema Administrativo (PMS & Escáner QR)"
            aria-label="Ingresar al Sistema Administrativo"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full lux-subcard border border-[#B0E454]/40 text-[#B0E454] hover:bg-[#B0E454] hover:text-[#000000] shadow-[0_0_16px_rgba(176,228,84,0.22)] transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </div>

        {/* Mobile Quick System Icon + Menu Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/admin"
            title="Ingresar al Sistema Administrativo"
            aria-label="Ingresar al Sistema Administrativo"
            className="p-2.5 rounded-xl bg-[#B0E454]/15 border border-[#B0E454]/45 text-[#B0E454] hover:bg-[#B0E454] hover:text-[#000000] transition"
          >
            <ShieldCheck className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white hover:text-[#B0E454] transition"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#000000] backdrop-blur-2xl border-b border-white/15 px-5 pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B0E454]" /> Check-in 12:00 a Check-out 12:00
            </span>
            {weatherTemp !== null && (
              <span className="inline-flex items-center gap-1 text-[#B0E454] font-bold">
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
                className="text-sm font-bold text-white/90 hover:text-[#B0E454] py-2 border-b border-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <Link
              href="/reservar"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(176,228,84,0.35)]"
            >
              <CalendarCheck className="w-4 h-4" />
              Reservar Online
            </Link>
            <Link
              href="/registro"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-[#B0E454]/40 bg-[#B0E454]/10 text-[#B0E454] font-bold text-xs uppercase tracking-wider"
            >
              <UserCheck className="w-4 h-4" />
              {clientName ? `Mi Cuenta (${clientName})` : 'Registro / Cliente'}
            </Link>
            <Link
              href="/mi-reserva"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-bold text-xs uppercase tracking-wider"
            >
              <QrCode className="w-4 h-4 text-[#B0E454]" />
              Mi Reserva / QR
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#B0E454]" /> Av. Bulnes 119, Quintero
            </span>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1 text-white/75 hover:text-[#B0E454] font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B0E454]" /> Admin SaaS
            </Link>
          </div>
          <a
            href="tel:+56998651440"
            className="flex items-center justify-center gap-2 text-xs font-bold text-[#B0E454] pt-1"
          >
            <Phone className="w-3.5 h-3.5" /> +56 9 9865 1440 (Central de Reservas)
          </a>
        </div>
      )}
    </header>
  )
}
