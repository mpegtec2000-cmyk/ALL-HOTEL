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
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { Booking, GuestInfo } from '@/types/saas'
import { formatCLP } from '@/lib/pricing'

function MiReservaInner() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('codigo') || ''

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
      QRCode.toDataURL(booking.id, {
        width: 220,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrUrl)
        .catch(() => {})
    }
  }, [booking?.id])

  async function lookupBooking(targetCode?: string) {
    const clean = (targetCode ?? code).trim().toUpperCase()
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
          data.error || 'No encontramos una reserva con ese código (Ej: ARH-2026-1042 o código Airbnb HM8P3K9W2L).'
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

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/80 hover:text-[#39FF14]"
          >
            <Home className="w-4 h-4 text-[#39FF14]" /> Volver al Hotel
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
        <div className="bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#39FF14]">
              Portal de Autogestión & Pase QR
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Mi Reserva & Check-in Digital
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Ingresa tu código directo (ej. <strong>ARH-2026-1042</strong>) o tu código de confirmación de{' '}
              <strong>Airbnb</strong> (ej. <strong>HM8P3K9W2L</strong>).
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
              placeholder="Código ARH-2026-XXXX o Airbnb HM..."
              className="flex-1 bg-[#000000] border border-white/20 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white focus:border-[#39FF14] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#52ff33] cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar Reserva
            </button>
          </form>

          {/* Quick Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span>Probar ejemplos:</span>
            {['ARH-2026-1042', 'HM8P3K9W2L', 'ARH-2026-1044'].map((demo) => (
              <button
                key={demo}
                type="button"
                onClick={() => {
                  setCode(demo)
                  lookupBooking(demo)
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/85 hover:border-[#39FF14] hover:text-[#39FF14] font-mono cursor-pointer"
              >
                {demo}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-3">
              {error}
            </p>
          )}
        </div>

        {/* Booking Details + Digital Check-in */}
        {booking && (
          <div className="space-y-6">
            <div className="bg-[#000000] border border-[#39FF14]/40 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#39FF14] text-[#000000] text-xs font-black uppercase">
                    {booking.status === 'checked_in'
                      ? 'Check-in Activo'
                      : booking.status === 'confirmed'
                      ? 'Confirmada'
                      : booking.status}
                  </span>
                  {booking.externalCode && (
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
                      Airbnb Sync: {booking.externalCode}
                    </span>
                  )}
                  {booking.assignedRoomNumber && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                      Habitación {booking.assignedRoomNumber}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white">
                  {booking.roomCategoryName} · {booking.clientName}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Check-in (12:00)</span>
                    <strong className="text-sm text-white">{booking.checkInDate}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Check-out (12:00)</span>
                    <strong className="text-sm text-white">{booking.checkOutDate}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                    <span className="text-white/55 block">Pagado / Total</span>
                    <strong className="text-sm text-[#39FF14]">
                      {formatCLP(booking.amountPaid)} / {formatCLP(booking.totalAmount)}
                    </strong>
                  </div>
                </div>

                {pendingAmount > 0 && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#000000] border border-[#39FF14]/40">
                    <div>
                      <p className="text-xs font-bold text-white">
                        Saldo pendiente: <span className="text-[#39FF14]">{formatCLP(pendingAmount)}</span>
                      </p>
                      <p className="text-[11px] text-white/65">
                        Puedes saldarlo ahora mismo con Webpay Online para ingreso directo.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={payingBalance}
                      onClick={handlePayRemainingBalance}
                      className="px-4 py-2.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingBalance ? 'Procesando...' : `Pagar ${formatCLP(pendingAmount)}`}
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 bg-white rounded-2xl p-4 flex flex-col items-center text-[#000000]">
                {qrUrl && <img src={qrUrl} alt="QR" className="w-40 h-40 object-contain" />}
                <span className="text-xs font-black uppercase mt-1">{booking.id}</span>
                <span className="text-[11px] text-neutral-600">Av. Bulnes 119 · 12:00 a 12:00</span>
              </div>
            </div>

            {/* Digital Pre Check-in Form */}
            <form
              onSubmit={handleSaveCheckin}
              className="bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#39FF14]" /> Registro Digital de Huéspedes & Estacionamiento
                </h3>
                {checkinSaved && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#39FF14]">
                    <CheckCircle2 className="w-4 h-4" /> Guardado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/70 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-[#39FF14]" />
                    Hora Estimada de Llegada (Desde 12:00)
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
                    <Car className="w-3.5 h-3.5 inline mr-1 text-[#39FF14]" />
                    Patente Vehículo (Estacionamiento Gratis)
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
                    <Users className="w-3.5 h-3.5 inline mr-1 text-[#39FF14]" />
                    Nómina de Huéspedes
                  </label>
                  {guestList.length < booking.guestsCount && (
                    <button
                      type="button"
                      onClick={() => setGuestList([...guestList, { name: '', rutOrPassport: '' }])}
                      className="text-xs font-bold text-[#39FF14] inline-flex items-center gap-1 cursor-pointer"
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
                  className="w-4 h-4 accent-[#39FF14]"
                />
                <span>
                  Acepto los horarios oficiales (Check-in 12:00 hrs / Check-out 12:00 hrs) y normas de descanso familiar de All Rent Hoteles.
                </span>
              </label>

              <button
                type="submit"
                disabled={savingCheckin || !rulesAccepted}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#39FF14] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#52ff33] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {savingCheckin ? 'Guardando Check-in...' : 'Confirmar Check-in Digital'}
              </button>
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
          Cargando portal...
        </div>
      }
    >
      <MiReservaInner />
    </Suspense>
  )
}
