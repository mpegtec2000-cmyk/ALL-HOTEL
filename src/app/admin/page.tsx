'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  MailCheck,
  QrCode,
  MessageSquareMore,
  Wallet,
  Users,
  Car,
  Ban,
  Bot,
  LogOut,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Send,
  Sun,
  ExternalLink,
  ClipboardCheck,
  Trash2,
  Sparkles,
  CreditCard,
  Loader2,
  Home,
} from 'lucide-react'
import {
  AirbnbEmailSyncLog,
  AirbnbIntegrationConfig,
  BlockedRoomDate,
  Booking,
  CashTransaction,
  Client,
  HotelSettings,
  InspectionItem,
  ParkingRecord,
  RoomCategory,
  RoomCategorySlug,
  RoomUnit,
  RoomUnitStatus,
  SolicitudEstado,
  SolicitudFormulario,
} from '@/types/saas'
import { formatCLP, OFFICIAL_ROOM_CATEGORIES } from '@/lib/pricing'
import { SAMPLE_AIRBNB_EMAIL_TEMPLATES } from '@/lib/airbnb-parser'
import { getGmailAutoSyncScript } from '@/lib/airbnb-gmail-script'

type AdminTab =
  | 'dashboard'
  | 'rack'
  | 'reservas'
  | 'airbnb'
  | 'checkin'
  | 'solicitudes'
  | 'caja'
  | 'clientes'
  | 'parking'
  | 'bloqueos'
  | 'copiloto'

const DEFAULT_HOTEL_CHECKLIST: InspectionItem[] = [
  { id: 'cama', label: 'Cama impecable, sábanas hoteleras blancas y almohadas', category: 'habitacion', status: 'ok' },
  { id: 'bano', label: 'Baño privado (en suite o exterior) sanitizado + toallas y jabón', category: 'bano', status: 'ok' },
  { id: 'tv_wifi', label: 'Smart TV operativo, control remoto y señal Wi-Fi verificada', category: 'equipamiento', status: 'ok' },
  { id: 'kitchenette', label: 'Kitchenette (refrigerador/microondas) y patio limpios', category: 'areas_comunes', status: 'ok' },
]

export default function AdminSaaSPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [loading, setLoading] = useState(false)

  // Live Clock & Weather
  const [clock, setClock] = useState('')
  const [weather, setWeather] = useState<{ tempC: number; condition: string } | null>(null)

  // Core SaaS State
  const [metrics, setMetrics] = useState<any>(null)
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [categories, setCategories] = useState<RoomCategory[]>(OFFICIAL_ROOM_CATEGORIES)
  const [units, setUnits] = useState<RoomUnit[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [airbnbConfig, setAirbnbConfig] = useState<AirbnbIntegrationConfig | null>(null)
  const [airbnbLogs, setAirbnbLogs] = useState<AirbnbEmailSyncLog[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudFormulario[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [cashSummary, setCashSummary] = useState<any>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [parkingList, setParkingList] = useState<ParkingRecord[]>([])
  const [blocks, setBlocks] = useState<BlockedRoomDate[]>([])

  // Filters & Modals
  const [bookingSearch, setBookingSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_online' | 'airbnb_email' | 'recepcion_directa'>('all')
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInRoom, setWalkInRoom] = useState<RoomCategorySlug>('superior_matrimonial')
  const [walkInIn, setWalkInIn] = useState('')
  const [walkInOut, setWalkInOut] = useState('')

  // Airbnb Email Simulator & IMAP State
  const [emailFrom, setEmailFrom] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].from)
  const [emailSubject, setEmailSubject] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].subject)
  const [emailBody, setEmailBody] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].body)
  const [syncingEmail, setSyncingEmail] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState('')
  const [copiedScript, setCopiedScript] = useState(false)
  const [imapPass, setImapPass] = useState('')
  const [imapRunning, setImapRunning] = useState(false)

  // Check-in & Ticket State
  const [qrLookupCode, setQrLookupCode] = useState('ARH-2026-1042')
  const [ticketBookingId, setTicketBookingId] = useState('ARH-2026-1042')
  const [ticketType, setTicketType] = useState<'alistamiento_previo' | 'recepcion_checkin' | 'revision_checkout'>('alistamiento_previo')
  const [checklist, setChecklist] = useState<InspectionItem[]>(DEFAULT_HOTEL_CHECKLIST)
  const [ticketNotes, setTicketNotes] = useState('')

  // Caja Form
  const [txType, setTxType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [txCategory, setTxCategory] = useState('pago_recepcion')
  const [txDesc, setTxDesc] = useState('')
  const [txAmount, setTxAmount] = useState('')

  // Parking Form
  const [pkName, setPkName] = useState('')
  const [pkPlate, setPkPlate] = useState('')
  const [pkRoom, setPkRoom] = useState('201')

  // Block Form
  const [blkDate, setBlkDate] = useState('')
  const [blkCategory, setBlkCategory] = useState<RoomCategorySlug | 'all'>('all')
  const [blkReason, setBlkReason] = useState<'Mantención' | 'Aseo Profundo' | 'Bloqueo Operativo'>('Mantención')

  // Copiloto IA
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy el Copiloto IA de All Rent Hoteles Quintero. Estoy conectado en tiempo real al Rack de 12 habitaciones, pasarela de pago online, caja y sincronización de correos Airbnb. ¿Qué deseas consultar?',
    },
  ])

  useEffect(() => {
    if (localStorage.getItem('allrent_saas_auth') === 'true') {
      setAuthenticated(true)
    }
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    setWalkInIn(today.toISOString().split('T')[0])
    setWalkInOut(tomorrow.toISOString().split('T')[0])

    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (authenticated) {
      refreshAll()
      fetch('/api/v1/weather')
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setWeather(res.data)
        })
        .catch(() => {})
    }
  }, [authenticated])

  async function refreshAll() {
    setLoading(true)
    try {
      const [
        dashRes,
        roomsRes,
        bookRes,
        airRes,
        tckRes,
        solRes,
        cajaRes,
        cliRes,
        pkRes,
        blkRes,
      ] = await Promise.all([
        fetch('/api/v1/admin/dashboard').then((r) => r.json()),
        fetch('/api/v1/admin/rooms').then((r) => r.json()),
        fetch('/api/v1/bookings').then((r) => r.json()),
        fetch('/api/v1/integrations/airbnb/inbound-email').then((r) => r.json()),
        fetch('/api/v1/admin/tickets').then((r) => r.json()),
        fetch('/api/v1/solicitudes').then((r) => r.json()),
        fetch('/api/v1/admin/caja').then((r) => r.json()),
        fetch('/api/v1/admin/clientes').then((r) => r.json()),
        fetch('/api/v1/admin/parking').then((r) => r.json()),
        fetch('/api/v1/admin/blocks').then((r) => r.json()),
      ])

      if (dashRes.success) {
        setMetrics(dashRes.data.metrics)
        setSettings(dashRes.data.settings)
      }
      if (roomsRes.success) {
        setCategories(roomsRes.data.categories)
        setUnits(roomsRes.data.units)
      }
      if (bookRes.success) setBookings(bookRes.data)
      if (airRes.success) {
        setAirbnbConfig(airRes.data.config)
        setAirbnbLogs(airRes.data.logs)
      }
      if (tckRes.success) setTickets(tckRes.data)
      if (solRes.success) setSolicitudes(solRes.data)
      if (cajaRes.success) {
        setTransactions(cajaRes.data.transactions)
        setCashSummary(cajaRes.data.summary)
      }
      if (cliRes.success) setClients(cliRes.data)
      if (pkRes.success) setParkingList(pkRes.data)
      if (blkRes.success) setBlocks(blkRes.data)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinInput }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('allrent_saas_auth', 'true')
      setAuthenticated(true)
    } else {
      setLoginError(data.error || 'PIN inválido')
    }
  }

  async function handleUnitStatusChange(unitId: string, status: RoomUnitStatus) {
    await fetch('/api/v1/admin/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unit', unitId, updates: { status } }),
    })
    refreshAll()
  }

  async function handlePriceUpdate(slug: RoomCategorySlug, newPrice: number) {
    if (!newPrice || newPrice < 10000) return
    await fetch('/api/v1/admin/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', slug, updates: { pricePerNight: newPrice } }),
    })
    refreshAll()
  }

  async function handleBookingStatusChange(id: string, status: Booking['status']) {
    await fetch(`/api/v1/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    refreshAll()
  }

  async function handleCreateWalkIn(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCategory: walkInRoom,
        checkInDate: walkInIn,
        checkOutDate: walkInOut,
        guestsCount: 2,
        clientName: walkInName,
        clientPhone: walkInPhone,
        clientEmail: walkInEmail || 'recepcion@allrenthoteles.cl',
        source: 'recepcion_directa',
      }),
    })
    if (res.ok) {
      setNewBookingOpen(false)
      setWalkInName('')
      setWalkInPhone('')
      setWalkInEmail('')
      refreshAll()
    }
  }

  async function handleProcessAirbnbEmail(e: React.FormEvent) {
    e.preventDefault()
    setSyncingEmail(true)
    setSyncFeedback('')
    try {
      const res = await fetch('/api/v1/integrations/airbnb/inbound-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'admin_internal',
          from: emailFrom,
          subject: emailSubject,
          textBody: emailBody,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const statusMsg =
          data.log.status === 'synced'
            ? `¡Reserva creada automáticamente en BD! Código Hotel: ${data.booking?.id} (Hab. ${data.booking?.assignedRoomNumber || 'Asignada'})`
            : data.log.status === 'cancelled_updated'
            ? `Cancelación procesada: Reserva ${data.log.airbnbCode} liberada en el calendario.`
            : `Comprobante ${data.log.airbnbCode} ya estaba registrado (Protección anti-duplicados activa).`
        setSyncFeedback(statusMsg)
        refreshAll()
      } else {
        setSyncFeedback(data.error || 'Error procesando correo.')
      }
    } finally {
      setSyncingEmail(false)
    }
  }

  async function handleImapSync() {
    setImapRunning(true)
    setSyncFeedback('')
    try {
      const res = await fetch('/api/v1/integrations/airbnb/imap-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imapPassword: imapPass }),
      })
      const data = await res.json()
      if (data.success) {
        setSyncFeedback(
          `Buzón IMAP revisado: ${data.processedCount} correos analizados, ${data.createdBookings.length} nuevas reservas creadas.`
        )
        refreshAll()
      } else {
        setSyncFeedback(data.error || 'No fue posible conectar por IMAP.')
      }
    } finally {
      setImapRunning(false)
    }
  }

  async function handleSaveInspection(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/v1/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: ticketBookingId,
        type: ticketType,
        items: checklist,
        generalNotes: ticketNotes,
      }),
    })
    setTicketNotes('')
    refreshAll()
  }

  async function handleAddCashTx(e: React.FormEvent) {
    e.preventDefault()
    if (!txDesc || !txAmount) return
    await fetch('/api/v1/admin/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: txType,
        category: txCategory,
        description: txDesc,
        amount: Number(txAmount),
      }),
    })
    setTxDesc('')
    setTxAmount('')
    refreshAll()
  }

  async function handleAddParking(e: React.FormEvent) {
    e.preventDefault()
    if (!pkName || !pkPlate) return
    await fetch('/api/v1/admin/parking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: pkName,
        vehiclePlate: pkPlate,
        roomNumber: pkRoom,
      }),
    })
    setPkName('')
    setPkPlate('')
    refreshAll()
  }

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!blkDate) return
    await fetch('/api/v1/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: blkDate,
        roomCategory: blkCategory,
        reason: blkReason,
      }),
    })
    setBlkDate('')
    refreshAll()
  }

  async function handleSendCopilot(promptText?: string) {
    const q = (promptText ?? aiInput).trim()
    if (!q || aiLoading) return
    const next = [...aiMessages, { role: 'user' as const, content: q }]
    setAiMessages(next)
    if (!promptText) setAiInput('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, mode: 'admin', history: next }),
      })
      const data = await res.json()
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'Sin respuesta.' },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSource = sourceFilter === 'all' || b.source === sourceFilter
      const q = bookingSearch.toLowerCase().trim()
      const matchText =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.externalCode && b.externalCode.toLowerCase().includes(q)) ||
        (b.assignedRoomNumber && b.assignedRoomNumber.includes(q))
      return matchSource && matchText
    })
  }, [bookings, sourceFilter, bookingSearch])

  const scannedBooking = useMemo(
    () =>
      bookings.find(
        (b) =>
          b.id.toUpperCase() === qrLookupCode.trim().toUpperCase() ||
          (b.externalCode && b.externalCode.toUpperCase() === qrLookupCode.trim().toUpperCase())
      ) || null,
    [bookings, qrLookupCode]
  )

  const webhookEndpointUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/integrations/airbnb/inbound-email`
      : 'https://allrenthoteles.cl/api/v1/integrations/airbnb/inbound-email'

  // LOGIN GATE
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#000000] border border-white/15 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="relative h-16 w-48 mx-auto">
            <Image
              src="/brand/logo-neon.png"
              alt="All Rent Hoteles"
              fill
              sizes="192px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">PMS Hotelero SaaS</h1>
            <p className="text-xs text-white/65 mt-1">
              Administración Oficial All Rent Hoteles · Av. Bulnes 119, Quintero
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN de Acceso (Ej: 2026 o admin)"
              autoFocus
              className="w-full bg-[#000000] border border-white/20 rounded-xl px-4 py-3.5 text-center text-lg font-bold tracking-widest text-white focus:border-[#B0E454] focus:outline-none"
            />
            {loginError && <p className="text-xs text-red-400 font-semibold">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider hover:bg-[#BEEB6B] cursor-pointer"
            >
              Ingresar al Panel Administrativo
            </button>
          </form>

          <p className="text-[11px] text-white/45">
            Acceso rápido demo habilitado: PIN <strong className="text-[#B0E454]">2026</strong> o{' '}
            <strong className="text-[#B0E454]">1234</strong>
          </p>

          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
            <Home className="w-3.5 h-3.5" /> Volver al sitio público
          </Link>
        </div>
      </div>
    )
  }

  const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: any; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard KPIs', icon: LayoutDashboard },
    { id: 'rack', label: 'Rack Habitaciones', icon: BedDouble },
    { id: 'reservas', label: 'Reservas & Webpay', icon: CalendarDays, badge: bookings.length },
    { id: 'airbnb', label: 'Airbnb Correo Sync', icon: MailCheck, badge: airbnbLogs.length },
    { id: 'checkin', label: 'Check-in QR & Aseo', icon: QrCode },
    {
      id: 'solicitudes',
      label: 'Solicitudes Web',
      icon: MessageSquareMore,
      badge: solicitudes.filter((s) => s.estado === 'nueva').length || undefined,
    },
    { id: 'caja', label: 'Caja & Finanzas', icon: Wallet },
    { id: 'clientes', label: 'Huéspedes CRM', icon: Users },
    { id: 'parking', label: 'Estacionamiento CCTV', icon: Car },
    { id: 'bloqueos', label: 'Bloqueos & Mantención', icon: Ban },
    { id: 'copiloto', label: 'Copiloto IA', icon: Bot },
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col lg:flex-row">
      {/* SIDEBAR */}
      <aside className="lg:w-68 bg-[#000000] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between shrink-0">
        <div className="p-4 lg:p-5 space-y-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="relative h-11 w-36 block">
              <Image
                src="/brand/logo-neon.png"
                alt="All Rent Hoteles"
                fill
                sizes="144px"
                className="object-contain object-left"
              />
            </Link>
            <span className="px-2 py-0.5 rounded-md bg-[#B0E454]/15 text-[#B0E454] text-[10px] font-black uppercase">
              PMS Pro
            </span>
          </div>

          {/* Horizontal scrollable on mobile, vertical on desktop */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`shrink-0 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[#B0E454] text-[#000000] shadow-[0_0_20px_rgba(176,228,84,0.28)]'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        active ? 'bg-[#000000] text-[#B0E454]' : 'bg-white/10 text-[#B0E454]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-2 p-5 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-[#000000] border border-white/10 space-y-1">
            <p className="font-extrabold text-white">Administración All Rent Hoteles</p>
            <p className="text-white/55">Check-in 12:00 / Out 12:00</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Link href="/" className="text-white/65 hover:text-[#B0E454] inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Ver Web
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('allrent_saas_auth')
                setAuthenticated(false)
              }}
              className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-white/60">
              All Rent Hoteles · Av. Bulnes 119, Quintero · Horario Oficial 12:00 a 12:00
            </p>
          </div>

          <div className="flex items-center gap-3">
            {weather && (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#000000] border border-white/10 text-xs">
                <Sun className="w-4 h-4 text-[#B0E454]" />
                <span>
                  Quintero <strong>{weather.tempC}°C</strong>
                </span>
              </div>
            )}
            <div className="px-3.5 py-2 rounded-xl bg-[#000000] border border-white/10 text-xs font-mono text-[#B0E454] font-bold">
              {clock}
            </div>
            <button
              type="button"
              onClick={refreshAll}
              className="p-2.5 rounded-xl bg-[#000000] border border-white/15 text-white hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#B0E454]' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD KPIs */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#000000] border border-[#B0E454]/40">
                <span className="text-xs font-bold uppercase text-white/60">Balance Disponible Caja</span>
                <p className="text-3xl font-black text-[#B0E454] mt-1">
                  {formatCLP(metrics.cash.availableBalance)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Webpay: {formatCLP(metrics.cash.webpayIncome)} · Airbnb: {formatCLP(metrics.cash.airbnbIncome)}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#000000] border border-white/12">
                <span className="text-xs font-bold uppercase text-white/60">Ocupación Rack Hoy</span>
                <p className="text-3xl font-black text-white mt-1">{metrics.occupancyRate}%</p>
                <p className="text-xs text-[#B0E454] mt-1">
                  {metrics.availableUnits} libres · {metrics.occupiedUnits} ocupadas · {metrics.cleaningUnits} aseo
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#000000] border border-white/12">
                <span className="text-xs font-bold uppercase text-white/60">Tarifa Promedio (ADR)</span>
                <p className="text-3xl font-black text-white mt-1">{formatCLP(metrics.adr)}</p>
                <p className="text-xs text-white/60 mt-1">RevPAR: {formatCLP(metrics.revPar)}</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#000000] border border-white/12">
                <span className="text-xs font-bold uppercase text-white/60">Sync Automático Airbnb</span>
                <p className="text-3xl font-black text-[#B0E454] mt-1">{metrics.airbnbSyncedTotal}</p>
                <p className="text-xs text-white/60 mt-1">
                  Comprobantes de correo procesados
                </p>
              </div>
            </div>

            {/* Channel Attribution + Quick Rack */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-6 rounded-3xl bg-[#000000] border border-white/12 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-white">Últimas Reservas Confirmadas</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reservas')}
                    className="text-xs font-bold text-[#B0E454] cursor-pointer"
                  >
                    Ver todas →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bookings.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#000000] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-white">{b.clientName}</strong>
                          <span className="text-[11px] font-mono text-[#B0E454]">{b.id}</span>
                          {b.externalCode && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Airbnb {b.externalCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60">
                          {b.roomCategoryName} {b.assignedRoomNumber ? `(Hab. ${b.assignedRoomNumber})` : ''} · {b.checkInDate} → {b.checkOutDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <strong className="text-sm font-black text-[#B0E454]">
                          {formatCLP(b.totalAmount)}
                        </strong>
                        <span className="block text-[10px] uppercase text-white/60">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#000000] border border-white/12 space-y-5">
                <h2 className="text-base font-extrabold text-white">Distribución por Canal</h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Web Directa + Pasarela Webpay</span>
                      <strong className="text-[#B0E454]">{metrics.bySource.web_online} reservas</strong>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#000000] overflow-hidden">
                      <div className="h-full bg-[#B0E454] w-1/2" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Airbnb (Integración Correo Automática)</span>
                      <strong className="text-rose-400">{metrics.bySource.airbnb_email} reservas</strong>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#000000] overflow-hidden">
                      <div className="h-full bg-rose-500 w-2/5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Recepción Directa / Teléfono</span>
                      <strong className="text-sky-400">{metrics.bySource.recepcion_directa} reservas</strong>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#000000] overflow-hidden">
                      <div className="h-full bg-sky-400 w-1/4" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('airbnb')}
                    className="p-3 rounded-xl bg-[#000000] border border-white/15 hover:border-[#B0E454] text-left cursor-pointer"
                  >
                    <MailCheck className="w-5 h-5 text-[#B0E454] mb-1" />
                    <span className="text-xs font-bold block">Probar Sync Airbnb</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rack')}
                    className="p-3 rounded-xl bg-[#000000] border border-white/15 hover:border-[#B0E454] text-left cursor-pointer"
                  >
                    <BedDouble className="w-5 h-5 text-[#B0E454] mb-1" />
                    <span className="text-xs font-bold block">Abrir Rack 12 Hab.</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. RACK DE HABITACIONES & TARIFAS */}
        {activeTab === 'rack' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-black text-white mb-3">
                Estado en Vivo de Unidades Físicas (Piso 1 & Piso 2)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {units.map((u) => {
                  const cat = categories.find((c) => c.slug === u.categorySlug)
                  const badgeStyle =
                    u.status === 'disponible'
                      ? 'bg-[#B0E454]/15 text-[#B0E454] border-[#B0E454]/40'
                      : u.status === 'ocupada'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                      : u.status === 'aseo_pendiente'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                      : 'bg-red-500/15 text-red-300 border-red-400/40'

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-[#000000] border border-white/12 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">Hab. {u.number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle}`}>
                          {u.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-semibold">
                        {cat?.name} · <span className="text-white/50">{cat?.bathroomLabel}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(['disponible', 'ocupada', 'aseo_pendiente', 'mantencion'] as RoomUnitStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUnitStatusChange(u.id, st)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                                u.status === st
                                  ? 'bg-[#B0E454] text-[#000000]'
                                  : 'bg-[#000000] text-white/65 border border-white/10 hover:text-white'
                              }`}
                            >
                              {st === 'aseo_pendiente' ? 'Aseo' : st}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tariff Manager */}
            <div className="bg-[#000000] border border-white/12 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-black text-white">
                Tarifario Oficial por Noche (Check-in 12:00 a Check-out 12:00)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.slug}
                    className="p-4 rounded-2xl bg-[#000000] border border-white/10 space-y-2"
                  >
                    <span className="text-[11px] font-bold text-[#B0E454] uppercase">
                      {cat.bathroomLabel}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{cat.name}</h3>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        defaultValue={cat.pricePerNight}
                        step={500}
                        onBlur={(e) => handlePriceUpdate(cat.slug, Number(e.target.value))}
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-sm font-bold text-white"
                      />
                      <span className="text-xs text-white/50">CLP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. RESERVAS & WEBPAY */}
        {activeTab === 'reservas' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Buscar nombre, ARH o código Airbnb..."
                    className="bg-[#000000] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white w-64 focus:border-[#B0E454] focus:outline-none"
                  />
                </div>
                {(['all', 'web_online', 'airbnb_email', 'recepcion_directa'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSourceFilter(src)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      sourceFilter === src
                        ? 'bg-[#B0E454] text-[#000000]'
                        : 'bg-[#000000] text-white/70 border border-white/10'
                    }`}
                  >
                    {src === 'all'
                      ? 'Todas'
                      : src === 'web_online'
                      ? 'Pasarela Web'
                      : src === 'airbnb_email'
                      ? 'Airbnb Correo'
                      : 'Recepción'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setNewBookingOpen(!newBookingOpen)}
                className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nueva Reserva Recepción
              </button>
            </div>

            {newBookingOpen && (
              <form
                onSubmit={handleCreateWalkIn}
                className="p-5 rounded-2xl bg-[#000000] border border-[#B0E454]/50 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
              >
                <input
                  type="text"
                  required
                  placeholder="Nombre Huésped *"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Teléfono *"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                />
                <select
                  value={walkInRoom}
                  onChange={(e) => setWalkInRoom(e.target.value as RoomCategorySlug)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({formatCLP(c.pricePerNight)})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={walkInIn}
                  onChange={(e) => setWalkInIn(e.target.value)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white [color-scheme:dark]"
                />
                <input
                  type="date"
                  required
                  value={walkInOut}
                  onChange={(e) => setWalkInOut(e.target.value)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white [color-scheme:dark]"
                />
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                >
                  Guardar Reserva
                </button>
              </form>
            )}

            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-[#000000] border border-white/12 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#B0E454]">{b.id}</span>
                      {b.externalCode && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-bold">
                          Airbnb: {b.externalCode}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-bold">
                        {b.assignedRoomNumber ? `Hab. ${b.assignedRoomNumber}` : 'Sin asignar'}
                      </span>
                      <span className="text-xs text-white/55">({b.source})</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      {b.clientName} · <span className="text-white/75">{b.roomCategoryName}</span>
                    </h3>
                    <p className="text-xs text-white/60">
                      Check-in 12:00: <strong>{b.checkInDate}</strong> → Check-out 12:00:{' '}
                      <strong>{b.checkOutDate}</strong> ({b.nightsCount} noches · {b.guestsCount} pers.) · Tel: {b.clientPhone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-base font-black text-[#B0E454]">{formatCLP(b.totalAmount)}</p>
                      <p className="text-[11px] text-white/60">
                        Pagado: {formatCLP(b.amountPaid)} ({b.paymentStatus})
                      </p>
                    </div>

                    <select
                      value={b.status}
                      onChange={(e) => handleBookingStatusChange(b.id, e.target.value as Booking['status'])}
                      className="bg-[#000000] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    >
                      <option value="pending_payment">Pendiente Pago</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="checked_in">Checked-In (En Hotel)</option>
                      <option value="completed">Check-Out Completado</option>
                      <option value="cancelled">Cancelada</option>
                    </select>

                    <Link
                      href={`/mi-reserva?codigo=${b.id}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-[#B0E454]"
                      title="Abrir Pase QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. AIRBNB INBOUND EMAIL SYNC MODULE */}
        {activeTab === 'airbnb' && (
          <div className="space-y-6">
            {/* Banner Explanation */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#000000] to-[#000000] border border-[#B0E454]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#B0E454]">
                  <Sparkles className="w-4 h-4" /> Automatización Airbnb → Correo → Base de Datos
                </span>
                <h2 className="text-xl font-black text-white">
                  Cuando llega el comprobante de Airbnb a tu correo, se agenda solo en el sistema
                </h2>
                <p className="text-xs sm:text-sm text-white/75 max-w-3xl">
                  El motor detecta automáticamente código de confirmación Airbnb, nombre del huésped, categoría de habitación, fechas Check-in/Check-out (12:00 a 12:00) y monto CLP, asignando habitación física libre y registrando el ingreso en Caja.
                </p>
              </div>
              <div className="shrink-0 px-4 py-3 rounded-2xl bg-[#000000] border border-white/15 text-xs">
                <span className="text-white/55 block">Endpoint Webhook Activo</span>
                <code className="text-[#B0E454] font-mono text-[11px]">{webhookEndpointUrl}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Live Simulator / Manual Voucher Processor */}
              <form
                onSubmit={handleProcessAirbnbEmail}
                className="lg:col-span-7 bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    Simulador / Procesador en Vivo de Comprobante Correo Airbnb
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_AIRBNB_EMAIL_TEMPLATES.map((tpl, i) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => {
                          setEmailFrom(tpl.from)
                          setEmailSubject(tpl.subject)
                          setEmailBody(tpl.body)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80 hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
                      >
                        Ejemplo {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                      Remitente del Correo
                    </label>
                    <input
                      type="text"
                      value={emailFrom}
                      onChange={(e) => setEmailFrom(e.target.value)}
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                      Asunto del Correo
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                    Contenido del Comprobante Airbnb (Texto o HTML)
                  </label>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl p-3 text-xs font-mono text-white/90 focus:border-[#B0E454] focus:outline-none"
                  />
                </div>

                {syncFeedback && (
                  <div className="p-3.5 rounded-xl bg-[#000000] border border-[#B0E454]/50 text-xs font-bold text-[#B0E454]">
                    {syncFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={syncingEmail}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] cursor-pointer"
                >
                  {syncingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analizando Correo...
                    </>
                  ) : (
                    <>
                      <MailCheck className="w-4 h-4" /> Procesar Comprobante y Agendar en Base de Datos
                    </>
                  )}
                </button>
              </form>

              {/* Right: Gmail Auto-Forwarder Script + Direct IMAP */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white">
                      Opción A: Conector Gmail Automático (Gratis 24/7)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          getGmailAutoSyncScript(
                            webhookEndpointUrl,
                            airbnbConfig?.webhookSecret || 'arh_quintero_sync_2026'
                          )
                        )
                        setCopiedScript(true)
                        setTimeout(() => setCopiedScript(false), 2500)
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B0E454] text-[#000000] text-xs font-black cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedScript ? 'Copiado' : 'Copiar Script Gmail'}
                    </button>
                  </div>
                  <p className="text-xs text-white/65 leading-relaxed">
                    Pega este script en <code>script.google.com</code> en el Gmail del hotel. Cada vez que llegue un comprobante de <code>@airbnb.com</code>, se enviará automáticamente a tu base de datos sin intervención humana.
                  </p>
                </div>

                <div className="bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-white">
                    Opción B: Lectura Directa Buzón IMAP
                  </h3>
                  <p className="text-xs text-white/65">
                    Servidor configurado: <strong>{airbnbConfig?.imapHost || 'imap.gmail.com'}:993</strong> ({airbnbConfig?.imapUser})
                  </p>
                  <input
                    type="password"
                    value={imapPass}
                    onChange={(e) => setImapPass(e.target.value)}
                    placeholder="Contraseña de Aplicación Correo (App Password)"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={imapRunning}
                    onClick={handleImapSync}
                    className="w-full py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 text-xs font-bold text-white hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
                  >
                    {imapRunning ? 'Conectando a IMAP...' : 'Escanear Correos Airbnb Ahora'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sync Logs */}
            <div className="bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-extrabold text-white">
                Historial de Comprobantes Airbnb Sincronizados ({airbnbLogs.length})
              </h3>
              <div className="space-y-2">
                {airbnbLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-[#000000] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#B0E454] mr-2">{log.airbnbCode}</span>
                      <strong className="text-white">{log.guestName}</strong>
                      <span className="text-white/60 ml-2">{log.rawSnippet}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-bold uppercase text-[10px]">
                      {log.status} {log.bookingIdCreated ? `→ ${log.bookingIdCreated}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. CHECK-IN QR & INSPECCION HABITACIONES */}
        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#B0E454]" /> Validador Rápido de Pase QR Recepción
              </h2>
              <input
                type="text"
                value={qrLookupCode}
                onChange={(e) => setQrLookupCode(e.target.value.toUpperCase())}
                placeholder="Escanea o ingresa ARH-2026-XXXX / HM..."
                className="w-full bg-[#000000] border border-white/15 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white"
              />
              {scannedBooking ? (
                <div className="p-4 rounded-2xl bg-[#000000] border border-[#B0E454]/40 space-y-2 text-xs">
                  <p className="text-sm font-black text-[#B0E454]">
                    {scannedBooking.clientName} · Hab. {scannedBooking.assignedRoomNumber || 'Por asignar'}
                  </p>
                  <p className="text-white/75">
                    {scannedBooking.roomCategoryName} · {scannedBooking.checkInDate} al {scannedBooking.checkOutDate}
                  </p>
                  <p className="text-white/75">
                    Estado Pago: <strong>{scannedBooking.paymentStatus}</strong> ({formatCLP(scannedBooking.amountPaid)} / {formatCLP(scannedBooking.totalAmount)})
                  </p>
                  <button
                    type="button"
                    onClick={() => handleBookingStatusChange(scannedBooking.id, 'checked_in')}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black uppercase cursor-pointer"
                  >
                    Registrar Ingreso 12:00 (Check-in)
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/50">No coincide con ninguna reserva activa.</p>
              )}
            </div>

            <form
              onSubmit={handleSaveInspection}
              className="lg:col-span-7 bg-[#000000] border border-white/15 rounded-3xl p-6 space-y-4"
            >
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#B0E454]" /> Ticket de Alistamiento / Revisión Check-out 12:00
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={ticketBookingId}
                  onChange={(e) => setTicketBookingId(e.target.value)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.clientName} (Hab. {b.assignedRoomNumber || '-'})
                    </option>
                  ))}
                </select>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value as any)}
                  className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="alistamiento_previo">Alistamiento Previo Check-in 12:00</option>
                  <option value="recepcion_checkin">Entrega Recepción</option>
                  <option value="revision_checkout">Revisión Salida Check-out 12:00</option>
                </select>
              </div>

              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#000000] border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <span>{item.label}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...checklist]
                          next[idx] = { ...next[idx], status: 'ok' }
                          setChecklist(next)
                        }}
                        className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                          item.status === 'ok' ? 'bg-[#B0E454] text-[#000000]' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...checklist]
                          next[idx] = { ...next[idx], status: 'issue' }
                          setChecklist(next)
                        }}
                        className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                          item.status === 'issue' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        Obs.
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={ticketNotes}
                onChange={(e) => setTicketNotes(e.target.value)}
                placeholder="Observaciones de la habitación..."
                className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />

              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
              >
                Guardar Ticket de Habitación
              </button>

              {tickets.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-xs font-bold text-white/70">Últimos Tickets:</p>
                  {tickets.slice(0, 4).map((t) => (
                    <div key={t.id} className="text-xs text-white/75 flex justify-between">
                      <span>
                        {t.id} · Hab. {t.roomNumber || '-'} ({t.clientName})
                      </span>
                      <strong className="text-[#B0E454] uppercase">{t.status}</strong>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {/* 6. SOLICITUDES WEB CRM */}
        {activeTab === 'solicitudes' && (
          <div className="space-y-3">
            {solicitudes.map((sol) => (
              <div
                key={sol.id}
                className="p-5 rounded-2xl bg-[#000000] border border-white/12 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-white">{sol.nombre}</strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#B0E454]/15 text-[#B0E454] text-[11px] font-bold uppercase">
                      {sol.estado}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    Interés: <strong>{sol.habitacionInteres}</strong> · Fecha: {sol.checkInDeseado} ({sol.noches} noches, {sol.huespedes} pers.)
                  </p>
                  {sol.mensaje && <p className="text-xs text-white/60 italic">&ldquo;{sol.mensaje}&rdquo;</p>}
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={sol.estado}
                    onChange={async (e) => {
                      await fetch('/api/v1/solicitudes', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: sol.id, estado: e.target.value as SolicitudEstado }),
                      })
                      refreshAll()
                    }}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white"
                  >
                    <option value="nueva">Nueva</option>
                    <option value="contactado">Contactado</option>
                    <option value="cotizado">Cotizado</option>
                    <option value="convertida">Convertida</option>
                    <option value="descartada">Descartada</option>
                  </select>
                  <a
                    href={`https://wa.me/${sol.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola ${sol.nombre}, te contactamos de Central de Reservas de All Rent Hoteles Quintero respecto a tu consulta por ${sol.habitacionInteres}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7. CAJA & FINANZAS */}
        {activeTab === 'caja' && cashSummary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#B0E454]/40">
                <span className="text-xs text-white/60">Saldo Disponible</span>
                <p className="text-2xl font-black text-[#B0E454]">{formatCLP(cashSummary.availableBalance)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#000000] border border-white/10">
                <span className="text-xs text-white/60">Ingresos Webpay</span>
                <p className="text-2xl font-black text-white">{formatCLP(cashSummary.webpayIncome)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#000000] border border-white/10">
                <span className="text-xs text-white/60">Ingresos Airbnb</span>
                <p className="text-2xl font-black text-white">{formatCLP(cashSummary.airbnbIncome)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#000000] border border-white/10">
                <span className="text-xs text-white/60">Gastos Operativos</span>
                <p className="text-2xl font-black text-red-400">-{formatCLP(cashSummary.totalExpense)}</p>
              </div>
            </div>

            <form
              onSubmit={handleAddCashTx}
              className="p-5 rounded-2xl bg-[#000000] border border-white/15 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'ingreso' | 'gasto')}
                className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="ingreso">Ingreso (+)</option>
                <option value="gasto">Gasto (-)</option>
              </select>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="pago_recepcion">Pago Recepción</option>
                <option value="transferencia_directa">Transferencia</option>
                <option value="lavanderia_blancos">Lavandería Sábanas</option>
                <option value="insumos_aseo">Insumos Aseo</option>
                <option value="mantencion_hotel">Mantención</option>
              </select>
              <input
                type="text"
                required
                placeholder="Descripción movimiento"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="sm:col-span-2 bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  placeholder="Monto CLP"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-[#000000] border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-white">{t.description}</strong>
                    <p className="text-white/50">
                      {t.date} · {t.operator} · Comprobante: {t.receiptNumber || '-'}
                    </p>
                  </div>
                  <strong className={t.amount >= 0 ? 'text-[#B0E454] text-sm' : 'text-red-400 text-sm'}>
                    {t.amount >= 0 ? `+${formatCLP(t.amount)}` : `-${formatCLP(Math.abs(t.amount))}`}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. CLIENTES CRM */}
        {activeTab === 'clientes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-[#000000] border border-white/12 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-base text-white">{c.name}</strong>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#B0E454] text-[11px] font-bold">
                    {c.origin}
                  </span>
                </div>
                <p className="text-xs text-white/65">
                  Doc: {c.rutOrPassport} · Tel: {c.phone} · {c.email}
                </p>
                <div className="flex justify-between pt-2 border-t border-white/10 text-xs">
                  <span>Estadías: <strong>{c.totalStays}</strong> ({c.favoriteRoom || '-'})</span>
                  <strong className="text-[#B0E454]">{formatCLP(c.totalSpent)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 9. ESTACIONAMIENTO & SEGURIDAD */}
        {activeTab === 'parking' && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddParking}
              className="p-5 rounded-2xl bg-[#000000] border border-white/15 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <input
                type="text"
                required
                placeholder="Nombre Huésped / Conductor"
                value={pkName}
                onChange={(e) => setPkName(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="Patente (Ej: PBYR-94)"
                value={pkPlate}
                onChange={(e) => setPkPlate(e.target.value.toUpperCase())}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs uppercase font-bold text-white"
              />
              <input
                type="text"
                placeholder="Habitación (Ej: 201)"
                value={pkRoom}
                onChange={(e) => setPkRoom(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
              >
                Registrar Ingreso Vehículo
              </button>
            </form>

            <div className="space-y-2.5">
              {parkingList.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#000000] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="px-2.5 py-1 rounded bg-[#B0E454] text-[#000000] font-mono font-black mr-2">
                      {p.vehiclePlate}
                    </span>
                    <strong className="text-white">{p.guestName}</strong>
                    <span className="text-white/60 ml-2">
                      {p.roomNumber ? `Hab. ${p.roomNumber}` : ''} · Ingreso: {p.entryTime}
                    </span>
                  </div>
                  {p.status === 'estacionado' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/v1/admin/parking', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: p.id }),
                        })
                        refreshAll()
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-white font-bold cursor-pointer"
                    >
                      Marcar Salida
                    </button>
                  ) : (
                    <span className="text-white/45">Retirado ({p.exitTime})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. BLOQUEOS DE FECHAS */}
        {activeTab === 'bloqueos' && (
          <div className="space-y-5">
            <form
              onSubmit={handleAddBlock}
              className="p-5 rounded-2xl bg-[#000000] border border-white/15 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <input
                type="date"
                required
                value={blkDate}
                onChange={(e) => setBlkDate(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white [color-scheme:dark]"
              />
              <select
                value={blkCategory}
                onChange={(e) => setBlkCategory(e.target.value as any)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              >
                <option value="all">Todo el Hotel</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={blkReason}
                onChange={(e) => setBlkReason(e.target.value as any)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              >
                <option value="Mantención">Mantención</option>
                <option value="Aseo Profundo">Aseo Profundo</option>
                <option value="Bloqueo Operativo">Bloqueo Operativo</option>
              </select>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
              >
                Bloquear Fecha
              </button>
            </form>

            <div className="space-y-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-[#000000] border border-white/10 flex items-center justify-between text-xs"
                >
                  <span>
                    <strong className="text-[#B0E454]">{b.date}</strong> · {b.roomCategory} · {b.reason}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/v1/admin/blocks?id=${b.id}`, { method: 'DELETE' })
                      refreshAll()
                    }}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. COPILOTO IA HOTELERO */}
        {activeTab === 'copiloto' && (
          <div className="max-w-4xl bg-[#000000] border border-white/15 rounded-3xl overflow-hidden flex flex-col h-[560px]">
            <div className="p-4 bg-[#000000] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-[#B0E454]" />
                <strong className="text-sm text-white">Copiloto IA Ejecutivo All Rent Hoteles</strong>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['¿Cómo está la ocupación hoy?', 'Resumen de caja y Webpay', 'Últimos correos Airbnb'].map(
                  (chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendCopilot(chip)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/80 hover:border-[#B0E454] cursor-pointer"
                    >
                      {chip}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs sm:text-sm">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl whitespace-pre-line leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#B0E454] text-[#000000] font-bold ml-12'
                      : 'bg-[#000000] border border-white/10 text-white/90 mr-8'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {aiLoading && <p className="text-xs text-white/50">Analizando datos del hotel...</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendCopilot()
              }}
              className="p-4 bg-[#000000] border-t border-white/10 flex gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Pregunta por habitaciones libres, ingresos Webpay, Airbnb o reservas..."
                className="flex-1 bg-[#000000] border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:border-[#B0E454] focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Consultar
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
