'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  Waves,
  Car,
  Sparkles,
  ArrowRight,
  BedDouble,
  MapPin,
  Star,
} from 'lucide-react'
import { OFFICIAL_ROOM_CATEGORIES, computeHotelQuote, formatCLP } from '@/lib/pricing'
import { RoomCategorySlug } from '@/types/saas'

const SLIDE_DURATION_MS = 5500

const HERO_SLIDES = [
  {
    num: '01',
    src: '/images/Warmly Lit AI Rent Hotel Facade.png',
    shortLabel: 'Fachada Iluminada All Rent Hoteles',
    tag: 'Av. Bulnes 119 · Frente al Mar',
    caption: 'Fachada principal iluminada en el corazón costero de Quintero',
  },
  {
    num: '02',
    src: '/images/playa-quintero-caleta.webp',
    shortLabel: 'Playa de Quintero',
    tag: 'Cruzando la Calle · Playa Principal',
    caption: 'Aguas turquesas y arena dorada a solo pasos de tu habitación',
  },
  {
    num: '03',
    src: '/images/hab-familiar-luminosa.webp',
    shortLabel: 'Habitación Familiar Luminosa',
    tag: 'Amplitud & Confort',
    caption: 'Espacios cálidos y luminosos diseñados para el descanso',
  },
  {
    num: '04',
    src: '/images/playa-principal-kayaks.webp',
    shortLabel: 'Playa Principal & Kayaks',
    tag: 'Aventura Costera',
    caption: 'Disfruta deportes náuticos y paseos frente al hotel',
  },
  {
    num: '05',
    src: '/images/hab-standard-matrimonial.webp',
    shortLabel: 'Standard Matrimonial',
    tag: 'Descanso Minimalista',
    caption: 'Habitaciones con madera vitrificada y ropa de cama blanca hotelera',
  },
  {
    num: '06',
    src: '/images/lobby-principal.webp',
    shortLabel: 'Lobby & Recepción',
    tag: 'Excelencia Hotelera',
    caption: 'Salón de recepción cálido con monitoreo CCTV y atención personalizada',
  },
  {
    num: '07',
    src: '/images/Vibrant Coastal Beach Kayaking Scene.png',
    shortLabel: 'Bahía Vibrante de Quintero',
    tag: 'Entorno Costero Único',
    caption: 'Vive la costa de Quintero a pasos de Av. Bulnes 119',
  },
  {
    num: '08',
    src: '/images/vestibulo-escalera-orquideas.webp',
    shortLabel: 'Vestíbulo & Escalera',
    tag: 'Arquitectura Interior',
    caption: 'Detalles clásicos y acogedores en cada rincón del hotel',
  },
  {
    num: '09',
    src: '/images/pasillo-madera-tallada.webp',
    shortLabel: 'Pasillo & Madera Tallada',
    tag: 'Calidez & Tradición',
    caption: 'Pasillos iluminados con arte en madera tallada',
  },
]

export default function HeroCarousel() {
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  // Quick booking state
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<RoomCategorySlug>('superior_matrimonial')

  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 3)
    setCheckIn(tomorrow.toISOString().split('T')[0])
    setCheckOut(dayAfter.toISOString().split('T')[0])
  }, [])

  // Automatic Hero Background Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(timer)
  }, [activeSlide])

  const liveQuote = useMemo(() => {
    if (!checkIn || !checkOut) return null
    return computeHotelQuote({
      roomCategory: selectedRoom,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    })
  }, [selectedRoom, checkIn, checkOut])

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('room', selectedRoom)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    router.push(`/reservar?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden pt-24 pb-10">
      {/* Automatic Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlide
          return (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.caption}
                fill
                priority={idx === 0}
                sizes="100vw"
                className={`object-cover ${isActive ? 'animate-kenburns' : ''}`}
              />
            </div>
          )
        })}
      </div>

      {/* Main Hero Grid */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto pt-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-8">
            {/* Main Brand Title Image (Transparent PNG) */}
            <h1 className="w-full max-w-3xl">
              <span className="sr-only">Tu refugio frente al mar — All Rent Hoteles Quintero</span>
              <Image
                src="/brand/tu-refugio-frente-al-mar.png"
                alt="Tu refugio frente al mar"
                width={2116}
                height={178}
                priority
                className="w-full h-auto object-contain object-left drop-shadow-[0_6px_28px_rgba(0,0,0,0.92)]"
              />
            </h1>

            {/* Subtitle with precise hierarchy */}
            <p className="mt-5 text-base sm:text-lg text-white max-w-2xl font-semibold leading-relaxed drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
              Hotel boutique en <strong className="text-white font-extrabold">Av. Bulnes 119</strong>,
              frente a la{' '}
              <strong className="text-white underline decoration-[#39FF14] decoration-2 underline-offset-4">
                playa principal de Quintero
              </strong>
              . Un entorno seguro junto a la Armada, con estacionamiento gratuito y atención
              personalizada durante toda tu estadía.
            </p>

            {/* Refined Architectural Highlights Bar */}
            <div className="mt-7 grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 text-xs font-bold">
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#000000] backdrop-blur-md border border-white/12 text-white/95">
                <Waves className="w-4 h-4 text-[#39FF14] shrink-0" />
                <span>Playa al Frente</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#000000] backdrop-blur-md border border-white/12 text-white/95">
                <ShieldCheck className="w-4 h-4 text-[#39FF14] shrink-0" />
                <span>Zona Naval Segura</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#000000] backdrop-blur-md border border-white/12 text-white/95">
                <Clock className="w-4 h-4 text-[#39FF14] shrink-0" />
                <span>Check-in 12:00 a 12:00</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#000000] backdrop-blur-md border border-white/12 text-white/95">
                <Car className="w-4 h-4 text-[#39FF14] shrink-0" />
                <span>Parking Gratis</span>
              </div>
            </div>
          </div>

          {/* Right Column: Official Framed Square Brand Logo Plaque */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-[2rem] bg-black border border-white/25 ring-1 ring-[#39FF14]/30 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_45px_rgba(57,255,20,0.16)] overflow-hidden p-4 flex items-center justify-center">
              <Image
                src="/brand/logo-square.png"
                alt="All Rent Hoteles Logo Oficial"
                fill
                priority
                sizes="(max-width: 1024px) 256px, 288px"
                className="object-contain p-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Online Booking & Live Quote Dock */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-2">
        <form
          onSubmit={handleQuickSearch}
          className="bg-[#000000] backdrop-blur-2xl border border-white/15 rounded-3xl p-4 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Room Category */}
            <div className="md:col-span-4">
              <label
                htmlFor="hero-room"
                className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-1.5"
              >
                <BedDouble className="w-3.5 h-3.5 text-[#39FF14]" /> Categoría de Habitación
              </label>
              <select
                id="hero-room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value as RoomCategorySlug)}
                className="w-full h-12 bg-[#000000] border border-white/15 rounded-xl px-3.5 text-sm font-bold text-white focus:outline-none focus:border-[#39FF14]"
              >
                {OFFICIAL_ROOM_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.bathroomLabel}) — {formatCLP(cat.pricePerNight)}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in */}
            <div className="md:col-span-2">
              <label
                htmlFor="hero-checkin"
                className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#39FF14]" /> Check-in (12:00)
              </label>
              <input
                id="hero-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full h-12 bg-[#000000] border border-white/15 rounded-xl px-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#39FF14] [color-scheme:dark]"
              />
            </div>

            {/* Check-out */}
            <div className="md:col-span-2">
              <label
                htmlFor="hero-checkout"
                className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#39FF14]" /> Check-out (12:00)
              </label>
              <input
                id="hero-checkout"
                type="date"
                min={checkIn}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full h-12 bg-[#000000] border border-white/15 rounded-xl px-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#39FF14] [color-scheme:dark]"
              />
            </div>

            {/* Live Total Preview */}
            <div className="md:col-span-2 flex flex-col justify-center px-3.5 py-2 rounded-xl bg-[#000000] border border-white/10 h-12">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                {liveQuote ? `Total ${liveQuote.nightsCount} ${liveQuote.nightsCount === 1 ? 'noche' : 'noches'}` : 'Tarifa Noche'}
              </span>
              <strong className="text-base font-black text-[#39FF14] leading-tight">
                {liveQuote ? formatCLP(liveQuote.totalAmount) : '$63.500'}
              </strong>
            </div>

            {/* Submit CTA */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider hover:bg-[#52ff33] shadow-[0_0_25px_rgba(57,255,20,0.38)] transition cursor-pointer"
              >
                <span>Reservar</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/65 pr-16 sm:pr-44">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#39FF14] shrink-0" />
              <span>
                Reserva online directa con <strong className="text-white">Pasarela Webpay, Tarjetas o Abono 50%</strong> · Confirmación y QR al instante
              </span>
            </span>
            <Link
              href="#habitaciones"
              className="font-bold text-white/85 hover:text-[#39FF14] transition"
            >
              Ver las 5 categorías ($39.500 a $79.500) →
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}
