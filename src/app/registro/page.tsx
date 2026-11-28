'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  UserPlus,
  LogIn,
  UserCheck,
  QrCode,
  CalendarCheck,
  Car,
  ShieldCheck,
  Home,
  LogOut,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Booking } from '@/types/saas'
import { formatCLP } from '@/lib/pricing'
import {
  ClientSessionCookie,
  clearClientSessionCookie,
  getClientSessionCookie,
  saveClientSessionCookie,
} from '@/lib/speed-cookies'

function RegistroClienteInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnTo = searchParams.get('returnTo') || ''

  const [tab, setTab] = useState<'register' | 'login'>('register')
  const [activeClient, setActiveClient] = useState<ClientSessionCookie | null>(null)
  const [clientBookings, setClientBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Register Form State
  const [regName, setRegName] = useState('')
  const [regRut, setRegRut] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPlate, setRegPlate] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  useEffect(() => {
    const modeParam = searchParams.get('tab')
    if (modeParam === 'login') setTab('login')

    const existing = getClientSessionCookie()
    if (existing?.email) {
      setActiveClient(existing)
      fetchClientBookings(existing.email)
    }
  }, [searchParams])

  async function fetchClientBookings(email: string) {
    try {
      const res = await fetch(`/api/v1/clientes/auth?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.success) {
        if (data.client) {
          setActiveClient(data.client)
          saveClientSessionCookie(data.client)
        }
        if (Array.isArray(data.bookings)) {
          setClientBookings(data.bookings)
        }
      }
    } catch {
      // ignore
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/v1/clientes/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName,
          rutOrPassport: regRut,
          email: regEmail,
          phone: regPhone,
          vehiclePlate: regPlate,
          password: regPassword,
        }),
      })
      const data = await res.json()
      if (data.success && data.client) {
        saveClientSessionCookie(data.client)
        setActiveClient(data.client)
        setClientBookings(data.bookings || [])
        setSuccessMsg('¡Tu Cuenta Oficial de Cliente ha sido creada y activada!')
        if (returnTo === 'reservar') {
          router.push('/reservar?modo=cliente')
        }
      } else {
        setErrorMsg(data.error || 'No fue posible completar el registro.')
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoginSubmit(e: React.FormEvent, overrideEmail?: string, overridePass?: string) {
    if (e) e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/v1/clientes/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: overrideEmail ?? loginEmail,
          password: overridePass ?? loginPassword,
        }),
      })
      const data = await res.json()
      if (data.success && data.client) {
        saveClientSessionCookie(data.client)
        setActiveClient(data.client)
        setClientBookings(data.bookings || [])
        setSuccessMsg(`¡Bienvenido/a de vuelta, ${data.client.name}!`)
        if (returnTo === 'reservar') {
          router.push('/reservar?modo=cliente')
        }
      } else {
        setErrorMsg(data.error || 'Credenciales incorrectas.')
      }
    } catch {
      setErrorMsg('Error de conexión al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogoutClient() {
    clearClientSessionCookie()
    setActiveClient(null)
    setClientBookings([])
    setSuccessMsg('')
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/80 hover:text-[#B0E454] transition"
          >
            <Home className="w-4 h-4 text-[#B0E454]" /> Volver a All Rent Hoteles
          </Link>

          <div className="relative h-12 w-40">
            <Image
              src="/brand/logo-neon.png"
              alt="All Rent Hoteles"
              fill
              sizes="160px"
              className="object-contain object-right"
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B0E454]/15 border border-[#B0E454]/35 text-[#B0E454] text-xs font-extrabold uppercase tracking-wider mb-3">
              <UserCheck className="w-3.5 h-3.5" /> Portal de Clientes &amp; Registro Oficial
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Cuenta de Cliente <span className="text-[#B0E454]">All Rent Hoteles</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Regístrate como cliente para reservar en 1 clic con tus datos guardados y acceder a todos tus Pases QR, o reserva directamente como Invitado.
            </p>
          </div>

          <Link
            href="/reservar?modo=invitado"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white/85 hover:border-[#B0E454] hover:text-[#B0E454] inline-flex items-center gap-2 self-start md:self-auto"
          >
            Reservar como Invitado (Sin Cuenta) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs sm:text-sm text-red-200 font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-[#B0E454]/15 border border-[#B0E454] text-xs sm:text-sm text-[#B0E454] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW A: LOGGED-IN CLIENT DASHBOARD */}
        {activeClient ? (
          <div className="space-y-6">
            <div className="lux-card-featured rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B0E454] text-[#000000] text-xs font-black uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cuenta de Cliente Activa
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {activeClient.name}
                </h2>
                <div className="flex flex-wrap gap-3 text-xs text-white/75 pt-1">
                  <span className="px-3 py-1.5 rounded-xl bg-[#000000] border border-white/12">
                    RUT/Doc: <strong className="text-white">{activeClient.rutOrPassport}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#000000] border border-white/12">
                    Correo: <strong className="text-white">{activeClient.email}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#000000] border border-white/12">
                    Tel: <strong className="text-white">{activeClient.phone}</strong>
                  </span>
                  {activeClient.vehiclePlate && (
                    <span className="px-3 py-1.5 rounded-xl bg-[#000000] border border-[#B0E454]/40 text-[#B0E454]">
                      Patente Registrada: <strong>{activeClient.vehiclePlate}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/reservar?modo=cliente"
                  className="px-6 py-3.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#BEEB6B]"
                >
                  <CalendarCheck className="w-4 h-4" /> Nueva Reserva con Mi Cuenta
                </Link>
                <button
                  type="button"
                  onClick={handleLogoutClient}
                  className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white/75 hover:text-red-400 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Client's Reservations & Cryptographic QR Passes */}
            <div className="lux-card rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#B0E454]" /> Mis Reservas &amp; Pases QR Criptográficos ({clientBookings.length})
                </h3>
                <Link
                  href="/mi-reserva"
                  className="text-xs font-bold text-[#B0E454] hover:underline"
                >
                  Buscar otro código →
                </Link>
              </div>

              {clientBookings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#000000] border border-white/10 text-center space-y-3">
                  <p className="text-sm text-white/75">
                    Aún no tienes reservas asociadas a tu cuenta de cliente.
                  </p>
                  <Link
                    href="/reservar?modo=cliente"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase"
                  >
                    Reservar Mi Primera Estadía Ahora <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientBookings.map((b) => {
                    const debt = Math.max(0, b.totalAmount - (b.amountPaid || 0))
                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-[#000000] border border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-[#B0E454]">{b.id}</span>
                            {b.assignedRoomNumber && (
                              <span className="px-2.5 py-0.5 rounded bg-[#B0E454]/15 text-[#B0E454] text-[11px] font-bold">
                                Habitación {b.assignedRoomNumber}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold uppercase">
                              {b.qrStatus === 'issued'
                                ? 'QR Listo para Entrada (0/2)'
                                : b.qrStatus === 'checked_in_active'
                                ? 'Check-in Activo en Hotel (1/2)'
                                : 'Estadía Finalizada (2/2)'}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-white">
                            {b.roomCategoryName} · {b.checkInDate} al {b.checkOutDate} ({b.nightsCount} noches)
                          </h4>
                          <p className="text-xs text-white/60">
                            Total: <strong className="text-[#B0E454]">{formatCLP(b.totalAmount)}</strong> · Pagado: {formatCLP(b.amountPaid)}{' '}
                            {debt > 0 ? `(Saldo pendiente: ${formatCLP(debt)})` : '(100% Pagado)'}
                          </p>
                        </div>

                        <Link
                          href={`/mi-reserva?codigo=${b.id}`}
                          className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase inline-flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <QrCode className="w-4 h-4" /> Abrir Pase QR
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW B: REGISTRATION & LOGIN FORMS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 lux-card-featured rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Switch Tabs: Crear Cuenta vs Iniciar Sesión */}
              <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-[#000000] border border-white/15">
                <button
                  type="button"
                  onClick={() => {
                    setTab('register')
                    setErrorMsg('')
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    tab === 'register'
                      ? 'bg-[#B0E454] text-[#000000]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" /> Crear Cuenta Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login')
                    setErrorMsg('')
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    tab === 'login'
                      ? 'bg-[#B0E454] text-[#000000]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" /> Iniciar Sesión
                </button>
              </div>

              {tab === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Registro Oficial de Cliente
                    </h2>
                    <p className="text-xs text-white/65 mt-0.5">
                      Tus datos quedarán guardados de forma segura para reservar en segundos y recibir tus códigos QR automáticamente.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Nombre y Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ej: Valentina Contreras"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        RUT o Pasaporte *
                      </label>
                      <input
                        type="text"
                        required
                        value={regRut}
                        onChange={(e) => setRegRut(e.target.value)}
                        placeholder="Ej: 18.492.103-4"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tu@correo.cl"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+56 9 9876 5432"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Patente Vehículo (Estacionamiento Gratis)
                      </label>
                      <input
                        type="text"
                        value={regPlate}
                        onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                        placeholder="Opcional — Ej: PBYR-94"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm font-bold uppercase text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#B0E454] mb-1">
                        Crear Contraseña *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full bg-[#000000] border border-white/20 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] shadow-[0_0_25px_rgba(176,228,84,0.35)] cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creando Cuenta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Registrarme como Cliente Oficial
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Iniciar Sesión en Mi Cuenta de Cliente
                    </h2>
                    <p className="text-xs text-white/65 mt-0.5">
                      Accede con tu correo registrado para autocompletar tu reserva y ver tus códigos QR.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu@correo.cl"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-white/75 mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Tu contraseña (o 123456 para cuentas demo)"
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Ingresando...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" /> Ingresar a Mi Cuenta
                      </>
                    )}
                  </button>

                  {/* Demo Quick Client Login Chips */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[11px] text-white/55 block">
                      Probar acceso rápido con cuentas de clientes existentes:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Valentina Contreras', email: 'v.contreras@gmail.com' },
                        { name: 'Cristóbal Navarrete', email: 'cnavarrete@ingenieria.cl' },
                      ].map((demo) => (
                        <button
                          key={demo.email}
                          type="button"
                          onClick={(e) => {
                            setLoginEmail(demo.email)
                            setLoginPassword('123456')
                            handleLoginSubmit(e, demo.email, '123456')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
                        >
                          {demo.name} ({demo.email})
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Comparison of Cliente Registrado vs Modo Invitado */}
            <aside className="lg:col-span-5 space-y-5">
              <div className="lux-card rounded-3xl p-6 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#B0E454]">
                  <Sparkles className="w-4 h-4" /> Ventajas de tu Cuenta de Cliente
                </div>
                <h3 className="text-lg font-black text-white">
                  ¿Por qué registrarse en All Rent Hoteles?
                </h3>
                <ul className="space-y-3 text-xs text-white/80 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B0E454] shrink-0 mt-0.5" />
                    <span>
                      <strong>Reserva en 1 Clic:</strong> Tu nombre, RUT, teléfono y correo se completan automáticamente cada vez que reservas.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <QrCode className="w-4 h-4 text-[#B0E454] shrink-0 mt-0.5" />
                    <span>
                      <strong>Billetera de Pases QR Únicos:</strong> Accede a todos tus códigos QR de Check-in y Check-out desde cualquier dispositivo.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Car className="w-4 h-4 text-[#B0E454] shrink-0 mt-0.5" />
                    <span>
                      <strong>Estacionamiento Pre-Registrado:</strong> Tu matrícula queda vinculada a tu QR para acceso expedito en Av. Bulnes 119.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lux-card rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Lock className="w-4 h-4 text-[#B0E454]" /> ¿Prefieres Reservar como Invitado?
                </div>
                <p className="text-xs text-white/65 leading-relaxed">
                  También puedes reservar sin crear una cuenta usando nuestro <strong>Modo Invitado Express</strong>. Recibirás igualmente tu Código QR Único en tu correo electrónico.
                </p>
                <Link
                  href="/reservar?modo=invitado"
                  className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white hover:border-[#B0E454] hover:text-[#B0E454] flex items-center justify-center gap-2 transition"
                >
                  Ir a Reservar como Invitado <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
          Cargando portal de clientes...
        </div>
      }
    >
      <RegistroClienteInner />
    </Suspense>
  )
}
