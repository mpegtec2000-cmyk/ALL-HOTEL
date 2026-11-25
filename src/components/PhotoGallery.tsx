'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import Reveal from './Reveal'

type GalleryCategory = 'todo' | 'habitaciones' | 'hotel' | 'entorno'

const GALLERY_ITEMS: Array<{
  src: string
  title: string
  tag: string
  category: Exclude<GalleryCategory, 'todo'>
  featured?: boolean
}> = [
  {
    src: '/images/fachada-nocturna.webp',
    title: 'Fachada Nocturna Av. Bulnes 119',
    tag: 'Hotel',
    category: 'hotel',
    featured: true,
  },
  {
    src: '/images/playa-quintero-caleta.webp',
    title: 'Aguas Cristalinas de Quintero',
    tag: 'Entorno Costero',
    category: 'entorno',
    featured: true,
  },
  {
    src: '/images/hab-superior-matrimonial.webp',
    title: 'Superior Matrimonial con Baño en Suite',
    tag: 'Habitación',
    category: 'habitaciones',
  },
  {
    src: '/images/lobby-principal.webp',
    title: 'Lobby Principal & Recepción',
    tag: 'Hotel',
    category: 'hotel',
  },
  {
    src: '/images/hab-standard-matrimonial.webp',
    title: 'Standard Matrimonial Minimalista',
    tag: 'Habitación',
    category: 'habitaciones',
  },
  {
    src: '/images/terraza-vista-atardecer.webp',
    title: 'Pasadizo Costero hacia el Atardecer',
    tag: 'Vista Mar',
    category: 'entorno',
  },
  {
    src: '/images/hab-familiar-luminosa.webp',
    title: 'Habitación Familiar Luminosa',
    tag: 'Habitación',
    category: 'habitaciones',
  },
  {
    src: '/images/salon-comedor-lounge.webp',
    title: 'Salón Comedor & Zona Lounge',
    tag: 'Hotel',
    category: 'hotel',
  },
  {
    src: '/images/playa-principal-kayaks.webp',
    title: 'Playa Principal Cruzando la Calle',
    tag: 'Entorno Costero',
    category: 'entorno',
  },
  {
    src: '/images/vestibulo-escalera-orquideas.webp',
    title: 'Vestíbulo & Escalera Principal',
    tag: 'Hotel',
    category: 'hotel',
  },
  {
    src: '/images/recepcion-cctv-seguridad.webp',
    title: 'Recepción & Monitoreo CCTV 24/7',
    tag: 'Seguridad',
    category: 'hotel',
  },
  {
    src: '/images/bahia-nocturna-quintero.webp',
    title: 'Bahía Iluminada por la Luna',
    tag: 'Entorno Costero',
    category: 'entorno',
  },
]

export default function PhotoGallery() {
  const [filter, setFilter] = useState<GalleryCategory>('todo')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const filtered =
    filter === 'todo' ? GALLERY_ITEMS : GALLERY_ITEMS.filter((i) => i.category === filter)

  useEffect(() => {
    if (lightboxIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % filtered.length))
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + filtered.length) % filtered.length
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIdx, filtered.length])

  const activeItem = lightboxIdx !== null ? filtered[lightboxIdx] : null

  return (
    <section id="galeria" className="py-24 bg-[#000000] lux-section-border lux-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-3 mb-3 px-4 py-1.5 rounded-full lux-subcard">
              <div className="brand-stripes" aria-hidden="true">
                <span className="bg-[#B0E454]" />
                <span className="bg-[#B0E454]" />
                <span className="bg-white" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#B0E454]">
                Galería Fotográfica Real
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-[-0.025em]">
              Conoce <span className="text-[#B0E454]">All Rent Hoteles</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todo', label: 'Todas (12)' },
              { id: 'habitaciones', label: 'Habitaciones' },
              { id: 'hotel', label: 'Lobby & Hotel' },
              { id: 'entorno', label: 'Playa & Quintero' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id as GalleryCategory)
                  setLightboxIdx(null)
                }}
                className={`px-4 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  filter === tab.id
                    ? 'lux-btn'
                    : 'lux-subcard text-white/80 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Bento / Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {filtered.map((item, idx) => {
            const isHeroSpan = filter === 'todo' && idx < 2
            const colSpan = isHeroSpan ? 'lg:col-span-6 h-72 sm:h-80' : 'lg:col-span-4 h-64'
            return (
              <button
                key={item.src}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className={`group relative ${colSpan} lux-photo-frame text-left cursor-pointer transition-all hover:-translate-y-1`}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/92 via-[#000000]/15 to-transparent" />
                <span className="absolute top-3.5 left-3.5 z-30 px-3 py-1 rounded-full lux-subcard text-[10px] font-extrabold uppercase tracking-wider text-[#B0E454]">
                  {item.tag}
                </span>
                <div className="absolute bottom-3.5 left-4 right-4 z-30 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{item.title}</span>
                  <span className="p-2 rounded-full lux-subcard text-[#B0E454] group-hover:bg-[#B0E454] group-hover:text-[#000000] transition">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lightbox with Prev / Next */}
      {activeItem && lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-white/80">
              <span className="text-[#B0E454] font-mono">
                FOTO {lightboxIdx + 1} DE {filtered.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#B0E454] cursor-pointer"
              >
                <X className="w-5 h-5" /> Cerrar
              </button>
            </div>
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/20 bg-[#000000]">
              <Image
                src={activeItem.src}
                alt={activeItem.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + filtered.length) % filtered.length)
                }
                aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#000000] border border-white/20 text-white hover:text-[#B0E454] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % filtered.length)}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#000000] border border-white/20 text-white hover:text-[#B0E454] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-center text-sm font-bold text-white">{activeItem.title}</p>
          </div>
        </div>
      )}
    </section>
  )
}
