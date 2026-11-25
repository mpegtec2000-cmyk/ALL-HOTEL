import Image from 'next/image'
import Link from 'next/link'
import {
  Waves,
  ShieldCheck,
  Car,
  UtensilsCrossed,
  Award,
  Clock,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'
import Reveal from './Reveal'

export default function AboutExperience() {
  return (
    <section id="espacio" className="relative py-24 bg-[#000000] overflow-hidden lux-section-border">
      {/* Section Background Image: playa-quintero-caleta */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/playa-quintero-caleta.webp"
          alt="Playa de Quintero - All Rent Hoteles"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/75 via-[#000000]/30 to-[#000000]/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Balanced Architectural Bento Collage */}
          <Reveal className="lg:col-span-6 space-y-4">
            {/* Primary Facade Card with Double Architectural Photo Frame */}
            <div className="relative lux-photo-frame aspect-[16/10] bg-[#000000] group">
              <Image
                src="/images/Warmly Lit AI Rent Hotel Facade.png"
                alt="Fachada All Rent Hoteles Av. Bulnes 119 Quintero"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#000000]/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full lux-subcard text-xs font-bold text-white">
                  <MapPin className="w-3.5 h-3.5 text-[#B0E454]" /> Av. Bulnes 119, Quintero
                </span>
                <span className="px-3.5 py-1.5 rounded-full lux-btn text-xs font-black uppercase tracking-wider">
                  Check-in 12:00 a 12:00
                </span>
              </div>
            </div>

            {/* Bottom 2-Column Bento Sub-grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sub-card 1: Reception & Security */}
              <div className="rounded-2xl overflow-hidden lux-card p-3.5 flex flex-col justify-between">
                <div className="relative h-36 rounded-xl overflow-hidden mb-3 ring-1 ring-white/15">
                  <Image
                    src="/images/recepcion-cctv-seguridad.webp"
                    alt="Recepción moderna con videovigilancia All Rent Hoteles"
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#000000] border border-white/20 text-[10px] font-extrabold text-[#B0E454] uppercase">
                    Seguridad 24/7
                  </span>
                </div>
                <div className="flex items-start gap-2.5 px-1">
                  <ShieldCheck className="w-5 h-5 text-[#B0E454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-white uppercase tracking-wide">
                      Entorno Seguro & Monitoreado
                    </p>
                    <p className="text-[11px] text-white/75 leading-snug mt-0.5">
                      Ubicación privilegiada junto al recinto de la Armada con circuito cerrado de cámaras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-card 2: Beach Across the Street */}
              <div className="rounded-2xl overflow-hidden lux-card p-3.5 flex flex-col justify-between">
                <div className="relative h-36 rounded-xl overflow-hidden mb-3 ring-1 ring-white/15">
                  <Image
                    src="/images/Vibrant Coastal Beach Kayaking Scene.png"
                    alt="Playa de Quintero frente a All Rent Hoteles"
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full lux-btn text-[10px] font-black uppercase">
                    Frente al Mar
                  </span>
                </div>
                <div className="flex items-start gap-2.5 px-1">
                  <Waves className="w-5 h-5 text-[#B0E454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-white uppercase tracking-wide">
                      Primera Línea Costera
                    </p>
                    <p className="text-[11px] text-white/75 leading-snug mt-0.5">
                      Frente a la playa principal y a solo 10 minutos a pie de la Plaza de Quintero.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Corporate Editorial Narrative */}
          <Reveal
            delay={120}
            className="lg:col-span-6 space-y-6 lux-card lux-grain rounded-3xl p-6 sm:p-9"
          >
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full lux-subcard">
              <div className="brand-stripes" aria-hidden="true">
                <span className="bg-[#B0E454]" />
                <span className="bg-[#B0E454]" />
                <span className="bg-white" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#B0E454]">
                All Rent Hoteles · Quintero
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black tracking-[-0.025em] text-white leading-[1.1]">
              Hospitalidad costera de primer nivel,{' '}
              <span className="text-[#B0E454]">diseñada para tu descanso</span>
            </h2>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Ubicados estratégicamente en <strong className="text-white">Av. Bulnes 119</strong>,
              frente a la playa principal de Quintero. En{' '}
              <strong className="text-white">All Rent Hoteles</strong> combinamos infraestructura
              moderna, privacidad y la tranquilidad de un sector resguardado junto a la Armada,
              garantizando una experiencia segura y confortable tanto para escapadas familiares como
              para estadías ejecutivas.
            </p>

            {/* 2x2 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-4 rounded-2xl lux-subcard">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Waves className="w-5 h-5 text-[#B0E454] shrink-0" />
                  <h3 className="text-sm font-extrabold text-white">Ubicación Frente al Mar</h3>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">
                  Acceso directo cruzando la avenida hacia la playa principal y a 10 minutos de la Plaza.
                </p>
              </div>

              <div className="p-4 rounded-2xl lux-subcard">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Car className="w-5 h-5 text-[#B0E454] shrink-0" />
                  <h3 className="text-sm font-extrabold text-white">Estacionamiento Privado</h3>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">
                  Estacionamiento interior cerrado, gratuito y monitoreado para nuestros huéspedes.
                </p>
              </div>

              <div className="p-4 rounded-2xl lux-subcard">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <UtensilsCrossed className="w-5 h-5 text-[#B0E454] shrink-0" />
                  <h3 className="text-sm font-extrabold text-white">Kitchenette & Patio</h3>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">
                  Área equipada con refrigerador y microondas, además de un patio interior de descanso.
                </p>
              </div>

              <div className="p-4 rounded-2xl lux-subcard">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Clock className="w-5 h-5 text-[#B0E454] shrink-0" />
                  <h3 className="text-sm font-extrabold text-white">Check-in 12:00 a 12:00</h3>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">
                  Estadía cómoda con ingreso oficial desde las 12:00 hrs y salida hasta las 12:00 hrs.
                </p>
              </div>
            </div>

            {/* Corporate Hotel Commitment Banner */}
            <div className="p-5 rounded-2xl lux-card-featured flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl lux-btn flex items-center justify-center shrink-0 font-black">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-white">
                      All Rent Hoteles ·{' '}
                      <span className="text-[#B0E454]">Compromiso de Excelencia</span>
                    </p>
                    <CheckCircle2 className="w-4 h-4 text-[#B0E454] shrink-0" />
                  </div>
                  <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                    Nuestros huéspedes avalan la calidad de nuestras instalaciones, recepción oportuna y atención permanente durante toda su estadía.
                  </p>
                </div>
              </div>

              <Link
                href="/reservar"
                className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl lux-btn font-black text-xs uppercase tracking-wider"
              >
                Reservar Ahora <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
