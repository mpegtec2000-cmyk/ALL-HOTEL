import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatCLP } from '@/lib/pricing'
import { executeCopilotAgentQuery } from '@/lib/copilot-agent-engine'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

function buildPublicConciergeReply(message: string): string {
  const q = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    q.includes('precio') ||
    q.includes('tarifa') ||
    q.includes('valor') ||
    q.includes('cuanto') ||
    q.includes('habitacion')
  ) {
    return '✨ **Tarifas Oficiales por Noche — All Rent Hoteles Quintero:**\n\n• **Superior Matrimonial** (Baño privado): **$63.500**\n• **Standard Matrimonial** (Baño privado exterior): **$53.500**\n• **Doble Dos Camas** (Baño privado exterior): **$49.500**\n• **Single Individual** (Baño privado exterior): **$39.500**\n• **Familiar con Terraza** (Baño privado): **$79.500**\n\n⏰ **Check-in:** 12:00 hrs | **Check-out:** 12:00 hrs\n🚗 Incluye estacionamiento privado gratuito, Wi-Fi, kitchenette equipada y patio.\n\n¿Deseas reservar online con pago inmediato en la sección Reservar?'
  }

  if (q.includes('hora') || q.includes('check') || q.includes('ingreso') || q.includes('salida')) {
    return `⏰ **Horarios Oficiales All Rent Hoteles:**\n\n• **Check-in (Ingreso):** desde las **12:00 hrs (mediodía)**\n• **Check-out (Salida):** hasta las **12:00 hrs (mediodía)**\n\n¡Al reservar recibes automáticamente en tu correo tu **Pase QR Único** para un ingreso rápido en recepción!`
  }

  if (
    q.includes('ubicacion') ||
    q.includes('donde') ||
    q.includes('playa') ||
    q.includes('segur') ||
    q.includes('marino') ||
    q.includes('direccion')
  ) {
    return `📍 **Ubicación Privilegiada & Máxima Seguridad:**\n\nEstamos en **Av. Bulnes 119, Quintero**, en plena avenida principal y **cruzando la calle de la playa principal de Quintero** (a 10 minutos a pie de la Plaza).\n\n🛡️ Somos vecinos directos de la **Armada de Chile**, siendo la zona más segura y tranquila para turistas, con estacionamiento interior gratuito y videovigilancia CCTV.`
  }

  if (
    q.includes('estacionamiento') ||
    q.includes('auto') ||
    q.includes('cocina') ||
    q.includes('patio')
  ) {
    return `🚗 **Servicios Incluidos para Todos los Huéspedes:**\n\n• **Estacionamiento privado gratuito** y cerrado con cámaras CCTV.\n• **Cocina pequeña (kitchenette)** equipada con refrigerador y microondas.\n• **Patio interior** ideal para relajarse tras la playa.\n• Recepción y Central de Reservas de **All Rent Hoteles** (+56 9 9865 1440).`
  }

  return `¡Hola! Bienvenido a **All Rent Hoteles Quintero** (*Tu estadía, nuestra prioridad*). 🌊\n\nEstamos en **Av. Bulnes 119**, frente a la playa principal y en la zona más segura junto a la Armada.\n\nNuestras habitaciones van desde **$39.500** (Single) hasta **$79.500** (Familiar con Terraza), con **Check-in 12:00 a Check-out 12:00**, reserva online directa y **Pase QR Único de Check-in** enviado automáticamente a tu correo.\n\n¿Quieres conocer disponibilidad, detalles de los baños privados o reservar ahora?`
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

    // ADMIN MODE: Execute the 10-Skill PMS Copilot Agent Engine first
    if (mode === 'admin') {
      const skillExecution = executeCopilotAgentQuery(message)

      // If GEMINI_API_KEY is configured and it wasn't a direct mutation command, enrich with LLM while keeping exact DB facts
      if (GEMINI_API_KEY && skillExecution.skillId !== 'system_operational_command') {
        try {
          const metrics = db.getDashboardMetrics()
          const sysPrompt = `Eres el Copiloto IA Ejecutivo de All Rent Hoteles (Av. Bulnes 119, Quintero). Habla siempre como marca corporativa All Rent Hoteles.
Acabas de ejecutar la Agent Skill "${skillExecution.skillName}" sobre la base de datos en tiempo real y obtuviste este reporte exacto:
---
${skillExecution.reply}
---
Datos globales: 10 Habitaciones como Centros de Coste (Hab. 101 a 110), Ocupación: ${metrics.occupancyRate}%, Balance Caja: ${formatCLP(metrics.cash.availableBalance)}.
Responde a la consulta del administrador usando exactamente las cifras, códigos QR, patentes, montos y nombres del reporte superior, con formato Markdown claro y ejecutivo.`

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: sysPrompt }] },
                contents: [
                  ...history.slice(-4).map((h: { role: string; content: string }) => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }],
                  })),
                  { role: 'user', parts: [{ text: message }] },
                ],
                generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
              }),
            }
          )
          if (res.ok) {
            const data = await res.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              return NextResponse.json({
                success: true,
                reply: text,
                skillId: skillExecution.skillId,
                skillName: skillExecution.skillName,
                actions: skillExecution.actions,
              })
            }
          }
        } catch {
          // Use deterministic Agent Skill result directly
        }
      }

      return NextResponse.json({
        success: true,
        reply: skillExecution.reply,
        skillId: skillExecution.skillId,
        skillName: skillExecution.skillName,
        actions: skillExecution.actions,
      })
    }

    // PUBLIC CONCIERGE MODE
    const fallbackReply = buildPublicConciergeReply(message)
    return NextResponse.json({ success: true, reply: fallbackReply })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error procesando consulta en el Copiloto IA.' },
      { status: 500 }
    )
  }
}
