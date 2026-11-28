import { HotelSettings, RoomCategory, RoomCategorySlug, RoomUnit } from '@/types/saas'

export const OFFICIAL_ROOM_CATEGORIES: RoomCategory[] = [
  {
    slug: 'superior_matrimonial',
    name: 'Superior Matrimonial',
    subtitle: 'Baño privado · Máximo confort frente a la costa de Quintero',
    bathroomLabel: 'Baño privado',
    bathroomType: 'privado_en_suite',
    pricePerNight: 63500,
    maxGuests: 2,
    bedConfig: '1 Cama Matrimonial Queen',
    sizeM2: 24,
    description:
      'Habitación cálida y luminosa con terminaciones en madera noble, ropa de cama hotelera blanca de alta suavidad, poltrona de lectura y baño privado completo.',
    highlights: [
      'Baño privado',
      'Cama Matrimonial Queen de lujo',
      'Smart TV & Wi-Fi de alta velocidad',
      'Estacionamiento privado gratuito',
      'Acceso a kitchenette equipada y patio',
    ],
    image: '/images/hab-superior-matrimonial.webp',
    gallery: [
      '/images/hab-superior-matrimonial.webp',
      '/images/lobby-principal.webp',
      '/images/salon-comedor-lounge.webp',
    ],
    badge: 'Baño Privado',
    totalUnits: 2,
  },
  {
    slug: 'standard_matrimonial',
    name: 'Standard Matrimonial',
    subtitle: 'Baño privado exterior · Descanso acogedor y luminoso',
    bathroomLabel: 'Baño privado exterior',
    bathroomType: 'privado_exterior',
    pricePerNight: 53500,
    maxGuests: 2,
    bedConfig: '1 Cama Matrimonial',
    sizeM2: 20,
    description:
      'Diseño minimalista y luminoso con piso de madera vitrificada, mesa para dos personas y baño privado exterior de uso exclusivo para la habitación.',
    highlights: [
      'Baño privado exterior (uso exclusivo)',
      'Cama Matrimonial con ropa blanca hotelera',
      'Mesa de desayuno / estación de trabajo',
      'Smart TV & Wi-Fi fibra óptica',
      'Estacionamiento privado gratuito',
    ],
    image: '/images/hab-standard-matrimonial.webp',
    gallery: [
      '/images/hab-standard-matrimonial.webp',
      '/images/pasillo-madera-tallada.webp',
      '/images/vestibulo-escalera-orquideas.webp',
    ],
    totalUnits: 2,
  },
  {
    slug: 'doble_dos_camas',
    name: 'Doble Dos Camas',
    subtitle: 'Baño privado exterior · Ideal para amigos, colegas o estadías corporativas',
    bathroomLabel: 'Baño privado exterior',
    bathroomType: 'privado_exterior',
    pricePerNight: 49500,
    maxGuests: 2,
    bedConfig: '2 Camas Individuales',
    sizeM2: 20,
    description:
      'Habitación versátil equipada con dos camas independientes de excelente soporte, iluminación cálida y baño privado exterior completamente sanitizado.',
    highlights: [
      'Baño privado exterior (uso exclusivo)',
      '2 Camas Individuales independientes',
      'Wi-Fi de alta velocidad & Smart TV',
      'Uso libre de kitchenette y patio interior',
      'Estacionamiento privado gratuito',
    ],
    image: '/images/hab-familiar-luminosa.webp',
    gallery: [
      '/images/hab-familiar-luminosa.webp',
      '/images/pasillo-mezzanine.webp',
      '/images/salon-comedor-lounge.webp',
    ],
    totalUnits: 2,
  },
  {
    slug: 'single_individual',
    name: 'Single Individual',
    subtitle: 'Baño privado exterior · Tarifa ideal para viajeros individuales o ejecutivos',
    bathroomLabel: 'Baño privado exterior',
    bathroomType: 'privado_exterior',
    pricePerNight: 39500,
    maxGuests: 1,
    bedConfig: '1 Cama Individual',
    sizeM2: 15,
    description:
      'Espacio tranquilo, impecable y seguro en plena Av. Bulnes 119 frente a la playa. Perfecto para viajes de negocios o escapadas individuales de descanso.',
    highlights: [
      'Baño privado exterior (uso exclusivo)',
      'Estación de trabajo + Wi-Fi rápido',
      'Kitchenette con refrigerador y microondas',
      'Estacionamiento privado gratuito',
      'Sector seguro junto a la Armada',
    ],
    image: '/images/pasillo-mezzanine.webp',
    gallery: [
      '/images/pasillo-mezzanine.webp',
      '/images/hab-standard-matrimonial.webp',
      '/images/recepcion-cctv-seguridad.webp',
    ],
    totalUnits: 2,
  },
  {
    slug: 'familiar_terraza',
    name: 'Familiar con Terraza',
    subtitle: 'Baño privado · Amplitud total con terraza hacia la brisa costera',
    bathroomLabel: 'Baño privado',
    bathroomType: 'privado_en_suite',
    pricePerNight: 79500,
    maxGuests: 4,
    bedConfig: 'Cama Matrimonial + Camas Adicionales',
    sizeM2: 34,
    description:
      'Nuestra habitación más amplia pensada para familias o grupos. Cuenta con baño privado completo, área de estar, comedor interior y salida directa a terraza con vista costera.',
    highlights: [
      'Baño privado',
      'Terraza panorámica hacia la costa',
      'Capacidad hasta 4 huéspedes',
      'Estacionamiento privado gratuito',
      'Frente a la playa principal de Quintero',
    ],
    image: '/images/terraza-vista-atardecer.webp',
    gallery: [
      '/images/terraza-vista-atardecer.webp',
      '/images/hab-familiar-luminosa.webp',
      '/images/playa-quintero-caleta.webp',
    ],
    badge: 'Con Terraza',
    totalUnits: 2,
  },
]

/**
 * 10 Physical Rooms Configured as Individual Cost Centers (Hab. 101 to Hab. 110).
 * Names, categories, and rates are 100% editable from the Admin Cost Center panel.
 */
export const INITIAL_ROOM_UNITS: RoomUnit[] = [
  {
    id: 'HAB-101',
    number: '101',
    customName: 'Hab. 101 · Standard Matrimonial',
    costCenterCode: 'CC-HAB-101',
    floor: 1,
    categorySlug: 'standard_matrimonial',
    status: 'disponible',
  },
  {
    id: 'HAB-102',
    number: '102',
    customName: 'Hab. 102 · Standard Matrimonial',
    costCenterCode: 'CC-HAB-102',
    floor: 1,
    categorySlug: 'standard_matrimonial',
    status: 'ocupada',
    currentBookingId: 'ARH-2026-1041',
  },
  {
    id: 'HAB-103',
    number: '103',
    customName: 'Hab. 103 · Doble Dos Camas',
    costCenterCode: 'CC-HAB-103',
    floor: 1,
    categorySlug: 'doble_dos_camas',
    status: 'disponible',
  },
  {
    id: 'HAB-104',
    number: '104',
    customName: 'Hab. 104 · Doble Dos Camas',
    costCenterCode: 'CC-HAB-104',
    floor: 1,
    categorySlug: 'doble_dos_camas',
    status: 'disponible',
  },
  {
    id: 'HAB-105',
    number: '105',
    customName: 'Hab. 105 · Single Individual',
    costCenterCode: 'CC-HAB-105',
    floor: 1,
    categorySlug: 'single_individual',
    status: 'aseo_pendiente',
  },
  {
    id: 'HAB-106',
    number: '106',
    customName: 'Hab. 106 · Single Individual',
    costCenterCode: 'CC-HAB-106',
    floor: 1,
    categorySlug: 'single_individual',
    status: 'disponible',
  },
  {
    id: 'HAB-107',
    number: '107',
    customName: 'Hab. 107 · Superior Matrimonial',
    costCenterCode: 'CC-HAB-107',
    floor: 2,
    categorySlug: 'superior_matrimonial',
    status: 'ocupada',
    currentBookingId: 'ARH-2026-1042',
  },
  {
    id: 'HAB-108',
    number: '108',
    customName: 'Hab. 108 · Superior Matrimonial',
    costCenterCode: 'CC-HAB-108',
    floor: 2,
    categorySlug: 'superior_matrimonial',
    status: 'disponible',
  },
  {
    id: 'HAB-109',
    number: '109',
    customName: 'Hab. 109 · Familiar con Terraza',
    costCenterCode: 'CC-HAB-109',
    floor: 2,
    categorySlug: 'familiar_terraza',
    status: 'disponible',
  },
  {
    id: 'HAB-110',
    number: '110',
    customName: 'Hab. 110 · Familiar con Terraza',
    costCenterCode: 'CC-HAB-110',
    floor: 2,
    categorySlug: 'familiar_terraza',
    status: 'disponible',
  },
]

export const DEFAULT_HOTEL_SETTINGS: HotelSettings = {
  name: 'All Rent Hoteles',
  slogan: 'Tu estadía, nuestra prioridad.',
  address: 'Av. Bulnes 119, Quintero, Región de Valparaíso',
  city: 'Quintero, Chile',
  phone: '+56 9 9865 1440',
  whatsapp: '56998651440',
  email: 'reservas@allrenthoteles.cl',
  hostName: 'All Rent Hoteles',
  checkInTime: '12:00',
  checkOutTime: '12:00',
  depositPercentage: 100,
  paymentGatewayMode: 'sandbox_interactive',
  webpayCommerceCode: '597055555532',
  bankTransferDetails: {
    bankName: 'Banco de Chile / BancoEstado',
    accountType: 'Cuenta Corriente Empresa',
    accountNumber: '00-194-88421-09',
    holderName: 'All Rent Hoteles SpA',
    holderRut: '77.492.810-K',
    confirmationEmail: 'reservas@allrenthoteles.cl',
  },
}

export function getRoomCategoryBySlug(slug: RoomCategorySlug): RoomCategory {
  return (
    OFFICIAL_ROOM_CATEGORIES.find((r) => r.slug === slug) || OFFICIAL_ROOM_CATEGORIES[0]
  )
}

export function formatCLP(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-CL')
}

export function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 0
  const start = new Date(checkInDate + 'T12:00:00')
  const end = new Date(checkOutDate + 'T12:00:00')
  const diffMs = end.getTime() - start.getTime()
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : 0
}

export interface HotelQuote {
  roomCategory: RoomCategory
  nightsCount: number
  ratePerNight: number
  totalAmount: number
  deposit50Amount: number
  balanceOnArrival: number
  ivaIncluded: number
}

export function computeHotelQuote(params: {
  roomCategory: RoomCategorySlug
  checkInDate: string
  checkOutDate: string
  customCategories?: RoomCategory[]
}): HotelQuote | null {
  const nightsCount = calculateNights(params.checkInDate, params.checkOutDate)
  if (nightsCount <= 0) return null

  const list = params.customCategories || OFFICIAL_ROOM_CATEGORIES
  const room = list.find((c) => c.slug === params.roomCategory) || list[0]
  const ratePerNight = room.pricePerNight
  const totalAmount = ratePerNight * nightsCount
  const deposit50Amount = Math.round(totalAmount * 0.5)
  const balanceOnArrival = totalAmount - deposit50Amount
  const ivaIncluded = Math.round(totalAmount - totalAmount / 1.19)

  return {
    roomCategory: room,
    nightsCount,
    ratePerNight,
    totalAmount,
    deposit50Amount,
    balanceOnArrival,
    ivaIncluded,
  }
}
