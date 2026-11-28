import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { db } from '@/lib/db'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    if (body.accountId && (body.accountId === 'account_1' || body.accountId === 'account_2')) {
      const updated = db.updateAirbnbEmailAccount(body.accountId, body.updates || {})
      return NextResponse.json({ success: true, data: updated })
    }
    const updated = db.updateAirbnbConfig(body)
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando configuración de cuentas Airbnb.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const config = db.getAirbnbConfig()

    // Support syncing a specific account or both configured Airbnb email accounts
    const targetAccountId = body.accountId as 'account_1' | 'account_2' | undefined

    // If direct ad-hoc credentials were passed in body, update the target account first
    if (targetAccountId && (body.email || body.appPassword)) {
      db.updateAirbnbEmailAccount(targetAccountId, {
        ...(body.email ? { email: body.email } : {}),
        ...(body.holderName ? { holderName: body.holderName } : {}),
        ...(body.imapHost ? { imapHost: body.imapHost } : {}),
        ...(body.smtpHost ? { smtpHost: body.smtpHost } : {}),
        ...(body.appPassword ? { appPassword: body.appPassword, appPasswordConfigured: true } : {}),
      })
    }

    const freshConfig = db.getAirbnbConfig()
    const accountsToSync = targetAccountId
      ? freshConfig.accounts.filter((a) => a.id === targetAccountId)
      : freshConfig.accounts.filter((a) => a.enabled)

    const accountsWithPassword = accountsToSync.filter(
      (a) => a.email && a.appPassword && a.appPassword.trim().length >= 8
    )

    if (accountsWithPassword.length === 0) {
      return NextResponse.json(
        {
          success: false,
          requiresCredentials: true,
          error:
            'Para sincronizar por IMAP directo, guarda primero la Contraseña de Aplicación (16 caracteres) en la Cuenta #1 o Cuenta #2 de Airbnb (o utiliza el Simulador / Webhook de Comprobantes abajo para probar el flujo completo de inmediato).',
        },
        { status: 400 }
      )
    }

    let processedCount = 0
    const createdBookings: string[] = []
    const accountErrors: string[] = []

    for (const acc of accountsWithPassword) {
      const client = new ImapFlow({
        host: acc.imapHost || 'imap.gmail.com',
        port: Number(acc.imapPort || 993),
        secure: true,
        auth: {
          user: acc.email.trim(),
          pass: acc.appPassword!.replace(/\s+/g, ''),
        },
        logger: false,
      })

      try {
        await client.connect()
        const lock = await client.getMailboxLock('INBOX')
        try {
          const sinceDate = new Date()
          sinceDate.setDate(sinceDate.getDate() - 14)

          const uids = await client.search({
            since: sinceDate,
            or: [
              { from: 'airbnb.com' },
              { subject: 'Airbnb' },
              { subject: 'Reserva confirmada' },
            ],
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
              accountId: acc.id,
              accountLabel: acc.label,
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

        db.updateAirbnbEmailAccount(acc.id, {
          lastSyncAt: new Date().toISOString(),
          appPasswordConfigured: true,
        })
      } catch (accErr: unknown) {
        const msg = accErr instanceof Error ? accErr.message : 'Error IMAP'
        accountErrors.push(`${acc.label} (${acc.email}): ${msg}`)
      }
    }

    if (accountErrors.length > 0 && processedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo conectar por IMAP: ${accountErrors.join(' | ')}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      processedCount,
      createdBookings,
      accountErrors,
      config: db.getAirbnbConfig(),
      logs: db.getAirbnbLogs().slice(0, 15),
      emailOutbox: db.getEmailOutbox().slice(0, 15),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error de conexión IMAP'
    return NextResponse.json(
      { success: false, error: `No se pudo conectar al buzón IMAP: ${msg}` },
      { status: 502 }
    )
  }
}
