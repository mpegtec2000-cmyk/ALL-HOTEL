'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Loader2,
  Lock,
  MailCheck,
  MapPin,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { Booking, GuestInfo } from '@/types/saas'
import { formatCLP } from '@/lib/pricing'

function MiReservaInner() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('codigo') || searchParams.get('qr') || ''

  const [code, setCode] = useState(initialCode)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrUrl, setQrUrl] = useState('')

  // Check-in fields
  const [estimatedArrival, setEstimatedArrival] = useState('12:30')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [guestList, setGuestList] = useState<GuestInfo[]>([{ name: '', rutOrPassport: '' }])
  const [rulesAccepted, setRulesAccepted] = useState(true)
  const [savingCheckin, setSavingCheckin] = useState(false)
  const [checkinSaved, setCheckinSaved] = useState(false)

  // Pay pending balance online
  const [payingBalance, setPayingBalance] = useState(false)

  useEffect(() => {
    if (initialCode) {
      lookupBooking(initialCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  useEffect(() => {
    if (booking?.id) {
      const payloadToEncode = booking.qrToken || booking.id
      QRCode.toDataURL(payloadToEncode, {
        width: 260,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrUrl)
        .catch(() => {})
    }
  }, [booking?.id, booking?.qrToken])

  async function lookupBooking(targetCode?: string) {
    const clean = (targetCode ?? code).trim()
    if (!clean) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/bookings/${encodeURIComponent(clean)}`)
      const data = await res.json()
      if (data.success && data.data) {
        const b: Booking = data.data
        setBooking(b)
        if (b.checkin) {
          setEstimatedArrival(b.checkin.estimatedArrival || '12:30')
          setVehiclePlate(b.checkin.vehiclePlates?.[0] || b.vehiclePlates?.[0] || '')
          setGuestList(
            b.checkin.guestList.length > 0
              ? b.checkin.guestList
              : [{ name: b.clientName, rutOrPassport: b.clientRut || '' }]
          )
          setCheckinSaved(true)
        } else {
          setVehiclePlate(b.vehiclePlates?.[0] || '')
          setGuestList([{ name: b.clientName, rutOrPassport: b.clientRut || '' }])
          setCheckinSaved(false)
        }
      } else {
        setBooking(null)
        setError(
          data.error ||
            'No encontramos una reserva con ese código (Ej: ARH-2026-1042, código Airbnb HM8P3K9W2L o token ARHQR...).'
        )
      }
    } catch {
      setError('Error al consultar la reserva.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (!booking) return
    setSavingCheckin(true)
    try {
      const plates = vehiclePlate.trim() ? [vehiclePlate.trim().toUpperCase()] : []
      const res = await fetch(`/api/v1/bookings/${booking.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedArrival,
          vehiclesCount: plates.length,
          vehiclePlates: plates,
          guestList: guestList.filter((g) => g.name.trim() !== ''),
          rulesAccepted,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBooking(data.data)
        setCheckinSaved(true)
      }
    } finally {
      setSavingCheckin(false)
    }
  }

  async function handlePayRemainingBalance() {
    if (!booking) return
    setPayingBalance(true)
    try {
      const res = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          gateway: 'webpay_tarjeta',
          paymentMode: booking.amountPaid > 0 ? 'balance_50' : 'full_100',
          cardHolder: booking.clientName,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBooking(data.data)
      }
    } finally {
      setPayingBalance(false)
    }
  }

  const pendingAmount = booking ? Math.max(0, booking.totalAmount - booking.amountPaid) : 0
  const qrStatus = booking?.qrStatus || 'issued'

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/80 hover:text-[#B0E454]"
          >
            <Home className="w-4 h-4 text-[#B0E454]" /> Volver a All Rent Hoteles
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

        {/* Search Card */}
        <div className="lux-card rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B0E454]">
              Portal del Huésped &amp; Pase QR Criptográfico Único
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Mi Reserva &amp; Pase QR de Check-in
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Ingresa tu código de reserva (ej. <strong>ARH-2026-1043</strong>), código de confirmación de{' '}
              <strong>Airbnb</strong> (ej. <strong>HM8P3K9W2L</strong>) o tu token <strong>ARHQR</strong> enviado por correo.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookupBooking()
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código ARH-2026-XXXX, Airbnb HM... o token ARHQR..."
              className="flex-1 bg-[#000000] border border-white/20 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white focus:border-[#B0E454] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#BEEB6B] cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Ver Mi Pase QR
            </button>
          </form>

          {/* Quick Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span>Probar reservas activas:</span>
            {[
              { code: 'HM8P3K9W2L', label: 'Airbnb: HM8P3K9W2L (QR Listo Entrada)' },
              { code: 'ARH-2026-1044', label: 'Web: ARH-2026-1044 (QR Listo Entrada)' },
              { code: 'ARH-2026-1042', label: 'En Hotel: ARH-2026-1042 (QR Listo Salida)' },
            ].map((demo) => (
              <button
                key={demo.code}
                type="button"
                onClick={() => {
                  setCode(demo.code)
                  lookupBooking(demo.code)
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/85 hover:border-[#B0E454] hover:text-[#B0E454] font-mono cursor-pointer"
              >
                {demo.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-3">
              {error}
            </p>
          )}
        </div>

        {/* Booking Details + Cryptographic QR Card */}
        {booking && (
          <div className="space-y-6">
            <div className="lux-card-featured rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      qrStatus === 'issued'
                        ? 'bg-[#B0E454] text-[#000000]'
                        : qrStatus === 'checked_in_active'
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                        : 'bg-zinc-800 border border-white/20 text-white/60'
                    }`}
                  >
                    {qrStatus === 'issued'
                      ? 'QR Emitido (0/2 Usos) · Listo para Check-in Entrada'
                      : qrStatus === 'checked_in_active'
                      ? 'Check-in Activo (1/2 Usos) · Próximo uso: Salida'
                      : 'QR Cerrado (2/2 Usos) · Estadía Finalizada'}
                  </span>

                  {booking.externalCode && (
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
                      Airbnb: {booking.externalCode}
                    </span>
                  )}

                  {booking.assignedRoomNumber && (
                    <span className="px-3 py-1 rounded-full bg-[#B0E454]/15 border border-[#B0E454]/40 text-[#B0E454] text-xs font-extrabold">
                      Habitación {booking.assignedRoomNumber}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white">
                  {booking.roomCategoryName} · {booking.clientName}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Check-in (12:00 hrs)</span>
                    <strong className="text-sm text-white">{booking.checkInDate}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Check-out (12:00 hrs)</span>
                    <strong className="text-sm text-white">
                      {booking.checkOutDate} ({booking.nightsCount}n)
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Estado de Pago</span>
                    <strong className="text-sm text-[#B0E454]">
                      {formatCLP(booking.amountPaid)} (100% Pagado)
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#000000] border border-white/12 text-xs text-white/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#B0E454] font-bold">
                    <MailCheck className="w-4 h-4" />
                    Correo Oficial con QR enviado a {booking.clientEmail}
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4 text-[#B0E454] shrink-0" />
                    <span>
                      <strong>Av. Bulnes 119, Quintero</strong> (Frente a la playa principal, junto a la Armada).
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    ¿Deseas quedarte más días? Solicítalo directamente en <strong>Portería / Recepción</strong> para asignar las noches extra a tu habitación.
                  </p>
                </div>

                {pendingAmount > 0 && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#000000] border border-[#B0E454]/40">
                    <div>
                      <p className="text-xs font-bold text-white">
                        Saldo pendiente: <span className="text-[#B0E454]">{formatCLP(pendingAmount)}</span>
                      </p>
                      <p className="text-[11px] text-white/65">
                        Sáldalo online para habilitar el Check-in QR inmediato.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={payingBalance}
                      onClick={handlePayRemainingBalance}
                      className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingBalance ? 'Procesando...' : `Pagar ${formatCLP(pendingAmount)}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Scannable Cryptographic QR Pass */}
              <div className="md:col-span-5 bg-[#080A07] border-2 border-[#B0E454] rounded-2xl p-5 flex flex-col items-center text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#B0E454] mb-2">
                  PASE QR ÚNICO · ENTRADA &amp; SALIDA
                </div>
                <div
                  className={`bg-white p-3.5 rounded-2xl border-2 border-[#B0E454] relative ${
                    qrStatus === 'redeemed_closed' ? 'opacity-35 grayscale' : ''
                  }`}
                >
                  {qrUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt="QR Check-in" className="w-48 h-48 object-contain" />
                  )}
                </div>

                {qrStatus === 'redeemed_closed' ? (
                  <div className="mt-3 px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    QR Cerrado Permanentemente (2/2 Usos)
                  </div>
                ) : (
                  <div className="mt-3 px-3 py-1 rounded-lg bg-[#000000] border border-[#B0E454]/30 font-mono text-[11px] text-[#B0E454] break-all">
                    {booking.qrToken || booking.id}
                  </div>
                )}

                <div className="mt-2.5 text-[11px] text-white/65 leading-relaxed">
                  Muestra este QR en Portería al llegar (Check-in 12:00) y al retirarte (Check-out 12:00).
                </div>
              </div>
            </div>

            {/* Digital Pre Check-in & Vehicle Plate Form */}
            <form
              onSubmit={handleSaveCheckin}
              className="lux-card rounded-3xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#B0E454]" /> Datos de Matrícula (Patente) &amp; Nómina para Escaneo QR
                </h3>
                {checkinSaved && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B0E454]">
                    <CheckCircle2 className="w-4 h-4" /> Vinculado al QR
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-[#B0E454]" />
                    Hora Estimada de Llegada (Desde 12:00 hrs)
                  </label>
                  <input
                    type="time"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    <Car className="w-3.5 h-3.5 inline mr-1 text-[#B0E454]" />
                    Matrícula / Patente Vehículo (Estacionamiento Gratis)
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Ej: PBYR-94"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold uppercase text-white"
                  />
                </div>
              </div>

              {/* Guest List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-white/70">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-[#B0E454]" />
                    Nómina de Huéspedes
                  </label>
                  {guestList.length < booking.guestsCount && (
                    <button
                      type="button"
                      onClick={() => setGuestList([...guestList, { name: '', rutOrPassport: '' }])}
                      className="text-xs font-bold text-[#B0E454] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar acompañante
                    </button>
                  )}
                </div>

                {guestList.map((g, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
                      value={g.name}
                      onChange={(e) => {
                        const copy = [...guestList]
                        copy[idx] = { ...copy[idx], name: e.target.value }
                        setGuestList(copy)
                      }}
                      className="sm:col-span-6 bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="RUT o Pasaporte"
                      value={g.rutOrPassport}
                      onChange={(e) => {
                        const copy = [...guestList]
                        copy[idx] = { ...copy[idx], rutOrPassport: e.target.value }
                        setGuestList(copy)
                      }}
                      className="sm:col-span-5 bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                    {guestList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGuestList(guestList.filter((_, i) => i !== idx))}
                        className="sm:col-span-1 p-2.5 rounded-xl bg-red-950/40 text-red-400 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="w-4 h-4 accent-[#B0E454]"
                />
                <span>
                  Acepto los horarios oficiales (Check-in 12:00 hrs / Check-out 12:00 hrs) y normas de convivencia de All Rent Hoteles.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={savingCheckin || !rulesAccepted || qrStatus === 'redeemed_closed'}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#BEEB6B] disabled:opacity-40 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {savingCheckin ? 'Actualizando Datos QR...' : 'Guardar Matrícula y Datos en Mi QR'}
                </button>

                <span className="text-[11px] text-white/55 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#B0E454]" /> Al escanear este QR en recepción, el administrador verá tus datos actualizados al instante.
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MiReservaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
          Cargando portal de reserva...
        </div>
      }
    >
      <MiReservaInner />
    </Suspense>
  )
}
