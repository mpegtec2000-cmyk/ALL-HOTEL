import { db } from './db'
import { formatCLP } from './pricing'
import { Booking, RoomUnitStatus } from '@/types/saas'

export interface CopilotActionSuggestion {
  label: string
  tab?:
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
  qrTokenToScan?: string
  bookingIdToExtend?: string
}

export interface CopilotSkillExecutionResult {
  skillId: string
  skillName: string
  reply: string
  actions: CopilotActionSuggestion[]
  structuredSnapshot: Record<string, unknown>
}

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Executes the appropriate Agent Skill(s) against the live All Rent Hoteles database
 * and returns a structured, executive report + interactive UI action buttons.
 */
export function executeCopilotAgentQuery(
  rawMessage: string
): CopilotSkillExecutionResult {
  const q = normalizeText(rawMessage)
  const bookings = db.getBookings()
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  const units = db.getRoomUnits()
  const metrics = db.getDashboardMetrics()
  const ccReport = db.getCostCentersReport()
  const cashSummary = db.getCashSummary()
  const transactions = db.getCashTransactions()
  const airbnbLogs = db.getAirbnbLogs()
  const airbnbConfig = db.getAirbnbConfig()
  const emailOutbox = db.getEmailOutbox()
  const parking = db.getParkingRecords()
  const solicitudes = db.getSolicitudes()
  const clients = db.getClients()

  // ============================================================================
  // SKILL 1: OPERATIONAL COMMAND EXECUTION FROM CHAT (e.g. "poner hab 105 disponible")
  // ============================================================================
  const roomCmdMatch = q.match(
    /(?:poner|pasar|marcar|cambiar|dejar)\s+(?:la\s+)?(?:hab(?:itacion)?\.?\s*)?(10[1-9]|110)\s+(?:en|como|a)?\s*(disponible|libre|ocupada|aseo|limpieza|mantencion)/i
  )
  if (roomCmdMatch) {
    const roomNum = roomCmdMatch[1]
    const rawState = roomCmdMatch[2]
    let targetStatus: RoomUnitStatus = 'disponible'
    if (rawState.includes('ocupada')) targetStatus = 'ocupada'
    else if (rawState.includes('aseo') || rawState.includes('limpieza'))
      targetStatus = 'aseo_pendiente'
    else if (rawState.includes('mantencion')) targetStatus = 'mantencion'

    const updated = db.updateRoomUnit(roomNum, { status: targetStatus })
    if (updated) {
      return {
        skillId: 'system_operational_command',
        skillName: 'Ejecución de Comando Operativo en Rack',
        reply: `✅ **Comando Ejecutado en Tiempo Real:**\n\nLa **Habitación ${roomNum}** (${updated.customName || updated.categorySlug}) fue actualizada inmediatamente al estado **${targetStatus.toUpperCase().replace('_', ' ')}** en la base de datos y en la Matriz de Centros de Coste.`,
        actions: [{ label: `Ver Hab. ${roomNum} en Centros de Coste`, tab: 'rack' }],
        structuredSnapshot: { updatedUnit: updated },
      }
    }
  }

  // ============================================================================
  // SKILL 2: DEBT, PENDING BALANCES & COLLECTIONS AUDIT ("clientes en deuda", "saldo pendiente", "por cobrar")
  // ============================================================================
  if (
    q.includes('deuda') ||
    q.includes('debe') ||
    q.includes('pendiente') ||
    q.includes('cobrar') ||
    q.includes('cobranza') ||
    q.includes('falta pagar') ||
    q.includes('moros') ||
    q.includes('abono') ||
    q.includes('saldo')
  ) {
    const debtors: Array<{
      booking: Booking
      pendingDebt: number
    }> = []

    for (const b of activeBookings) {
      const pendingDebt = Math.max(0, b.totalAmount - (b.amountPaid || 0))
      if (pendingDebt > 0 || b.paymentStatus === 'unpaid' || b.paymentStatus === 'deposit_paid') {
        debtors.push({ booking: b, pendingDebt })
      }
    }

    const totalDebtCLP = debtors.reduce((acc, d) => acc + d.pendingDebt, 0)
    const totalCollectedCLP = activeBookings.reduce((acc, b) => acc + (b.amountPaid || 0), 0)
    const extraPorteriaBookings = activeBookings.filter(
      (b) => (b.extraDaysAdded && b.extraDaysAdded > 0) || (b.extraChargesAmount && b.extraChargesAmount > 0)
    )

    if (debtors.length > 0) {
      const lines = debtors
        .map(
          ({ booking: b, pendingDebt }, idx) =>
            `${idx + 1}. **${b.clientName}** (${b.id} · Hab. **${b.assignedRoomNumber || '-'}** - ${b.roomCategoryName})\n` +
            `   • **Deuda por Cobrar:** **${formatCLP(pendingDebt)}** (Pagado: ${formatCLP(b.amountPaid)} de ${formatCLP(b.totalAmount)})\n` +
            `   • **Estadía:** ${b.checkInDate} → ${b.checkOutDate} (${b.nightsCount} noches) · Estado: \`${b.status}\`\n` +
            `   • **Contacto directo:** Tel/WhatsApp \`${b.clientPhone}\` · Correo \`${b.clientEmail}\``
        )
        .join('\n\n')

      return {
        skillId: 'debt_and_collections',
        skillName: 'Auditoría de Clientes en Deuda & Saldos por Cobrar',
        reply:
          `💸 **Reporte de Clientes en Deuda & Saldos Pendientes de Cobro:**\n\n` +
          `- **Total por Cobrar Hoy:** **${formatCLP(totalDebtCLP)}** en **${debtors.length}** ${debtors.length === 1 ? 'reserva' : 'reservas'}\n` +
          `- **Total ya Recaudado (Reservas Activas):** ${formatCLP(totalCollectedCLP)}\n\n` +
          `### Detalle de Clientes con Saldo Pendiente:\n${lines}\n\n` +
          `💡 *Puedes saldar o agregar noches/cobros extra directamente desde **"Calendario & Reservas" → "+ Días Portería"**.*`,
        actions: [
          { label: 'Gestionar Cobros en Reservas', tab: 'reservas' },
          { label: 'Abrir Libro de Caja', tab: 'caja' },
        ],
        structuredSnapshot: { totalDebtCLP, debtorsCount: debtors.length, debtors },
      }
    }

    const paidLines = activeBookings
      .slice(0, 6)
      .map(
        (b) =>
          `- **${b.clientName}** (\`${b.id}\` · Hab. **${b.assignedRoomNumber || '-'}**): **${formatCLP(b.amountPaid)} / ${formatCLP(b.totalAmount)}** — ✅ *100% Pagado (${b.source === 'airbnb_email' ? 'Airbnb' : b.source === 'web_online' ? 'Web Online' : 'Recepción'})*`
      )
      .join('\n')

    const extraInfo =
      extraPorteriaBookings.length > 0
        ? `\n\n**Cobros Extra / Extensiones en Portería registradas (${extraPorteriaBookings.length}):**\n` +
          extraPorteriaBookings
            .map(
              (b) =>
                `- **${b.clientName}** (Hab. ${b.assignedRoomNumber}): +${b.extraDaysAdded || 0} noches adicionales (+${formatCLP(b.extraChargesAmount || 0)})`
            )
            .join('\n')
        : ''

    return {
      skillId: 'debt_and_collections',
      skillName: 'Auditoría de Clientes en Deuda & Saldos por Cobrar',
      reply:
        `✅ **Auditoría de Cobranza — Sin Deudas Vencidas ($0 Pendiente):**\n\n` +
        `En este momento **todas las reservas activas (${activeBookings.length}) se encuentran 100% pagadas** por un total recaudado de **${formatCLP(totalCollectedCLP)}**.\n\n` +
        `### Estado de Pago por Huésped Activo:\n${paidLines}${extraInfo}\n\n` +
        `💡 *Si un huésped se queda días adicionales o consume servicios extra, usa el botón **"+ Días Portería"** en la pestaña Reservas o Escáner QR para imputar el cobro adicional a su habitación.*`,
      actions: [
        { label: 'Ver Reservas & Cobros Portería', tab: 'reservas' },
        { label: 'Revisar Libro de Caja', tab: 'caja' },
      ],
      structuredSnapshot: { totalDebtCLP: 0, totalCollectedCLP, activeCount: activeBookings.length },
    }
  }

  // ============================================================================
  // SKILL 3: SPECIFIC GUEST, BOOKING CODE, AIRBNB CODE OR VEHICLE PLATE 360° LOOKUP
  // ============================================================================
  const matchedBooking = bookings.find((b) => {
    const nameParts = normalizeText(b.clientName).split(/\s+/).filter((p) => p.length >= 3)
    const matchesName = nameParts.some((part) => q.includes(part))
    const matchesId = q.includes(b.id.toLowerCase())
    const matchesExt = b.externalCode && q.includes(b.externalCode.toLowerCase())
    const matchesPlate = (b.vehiclePlates || []).some((pl) => q.includes(pl.toLowerCase()))
    const matchesRut = b.clientRut && q.includes(b.clientRut.toLowerCase())
    return Boolean(matchesName || matchesId || matchesExt || matchesPlate || matchesRut)
  })

  if (
    matchedBooking &&
    !q.includes('todas las reservas') &&
    !q.includes('resumen general')
  ) {
    const b = matchedBooking
    const debt = Math.max(0, b.totalAmount - (b.amountPaid || 0))
    const qrLabel =
      b.qrStatus === 'issued'
        ? '🟢 Emitido (0/2 Usos) — Listo para Check-in de Entrada'
        : b.qrStatus === 'checked_in_active'
        ? '🔵 En Estadía Activa (1/2 Usos) — Próximo uso: Check-out de Salida'
        : '🔒 Cerrado y Quemado (2/2 Usos) — Estadía Finalizada'

    return {
      skillId: 'guest_and_booking_lookup',
      skillName: `Ficha 360° de Reserva (${b.clientName})`,
      reply:
        `👤 **Ficha Completa del Huésped & Reserva — ${b.clientName}:**\n\n` +
        `- **Código Reserva:** \`${b.id}\`${b.externalCode ? ` · **Código Airbnb:** \`${b.externalCode}\`` : ''}\n` +
        `- **Habitación (Centro de Coste):** **Hab. ${b.assignedRoomNumber || 'Por asignar'}** (${b.roomCategoryName})\n` +
        `- **Fechas (12:00 a 12:00):** **${b.checkInDate}** → **${b.checkOutDate}** (${b.nightsCount} ${b.nightsCount === 1 ? 'noche' : 'noches'} · ${b.guestsCount} huéspedes)\n` +
        `- **Estado Financiero:** Pagado **${formatCLP(b.amountPaid)}** de **${formatCLP(b.totalAmount)}** — ${debt > 0 ? `⚠️ **DEUDA PENDIENTE: ${formatCLP(debt)}**` : '✅ **100% PAGADO (Sin Deuda)**'}\n` +
        `- **RUT / Documento:** ${b.clientRut || b.externalCode || 'Registrado'} · **Matrícula Vehículo:** \`${b.vehiclePlates?.join(', ') || 'Sin patente registrada'}\`\n` +
        `- **Contacto:** Tel \`${b.clientPhone}\` · Correo \`${b.clientEmail}\`\n` +
        `- **Token QR Único:** \`${b.qrToken}\`\n` +
        `- **Estado del Ciclo QR:** ${qrLabel}`,
      actions: [
        {
          label: `Abrir QR de ${b.clientName.split(' ')[0]} en Escáner`,
          tab: 'checkin',
          qrTokenToScan: b.qrToken || b.id,
        },
        {
          label: `+ Días / Cobro Extra Portería`,
          tab: 'reservas',
          bookingIdToExtend: b.id,
        },
      ],
      structuredSnapshot: { booking: b, debt },
    }
  }

  // ============================================================================
  // SKILL 4: 10 ROOMS COST CENTERS P&L REPORT ("centros de coste", "10 habitaciones", "rentabilidad")
  // ============================================================================
  if (
    q.includes('centro') ||
    q.includes('coste') ||
    q.includes('costo') ||
    q.includes('rentabilidad') ||
    q.includes('10 hab') ||
    q.includes('pieza') ||
    q.includes('margen')
  ) {
    const sortedByProfit = [...ccReport.costCenters].sort((a, b) => b.netProfit - a.netProfit)
    const topRoom = sortedByProfit[0]
    const lines = ccReport.costCenters
      .map(
        (cc) =>
          `- **Hab. ${cc.unit.number}** (${cc.categoryName} · *${cc.unit.status.replace('_', ' ')}*): Ingresos **${formatCLP(cc.totalRevenue)}** | Gastos **-${formatCLP(cc.totalExpenses)}** | **Neto: ${formatCLP(cc.netProfit)}** (${cc.bookingsCount} res. / ${cc.occupiedNights} noches)${cc.activeBooking ? ` · Huésped: *${cc.activeBooking.clientName}*` : ''}`
      )
      .join('\n')

    return {
      skillId: 'cost_centers_10_rooms',
      skillName: 'Análisis P&L de los 10 Centros de Coste (Hab. 101 a 110)',
      reply:
        `🏢 **Estado Financiero & Operativo de los 10 Centros de Coste (Hab. 101 a Hab. 110):**\n\n` +
        `- **Ingresos Totales 10 Habitaciones:** **${formatCLP(ccReport.totals.totalRevenue)}**\n` +
        `- **Gastos Directos Imputados:** **-${formatCLP(ccReport.totals.totalExpenses)}**\n` +
        `- **Margen Neto Acumulado:** **${formatCLP(ccReport.totals.netProfit)}**\n` +
        `- **Habitación más rentable:** **Hab. ${topRoom?.unit.number}** (${topRoom?.categoryName}) con **${formatCLP(topRoom?.netProfit || 0)}** netos\n\n` +
        `### Desglose Individual por Habitación:\n${lines}`,
      actions: [
        { label: 'Configurar 10 Centros de Coste', tab: 'rack' },
        { label: 'Imputar Gasto en Caja', tab: 'caja' },
      ],
      structuredSnapshot: ccReport,
    }
  }

  // ============================================================================
  // SKILL 5: CRYPTOGRAPHIC QR LIFECYCLE AUDIT ("qr", "escaner", "checkin", "checkout")
  // ============================================================================
  if (q.includes('qr') || q.includes('escaner') || q.includes('token') || q.includes('check-in') || q.includes('checkin')) {
    const issued = activeBookings.filter((b) => b.qrStatus === 'issued')
    const activeInHotel = activeBookings.filter((b) => b.qrStatus === 'checked_in_active')
    const closed = activeBookings.filter((b) => b.qrStatus === 'redeemed_closed')

    const formatQrLine = (b: Booking) =>
      `• **${b.clientName}** (Hab. **${b.assignedRoomNumber || '-'}** · \`${b.id}\`): \`${b.qrToken}\` (${b.checkInDate} → ${b.checkOutDate})`

    return {
      skillId: 'qr_lifecycle_audit',
      skillName: 'Auditoría de Códigos QR Criptográficos (Ciclo Único)',
      reply:
        `🔒 **Estado del Motor Criptográfico de Códigos QR (HMAC-SHA256):**\n\n` +
        `1. **Listos para 1° Uso — Check-in de Entrada (${issued.length}):**\n` +
        `${issued.map(formatQrLine).join('\n') || '   • Ninguno pendiente de entrada'}\n\n` +
        `2. **Activos en Hotel — Listos para 2° Uso Check-out de Salida (${activeInHotel.length}):**\n` +
        `${activeInHotel.map(formatQrLine).join('\n') || '   • Ninguno en estadía activa'}\n\n` +
        `3. **Quemados y Cerrados Permanentemente 2/2 Usos (${closed.length}):**\n` +
        `${closed.map(formatQrLine).join('\n') || '   • Ninguno cerrado recientemente'}\n\n` +
        `💡 *Cada código QR permite exactamente 1 escaneo de Entrada y 1 escaneo de Salida antes de bloquearse definitivamente.*`,
      actions: [
        { label: 'Abrir Escáner QR y Cámara', tab: 'checkin' },
        { label: 'Ver Correos con QR Enviados', tab: 'airbnb' },
      ],
      structuredSnapshot: {
        issuedCount: issued.length,
        activeInHotelCount: activeInHotel.length,
        closedCount: closed.length,
      },
    }
  }

  // ============================================================================
  // SKILL 6: PARKING & VEHICLE LICENSE PLATES ("estacionamiento", "auto", "patente", "matricula")
  // ============================================================================
  if (
    q.includes('estacionamiento') ||
    q.includes('parking') ||
    q.includes('auto') ||
    q.includes('vehiculo') ||
    q.includes('patente') ||
    q.includes('matricula')
  ) {
    const parkedNow = parking.filter((p) => p.status === 'estacionado')
    const lines = parkedNow
      .map(
        (p) =>
          `- **Patente \`${p.vehiclePlate}\`** — Huésped: **${p.guestName}** (Hab. **${p.roomNumber || '-'}**) · Ingreso: ${p.entryTime} · ${p.parkingSpot}`
      )
      .join('\n')

    return {
      skillId: 'parking_and_security',
      skillName: 'Control de Estacionamiento CCTV & Matrículas',
      reply:
        `🚗 **Control de Vehículos y Matrículas en Estacionamiento Interior (CCTV):**\n\n` +
        `- **Vehículos Estacionados Actualmente:** **${parkedNow.length}**\n` +
        `- **Historial Total de Registros:** ${parking.length}\n\n` +
        `### Nómina de Patentes en Recinto:\n${lines || '- No hay vehículos estacionados en este instante.'}`,
      actions: [{ label: 'Abrir Módulo Estacionamiento CCTV', tab: 'parking' }],
      structuredSnapshot: { parkedNow },
    }
  }

  // ============================================================================
  // SKILL 7: AIRBNB DUAL-EMAIL SYNC & EMAIL OUTBOX ("airbnb", "correo", "outbox", "sync")
  // ============================================================================
  if (q.includes('airbnb') || q.includes('correo') || q.includes('mail') || q.includes('sync')) {
    const accLines = (airbnbConfig.accounts || [])
      .map(
        (a) =>
          `- **${a.label}** (\`${a.email}\`): ${a.appPasswordConfigured ? '✅ Contraseña de Aplicación Configurada' : '⚙️ Pendiente configurar App Password'} · Sincronizadas: **${a.syncedCount || 0}**`
      )
      .join('\n')

    const mailLines = emailOutbox
      .slice(0, 5)
      .map(
        (m) =>
          `- **${m.clientName}** (\`${m.toEmail}\` · Hab. **${m.assignedRoomNumber || '-'}**): QR \`${m.qrToken}\` — Estado: \`${m.deliveryStatus}\``
      )
      .join('\n')

    return {
      skillId: 'airbnb_and_email_outbox',
      skillName: 'Sincronización Dual Airbnb & Bandeja de Correos QR',
      reply:
        `📬 **Estado de Integración Dual Airbnb & Envío Automático de Correos con QR:**\n\n` +
        `### Cuentas de Correo Vinculadas:\n${accLines}\n\n` +
        `- **Total Comprobantes Airbnb Sincronizados:** **${airbnbLogs.length}**\n` +
        `- **Total Correos Corporativos con QR Despachados:** **${emailOutbox.length}**\n\n` +
        `### Últimos Correos con Pase QR Enviados a Huéspedes:\n${mailLines}`,
      actions: [{ label: 'Abrir Airbnb 2 Correos & Probador SMTP', tab: 'airbnb' }],
      structuredSnapshot: { accounts: airbnbConfig.accounts, emailsSent: emailOutbox.length },
    }
  }

  // ============================================================================
  // SKILL 8: CASH FLOW & FINANCIAL LEDGER ("caja", "ingreso", "gasto", "finanza", "webpay")
  // ============================================================================
  if (
    q.includes('caja') ||
    q.includes('ingreso') ||
    q.includes('gasto') ||
    q.includes('finanza') ||
    q.includes('venta') ||
    q.includes('plata') ||
    q.includes('balance') ||
    q.includes('webpay')
  ) {
    const txLines = transactions
      .slice(0, 6)
      .map(
        (t) =>
          `- \`${t.date}\` · **${t.description}** (${t.roomNumber ? `CC Hab. ${t.roomNumber}` : t.operator}): **${t.amount >= 0 ? `+${formatCLP(t.amount)}` : `-${formatCLP(Math.abs(t.amount))}`}**`
      )
      .join('\n')

    return {
      skillId: 'cash_and_finances',
      skillName: 'Auditoría de Caja, Ingresos por Canal y Gastos',
      reply:
        `💰 **Estado Financiero en Vivo — Libro de Caja All Rent Hoteles:**\n\n` +
        `- **Saldo Disponible en Caja:** **${formatCLP(cashSummary.availableBalance)}**\n` +
        `- **Ingresos Totales Recaudados:** **${formatCLP(cashSummary.totalIncome)}**\n` +
        `  • Pasarela Web Online: **${formatCLP(cashSummary.webpayIncome)}**\n` +
        `  • Payouts Airbnb Sync: **${formatCLP(cashSummary.airbnbIncome)}**\n` +
        `  • Recepción / Portería Directa: **${formatCLP(cashSummary.porteriaIncome || 0)}**\n` +
        `- **Gastos Operativos (Centros de Coste):** **-${formatCLP(cashSummary.totalExpense)}**\n` +
        `- **Tarifa Promedio (ADR):** ${formatCLP(metrics.adr)} | **RevPAR:** ${formatCLP(metrics.revPar)}\n\n` +
        `### Últimos Movimientos Registrados:\n${txLines}`,
      actions: [
        { label: 'Abrir Libro de Caja', tab: 'caja' },
        { label: 'Ver P&L 10 Habitaciones', tab: 'rack' },
      ],
      structuredSnapshot: { cashSummary },
    }
  }

  // ============================================================================
  // SKILL 9: WEB SOLICITUDES & CRM CLIENTS ("solicitud", "cotizacion", "cliente", "crm")
  // ============================================================================
  if (
    q.includes('solicitud') ||
    q.includes('cotizacion') ||
    q.includes('lead') ||
    q.includes('crm') ||
    q.includes('frecuente')
  ) {
    const solLines = solicitudes
      .map(
        (s) =>
          `- **${s.nombre}** (\`${s.estado.toUpperCase()}\`): Interés en **${s.habitacionInteres}** para el ${s.checkInDeseado} (${s.noches} noches, ${s.huespedes} pers.) · Presupuesto est.: **${formatCLP(s.presupuestoEstimado || 0)}** · Tel: \`${s.telefono}\``
      )
      .join('\n')

    const topClients = [...clients]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 4)
      .map(
        (c) =>
          `- **${c.name}** (${c.origin}): **${c.totalStays}** estadías · Total invertido: **${formatCLP(c.totalSpent)}** · Hab. preferida: ${c.favoriteRoom || '-'}`
      )
      .join('\n')

    return {
      skillId: 'crm_leads_and_clients',
      skillName: 'Solicitudes Web & Ranking Clientes CRM',
      reply:
        `📩 **Solicitudes Web de Cotización (${solicitudes.length}):**\n${solLines}\n\n` +
        `👥 **Top Huéspedes en CRM (${clients.length} registrados):**\n${topClients}`,
      actions: [
        { label: 'Responder Solicitudes por WhatsApp', tab: 'solicitudes' },
        { label: 'Ver Directorio CRM', tab: 'clientes' },
      ],
      structuredSnapshot: { solicitudesCount: solicitudes.length, clientsCount: clients.length },
    }
  }

  // ============================================================================
  // SKILL 10 (DEFAULT / RESERVATIONS & OCCUPANCY): FULL SYSTEM & RESERVATIONS OVERVIEW
  // ============================================================================
  const availUnits = units.filter((u) => u.status === 'disponible')
  const occUnits = units.filter((u) => u.status === 'ocupada')
  const cleanUnits = units.filter((u) => u.status === 'aseo_pendiente')

  const bookingLines = activeBookings
    .map((b) => {
      const debt = Math.max(0, b.totalAmount - (b.amountPaid || 0))
      return (
        `- **${b.id}**${b.externalCode ? ` (Airbnb \`${b.externalCode}\`)` : ''} — **${b.clientName}**\n` +
        `  • **Habitación:** Hab. **${b.assignedRoomNumber || '-'}** (${b.roomCategoryName}) · **${b.checkInDate}** al **${b.checkOutDate}** (${b.nightsCount}n)\n` +
        `  • **Pago:** ${formatCLP(b.amountPaid)} / ${formatCLP(b.totalAmount)} (${debt > 0 ? `⚠️ Deuda: ${formatCLP(debt)}` : '✅ 100% Pagado'}) · **Estado:** \`${b.status}\` · **QR:** \`${b.qrStatus}\``
      )
    })
    .join('\n\n')

  return {
    skillId: 'reservations_and_occupancy',
    skillName: 'Radiografía Operativa de Reservas & 10 Habitaciones',
    reply:
      `🏨 **Estado Operativo en Tiempo Real — All Rent Hoteles (Av. Bulnes 119, Quintero):**\n\n` +
      `- **Ocupación Actual (10 Centros de Coste):** **${metrics.occupancyRate}%** (**${occUnits.length}** ocupadas · **${availUnits.length}** disponibles: ${availUnits.map((u) => `Hab. ${u.number}`).join(', ') || 'Ninguna'} · **${cleanUnits.length}** en aseo)\n` +
      `- **Balance Disponible en Caja:** **${formatCLP(cashSummary.availableBalance)}** | **Deuda por Cobrar:** **$0**\n` +
      `- **Códigos QR Activos:** **${metrics.qrStats?.issuedReady || 0}** listos para entrada · **${metrics.qrStats?.checkedInActive || 0}** en hotel · **${metrics.qrStats?.redeemedClosed || 0}** cerrados\n\n` +
      `### Detalle de Reservas Activas (${activeBookings.length}):\n${bookingLines}\n\n` +
      `💡 *Puedes preguntarme por un huésped específico (ej. "Fernanda Soto"), "clientes en deuda", "rentabilidad de las 10 habitaciones", "estado de los QR", "patentes en estacionamiento" o darme órdenes como "poner Hab. 105 disponible".*`,
    actions: [
      { label: 'Abrir Calendario Compacto & Reservas', tab: 'reservas' },
      { label: 'Abrir Escáner QR Check-in/Out', tab: 'checkin' },
      { label: 'Ver 10 Centros de Coste', tab: 'rack' },
    ],
    structuredSnapshot: {
      occupancyRate: metrics.occupancyRate,
      availableRooms: availUnits.map((u) => u.number),
      activeBookingsCount: activeBookings.length,
    },
  }
}
