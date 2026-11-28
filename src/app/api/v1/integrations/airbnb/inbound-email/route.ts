import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAMPLE_AIRBNB_EMAIL_TEMPLATES } from '@/lib/airbnb-parser'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      config: db.getPublicAirbnbConfig(),
      logs: db.getAirbnbLogs(),
      emailOutbox: db.getEmailOutbox(),
      templates: SAMPLE_AIRBNB_EMAIL_TEMPLATES,
    },
  })
}

/**
 * Inbound Email Webhook Endpoint
 * Receives forwarded Airbnb confirmation/cancellation emails from:
 * - Dual Email Accounts (Cuenta #1 & Cuenta #2) via Gmail Apps Script / IMAP
 * - Cloudflare Email Workers / SendGrid Inbound Parse / Mailgun / Postmark
 * - Admin Manual Voucher Tester
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let from = 'automated@airbnb.com'
    let accountId: 'account_1' | 'account_2' = 'account_1'
    let accountLabel = ''
    let subject = ''
    let textBody = ''
    let htmlBody = ''
    let providedSecret = request.headers.get('x-webhook-secret') || ''

    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const form = await request.formData()
      from = String(form.get('from') || form.get('sender') || 'automated@airbnb.com')
      accountId =
        form.get('accountId') === 'account_2' ? 'account_2' : 'account_1'
      accountLabel = String(form.get('accountLabel') || '')
      subject = String(form.get('subject') || '')
      textBody = String(form.get('text') || form.get('plain') || form.get('body-plain') || '')
      htmlBody = String(form.get('html') || form.get('body-html') || '')
      providedSecret = providedSecret || String(form.get('secret') || '')
    } else {
      const body = await request.json()
      from = body.from || body.sender || 'automated@airbnb.com'
      accountId = body.accountId === 'account_2' ? 'account_2' : 'account_1'
      accountLabel = body.accountLabel || ''
      subject = body.subject || ''
      textBody = body.textBody || body.text || body.body || ''
      htmlBody = body.htmlBody || body.html || ''
      providedSecret = providedSecret || body.secret || ''
    }

    const config = db.getAirbnbConfig()
    if (!config.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'La sincronización de correo Airbnb se encuentra pausada en configuración.',
        },
        { status: 403 }
      )
    }

    if (
      providedSecret &&
      providedSecret !== 'admin_internal' &&
      providedSecret !== config.webhookSecret
    ) {
      return NextResponse.json(
        { success: false, error: 'Secreto de Webhook inválido.' },
        { status: 401 }
      )
    }

    if (!subject && !textBody && !htmlBody) {
      return NextResponse.json(
        { success: false, error: 'El cuerpo del correo está vacío.' },
        { status: 400 }
      )
    }

    const result = db.ingestAirbnbEmail({
      from,
      accountId,
      accountLabel: accountLabel || undefined,
      subject,
      textBody,
      htmlBody,
    })

    return NextResponse.json({
      success: true,
      log: result.log,
      booking: result.booking,
      emailLog: result.emailLog,
    })
  } catch (error) {
    console.error('Airbnb Inbound Email Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Error procesando el comprobante de correo Airbnb.' },
      { status: 500 }
    )
  }
}
