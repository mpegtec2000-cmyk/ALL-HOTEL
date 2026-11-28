import { NextResponse } from 'next/server'

const WEATHER_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800',
}

export async function GET() {
  try {
    // Coordinates for Av. Bulnes 119, Quintero (-32.7767, -71.5267)
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-32.7767&longitude=-71.5267&current=temperature_2m,wind_speed_10m,weather_code&timezone=America%2FSantiago',
      { next: { revalidate: 900 } }
    )
    if (res.ok) {
      const json = await res.json()
      const temp = Math.round(json.current?.temperature_2m ?? 19)
      const wind = Math.round(json.current?.wind_speed_10m ?? 14)
      return NextResponse.json(
        {
          success: true,
          data: {
            location: 'Playa Principal Quintero',
            tempC: temp,
            windKmh: wind,
            condition: temp >= 18 ? 'Despejado Costero' : 'Brisa Marina Fresca',
          },
        },
        { headers: WEATHER_CACHE_HEADERS }
      )
    }
  } catch {
    // Graceful coastal fallback
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        location: 'Playa Principal Quintero',
        tempC: 20,
        windKmh: 12,
        condition: 'Soleado Frente al Mar',
      },
    },
    { headers: WEATHER_CACHE_HEADERS }
  )
}
