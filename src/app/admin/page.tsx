'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  ShieldAlert,
  Search,
  Copy,
  Check,
  Send,
  Sun,
  ExternalLink,
  ClipboardCheck,
  Trash2,
  Sparkles,
  Loader2,
  Home,
  Camera,
  CameraOff,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarPlus,
  KeyRound,
  Mail,
} from 'lucide-react'
import {
  AirbnbEmailAccountConfig,
  AirbnbEmailSyncLog,
  AirbnbIntegrationConfig,
  BlockedRoomDate,
  Booking,
  CashTransaction,
  Client,
  EmailOutboxLog,
  HotelSettings,
  InspectionItem,
  ParkingRecord,
  PaymentMethod,
  RoomCategory,
  RoomCategorySlug,
  RoomCostCenterSummary,
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
  | 'checkin'
  | 'reservas'
  | 'rack'
  | 'airbnb'
  | 'caja'
  | 'solicitudes'
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
  const [, setSettings] = useState<HotelSettings | null>(null)
  const [categories, setCategories] = useState<RoomCategory[]>(OFFICIAL_ROOM_CATEGORIES)
  const [units, setUnits] = useState<RoomUnit[]>([])
  const [costCenters, setCostCenters] = useState<RoomCostCenterSummary[]>([])
  const [costCenterTotals, setCostCenterTotals] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [airbnbConfig, setAirbnbConfig] = useState<AirbnbIntegrationConfig | null>(null)
  const [airbnbLogs, setAirbnbLogs] = useState<AirbnbEmailSyncLog[]>([])
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxLog[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudFormulario[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [cashSummary, setCashSummary] = useState<any>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [parkingList, setParkingList] = useState<ParkingRecord[]>([])
  const [blocks, setBlocks] = useState<BlockedRoomDate[]>([])

  // Compact 14-Day PMS Matrix Calendar Start Date
  const [calendarStartStr, setCalendarStartStr] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })

  // Filters & Manual Reservation Modal
  const [bookingSearch, setBookingSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_online' | 'airbnb_email' | 'recepcion_directa'>('all')
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [walkInName, setWalkInName] = useState('')
  const [walkInRut, setWalkInRut] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInPlate, setWalkInPlate] = useState('')
  const [walkInRoom, setWalkInRoom] = useState<RoomCategorySlug>('superior_matrimonial')
  const [walkInRoomNumber, setWalkInRoomNumber] = useState('107')
  const [walkInIn, setWalkInIn] = useState('')
  const [walkInOut, setWalkInOut] = useState('')

  // Portería Extra Nights / Extra Charge Modal
  const [extendModalBooking, setExtendModalBooking] = useState<Booking | null>(null)
  const [extraNightsInput, setExtraNightsInput] = useState(1)
  const [extraAmountInput, setExtraAmountInput] = useState(0)
  const [extraPaymentMethod, setExtraPaymentMethod] = useState<PaymentMethod>('efectivo_recepcion')
  const [extraNotesInput, setExtraNotesInput] = useState('')
  const [extendingSaving, setExtendingSaving] = useState(false)

  // Cryptographic QR Scanner & Live Camera State
  const [qrScanInput, setQrScanInput] = useState('')
  const [qrScanResult, setQrScanResult] = useState<any>(null)
  const [qrScanLoading, setQrScanLoading] = useState(false)
  const [qrScanPlateInput, setQrScanPlateInput] = useState('')
  const [qrScanNotesInput, setQrScanNotesInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<any>(null)

  // Cost Center Room Editing & Room Expense Input
  const [editingRoomNames, setEditingRoomNames] = useState<Record<string, string>>({})
  const [editingRoomRates, setEditingRoomRates] = useState<Record<string, number>>({})
  const [editingRoomCats, setEditingRoomCats] = useState<Record<string, RoomCategorySlug>>({})
  const [ccTxRoom, setCcTxRoom] = useState('101')
  const [ccTxType, setCcTxType] = useState<'gasto' | 'ingreso'>('gasto')
  const [ccTxCategory, setCcTxCategory] = useState('insumos_aseo')
  const [ccTxDesc, setCcTxDesc] = useState('')
  const [ccTxAmount, setCcTxAmount] = useState('')

  // Dual-Email Airbnb Accounts & Email Outbox Preview Modal
  const [accDrafts, setAccDrafts] = useState<Record<string, Partial<AirbnbEmailAccountConfig>>>({})
  const [savingAccId, setSavingAccId] = useState<string | null>(null)
  const [simAccountId, setSimAccountId] = useState<'account_1' | 'account_2'>('account_1')
  const [emailFrom, setEmailFrom] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].from)
  const [emailSubject, setEmailSubject] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].subject)
  const [emailBody, setEmailBody] = useState(SAMPLE_AIRBNB_EMAIL_TEMPLATES[0].body)
  const [syncingEmail, setSyncingEmail] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState('')
  const [copiedScript, setCopiedScript] = useState(false)
  const [imapRunning, setImapRunning] = useState(false)
  const [previewEmailLog, setPreviewEmailLog] = useState<EmailOutboxLog | null>(null)
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null)

  // Personal Email Live SMTP Tester (HTML + CID QR + Logo)
  const [testSenderEmail, setTestSenderEmail] = useState('')
  const [testSenderAppPass, setTestSenderAppPass] = useState('')
  const [testRecipientEmail, setTestRecipientEmail] = useState('')
  const [testBookingId, setTestBookingId] = useState('ARH-2026-1043')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [testEmailFeedback, setTestEmailFeedback] = useState('')

  // Housekeeping Ticket Form
  const [ticketBookingId, setTicketBookingId] = useState('ARH-2026-1042')
  const [ticketType, setTicketType] = useState<'alistamiento_previo' | 'recepcion_checkin' | 'revision_checkout'>('alistamiento_previo')
  const [checklist, setChecklist] = useState<InspectionItem[]>(DEFAULT_HOTEL_CHECKLIST)
  const [ticketNotes, setTicketNotes] = useState('')

  // Caja Form
  const [txType, setTxType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [txCategory, setTxCategory] = useState('pago_recepcion')
  const [txRoomNumber, setTxRoomNumber] = useState('101')
  const [txDesc, setTxDesc] = useState('')
  const [txAmount, setTxAmount] = useState('')

  // Parking Form
  const [pkName, setPkName] = useState('')
  const [pkPlate, setPkPlate] = useState('')
  const [pkRoom, setPkRoom] = useState('107')

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
        '¡Hola! Soy el Copiloto IA de All Rent Hoteles Quintero. Estoy conectado en tiempo real a los 10 Centros de Coste (Hab. 101 a 110), al motor criptográfico de QR de Check-in/Check-out, a las 2 cuentas de correo Airbnb y al Libro de Caja. ¿Qué necesitas consultar?',
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

    // Support direct smartphone scan URL: /admin?scan=ARHQR...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const scanParam = params.get('scan') || params.get('qr')
      if (scanParam) {
        setActiveTab('checkin')
        setQrScanInput(scanParam)
      }
    }

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
    return () => {
      clearInterval(timer)
      stopCameraScanner()
    }
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

  // Auto-inspect initial QR when bookings load
  useEffect(() => {
    if (authenticated && bookings.length > 0 && !qrScanResult) {
      const initialToken = qrScanInput || bookings[0]?.qrToken || bookings[0]?.id
      if (initialToken) {
        setQrScanInput(initialToken)
        handleExecuteQrScan(initialToken, 'inspect')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, bookings.length])

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
        if (roomsRes.data.costCenters) setCostCenters(roomsRes.data.costCenters)
        if (roomsRes.data.costCenterTotals) setCostCenterTotals(roomsRes.data.costCenterTotals)

        const nameMap: Record<string, string> = {}
        const rateMap: Record<string, number> = {}
        const catMap: Record<string, RoomCategorySlug> = {}
        for (const cc of (roomsRes.data.costCenters || []) as RoomCostCenterSummary[]) {
          nameMap[cc.unit.number] = cc.unit.customName || `Hab. ${cc.unit.number}`
          rateMap[cc.unit.number] = cc.effectiveRatePerNight
          catMap[cc.unit.number] = cc.unit.categorySlug
        }
        setEditingRoomNames(nameMap)
        setEditingRoomRates(rateMap)
        setEditingRoomCats(catMap)
      }
      if (bookRes.success) setBookings(bookRes.data)
      if (airRes.success) {
        setAirbnbConfig(airRes.data.config)
        setAirbnbLogs(airRes.data.logs)
        if (airRes.data.emailOutbox) setEmailOutbox(airRes.data.emailOutbox)
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

  // CRYPTOGRAPHIC QR SCANNER ENGINE (INSPECT, 1ST SCAN ENTRY, 2ND SCAN EXIT & BURN)
  async function handleExecuteQrScan(
    targetInput?: string,
    action: 'inspect' | 'checkin_entry' | 'checkout_exit' = 'inspect'
  ) {
    const raw = (targetInput ?? qrScanInput).trim()
    if (!raw) return
    setQrScanLoading(true)
    try {
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrInput: raw,
          action,
          operatorName: 'Admin Portería All Rent',
          vehiclePlate: qrScanPlateInput,
          notes: qrScanNotesInput,
        }),
      })
      const json = await res.json()
      if (json.data) {
        setQrScanResult(json.data)
        if (json.data.booking) {
          setQrScanPlateInput(json.data.booking.vehiclePlates?.[0] || '')
        }
      }
      if (action !== 'inspect') {
        await refreshAll()
      }
    } finally {
      setQrScanLoading(false)
    }
  }

  // LIVE SMARTPHONE / WEBCAM CAMERA QR SCANNER
  async function startCameraScanner() {
    setCameraError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Tu navegador no soporta acceso directo a cámara. Puedes subir una captura o pegar el QR.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      cameraStreamRef.current = stream
      setCameraActive(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 150)

      // Use native BarcodeDetector if available (Chrome Android / Desktop / Edge / Safari)
      const WinBarcodeDetector = (window as any).BarcodeDetector
      if (WinBarcodeDetector) {
        const detector = new WinBarcodeDetector({ formats: ['qr_code'] })
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes && codes.length > 0 && codes[0].rawValue) {
              const detectedValue = String(codes[0].rawValue).trim()
              setQrScanInput(detectedValue)
              stopCameraScanner()
              handleExecuteQrScan(detectedValue, 'inspect')
            }
          } catch {
            // continue scanning frames
          }
        }, 450)
      }
    } catch {
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador o selecciona un QR de la lista.')
      setCameraActive(false)
    }
  }

  function stopCameraScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    setCameraActive(false)
  }

  // COST CENTER ROOM UPDATES (10 ROOMS HAB. 101 - 110)
  async function handleSaveRoomCostCenterConfig(unit: RoomUnit) {
    const customName = editingRoomNames[unit.number] || unit.customName
    const customRatePerNight = Number(editingRoomRates[unit.number]) || undefined
    const categorySlug = editingRoomCats[unit.number] || unit.categorySlug

    await fetch('/api/v1/admin/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'unit',
        unitId: unit.id,
        updates: {
          customName,
          customRatePerNight,
          categorySlug,
        },
      }),
    })
    refreshAll()
  }

  async function handleUnitStatusChange(unitId: string, status: RoomUnitStatus) {
    await fetch('/api/v1/admin/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unit', unitId, updates: { status } }),
    })
    refreshAll()
  }

  async function handleAddCostCenterTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!ccTxDesc || !ccTxAmount) return
    await fetch('/api/v1/admin/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'room_transaction',
        roomNumber: ccTxRoom,
        txType: ccTxType,
        category: ccTxCategory,
        description: ccTxDesc,
        amount: Number(ccTxAmount),
      }),
    })
    setCcTxDesc('')
    setCcTxAmount('')
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
        assignedRoomNumber: walkInRoomNumber || undefined,
        checkInDate: walkInIn,
        checkOutDate: walkInOut,
        guestsCount: 2,
        clientName: walkInName,
        clientRut: walkInRut,
        clientPhone: walkInPhone,
        clientEmail: walkInEmail || 'huesped@allrenthoteles.cl',
        vehiclesCount: walkInPlate ? 1 : 0,
        vehiclePlates: walkInPlate ? [walkInPlate.toUpperCase()] : [],
        requiresParking: Boolean(walkInPlate),
        markAsPaidFull: true,
        source: 'recepcion_directa',
      }),
    })
    const json = await res.json()
    if (res.ok && json.data) {
      setNewBookingOpen(false)
      setWalkInName('')
      setWalkInRut('')
      setWalkInPhone('')
      setWalkInEmail('')
      setWalkInPlate('')
      await refreshAll()
      if (json.data.qrToken) {
        setQrScanInput(json.data.qrToken)
        handleExecuteQrScan(json.data.qrToken, 'inspect')
      }
    }
  }

  // PORTERÍA EXTRA DAYS / EXTRA CHARGE HANDLER
  function openExtendStayModal(b: Booking) {
    setExtendModalBooking(b)
    setExtraNightsInput(1)
    setExtraAmountInput(b.ratePerNight)
    setExtraPaymentMethod('efectivo_recepcion')
    setExtraNotesInput('Extensión de estadía solicitada en Portería')
  }

  async function handleExtendStaySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!extendModalBooking) return
    setExtendingSaving(true)
    try {
      const res = await fetch(`/api/v1/bookings/${extendModalBooking.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extraNights: extraNightsInput,
          extraAmount: extraAmountInput,
          paymentMethod: extraPaymentMethod,
          notes: extraNotesInput,
          operatorName: 'Portería All Rent Hoteles',
        }),
      })
      if (res.ok) {
        setExtendModalBooking(null)
        await refreshAll()
      }
    } finally {
      setExtendingSaving(false)
    }
  }

  // DUAL AIRBNB EMAIL ACCOUNT CONFIGURATION & SYNC
  async function handleSaveAirbnbAccount(account: AirbnbEmailAccountConfig) {
    setSavingAccId(account.id)
    const draft = accDrafts[account.id] || {}
    try {
      await fetch('/api/v1/integrations/airbnb/imap-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          updates: {
            holderName: draft.holderName ?? account.holderName,
            email: draft.email ?? account.email,
            appPassword: draft.appPassword ?? account.appPassword,
            imapHost: draft.imapHost ?? account.imapHost,
            smtpHost: draft.smtpHost ?? account.smtpHost,
            enabled: draft.enabled ?? account.enabled,
          },
        }),
      })
      setSyncFeedback(`✅ ${account.label} guardada con su Contraseña de Aplicación.`)
      await refreshAll()
    } finally {
      setSavingAccId(null)
    }
  }

  async function handleProcessAirbnbEmail(e: React.FormEvent) {
    e.preventDefault()
    setSyncingEmail(true)
    setSyncFeedback('')
    try {
      const selectedAcc = airbnbConfig?.accounts?.find((a) => a.id === simAccountId)
      const res = await fetch('/api/v1/integrations/airbnb/inbound-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'admin_internal',
          accountId: simAccountId,
          accountLabel: selectedAcc?.label || 'Cuenta Airbnb #1',
          from: emailFrom,
          subject: emailSubject,
          textBody: emailBody,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const statusMsg =
          data.log.status === 'synced'
            ? `✅ ¡Reserva Airbnb agendada en BD (${data.booking?.id} · Hab. ${data.booking?.assignedRoomNumber}) y Correo con QR Único (${data.booking?.qrToken}) enviado automáticamente a ${data.booking?.clientEmail}!`
            : data.log.status === 'cancelled_updated'
            ? `Cancelación procesada: Reserva ${data.log.airbnbCode} liberada y QR anulado.`
            : `Comprobante ${data.log.airbnbCode} ya estaba registrado (Idempotencia activa).`
        setSyncFeedback(statusMsg)
        await refreshAll()
        if (data.emailLog) {
          setPreviewEmailLog(data.emailLog)
        }
      } else {
        setSyncFeedback(data.error || 'Error procesando correo.')
      }
    } finally {
      setSyncingEmail(false)
    }
  }

  async function handleImapSync(accountId?: 'account_1' | 'account_2') {
    setImapRunning(true)
    setSyncFeedback('')
    try {
      const draft = accountId ? accDrafts[accountId] : undefined
      const res = await fetch('/api/v1/integrations/airbnb/imap-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          ...(draft?.email ? { email: draft.email } : {}),
          ...(draft?.appPassword ? { appPassword: draft.appPassword } : {}),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSyncFeedback(
          `✅ Buzones IMAP revisados: ${data.processedCount} correos analizados, ${data.createdBookings.length} nuevas reservas sincronizadas con envío automático de QR.`
        )
        refreshAll()
      } else {
        setSyncFeedback(data.error || 'No fue posible conectar por IMAP.')
      }
    } finally {
      setImapRunning(false)
    }
  }

  async function handleResendQrEmail(bookingId: string) {
    setResendingEmailId(bookingId)
    try {
      const res = await fetch('/api/v1/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        await refreshAll()
        setPreviewEmailLog(data.data)
      }
    } finally {
      setResendingEmailId(null)
    }
  }

  async function handleSendPersonalTestEmail(e: React.FormEvent) {
    e.preventDefault()
    setSendingTestEmail(true)
    setTestEmailFeedback('')
    try {
      const targetRecipient = (testRecipientEmail || testSenderEmail).trim()
      const res = await fetch('/api/v1/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: testBookingId || bookings[0]?.id || 'ARH-2026-1043',
          recipientEmail: targetRecipient || undefined,
          senderEmail: testSenderEmail.trim() || undefined,
          senderAppPassword: testSenderAppPass.trim() || undefined,
          saveCredentialsToAccount1: Boolean(testSenderEmail && testSenderAppPass),
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        await refreshAll()
        setPreviewEmailLog(data.data)
        if (data.smtpSent) {
          setTestEmailFeedback(
            `✅ ¡CORREO REAL ENVIADO POR SMTP! Revisa la bandeja de entrada de ${data.data.toEmail}. El correo incluye el Logo de All Rent Hoteles y el Código QR Único (${data.data.qrToken}) embebidos por CID.`
          )
        } else if (data.deliveryStatus === 'smtp_error') {
          setTestEmailFeedback(
            `⚠️ Error SMTP al conectar con el correo (${data.errorDetail || 'Verifica la Contraseña de Aplicación de 16 letras'}). Se abrió la vista previa exacta del HTML + QR generado.`
          )
        } else {
          setTestEmailFeedback(
            `ℹ️ Vista previa del HTML + QR generada (${data.data.qrToken}). Para que llegue a tu bandeja de entrada real, ingresa tu correo personal y su Contraseña de Aplicación de 16 caracteres.`
          )
        }
      }
    } finally {
      setSendingTestEmail(false)
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
        roomNumber: txRoomNumber || undefined,
        description: `${txDesc}${txRoomNumber ? ` (Hab. ${txRoomNumber})` : ''}`,
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

  // 14-DAY COMPACT PMS MATRIX CALENDAR DAYS
  const calendarDays = useMemo(() => {
    const list: Array<{ dateStr: string; dayNum: string; weekdayShort: string; isToday: boolean }> = []
    const base = new Date(calendarStartStr + 'T12:00:00')
    const todayStr = new Date().toISOString().split('T')[0]
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 0; i < 14; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      list.push({
        dateStr,
        dayNum: String(d.getDate()).padStart(2, '0'),
        weekdayShort: weekdays[d.getDay()],
        isToday: dateStr === todayStr,
      })
    }
    return list
  }, [calendarStartStr])

  function shiftCalendarDays(offset: number) {
    const base = new Date(calendarStartStr + 'T12:00:00')
    base.setDate(base.getDate() + offset)
    setCalendarStartStr(base.toISOString().split('T')[0])
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSource = sourceFilter === 'all' || b.source === sourceFilter
      const q = bookingSearch.toLowerCase().trim()
      const matchText =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.qrToken && b.qrToken.toLowerCase().includes(q)) ||
        (b.externalCode && b.externalCode.toLowerCase().includes(q)) ||
        (b.assignedRoomNumber && b.assignedRoomNumber.includes(q))
      return matchSource && matchText
    })
  }, [bookings, sourceFilter, bookingSearch])

  const webhookEndpointUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/integrations/airbnb/inbound-email`
      : 'https://allrenthoteles.cl/api/v1/integrations/airbnb/inbound-email'

  // LOGIN GATE
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full lux-card-featured rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="relative h-24 w-64 mx-auto">
            <Image
              src="/brand/logo-neon.png"
              alt="All Rent Hoteles"
              fill
              sizes="256px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">PMS &amp; Motor QR Hotelero SaaS</h1>
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
            Acceso rápido habilitado: PIN <strong className="text-[#B0E454]">2026</strong> o{' '}
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
    { id: 'dashboard', label: 'Dashboard & Matriz', icon: LayoutDashboard },
    { id: 'checkin', label: 'Escáner QR Check-in/Out', icon: QrCode },
    { id: 'reservas', label: 'Calendario & Reservas', icon: CalendarDays, badge: bookings.length },
    { id: 'rack', label: '10 Hab. Centros de Coste', icon: Building2, badge: 10 },
    { id: 'airbnb', label: 'Airbnb 2 Correos & QR', icon: MailCheck, badge: emailOutbox.length },
    { id: 'caja', label: 'Caja & Finanzas', icon: Wallet },
    {
      id: 'solicitudes',
      label: 'Solicitudes Web',
      icon: MessageSquareMore,
      badge: solicitudes.filter((s) => s.estado === 'nueva').length || undefined,
    },
    { id: 'clientes', label: 'Huéspedes CRM', icon: Users },
    { id: 'parking', label: 'Estacionamiento CCTV', icon: Car },
    { id: 'bloqueos', label: 'Bloqueos & Mantención', icon: Ban },
    { id: 'copiloto', label: 'Copiloto IA', icon: Bot },
  ]

  // Helper component: Compact 10-Room × 14-Day PMS Matrix Calendar
  const CompactPmsCalendarMatrix = () => (
    <div className="lux-card rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B0E454]">
              Matriz Compacta PMS · 10 Habitaciones × 14 Días
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#B0E454]/15 text-[#B0E454] text-[10px] font-bold">
              Check-in 12:00 / Out 12:00
            </span>
          </div>
          <p className="text-xs text-white/60">
            Haz clic en cualquier celda libre para agendar una reserva manual en esa habitación, o en una reserva para ver su QR o extender días en Portería.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftCalendarDays(-7)}
            className="p-1.5 rounded-lg bg-[#000000] border border-white/15 text-white/80 hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
            title="7 días antes"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() - 1)
              setCalendarStartStr(d.toISOString().split('T')[0])
            }}
            className="px-2.5 py-1 rounded-lg bg-[#000000] border border-white/15 text-[11px] font-bold text-[#B0E454] hover:border-[#B0E454] cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shiftCalendarDays(7)}
            className="p-1.5 rounded-lg bg-[#000000] border border-white/15 text-white/80 hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
            title="7 días después"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact Horizontal Matrix Table */}
      <div className="overflow-x-auto border border-white/12 rounded-xl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#090B08] border-b border-white/12">
              <th className="p-2 text-left font-black text-white/80 w-44 sticky left-0 bg-[#090B08] z-10 border-r border-white/12">
                Centro de Coste (10 Hab.)
              </th>
              {calendarDays.map((d) => (
                <th
                  key={d.dateStr}
                  className={`p-1.5 text-center min-w-[54px] border-r border-white/10 ${
                    d.isToday ? 'bg-[#B0E454]/20 text-[#B0E454]' : 'text-white/70'
                  }`}
                >
                  <div className="text-[9px] uppercase opacity-75">{d.weekdayShort}</div>
                  <div className="font-black text-xs">{d.dayNum}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const cat = categories.find((c) => c.slug === u.categorySlug)
              return (
                <tr key={u.id} className="border-b border-white/8 hover:bg-white/[0.02]">
                  <td className="p-2 sticky left-0 bg-[#000000] z-10 border-r border-white/12">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-white truncate max-w-[125px]" title={u.customName}>
                        {u.customName || `Hab. ${u.number}`}
                      </span>
                      <span className="text-[10px] font-mono text-[#B0E454]">
                        {formatCLP(u.customRatePerNight || cat?.pricePerNight || 53500)}
                      </span>
                    </div>
                  </td>

                  {calendarDays.map((d) => {
                    const matchBooking = bookings.find(
                      (b) =>
                        b.status !== 'cancelled' &&
                        b.assignedRoomNumber === u.number &&
                        b.checkInDate <= d.dateStr &&
                        b.checkOutDate > d.dateStr
                    )

                    const matchBlock = blocks.find(
                      (blk) =>
                        blk.date === d.dateStr &&
                        (blk.roomNumber === u.number ||
                          (!blk.roomNumber &&
                            (blk.roomCategory === 'all' || blk.roomCategory === u.categorySlug)))
                    )

                    if (matchBooking) {
                      const isAirbnb = matchBooking.source === 'airbnb_email'
                      const isCheckedIn = matchBooking.status === 'checked_in'
                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => {
                            setQrScanInput(matchBooking.qrToken || matchBooking.id)
                            handleExecuteQrScan(matchBooking.qrToken || matchBooking.id, 'inspect')
                            setActiveTab('checkin')
                          }}
                          title={`${matchBooking.clientName} (${matchBooking.id}${
                            matchBooking.externalCode ? ` · Airbnb ${matchBooking.externalCode}` : ''
                          }) · Click para abrir en Escáner QR`}
                          className={`p-1 text-center border-r border-white/10 cursor-pointer transition ${
                            isCheckedIn
                              ? 'bg-sky-500/25 hover:bg-sky-500/35 text-sky-200'
                              : isAirbnb
                              ? 'bg-rose-500/25 hover:bg-rose-500/35 text-rose-200'
                              : 'bg-[#B0E454]/25 hover:bg-[#B0E454]/35 text-[#B0E454]'
                          }`}
                        >
                          <div className="font-extrabold truncate max-w-[50px] mx-auto text-[10px]">
                            {matchBooking.clientName.split(' ')[0]}
                          </div>
                          <div className="text-[8px] font-mono opacity-80">
                            {isAirbnb ? 'Airbnb' : isCheckedIn ? 'En Hotel' : 'Web'}
                          </div>
                        </td>
                      )
                    }

                    if (matchBlock) {
                      return (
                        <td
                          key={d.dateStr}
                          title={`Bloqueado: ${matchBlock.reason}`}
                          className="p-1 text-center border-r border-white/10 bg-amber-500/20 text-amber-300 text-[9px] font-bold"
                        >
                          Bloq.
                        </td>
                      )
                    }

                    return (
                      <td
                        key={d.dateStr}
                        onClick={() => {
                          setWalkInRoom(u.categorySlug)
                          setWalkInRoomNumber(u.number)
                          setWalkInIn(d.dateStr)
                          const nextDay = new Date(d.dateStr + 'T12:00:00')
                          nextDay.setDate(nextDay.getDate() + 1)
                          setWalkInOut(nextDay.toISOString().split('T')[0])
                          setNewBookingOpen(true)
                          setActiveTab('reservas')
                        }}
                        title={`Hab. ${u.number} Libre el ${d.dateStr} · Click para crear reserva aquí`}
                        className="p-1 text-center border-r border-white/10 text-white/25 hover:bg-[#B0E454]/15 hover:text-[#B0E454] cursor-pointer transition"
                      >
                        +
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/65 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B0E454]/40 border border-[#B0E454]" /> Reserva Web / Directa
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-400" /> Reserva Airbnb Sync
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40 border border-sky-400" /> Check-in Activo en Hotel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-400" /> Mantención / Bloqueo
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewBookingOpen(true)
            setActiveTab('reservas')
          }}
          className="text-[#B0E454] font-bold hover:underline cursor-pointer"
        >
          + Crear Reserva Manual
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col lg:flex-row">
      {/* SIDEBAR */}
      <aside className="lg:w-72 bg-[#000000] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between shrink-0">
        <div className="p-4 lg:p-5 space-y-5">
          <div className="flex items-center justify-center pb-2 border-b border-white/10">
            <Link href="/" className="relative h-20 w-60 block">
              <Image
                src="/brand/logo-neon.png"
                alt="All Rent Hoteles"
                fill
                sizes="240px"
                className="object-contain object-center"
                priority
              />
            </Link>
          </div>

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
            <p className="font-extrabold text-white">All Rent Hoteles Quintero</p>
            <p className="text-white/55">10 Centros de Coste · Check-in 12:00</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Link href="/" className="text-white/65 hover:text-[#B0E454] inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Sitio Web
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
              All Rent Hoteles · Av. Bulnes 119, Quintero · 10 Habitaciones (Centros de Coste) · Check-in 12:00 a Check-out 12:00
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('checkin')}
              className="px-3.5 py-2 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase inline-flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> Escanear QR
            </button>
            {weather && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#000000] border border-white/10 text-xs">
                <Sun className="w-4 h-4 text-[#B0E454]" />
                <span>
                  Quintero <strong>{weather.tempC}°C</strong>
                </span>
              </div>
            )}
            <div className="px-3 py-2 rounded-xl bg-[#000000] border border-white/10 text-xs font-mono text-[#B0E454] font-bold">
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

        {/* 1. DASHBOARD KPIs & COMPACT PMS MATRIX */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl lux-card-featured">
                <span className="text-xs font-bold uppercase text-white/60">Balance Disponible Caja</span>
                <p className="text-3xl font-black text-[#B0E454] mt-1">
                  {formatCLP(metrics.cash.availableBalance)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Web: {formatCLP(metrics.cash.webpayIncome)} · Airbnb: {formatCLP(metrics.cash.airbnbIncome)}
                </p>
              </div>

              <div className="p-5 rounded-2xl lux-card">
                <span className="text-xs font-bold uppercase text-white/60">Ocupación 10 Habitaciones</span>
                <p className="text-3xl font-black text-white mt-1">{metrics.occupancyRate}%</p>
                <p className="text-xs text-[#B0E454] mt-1">
                  {metrics.availableUnits} libres · {metrics.occupiedUnits} ocupadas · {metrics.cleaningUnits} aseo
                </p>
              </div>

              <div className="p-5 rounded-2xl lux-card">
                <span className="text-xs font-bold uppercase text-white/60">Motor QR Criptográfico</span>
                <p className="text-3xl font-black text-[#B0E454] mt-1">
                  {(metrics.qrStats?.issuedReady || 0) + (metrics.qrStats?.checkedInActive || 0)} Activos
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {metrics.qrStats?.issuedReady || 0} listos entrada · {metrics.qrStats?.checkedInActive || 0} en hotel · {metrics.qrStats?.redeemedClosed || 0} cerrados
                </p>
              </div>

              <div className="p-5 rounded-2xl lux-card">
                <span className="text-xs font-bold uppercase text-white/60">Airbnb Dual Sync &amp; Correos QR</span>
                <p className="text-3xl font-black text-white mt-1">
                  {metrics.emailsSentTotal || emailOutbox.length} Enviados
                </p>
                <p className="text-xs text-[#B0E454] mt-1">
                  {metrics.airbnbSyncedTotal} reservas Airbnb sincronizadas
                </p>
              </div>
            </div>

            {/* Compact 10-Room x 14-Day Calendar directly on Dashboard */}
            <CompactPmsCalendarMatrix />

            {/* Recent Bookings + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 p-6 rounded-3xl lux-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-white">
                    Reservas Activas con Pase QR Único
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reservas')}
                    className="text-xs font-bold text-[#B0E454] cursor-pointer"
                  >
                    Ver todas ({bookings.length}) →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bookings.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#000000] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm text-white">{b.clientName}</strong>
                          <span className="text-[11px] font-mono text-[#B0E454]">{b.id}</span>
                          {b.externalCode && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Airbnb {b.externalCode}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold">
                            Hab. {b.assignedRoomNumber || '-'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              b.qrStatus === 'issued'
                                ? 'bg-[#B0E454]/20 text-[#B0E454]'
                                : b.qrStatus === 'checked_in_active'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-zinc-800 text-white/50'
                            }`}
                          >
                            {b.qrStatus === 'issued'
                              ? 'QR 0/2 (Listo Entrada)'
                              : b.qrStatus === 'checked_in_active'
                              ? 'QR 1/2 (En Hotel · Listo Salida)'
                              : 'QR 2/2 (Cerrado)'}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mt-0.5">
                          {b.roomCategoryName} · {b.checkInDate} → {b.checkOutDate} · Patente:{' '}
                          <strong>{b.vehiclePlates?.[0] || 'Por registrar'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right mr-1">
                          <strong className="text-sm font-black text-[#B0E454]">
                            {formatCLP(b.totalAmount)}
                          </strong>
                          <span className="block text-[10px] text-white/60">100% Pagado</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setQrScanInput(b.qrToken || b.id)
                            handleExecuteQrScan(b.qrToken || b.id, 'inspect')
                            setActiveTab('checkin')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#B0E454] text-[#000000] text-[11px] font-black uppercase cursor-pointer"
                        >
                          Escanear QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 p-6 rounded-3xl lux-card space-y-4">
                <h2 className="text-base font-extrabold text-white">Accesos Rápidos de Operación</h2>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('checkin')}
                    className="p-3.5 rounded-2xl bg-[#000000] border border-[#B0E454]/40 hover:border-[#B0E454] text-left flex items-center gap-3 cursor-pointer"
                  >
                    <QrCode className="w-6 h-6 text-[#B0E454] shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        Escáner QR Check-in / Check-out
                      </span>
                      <span className="text-[11px] text-white/60">
                        Cámara en vivo + Validación criptográfica de ciclo único
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('rack')}
                    className="p-3.5 rounded-2xl bg-[#000000] border border-white/15 hover:border-[#B0E454] text-left flex items-center gap-3 cursor-pointer"
                  >
                    <Building2 className="w-6 h-6 text-[#B0E454] shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        10 Habitaciones (Centros de Coste)
                      </span>
                      <span className="text-[11px] text-white/60">
                        Renombrar piezas, tarifas, ingresos y gastos por habitación
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('airbnb')}
                    className="p-3.5 rounded-2xl bg-[#000000] border border-white/15 hover:border-[#B0E454] text-left flex items-center gap-3 cursor-pointer"
                  >
                    <MailCheck className="w-6 h-6 text-[#B0E454] shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        Airbnb 2 Correos + Envío Automático QR
                      </span>
                      <span className="text-[11px] text-white/60">
                        Contraseñas de aplicación + Bandeja de correos con QR enviados
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ESCÁNER QR CRIPTOGRÁFICO EN VIVO (CHECK-IN ENTRADA -> CHECK-OUT SALIDA -> QUEMADO) */}
        {activeTab === 'checkin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Camera & Token Scanner Input */}
              <div className="lg:col-span-5 lux-card-featured rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B0E454]">
                      MOTOR CRIPTOGRÁFICO HMAC-SHA256
                    </span>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#B0E454]" /> Lector &amp; Cámara QR en Vivo
                    </h2>
                  </div>

                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="px-3.5 py-2 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Activar Cámara
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraScanner}
                      className="px-3.5 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CameraOff className="w-4 h-4" /> Detener Cámara
                    </button>
                  )}
                </div>

                {/* Live Camera Viewport when active */}
                {cameraActive && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#B0E454] bg-black aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-6 border-2 border-dashed border-[#B0E454]/80 rounded-2xl pointer-events-none flex items-end justify-center p-2">
                      <span className="px-2.5 py-1 rounded-full bg-black/80 text-[#B0E454] text-[10px] font-bold">
                        Apunta la cámara al código QR del teléfono del cliente...
                      </span>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <p className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded-xl p-3">
                    {cameraError}
                  </p>
                )}

                {/* Input Box for Barcode Reader / Smartphone Paste / Token */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleExecuteQrScan(qrScanInput, 'inspect')
                  }}
                  className="space-y-2.5"
                >
                  <label className="block text-xs font-bold uppercase text-white/70">
                    Token QR Escaneado (`ARHQR...`) o Código de Reserva
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrScanInput}
                      onChange={(e) => setQrScanInput(e.target.value)}
                      placeholder="ARHQR.ARH-2026-1043... o HM8P3K9W2L"
                      className="flex-1 bg-[#000000] border border-white/20 rounded-xl px-3.5 py-3 text-xs font-mono font-bold text-[#B0E454] focus:border-[#B0E454] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={qrScanLoading}
                      className="px-4 py-3 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                    >
                      {qrScanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
                    </button>
                  </div>
                </form>

                {/* Quick 1-Click Test QRs from Database */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase text-white/60 block">
                    Selecciona un QR real emitido para probar su ciclo (Entrada → Salida → Cierre):
                  </span>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {bookings.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const token = b.qrToken || b.id
                          setQrScanInput(token)
                          handleExecuteQrScan(token, 'inspect')
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                          qrScanResult?.booking?.id === b.id
                            ? 'bg-[#B0E454]/15 border-[#B0E454]'
                            : 'bg-[#000000] border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs text-white truncate">{b.clientName}</strong>
                            <span className="text-[10px] font-mono text-[#B0E454]">
                              Hab. {b.assignedRoomNumber || '-'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-white/50 truncate">
                            {b.qrToken || b.id}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            b.qrStatus === 'issued'
                              ? 'bg-[#B0E454] text-[#000000]'
                              : b.qrStatus === 'checked_in_active'
                              ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                              : 'bg-red-950/80 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {b.qrStatus === 'issued'
                            ? '0/2 Entrada'
                            : b.qrStatus === 'checked_in_active'
                            ? '1/2 Salida'
                            : '2/2 Cerrado'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Verified Guest Data, Matrícula, & Single-Cycle Action Buttons */}
              <div className="lg:col-span-7 lux-card rounded-3xl p-6 sm:p-8 space-y-6">
                {qrScanResult && qrScanResult.booking ? (
                  <>
                    {/* Status Alert Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        qrScanResult.qrStatus === 'redeemed_closed' || !qrScanResult.valid
                          ? 'bg-red-950/60 border-red-500/50 text-red-200'
                          : qrScanResult.qrStatus === 'checked_in_active'
                          ? 'bg-sky-950/50 border-sky-400/50 text-sky-100'
                          : 'bg-[#B0E454]/15 border-[#B0E454] text-white'
                      }`}
                    >
                      {qrScanResult.qrStatus === 'redeemed_closed' || !qrScanResult.valid ? (
                        <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-[#B0E454] shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-wider">
                          {qrScanResult.signatureValid
                            ? 'FIRMA CRIPTOGRÁFICA HMAC-SHA256 AUTÉNTICA · GENERADO POR MOTOR ALL RENT'
                            : 'VERIFICACIÓN DE BASE DE DATOS'}
                        </div>
                        <p className="text-sm font-bold">{qrScanResult.message}</p>
                      </div>
                    </div>

                    {/* Guest & Booking Complete Dossier */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      <div className="md:col-span-8 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#B0E454] text-[#000000] text-xs font-black uppercase">
                            Habitación {qrScanResult.booking.assignedRoomNumber || 'Asignada'} (Centro de Coste)
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                            {qrScanResult.booking.roomCategoryName}
                          </span>
                          {qrScanResult.booking.externalCode && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
                              Airbnb: {qrScanResult.booking.externalCode}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-black text-white">
                          {qrScanResult.booking.clientName}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">RUT / Pasaporte</span>
                            <strong className="text-white text-sm">
                              {qrScanResult.booking.clientRut || qrScanResult.booking.externalCode || 'Registrado'}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">Matrícula / Patente Vehículo</span>
                            <strong className="text-[#B0E454] text-sm font-mono">
                              {qrScanResult.booking.vehiclePlates?.join(', ') || 'Sin patente registrada'}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">Teléfono / WhatsApp</span>
                            <strong className="text-white text-sm">
                              {qrScanResult.booking.clientPhone}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">Correo Electrónico</span>
                            <strong className="text-white text-sm truncate block">
                              {qrScanResult.booking.clientEmail}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">Estadía (12:00 a 12:00 hrs)</span>
                            <strong className="text-white text-sm">
                              {qrScanResult.booking.checkInDate} → {qrScanResult.booking.checkOutDate} ({qrScanResult.booking.nightsCount}n)
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#000000] border border-white/10">
                            <span className="text-white/50 block">Monto &amp; Estado de Pago</span>
                            <strong className="text-[#B0E454] text-sm">
                              {formatCLP(qrScanResult.booking.amountPaid)} / {formatCLP(qrScanResult.booking.totalAmount)} (100% Pagado)
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual QR & Lifecycle Meter */}
                      <div className="md:col-span-4 bg-[#080A07] border border-white/15 rounded-2xl p-4 flex flex-col items-center text-center">
                        {qrScanResult.qrDataUrl && (
                          <div
                            className={`bg-white p-2.5 rounded-xl border-2 border-[#B0E454] ${
                              qrScanResult.qrStatus === 'redeemed_closed' ? 'opacity-30 grayscale' : ''
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrScanResult.qrDataUrl}
                              alt="QR Verificado"
                              className="w-32 h-32 object-contain"
                            />
                          </div>
                        )}
                        <span className="mt-2 text-[10px] font-mono text-[#B0E454] break-all">
                          {qrScanResult.booking.qrToken}
                        </span>
                        <div className="mt-2 w-full grid grid-cols-2 gap-1 text-[10px] font-black uppercase">
                          <div
                            className={`p-1.5 rounded ${
                              qrScanResult.qrStatus === 'checked_in_active' ||
                              qrScanResult.qrStatus === 'redeemed_closed'
                                ? 'bg-[#B0E454] text-[#000000]'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            1. Entrada {qrScanResult.qrStatus !== 'issued' ? '✓' : 'Pend.'}
                          </div>
                          <div
                            className={`p-1.5 rounded ${
                              qrScanResult.qrStatus === 'redeemed_closed'
                                ? 'bg-[#B0E454] text-[#000000]'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            2. Salida {qrScanResult.qrStatus === 'redeemed_closed' ? '✓' : 'Pend.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optional Vehicle Plate & Portería Notes before executing Check-in or Check-out */}
                    {qrScanResult.qrStatus !== 'redeemed_closed' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#000000] border border-white/12">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-white/65 mb-1">
                            Matrícula / Patente Vehículo (Estacionamiento CCTV)
                          </label>
                          <input
                            type="text"
                            value={qrScanPlateInput}
                            onChange={(e) => setQrScanPlateInput(e.target.value.toUpperCase())}
                            placeholder="Ej: PBYR-94"
                            className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold uppercase text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-white/65 mb-1">
                            Observación de Portería / Tickets
                          </label>
                          <input
                            type="text"
                            value={qrScanNotesInput}
                            onChange={(e) => setQrScanNotesInput(e.target.value)}
                            placeholder="Ej: Entrega de llaves Hab. conforme..."
                            className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* STRICT 2-STEP ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {qrScanResult.qrStatus === 'issued' && (
                        <button
                          type="button"
                          disabled={qrScanLoading}
                          onClick={() =>
                            handleExecuteQrScan(
                              qrScanResult.booking.qrToken || qrScanResult.booking.id,
                              'checkin_entry'
                            )
                          }
                          className="flex-1 py-4 px-6 rounded-2xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] shadow-[0_0_30px_rgba(176,228,84,0.35)] cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          1° Uso QR: Confirmar Check-in de Entrada (Hab. {qrScanResult.booking.assignedRoomNumber})
                        </button>
                      )}

                      {qrScanResult.qrStatus === 'checked_in_active' && (
                        <>
                          <button
                            type="button"
                            disabled={qrScanLoading}
                            onClick={() =>
                              handleExecuteQrScan(
                                qrScanResult.booking.qrToken || qrScanResult.booking.id,
                                'checkout_exit'
                              )
                            }
                            className="flex-1 py-4 px-6 rounded-2xl bg-[#B0E454] text-[#000000] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] shadow-[0_0_30px_rgba(176,228,84,0.35)] cursor-pointer"
                          >
                            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                            2° Uso QR: Confirmar Check-out de Salida y Cerrar QR Definitivamente
                          </button>

                          <button
                            type="button"
                            onClick={() => openExtendStayModal(qrScanResult.booking)}
                            className="py-4 px-4 rounded-2xl bg-[#000000] border border-[#B0E454]/50 text-[#B0E454] font-black text-xs uppercase hover:bg-[#B0E454]/10 cursor-pointer"
                          >
                            + Días / Cobro Extra Portería
                          </button>
                        </>
                      )}

                      {qrScanResult.qrStatus === 'redeemed_closed' && (
                        <div className="w-full p-4 rounded-2xl bg-zinc-950 border border-red-500/40 text-center space-y-2">
                          <p className="text-xs font-black uppercase text-red-400">
                            🔒 CÓDIGO QR CERRADO E INHABILITADO PERMANENTEMENTE (2/2 USOS COMPLETADOS)
                          </p>
                          <p className="text-xs text-white/65">
                            Entrada registrada: <strong>{qrScanResult.booking.qrCheckInAt?.slice(0, 16).replace('T', ' ') || 'Verificada'}</strong> · Salida registrada: <strong>{qrScanResult.booking.qrCheckOutAt?.slice(0, 16).replace('T', ' ') || 'Verificada'}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Scan Audit History */}
                    {qrScanResult.booking.qrScanLogs && qrScanResult.booking.qrScanLogs.length > 0 && (
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-white/60 block">
                          Bitácora de Auditoría de este Código QR Único:
                        </span>
                        {qrScanResult.booking.qrScanLogs.map((log: any) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-[#000000] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <span>
                              <strong className="text-[#B0E454] uppercase">{log.action}</strong> · {log.notes}
                            </span>
                            <span className="text-white/45 font-mono text-[11px]">
                              {String(log.timestamp).slice(0, 19).replace('T', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center space-y-2 text-white/60">
                    <QrCode className="w-12 h-12 text-[#B0E454] mx-auto opacity-70" />
                    <p className="text-sm font-bold text-white">
                      Escanea un código QR con la cámara o selecciona una reserva a la izquierda
                    </p>
                    <p className="text-xs">
                      Verás al instante matrícula, RUT, teléfono, correo, habitación asignada y podrás ejecutar el Check-in de Entrada o Check-out de Salida.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Housekeeping Inspection Checklist */}
            <form
              onSubmit={handleSaveInspection}
              className="lux-card rounded-3xl p-6 space-y-4"
            >
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#B0E454]" /> Ticket Manual de Alistamiento / Revisión de Habitación (12:00 hrs)
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
                  <option value="recepcion_checkin">Entrega Recepción Check-in</option>
                  <option value="revision_checkout">Revisión Salida Check-out 12:00</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#000000] border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <span>{item.label}</span>
                    <div className="flex gap-1.5 shrink-0">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  placeholder="Observaciones de la habitación..."
                  className="flex-1 bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                >
                  Guardar Ticket
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. CALENDARIO COMPACTO PMS & GESTIÓN DE RESERVAS + EXTENSIÓN EN PORTERÍA */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            {/* Compact 10-Room × 14-Day PMS Matrix */}
            <CompactPmsCalendarMatrix />

            {/* Search & Create Manual Booking Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Buscar huésped, ARH, HM o token QR..."
                    className="bg-[#000000] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white w-68 focus:border-[#B0E454] focus:outline-none"
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
                      ? 'Web Online'
                      : src === 'airbnb_email'
                      ? 'Airbnb Correo'
                      : 'Recepción Manual'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setNewBookingOpen(!newBookingOpen)}
                className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nueva Reserva Manual (Genera QR + Correo)
              </button>
            </div>

            {newBookingOpen && (
              <form
                onSubmit={handleCreateWalkIn}
                className="p-5 rounded-2xl lux-card-featured space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase text-[#B0E454]">
                    Agendar Reserva Manual en Habitación (100% Pagada + Emisión Automática de QR Único)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setNewBookingOpen(false)}
                    className="text-xs text-white/60 hover:text-white cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nombre y Apellido *"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="RUT / Pasaporte"
                    value={walkInRut}
                    onChange={(e) => setWalkInRut(e.target.value)}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono / WhatsApp *"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Correo (Recibirá el QR) *"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                  <select
                    value={walkInRoomNumber}
                    onChange={(e) => {
                      const num = e.target.value
                      setWalkInRoomNumber(num)
                      const unit = units.find((u) => u.number === num)
                      if (unit) setWalkInRoom(unit.categorySlug)
                    }}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.number}>
                        {u.customName || `Hab. ${u.number}`}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Patente Vehículo (Ej: PBYR-94)"
                    value={walkInPlate}
                    onChange={(e) => setWalkInPlate(e.target.value.toUpperCase())}
                    className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs uppercase font-bold text-white"
                  />
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
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                  >
                    Crear Reserva, Asignar Habitación y Enviar Correo con QR
                  </button>
                </div>
              </form>
            )}

            {/* Bookings List */}
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl lux-card flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#B0E454]">{b.id}</span>
                      {b.externalCode && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-bold">
                          Airbnb: {b.externalCode}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded bg-[#B0E454]/15 border border-[#B0E454]/40 text-[#B0E454] text-[11px] font-extrabold">
                        {b.assignedRoomNumber ? `Hab. ${b.assignedRoomNumber} (Centro de Coste)` : 'Sin asignar'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          b.qrStatus === 'issued'
                            ? 'bg-white/10 text-[#B0E454]'
                            : b.qrStatus === 'checked_in_active'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-zinc-800 text-white/50'
                        }`}
                      >
                        {b.qrStatus === 'issued'
                          ? 'QR 0/2 (Listo Entrada)'
                          : b.qrStatus === 'checked_in_active'
                          ? 'QR 1/2 (En Hotel)'
                          : 'QR 2/2 (Cerrado)'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white">
                      {b.clientName} · <span className="text-white/75">{b.roomCategoryName}</span>
                    </h3>

                    <p className="text-xs text-white/60">
                      Check-in 12:00: <strong>{b.checkInDate}</strong> → Check-out 12:00:{' '}
                      <strong>{b.checkOutDate}</strong> ({b.nightsCount} noches) · Patente:{' '}
                      <strong className="text-white">{b.vehiclePlates?.[0] || '—'}</strong> · Tel: {b.clientPhone} ·{' '}
                      {b.clientEmail}
                    </p>
                    {b.qrToken && (
                      <p className="text-[11px] font-mono text-[#B0E454]/80">
                        Token QR Único: {b.qrToken}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="text-right mr-2">
                      <p className="text-base font-black text-[#B0E454]">{formatCLP(b.totalAmount)}</p>
                      <p className="text-[11px] text-white/60">
                        Pagado: {formatCLP(b.amountPaid)} (100%)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openExtendStayModal(b)}
                      className="px-3 py-2 rounded-xl bg-[#000000] border border-[#B0E454]/40 text-[#B0E454] text-xs font-bold hover:bg-[#B0E454]/10 inline-flex items-center gap-1 cursor-pointer"
                      title="Asignar más días o cobro extra en Portería"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> + Días Portería
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput(b.qrToken || b.id)
                        handleExecuteQrScan(b.qrToken || b.id, 'inspect')
                        setActiveTab('checkin')
                      }}
                      className="px-3 py-2 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase inline-flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Escanear QR
                    </button>

                    <button
                      type="button"
                      disabled={resendingEmailId === b.id}
                      onClick={() => handleResendQrEmail(b.id)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-[#B0E454] cursor-pointer"
                      title="Ver / Reenviar Correo con QR al Huésped"
                    >
                      {resendingEmailId === b.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </button>

                    <select
                      value={b.status}
                      onChange={(e) => handleBookingStatusChange(b.id, e.target.value as Booking['status'])}
                      className="bg-[#000000] border border-white/20 rounded-xl px-2.5 py-2 text-xs font-bold text-white"
                    >
                      <option value="pending_payment">Pendiente Pago</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="checked_in">Checked-In (En Hotel)</option>
                      <option value="completed">Check-Out (QR Cerrado)</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CENTRO DE COSTES DE 10 HABITACIONES (HAB. 101 A HAB. 110) */}
        {activeTab === 'rack' && (
          <div className="space-y-8">
            {/* Cost Centers Aggregate Summary */}
            {costCenterTotals && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl lux-card-featured">
                  <span className="text-xs font-bold uppercase text-white/60">
                    Unidades / Centros de Coste
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    {costCenterTotals.totalRooms} Habitaciones
                  </p>
                  <p className="text-xs text-[#B0E454] mt-1">Hab. 101 a Hab. 110 configurables</p>
                </div>
                <div className="p-5 rounded-2xl lux-card">
                  <span className="text-xs font-bold uppercase text-white/60">
                    Ingresos Totales 10 Hab.
                  </span>
                  <p className="text-3xl font-black text-[#B0E454] mt-1">
                    {formatCLP(costCenterTotals.totalRevenue)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {costCenterTotals.totalBookings} reservas imputadas
                  </p>
                </div>
                <div className="p-5 rounded-2xl lux-card">
                  <span className="text-xs font-bold uppercase text-white/60">
                    Costos / Gastos por Habitación
                  </span>
                  <p className="text-3xl font-black text-red-400 mt-1">
                    -{formatCLP(costCenterTotals.totalExpenses)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Aseo, lavandería y mantención</p>
                </div>
                <div className="p-5 rounded-2xl lux-card">
                  <span className="text-xs font-bold uppercase text-white/60">
                    Margen Neto Centros de Coste
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    {formatCLP(costCenterTotals.netProfit)}
                  </p>
                  <p className="text-xs text-[#B0E454] mt-1">Rentabilidad directa acumulada</p>
                </div>
              </div>
            )}

            {/* 10 Editable Physical Rooms as Cost Centers */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-white">
                    10 Habitaciones Físicas Configuradas como Centros de Coste (Hab. 101 a Hab. 110)
                  </h2>
                  <p className="text-xs text-white/65">
                    Puedes personalizar el nombre de cada habitación, cambiar su categoría o tarifa y gestionar su rentabilidad individual.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {costCenters.map((cc) => {
                  const u = cc.unit
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
                      className="p-5 rounded-2xl lux-card space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#B0E454] text-[#000000] text-xs font-black">
                            Hab. {u.number}
                          </span>
                          <span className="text-[11px] font-mono text-white/50">
                            {u.costCenterCode || `CC-HAB-${u.number}`}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${badgeStyle}`}>
                          {u.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Editable Custom Room Name, Category & Nightly Rate */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={editingRoomNames[u.number] ?? u.customName ?? ''}
                          onChange={(e) =>
                            setEditingRoomNames({ ...editingRoomNames, [u.number]: e.target.value })
                          }
                          placeholder={`Nombre Habitación ${u.number}`}
                          className="sm:col-span-6 bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white"
                        />
                        <select
                          value={editingRoomCats[u.number] ?? u.categorySlug}
                          onChange={(e) =>
                            setEditingRoomCats({
                              ...editingRoomCats,
                              [u.number]: e.target.value as RoomCategorySlug,
                            })
                          }
                          className="sm:col-span-4 bg-[#000000] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveRoomCostCenterConfig(u)}
                          className="sm:col-span-2 py-2 px-3 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>

                      {/* Per-Room Cost Center Financial P&L */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#000000] border border-white/10">
                          <span className="text-white/50 block text-[10px]">Ingresos Hab.</span>
                          <strong className="text-[#B0E454] font-black">
                            {formatCLP(cc.totalRevenue)}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#000000] border border-white/10">
                          <span className="text-white/50 block text-[10px]">Costos / Gastos</span>
                          <strong className="text-red-400 font-black">
                            -{formatCLP(cc.totalExpenses)}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#000000] border border-white/10">
                          <span className="text-white/50 block text-[10px]">Margen Neto</span>
                          <strong className="text-white font-black">
                            {formatCLP(cc.netProfit)}
                          </strong>
                        </div>
                      </div>

                      {/* Active Guest & Status Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
                        <div className="text-white/70">
                          {cc.activeBooking ? (
                            <span>
                              Huésped: <strong className="text-white">{cc.activeBooking.clientName}</strong> ({cc.activeBooking.id})
                            </span>
                          ) : (
                            <span>Sin reserva activa hoy ({cc.bookingsCount} históricas)</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
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
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Imputar Gasto / Ingreso a un Centro de Coste */}
            <form
              onSubmit={handleAddCostCenterTransaction}
              className="lux-card rounded-3xl p-6 space-y-4"
            >
              <h3 className="text-base font-black text-white">
                Imputar Costo Operativo o Ingreso Extra a un Centro de Coste (Hab. 101 a Hab. 110)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                    Habitación (Centro de Coste)
                  </label>
                  <select
                    value={ccTxRoom}
                    onChange={(e) => setCcTxRoom(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.number}>
                        Hab. {u.number} ({u.customName || u.categorySlug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                    Tipo Movimiento
                  </label>
                  <select
                    value={ccTxType}
                    onChange={(e) => setCcTxType(e.target.value as 'gasto' | 'ingreso')}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="gasto">Costo / Gasto Habitación (-)</option>
                    <option value="ingreso">Ingreso Extra Habitación (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                    Concepto
                  </label>
                  <select
                    value={ccTxCategory}
                    onChange={(e) => setCcTxCategory(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="insumos_aseo">Insumos Aseo &amp; Amenities</option>
                    <option value="lavanderia_blancos">Lavandería Sábanas / Toallas</option>
                    <option value="mantencion_hotel">Reparación / Mantención Habitación</option>
                    <option value="cobro_extra_porteria">Cobro Extra en Portería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                    Detalle
                  </label>
                  <input
                    type="text"
                    required
                    value={ccTxDesc}
                    onChange={(e) => setCcTxDesc(e.target.value)}
                    placeholder="Ej: Cambio luminaria y blancos"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={ccTxAmount}
                    onChange={(e) => setCcTxAmount(e.target.value)}
                    placeholder="Monto CLP"
                    className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
                  >
                    Imputar
                  </button>
                </div>
              </div>
            </form>

            {/* Official 5 Categories Tariff Manager */}
            <div className="lux-card rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-black text-white">
                Tarifario Oficial de las 5 Categorías (Check-in 12:00 a Check-out 12:00)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.slug}
                    className="p-4 rounded-2xl bg-[#000000] border border-white/10 space-y-2"
                  >
                    <span className="text-[10px] font-bold text-[#B0E454] uppercase block">
                      {cat.bathroomLabel}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">{cat.name}</h3>
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="number"
                        defaultValue={cat.pricePerNight}
                        step={500}
                        onBlur={(e) => handlePriceUpdate(cat.slug, Number(e.target.value))}
                        className="w-full bg-[#000000] border border-white/15 rounded-xl px-2.5 py-2 text-xs font-bold text-white"
                      />
                      <span className="text-[10px] text-white/50">CLP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. AIRBNB DUAL-EMAIL SYNC (2 CUENTAS CON CONTRASEÑA DE APLICACIÓN) + BANDEJA DE CORREOS CON QR */}
        {activeTab === 'airbnb' && (
          <div className="space-y-6">
            {/* Banner Explanation */}
            <div className="p-6 rounded-3xl lux-card-featured flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#B0E454]">
                  <Sparkles className="w-4 h-4" /> Integración Dual Airbnb (2 Cuentas con Contraseña de Aplicación) → Base de Datos → Correo con QR al Cliente
                </span>
                <h2 className="text-xl font-black text-white">
                  Sincroniza las 2 cuentas registradas en Airbnb y envía automáticamente el Correo Oficial con el QR de Check-in
                </h2>
                <p className="text-xs sm:text-sm text-white/75 max-w-3xl">
                  Al llegar un comprobante de reserva de Airbnb a cualquiera de los 2 correos vinculados, el sistema agenda la habitación automáticamente en el Centro de Costes, genera el <strong>QR Único Criptográfico</strong> y envía al correo del huésped la confirmación con el logo de All Rent Hoteles, su QR, las normas, horario 12:00 a 12:00 y ubicación.
                </p>
              </div>
              <div className="shrink-0 px-4 py-3 rounded-2xl bg-[#000000] border border-white/15 text-xs">
                <span className="text-white/55 block">Webhook Inbound Activo</span>
                <code className="text-[#B0E454] font-mono text-[11px]">{webhookEndpointUrl}</code>
              </div>
            </div>

            {/* PERSONAL EMAIL LIVE TESTER (HTML + CID QR + BRAND LOGO) */}
            <form
              onSubmit={handleSendPersonalTestEmail}
              className="lux-card-featured rounded-3xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B0E454]">
                    LABORATORIO DE PRUEBA SMTP EN VIVO (COMPATIBLE CON GMAIL / OUTLOOK / IPHONE)
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Probar Envío de Correo HTML + Pase QR Único con Tu Correo Personal
                  </h3>
                  <p className="text-xs text-white/70">
                    Ingresa tu correo personal y su Contraseña de Aplicación (16 letras) para enviarte un correo real con el HTML corporativo, el logo de All Rent Hoteles y el QR adjunto por CID listo para escanear desde tu teléfono.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/65 mb-1">
                    1. Tu Correo Personal Emisor
                  </label>
                  <input
                    type="email"
                    value={testSenderEmail}
                    onChange={(e) => {
                      setTestSenderEmail(e.target.value)
                      if (!testRecipientEmail) setTestRecipientEmail(e.target.value)
                    }}
                    placeholder="tucorreo@gmail.com"
                    className="w-full bg-[#000000] border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#B0E454] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#B0E454] mb-1">
                    2. Contraseña de Aplicación (16 letras)
                  </label>
                  <input
                    type="password"
                    value={testSenderAppPass}
                    onChange={(e) => setTestSenderAppPass(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-[#000000] border border-white/20 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-[#B0E454] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/65 mb-1">
                    3. Correo Destinatario de Prueba
                  </label>
                  <input
                    type="email"
                    required
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder="Correo que recibirá el QR..."
                    className="w-full bg-[#000000] border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#B0E454] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/65 mb-1">
                    4. Reserva / Pase QR a Enviar
                  </label>
                  <select
                    value={testBookingId}
                    onChange={(e) => setTestBookingId(e.target.value)}
                    className="w-full bg-[#000000] border border-white/20 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} · {b.clientName} (Hab. {b.assignedRoomNumber || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {testEmailFeedback && (
                <div className="p-3.5 rounded-2xl bg-[#000000] border border-[#B0E454] text-xs font-bold text-[#B0E454]">
                  {testEmailFeedback}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-white/55">
                  💡 Al enviar con tu correo personal y Contraseña de Aplicación, también quedará guardado automáticamente en la <strong>Cuenta #1</strong> para que todas las reservas nuevas se envíen desde ahí.
                </span>
                <button
                  type="submit"
                  disabled={sendingTestEmail}
                  className="px-6 py-3 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#BEEB6B] cursor-pointer"
                >
                  {sendingTestEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando Correo HTML + QR...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Enviar Correo de Prueba con QR Ahora
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Dual Email Accounts Configuration (Account 1 & Account 2 with App Passwords) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(airbnbConfig?.accounts || []).map((acc) => {
                const draft = accDrafts[acc.id] || {}
                return (
                  <div
                    key={acc.id}
                    className="lux-card rounded-3xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-[#B0E454]" />
                        <div>
                          <h3 className="text-sm font-black text-white">{acc.label}</h3>
                          <p className="text-[11px] text-white/55">
                            IMAP ({acc.imapHost}:993) + SMTP ({acc.smtpHost}:465)
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          acc.appPasswordConfigured
                            ? 'bg-[#B0E454] text-[#000000]'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {acc.appPasswordConfigured ? 'App Password Lista' : 'Configurar Clave'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                          Titular / Responsable Cuenta
                        </label>
                        <input
                          type="text"
                          value={draft.holderName ?? acc.holderName}
                          onChange={(e) =>
                            setAccDrafts({
                              ...accDrafts,
                              [acc.id]: { ...draft, holderName: e.target.value },
                            })
                          }
                          className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                          Correo Registrado en Airbnb
                        </label>
                        <input
                          type="email"
                          value={draft.email ?? acc.email}
                          onChange={(e) =>
                            setAccDrafts({
                              ...accDrafts,
                              [acc.id]: { ...draft, email: e.target.value },
                            })
                          }
                          placeholder="correo@gmail.com"
                          className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#B0E454] mb-1">
                        Contraseña de Aplicación del Correo (16 caracteres Gmail / Outlook)
                      </label>
                      <input
                        type="password"
                        value={draft.appPassword ?? acc.appPassword ?? ''}
                        onChange={(e) =>
                          setAccDrafts({
                            ...accDrafts,
                            [acc.id]: { ...draft, appPassword: e.target.value },
                          })
                        }
                        placeholder="xxxx xxxx xxxx xxxx (Contraseña de Aplicación)"
                        className="w-full bg-[#000000] border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#B0E454] focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        disabled={savingAccId === acc.id}
                        onClick={() => handleSaveAirbnbAccount(acc)}
                        className="px-4 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase cursor-pointer"
                      >
                        {savingAccId === acc.id ? 'Guardando...' : 'Guardar Cuenta & Clave'}
                      </button>

                      <button
                        type="button"
                        disabled={imapRunning}
                        onClick={() => handleImapSync(acc.id)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white hover:border-[#B0E454] hover:text-[#B0E454] cursor-pointer"
                      >
                        {imapRunning ? 'Sincronizando...' : 'Escanear Buzón IMAP Ahora'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {syncFeedback && (
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#B0E454] text-xs sm:text-sm font-bold text-[#B0E454]">
                {syncFeedback}
              </div>
            )}

            {/* Simulator & Gmail Auto-Script */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleProcessAirbnbEmail}
                className="lg:col-span-7 lux-card rounded-3xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    Simulador en Vivo: Llegada de Comprobante Airbnb → Reserva + Correo con QR
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
                        Plantilla {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                      Cuenta Receptora
                    </label>
                    <select
                      value={simAccountId}
                      onChange={(e) => setSimAccountId(e.target.value as 'account_1' | 'account_2')}
                      className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="account_1">Cuenta Airbnb #1 (Principal)</option>
                      <option value="account_2">Cuenta Airbnb #2 (Secundaria)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-white/60 mb-1">
                      Remitente
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
                      Asunto
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
                    Cuerpo del Comprobante Airbnb (Incluye datos y correo del huésped)
                  </label>
                  <textarea
                    rows={7}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-[#000000] border border-white/15 rounded-xl p-3 text-xs font-mono text-white/90 focus:border-[#B0E454] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={syncingEmail}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#BEEB6B] cursor-pointer"
                >
                  {syncingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando y Generando Correo con QR...
                    </>
                  ) : (
                    <>
                      <MailCheck className="w-4 h-4" /> Procesar Comprobante Airbnb, Asignar Habitación y Enviar Correo con QR
                    </>
                  )}
                </button>
              </form>

              {/* Right: Outbox of Automated Welcome Emails with QR Sent to Guests */}
              <div className="lg:col-span-5 lux-card rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#B0E454]">
                      BANDEJA DE SALIDA AUTOMÁTICA
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      Correos Oficiales con QR Enviados ({emailOutbox.length})
                    </h3>
                  </div>
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
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-[11px] font-bold text-[#B0E454] cursor-pointer"
                  >
                    {copiedScript ? 'Script Copiado ✓' : 'Copiar Script Gmail'}
                  </button>
                </div>

                <p className="text-xs text-white/65">
                  Haz clic en cualquier correo enviado para previsualizar el diseño exacto con el logo de All Rent Hoteles, el código QR único, las normas y la ubicación que recibe el cliente.
                </p>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {emailOutbox.map((mail) => (
                    <div
                      key={mail.id}
                      className="p-3.5 rounded-2xl bg-[#000000] border border-white/12 hover:border-[#B0E454]/50 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white truncate">
                          Para: {mail.clientName} ({mail.toEmail})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#B0E454]/15 text-[#B0E454] text-[10px] font-black uppercase shrink-0">
                          Hab. {mail.assignedRoomNumber || '-'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 truncate">{mail.subject}</p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] font-mono text-[#B0E454] truncate">
                          {mail.qrToken}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewEmailLog(mail)}
                          className="px-3 py-1 rounded-lg bg-[#B0E454] text-[#000000] text-[11px] font-black uppercase inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Ver Correo &amp; QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sync Logs */}
            <div className="lux-card rounded-3xl p-6 space-y-3">
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
                      {log.accountLabel && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/80">
                          {log.accountLabel}
                        </span>
                      )}
                      <span className="text-white/60 ml-2">{log.rawSnippet}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#B0E454]/15 text-[#B0E454] font-bold uppercase text-[10px]">
                      {log.status} {log.bookingIdCreated ? `→ ${log.bookingIdCreated}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. CAJA & FINANZAS */}
        {activeTab === 'caja' && cashSummary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl lux-card-featured">
                <span className="text-xs text-white/60">Saldo Disponible en Caja</span>
                <p className="text-2xl font-black text-[#B0E454]">{formatCLP(cashSummary.availableBalance)}</p>
              </div>
              <div className="p-4 rounded-2xl lux-card">
                <span className="text-xs text-white/60">Ingresos Web Online (100%)</span>
                <p className="text-2xl font-black text-white">{formatCLP(cashSummary.webpayIncome)}</p>
              </div>
              <div className="p-4 rounded-2xl lux-card">
                <span className="text-xs text-white/60">Ingresos Airbnb Sync</span>
                <p className="text-2xl font-black text-white">{formatCLP(cashSummary.airbnbIncome)}</p>
              </div>
              <div className="p-4 rounded-2xl lux-card">
                <span className="text-xs text-white/60">Gastos Centros de Coste</span>
                <p className="text-2xl font-black text-red-400">-{formatCLP(cashSummary.totalExpense)}</p>
              </div>
            </div>

            <form
              onSubmit={handleAddCashTx}
              className="p-5 rounded-2xl lux-card grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
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
                value={txRoomNumber}
                onChange={(e) => setTxRoomNumber(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.number}>
                    Centro Coste Hab. {u.number}
                  </option>
                ))}
              </select>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="pago_recepcion">Pago Recepción</option>
                <option value="cobro_extra_porteria">Cobro Extra Portería</option>
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
                    <div className="flex items-center gap-2">
                      <strong className="text-white">{t.description}</strong>
                      {t.roomNumber && (
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[#B0E454] text-[10px] font-bold">
                          CC Hab. {t.roomNumber}
                        </span>
                      )}
                    </div>
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

        {/* 7. SOLICITUDES WEB CRM */}
        {activeTab === 'solicitudes' && (
          <div className="space-y-3">
            {solicitudes.map((sol) => (
              <div
                key={sol.id}
                className="p-5 rounded-2xl lux-card flex flex-col md:flex-row md:items-center justify-between gap-4"
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

        {/* 8. CLIENTES CRM */}
        {activeTab === 'clientes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl lux-card space-y-2">
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
                  <span>
                    Estadías: <strong>{c.totalStays}</strong> ({c.favoriteRoom || '-'})
                  </span>
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
              className="p-5 rounded-2xl lux-card grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
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
                placeholder="Matrícula / Patente (Ej: PBYR-94)"
                value={pkPlate}
                onChange={(e) => setPkPlate(e.target.value.toUpperCase())}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs uppercase font-bold text-white"
              />
              <select
                value={pkRoom}
                onChange={(e) => setPkRoom(e.target.value)}
                className="bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.number}>
                    Hab. {u.number}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
              >
                Registrar Vehículo
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
              className="p-5 rounded-2xl lux-card grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
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
          <div className="max-w-4xl lux-card rounded-3xl overflow-hidden flex flex-col h-[560px]">
            <div className="p-4 bg-[#000000] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-[#B0E454]" />
                <strong className="text-sm text-white">Copiloto IA Ejecutivo All Rent Hoteles</strong>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['¿Cómo está la ocupación hoy?', 'Resumen de caja y Centros de Coste', 'Últimos correos Airbnb'].map(
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
                placeholder="Pregunta por las 10 habitaciones, QR de reservas, ingresos o Airbnb..."
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

      {/* MODAL 1: EXTENDER ESTADÍA / COBRO EXTRA EN PORTERÍA */}
      {extendModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExtendStaySubmit}
            className="max-w-lg w-full lux-card-featured rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#B0E454]">
                  GESTIÓN EN PORTERÍA / RECEPCIÓN
                </span>
                <h3 className="text-lg font-black text-white">
                  Extender Estadía / Asignar Cobro Extra
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExtendModalBooking(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:text-[#B0E454] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#000000] border border-white/10 text-xs space-y-1">
              <p>
                Huésped: <strong className="text-white">{extendModalBooking.clientName}</strong> ({extendModalBooking.id})
              </p>
              <p>
                Centro de Coste: <strong className="text-[#B0E454]">Hab. {extendModalBooking.assignedRoomNumber || '-'}</strong> · {extendModalBooking.roomCategoryName}
              </p>
              <p>
                Salida actual: <strong>{extendModalBooking.checkOutDate} (12:00 hrs)</strong> · Tarifa base: {formatCLP(extendModalBooking.ratePerNight)} / noche
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/75 mb-1">
                  Noches Adicionales a Sumar
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={extraNightsInput}
                  onChange={(e) => {
                    const n = Math.max(0, Number(e.target.value))
                    setExtraNightsInput(n)
                    setExtraAmountInput(n * extendModalBooking.ratePerNight)
                  }}
                  className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/75 mb-1">
                  Monto Extra a Cobrar en Portería (CLP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={extraAmountInput}
                  onChange={(e) => setExtraAmountInput(Number(e.target.value))}
                  className="w-full bg-[#000000] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#B0E454]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/75 mb-1">
                  Medio de Pago en Portería
                </label>
                <select
                  value={extraPaymentMethod}
                  onChange={(e) => setExtraPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="efectivo_recepcion">Efectivo / POS Portería</option>
                  <option value="transferencia">Transferencia Directa</option>
                  <option value="webpay_tarjeta">Tarjeta Webpay</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/75 mb-1">
                  Nota / Detalle
                </label>
                <input
                  type="text"
                  value={extraNotesInput}
                  onChange={(e) => setExtraNotesInput(e.target.value)}
                  className="w-full bg-[#000000] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExtendModalBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-white/80 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={extendingSaving}
                className="px-5 py-2.5 rounded-xl bg-[#B0E454] text-[#000000] font-black text-xs uppercase cursor-pointer"
              >
                {extendingSaving ? 'Guardando...' : `Confirmar +${extraNightsInput} Noches (${formatCLP(extraAmountInput)})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: VISTA PREVIA REAL DEL CORREO CORPORATIVO CON QR ENVIADO AL HUÉSPED */}
      {previewEmailLog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-[#050605] border-2 border-[#B0E454] rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#000000] border-b border-white/15 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#B0E454]">
                  COMPROBANTE DE CORREO CON QR ENVIADO AL CLIENTE
                </span>
                <h3 className="text-sm font-black text-white">
                  Para: {previewEmailLog.clientName} &lt;{previewEmailLog.toEmail}&gt; · Hab. {previewEmailLog.assignedRoomNumber || '-'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQrScanInput(previewEmailLog.qrToken)
                    handleExecuteQrScan(previewEmailLog.qrToken, 'inspect')
                    setPreviewEmailLog(null)
                    setActiveTab('checkin')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase cursor-pointer"
                >
                  Probar Escaneo de este QR
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewEmailLog(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:text-[#B0E454] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#050605] p-2">
              <iframe
                title="Vista Previa Correo Oficial All Rent Hoteles"
                srcDoc={previewEmailLog.htmlBody}
                className="w-full h-[560px] rounded-2xl border-0 bg-[#050605]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
