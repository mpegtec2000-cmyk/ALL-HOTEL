'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { OFFICIAL_ROOM_CATEGORIES, computeHotelQuote, formatCLP } from '@/lib/pricing'
import { Booking, PaymentMethod, PaymentRecord, RoomCategory, RoomCategorySlug } from '@/types/saas'

function ReservarContent() {
  const searchParams = useSearchParams()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [categories, setCategories] = useState<RoomCategory[]>(OFFICIAL_ROOM_CATEGORIES)
  const [soldOutByCategory, setSoldOutByCategory] = useState<Record<string, string[]>>({})

  // Step 1: Room & Dates
  const [selectedRoom, setSelectedRoom] = useState<RoomCategorySlug>('superior_matrimonial')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guestsCount, setGuestsCount] = useState(2)

  // Step 2: Guest & Parking
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientRut, setClientRut] = useState('')
  const [requiresParking, setRequiresParking] = useState(true)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Step 3: Online Payment Gateway
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null)
  const [paymentMode, setPaymentMode] = useState<'full_100' | 'deposit_50'>('full_100')
  const [gateway, setGateway] = useState<PaymentMethod>('webpay_tarjeta')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [installments, setInstallments] = useState(1)
  const [transferRef, setTransferRef] = useState('')

  // Step 4: Confirmed Result
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [approvedPayment, setApprovedPayment] = useState<PaymentRecord | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Initialize from query params + default dates
  useEffect(() => {
    const qRoom = searchParams.get('room') as RoomCategorySlug | null
    const qIn = searchParams.get('checkIn')
    const qOut = searchParams.get('checkOut')

    if (qRoom && OFFICIAL_ROOM_CATEGORIES.some((c) => c.slug === qRoom)) {
      setSelectedRoom(qRoom)
      const cat = OFFICIAL_ROOM_CATEGORIES.find((c) => c.slug === qRoom)
      if (cat) setGuestsCount(Math.min(2, cat.maxGuests))
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const plusTwo = new Date()
    plusTwo.setDate(plusTwo.getDate() + 3)

    setCheckInDate(qIn || tomorrow.toISOString().split('T')[0])
    setCheckOutDate(qOut || plusTwo.toISOString().split('T')[0])

    fetch('/api/v1/availability')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          if (Array.isArray(res.data.categories)) setCategories(res.data.categories)
          if (res.data.soldOutByCategory) setSoldOutByCategory(res.data.soldOutByCategory)
        }
      })
      .catch(() => {})
  }, [searchParams])

  // Generate QR when confirmed
  useEffect(() => {
    if (confirmedBooking?.id) {
      QRCode.toDataURL(confirmedBooking.id, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => {})
    }
  }, [confirmedBooking?.id])

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === selectedRoom) || categories[0],
    [categories, selectedRoom]
  )

  // Clamp guests count when room changes
  useEffect(() => {
    if (guestsCount > activeCategory.maxGuests) {
      setGuestsCount(activeCategory.maxGuests)
    }
  }, [activeCategory, guestsCount])

  const quote = useMemo(() => {
    if (!checkInDate || !checkOutDate) return null
    return computeHotelQuote({
      roomCategory: selectedRoom,
      checkInDate,
      checkOutDate,
      customCategories: categories,
    })
  }, [selectedRoom, checkInDate, checkOutDate, categories])

  const hasConflict = useMemo(() => {
    if (!checkInDate || !checkOutDate) return false
    const soldDates = soldOutByCategory[selectedRoom] || []
    const cur = new Date(checkInDate + 'T12:00:00')
    const end = new Date(checkOutDate + 'T12:00:00')
    while (cur < end) {
      const dStr = cur.toISOString().split('T')[0]
      if (soldDates.includes(dStr)) return true
      cur.setDate(cur.getDate() + 1)
    }
    return false
  }, [checkInDate, checkOutDate, selectedRoom, soldOutByCategory])

  function formatCardInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  function formatExpiryInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!quote || quote.nightsCount <= 0) return
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCategory: selectedRoom,
          checkInDate,
          checkOutDate,
          guestsCount,
          clientName,
          clientEmail,
          clientPhone,
          clientRut,
          requiresParking,
          vehiclesCount: requiresParking ? 1 : 0,
          vehiclePlates: requiresParking && vehiclePlate ? [vehiclePlate.trim().toUpperCase()] : [],
          specialRequests,
          source: 'web_online',
        }),
      })

      const data = await res.json()
      if (data.success && data.data) {
        setPendingBooking(data.data)
        setCardHolder(clientName.toUpperCase())
        setStep(3)
      } else {
        setErrorMsg(data.error || 'No fue posible crear la pre-reserva.')
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleProcessOnlinePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingBooking) return
    setErrorMsg('')

    if (gateway === 'webpay_tarjeta') {
      const cleanCard = cardNumber.replace(/\D/g, '')
      if (cleanCard.length < 13) {
        setErrorMsg('Ingresa los dígitos válidos de tu tarjeta débito o crédito.')
        return
      }
      if (cardExpiry.length < 4 || cardCvv.length < 3) {
        setErrorMsg('Completa fecha de vencimiento (MM/AA) y código CVV.')
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: pendingBooking.id,
          gateway,
          paymentMode,
          cardNumber,
          cardHolder: cardHolder || clientName,
          installments,
          transferReference: transferRef,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setConfirmedBooking(data.data)
        setApprovedPayment(data.payment)
        setStep(4)
      } else {
        setErrorMsg(data.error || 'Pago rechazado. Verifica los datos e intenta nuevamente.')
      }
    } catch {
      setErrorMsg('Error comunicándose con la pasarela de pago.')
    } finally {
      setLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const whatsappReceiptUrl = useMemo(() => {
    if (!confirmedBooking) return ''
    const txt = encodeURIComponent(
      `Hola All Rent Hoteles, acabo de confirmar mi reserva online:\n\n` +
        `🏨 *Código:* ${confirmedBooking.id}\n` +
        `🛏️ *Habitación:* ${confirmedBooking.roomCategoryName}${confirmedBooking.assignedRoomNumber ? ` (Hab. ${confirmedBooking.assignedRoomNumber})` : ''}\n` +
        `📅 *Check-in (12:00):* ${confirmedBooking.checkInDate}\n` +
        `📅 *Check-out (12:00):* ${confirmedBooking.checkOutDate} (${confirmedBooking.nightsCount} noches)\n` +
        `💳 *Pagado Online:* ${formatCLP(confirmedBooking.amountPaid)} (${approvedPayment?.authorizationCode || 'Confirmado'})\n` +
        `👤 *Titular:* ${confirmedBooking.clientName}`
    )
    return `https://wa.me/56998651440?text=${txt}`
  }, [confirmedBooking, approvedPayment])

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/80 hover:text-[#39FF14] transition"
          >
            <Home className="w-4 h-4 text-[#39FF14]" /> Volver a All Rent Hoteles
          </Link>

          <div className="relative h-11 w-36">
            <Image
              src="/brand/logo-neon.png"
              alt="All Rent Hoteles"
              fill
              sizes="144px"
              className="object-contain object-right"
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/35 text-[#39FF14] text-xs font-extrabold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" /> Reserva Online Oficial & Pasarela de Pago Segura
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Reserva tu Estadía en <span className="text-[#39FF14]">Quintero</span>
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Av. Bulnes 119, frente a la playa principal · Horario oficial:{' '}
            <strong className="text-white">Check-in 12:00 hrs a Check-out 12:00 hrs</strong>.
          </p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
          {[
            { n: 1, label: 'Habitación & Fechas' },
            { n: 2, label: 'Datos Huésped' },
            { n: 3, label: 'Pasarela de Pago' },
            { n: 4, label: 'Pase QR Confirmado' },
          ].map((s) => {
            const active = step === s.n
            const done = step > s.n
            return (
              <div
                key={s.n}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                  active
                    ? 'bg-[#000000] border-[#39FF14] text-white'
                    : done
                    ? 'bg-[#000000] border-[#39FF14]/40 text-white/90'
                    : 'bg-[#000000] border-white/10 text-white/45'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    active || done ? 'bg-[#39FF14] text-[#000000]' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {done ? <Check className="w-4 h-4 stroke-[3]" /> : s.n}
                </span>
                <span className="text-xs font-bold hidden sm:inline truncate">{s.label}</span>
              </div>
            )
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1 & STEP 2 & STEP 3 WITH STICKY QUOTE SUMMARY */}
        {step < 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-xl font-black text-white">
                    1. Selecciona tus Fechas y Categoría de Habitación
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/70 mb-1.5">
                        Check-in (12:00 hrs)
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm font-semibold text-white focus:border-[#39FF14] focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/70 mb-1.5">
                        Check-out (12:00 hrs)
                      </label>
                      <input
                        type="date"
                        min={checkInDate || todayStr}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm font-semibold text-white focus:border-[#39FF14] focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/70 mb-1.5">
                        Huéspedes
                      </label>
                      <select
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Number(e.target.value))}
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm font-semibold text-white focus:border-[#39FF14] focus:outline-none"
                      >
                        {[...Array(activeCategory.maxGuests)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? 'Huésped' : 'Huéspedes'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {hasConflict && (
                    <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>
                        Esta categoría se encuentra agotada en alguna de las fechas elegidas. Elige otra habitación o cambia el rango de fechas.
                      </span>
                    </div>
                  )}

                  {/* Room Selector Cards */}
                  <div className="space-y-3.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#39FF14]">
                      Elige tu Habitación ({categories.length} Categorías Oficiales)
                    </label>

                    {categories.map((cat) => {
                      const selected = cat.slug === selectedRoom
                      return (
                        <div
                          key={cat.slug}
                          onClick={() => setSelectedRoom(cat.slug)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row gap-4 items-center ${
                            selected
                              ? 'bg-[#000000] border-[#39FF14] shadow-[0_0_25px_rgba(57,255,20,0.12)]'
                              : 'bg-[#000000] border-white/12 hover:border-white/30'
                          }`}
                        >
                          <div className="relative w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-base font-extrabold text-white">{cat.name}</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  cat.bathroomType === 'privado_en_suite'
                                    ? 'bg-[#39FF14] text-[#000000]'
                                    : 'bg-white/10 text-white/85'
                                }`}
                              >
                                {cat.bathroomLabel}
                              </span>
                            </div>
                            <p className="text-xs text-white/65 mt-1">
                              {cat.bedConfig} · Máx. {cat.maxGuests}{' '}
                              {cat.maxGuests === 1 ? 'huésped' : 'huéspedes'}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-white/55">
                                Estacionamiento gratis + Wi-Fi
                              </span>
                              <span className="text-lg font-black text-[#39FF14]">
                                {formatCLP(cat.pricePerNight)}{' '}
                                <span className="text-xs font-normal text-white/60">/ noche</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!quote || quote.nightsCount <= 0 || hasConflict}
                      onClick={() => setStep(2)}
                      className="px-6 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#52ff33] disabled:opacity-40 transition cursor-pointer"
                    >
                      Continuar a Datos del Titular <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <form
                  onSubmit={handleProceedToPayment}
                  className="bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">
                      2. Datos del Huésped Titular & Estacionamiento
                    </h2>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-white/70 hover:text-[#39FF14] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cambiar fechas
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Nombre y Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ej: Valentina Contreras"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        RUT o Pasaporte *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientRut}
                        onChange={(e) => setClientRut(e.target.value)}
                        placeholder="Ej: 18.492.103-4"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Correo Electrónico (Comprobante) *
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="tu@correo.cl"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+56 9 9876 5432"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Free Parking Section */}
                  <div className="p-4 rounded-2xl bg-[#000000] border border-white/12 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5 text-sm font-bold text-white">
                        <Car className="w-5 h-5 text-[#39FF14]" />
                        Solicitar Estacionamiento Interior Gratuito
                      </span>
                      <input
                        type="checkbox"
                        checked={requiresParking}
                        onChange={(e) => setRequiresParking(e.target.checked)}
                        className="w-5 h-5 accent-[#39FF14]"
                      />
                    </label>
                    {requiresParking && (
                      <div>
                        <label className="block text-xs text-white/65 mb-1">
                          Patente del Vehículo (Opcional — puedes registrarla después en el Check-in QR)
                        </label>
                        <input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                          placeholder="Ej: PBYR-94"
                          className="w-full sm:w-64 bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold uppercase text-white focus:border-[#39FF14] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                      Comentarios o Hora Estimada de Llegada (Desde las 12:00)
                    </label>
                    <textarea
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Ej: Llegaremos cerca de las 13:00 hrs..."
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-xl border border-white/15 text-xs font-bold text-white/80 hover:text-white cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#52ff33] transition cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Creando Reserva...
                        </>
                      ) : (
                        <>
                          Ir a Pasarela de Pago Online <CreditCard className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: ONLINE PAYMENT GATEWAY */}
              {step === 3 && pendingBooking && (
                <form
                  onSubmit={handleProcessOnlinePayment}
                  className="bg-[#000000] border border-[#39FF14]/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-xs font-extrabold uppercase text-[#39FF14]">
                        Pre-Reserva #{pendingBooking.id} · Hab. {pendingBooking.assignedRoomNumber || 'Asignada'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        3. Pasarela de Pago Online
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#000000] border border-white/15 text-xs font-semibold text-white/80">
                      <ShieldCheck className="w-4 h-4 text-[#39FF14]" /> Cifrado TLS 256-bit
                    </span>
                  </div>

                  {/* Choose 100% vs 50% Deposit */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Modalidad de Pago
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('full_100')}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                          paymentMode === 'full_100'
                            ? 'bg-[#000000] border-[#39FF14]'
                            : 'bg-[#000000] border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-[#39FF14]">
                            Pago Total (100%)
                          </span>
                          <Sparkles className="w-4 h-4 text-[#39FF14]" />
                        </div>
                        <p className="text-xl font-black text-white mt-1">
                          {formatCLP(pendingBooking.totalAmount)}
                        </p>
                        <p className="text-[11px] text-white/65 mt-0.5">
                          Check-in express sin cobros al llegar
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode('deposit_50')}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                          paymentMode === 'deposit_50'
                            ? 'bg-[#000000] border-[#39FF14]'
                            : 'bg-[#000000] border-white/15'
                        }`}
                      >
                        <span className="text-xs font-extrabold uppercase text-white/80">
                          Abono Reserva (50%)
                        </span>
                        <p className="text-xl font-black text-white mt-1">
                          {formatCLP(pendingBooking.depositRequired)}
                        </p>
                        <p className="text-[11px] text-white/65 mt-0.5">
                          Saldo restante ({formatCLP(pendingBooking.totalAmount - pendingBooking.depositRequired)}) en recepción 12:00
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Gateway Method Tabs */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Medio de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setGateway('webpay_tarjeta')}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                          gateway === 'webpay_tarjeta'
                            ? 'bg-[#39FF14] text-[#000000] border-[#39FF14]'
                            : 'bg-[#000000] text-white border-white/15'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        Webpay / Tarjetas
                      </button>

                      <button
                        type="button"
                        onClick={() => setGateway('mercadopago')}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                          gateway === 'mercadopago'
                            ? 'bg-[#39FF14] text-[#000000] border-[#39FF14]'
                            : 'bg-[#000000] text-white border-white/15'
                        }`}
                      >
                        <Wallet className="w-5 h-5" />
                        Mercado Pago
                      </button>

                      <button
                        type="button"
                        onClick={() => setGateway('transferencia')}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                          gateway === 'transferencia'
                            ? 'bg-[#39FF14] text-[#000000] border-[#39FF14]'
                            : 'bg-[#000000] text-white border-white/15'
                        }`}
                      >
                        <Landmark className="w-5 h-5" />
                        Transferencia
                      </button>
                    </div>
                  </div>

                  {/* Card Form */}
                  {gateway === 'webpay_tarjeta' && (
                    <div className="p-5 rounded-2xl bg-[#000000] border border-white/15 space-y-4">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span className="font-bold text-white">
                          Tarjetas Redcompra Débito, Visa, Mastercard
                        </span>
                        <span className="text-[#39FF14] font-semibold">Webpay Plus</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1">
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                          placeholder="4532 8810 4421 4242"
                          className="w-full bg-[#000000] border border-white/15 rounded-xl px-4 py-3 text-base font-mono tracking-widest text-white focus:border-[#39FF14] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-white/70 mb-1">
                            Vencimiento
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                            placeholder="08/29"
                            className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#39FF14] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/70 mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#39FF14] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/70 mb-1">
                            Cuotas
                          </label>
                          <select
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                          >
                            <option value={1}>Débito / 1 cuota</option>
                            <option value={3}>3 cuotas sin interés</option>
                            <option value={6}>6 cuotas</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1">
                          Nombre en la Tarjeta
                        </label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm uppercase text-white focus:border-[#39FF14] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {gateway === 'mercadopago' && (
                    <div className="p-5 rounded-2xl bg-[#000000] border border-white/15 space-y-2">
                      <p className="text-sm font-bold text-white">
                        Pago Instantáneo con Cuenta Mercado Pago o Dinero en Cuenta
                      </p>
                      <p className="text-xs text-white/70">
                        Al hacer clic en pagar se autorizará el cargo de{' '}
                        <strong className="text-[#39FF14]">
                          {formatCLP(
                            paymentMode === 'full_100'
                              ? pendingBooking.totalAmount
                              : pendingBooking.depositRequired
                          )}
                        </strong>{' '}
                        y recibirás tu código QR al instante.
                      </p>
                    </div>
                  )}

                  {gateway === 'transferencia' && (
                    <div className="p-5 rounded-2xl bg-[#000000] border border-white/15 space-y-3 text-xs sm:text-sm">
                      <p className="font-extrabold text-[#39FF14] uppercase text-xs">
                        Datos Bancarios Oficiales All Rent Hoteles
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/85">
                        <p>
                          <strong>Titular:</strong> All Rent Hoteles SpA
                        </p>
                        <p>
                          <strong>RUT:</strong> 77.492.810-K
                        </p>
                        <p>
                          <strong>Banco:</strong> Banco de Chile / Estado
                        </p>
                        <p>
                          <strong>Cuenta:</strong> 00-194-88421-09
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1">
                          N° de Comprobante / Operación Bancaria *
                        </label>
                        <input
                          type="text"
                          required
                          value={transferRef}
                          onChange={(e) => setTransferRef(e.target.value)}
                          placeholder="Ej: TRF-0094821"
                          className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-[#39FF14] text-[#000000] font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#52ff33] shadow-[0_0_30px_rgba(57,255,20,0.4)] transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Procesando Pago Seguro...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                        Pagar Ahora{' '}
                        {formatCLP(
                          paymentMode === 'full_100'
                            ? pendingBooking.totalAmount
                            : pendingBooking.depositRequired
                        )}{' '}
                        y Confirmar Habitación
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT SUMMARY SIDEBAR */}
            <aside className="lg:col-span-4 bg-[#000000] border border-white/15 rounded-3xl overflow-hidden sticky top-24">
              <div className="relative h-44">
                <Image
                  src={activeCategory.image}
                  alt={activeCategory.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-[#39FF14] text-[#000000] text-xs font-black uppercase">
                  {activeCategory.bathroomLabel}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white">{activeCategory.name}</h3>
                  <p className="text-xs text-white/65">Av. Bulnes 119, Frente a Playa Quintero</p>
                </div>

                <div className="space-y-2 text-xs border-y border-white/10 py-3.5 text-white/85">
                  <div className="flex justify-between">
                    <span className="inline-flex items-center gap-1.5 text-white/65">
                      <Calendar className="w-3.5 h-3.5 text-[#39FF14]" /> Check-in (12:00)
                    </span>
                    <strong>{checkInDate || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="inline-flex items-center gap-1.5 text-white/65">
                      <Calendar className="w-3.5 h-3.5 text-[#39FF14]" /> Check-out (12:00)
                    </span>
                    <strong>{checkOutDate || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="inline-flex items-center gap-1.5 text-white/65">
                      <Users className="w-3.5 h-3.5 text-[#39FF14]" /> Huéspedes
                    </span>
                    <strong>{guestsCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="inline-flex items-center gap-1.5 text-white/65">
                      <Clock className="w-3.5 h-3.5 text-[#39FF14]" /> Noches
                    </span>
                    <strong>{quote?.nightsCount || 0}</strong>
                  </div>
                </div>

                {quote && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>
                        {formatCLP(quote.ratePerNight)} × {quote.nightsCount}{' '}
                        {quote.nightsCount === 1 ? 'noche' : 'noches'}
                      </span>
                      <span>{formatCLP(quote.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Estacionamiento Interior</span>
                      <span className="text-[#39FF14] font-bold">GRATIS</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                      <span className="text-sm font-extrabold text-white">Total Estadía</span>
                      <span className="text-2xl font-black text-[#39FF14]">
                        {formatCLP(quote.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* STEP 4: CONFIRMED BOARDING PASS & QR */}
        {step === 4 && confirmedBooking && (
          <div className="max-w-3xl mx-auto bg-[#000000] border-2 border-[#39FF14] rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(57,255,20,0.18)] space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#39FF14] text-[#000000] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#39FF14]">
                    ¡Pago Aprobado & Reserva Confirmada!
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Código: {confirmedBooking.id}
                  </h2>
                </div>
              </div>

              {confirmedBooking.assignedRoomNumber && (
                <div className="px-4 py-2 rounded-2xl bg-[#000000] border border-[#39FF14]/50 text-center">
                  <span className="text-[10px] uppercase text-white/60 block">Unidad Asignada</span>
                  <strong className="text-lg font-black text-[#39FF14]">
                    Hab. {confirmedBooking.assignedRoomNumber}
                  </strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/65">Titular</span>
                  <strong className="text-white">{confirmedBooking.clientName}</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/65">Categoría</span>
                  <strong className="text-white">{confirmedBooking.roomCategoryName}</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/65">Check-in (12:00 hrs)</span>
                  <strong className="text-white">{confirmedBooking.checkInDate}</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/65">Check-out (12:00 hrs)</span>
                  <strong className="text-white">{confirmedBooking.checkOutDate}</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/65">Autorización Pasarela</span>
                  <strong className="text-[#39FF14]">
                    {approvedPayment?.authorizationCode || 'APROBADO'}
                  </strong>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/65">Monto Pagado Online</span>
                  <strong className="text-xl font-black text-[#39FF14]">
                    {formatCLP(confirmedBooking.amountPaid)}
                  </strong>
                </div>
              </div>

              {/* QR Pass */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-[#000000]">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR Reserva ${confirmedBooking.id}`}
                    className="w-44 h-44 object-contain"
                  />
                )}
                <p className="mt-2 text-xs font-black uppercase tracking-wider text-[#000000]">
                  Pase QR Recepción 12:00
                </p>
                <p className="text-[11px] text-neutral-600 text-center">
                  Muestra este código al llegar a Av. Bulnes 119
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Link
                href={`/mi-reserva?codigo=${confirmedBooking.id}`}
                className="py-3.5 px-5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#52ff33] transition"
              >
                <QrCode className="w-4 h-4" /> Completar Check-in Digital & Patente
              </Link>
              <a
                href={whatsappReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-5 rounded-xl border border-white/20 bg-white/5 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[#39FF14] hover:text-[#39FF14] transition"
              >
                <MessageCircle className="w-4 h-4 text-[#39FF14]" /> Enviar Voucher a Recepción por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReservarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
          Cargando motor de reservas...
        </div>
      }
    >
      <ReservarContent />
    </Suspense>
  )
}
