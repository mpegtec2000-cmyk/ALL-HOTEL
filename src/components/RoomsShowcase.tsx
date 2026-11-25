'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Users,
  X,
  ArrowRight,
  Maximize2,
} from 'lucide-react'
import { OFFICIAL_ROOM_CATEGORIES, formatCLP } from '@/lib/pricing'
import { RoomCategory } from '@/types/saas'
import Reveal from './Reveal'

export default function RoomsShowcase() {
  const [cardPhotoIdx, setCardPhotoIdx] = useState<Record<string, number>>({})
  const [previewRoom, setPreviewRoom] = useState<RoomCategory | null>(null)
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0)

  function cycleCardPhoto(slug: string, total: number, delta: number, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setCardPhotoIdx((prev) => {
      const cur = prev[slug] || 0
      return { ...prev, [slug]: (cur + delta + total) % total }
    })
  }

  return (
    <section id="habitaciones" className="relative py-24 bg-[#000000] border-y border-white/10 overflow-hidden">
      {/* Section Background Image: fondo familia.jpg */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/fondo familia.jpg"
          alt="Habitaciones y Categorías Oficiales - All Rent Hoteles Quintero"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/60 via-[#000000]/35 to-[#000000]/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-3 mb-3 px-4 py-1.5 rounded-full bg-[#000000] backdrop-blur-md border border-white/15">
              <div className="brand-stripes" aria-hidden="true">
                <span className="bg-[#39FF14]" />
                <span className="bg-[#39FF14]" />
                <span className="bg-white" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#39FF14]">
                5 Categorías Oficiales
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.025em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
              Habitaciones & <span className="text-[#39FF14]">Tarifas</span>
            </h2>
            <p className="mt-3 text-white/90 max-w-2xl text-sm sm:text-base font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Todas nuestras habitaciones incluyen estacionamiento privado gratuito, Wi-Fi fibra óptica, acceso a kitchenette y patio.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#000000] backdrop-blur-md border border-[#39FF14]/45 text-xs font-extrabold text-white self-start lg:self-auto">
            <Clock className="w-4 h-4 text-[#39FF14]" />
            <span>Check-in: 12:00 hrs · Check-out: 12:00 hrs</span>
          </div>
        </Reveal>

        {/* Exact 5 Official Room Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-7">
          {OFFICIAL_ROOM_CATEGORIES.map((room, index) => {
            const isPrivateEnSuite = room.bathroomLabel === 'Baño privado'
            const activeIdx = cardPhotoIdx[room.slug] || 0
            const currentImg = room.gallery[activeIdx] || room.image
            // First 3 cards take 2 of 6 columns each; bottom 2 cards take 3 of 6 columns each for a balanced 5-card grid
            const colSpanClass = index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'

            return (
              <Reveal
                key={room.slug}
                delay={index * 60}
                as="article"
                className={`${colSpanClass} group rounded-3xl overflow-hidden bg-[#000000] backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between ${
                  isPrivateEnSuite
                    ? 'border-[#39FF14]/40 shadow-[0_14px_45px_rgba(57,255,20,0.08)] hover:border-[#39FF14]'
                    : 'border-white/15 hover:border-[#39FF14]/60'
                }`}
              >
                <div>
                  {/* Room Image with Inline Mini-Carousel */}
                  <div className="relative h-64 overflow-hidden bg-[#000000]">
                    <Image
                      src={currentImg}
                      alt={`${room.name} (${room.bathroomLabel}) - All Rent Hoteles`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/15 to-black/35" />

                    {/* Top Bathroom Badge — Exact Official Label */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                      <span
                        className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isPrivateEnSuite
                            ? 'bg-[#39FF14] text-[#000000]'
                            : 'bg-[#000000] text-white border border-white/25 backdrop-blur-md'
                        }`}
                      >
                        {room.bathroomLabel}
                      </span>
                    </div>

                    {/* Inline Prev/Next Arrows on Hover */}
                    {room.gallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => cycleCardPhoto(room.slug, room.gallery.length, -1, e)}
                          aria-label="Foto anterior"
                          className="opacity-0 group-hover:opacity-100 absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#000000] border border-white/20 text-white hover:text-[#39FF14] transition cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => cycleCardPhoto(room.slug, room.gallery.length, 1, e)}
                          aria-label="Siguiente foto"
                          className="opacity-0 group-hover:opacity-100 absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#000000] border border-white/20 text-white hover:text-[#39FF14] transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Quick Preview Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewRoom(room)
                        setModalPhotoIdx(activeIdx)
                      }}
                      className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#000000] backdrop-blur-md border border-white/20 text-xs font-bold text-white hover:border-[#39FF14] hover:text-[#39FF14] transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#39FF14]" /> {activeIdx + 1}/{room.gallery.length}
                    </button>

                    {/* Price Overlay */}
                    <div className="absolute bottom-3 left-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/75 font-bold">
                        Valor por Noche
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {formatCLP(room.pricePerNight)}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-[#39FF14] transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#39FF14]/90 mt-1">
                        ({room.bathroomLabel}) · {formatCLP(room.pricePerNight)} / noche
                      </p>
                    </div>

                    {/* Specs Row */}
                    <div className="flex flex-wrap gap-1.5 text-xs text-white/80 font-medium">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                        <Users className="w-3.5 h-3.5 text-[#39FF14]" />{' '}
                        {room.maxGuests === 1 ? '1 persona' : `Hasta ${room.maxGuests} personas`}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                        <BedDouble className="w-3.5 h-3.5 text-[#39FF14]" /> {room.bedConfig}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                        <Maximize2 className="w-3.5 h-3.5 text-[#39FF14]" /> {room.sizeM2} m²
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                      {room.description}
                    </p>

                    <ul className="space-y-1.5 pt-1">
                      {room.highlights.slice(0, 4).map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-xs text-white/85 font-medium"
                        >
                          <Check className="w-3.5 h-3.5 text-[#39FF14] shrink-0 stroke-[3]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="px-6 pb-6 pt-2">
                  <Link
                    href={`/reservar?room=${room.slug}`}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#39FF14] text-[#000000] hover:bg-[#52ff33] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(57,255,20,0.22)] transition-all"
                  >
                    <span>Reservar por {formatCLP(room.pricePerNight)}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>

      {/* Room Detail Modal */}
      {previewRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setPreviewRoom(null)}
        >
          <div
            className="bg-[#000000] border border-white/15 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-96 bg-black">
              <Image
                src={previewRoom.gallery[modalPhotoIdx] || previewRoom.image}
                alt={previewRoom.name}
                fill
                sizes="800px"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewRoom(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#000000] border border-white/20 text-white hover:text-[#39FF14]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {previewRoom.gallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setModalPhotoIdx(i)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      i === modalPhotoIdx ? 'border-[#39FF14]' : 'border-white/15 opacity-60'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
                <div>
                  <span className="text-xs font-bold text-[#39FF14] uppercase">
                    {previewRoom.bathroomLabel} · Check-in 12:00 a 12:00
                  </span>
                  <h3 className="text-2xl font-black text-white">{previewRoom.name}</h3>
                  <p className="text-sm text-white/70">{previewRoom.bedConfig}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-white/60 block">Tarifa Noche</span>
                    <strong className="text-2xl font-black text-[#39FF14]">
                      {formatCLP(previewRoom.pricePerNight)}
                    </strong>
                  </div>
                  <Link
                    href={`/reservar?room=${previewRoom.slug}`}
                    className="px-5 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider hover:bg-[#52ff33]"
                  >
                    Reservar Ahora
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
