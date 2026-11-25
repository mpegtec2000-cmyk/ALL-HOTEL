'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle2, MessageCircle, ShieldCheck, Quote } from 'lucide-react'
import { OFFICIAL_ROOM_CATEGORIES } from '@/lib/pricing'
import Reveal from './Reveal'

const REVIEWS = [
  {
    name: 'Camila & Andrés',
    origin: 'Santiago · Estadía Superior Matrimonial',
    text: 'Excelente ubicación literalmente cruzando la calle hacia la playa de Quintero. Todo impecable, cama súper cómoda y una atención de recepción muy profesional y cálida.',
  },
  {
    name: 'Familia Henríquez',
    origin: 'Viña del Mar · Familiar con Terraza',
    text: 'El sector al lado de los marinos da una tranquilidad total para viajar con niños y dejar el auto en el estacionamiento interior. La terraza al atardecer es preciosa.',
  },
  {
    name: 'Roberto Salazar',
    origin: 'Concepción · Viaje Ejecutivo',
    text: 'Me quedé 4 noches por trabajo. Muy limpio, buen Wi-Fi, cocina pequeña súper útil con refrigerador y microondas, y el horario de 12:00 a 12:00 se agradece muchísimo.',
  },
]

export default function GuestReviewsAndContact() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [checkInDeseado, setCheckInDeseado] = useState('')
  const [noches, setNoches] = useState(2)
  const [huespedes, setHuespedes] = useState(2)
  const [habitacionInteres, setHabitacionInteres] = useState('Superior Matrimonial')
  const [mensaje, setMensaje] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !telefono) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          correo,
          checkInDeseado,
          noches,
          huespedes,
          habitacionInteres,
          mensaje,
          origen: 'formulario_web',
        }),
      })
      if (res.ok) {
        setSent(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contacto" className="py-24 bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Testimonials */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="brand-stripes" aria-hidden="true">
                  <span className="bg-[#39FF14]" />
                  <span className="bg-[#39FF14]" />
                  <span className="bg-white" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#39FF14]">
                  Los Comentarios Nos Avalan
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-[-0.025em]">
                Experiencias en <span className="text-[#39FF14]">All Rent Hoteles</span>
              </h2>
            </div>

            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#000000] border border-white/12">
              <div className="flex items-center gap-0.5 text-[#39FF14]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#39FF14]" />
                ))}
              </div>
              <span className="text-xs font-extrabold text-white">
                4.9 / 5 · Excelencia Hotelera en Quintero
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev) => (
              <div
                key={rev.name}
                className="relative p-6 rounded-3xl bg-[#000000] border border-white/10 hover:border-[#39FF14]/45 transition flex flex-col justify-between space-y-4"
              >
                <Quote className="w-8 h-8 text-white/10 absolute top-5 right-5" />
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#39FF14]">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#39FF14]" />
                    ))}
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-sm font-extrabold text-white">{rev.name}</p>
                  <p className="text-xs text-[#39FF14]/80 font-medium">{rev.origin}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Direct Contact / Group Inquiry Form */}
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-10">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/35 text-[#39FF14] text-xs font-extrabold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Atención Directa de Recepción
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              ¿Consultas especiales, grupos o estadías largas?
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Para reserva inmediata con tarjeta o Webpay usa nuestro motor online. Si deseas cotizar varias habitaciones o convenio corporativo, escríbenos aquí y nuestro equipo de reservas te responderá a la brevedad.
            </p>

            <div className="pt-2">
              <a
                href="https://wa.me/56998651440?text=Hola%20All%20Rent%20Hoteles,%20escribo%20desde%20el%20sitio%20web%20oficial%20para%20consultar%20disponibilidad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#000000] border border-white/20 text-white font-bold text-sm hover:border-[#39FF14] hover:text-[#39FF14] transition"
              >
                <MessageCircle className="w-5 h-5 text-[#39FF14]" />
                WhatsApp Reservas: +56 9 9865 1440
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            {sent ? (
              <div className="p-8 rounded-2xl bg-[#000000] border border-[#39FF14]/50 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#39FF14] mx-auto" />
                <h4 className="text-xl font-black text-white">¡Solicitud recibida en Central de Reservas!</h4>
                <p className="text-sm text-white/75">
                  Nuestro equipo revisará tu requerimiento y te contactará a la brevedad al {telefono}.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:text-[#39FF14] cursor-pointer"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Carolina Bustamante"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 9876 5432"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="nombre@correo.cl"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Fecha Estimada Check-in
                  </label>
                  <input
                    type="date"
                    value={checkInDeseado}
                    onChange={(e) => setCheckInDeseado(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Habitación de Interés
                  </label>
                  <select
                    value={habitacionInteres}
                    onChange={(e) => setHabitacionInteres(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  >
                    {OFFICIAL_ROOM_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name} (${c.pricePerNight.toLocaleString('es-CL')})
                      </option>
                    ))}
                    <option value="Varias Habitaciones / Grupo">Varias Habitaciones / Grupo</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                      Noches
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={noches}
                      onChange={(e) => setNoches(Number(e.target.value))}
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                      Huéspedes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={huespedes}
                      onChange={(e) => setHuespedes(Number(e.target.value))}
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    Mensaje o Requerimientos
                  </label>
                  <textarea
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Indícanos si vienes con vehículo para estacionamiento, horario o dudas..."
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#39FF14] text-[#000000] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#52ff33] transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Enviando...' : 'Enviar Solicitud a Recepción'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
