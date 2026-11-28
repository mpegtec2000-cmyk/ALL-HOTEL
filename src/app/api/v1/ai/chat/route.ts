import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatCLP } from '@/lib/pricing'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

function buildSmartLocalReply(message: string, mode: 'admin' | 'concierge'): string {
  const q = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (mode === 'admin') {
    const metrics = db.getDashboardMetrics()
    const bookings = db.getBookings().slice(0, 6)
    const units = db.getRoomUnits()

    if (q.includes('ocupacion') || q.includes('habitacion') || q.includes('disponible') || q.includes('rack')) {
      const availList = units
        .filter((u) => u.status === 'disponible')
        .map((u) => `Hab. ${u.number}`)
        .join(', ')
      return `📊 **Estado del Rack en Vivo — All Rent Hoteles:**\n\n- **Ocupación actual:** ${metrics.occupancyRate}% (${metrics.occupiedUnits} de ${metrics.totalUnits} habitaciones ocupadas)\n- **Disponibles para venta inmediata (${metrics.availableUnits}):** ${availList || 'Ninguna'}\n- **Pendientes de aseo:** ${metrics.cleaningUnits}\n- **Tarifa Promedio (ADR):** ${formatCLP(metrics.adr)} | **RevPAR:** ${formatCLP(metrics.revPar)}`
    }

    if (q.includes('caja') || q.includes('ingreso') || q.includes('finanza') || q.includes('venta') || q.includes('plata')) {
      return `💰 **Resumen Financiero en Vivo:**\n\n- **Balance Disponible en Caja:** ${formatCLP(metrics.cash.availableBalance)}\n- **Ingresos Totales:** ${formatCLP(metrics.cash.totalIncome)}\n  - Pasarela Webpay / Online: ${formatCLP(metrics.cash.webpayIncome)}\n  - Sincronización Airbnb: ${formatCLP(metrics.cash.airbnbIncome)}\n- **Gastos Operativos:** -${formatCLP(metrics.cash.totalExpense)}`
    }

    if (q.includes('airbnb') || q.includes('correo') || q.includes('sync')) {
      const logs = db.getAirbnbLogs().slice(0, 3)
      const lines = logs
        .map((l) => `- **${l.airbnbCode}** (${l.guestName}): ${l.checkInDate} → ${l.checkOutDate} · ${formatCLP(l.totalAmount)} [${l.status}]`)
        .join('\n')
      return `🔄 **Sincronización Automática Airbnb por Correo:**\n\nTotal reservas importadas automáticamente: **${metrics.airbnbSyncedTotal}**.\n\nÚltimos comprobantes procesados:\n${lines || '- Sin registros recientes'}`
    }

    const listStr = bookings
      .map(
        (b) =>
          `- **${b.id}** (${b.clientName}): ${b.roomCategoryName} ${b.assignedRoomNumber ? `[Hab. ${b.assignedRoomNumber}]` : ''} · ${b.checkInDate} al ${b.checkOutDate} · Estado: **${b.status}**`
      )
      .join('\n')
    return `🏨 **Resumen Operativo All Rent Hoteles (Av. Bulnes 119, Quintero):**\n\n- **Horario oficial:** Check-in 12:00 / Check-out 12:00\n- **Balance en Caja:** ${formatCLP(metrics.cash.availableBalance)}\n- **Vehículos en estacionamiento interior:** ${metrics.activeVehicles}\n- **Solicitudes web nuevas:** ${metrics.pendingSolicitudes}\n\n**Últimas reservas activas:**\n${listStr}`
  }

  // Public Concierge Mode
  if (q.includes('precio') || q.includes('tarifa') || q.includes('valor') || q.includes('cuanto') || q.includes('habitacion')) {
    return '✨ **Tarifas Oficiales por Noche — All Rent Hoteles Quintero:**\n\n• **Superior Matrimonial** (Baño privado): **$63.500**\n• **Standard Matrimonial** (Baño privado exterior): **$53.500**\n• **Doble Dos Camas** (Baño privado exterior): **$49.500**\n• **Single Individual** (Baño privado exterior): **$39.500**\n• **Familiar con Terraza** (Baño privado): **$79.500**\n\n⏰ **Check-in:** 12:00 hrs | **Check-out:** 12:00 hrs\n🚗 Incluye estacionamiento privado gratuito, Wi-Fi, kitchenette equipada y patio.\n\n¿Deseas reservar online con pago inmediato en la sección Reservar?'
  }

  if (q.includes('hora') || q.includes('check') || q.includes('ingreso') || q.includes('salida')) {
    return `⏰ **Horarios Oficiales All Rent Hoteles:**\n\n• **Check-in (Ingreso):** desde las **12:00 hrs (mediodía)**\n• **Check-out (Salida):** hasta las **12:00 hrs (mediodía)**\n\n¡Disfrutas de 24 horas completas frente a la playa principal de Quintero!`
  }

  if (q.includes('ubicacion') || q.includes('donde') || q.includes('playa') || q.includes('segur') || q.includes('marino') || q.includes('direccion')) {
    return `📍 **Ubicación Privilegiada & Máxima Seguridad:**\n\nEstamos en **Av. Bulnes 119, Quintero**, en plena avenida principal y **cruzando la calle de la playa principal de Quintero** (a 10 minutos a pie de la Plaza).\n\n🛡️ Somos vecinos directos de los **Marinos (Armada)**, siendo la zona más segura y tranquila para turistas, con estacionamiento interior gratuito y videovigilancia.`
  }

  if (q.includes('estacionamiento') || q.includes('auto') || q.includes('cocina') || q.includes('patio')) {
    return `🚗 **Servicios Incluidos para Todos los Huéspedes:**\n\n• **Estacionamiento privado gratuito** y cerrado con cámaras.\n• **Cocina pequeña (kitchenette)** equipada con refrigerador y microondas.\n• **Patio interior** ideal para relajarse tras la playa.\n• Recepción y Central de Reservas de **All Rent Hoteles** (+56 9 9865 1440).`
  }

  return `¡Hola! Bienvenido a **All Rent Hoteles Quintero** (*Tu estadía, nuestra prioridad*). 🌊\n\nEstamos en **Av. Bulnes 119**, frente a la playa principal y en la zona más segura junto a los marinos.\n\nNuestras habitaciones van desde **$39.500** (Single) hasta **$79.500** (Familiar con Terraza), con **Check-in 12:00 a Check-out 12:00** y reserva online directa con pasarela de pago.\n\n¿Quieres conocer disponibilidad, detalles de los baños privados o reservar ahora?`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = String(body.message || '').trim()
    const mode: 'admin' | 'concierge' = body.mode === 'admin' ? 'admin' : 'concierge'
    const history = Array.isArray(body.history) ? body.history : []

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensaje vacío' }, { status: 400 })
    }

    if (GEMINI_API_KEY) {
      try {
        const metrics = db.getDashboardMetrics()
        const sysPrompt =
          mode === 'admin'
            ? `Eres el Copiloto IA Hotelero de All Rent Hoteles (Av. Bulnes 119, Quintero). Check-in 12:00 a Check-out 12:00. Ocupación actual: ${metrics.occupancyRate}%, Balance caja: $${metrics.cash.availableBalance}, Airbnb sincronizadas: ${metrics.airbnbSyncedTotal}. Tarifas: Superior Matrimonial $63.500, Standard Matrimonial $53.500, Doble Dos Camas $49.500, Single $39.500, Familiar con Terraza $79.500. Responde siempre como empresa corporativa All Rent Hoteles, breve, ejecutivo y en español.`
            : `Eres el Concierge Virtual Oficial de All Rent Hoteles (Av. Bulnes 119, Quintero, frente a la playa principal, zona segura junto a la Armada, estacionamiento gratis, kitchenette con refrigerador y microondas, patio, Central de Reservas +56 9 9865 1440). Check-in 12:00 a Check-out 12:00. Tarifas: Superior Matrimonial (Baño privado) $63.500, Standard Matrimonial (Baño privado exterior) $53.500, Doble Dos Camas (Baño privado exterior) $49.500, Single Individual (Baño privado exterior) $39.500, Familiar con Terraza (Baño privado) $79.500. Habla siempre como marca corporativa All Rent Hoteles e invita a reservar online con pasarela de pago en /reservar.`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: sysPrompt }] },
              contents: [
                ...history.slice(-6).map((h: { role: string; content: string }) => ({
                  role: h.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: h.content }],
                })),
                { role: 'user', parts: [{ text: message }] },
              ],
              generationConfig: { temperature: 0.35, maxOutputTokens: 600 },
            }),
          }
        )
        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            return NextResponse.json({ success: true, reply: text })
          }
        }
      } catch {
        // Fallback to deterministic local hotel engine
      }
    }

    const fallbackReply = buildSmartLocalReply(message, mode)
    return NextResponse.json({ success: true, reply: fallbackReply })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error procesando consulta.' },
      { status: 500 }
    )
  }
}
