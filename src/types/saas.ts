export type RoomCategorySlug =
  | 'superior_matrimonial'
  | 'standard_matrimonial'
  | 'doble_dos_camas'
  | 'single_individual'
  | 'familiar_terraza'

export type BathroomType = 'privado_en_suite' | 'privado_exterior'

export interface RoomCategory {
  slug: RoomCategorySlug
  name: string
  subtitle: string
  bathroomLabel: string
  bathroomType: BathroomType
  pricePerNight: number // CLP
  maxGuests: number
  bedConfig: string
  sizeM2: number
  description: string
  highlights: string[]
  image: string
  gallery: string[]
  badge?: string
  totalUnits: number
}

export type RoomUnitStatus =
  | 'disponible'
  | 'ocupada'
  | 'aseo_pendiente'
  | 'mantencion'

export interface RoomUnit {
  id: string // e.g. 'HAB-201'
  number: string // '201'
  floor: 1 | 2
  categorySlug: RoomCategorySlug
  status: RoomUnitStatus
  currentBookingId?: string
  notes?: string
  lastCleanedAt?: string
}

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

export type BookingSource =
  | 'web_online'
  | 'airbnb_email'
  | 'recepcion_directa'
  | 'whatsapp'

export type PaymentMethod =
  | 'webpay_tarjeta'
  | 'mercadopago'
  | 'transferencia'
  | 'airbnb_payout'
  | 'efectivo_recepcion'

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid_full'
  | 'refunded'

export interface GuestInfo {
  name: string
  rutOrPassport: string
  nationality?: string
  age?: number
}

export type InspectionStatus = 'ok' | 'issue' | 'pending'

export interface InspectionItem {
  id: string
  label: string
  category: 'habitacion' | 'bano' | 'equipamiento' | 'areas_comunes'
  status: InspectionStatus
  notes?: string
}

export interface InspectionTicket {
  id: string
  bookingId: string
  roomNumber?: string
  type: 'alistamiento_previo' | 'recepcion_checkin' | 'revision_checkout'
  title: string
  operatorName: string
  createdAt: string
  completedAt?: string
  status: 'pendiente' | 'en_progreso' | 'aprobado' | 'con_observaciones'
  items: InspectionItem[]
  generalNotes?: string
}

export interface CheckInData {
  bookingId: string
  estimatedArrival: string // e.g. '12:30'
  vehiclesCount: number
  vehiclePlates: string[]
  guestList: GuestInfo[]
  rulesAccepted: boolean
  rulesAcceptedAt: string
  checkedInAt?: string
  checkedOutAt?: string
  notes?: string
}

export interface PaymentRecord {
  id: string
  bookingId: string
  gateway: PaymentMethod
  amount: number
  paymentMode: 'full_100' | 'deposit_50' | 'balance_50'
  status: 'approved' | 'pending' | 'failed'
  authorizationCode?: string
  cardLast4?: string
  cardBrand?: string
  installments?: number
  externalReference?: string
  createdAt: string
}

export interface Booking {
  id: string // e.g. 'ARH-2026-1042'
  externalCode?: string // e.g. Airbnb confirmation code 'HM8K9P2Q4R'
  source: BookingSource
  roomCategory: RoomCategorySlug
  roomCategoryName: string
  assignedRoomNumber?: string // e.g. '201'
  clientName: string
  clientEmail: string
  clientPhone: string
  clientRut?: string
  checkInDate: string // YYYY-MM-DD (Check-in 12:00)
  checkOutDate: string // YYYY-MM-DD (Check-out 12:00)
  nightsCount: number
  guestsCount: number
  ratePerNight: number
  totalAmount: number
  depositRequired: number // 50% option
  amountPaid: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paidAt?: string
  status: BookingStatus
  vehiclesCount?: number
  vehiclePlates?: string[]
  requiresParking?: boolean
  specialRequests?: string
  createdAt: string
  updatedAt?: string
  checkin?: CheckInData
  tickets?: InspectionTicket[]
  payments?: PaymentRecord[]
}

export interface AirbnbEmailSyncLog {
  id: string
  receivedAt: string
  fromEmail: string
  subject: string
  airbnbCode: string
  eventType: 'reservation_confirmed' | 'reservation_modified' | 'reservation_cancelled' | 'ignored'
  guestName: string
  roomCategoryDetected: RoomCategorySlug
  checkInDate: string
  checkOutDate: string
  totalAmount: number
  bookingIdCreated?: string
  status: 'synced' | 'duplicate_skipped' | 'cancelled_updated' | 'error'
  rawSnippet: string
  errorDetail?: string
}

export interface AirbnbIntegrationConfig {
  enabled: boolean
  webhookSecret: string
  hotelReceptionEmail: string
  imapHost: string
  imapPort: number
  imapUser: string
  imapPasswordConfigured: boolean
  autoAssignRoom: boolean
  autoRegisterCash: boolean
  lastSyncAt?: string
  totalSyncedCount: number
}

export interface BlockedRoomDate {
  id: string
  date: string // YYYY-MM-DD
  roomCategory?: RoomCategorySlug | 'all'
  roomNumber?: string
  reason: 'Mantención' | 'Aseo Profundo' | 'Bloqueo Operativo' | 'Evento Privado'
  createdAt: string
}

export interface CashTransaction {
  id: string
  date: string
  type: 'ingreso' | 'gasto'
  category:
    | 'pago_online_webpay'
    | 'payout_airbnb'
    | 'pago_recepcion'
    | 'transferencia_directa'
    | 'lavanderia_blancos'
    | 'insumos_aseo'
    | 'mantencion_hotel'
    | 'servicios_basicos'
    | 'otro'
  description: string
  amount: number
  bookingId?: string
  receiptNumber?: string
  operator: string
}

export interface Client {
  id: string
  name: string
  rutOrPassport: string
  phone: string
  email: string
  origin: 'Web Directa' | 'Airbnb' | 'Recepción' | 'Corporativo'
  totalStays: number
  totalSpent: number
  lastStayDate: string
  favoriteRoom?: string
  notes?: string
}

export interface ParkingRecord {
  id: string
  bookingId?: string
  roomNumber?: string
  guestName: string
  guestRut?: string
  guestPhone?: string
  vehiclePlate: string
  vehicleModel?: string
  parkingSpot: string
  entryTime: string
  exitTime?: string
  status: 'estacionado' | 'retirado' | 'visita_temporal' | 'proveedor'
  notes?: string
}

export type SolicitudEstado = 'nueva' | 'contactado' | 'cotizado' | 'convertida' | 'descartada'

export interface SolicitudFormulario {
  id: string
  nombre: string
  telefono: string
  correo: string
  checkInDeseado: string
  noches: number
  huespedes: number
  habitacionInteres: string
  motivoViaje: string
  mensaje?: string
  estado: SolicitudEstado
  origen: 'formulario_web' | 'concierge_ia' | 'whatsapp' | 'manual'
  createdAt: string
  contactadoAt?: string
  notasInternas?: string
  presupuestoEstimado?: number
}

export interface HotelSettings {
  name: string
  slogan: string
  address: string
  city: string
  phone: string
  whatsapp: string
  email: string
  hostName: string
  checkInTime: string // '12:00'
  checkOutTime: string // '12:00'
  depositPercentage: number // 50
  paymentGatewayMode: 'sandbox_interactive' | 'webpay_live' | 'mercadopago_live'
  webpayCommerceCode?: string
  bankTransferDetails: {
    bankName: string
    accountType: string
    accountNumber: string
    holderName: string
    holderRut: string
    confirmationEmail: string
  }
}
