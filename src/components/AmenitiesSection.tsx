import Image from 'next/image'
import {
  Wifi,
  ConciergeBell,
  CalendarCheck2,
  MapPin,
  Luggage,
  KeyRound,
  Headset,
  BedDouble,
} from 'lucide-react'
import Reveal from './Reveal'

const BRAND_FEATURES = [
  {
    num: '01',
    icon: BedDouble,
    title: 'Camas Hoteleras Premium',
    desc: 'Ropa blanca impecable, colchones de alta densidad y calidez en madera natural.',
  },
  {
    num: '02',
    icon: Wifi,
    title: 'Wi-Fi Fibra & Smart TV',
    desc: 'Conectividad estable en todo el hotel para teletrabajo, streaming o descanso.',
  },
  {
    num: '03',
    icon: ConciergeBell,
    title: 'Recepción & Concierge',
    desc: 'Atención hotelera dedicada, orientación turística de Quintero y asistencia durante tu estadía.',
  },
  {
    num: '04',
    icon: CalendarCheck2,
    title: 'Check-in 12:00 a 12:00',
    desc: 'Reserva online instantánea con pasarela de pago segura y confirmación inmediata.',
  },
  {
    num: '05',
    icon: MapPin,
    title: 'Av. Bulnes 119 · Playa al Frente',
    desc: 'Cruza la avenida hacia la playa principal y camina 10 minutos hasta la Plaza.',
  },
  {
    num: '06',
    icon: Luggage,
    title: 'Kitchenette & Patio Relax',
    desc: 'Refrigerador, microondas y un patio interior tranquilo para disfrutar tras la playa.',
  },
  {
    num: '07',
    icon: KeyRound,
    title: 'Estacionamiento y Seguridad',
    desc: 'Estacionamiento interior gratuito, CCTV y vecindad directa con los Marinos.',
  },
  {
    num: '08',
    icon: Headset,
    title: 'Pase QR & Autogestión',
    desc: 'Registra tu vehículo y acompañantes en línea desde el portal Mi Reserva.',
  },
]

export default function AmenitiesSection() {
  return (
    <section id="servicios" className="relative py-24 bg-[#000000] overflow-hidden lux-section-border">
      {/* Section Background Image: fondo señora.jpg */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/fondo señora.jpg"
          alt="Servicios All Rent Hoteles Quintero"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/75 via-[#000000]/40 to-[#000000]/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 mb-3 px-4 py-1.5 rounded-full lux-subcard">
            <div className="brand-stripes" aria-hidden="true">
              <span className="bg-[#B0E454]" />
              <span className="bg-[#B0E454]" />
              <span className="bg-white" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#B0E454]">
              Iconografía & Servicios Oficiales
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-[-0.025em] drop-shadow-[0_4px_20px_rgba(0,0,0,0.88)]">
            Todo pensado para <span className="text-[#B0E454]">tu tranquilidad</span>
          </h2>
          <p className="mt-3 text-white/90 font-medium text-base drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
            Comodidad costera, seguridad superior y tecnología de reserva directa sin comisiones ocultas.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BRAND_FEATURES.map((item, idx) => {
            const Icon = item.icon
            return (
              <Reveal
                key={item.title}
                delay={idx * 50}
                className="group p-6 rounded-3xl lux-card lux-grain flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl lux-subcard flex items-center justify-center transition-colors">
                      <Icon className="w-6 h-6 text-white group-hover:text-[#B0E454] stroke-[1.75] transition-colors" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white/35 group-hover:text-[#B0E454] transition-colors">
                      {item.num}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
