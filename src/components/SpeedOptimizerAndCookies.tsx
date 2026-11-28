'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Zap, ShieldCheck, Check } from 'lucide-react'
import {
  COOKIE_KEYS,
  fastCachedFetch,
  getFastCookie,
  setFastCookie,
} from '@/lib/speed-cookies'

/**
 * Global Performance Accelerator & Smart Cookie Engine:
 * 1. Pre-warms critical routes (/reservar, /mi-reserva, /admin) during browser idle time.
 * 2. Pre-fetches and caches /api/v1/availability & /api/v1/weather into fast cookies/sessionStorage.
 * 3. Pre-warms critical room & brand images on link hover intent.
 * 4. Manages the non-intrusive Speed & Cookie Consent bar.
 */
export default function SpeedOptimizerAndCookies() {
  const router = useRouter()
  const pathname = usePathname()
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // 1. Check cookie consent state
    const existingConsent = getFastCookie(COOKIE_KEYS.CONSENT)
    if (!existingConsent) {
      setShowConsent(true)
    }

    // 2. Detect connection speed tier and store in cookie for adaptive rendering
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
    }
    const isLite =
      nav.connection?.saveData ||
      nav.connection?.effectiveType === '2g' ||
      nav.connection?.effectiveType === 'slow-2g'
    const speedTier = isLite ? 'lite' : 'turbo'
    setFastCookie(COOKIE_KEYS.SPEED_TIER, speedTier, 30)
    document.documentElement.dataset.speedTier = speedTier

    // 3. Idle-time speculative route prefetching & API cookie cache warming
    const scheduleIdle =
      window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 350))

    const idleHandle = scheduleIdle(() => {
      // Prefetch Next.js app routes so navigation is instantaneous (<25ms)
      router.prefetch('/reservar')
      router.prefetch('/mi-reserva')
      router.prefetch('/admin')

      // Pre-warm availability & weather into cookie/sessionStorage L1 cache
      fastCachedFetch('/api/v1/weather', COOKIE_KEYS.WEATHER_CACHE, 900).catch(() => {})
      fastCachedFetch('/api/v1/availability', 'arh_availability_cache', 180).catch(() => {})

      // Pre-decode primary room images in background if on fast connection
      if (!isLite) {
        const criticalImages = [
          '/images/hab-superior-matrimonial.webp',
          '/images/hab-standard-matrimonial.webp',
          '/images/terraza-vista-atardecer.webp',
        ]
        for (const src of criticalImages) {
          const img = new window.Image()
          img.decoding = 'async'
          img.src = src
        }
      }
    })

    // 4. Instant hover-intent link prefetching across the document
    function handleMouseOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href) return
      if (href.startsWith('/reservar')) {
        router.prefetch('/reservar')
      } else if (href.startsWith('/mi-reserva')) {
        router.prefetch('/mi-reserva')
      } else if (href.startsWith('/admin')) {
        router.prefetch('/admin')
      }
    }

    document.addEventListener('mouseover', handleMouseOver, { passive: true })

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      if (typeof window.cancelIdleCallback === 'function' && typeof idleHandle === 'number') {
        window.cancelIdleCallback(idleHandle)
      }
    }
  }, [router, pathname])

  function handleAcceptCookies(mode: 'turbo_all' | 'essential_only') {
    setFastCookie(COOKIE_KEYS.CONSENT, mode, 365)
    setFastCookie(COOKIE_KEYS.VISITOR_SESSION, `FAST-${Date.now()}`, 30)
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div
      role="region"
      aria-label="Preferencias de cookies y aceleración de velocidad"
      className="fixed bottom-4 left-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto lux-card-featured rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border border-[#B0E454]/45"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#B0E454]/15 border border-[#B0E454]/40 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-4 h-4 text-[#B0E454]" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B0E454]">
              Aceleración por Cookies &amp; Caché Local
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-white/60">
              <ShieldCheck className="w-3 h-3 text-[#B0E454]" /> Carga Instantánea
            </span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Utilizamos cookies inteligentes de rendimiento en <strong>All Rent Hoteles</strong> para guardar en caché las tarifas, recordar tus fechas de cotización y abrir tu <strong>Pase QR</strong> sin tiempos de espera.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAcceptCookies('turbo_all')}
              className="px-4 py-2 rounded-xl bg-[#B0E454] text-[#000000] text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-[#BEEB6B] transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Activar Velocidad Turbo
            </button>
            <button
              type="button"
              onClick={() => handleAcceptCookies('essential_only')}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/75 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Solo Esenciales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
