import fs from 'fs'
import path from 'path'
import {
  AirbnbEmailSyncLog,
  AirbnbIntegrationConfig,
  BlockedRoomDate,
  Booking,
  CashTransaction,
  CheckInData,
  Client,
  HotelSettings,
  InspectionTicket,
  ParkingRecord,
  PaymentMethod,
  PaymentRecord,
  RoomCategory,
  RoomCategorySlug,
  RoomUnit,
  RoomUnitStatus,
  SolicitudFormulario,
} from '@/types/saas'
import {
  calculateNights,
  DEFAULT_HOTEL_SETTINGS,
  INITIAL_ROOM_UNITS,
  OFFICIAL_ROOM_CATEGORIES,
} from './pricing'
import { parseAirbnbEmailPayload } from './airbnb-parser'

interface HotelDatabaseSchema {
  settings: HotelSettings
  roomCategories: RoomCategory[]
  roomUnits: RoomUnit[]
  bookings: Booking[]
  blockedDates: BlockedRoomDate[]
  airbnbConfig: AirbnbIntegrationConfig
  airbnbLogs: AirbnbEmailSyncLog[]
  cashTransactions: CashTransaction[]
  clients: Client[]
  parkingRecords: ParkingRecord[]
  solicitudes: SolicitudFormulario[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'all_rent_hoteles_db.json')

const INITIAL_SEED: HotelDatabaseSchema = {
  settings: DEFAULT_HOTEL_SETTINGS,
  roomCategories: OFFICIAL_ROOM_CATEGORIES,
  roomUnits: INITIAL_ROOM_UNITS,
  airbnbConfig: {
    enabled: true,
    webhookSecret: 'arh_quintero_sync_2026',
    hotelReceptionEmail: 'reservas@allrenthoteles.cl',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapUser: 'reservas@allrenthoteles.cl',
    imapPasswordConfigured: false,
    autoAssignRoom: true,
    autoRegisterCash: true,
    lastSyncAt: '2026-11-24T22:15:00-03:00',
    totalSyncedCount: 2,
  },
  airbnbLogs: [
    {
      id: 'AIR-LOG-001',
      receivedAt: '2026-11-24T22:15:00-03:00',
      fromEmail: 'automated@airbnb.com',
      subject: '¡Reserva confirmada! Fernanda Soto llega el 27 nov 2026',
      airbnbCode: 'HM8P3K9W2L',
      eventType: 'reservation_confirmed',
      guestName: 'Fernanda Soto',
      roomCategoryDetected: 'familiar_terraza',
      checkInDate: '2026-11-27',
      checkOutDate: '2026-11-29',
      totalAmount: 159000,
      bookingIdCreated: 'ARH-2026-1043',
      status: 'synced',
      rawSnippet:
        'Código de confirmación: HM8P3K9W2L | Familiar con Terraza (Baño privado) | 2 noches | $159.000 CLP',
    },
    {
      id: 'AIR-LOG-002',
      receivedAt: '2026-11-23T18:40:00-03:00',
      fromEmail: 'automated@airbnb.com',
      subject: '¡Reserva confirmada! Martín Lagos llega el 25 nov 2026',
      airbnbCode: 'HM4R7T2N8Q',
      eventType: 'reservation_confirmed',
      guestName: 'Martín Lagos',
      roomCategoryDetected: 'standard_matrimonial',
      checkInDate: '2026-11-24',
      checkOutDate: '2026-11-26',
      totalAmount: 107000,
      bookingIdCreated: 'ARH-2026-1041',
      status: 'synced',
      rawSnippet:
        'Código de confirmación: HM4R7T2N8Q | Standard Matrimonial (Baño privado exterior) | 2 noches | $107.000 CLP',
    },
  ],
  blockedDates: [
    {
      id: 'BLK-01',
      date: '2026-12-24',
      roomCategory: 'single_individual',
      roomNumber: '107',
      reason: 'Mantención',
      createdAt: '2026-11-20T10:00:00Z',
    },
  ],
  bookings: [
    {
      id: 'ARH-2026-1042',
      source: 'web_online',
      roomCategory: 'superior_matrimonial',
      roomCategoryName: 'Superior Matrimonial',
      assignedRoomNumber: '201',
      clientName: 'Valentina Contreras',
      clientEmail: 'v.contreras@gmail.com',
      clientPhone: '+56987451230',
      clientRut: '18.492.103-4',
      checkInDate: '2026-11-24',
      checkOutDate: '2026-11-26',
      nightsCount: 2,
      guestsCount: 2,
      ratePerNight: 63500,
      totalAmount: 127000,
      depositRequired: 63500,
      amountPaid: 127000,
      paymentStatus: 'paid_full',
      paymentMethod: 'webpay_tarjeta',
      paidAt: '2026-11-22T16:30:00Z',
      status: 'checked_in',
      vehiclesCount: 1,
      vehiclePlates: ['Pbyr-94'.toUpperCase()],
      requiresParking: true,
      specialRequests: 'Llegada puntual a las 12:15 hrs. Estacionamiento interior.',
      createdAt: '2026-11-22T16:28:00Z',
      checkin: {
        bookingId: 'ARH-2026-1042',
        estimatedArrival: '12:15',
        vehiclesCount: 1,
        vehiclePlates: ['PBYR-94'],
        guestList: [
          { name: 'Valentina Contreras', rutOrPassport: '18.492.103-4', age: 31 },
          { name: 'Diego Fuenzalida', rutOrPassport: '17.992.410-K', age: 33 },
        ],
        rulesAccepted: true,
        rulesAcceptedAt: '2026-11-23T20:10:00Z',
        checkedInAt: '2026-11-24T12:18:00Z',
      },
      payments: [
        {
          id: 'PAY-9081',
          bookingId: 'ARH-2026-1042',
          gateway: 'webpay_tarjeta',
          amount: 127000,
          paymentMode: 'full_100',
          status: 'approved',
          authorizationCode: 'TBK-849201',
          cardLast4: '4829',
          cardBrand: 'Visa Crédito',
          installments: 3,
          createdAt: '2026-11-22T16:30:00Z',
        },
      ],
      tickets: [
        {
          id: 'TCK-201-A',
          bookingId: 'ARH-2026-1042',
          roomNumber: '201',
          type: 'alistamiento_previo',
          title: 'Hab. 201 Lista para Check-in 12:00',
          operatorName: 'Equipo Housekeeping All Rent',
          createdAt: '2026-11-24T11:20:00Z',
          status: 'aprobado',
          items: [
            { id: 'cama', label: 'Ropa de cama blanca planchada & almohadas', category: 'habitacion', status: 'ok' },
            { id: 'bano', label: 'Baño privado en suite sanitizado + toallas', category: 'bano', status: 'ok' },
            { id: 'tv_wifi', label: 'Smart TV, control remoto y señal Wi-Fi', category: 'equipamiento', status: 'ok' },
            { id: 'kitchenette', label: 'Kitchenette (refrigerador/microondas) & patio', category: 'areas_comunes', status: 'ok' },
          ],
        },
      ],
    },
    {
      id: 'ARH-2026-1041',
      externalCode: 'HM4R7T2N8Q',
      source: 'airbnb_email',
      roomCategory: 'standard_matrimonial',
      roomCategoryName: 'Standard Matrimonial',
      assignedRoomNumber: '102',
      clientName: 'Martín Lagos',
      clientEmail: 'martin.lagos@outlook.cl',
      clientPhone: '+56993418821',
      clientRut: '16.774.209-1',
      checkInDate: '2026-11-24',
      checkOutDate: '2026-11-26',
      nightsCount: 2,
      guestsCount: 2,
      ratePerNight: 53500,
      totalAmount: 107000,
      depositRequired: 53500,
      amountPaid: 107000,
      paymentStatus: 'paid_full',
      paymentMethod: 'airbnb_payout',
      paidAt: '2026-11-23T18:40:00Z',
      status: 'checked_in',
      vehiclesCount: 1,
      vehiclePlates: ['LZWT-42'],
      requiresParking: true,
      specialRequests: 'Sincronizado automáticamente desde correo Airbnb (HM4R7T2N8Q).',
      createdAt: '2026-11-23T18:40:00Z',
    },
    {
      id: 'ARH-2026-1043',
      externalCode: 'HM8P3K9W2L',
      source: 'airbnb_email',
      roomCategory: 'familiar_terraza',
      roomCategoryName: 'Familiar con Terraza',
      assignedRoomNumber: '204',
      clientName: 'Fernanda Soto',
      clientEmail: 'fsoto.viajes@gmail.com',
      clientPhone: '+56975540912',
      checkInDate: '2026-11-27',
      checkOutDate: '2026-11-29',
      nightsCount: 2,
      guestsCount: 4,
      ratePerNight: 79500,
      totalAmount: 159000,
      depositRequired: 79500,
      amountPaid: 159000,
      paymentStatus: 'paid_full',
      paymentMethod: 'airbnb_payout',
      paidAt: '2026-11-24T22:15:00Z',
      status: 'confirmed',
      requiresParking: true,
      specialRequests: 'Sincronizado vía Comprobante Email Airbnb (HM8P3K9W2L). Familia con 2 niños.',
      createdAt: '2026-11-24T22:15:00Z',
    },
    {
      id: 'ARH-2026-1044',
      source: 'web_online',
      roomCategory: 'doble_dos_camas',
      roomCategoryName: 'Doble Dos Camas',
      assignedRoomNumber: '104',
      clientName: 'Cristóbal Navarrete',
      clientEmail: 'cnavarrete@ingenieria.cl',
      clientPhone: '+56982114490',
      clientRut: '15.320.884-7',
      checkInDate: '2026-11-28',
      checkOutDate: '2026-11-30',
      nightsCount: 2,
      guestsCount: 2,
      ratePerNight: 49500,
      totalAmount: 99000,
      depositRequired: 49500,
      amountPaid: 49500,
      paymentStatus: 'deposit_paid',
      paymentMethod: 'webpay_tarjeta',
      paidAt: '2026-11-24T19:10:00Z',
      status: 'confirmed',
      vehiclesCount: 1,
      vehiclePlates: ['KTRW-18'],
      requiresParking: true,
      specialRequests: 'Abono 50% online aprobado. Saldo al check-in 12:00.',
      createdAt: '2026-11-24T19:08:00Z',
    },
    {
      id: 'ARH-2026-1045',
      source: 'recepcion_directa',
      roomCategory: 'single_individual',
      roomCategoryName: 'Single Individual',
      assignedRoomNumber: '106',
      clientName: 'Rodrigo Alarcón',
      clientEmail: 'ralarcon@maritima.cl',
      clientPhone: '+56964492011',
      clientRut: '13.884.129-2',
      checkInDate: '2026-11-25',
      checkOutDate: '2026-11-26',
      nightsCount: 1,
      guestsCount: 1,
      ratePerNight: 39500,
      totalAmount: 39500,
      depositRequired: 19750,
      amountPaid: 39500,
      paymentStatus: 'paid_full',
      paymentMethod: 'transferencia',
      paidAt: '2026-11-24T21:00:00Z',
      status: 'confirmed',
      requiresParking: false,
      specialRequests: 'Comisión laboral Bahía Quintero. Check-in hoy 12:00 hrs.',
      createdAt: '2026-11-24T20:55:00Z',
    },
  ],
  cashTransactions: [
    {
      id: 'TX-401',
      date: '2026-11-24 22:15',
      type: 'ingreso',
      category: 'payout_airbnb',
      description: 'Reserva Airbnb Email Sync HM8P3K9W2L - Fernanda Soto (Familiar Terraza)',
      amount: 159000,
      bookingId: 'ARH-2026-1043',
      receiptNumber: 'AIR-HM8P3K9W2L',
      operator: 'Sync Automático Correo',
    },
    {
      id: 'TX-402',
      date: '2026-11-24 21:00',
      type: 'ingreso',
      category: 'transferencia_directa',
      description: 'Pago Estadía Single Individual Hab. 106 - Rodrigo Alarcón',
      amount: 39500,
      bookingId: 'ARH-2026-1045',
      receiptNumber: 'TRF-99412',
      operator: 'Recepción All Rent',
    },
    {
      id: 'TX-403',
      date: '2026-11-24 19:10',
      type: 'ingreso',
      category: 'pago_online_webpay',
      description: 'Abono 50% Webpay Tarjeta - Cristóbal Navarrete (Doble Dos Camas)',
      amount: 49500,
      bookingId: 'ARH-2026-1044',
      receiptNumber: 'TBK-773910',
      operator: 'Pasarela Webpay Online',
    },
    {
      id: 'TX-404',
      date: '2026-11-23 18:40',
      type: 'ingreso',
      category: 'payout_airbnb',
      description: 'Reserva Airbnb Email Sync HM4R7T2N8Q - Martín Lagos (Standard Matrimonial)',
      amount: 107000,
      bookingId: 'ARH-2026-1041',
      receiptNumber: 'AIR-HM4R7T2N8Q',
      operator: 'Sync Automático Correo',
    },
    {
      id: 'TX-405',
      date: '2026-11-22 16:30',
      type: 'ingreso',
      category: 'pago_online_webpay',
      description: 'Pago 100% Webpay Visa - Valentina Contreras (Superior Matrimonial)',
      amount: 127000,
      bookingId: 'ARH-2026-1042',
      receiptNumber: 'TBK-849201',
      operator: 'Pasarela Webpay Online',
    },
    {
      id: 'TX-406',
      date: '2026-11-23 11:15',
      type: 'gasto',
      category: 'lavanderia_blancos',
      description: 'Servicio lavandería industrial sábanas y toallas hoteleras blancas',
      amount: -34000,
      receiptNumber: 'FAC-1182',
      operator: 'Administración Central',
    },
    {
      id: 'TX-407',
      date: '2026-11-21 17:40',
      type: 'gasto',
      category: 'insumos_aseo',
      description: 'Amenities baño privado, jabón líquido, café y suministros kitchenette',
      amount: -22500,
      receiptNumber: 'BOL-5509',
      operator: 'Recepción',
    },
  ],
  clients: [
    {
      id: 'CLI-ARH-01',
      name: 'Valentina Contreras',
      rutOrPassport: '18.492.103-4',
      phone: '+56987451230',
      email: 'v.contreras@gmail.com',
      origin: 'Web Directa',
      totalStays: 2,
      totalSpent: 254000,
      lastStayDate: '2026-11-24',
      favoriteRoom: 'Superior Matrimonial (201)',
      notes: 'Destaca cercanía a la playa y tranquilidad del barrio marino.',
    },
    {
      id: 'CLI-ARH-02',
      name: 'Martín Lagos',
      rutOrPassport: '16.774.209-1',
      phone: '+56993418821',
      email: 'martin.lagos@outlook.cl',
      origin: 'Airbnb',
      totalStays: 1,
      totalSpent: 107000,
      lastStayDate: '2026-11-24',
      favoriteRoom: 'Standard Matrimonial (102)',
    },
    {
      id: 'CLI-ARH-03',
      name: 'Fernanda Soto',
      rutOrPassport: '17.210.493-8',
      phone: '+56975540912',
      email: 'fsoto.viajes@gmail.com',
      origin: 'Airbnb',
      totalStays: 1,
      totalSpent: 159000,
      lastStayDate: '2026-11-27',
      favoriteRoom: 'Familiar con Terraza (204)',
    },
    {
      id: 'CLI-ARH-04',
      name: 'Cristóbal Navarrete',
      rutOrPassport: '15.320.884-7',
      phone: '+56982114490',
      email: 'cnavarrete@ingenieria.cl',
      origin: 'Web Directa',
      totalStays: 3,
      totalSpent: 297000,
      lastStayDate: '2026-11-28',
      favoriteRoom: 'Doble Dos Camas (104)',
      notes: 'Viaja regularmente a Quintero por proyectos navales/portuarios.',
    },
    {
      id: 'CLI-ARH-05',
      name: 'Rodrigo Alarcón',
      rutOrPassport: '13.884.129-2',
      phone: '+56964492011',
      email: 'ralarcon@maritima.cl',
      origin: 'Corporativo',
      totalStays: 4,
      totalSpent: 197500,
      lastStayDate: '2026-11-25',
      favoriteRoom: 'Single Individual (106)',
    },
  ],
  parkingRecords: [
    {
      id: 'PRK-01',
      bookingId: 'ARH-2026-1042',
      roomNumber: '201',
      guestName: 'Valentina Contreras',
      guestRut: '18.492.103-4',
      guestPhone: '+56987451230',
      vehiclePlate: 'PBYR-94',
      vehicleModel: 'Mazda CX-5 Gris',
      parkingSpot: 'Estacionamiento Interior #1 (CCTV)',
      entryTime: '2026-11-24 12:18',
      status: 'estacionado',
      notes: 'Portón cerrado verificado.',
    },
    {
      id: 'PRK-02',
      bookingId: 'ARH-2026-1041',
      roomNumber: '102',
      guestName: 'Martín Lagos',
      guestRut: '16.774.209-1',
      guestPhone: '+56993418821',
      vehiclePlate: 'LZWT-42',
      vehicleModel: 'Kia Sportage Blanco',
      parkingSpot: 'Estacionamiento Interior #2 (CCTV)',
      entryTime: '2026-11-24 13:05',
      status: 'estacionado',
    },
  ],
  solicitudes: [
    {
      id: 'SOL-2026-01',
      nombre: 'Carolina Bustamante',
      telefono: '+56991283340',
      correo: 'cbustamante@empresa.cl',
      checkInDeseado: '2026-12-18',
      noches: 3,
      huespedes: 6,
      habitacionInteres: 'Familiar con Terraza + Superior Matrimonial',
      motivoViaje: 'Escapada familiar frente a la playa',
      mensaje: 'Hola All Rent Hoteles, queremos reservar 2 habitaciones para el fin de semana de diciembre con estacionamiento para 2 autos.',
      estado: 'nueva',
      origen: 'formulario_web',
      createdAt: '2026-11-24T20:15:00Z',
      presupuestoEstimado: 429000,
    },
    {
      id: 'SOL-2026-02',
      nombre: 'Patricio Riquelme',
      telefono: '+56978831209',
      correo: 'priquelme@naviera.cl',
      checkInDeseado: '2026-12-02',
      noches: 4,
      huespedes: 2,
      habitacionInteres: 'Doble Dos Camas',
      motivoViaje: 'Convenio empresa / Trabajo en puerto',
      mensaje: 'Consulto disponibilidad y factura para 2 ingenieros de lunes a viernes.',
      estado: 'cotizado',
      origen: 'concierge_ia',
      createdAt: '2026-11-23T15:30:00Z',
      presupuestoEstimado: 198000,
    },
  ],
}

function readDb(): HotelDatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED, null, 2), 'utf-8')
      return structuredClone(INITIAL_SEED)
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as HotelDatabaseSchema
    return {
      ...INITIAL_SEED,
      ...parsed,
      settings: { ...DEFAULT_HOTEL_SETTINGS, ...(parsed.settings || {}) },
      roomCategories:
        parsed.roomCategories && parsed.roomCategories.length === 5
          ? parsed.roomCategories
          : OFFICIAL_ROOM_CATEGORIES,
      roomUnits:
        parsed.roomUnits && parsed.roomUnits.length > 0 ? parsed.roomUnits : INITIAL_ROOM_UNITS,
    }
  } catch (err) {
    console.error('Error reading All Rent Hoteles DB, using seed:', err)
    return structuredClone(INITIAL_SEED)
  }
}

function writeDb(data: HotelDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing All Rent Hoteles DB:', err)
  }
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB
}

export const db = {
  // SETTINGS
  getSettings(): HotelSettings {
    return readDb().settings
  },

  updateSettings(updates: Partial<HotelSettings>): HotelSettings {
    const data = readDb()
    data.settings = { ...data.settings, ...updates }
    writeDb(data)
    return data.settings
  },

  // ROOM CATEGORIES & RACK UNITS
  getRoomCategories(): RoomCategory[] {
    return readDb().roomCategories
  },

  updateRoomCategory(slug: RoomCategorySlug, updates: Partial<RoomCategory>): RoomCategory | null {
    const data = readDb()
    const idx = data.roomCategories.findIndex((c) => c.slug === slug)
    if (idx === -1) return null
    data.roomCategories[idx] = { ...data.roomCategories[idx], ...updates }
    writeDb(data)
    return data.roomCategories[idx]
  },

  getRoomUnits(): RoomUnit[] {
    return readDb().roomUnits
  },

  updateRoomUnit(unitIdOrNumber: string, updates: Partial<RoomUnit>): RoomUnit | null {
    const data = readDb()
    const idx = data.roomUnits.findIndex(
      (u) => u.id === unitIdOrNumber || u.number === unitIdOrNumber
    )
    if (idx === -1) return null
    data.roomUnits[idx] = { ...data.roomUnits[idx], ...updates }
    if (updates.status === 'disponible') {
      data.roomUnits[idx].lastCleanedAt = new Date().toISOString()
    }
    writeDb(data)
    return data.roomUnits[idx]
  },

  // MULTI-ROOM AVAILABILITY & AUTO ROOM ASSIGNMENT
  findAvailableRoomNumber(
    categorySlug: RoomCategorySlug,
    checkInDate: string,
    checkOutDate: string,
    excludeBookingId?: string
  ): string | null {
    const data = readDb()
    const unitsInCat = data.roomUnits.filter(
      (u) => u.categorySlug === categorySlug && u.status !== 'mantencion'
    )

    for (const unit of unitsInCat) {
      // Check blocked dates for this specific room or category
      const isBlocked = data.blockedDates.some((blk) => {
        if (blk.date < checkInDate || blk.date >= checkOutDate) return false
        if (blk.roomCategory === 'all') return true
        if (blk.roomNumber && blk.roomNumber === unit.number) return true
        if (!blk.roomNumber && blk.roomCategory === categorySlug) return true
        return false
      })
      if (isBlocked) continue

      // Check overlapping active bookings assigned to this unit
      const hasOverlap = data.bookings.some((b) => {
        if (b.id === excludeBookingId) return false
        if (b.status === 'cancelled') return false
        if (b.assignedRoomNumber !== unit.number) return false
        return rangesOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)
      })

      if (!hasOverlap) {
        return unit.number
      }
    }

    // Also check general count capacity if bookings don't all have assignedRoomNumber
    const overlappingCatCount = data.bookings.filter((b) => {
      if (b.id === excludeBookingId || b.status === 'cancelled') return false
      if (b.roomCategory !== categorySlug) return false
      return rangesOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)
    }).length

    if (overlappingCatCount < unitsInCat.length && unitsInCat[0]) {
      return unitsInCat[0].number
    }

    return null
  },

  getAvailabilitySummary(categorySlug?: RoomCategorySlug) {
    const data = readDb()
    const soldOutByCategory: Record<string, string[]> = {}

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cats = categorySlug
      ? data.roomCategories.filter((c) => c.slug === categorySlug)
      : data.roomCategories

    for (const cat of cats) {
      soldOutByCategory[cat.slug] = []
      const activeUnitsCount = data.roomUnits.filter(
        (u) => u.categorySlug === cat.slug && u.status !== 'mantencion'
      ).length

      for (let i = 0; i < 90; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        const dStr = d.toISOString().split('T')[0]

        const globalBlocked = data.blockedDates.some(
          (blk) =>
            blk.date === dStr &&
            (blk.roomCategory === 'all' ||
              (!blk.roomNumber && blk.roomCategory === cat.slug))
        )
        if (globalBlocked) {
          soldOutByCategory[cat.slug].push(dStr)
          continue
        }

        const roomBlocksCount = data.blockedDates.filter(
          (blk) => blk.date === dStr && blk.roomCategory === cat.slug && Boolean(blk.roomNumber)
        ).length

        const bookedCount = data.bookings.filter(
          (b) =>
            b.status !== 'cancelled' &&
            b.roomCategory === cat.slug &&
            b.checkInDate <= dStr &&
            b.checkOutDate > dStr
        ).length

        if (bookedCount + roomBlocksCount >= activeUnitsCount) {
          soldOutByCategory[cat.slug].push(dStr)
        }
      }
    }

    return {
      categories: data.roomCategories,
      soldOutByCategory,
      checkInTime: data.settings.checkInTime,
      checkOutTime: data.settings.checkOutTime,
    }
  },

  // BOOKINGS
  getBookings(): Booking[] {
    const data = readDb()
    return data.bookings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  getBookingByCode(code: string): Booking | null {
    const data = readDb()
    const clean = code.trim().toUpperCase()
    return (
      data.bookings.find(
        (b) =>
          b.id.toUpperCase() === clean ||
          (b.externalCode && b.externalCode.toUpperCase() === clean)
      ) || null
    )
  },

  createBooking(input: Omit<Booking, 'id' | 'createdAt'> & { id?: string }): Booking {
    const data = readDb()
    const randNum = Math.floor(1000 + Math.random() * 9000)
    const id = input.id || `ARH-2026-${randNum}`

    const assignedRoom =
      input.assignedRoomNumber ||
      this.findAvailableRoomNumber(input.roomCategory, input.checkInDate, input.checkOutDate) ||
      undefined

    const newBooking: Booking = {
      ...input,
      id,
      assignedRoomNumber: assignedRoom,
      createdAt: new Date().toISOString(),
      payments: input.payments || [],
      tickets: input.tickets || [],
    }

    data.bookings.unshift(newBooking)

    // Upsert Client CRM
    const existingCliIdx = data.clients.findIndex(
      (c) =>
        c.email.toLowerCase() === newBooking.clientEmail.toLowerCase() ||
        (newBooking.clientRut && c.rutOrPassport === newBooking.clientRut)
    )
    if (existingCliIdx >= 0) {
      data.clients[existingCliIdx].totalStays += 1
      data.clients[existingCliIdx].lastStayDate = newBooking.checkInDate
      if (newBooking.amountPaid > 0) {
        data.clients[existingCliIdx].totalSpent += newBooking.amountPaid
      }
    } else {
      data.clients.unshift({
        id: `CLI-${Date.now().toString().slice(-4)}`,
        name: newBooking.clientName,
        rutOrPassport: newBooking.clientRut || newBooking.externalCode || 'Pasaporte/Ext',
        phone: newBooking.clientPhone,
        email: newBooking.clientEmail,
        origin:
          newBooking.source === 'airbnb_email'
            ? 'Airbnb'
            : newBooking.source === 'web_online'
            ? 'Web Directa'
            : 'Recepción',
        totalStays: 1,
        totalSpent: newBooking.amountPaid || 0,
        lastStayDate: newBooking.checkInDate,
        favoriteRoom: `${newBooking.roomCategoryName}${assignedRoom ? ` (${assignedRoom})` : ''}`,
      })
    }

    writeDb(data)
    return newBooking
  },

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const data = readDb()
    const clean = id.trim().toUpperCase()
    const idx = data.bookings.findIndex(
      (b) =>
        b.id.toUpperCase() === clean ||
        (b.externalCode && b.externalCode.toUpperCase() === clean)
    )
    if (idx === -1) return null

    data.bookings[idx] = {
      ...data.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Sync physical room unit status if checked_in or completed
    const b = data.bookings[idx]
    if (b.assignedRoomNumber) {
      const uIdx = data.roomUnits.findIndex((u) => u.number === b.assignedRoomNumber)
      if (uIdx >= 0) {
        if (updates.status === 'checked_in') {
          data.roomUnits[uIdx].status = 'ocupada'
          data.roomUnits[uIdx].currentBookingId = b.id
        } else if (updates.status === 'completed') {
          data.roomUnits[uIdx].status = 'aseo_pendiente'
          data.roomUnits[uIdx].currentBookingId = undefined
        } else if (updates.status === 'cancelled' && data.roomUnits[uIdx].currentBookingId === b.id) {
          data.roomUnits[uIdx].status = 'disponible'
          data.roomUnits[uIdx].currentBookingId = undefined
        }
      }
    }

    writeDb(data)
    return data.bookings[idx]
  },

  // ONLINE PAYMENT GATEWAY PROCESSING
  processBookingPayment(params: {
    bookingId: string
    gateway: PaymentMethod
    paymentMode: 'full_100' | 'deposit_50' | 'balance_50'
    cardLast4?: string
    cardBrand?: string
    installments?: number
    externalReference?: string
  }): { booking: Booking; payment: PaymentRecord } | null {
    const data = readDb()
    const clean = params.bookingId.trim().toUpperCase()
    const idx = data.bookings.findIndex((b) => b.id.toUpperCase() === clean)
    if (idx === -1) return null

    const booking = data.bookings[idx]
    let chargeAmount = booking.totalAmount
    if (params.paymentMode === 'deposit_50') {
      chargeAmount = booking.depositRequired
    } else if (params.paymentMode === 'balance_50') {
      chargeAmount = Math.max(0, booking.totalAmount - booking.amountPaid)
    }

    const authCode =
      params.externalReference ||
      `TBK-${Math.floor(100000 + Math.random() * 900000)}`

    const payment: PaymentRecord = {
      id: `PAY-${Date.now().toString().slice(-5)}`,
      bookingId: booking.id,
      gateway: params.gateway,
      amount: chargeAmount,
      paymentMode: params.paymentMode,
      status: 'approved',
      authorizationCode: authCode,
      cardLast4: params.cardLast4 || '4242',
      cardBrand: params.cardBrand || 'Webpay Tarjeta',
      installments: params.installments || 1,
      createdAt: new Date().toISOString(),
    }

    const newAmountPaid = Math.min(booking.totalAmount, (booking.amountPaid || 0) + chargeAmount)
    const isFull = newAmountPaid >= booking.totalAmount

    booking.amountPaid = newAmountPaid
    booking.paymentStatus = isFull ? 'paid_full' : 'deposit_paid'
    booking.paymentMethod = params.gateway
    booking.paidAt = payment.createdAt
    if (booking.status === 'pending_payment') {
      booking.status = 'confirmed'
    }
    if (!booking.payments) booking.payments = []
    booking.payments.unshift(payment)

    // Register Cash Transaction automatically
    const nowFormatted = new Date()
      .toISOString()
      .replace('T', ' ')
      .slice(0, 16)

    data.cashTransactions.unshift({
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: nowFormatted,
      type: 'ingreso',
      category:
        params.gateway === 'transferencia'
          ? 'transferencia_directa'
          : 'pago_online_webpay',
      description: `${isFull ? 'Pago Total 100%' : 'Abono 50%'} Pasarela Online - ${booking.clientName} (${booking.roomCategoryName} · ${booking.id})`,
      amount: chargeAmount,
      bookingId: booking.id,
      receiptNumber: authCode,
      operator: 'Pasarela Online',
    })

    // Update Client spent
    const cIdx = data.clients.findIndex(
      (c) => c.email.toLowerCase() === booking.clientEmail.toLowerCase()
    )
    if (cIdx >= 0) {
      data.clients[cIdx].totalSpent += chargeAmount
    }

    writeDb(data)
    return { booking, payment }
  },

  // AIRBNB INBOUND EMAIL AUTOMATION ENGINE
  ingestAirbnbEmail(payload: {
    from?: string
    subject?: string
    textBody?: string
    htmlBody?: string
  }): {
    log: AirbnbEmailSyncLog
    booking?: Booking | null
  } {
    const parsed = parseAirbnbEmailPayload(payload)
    const data = readDb()

    const catObj =
      data.roomCategories.find((c) => c.slug === parsed.roomCategory) ||
      data.roomCategories[0]

    // Check if booking with this Airbnb Confirmation Code already exists
    const existingIdx = data.bookings.findIndex(
      (b) => b.externalCode && b.externalCode.toUpperCase() === parsed.airbnbCode.toUpperCase()
    )

    // Case 1: Cancellation Email
    if (parsed.eventType === 'reservation_cancelled') {
      let cancelledBooking: Booking | null = null
      if (existingIdx >= 0) {
        data.bookings[existingIdx].status = 'cancelled'
        data.bookings[existingIdx].updatedAt = new Date().toISOString()
        const roomNum = data.bookings[existingIdx].assignedRoomNumber
        if (roomNum) {
          const uIdx = data.roomUnits.findIndex((u) => u.number === roomNum && u.currentBookingId === data.bookings[existingIdx].id)
          if (uIdx >= 0) {
            data.roomUnits[uIdx].status = 'disponible'
            data.roomUnits[uIdx].currentBookingId = undefined
          }
        }
        cancelledBooking = data.bookings[existingIdx]
      }

      const log: AirbnbEmailSyncLog = {
        id: `AIR-LOG-${Date.now().toString().slice(-5)}`,
        receivedAt: new Date().toISOString(),
        fromEmail: payload.from || 'automated@airbnb.com',
        subject: payload.subject || `Cancelación Airbnb ${parsed.airbnbCode}`,
        airbnbCode: parsed.airbnbCode,
        eventType: 'reservation_cancelled',
        guestName: parsed.guestName,
        roomCategoryDetected: parsed.roomCategory,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        totalAmount: parsed.totalAmountCLP,
        bookingIdCreated: cancelledBooking?.id,
        status: 'cancelled_updated',
        rawSnippet: `${parsed.airbnbCode} |Reserva Cancelada — Fechas liberadas automáticamente.`,
      }
      data.airbnbLogs.unshift(log)
      data.airbnbConfig.lastSyncAt = log.receivedAt
      writeDb(data)
      return { log, booking: cancelledBooking }
    }

    // Case 2: Duplicate Confirmation (Idempotency guard)
    if (existingIdx >= 0 && parsed.eventType === 'reservation_confirmed') {
      const existing = data.bookings[existingIdx]
      const log: AirbnbEmailSyncLog = {
        id: `AIR-LOG-${Date.now().toString().slice(-5)}`,
        receivedAt: new Date().toISOString(),
        fromEmail: payload.from || 'automated@airbnb.com',
        subject: payload.subject || `Comprobante Airbnb ${parsed.airbnbCode}`,
        airbnbCode: parsed.airbnbCode,
        eventType: 'reservation_confirmed',
        guestName: existing.clientName,
        roomCategoryDetected: existing.roomCategory,
        checkInDate: existing.checkInDate,
        checkOutDate: existing.checkOutDate,
        totalAmount: existing.totalAmount,
        bookingIdCreated: existing.id,
        status: 'duplicate_skipped',
        rawSnippet: `Código ${parsed.airbnbCode} ya registrado en ${existing.id} (idempotencia activa).`,
      }
      data.airbnbLogs.unshift(log)
      data.airbnbConfig.lastSyncAt = log.receivedAt
      writeDb(data)
      return { log, booking: existing }
    }

    // Case 3: New Confirmed or Modified Reservation from Airbnb Email
    const assignedRoom = data.airbnbConfig.autoAssignRoom
      ? this.findAvailableRoomNumber(parsed.roomCategory, parsed.checkInDate, parsed.checkOutDate) || undefined
      : undefined

    const bookingId =
      existingIdx >= 0
        ? data.bookings[existingIdx].id
        : `ARH-2026-${Math.floor(1000 + Math.random() * 9000)}`

    const nights = Math.max(1, calculateNights(parsed.checkInDate, parsed.checkOutDate))
    const ratePerNight = Math.round(parsed.totalAmountCLP / nights)

    const syncedBooking: Booking = {
      id: bookingId,
      externalCode: parsed.airbnbCode,
      source: 'airbnb_email',
      roomCategory: parsed.roomCategory,
      roomCategoryName: catObj.name,
      assignedRoomNumber: assignedRoom,
      clientName: parsed.guestName,
      clientEmail: parsed.guestEmail,
      clientPhone: parsed.guestPhone,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      nightsCount: nights,
      guestsCount: parsed.guestsCount,
      ratePerNight,
      totalAmount: parsed.totalAmountCLP,
      depositRequired: Math.round(parsed.totalAmountCLP * 0.5),
      amountPaid: parsed.totalAmountCLP,
      paymentStatus: 'paid_full',
      paymentMethod: 'airbnb_payout',
      paidAt: new Date().toISOString(),
      status: 'confirmed',
      requiresParking: true,
      specialRequests: parsed.notes,
      createdAt: new Date().toISOString(),
    }

    // Re-read fresh data before mutating
    const fresh = readDb()
    if (existingIdx >= 0) {
      fresh.bookings[existingIdx] = syncedBooking
    } else {
      fresh.bookings.unshift(syncedBooking)
    }

    if (fresh.airbnbConfig.autoRegisterCash && existingIdx === -1) {
      fresh.cashTransactions.unshift({
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'ingreso',
        category: 'payout_airbnb',
        description: `Sync Correo Airbnb ${parsed.airbnbCode} - ${parsed.guestName} (${catObj.name})`,
        amount: parsed.totalAmountCLP,
        bookingId: syncedBooking.id,
        receiptNumber: `AIR-${parsed.airbnbCode}`,
        operator: 'Webhook Correo Airbnb',
      })
    }

    // Upsert Client
    const cliIdx = fresh.clients.findIndex(
      (c) => c.name.toLowerCase() === parsed.guestName.toLowerCase()
    )
    if (cliIdx === -1) {
      fresh.clients.unshift({
        id: `CLI-${Date.now().toString().slice(-4)}`,
        name: parsed.guestName,
        rutOrPassport: `Airbnb ${parsed.airbnbCode}`,
        phone: parsed.guestPhone,
        email: parsed.guestEmail,
        origin: 'Airbnb',
        totalStays: 1,
        totalSpent: parsed.totalAmountCLP,
        lastStayDate: parsed.checkInDate,
        favoriteRoom: `${catObj.name}${assignedRoom ? ` (${assignedRoom})` : ''}`,
      })
    }

    const log: AirbnbEmailSyncLog = {
      id: `AIR-LOG-${Date.now().toString().slice(-5)}`,
      receivedAt: new Date().toISOString(),
      fromEmail: payload.from || 'automated@airbnb.com',
      subject: payload.subject || `¡Reserva confirmada! ${parsed.guestName} (${parsed.airbnbCode})`,
      airbnbCode: parsed.airbnbCode,
      eventType: parsed.eventType,
      guestName: parsed.guestName,
      roomCategoryDetected: parsed.roomCategory,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      totalAmount: parsed.totalAmountCLP,
      bookingIdCreated: syncedBooking.id,
      status: 'synced',
      rawSnippet: `Código: ${parsed.airbnbCode} | ${catObj.name}${assignedRoom ? ` (Hab. ${assignedRoom})` : ''} | ${parsed.checkInDate} → ${parsed.checkOutDate} | $${parsed.totalAmountCLP.toLocaleString('es-CL')} CLP`,
    }

    fresh.airbnbLogs.unshift(log)
    fresh.airbnbConfig.lastSyncAt = log.receivedAt
    fresh.airbnbConfig.totalSyncedCount = (fresh.airbnbConfig.totalSyncedCount || 0) + 1

    writeDb(fresh)
    return { log, booking: syncedBooking }
  },

  getAirbnbLogs(): AirbnbEmailSyncLog[] {
    return readDb().airbnbLogs
  },

  getAirbnbConfig(): AirbnbIntegrationConfig {
    return readDb().airbnbConfig
  },

  updateAirbnbConfig(updates: Partial<AirbnbIntegrationConfig>): AirbnbIntegrationConfig {
    const data = readDb()
    data.airbnbConfig = { ...data.airbnbConfig, ...updates }
    writeDb(data)
    return data.airbnbConfig
  },

  // DIGITAL CHECK-IN & PARKING REGISTRATION
  saveCheckIn(bookingId: string, checkinData: CheckInData): Booking | null {
    const data = readDb()
    const clean = bookingId.trim().toUpperCase()
    const idx = data.bookings.findIndex(
      (b) =>
        b.id.toUpperCase() === clean ||
        (b.externalCode && b.externalCode.toUpperCase() === clean)
    )
    if (idx === -1) return null

    const booking = data.bookings[idx]
    booking.checkin = {
      ...checkinData,
      checkedInAt: checkinData.checkedInAt || new Date().toISOString(),
    }
    booking.vehiclesCount = checkinData.vehiclesCount
    booking.vehiclePlates = checkinData.vehiclePlates
    if (booking.status === 'confirmed') {
      booking.status = 'checked_in'
    }

    if (booking.assignedRoomNumber) {
      const uIdx = data.roomUnits.findIndex((u) => u.number === booking.assignedRoomNumber)
      if (uIdx >= 0) {
        data.roomUnits[uIdx].status = 'ocupada'
        data.roomUnits[uIdx].currentBookingId = booking.id
      }
    }

    // Register vehicle in Parking Security Log if plate provided
    for (const plate of checkinData.vehiclePlates) {
      if (!plate) continue
      const exists = data.parkingRecords.some(
        (p) => p.vehiclePlate === plate && p.status === 'estacionado'
      )
      if (!exists) {
        data.parkingRecords.unshift({
          id: `PRK-${Date.now().toString().slice(-4)}`,
          bookingId: booking.id,
          roomNumber: booking.assignedRoomNumber,
          guestName: booking.clientName,
          guestRut: booking.clientRut,
          guestPhone: booking.clientPhone,
          vehiclePlate: plate,
          parkingSpot: 'Estacionamiento Interior Seguro',
          entryTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'estacionado',
          notes: 'Check-in Digital QR verificado',
        })
      }
    }

    writeDb(data)
    return booking
  },

  // INSPECTION & HOUSEKEEPING TICKETS
  saveTicket(bookingId: string, ticket: InspectionTicket): Booking | null {
    const data = readDb()
    const clean = bookingId.trim().toUpperCase()
    const idx = data.bookings.findIndex((b) => b.id.toUpperCase() === clean)
    if (idx === -1) return null

    const b = data.bookings[idx]
    if (!b.tickets) b.tickets = []
    const tIdx = b.tickets.findIndex((t) => t.id === ticket.id)
    if (tIdx >= 0) b.tickets[tIdx] = ticket
    else b.tickets.unshift(ticket)

    if (ticket.type === 'revision_checkout' && ticket.status === 'aprobado') {
      b.status = 'completed'
      if (b.assignedRoomNumber) {
        const uIdx = data.roomUnits.findIndex((u) => u.number === b.assignedRoomNumber)
        if (uIdx >= 0) {
          data.roomUnits[uIdx].status = 'disponible'
          data.roomUnits[uIdx].currentBookingId = undefined
          data.roomUnits[uIdx].lastCleanedAt = new Date().toISOString()
        }
      }
    }

    writeDb(data)
    return b
  },

  getAllTickets() {
    const data = readDb()
    const list: Array<InspectionTicket & { clientName: string; roomCategoryName: string }> = []
    for (const b of data.bookings) {
      for (const t of b.tickets || []) {
        list.push({
          ...t,
          roomNumber: t.roomNumber || b.assignedRoomNumber,
          clientName: b.clientName,
          roomCategoryName: b.roomCategoryName,
        })
      }
    }
    return list
  },

  // BLOCKED DATES
  getBlockedDates(): BlockedRoomDate[] {
    return readDb().blockedDates
  },

  addBlockedDate(input: Omit<BlockedRoomDate, 'id' | 'createdAt'>): BlockedRoomDate {
    const data = readDb()
    const block: BlockedRoomDate = {
      ...input,
      id: `BLK-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
    }
    data.blockedDates.unshift(block)
    writeDb(data)
    return block
  },

  removeBlockedDate(id: string): boolean {
    const data = readDb()
    const before = data.blockedDates.length
    data.blockedDates = data.blockedDates.filter((b) => b.id !== id)
    writeDb(data)
    return data.blockedDates.length < before
  },

  // CASH & FINANCES
  getCashTransactions(): CashTransaction[] {
    return readDb().cashTransactions
  },

  addCashTransaction(tx: Omit<CashTransaction, 'id'>): CashTransaction {
    const data = readDb()
    const record: CashTransaction = {
      ...tx,
      id: `TX-${Date.now().toString().slice(-4)}`,
    }
    data.cashTransactions.unshift(record)
    writeDb(data)
    return record
  },

  getCashSummary() {
    const txs = readDb().cashTransactions
    let totalIncome = 0
    let totalExpense = 0
    let webpayIncome = 0
    let airbnbIncome = 0

    for (const t of txs) {
      if (t.type === 'ingreso') {
        totalIncome += t.amount
        if (t.category === 'pago_online_webpay') webpayIncome += t.amount
        if (t.category === 'payout_airbnb') airbnbIncome += t.amount
      } else {
        totalExpense += Math.abs(t.amount)
      }
    }

    return {
      availableBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      webpayIncome,
      airbnbIncome,
    }
  },

  // CLIENTS CRM
  getClients(): Client[] {
    return readDb().clients
  },

  // PARKING & SECURITY
  getParkingRecords(): ParkingRecord[] {
    return readDb().parkingRecords
  },

  addParkingRecord(input: Omit<ParkingRecord, 'id' | 'entryTime'>): ParkingRecord {
    const data = readDb()
    const rec: ParkingRecord = {
      ...input,
      id: `PRK-${Date.now().toString().slice(-4)}`,
      entryTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }
    data.parkingRecords.unshift(rec)
    writeDb(data)
    return rec
  },

  checkoutParkingRecord(id: string): ParkingRecord | null {
    const data = readDb()
    const idx = data.parkingRecords.findIndex((p) => p.id === id)
    if (idx === -1) return null
    data.parkingRecords[idx].status = 'retirado'
    data.parkingRecords[idx].exitTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
    writeDb(data)
    return data.parkingRecords[idx]
  },

  // SOLICITUDES WEB CRM
  getSolicitudes(): SolicitudFormulario[] {
    return readDb().solicitudes
  },

  addSolicitud(
    input: Omit<SolicitudFormulario, 'id' | 'createdAt' | 'estado'>
  ): SolicitudFormulario {
    const data = readDb()
    const sol: SolicitudFormulario = {
      ...input,
      id: `SOL-${Date.now().toString().slice(-5)}`,
      estado: 'nueva',
      createdAt: new Date().toISOString(),
    }
    data.solicitudes.unshift(sol)
    writeDb(data)
    return sol
  },

  updateSolicitud(
    id: string,
    updates: Partial<SolicitudFormulario>
  ): SolicitudFormulario | null {
    const data = readDb()
    const idx = data.solicitudes.findIndex((s) => s.id === id)
    if (idx === -1) return null
    data.solicitudes[idx] = { ...data.solicitudes[idx], ...updates }
    writeDb(data)
    return data.solicitudes[idx]
  },

  // EXECUTIVE HOTEL KPIs
  getDashboardMetrics() {
    const data = readDb()
    const totalUnits = data.roomUnits.length
    const occupiedUnits = data.roomUnits.filter((u) => u.status === 'ocupada').length
    const cleaningUnits = data.roomUnits.filter((u) => u.status === 'aseo_pendiente').length
    const availableUnits = data.roomUnits.filter((u) => u.status === 'disponible').length

    const activeBookings = data.bookings.filter((b) => b.status !== 'cancelled')
    const totalRevenueBooked = activeBookings.reduce((acc, b) => acc + b.totalAmount, 0)
    const totalNightsBooked = activeBookings.reduce((acc, b) => acc + b.nightsCount, 0)
    const adr = totalNightsBooked > 0 ? Math.round(totalRevenueBooked / totalNightsBooked) : 57000
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
    const revPar = Math.round((adr * occupancyRate) / 100)

    const todayStr = new Date().toISOString().split('T')[0]
    const checkInsToday = activeBookings.filter((b) => b.checkInDate === todayStr)
    const checkOutsToday = activeBookings.filter((b) => b.checkOutDate === todayStr)

    const bySource = {
      web_online: activeBookings.filter((b) => b.source === 'web_online').length,
      airbnb_email: activeBookings.filter((b) => b.source === 'airbnb_email').length,
      recepcion_directa: activeBookings.filter(
        (b) => b.source === 'recepcion_directa' || b.source === 'whatsapp'
      ).length,
    }

    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      cleaningUnits,
      occupancyRate,
      adr,
      revPar,
      totalRevenueBooked,
      checkInsTodayCount: checkInsToday.length,
      checkOutsTodayCount: checkOutsToday.length,
      activeVehicles: data.parkingRecords.filter((p) => p.status === 'estacionado').length,
      pendingSolicitudes: data.solicitudes.filter((s) => s.estado === 'nueva').length,
      airbnbSyncedTotal: data.airbnbConfig.totalSyncedCount,
      bySource,
      cash: this.getCashSummary(),
    }
  },
}
