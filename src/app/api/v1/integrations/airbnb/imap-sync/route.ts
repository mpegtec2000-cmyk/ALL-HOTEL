import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { db } from '@/lib/db'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const updated = db.updateAirbnbConfig(body)
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando configuración Airbnb.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const config = db.getAirbnbConfig()

    const host = body.imapHost || process.env.AIRBNB_IMAP_HOST || config.imapHost
    const port = Number(body.imapPort || process.env.AIRBNB_IMAP_PORT || config.imapPort || 993)
    const user = body.imapUser || process.env.AIRBNB_IMAP_USER || config.imapUser
    const pass = body.imapPassword || process.env.AIRBNB_IMAP_PASSWORD || ''

    if (!pass) {
      return NextResponse.json(
        {
          success: false,
          requiresCredentials: true,
          error:
            'Para conexión IMAP directa ingresa tu Contraseña de Aplicación del correo (o usa el Conector Automático Gmail Apps Script / Webhook que no requiere contraseña).',
        },
        { status: 400 }
      )
    }

    const client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: false,
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    let processedCount = 0
    const createdBookings: string[] = []

    try {
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - 14)

      const uids = await client.search({
        since: sinceDate,
        or: [{ from: 'airbnb.com' }, { subject: 'Airbnb' }, { subject: 'Reserva confirmada' }],
      })

      const recentUids = Array.isArray(uids) ? uids.slice(-15) : []
      for (const uid of recentUids) {
        const msg = await client.fetchOne(uid, { envelope: true, source: true })
        if (!msg || !msg.source) continue
        const rawSource = msg.source.toString('utf-8')
        const subject = msg.envelope?.subject || 'Comprobante Airbnb'
        const fromAddr = msg.envelope?.from?.[0]?.address || 'automated@airbnb.com'

        const res = db.ingestAirbnbEmail({
          from: fromAddr,
          subject,
          textBody: rawSource,
        })
        processedCount++
        if (res.log.status === 'synced' && res.booking) {
          createdBookings.push(res.booking.id)
        }
      }
    } finally {
      lock.release()
      await client.logout()
    }

    db.updateAirbnbConfig({
      imapHost: host,
      imapPort: port,
      imapUser: user,
      imapPasswordConfigured: true,
      lastSyncAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      processedCount,
      createdBookings,
      logs: db.getAirbnbLogs().slice(0, 15),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error de conexión IMAP'
    return NextResponse.json(
      { success: false, error: `No se pudo conectar al buzón IMAP: ${msg}` },
      { status: 502 }
    )
  }
}
