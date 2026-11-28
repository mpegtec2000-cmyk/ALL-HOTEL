'use client'

import { RoomCategorySlug } from '@/types/saas'

export const COOKIE_KEYS = {
  CONSENT: 'arh_cookie_consent',
  SPEED_TIER: 'arh_speed_tier',
  WEATHER_CACHE: 'arh_weather_cache',
  BOOKING_DRAFT: 'arh_booking_draft',
  LAST_BOOKING_CODE: 'arh_last_booking_code',
  VISITOR_SESSION: 'arh_visitor_fast_session',
} as const

export interface BookingDraftCookie {
  roomCategory?: RoomCategorySlug
  checkInDate?: string
  checkOutDate?: string
  guestsCount?: number
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientRut?: string
  vehiclePlate?: string
  updatedAt?: number
}

/**
 * Sets a browser cookie with SameSite=Lax and path=/ for fast cross-route access.
 */
export function setFastCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    const encoded = encodeURIComponent(value)
    document.cookie = `${name}=${encoded}; expires=${expires}; path=/; SameSite=Lax`
  } catch {
    // Fallback if cookie quota is exceeded
  }
}

/**
 * Reads a browser cookie in O(1) time.
 */
export function getFastCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/**
 * Stores JSON data in both a fast cookie and sessionStorage L1 cache.
 */
export function setCachedJsonCookie<T>(name: string, data: T, days = 14): void {
  if (typeof window === 'undefined') return
  try {
    const raw = JSON.stringify({ data, ts: Date.now() })
    setFastCookie(name, raw, days)
    window.sessionStorage.setItem(name, raw)
  } catch {
    // ignore storage errors
  }
}

/**
 * Reads JSON data from L1 sessionStorage or cookie if within maxAgeSeconds.
 */
export function getCachedJsonCookie<T>(name: string, maxAgeSeconds = 900): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(name) || getFastCookie(name)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: T; ts: number }
    if (!parsed || typeof parsed.ts !== 'number') return null
    const ageSec = (Date.now() - parsed.ts) / 1000
    if (ageSec > maxAgeSeconds) return null
    return parsed.data
  } catch {
    return null
  }
}

/**
 * Saves or merges the visitor's current booking draft into a cookie
 * so transitions between /, /reservar, and /mi-reserva hydrate in 0ms.
 */
export function saveBookingDraftCookie(partial: Partial<BookingDraftCookie>): void {
  const existing = getCachedJsonCookie<BookingDraftCookie>(COOKIE_KEYS.BOOKING_DRAFT, 86400 * 14) || {}
  setCachedJsonCookie<BookingDraftCookie>(
    COOKIE_KEYS.BOOKING_DRAFT,
    {
      ...existing,
      ...partial,
      updatedAt: Date.now(),
    },
    14
  )
}

export function getBookingDraftCookie(): BookingDraftCookie | null {
  return getCachedJsonCookie<BookingDraftCookie>(COOKIE_KEYS.BOOKING_DRAFT, 86400 * 14)
}

/**
 * Stale-While-Revalidate fetch helper backed by cookies + sessionStorage.
 * Returns cached response immediately (<1ms) if available and refreshes in the background.
 */
export async function fastCachedFetch<T>(
  url: string,
  cacheKey: string,
  ttlSeconds = 300,
  onBackgroundUpdate?: (freshData: T) => void
): Promise<T | null> {
  const cached = getCachedJsonCookie<T>(cacheKey, ttlSeconds)

  const fetchAndCache = async (): Promise<T | null> => {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const json = (await res.json()) as T
      setCachedJsonCookie(cacheKey, json, 7)
      if (onBackgroundUpdate) onBackgroundUpdate(json)
      return json
    } catch {
      return null
    }
  }

  if (cached) {
    // Revalidate silently in background without blocking UI render
    if (typeof window !== 'undefined') {
      const schedule = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 250))
      schedule(() => {
        fetchAndCache().catch(() => {})
      })
    }
    return cached
  }

  return await fetchAndCache()
}
