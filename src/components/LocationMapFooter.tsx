import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Clock, ShieldCheck, ExternalLink, Lock, Waves, Compass } from 'lucide-react'
import Reveal from './Reveal'

export default function LocationMapFooter() {
  return (
    <>
      <section id="ubicacion" className="py-24 bg-[#000000] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-3">
                <div className="brand-stripes" aria-hidden="true">
                  <span className="bg-[#39FF14]" />
                  <span className="bg-[#39FF14]" />
                  <span className="bg-white" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#39FF14]">
                  Ubicación Estratégica
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-[-0.025em]">
                Av. Bulnes 119, <span className="text-[#39FF14]">Quintero</span>
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                Justo enfrente de la playa principal de Quintero, a unos 10 minutos caminando de la Plaza de Quintero y resguardados junto al recinto de los marinos.
              </p>

              {/* Proximity Pills */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#000000] border border-white/10">
                  <Waves className="w-4 h-4 text-[#39FF14] mb-1" />
                  <p className="text-xs font-extrabold text-white">Playa Principal</p>
                  <p className="text-[11px] text-white/60">Cruzando la calle (1 min)</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#000000] border border-white/10">
                  <Compass className="w-4 h-4 text-[#39FF14] mb-1" />
                  <p className="text-xs font-extrabold text-white">Plaza de Quintero</p>
                  <p className="text-[11px] text-white/60">10 minutos a pie</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1 text-sm">
                <div className="flex items-center gap-3 text-white/90">
                  <MapPin className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <span>Av. Bulnes 119, 2500000 Quintero, Región de Valparaíso</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Phone className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <a href="tel:+56998651440" className="hover:text-[#39FF14] font-bold">
                    +56 9 9865 1440 (Central de Reservas & Recepción)
                  </a>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Clock className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <span>Check-in: 12:00 hrs · Check-out: 12:00 hrs</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <ShieldCheck className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <span>Estacionamiento interior gratuito para huéspedes</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://maps.google.com/?q=Av.+Bulnes+119,+Quintero,+Valparaiso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider hover:bg-[#52ff33] transition"
                >
                  Abrir Ruta en Google Maps / Waze <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Reveal>

            {/* Official Google Maps Iframe */}
            <Reveal delay={120} className="lg:col-span-7">
              <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl h-[400px] sm:h-[450px] bg-[#000000]">
                <iframe
                  title="Mapa Oficial All Rent Hoteles Av. Bulnes 119 Quintero"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4162.658810391891!2d-71.5266955!3d-32.7766761!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689c06194397571%3A0x696160cc2777cf97!2sAv.%20Bulnes%20119%2C%202500000%20Quintero%2C%20Valpara%C3%ADso!5e1!3m2!1sen!2scl!4v1795577715170!5m2!1sen!2scl"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Official Branded Footer with Signature Brand Guide Divider */}
      <footer className="bg-[#000000] border-t border-white/10 pt-14 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Official Brand Guide Signature Slogan Rule */}
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#39FF14]/60 to-[#39FF14]" />
            <p className="text-base sm:text-xl font-bold italic text-white shrink-0 px-2">
              Tu estadía, <span className="text-[#39FF14] font-black">nuestra prioridad.</span>
            </p>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#39FF14]/60 to-[#39FF14]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="md:col-span-2 space-y-4">
              <div className="relative h-14 w-48">
                <Image
                  src="/brand/logo-neon.png"
                  alt="All Rent Hoteles"
                  fill
                  sizes="192px"
                  className="object-contain object-left"
                />
              </div>
              <p className="text-xs sm:text-sm text-white/65 max-w-md leading-relaxed">
                Hotel costero en Av. Bulnes 119, frente a la playa principal de Quintero. Habitaciones impecables, estacionamiento seguro gratuito y reservas directas online con pasarela de pago.
              </p>
            </div>

            <div className="space-y-2.5 text-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#39FF14] mb-3">
                Accesos Directos
              </h4>
              <ul className="space-y-2 text-white/75">
                <li>
                  <Link href="/reservar" className="hover:text-[#39FF14] transition">
                    Reservar Online con Pago
                  </Link>
                </li>
                <li>
                  <Link href="/mi-reserva" className="hover:text-[#39FF14] transition">
                    Portal Huésped & Check-in QR
                  </Link>
                </li>
                <li>
                  <a href="#habitaciones" className="hover:text-[#39FF14] transition">
                    Tarifas & Habitaciones
                  </a>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-white/65 hover:text-[#39FF14] transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#39FF14]" /> Sistema SaaS Administración
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 text-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#39FF14] mb-3">
                Contacto & Horarios
              </h4>
              <p className="text-white/75">Av. Bulnes 119, Quintero</p>
              <p className="text-white/75">Fono / WhatsApp: +56 9 9865 1440</p>
              <p className="text-white font-bold">Check-in: 12:00 · Check-out: 12:00</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 pr-16">
            <p>© {new Date().getFullYear()} All Rent Hoteles Quintero. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#39FF14]" />
              <span>Pasarela Webpay Activa & Sync Airbnb Integrado</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
