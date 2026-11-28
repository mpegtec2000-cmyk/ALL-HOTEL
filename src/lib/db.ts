import fs from 'fs'
import path from 'path'
import {
  AirbnbEmailAccountConfig,
  AirbnbEmailSyncLog,
  AirbnbIntegrationConfig,
  BlockedRoomDate,
  Booking,
  BookingQrStatus,
  CashTransaction,
  CheckInData,
  Client,
  EmailOutboxLog,
  HotelSettings,
  InspectionTicket,
  ParkingRecord,
  PaymentMethod,
  PaymentRecord,
  QrScanEventLog,
  RoomCategory,
  RoomCategorySlug,
  RoomCostCenterSummary,
  RoomUnit,
} from '@/types/saas'
import {
  calculateNights,
  DEFAULT_HOTEL_SETTINGS,
  INITIAL_ROOM_UNITS,
  OFFICIAL_ROOM_CATEGORIES,
} from './pricing'
import { parseAirbnbEmailPayload } from './airbnb-parser'
import {
  generateBookingQrToken,
  generateDeterministicSeedQrToken,
  generateUniqueBookingId,
  parseAndVerifyQrInput,
} from './qr-engine'
import {
  buildBookingConfirmationEmailHtml,
  dispatchBookingConfirmationEmail,
} from './email-service'

interface HotelDatabaseSchema {
  settings: HotelSettings
  roomCategories: RoomCategory[]
  roomUnits: RoomUnit[]
  bookings: Booking[]
  blockedDates: BlockedRoomDate[]
  airbnbConfig: AirbnbIntegrationConfig
  airbnbLogs: AirbnbEmailSyncLog[]
  emailOutbox: EmailOutboxLog[]
  cashTransactions: CashTransaction[]
  clients: Client[]
  parkingRecords: ParkingRecord[]
  solicitudes: import('@/types/saas').SolicitudFormulario[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'all_rent_hoteles_db.json')

const DEFAULT_AIRBNB_ACCOUNTS: AirbnbEmailAccountConfig[] = [
  {
    id: 'account_1',
    label: 'Cuenta Airbnb #1 (Principal)',
    holderName: 'Cuenta Registrada Airbnb 1',
    email: 'reservas@allrenthoteles.cl',
    appPassword: '',
    appPasswordConfigured: false,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    enabled: true,
    lastSyncAt: '2026-11-24T22:15:00-03:00',
    syncedCount: 1,
  },
  {
    id: 'account_2',
    label: 'Cuenta Airbnb #2 (Secundaria)',
    holderName: 'Cuenta Registrada Airbnb 2',
    email: 'administracion@allrenthoteles.cl',
    appPassword: '',
    appPasswordConfigured: false,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    enabled: true,
    lastSyncAt: '2026-11-23T18:40:00-03:00',
    syncedCount: 1,
  },
]

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'ARH-2026-1042',
    source: 'web_online',
    roomCategory: 'superior_matrimonial',
    roomCategoryName: 'Superior Matrimonial',
    assignedRoomNumber: '107',
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
    vehiclePlates: ['PBYR-94'],
    requiresParking: true,
    specialRequests: 'Llegada puntual a las 12:15 hrs. Estacionamiento interior.',
    createdAt: '2026-11-22T16:28:00Z',
    qrToken: generateDeterministicSeedQrToken('ARH-2026-1042', 'v.contreras@gmail.com'),
    qrStatus: 'checked_in_active',
    qrIssuedAt: '2026-11-22T16:30:00Z',
    qrCheckInAt: '2026-11-24T12:18:00Z',
    confirmationEmailSent: true,
    qrScanLogs: [
      {
        id: 'QRL-1042-1',
        bookingId: 'ARH-2026-1042',
        qrToken: generateDeterministicSeedQrToken('ARH-2026-1042', 'v.contreras@gmail.com'),
        action: 'checkin_entry',
        operatorName: 'Recepción Portería All Rent',
        timestamp: '2026-11-24T12:18:00Z',
        notes: '1° Uso QR: Check-in de Entrada verificado. Vehículo PBYR-94 ingresado.',
      },
    ],
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
        id: 'TCK-107-A',
        bookingId: 'ARH-2026-1042',
        roomNumber: '107',
        type: 'alistamiento_previo',
        title: 'Hab. 107 Lista para Check-in 12:00',
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
    specialRequests: 'Sincronizado automáticamente desde correo Airbnb #2 (HM4R7T2N8Q).',
    createdAt: '2026-11-23T18:40:00Z',
    qrToken: generateDeterministicSeedQrToken('ARH-2026-1041', 'martin.lagos@outlook.cl'),
    qrStatus: 'checked_in_active',
    qrIssuedAt: '2026-11-23T18:40:00Z',
    qrCheckInAt: '2026-11-24T13:05:00Z',
    confirmationEmailSent: true,
    qrScanLogs: [
      {
        id: 'QRL-1041-1',
        bookingId: 'ARH-2026-1041',
        qrToken: generateDeterministicSeedQrToken('ARH-2026-1041', 'martin.lagos@outlook.cl'),
        action: 'checkin_entry',
        operatorName: 'Recepción Portería All Rent',
        timestamp: '2026-11-24T13:05:00Z',
        notes: '1° Uso QR: Check-in de Entrada desde reserva Airbnb HM4R7T2N8Q.',
      },
    ],
  },
  {
    id: 'ARH-2026-1043',
    externalCode: 'HM8P3K9W2L',
    source: 'airbnb_email',
    roomCategory: 'familiar_terraza',
    roomCategoryName: 'Familiar con Terraza',
    assignedRoomNumber: '109',
    clientName: 'Fernanda Soto',
    clientEmail: 'fsoto.viajes@gmail.com',
    clientPhone: '+56975540912',
    clientRut: '17.210.493-8',
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
    vehiclesCount: 1,
    vehiclePlates: ['RTKP-88'],
    requiresParking: true,
    specialRequests: 'Sincronizado vía Comprobante Email Airbnb #1 (HM8P3K9W2L). Familia con 2 niños.',
    createdAt: '2026-11-24T22:15:00Z',
    qrToken: generateDeterministicSeedQrToken('ARH-2026-1043', 'fsoto.viajes@gmail.com'),
    qrStatus: 'issued',
    qrIssuedAt: '2026-11-24T22:15:00Z',
    confirmationEmailSent: true,
    qrScanLogs: [],
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
    amountPaid: 99000,
    paymentStatus: 'paid_full',
    paymentMethod: 'webpay_tarjeta',
    paidAt: '2026-11-24T19:10:00Z',
    status: 'confirmed',
    vehiclesCount: 1,
    vehiclePlates: ['KTRW-18'],
    requiresParking: true,
    specialRequests: 'Pago 100% online aprobado. Check-in 12:00 hrs.',
    createdAt: '2026-11-24T19:08:00Z',
    qrToken: generateDeterministicSeedQrToken('ARH-2026-1044', 'cnavarrete@ingenieria.cl'),
    qrStatus: 'issued',
    qrIssuedAt: '2026-11-24T19:10:00Z',
    confirmationEmailSent: true,
    qrScanLogs: [],
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
    specialRequests: 'Comisión laboral Bahía Quintero. Check-in 12:00 hrs.',
    createdAt: '2026-11-24T20:55:00Z',
    qrToken: generateDeterministicSeedQrToken('ARH-2026-1045', 'ralarcon@maritima.cl'),
    qrStatus: 'issued',
    qrIssuedAt: '2026-11-24T21:00:00Z',
    confirmationEmailSent: true,
    qrScanLogs: [],
  },
]

function buildSeedEmailOutbox(bookings: Booking[]): EmailOutboxLog[] {
  return bookings.slice(0, 4).map((b, idx) => ({
    id: `MAIL-SEED-0${idx + 1}`,
    bookingId: b.id,
    externalCode: b.externalCode,
    toEmail: b.clientEmail,
    clientName: b.clientName,
    fromAccountEmail:
      b.source === 'airbnb_email'
        ? idx % 2 === 0
          ? 'reservas@allrenthoteles.cl'
          : 'administracion@allrenthoteles.cl'
        : 'reservas@allrenthoteles.cl',
    subject:
      b.source === 'airbnb_email'
        ? `¡Gracias por reservar en All Rent Hoteles! Tu Pase QR de Check-in (${b.externalCode || b.id})`
        : `Confirmación de Reserva & Código QR de Check-in (${b.id}) — All Rent Hoteles Quintero`,
    qrToken: b.qrToken || generateDeterministicSeedQrToken(b.id, b.clientEmail),
    assignedRoomNumber: b.assignedRoomNumber,
    roomCategoryName: b.roomCategoryName,
    triggerSource:
      b.source === 'airbnb_email'
        ? 'airbnb_auto_sync'
        : b.source === 'web_online'
        ? 'web_booking'
        : 'manual_reception',
    deliveryStatus: 'stored_outbox_preview',
    sentAt: b.paidAt || b.createdAt,
    htmlBody: buildBookingConfirmationEmailHtml({
      booking: b,
      settings: DEFAULT_HOTEL_SETTINGS,
    }),
  }))
}

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
    autoSendWelcomeQrEmail: true,
    accounts: DEFAULT_AIRBNB_ACCOUNTS,
    lastSyncAt: '2026-11-24T22:15:00-03:00',
    totalSyncedCount: 2,
  },
  airbnbLogs: [
    {
      id: 'AIR-LOG-001',
      receivedAt: '2026-11-24T22:15:00-03:00',
      fromEmail: 'automated@airbnb.com',
      accountLabel: 'Cuenta Airbnb #1 (Principal)',
      subject: '¡Reserva confirmada! Fernanda Soto llega el 27 nov 2026',
      airbnbCode: 'HM8P3K9W2L',
      eventType: 'reservation_confirmed',
      guestName: 'Fernanda Soto',
      guestEmail: 'fsoto.viajes@gmail.com',
      roomCategoryDetected: 'familiar_terraza',
      assignedRoomNumber: '109',
      checkInDate: '2026-11-27',
      checkOutDate: '2026-11-29',
      totalAmount: 159000,
      bookingIdCreated: 'ARH-2026-1043',
      qrTokenGenerated: generateDeterministicSeedQrToken('ARH-2026-1043', 'fsoto.viajes@gmail.com'),
      welcomeEmailSent: true,
      status: 'synced',
      rawSnippet:
        'Código: HM8P3K9W2L | Hab. 109 · Familiar con Terraza | 2 noches | $159.000 CLP | Correo con QR enviado a fsoto.viajes@gmail.com',
    },
    {
      id: 'AIR-LOG-002',
      receivedAt: '2026-11-23T18:40:00-03:00',
      fromEmail: 'automated@airbnb.com',
      accountLabel: 'Cuenta Airbnb #2 (Secundaria)',
      subject: '¡Reserva confirmada! Martín Lagos llega el 24 nov 2026',
      airbnbCode: 'HM4R7T2N8Q',
      eventType: 'reservation_confirmed',
      guestName: 'Martín Lagos',
      guestEmail: 'martin.lagos@outlook.cl',
      roomCategoryDetected: 'standard_matrimonial',
      assignedRoomNumber: '102',
      checkInDate: '2026-11-24',
      checkOutDate: '2026-11-26',
      totalAmount: 107000,
      bookingIdCreated: 'ARH-2026-1041',
      qrTokenGenerated: generateDeterministicSeedQrToken('ARH-2026-1041', 'martin.lagos@outlook.cl'),
      welcomeEmailSent: true,
      status: 'synced',
      rawSnippet:
        'Código: HM4R7T2N8Q | Hab. 102 · Standard Matrimonial | 2 noches | $107.000 CLP | Correo con QR enviado a martin.lagos@outlook.cl',
    },
  ],
  blockedDates: [
    {
      id: 'BLK-01',
      date: '2026-12-24',
      roomCategory: 'single_individual',
      roomNumber: '105',
      reason: 'Mantención',
      createdAt: '2026-11-20T10:00:00Z',
    },
  ],
  bookings: SEED_BOOKINGS,
  emailOutbox: buildSeedEmailOutbox(SEED_BOOKINGS),
  cashTransactions: [
    {
      id: 'TX-401',
      date: '2026-11-24 22:15',
      type: 'ingreso',
      category: 'payout_airbnb',
      description: 'Reserva Airbnb Email Sync HM8P3K9W2L - Fernanda Soto (Hab. 109 · Familiar Terraza)',
      amount: 159000,
      bookingId: 'ARH-2026-1043',
      roomNumber: '109',
      receiptNumber: 'AIR-HM8P3K9W2L',
      operator: 'Sync Automático Correo #1',
    },
    {
      id: 'TX-402',
      date: '2026-11-24 21:00',
      type: 'ingreso',
      category: 'transferencia_directa',
      description: 'Pago 100% Estadía Single Individual Hab. 106 - Rodrigo Alarcón',
      amount: 39500,
      bookingId: 'ARH-2026-1045',
      roomNumber: '106',
      receiptNumber: 'TRF-99412',
      operator: 'Recepción All Rent',
    },
    {
      id: 'TX-403',
      date: '2026-11-24 19:10',
      type: 'ingreso',
      category: 'pago_online_webpay',
      description: 'Pago 100% Webpay Tarjeta - Cristóbal Navarrete (Hab. 104 · Doble Dos Camas)',
      amount: 99000,
      bookingId: 'ARH-2026-1044',
      roomNumber: '104',
      receiptNumber: 'TBK-773910',
      operator: 'Pasarela Webpay Online',
    },
    {
      id: 'TX-404',
      date: '2026-11-23 18:40',
      type: 'ingreso',
      category: 'payout_airbnb',
      description: 'Reserva Airbnb Email Sync HM4R7T2N8Q - Martín Lagos (Hab. 102 · Standard Matrimonial)',
      amount: 107000,
      bookingId: 'ARH-2026-1041',
      roomNumber: '102',
      receiptNumber: 'AIR-HM4R7T2N8Q',
      operator: 'Sync Automático Correo #2',
    },
    {
      id: 'TX-405',
      date: '2026-11-22 16:30',
      type: 'ingreso',
      category: 'pago_online_webpay',
      description: 'Pago 100% Webpay Visa - Valentina Contreras (Hab. 107 · Superior Matrimonial)',
      amount: 127000,
      bookingId: 'ARH-2026-1042',
      roomNumber: '107',
      receiptNumber: 'TBK-849201',
      operator: 'Pasarela Webpay Online',
    },
    {
      id: 'TX-406',
      date: '2026-11-23 11:15',
      type: 'gasto',
      category: 'lavanderia_blancos',
      description: 'Servicio lavandería industrial sábanas y toallas hoteleras blancas (Hab. 107)',
      amount: -18000,
      roomNumber: '107',
      receiptNumber: 'FAC-1182',
      operator: 'Administración Central',
    },
    {
      id: 'TX-407',
      date: '2026-11-21 17:40',
      type: 'gasto',
      category: 'insumos_aseo',
      description: 'Amenities baño privado, sanitización y suministros (Hab. 102)',
      amount: -14500,
      roomNumber: '102',
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
      favoriteRoom: 'Superior Matrimonial (Hab. 107)',
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
      favoriteRoom: 'Standard Matrimonial (Hab. 102)',
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
      favoriteRoom: 'Familiar con Terraza (Hab. 109)',
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
      favoriteRoom: 'Doble Dos Camas (Hab. 104)',
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
      favoriteRoom: 'Single Individual (Hab. 106)',
    },
  ],
  parkingRecords: [
    {
      id: 'PRK-01',
      bookingId: 'ARH-2026-1042',
      roomNumber: '107',
      guestName: 'Valentina Contreras',
      guestRut: '18.492.103-4',
      guestPhone: '+56987451230',
      vehiclePlate: 'PBYR-94',
      vehicleModel: 'Mazda CX-5 Gris',
      parkingSpot: 'Estacionamiento Interior #1 (CCTV)',
      entryTime: '2026-11-24 12:18',
      status: 'estacionado',
      notes: 'Portón cerrado verificado con escaneo QR de entrada.',
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
      mensaje:
        'Hola All Rent Hoteles, queremos reservar 2 habitaciones para el fin de semana de diciembre con estacionamiento para 2 autos.',
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

const LEGACY_ROOM_MAP: Record<string, string> = {
  '201': '107',
  '202': '108',
  '203': '108',
  '204': '109',
  '205': '110',
}

function normalizeDatabase(parsed: HotelDatabaseSchema): {
  data: HotelDatabaseSchema
  mutated: boolean
} {
  let mutated = false

  // Ensure exact 10 room units (Hab. 101 to Hab. 110) as Cost Centers
  let roomUnits = parsed.roomUnits || []
  const hasExact10Rooms =
    roomUnits.length === 10 &&
    roomUnits.every((u) => Number(u.number) >= 101 && Number(u.number) <= 110)

  if (!hasExact10Rooms) {
    roomUnits = structuredClone(INITIAL_ROOM_UNITS)
    mutated = true
  } else {
    roomUnits = roomUnits.map((u) => {
      const seedUnit = INITIAL_ROOM_UNITS.find((s) => s.number === u.number)
      if (!u.customName || !u.costCenterCode) {
        mutated = true
        return {
          ...u,
          customName: u.customName || seedUnit?.customName || `Hab. ${u.number}`,
          costCenterCode: u.costCenterCode || seedUnit?.costCenterCode || `CC-HAB-${u.number}`,
        }
      }
      return u
    })
  }

  // Normalize bookings: ensure 101-110 room numbers & valid cryptographic QR tokens
  const bookings = (parsed.bookings || SEED_BOOKINGS).map((b) => {
    let assignedRoomNumber = b.assignedRoomNumber
    if (assignedRoomNumber && LEGACY_ROOM_MAP[assignedRoomNumber]) {
      assignedRoomNumber = LEGACY_ROOM_MAP[assignedRoomNumber]
      mutated = true
    }

    let qrToken = b.qrToken
    if (!qrToken || !qrToken.startsWith('ARHQR.')) {
      qrToken = generateDeterministicSeedQrToken(b.id, b.clientEmail)
      mutated = true
    }

    let qrStatus: BookingQrStatus =
      b.qrStatus ||
      (b.status === 'completed'
        ? 'redeemed_closed'
        : b.status === 'checked_in'
        ? 'checked_in_active'
        : 'issued')

    if (!b.qrStatus) {
      mutated = true
    }

    return {
      ...b,
      assignedRoomNumber,
      qrToken,
      qrStatus,
      qrIssuedAt: b.qrIssuedAt || b.paidAt || b.createdAt,
      qrScanLogs: b.qrScanLogs || [],
    }
  })

  // Ensure dual-email Airbnb accounts exist
  const airbnbConfig: AirbnbIntegrationConfig = {
    ...INITIAL_SEED.airbnbConfig,
    ...(parsed.airbnbConfig || {}),
    accounts:
      parsed.airbnbConfig?.accounts && parsed.airbnbConfig.accounts.length === 2
        ? parsed.airbnbConfig.accounts
        : structuredClone(DEFAULT_AIRBNB_ACCOUNTS),
    autoSendWelcomeQrEmail:
      parsed.airbnbConfig?.autoSendWelcomeQrEmail ?? true,
  }
  if (!parsed.airbnbConfig?.accounts || parsed.airbnbConfig.accounts.length !== 2) {
    mutated = true
  }

  // Ensure emailOutbox is populated
  let emailOutbox = parsed.emailOutbox || []
  if (!Array.isArray(emailOutbox) || emailOutbox.length === 0) {
    emailOutbox = buildSeedEmailOutbox(bookings)
    mutated = true
  }

  // Ensure cashTransactions have roomNumber mapped to 101-110
  const cashTransactions = (parsed.cashTransactions || INITIAL_SEED.cashTransactions).map((tx) => {
    if (tx.roomNumber && LEGACY_ROOM_MAP[tx.roomNumber]) {
      mutated = true
      return { ...tx, roomNumber: LEGACY_ROOM_MAP[tx.roomNumber] }
    }
    if (!tx.roomNumber && tx.bookingId) {
      const linked = bookings.find((b) => b.id === tx.bookingId)
      if (linked?.assignedRoomNumber) {
        mutated = true
        return { ...tx, roomNumber: linked.assignedRoomNumber }
      }
    }
    return tx
  })

  const data: HotelDatabaseSchema = {
    ...INITIAL_SEED,
    ...parsed,
    settings: { ...DEFAULT_HOTEL_SETTINGS, ...(parsed.settings || {}) },
    roomCategories:
      parsed.roomCategories && parsed.roomCategories.length === 5
        ? parsed.roomCategories.map((c) => ({ ...c, totalUnits: 2 }))
        : OFFICIAL_ROOM_CATEGORIES,
    roomUnits,
    bookings,
    airbnbConfig,
    emailOutbox,
    cashTransactions,
  }

  return { data, mutated }
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
    const { data, mutated } = normalizeDatabase(parsed)
    if (mutated) {
      writeDb(data)
    }
    return data
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

  // ROOM CATEGORIES & 10 COST CENTER RACK UNITS
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

  // 10 ROOMS COST CENTER FINANCIAL & OPERATIONAL REPORT
  getCostCentersReport(): {
    costCenters: RoomCostCenterSummary[]
    totals: {
      totalRooms: number
      totalRevenue: number
      totalExpenses: number
      netProfit: number
      totalBookings: number
    }
  } {
    const data = readDb()
    const costCenters: RoomCostCenterSummary[] = data.roomUnits.map((unit) => {
      const cat =
        data.roomCategories.find((c) => c.slug === unit.categorySlug) ||
        data.roomCategories[0]

      const effectiveRatePerNight = unit.customRatePerNight || cat.pricePerNight

      const roomBookings = data.bookings.filter(
        (b) => b.status !== 'cancelled' && b.assignedRoomNumber === unit.number
      )

      const bookingRevenue = roomBookings.reduce(
        (sum, b) => sum + (b.amountPaid > 0 ? b.amountPaid : b.totalAmount),
        0
      )

      const extraDirectIncome = data.cashTransactions
        .filter(
          (tx) =>
            tx.type === 'ingreso' &&
            tx.roomNumber === unit.number &&
            (!tx.bookingId || !roomBookings.some((b) => b.id === tx.bookingId))
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

      const totalRevenue = bookingRevenue + extraDirectIncome

      const totalExpenses = data.cashTransactions
        .filter((tx) => tx.type === 'gasto' && tx.roomNumber === unit.number)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

      const occupiedNights = roomBookings.reduce((sum, b) => sum + b.nightsCount, 0)

      const activeBookingObj =
        roomBookings.find((b) => b.status === 'checked_in') ||
        roomBookings.find((b) => b.status === 'confirmed')

      return {
        unit,
        categoryName: cat.name,
        bathroomLabel: cat.bathroomLabel,
        effectiveRatePerNight,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        bookingsCount: roomBookings.length,
        occupiedNights,
        activeBooking: activeBookingObj
          ? {
              id: activeBookingObj.id,
              clientName: activeBookingObj.clientName,
              checkInDate: activeBookingObj.checkInDate,
              checkOutDate: activeBookingObj.checkOutDate,
              qrStatus: activeBookingObj.qrStatus,
              source: activeBookingObj.source,
            }
          : undefined,
      }
    })

    const totals = costCenters.reduce(
      (acc, cc) => ({
        totalRooms: acc.totalRooms + 1,
        totalRevenue: acc.totalRevenue + cc.totalRevenue,
        totalExpenses: acc.totalExpenses + cc.totalExpenses,
        netProfit: acc.netProfit + cc.netProfit,
        totalBookings: acc.totalBookings + cc.bookingsCount,
      }),
      { totalRooms: 0, totalRevenue: 0, totalExpenses: 0, netProfit: 0, totalBookings: 0 }
    )

    return { costCenters, totals }
  },

  // MULTI-ROOM AVAILABILITY & AUTO ROOM ASSIGNMENT ACROSS THE 10 ROOMS
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
      const isBlocked = data.blockedDates.some((blk) => {
        if (blk.date < checkInDate || blk.date >= checkOutDate) return false
        if (blk.roomCategory === 'all') return true
        if (blk.roomNumber && blk.roomNumber === unit.number) return true
        if (!blk.roomNumber && blk.roomCategory === categorySlug) return true
        return false
      })
      if (isBlocked) continue

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

    // Fallback to any available room across the 10 rooms if the specific category's 2 units are full
    for (const unit of data.roomUnits) {
      if (unit.status === 'mantencion') continue
      const hasOverlap = data.bookings.some((b) => {
        if (b.id === excludeBookingId || b.status === 'cancelled') return false
        if (b.assignedRoomNumber !== unit.number) return false
        return rangesOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)
      })
      if (!hasOverlap) {
        return unit.number
      }
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

  getBookingByCode(codeOrQr: string): Booking | null {
    const data = readDb()
    const parsed = parseAndVerifyQrInput(codeOrQr)
    const clean = parsed.bookingIdOrCode.trim().toUpperCase()
    const tokenClean = parsed.extractedToken.trim().toUpperCase()

    return (
      data.bookings.find(
        (b) =>
          (b.qrToken && b.qrToken.toUpperCase() === tokenClean) ||
          b.id.toUpperCase() === clean ||
          (b.externalCode && b.externalCode.toUpperCase() === clean)
      ) || null
    )
  },

  createBooking(input: Omit<Booking, 'id' | 'createdAt'> & { id?: string }): Booking {
    const data = readDb()
    const existingIds = data.bookings.map((b) => b.id)
    const id = input.id && !existingIds.includes(input.id)
      ? input.id
      : generateUniqueBookingId(existingIds)

    const assignedRoom =
      input.assignedRoomNumber ||
      this.findAvailableRoomNumber(input.roomCategory, input.checkInDate, input.checkOutDate) ||
      undefined

    const nowIso = new Date().toISOString()
    const existingTokens = new Set(
      data.bookings.map((b) => b.qrToken).filter(Boolean) as string[]
    )
    const uniqueQrToken = generateBookingQrToken(
      id,
      input.clientEmail,
      undefined,
      existingTokens
    )

    const newBooking: Booking = {
      ...input,
      id,
      assignedRoomNumber: assignedRoom,
      createdAt: nowIso,
      qrToken: uniqueQrToken,
      qrStatus: 'issued',
      qrIssuedAt: nowIso,
      qrScanLogs: [],
      payments: input.payments || [],
      tickets: input.tickets || [],
    }

    data.bookings.unshift(newBooking)

    // If created directly at reception as paid, record CashTransaction & Outbox Email immediately
    if (newBooking.amountPaid > 0) {
      data.cashTransactions.unshift({
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: nowIso.replace('T', ' ').slice(0, 16),
        type: 'ingreso',
        category:
          newBooking.paymentMethod === 'transferencia'
            ? 'transferencia_directa'
            : 'pago_recepcion',
        description: `Reserva Confirmada (${newBooking.id}) - ${newBooking.clientName} (Hab. ${assignedRoom || '-'} · ${newBooking.roomCategoryName})`,
        amount: newBooking.amountPaid,
        bookingId: newBooking.id,
        roomNumber: assignedRoom,
        receiptNumber: `REC-${newBooking.id.slice(-4)}`,
        operator: 'Recepción All Rent',
      })
    }

    if (newBooking.status === 'confirmed' || newBooking.status === 'checked_in') {
      const emailLog: EmailOutboxLog = {
        id: `MAIL-${Date.now().toString().slice(-5)}`,
        bookingId: newBooking.id,
        externalCode: newBooking.externalCode,
        toEmail: newBooking.clientEmail,
        clientName: newBooking.clientName,
        fromAccountEmail: data.settings.email,
        subject: `Confirmación de Reserva & Código QR de Check-in (${newBooking.id}) — All Rent Hoteles Quintero`,
        qrToken: uniqueQrToken,
        assignedRoomNumber: assignedRoom,
        roomCategoryName: newBooking.roomCategoryName,
        triggerSource:
          newBooking.source === 'web_online' ? 'web_booking' : 'manual_reception',
        deliveryStatus: 'stored_outbox_preview',
        sentAt: nowIso,
        htmlBody: buildBookingConfirmationEmailHtml({
          booking: newBooking,
          settings: data.settings,
        }),
      }
      newBooking.confirmationEmailSent = true
      newBooking.confirmationEmailId = emailLog.id
      data.emailOutbox.unshift(emailLog)
    }

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
        favoriteRoom: `${newBooking.roomCategoryName}${assignedRoom ? ` (Hab. ${assignedRoom})` : ''}`,
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

    if (updates.status === 'checked_in' && data.bookings[idx].qrStatus === 'issued') {
      updates.qrStatus = 'checked_in_active'
      updates.qrCheckInAt = new Date().toISOString()
    } else if (updates.status === 'completed') {
      updates.qrStatus = 'redeemed_closed'
      updates.qrCheckOutAt = new Date().toISOString()
    }

    data.bookings[idx] = {
      ...data.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

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
        } else if (
          updates.status === 'cancelled' &&
          data.roomUnits[uIdx].currentBookingId === b.id
        ) {
          data.roomUnits[uIdx].status = 'disponible'
          data.roomUnits[uIdx].currentBookingId = undefined
        }
      }
    }

    writeDb(data)
    return data.bookings[idx]
  },

  // STRICT 2-STEP CRYPTOGRAPHIC QR SCAN ENGINE (1 ENTRY CHECK-IN + 1 EXIT CHECK-OUT, THEN BURNED)
  scanAndProcessQr(params: {
    qrInput: string
    action: 'inspect' | 'checkin_entry' | 'checkout_exit'
    operatorName?: string
    vehiclePlate?: string
    notes?: string
  }): {
    valid: boolean
    isCryptographicQr: boolean
    signatureValid: boolean
    booking: Booking | null
    qrStatus?: BookingQrStatus
    allowedNextAction: 'checkin_entry' | 'checkout_exit' | 'none_closed' | 'invalid'
    actionExecuted?: 'inspect' | 'checkin_entry' | 'checkout_exit' | 'rejected_reuse'
    message: string
    rejectedReason?: string
  } {
    const data = readDb()
    const operator = params.operatorName || 'Admin Portería All Rent'
    const parsed = parseAndVerifyQrInput(params.qrInput)

    const idx = data.bookings.findIndex(
      (b) =>
        (b.qrToken && b.qrToken.toUpperCase() === parsed.extractedToken) ||
        b.id.toUpperCase() === parsed.bookingIdOrCode ||
        (b.externalCode && b.externalCode.toUpperCase() === parsed.bookingIdOrCode)
    )

    if (idx === -1) {
      return {
        valid: false,
        isCryptographicQr: parsed.isCryptographicQr,
        signatureValid: false,
        booking: null,
        allowedNextAction: 'invalid',
        message:
          '⛔ QR INVÁLIDO: El código escaneado no pertenece a ninguna reserva registrada en el motor de All Rent Hoteles.',
        rejectedReason: 'QR_NOT_FOUND',
      }
    }

    const booking = data.bookings[idx]
    const reVerified = parseAndVerifyQrInput(
      parsed.isCryptographicQr ? parsed.extractedToken : booking.qrToken || booking.id,
      booking.clientEmail
    )

    // Verify token matches the booking's issued unique qrToken
    if (
      parsed.isCryptographicQr &&
      booking.qrToken &&
      parsed.extractedToken !== booking.qrToken.toUpperCase()
    ) {
      return {
        valid: false,
        isCryptographicQr: true,
        signatureValid: false,
        booking: null,
        allowedNextAction: 'invalid',
        message:
          '⛔ FIRMA QR RECHAZADA: La firma criptográfica del QR no coincide con el token único emitido para esta reserva.',
        rejectedReason: 'QR_SIGNATURE_MISMATCH',
      }
    }

    const currentQrStatus: BookingQrStatus =
      booking.qrStatus ||
      (booking.status === 'completed'
        ? 'redeemed_closed'
        : booking.status === 'checked_in'
        ? 'checked_in_active'
        : 'issued')

    booking.qrStatus = currentQrStatus
    if (!booking.qrScanLogs) booking.qrScanLogs = []
    const nowIso = new Date().toISOString()

    // 1. INSPECT ONLY (VERIFY AUTHENTICITY & SHOW GUEST DATA)
    if (params.action === 'inspect') {
      const allowedNextAction =
        currentQrStatus === 'issued'
          ? 'checkin_entry'
          : currentQrStatus === 'checked_in_active'
          ? 'checkout_exit'
          : 'none_closed'

      const statusMsg =
        currentQrStatus === 'issued'
          ? `✅ QR AUTÉNTICO VERIFICADO (Uso 0/2): Listo para ejecutar Check-in de Entrada a Hab. ${booking.assignedRoomNumber || '-'}.`
          : currentQrStatus === 'checked_in_active'
          ? `🟢 QR EN ESTADÍA ACTIVA (Uso 1/2): El Check-in de Entrada ya fue realizado. Próximo y último uso habilitado: Check-out de Salida.`
          : `🔒 QR CERRADO Y QUEMADO (Uso 2/2): Este código QR ya realizó Entrada y Salida. No puede volver a utilizarse.`

      return {
        valid: currentQrStatus !== 'redeemed_closed',
        isCryptographicQr: true,
        signatureValid: reVerified.signatureValid,
        booking,
        qrStatus: currentQrStatus,
        allowedNextAction,
        actionExecuted: 'inspect',
        message: statusMsg,
        rejectedReason:
          currentQrStatus === 'redeemed_closed' ? 'QR_ALREADY_CLOSED' : undefined,
      }
    }

    // 2. EXECUTE 1ST SCAN: CHECK-IN DE ENTRADA
    if (params.action === 'checkin_entry') {
      if (currentQrStatus === 'checked_in_active') {
        const logEntry: QrScanEventLog = {
          id: `QRL-${Date.now().toString().slice(-5)}`,
          bookingId: booking.id,
          qrToken: booking.qrToken || parsed.extractedToken,
          action: 'rejected_reuse',
          operatorName: operator,
          timestamp: nowIso,
          notes: 'Intento bloqueado: El QR ya fue utilizado para Check-in de Entrada.',
        }
        booking.qrScanLogs.unshift(logEntry)
        writeDb(data)

        return {
          valid: false,
          isCryptographicQr: true,
          signatureValid: true,
          booking,
          qrStatus: currentQrStatus,
          allowedNextAction: 'checkout_exit',
          actionExecuted: 'rejected_reuse',
          rejectedReason: 'ENTRY_ALREADY_USED',
          message:
            '⚠️ ENTRADA YA UTILIZADA: Este código QR ya registró su Check-in de Entrada anteriormente. Ahora solo permite el Check-out de Salida.',
        }
      }

      if (currentQrStatus === 'redeemed_closed') {
        const logEntry: QrScanEventLog = {
          id: `QRL-${Date.now().toString().slice(-5)}`,
          bookingId: booking.id,
          qrToken: booking.qrToken || parsed.extractedToken,
          action: 'rejected_reuse',
          operatorName: operator,
          timestamp: nowIso,
          notes: 'Intento bloqueado: QR cerrado permanentemente tras Check-out.',
        }
        booking.qrScanLogs.unshift(logEntry)
        writeDb(data)

        return {
          valid: false,
          isCryptographicQr: true,
          signatureValid: true,
          booking,
          qrStatus: 'redeemed_closed',
          allowedNextAction: 'none_closed',
          actionExecuted: 'rejected_reuse',
          rejectedReason: 'QR_ALREADY_CLOSED',
          message:
            '⛔ QR YA UTILIZADO Y CERRADO (2/2): Este código QR ya completó su ciclo de Entrada y Salida y quedó permanentemente inhabilitado.',
        }
      }

      // Valid 1st use -> Transition to checked_in_active
      booking.qrStatus = 'checked_in_active'
      booking.qrCheckInAt = nowIso
      booking.status = 'checked_in'
      booking.updatedAt = nowIso

      const cleanPlate = params.vehiclePlate?.trim().toUpperCase()
      if (cleanPlate) {
        const existingPlates = booking.vehiclePlates || []
        if (!existingPlates.includes(cleanPlate)) {
          booking.vehiclePlates = [...existingPlates, cleanPlate]
          booking.vehiclesCount = booking.vehiclePlates.length
        }
      }

      booking.checkin = {
        bookingId: booking.id,
        estimatedArrival: '12:00',
        vehiclesCount: booking.vehiclePlates?.length || booking.vehiclesCount || 0,
        vehiclePlates: booking.vehiclePlates || [],
        guestList: booking.checkin?.guestList || [
          {
            name: booking.clientName,
            rutOrPassport: booking.clientRut || booking.externalCode || 'Verificado en Portería',
          },
        ],
        rulesAccepted: true,
        rulesAcceptedAt: nowIso,
        checkedInAt: nowIso,
        notes: params.notes || 'Ingreso validado mediante Escáner QR en Portería.',
      }

      // Mark Room Cost Center unit as 'ocupada'
      if (booking.assignedRoomNumber) {
        const uIdx = data.roomUnits.findIndex((u) => u.number === booking.assignedRoomNumber)
        if (uIdx >= 0) {
          data.roomUnits[uIdx].status = 'ocupada'
          data.roomUnits[uIdx].currentBookingId = booking.id
        }
      }

      // Register vehicle in Parking Log
      for (const plate of booking.vehiclePlates || []) {
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
            parkingSpot: `Estacionamiento Interior Hab. ${booking.assignedRoomNumber || ''}`,
            entryTime: nowIso.replace('T', ' ').slice(0, 16),
            status: 'estacionado',
            notes: 'Registrado automáticamente al escanear QR de Entrada.',
          })
        }
      }

      // Generate Reception Check-in Ticket automatically
      if (!booking.tickets) booking.tickets = []
      booking.tickets.unshift({
        id: `TCK-IN-${Date.now().toString().slice(-4)}`,
        bookingId: booking.id,
        roomNumber: booking.assignedRoomNumber,
        type: 'recepcion_checkin',
        title: `Entrega Hab. ${booking.assignedRoomNumber || '-'} · Check-in QR Verificado`,
        operatorName: operator,
        createdAt: nowIso,
        completedAt: nowIso,
        status: 'aprobado',
        items: [
          { id: 'qr_auth', label: 'Firma criptográfica QR y pago 100% verificados', category: 'habitacion', status: 'ok' },
          { id: 'llaves', label: 'Entrega de llaves de habitación y acceso exterior', category: 'equipamiento', status: 'ok' },
          { id: 'bano_toallas', label: 'Baño privado y set de toallas entregado conforme', category: 'bano', status: 'ok' },
          { id: 'parking_normas', label: 'Normas 12:00-12:00 y estacionamiento asignado', category: 'areas_comunes', status: 'ok' },
        ],
        generalNotes: params.notes || 'Huésped ingresado en habitación mediante escaneo QR.',
      })

      booking.qrScanLogs.unshift({
        id: `QRL-${Date.now().toString().slice(-5)}`,
        bookingId: booking.id,
        qrToken: booking.qrToken || parsed.extractedToken,
        action: 'checkin_entry',
        operatorName: operator,
        timestamp: nowIso,
        notes: params.notes || `1° Uso QR: Check-in de Entrada aprobado en Hab. ${booking.assignedRoomNumber || '-'}.`,
      })

      writeDb(data)
      return {
        valid: true,
        isCryptographicQr: true,
        signatureValid: true,
        booking,
        qrStatus: 'checked_in_active',
        allowedNextAction: 'checkout_exit',
        actionExecuted: 'checkin_entry',
        message: `✅ CHECK-IN DE ENTRADA EXITOSO (Uso 1/2): ${booking.clientName} ingresó a Hab. ${booking.assignedRoomNumber || '-'}. Este QR queda activo únicamente para el Check-out de Salida.`,
      }
    }

    // 3. EXECUTE 2ND & FINAL SCAN: CHECK-OUT DE SALIDA (BURNS & CLOSES THE QR)
    if (params.action === 'checkout_exit') {
      if (currentQrStatus === 'redeemed_closed') {
        booking.qrScanLogs.unshift({
          id: `QRL-${Date.now().toString().slice(-5)}`,
          bookingId: booking.id,
          qrToken: booking.qrToken || parsed.extractedToken,
          action: 'rejected_reuse',
          operatorName: operator,
          timestamp: nowIso,
          notes: 'Intento bloqueado: El QR ya fue cerrado en un Check-out previo.',
        })
        writeDb(data)

        return {
          valid: false,
          isCryptographicQr: true,
          signatureValid: true,
          booking,
          qrStatus: 'redeemed_closed',
          allowedNextAction: 'none_closed',
          actionExecuted: 'rejected_reuse',
          rejectedReason: 'QR_ALREADY_CLOSED',
          message:
            '⛔ QR YA UTILIZADO Y CERRADO (2/2): Este código QR ya registró su Check-out de Salida anteriormente y no puede volver a utilizarse.',
        }
      }

      if (currentQrStatus === 'issued') {
        return {
          valid: false,
          isCryptographicQr: true,
          signatureValid: true,
          booking,
          qrStatus: 'issued',
          allowedNextAction: 'checkin_entry',
          rejectedReason: 'CHECKIN_REQUIRED_FIRST',
          message:
            '⚠️ ORDEN DE CICLO QR: Este QR aún no ha registrado su Check-in de Entrada. Primero debes registrar la Entrada antes de dar la Salida.',
        }
      }

      // Valid 2nd use -> Burn & permanently close QR
      booking.qrStatus = 'redeemed_closed'
      booking.qrCheckOutAt = nowIso
      booking.status = 'completed'
      booking.updatedAt = nowIso
      if (booking.checkin) {
        booking.checkin.checkedOutAt = nowIso
      }

      // Move Room unit to 'aseo_pendiente'
      if (booking.assignedRoomNumber) {
        const uIdx = data.roomUnits.findIndex((u) => u.number === booking.assignedRoomNumber)
        if (uIdx >= 0) {
          data.roomUnits[uIdx].status = 'aseo_pendiente'
          data.roomUnits[uIdx].currentBookingId = undefined
        }
      }

      // Checkout any parked vehicles for this booking
      for (const prk of data.parkingRecords) {
        if (prk.bookingId === booking.id && prk.status === 'estacionado') {
          prk.status = 'retirado'
          prk.exitTime = nowIso.replace('T', ' ').slice(0, 16)
        }
      }

      // Create Exit Inspection Ticket
      if (!booking.tickets) booking.tickets = []
      booking.tickets.unshift({
        id: `TCK-OUT-${Date.now().toString().slice(-4)}`,
        bookingId: booking.id,
        roomNumber: booking.assignedRoomNumber,
        type: 'revision_checkout',
        title: `Salida Hab. ${booking.assignedRoomNumber || '-'} · Check-out QR & Cierre`,
        operatorName: operator,
        createdAt: nowIso,
        completedAt: nowIso,
        status: 'aprobado',
        items: [
          { id: 'llaves_dev', label: 'Recepción de llaves de habitación y control portón', category: 'equipamiento', status: 'ok' },
          { id: 'inventario', label: 'Revisión de habitación, TV y mobiliario sin daños', category: 'habitacion', status: 'ok' },
          { id: 'bano_rev', label: 'Revisión de baño privado y blancos', category: 'bano', status: 'ok' },
          { id: 'qr_burn', label: 'Cierre definitivo de Código QR (2/2 usos completados)', category: 'areas_comunes', status: 'ok' },
        ],
        generalNotes: params.notes || 'Check-out de salida completado y QR cerrado permanentemente.',
      })

      booking.qrScanLogs.unshift({
        id: `QRL-${Date.now().toString().slice(-5)}`,
        bookingId: booking.id,
        qrToken: booking.qrToken || parsed.extractedToken,
        action: 'checkout_exit',
        operatorName: operator,
        timestamp: nowIso,
        notes:
          params.notes ||
          `2° Uso QR: Check-out de Salida completado en Hab. ${booking.assignedRoomNumber || '-'}. QR quemado y cerrado definitivamente.`,
      })

      writeDb(data)
      return {
        valid: true,
        isCryptographicQr: true,
        signatureValid: true,
        booking,
        qrStatus: 'redeemed_closed',
        allowedNextAction: 'none_closed',
        actionExecuted: 'checkout_exit',
        message: `🔒 CHECK-OUT DE SALIDA COMPLETADO Y QR CERRADO (Uso 2/2): Estadía finalizada para ${booking.clientName}. La Hab. ${booking.assignedRoomNumber || '-'} pasó a Aseo Pendiente y este QR ya no puede volver a usarse.`,
      }
    }

    return {
      valid: false,
      isCryptographicQr: parsed.isCryptographicQr,
      signatureValid: false,
      booking,
      allowedNextAction: 'invalid',
      message: 'Acción de escaneo no reconocida.',
    }
  },

  // PORTERÍA EXTRA DAYS / EXTRA CHARGE EXTENSION
  extendBookingStayInPorteria(params: {
    bookingId: string
    extraNights: number
    extraAmount?: number
    paymentMethod?: PaymentMethod
    notes?: string
    operatorName?: string
  }): Booking | null {
    const data = readDb()
    const clean = params.bookingId.trim().toUpperCase()
    const idx = data.bookings.findIndex(
      (b) =>
        b.id.toUpperCase() === clean ||
        (b.externalCode && b.externalCode.toUpperCase() === clean)
    )
    if (idx === -1) return null

    const booking = data.bookings[idx]
    const extraNights = Math.max(0, Number(params.extraNights) || 0)
    const calculatedExtra =
      params.extraAmount !== undefined && Number(params.extraAmount) > 0
        ? Number(params.extraAmount)
        : extraNights * booking.ratePerNight

    if (extraNights > 0) {
      const currentOut = new Date(booking.checkOutDate + 'T12:00:00')
      currentOut.setDate(currentOut.getDate() + extraNights)
      booking.checkOutDate = currentOut.toISOString().split('T')[0]
      booking.nightsCount += extraNights
      booking.extraDaysAdded = (booking.extraDaysAdded || 0) + extraNights
    }

    if (calculatedExtra > 0) {
      booking.totalAmount += calculatedExtra
      booking.amountPaid += calculatedExtra
      booking.paymentStatus = 'paid_full'
      booking.extraChargesAmount = (booking.extraChargesAmount || 0) + calculatedExtra
      booking.extraChargesNotes =
        params.notes || `Extensión en Portería (+${extraNights} noches)`

      const nowIso = new Date().toISOString()
      const gateway = params.paymentMethod || 'efectivo_recepcion'
      const authCode = `PRT-${Math.floor(10000 + Math.random() * 90000)}`

      if (!booking.payments) booking.payments = []
      booking.payments.unshift({
        id: `PAY-${Date.now().toString().slice(-5)}`,
        bookingId: booking.id,
        gateway,
        amount: calculatedExtra,
        paymentMode: 'full_100',
        status: 'approved',
        authorizationCode: authCode,
        cardBrand: 'Cobro Extra en Portería',
        createdAt: nowIso,
      })

      data.cashTransactions.unshift({
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: nowIso.replace('T', ' ').slice(0, 16),
        type: 'ingreso',
        category: 'cobro_extra_porteria',
        description: `Extensión Estadía / Cobro Extra Portería (+${extraNights} noches) - ${booking.clientName} (Hab. ${booking.assignedRoomNumber || '-'} · ${booking.id})`,
        amount: calculatedExtra,
        bookingId: booking.id,
        roomNumber: booking.assignedRoomNumber,
        receiptNumber: authCode,
        operator: params.operatorName || 'Portería All Rent',
      })

      const cIdx = data.clients.findIndex(
        (c) => c.email.toLowerCase() === booking.clientEmail.toLowerCase()
      )
      if (cIdx >= 0) {
        data.clients[cIdx].totalSpent += calculatedExtra
      }
    }

    booking.updatedAt = new Date().toISOString()
    writeDb(data)
    return booking
  },

  // ONLINE PAYMENT GATEWAY PROCESSING (100% TOTAL PAYMENT + AUTOMATIC QR EMAIL)
  processBookingPayment(params: {
    bookingId: string
    gateway: PaymentMethod
    paymentMode: 'full_100' | 'deposit_50' | 'balance_50'
    cardLast4?: string
    cardBrand?: string
    installments?: number
    externalReference?: string
  }): { booking: Booking; payment: PaymentRecord; emailLog: EmailOutboxLog } | null {
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
      params.externalReference || `TBK-${Math.floor(100000 + Math.random() * 900000)}`

    const nowIso = new Date().toISOString()
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
      createdAt: nowIso,
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
    if (!booking.qrToken) {
      booking.qrToken = generateBookingQrToken(booking.id, booking.clientEmail)
    }
    if (!booking.qrStatus) {
      booking.qrStatus = 'issued'
      booking.qrIssuedAt = nowIso
    }
    if (!booking.payments) booking.payments = []
    booking.payments.unshift(payment)

    // Register Cash Transaction linked to the assigned Room Cost Center
    const nowFormatted = nowIso.replace('T', ' ').slice(0, 16)
    data.cashTransactions.unshift({
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: nowFormatted,
      type: 'ingreso',
      category:
        params.gateway === 'transferencia'
          ? 'transferencia_directa'
          : 'pago_online_webpay',
      description: `${isFull ? 'Pago Total 100%' : 'Abono 50%'} Online - ${booking.clientName} (Hab. ${booking.assignedRoomNumber || '-'} · ${booking.roomCategoryName} · ${booking.id})`,
      amount: chargeAmount,
      bookingId: booking.id,
      roomNumber: booking.assignedRoomNumber,
      receiptNumber: authCode,
      operator: 'Pasarela Online',
    })

    // Generate & Store Automated Branded Confirmation Email with Unique QR
    const emailLog: EmailOutboxLog = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      bookingId: booking.id,
      externalCode: booking.externalCode,
      toEmail: booking.clientEmail,
      clientName: booking.clientName,
      fromAccountEmail: data.settings.email,
      subject: `Confirmación de Reserva & Código QR de Check-in (${booking.id}) — All Rent Hoteles Quintero`,
      qrToken: booking.qrToken,
      assignedRoomNumber: booking.assignedRoomNumber,
      roomCategoryName: booking.roomCategoryName,
      triggerSource: 'web_booking',
      deliveryStatus: 'stored_outbox_preview',
      sentAt: nowIso,
      htmlBody: buildBookingConfirmationEmailHtml({
        booking,
        settings: data.settings,
      }),
    }
    booking.confirmationEmailSent = true
    booking.confirmationEmailId = emailLog.id
    data.emailOutbox.unshift(emailLog)

    const cIdx = data.clients.findIndex(
      (c) => c.email.toLowerCase() === booking.clientEmail.toLowerCase()
    )
    if (cIdx >= 0) {
      data.clients[cIdx].totalSpent += chargeAmount
    }

    writeDb(data)
    return { booking, payment, emailLog }
  },

  // AIRBNB INBOUND EMAIL AUTOMATION ENGINE (DUAL EMAIL ACCOUNTS + AUTO QR EMAIL TO GUEST)
  ingestAirbnbEmail(payload: {
    from?: string
    accountId?: 'account_1' | 'account_2'
    accountLabel?: string
    subject?: string
    textBody?: string
    htmlBody?: string
  }): {
    log: AirbnbEmailSyncLog
    booking?: Booking | null
    emailLog?: EmailOutboxLog | null
  } {
    const parsed = parseAirbnbEmailPayload(payload)
    const data = readDb()

    const catObj =
      data.roomCategories.find((c) => c.slug === parsed.roomCategory) ||
      data.roomCategories[0]

    const accountUsed =
      data.airbnbConfig.accounts.find((a) => a.id === payload.accountId) ||
      data.airbnbConfig.accounts[0]

    const accountLabel =
      payload.accountLabel || accountUsed?.label || 'Cuenta Airbnb #1 (Principal)'

    const existingIdx = data.bookings.findIndex(
      (b) => b.externalCode && b.externalCode.toUpperCase() === parsed.airbnbCode.toUpperCase()
    )

    // Case 1: Cancellation Email
    if (parsed.eventType === 'reservation_cancelled') {
      let cancelledBooking: Booking | null = null
      if (existingIdx >= 0) {
        data.bookings[existingIdx].status = 'cancelled'
        data.bookings[existingIdx].qrStatus = 'redeemed_closed'
        data.bookings[existingIdx].updatedAt = new Date().toISOString()
        const roomNum = data.bookings[existingIdx].assignedRoomNumber
        if (roomNum) {
          const uIdx = data.roomUnits.findIndex(
            (u) => u.number === roomNum && u.currentBookingId === data.bookings[existingIdx].id
          )
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
        accountLabel,
        subject: payload.subject || `Cancelación Airbnb ${parsed.airbnbCode}`,
        airbnbCode: parsed.airbnbCode,
        eventType: 'reservation_cancelled',
        guestName: parsed.guestName,
        guestEmail: parsed.guestEmail,
        roomCategoryDetected: parsed.roomCategory,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        totalAmount: parsed.totalAmountCLP,
        bookingIdCreated: cancelledBooking?.id,
        status: 'cancelled_updated',
        rawSnippet: `${parsed.airbnbCode} | Reserva Cancelada — Habitación liberada y QR anulado automáticamente.`,
      }
      data.airbnbLogs.unshift(log)
      data.airbnbConfig.lastSyncAt = log.receivedAt
      writeDb(data)
      return { log, booking: cancelledBooking, emailLog: null }
    }

    // Case 2: Duplicate Confirmation (Idempotency guard)
    if (existingIdx >= 0 && parsed.eventType === 'reservation_confirmed') {
      const existing = data.bookings[existingIdx]
      const log: AirbnbEmailSyncLog = {
        id: `AIR-LOG-${Date.now().toString().slice(-5)}`,
        receivedAt: new Date().toISOString(),
        fromEmail: payload.from || 'automated@airbnb.com',
        accountLabel,
        subject: payload.subject || `Comprobante Airbnb ${parsed.airbnbCode}`,
        airbnbCode: parsed.airbnbCode,
        eventType: 'reservation_confirmed',
        guestName: existing.clientName,
        guestEmail: existing.clientEmail,
        roomCategoryDetected: existing.roomCategory,
        assignedRoomNumber: existing.assignedRoomNumber,
        checkInDate: existing.checkInDate,
        checkOutDate: existing.checkOutDate,
        totalAmount: existing.totalAmount,
        bookingIdCreated: existing.id,
        qrTokenGenerated: existing.qrToken,
        welcomeEmailSent: existing.confirmationEmailSent,
        status: 'duplicate_skipped',
        rawSnippet: `Código ${parsed.airbnbCode} ya registrado en ${existing.id} (Hab. ${existing.assignedRoomNumber || '-'} · QR único ya emitido).`,
      }
      data.airbnbLogs.unshift(log)
      data.airbnbConfig.lastSyncAt = log.receivedAt
      writeDb(data)
      return { log, booking: existing, emailLog: null }
    }

    // Case 3: New Confirmed or Modified Reservation from Airbnb Email
    const assignedRoom = data.airbnbConfig.autoAssignRoom
      ? this.findAvailableRoomNumber(parsed.roomCategory, parsed.checkInDate, parsed.checkOutDate) ||
        undefined
      : undefined

    const bookingId =
      existingIdx >= 0
        ? data.bookings[existingIdx].id
        : generateUniqueBookingId(data.bookings.map((b) => b.id))

    const nights = Math.max(1, calculateNights(parsed.checkInDate, parsed.checkOutDate))
    const ratePerNight = Math.round(parsed.totalAmountCLP / nights)
    const nowIso = new Date().toISOString()
    const existingTokens = new Set(
      data.bookings.map((b) => b.qrToken).filter(Boolean) as string[]
    )
    const uniqueQrToken =
      existingIdx >= 0 && data.bookings[existingIdx].qrToken
        ? data.bookings[existingIdx].qrToken!
        : generateBookingQrToken(bookingId, parsed.guestEmail, undefined, existingTokens)

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
      paidAt: nowIso,
      status: 'confirmed',
      requiresParking: true,
      specialRequests: `${parsed.notes} (Sincronizado desde ${accountLabel})`,
      createdAt: nowIso,
      qrToken: uniqueQrToken,
      qrStatus: 'issued',
      qrIssuedAt: nowIso,
      qrScanLogs: [],
      confirmationEmailSent: true,
    }

    const fresh = readDb()

    // Build and log the automated branded Welcome Email with QR to the Airbnb Guest
    const emailLog: EmailOutboxLog = {
      id: `MAIL-${Date.now().toString().slice(-5)}`,
      bookingId: syncedBooking.id,
      externalCode: syncedBooking.externalCode,
      toEmail: syncedBooking.clientEmail,
      clientName: syncedBooking.clientName,
      fromAccountEmail: accountUsed?.email || fresh.settings.email,
      subject: `¡Gracias por reservar en All Rent Hoteles! Tu Pase QR de Check-in (${parsed.airbnbCode})`,
      qrToken: uniqueQrToken,
      assignedRoomNumber: assignedRoom,
      roomCategoryName: catObj.name,
      triggerSource: 'airbnb_auto_sync',
      deliveryStatus: 'stored_outbox_preview',
      sentAt: nowIso,
      htmlBody: buildBookingConfirmationEmailHtml({
        booking: syncedBooking,
        settings: fresh.settings,
      }),
    }
    syncedBooking.confirmationEmailId = emailLog.id
    fresh.emailOutbox.unshift(emailLog)

    if (existingIdx >= 0) {
      fresh.bookings[existingIdx] = syncedBooking
    } else {
      fresh.bookings.unshift(syncedBooking)
    }

    if (fresh.airbnbConfig.autoRegisterCash && existingIdx === -1) {
      fresh.cashTransactions.unshift({
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: nowIso.replace('T', ' ').slice(0, 16),
        type: 'ingreso',
        category: 'payout_airbnb',
        description: `Sync Correo Airbnb ${parsed.airbnbCode} - ${parsed.guestName} (Hab. ${assignedRoom || '-'} · ${catObj.name})`,
        amount: parsed.totalAmountCLP,
        bookingId: syncedBooking.id,
        roomNumber: assignedRoom,
        receiptNumber: `AIR-${parsed.airbnbCode}`,
        operator: accountLabel,
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
        favoriteRoom: `${catObj.name}${assignedRoom ? ` (Hab. ${assignedRoom})` : ''}`,
      })
    }

    const log: AirbnbEmailSyncLog = {
      id: `AIR-LOG-${Date.now().toString().slice(-5)}`,
      receivedAt: nowIso,
      fromEmail: payload.from || 'automated@airbnb.com',
      accountLabel,
      subject: payload.subject || `¡Reserva confirmada! ${parsed.guestName} (${parsed.airbnbCode})`,
      airbnbCode: parsed.airbnbCode,
      eventType: parsed.eventType,
      guestName: parsed.guestName,
      guestEmail: parsed.guestEmail,
      roomCategoryDetected: parsed.roomCategory,
      assignedRoomNumber: assignedRoom,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      totalAmount: parsed.totalAmountCLP,
      bookingIdCreated: syncedBooking.id,
      qrTokenGenerated: uniqueQrToken,
      welcomeEmailSent: true,
      status: 'synced',
      rawSnippet: `Código: ${parsed.airbnbCode} | Hab. ${assignedRoom || '-'} (${catObj.name}) | ${parsed.checkInDate} → ${parsed.checkOutDate} | $${parsed.totalAmountCLP.toLocaleString('es-CL')} CLP | QR enviado a ${parsed.guestEmail}`,
    }

    fresh.airbnbLogs.unshift(log)
    fresh.airbnbConfig.lastSyncAt = log.receivedAt
    fresh.airbnbConfig.totalSyncedCount = (fresh.airbnbConfig.totalSyncedCount || 0) + 1

    const accIdx = fresh.airbnbConfig.accounts.findIndex((a) => a.id === accountUsed?.id)
    if (accIdx >= 0) {
      fresh.airbnbConfig.accounts[accIdx].lastSyncAt = nowIso
      fresh.airbnbConfig.accounts[accIdx].syncedCount =
        (fresh.airbnbConfig.accounts[accIdx].syncedCount || 0) + 1
    }

    writeDb(fresh)

    // Attempt background live SMTP send if App Password is configured on either account
    dispatchBookingConfirmationEmail({
      booking: syncedBooking,
      settings: fresh.settings,
      accounts: fresh.airbnbConfig.accounts,
      triggerSource: 'airbnb_auto_sync',
    })
      .then((liveResult) => {
        if (liveResult.deliveryStatus === 'sent_smtp') {
          const latest = readDb()
          const mIdx = latest.emailOutbox.findIndex((m) => m.id === emailLog.id)
          if (mIdx >= 0) {
            latest.emailOutbox[mIdx].deliveryStatus = 'sent_smtp'
            latest.emailOutbox[mIdx].qrDataUrl = liveResult.qrDataUrl
            writeDb(latest)
          }
        }
      })
      .catch(() => {})

    return { log, booking: syncedBooking, emailLog }
  },

  getAirbnbLogs(): AirbnbEmailSyncLog[] {
    return readDb().airbnbLogs
  },

  getAirbnbConfig(): AirbnbIntegrationConfig {
    return readDb().airbnbConfig
  },

  updateAirbnbConfig(updates: Partial<AirbnbIntegrationConfig>): AirbnbIntegrationConfig {
    const data = readDb()
    data.airbnbConfig = {
      ...data.airbnbConfig,
      ...updates,
      accounts: updates.accounts || data.airbnbConfig.accounts,
    }
    writeDb(data)
    return data.airbnbConfig
  },

  updateAirbnbEmailAccount(
    accountId: 'account_1' | 'account_2',
    updates: Partial<AirbnbEmailAccountConfig>
  ): AirbnbIntegrationConfig {
    const data = readDb()
    const idx = data.airbnbConfig.accounts.findIndex((a) => a.id === accountId)
    if (idx >= 0) {
      const merged = {
        ...data.airbnbConfig.accounts[idx],
        ...updates,
      }
      if (updates.appPassword !== undefined) {
        merged.appPasswordConfigured = Boolean(
          updates.appPassword && updates.appPassword.trim().length >= 8
        )
      }
      data.airbnbConfig.accounts[idx] = merged
      if (accountId === 'account_1') {
        data.airbnbConfig.imapUser = merged.email
        data.airbnbConfig.imapHost = merged.imapHost
        data.airbnbConfig.imapPort = merged.imapPort
        data.airbnbConfig.imapPasswordConfigured = merged.appPasswordConfigured
      }
      writeDb(data)
    }
    return data.airbnbConfig
  },

  // EMAIL OUTBOX (SENT CONFIRMATION EMAILS WITH QR PREVIEW)
  getEmailOutbox(): EmailOutboxLog[] {
    return readDb().emailOutbox
  },

  async resendBookingConfirmationEmail(
    bookingId: string,
    options?: {
      overrideRecipientEmail?: string
      overrideSenderEmail?: string
      overrideSenderAppPassword?: string
      saveCredentialsToAccount1?: boolean
    }
  ): Promise<EmailOutboxLog | null> {
    if (
      options?.saveCredentialsToAccount1 &&
      options.overrideSenderEmail &&
      options.overrideSenderAppPassword
    ) {
      this.updateAirbnbEmailAccount('account_1', {
        email: options.overrideSenderEmail.trim(),
        appPassword: options.overrideSenderAppPassword.trim(),
        appPasswordConfigured: true,
        enabled: true,
      })
    }

    const data = readDb()
    const clean = bookingId.trim().toUpperCase()
    const booking =
      data.bookings.find(
        (b) =>
          b.id.toUpperCase() === clean ||
          (b.externalCode && b.externalCode.toUpperCase() === clean)
      ) || data.bookings[0]
    if (!booking) return null

    if (!booking.qrToken) {
      booking.qrToken = generateBookingQrToken(booking.id, booking.clientEmail)
    }

    const emailLog = await dispatchBookingConfirmationEmail({
      booking,
      settings: data.settings,
      accounts: data.airbnbConfig.accounts,
      triggerSource: 'admin_resend',
      overrideRecipientEmail: options?.overrideRecipientEmail,
      overrideSenderEmail: options?.overrideSenderEmail,
      overrideSenderAppPassword: options?.overrideSenderAppPassword,
    })

    data.emailOutbox.unshift(emailLog)
    booking.confirmationEmailSent = true
    booking.confirmationEmailId = emailLog.id
    writeDb(data)
    return emailLog
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
    if (!booking.qrStatus || booking.qrStatus === 'issued') {
      booking.qrStatus = 'checked_in_active'
      booking.qrCheckInAt = new Date().toISOString()
    }

    if (booking.assignedRoomNumber) {
      const uIdx = data.roomUnits.findIndex((u) => u.number === booking.assignedRoomNumber)
      if (uIdx >= 0) {
        data.roomUnits[uIdx].status = 'ocupada'
        data.roomUnits[uIdx].currentBookingId = booking.id
      }
    }

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
      b.qrStatus = 'redeemed_closed'
      b.qrCheckOutAt = new Date().toISOString()
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
    let porteriaIncome = 0

    for (const t of txs) {
      if (t.type === 'ingreso') {
        totalIncome += t.amount
        if (t.category === 'pago_online_webpay') webpayIncome += t.amount
        if (t.category === 'payout_airbnb') airbnbIncome += t.amount
        if (
          t.category === 'cobro_extra_porteria' ||
          t.category === 'pago_recepcion' ||
          t.category === 'transferencia_directa'
        ) {
          porteriaIncome += t.amount
        }
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
      porteriaIncome,
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
  getSolicitudes() {
    return readDb().solicitudes
  },

  addSolicitud(
    input: Omit<import('@/types/saas').SolicitudFormulario, 'id' | 'createdAt' | 'estado'>
  ) {
    const data = readDb()
    const sol: import('@/types/saas').SolicitudFormulario = {
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
    updates: Partial<import('@/types/saas').SolicitudFormulario>
  ) {
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
    const totalUnits = data.roomUnits.length // 10 rooms
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

    const qrStats = {
      issuedReady: activeBookings.filter((b) => b.qrStatus === 'issued').length,
      checkedInActive: activeBookings.filter((b) => b.qrStatus === 'checked_in_active').length,
      redeemedClosed: activeBookings.filter((b) => b.qrStatus === 'redeemed_closed').length,
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
      emailsSentTotal: data.emailOutbox.length,
      qrStats,
      bySource,
      cash: this.getCashSummary(),
    }
  },
}
