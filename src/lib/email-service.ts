import nodemailer from 'nodemailer'
import {
  AirbnbEmailAccountConfig,
  Booking,
  EmailOutboxLog,
  HotelSettings,
} from '@/types/saas'
import { formatCLP } from './pricing'
import { generateQrImageDataUrl } from './qr-engine'

/**
 * Builds the branded corporate HTML confirmation email for All Rent Hoteles Quintero
 * with embedded unique QR code, reservation summary, assigned room, 12:00-12:00 schedule,
 * hotel rules, Google Maps location, and Guest Portal access.
 */
export function buildBookingConfirmationEmailHtml(params: {
  booking: Booking
  settings: HotelSettings
  qrDataUrl?: string
  baseUrl?: string
}): string {
  const { booking, settings, qrDataUrl } = params
  const baseUrl = params.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const qrToken = booking.qrToken || `ARHQR.${booking.id}`
  const portalUrl = `${baseUrl}/mi-reserva?codigo=${encodeURIComponent(booking.id)}`
  const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(
    qrToken
  )}`
  const qrImgSrc = qrDataUrl || qrFallbackUrl

  const channelLabel =
    booking.source === 'airbnb_email'
      ? `Airbnb Oficial (${booking.externalCode || booking.id})`
      : booking.source === 'web_online'
      ? 'Sitio Web Oficial All Rent Hoteles'
      : 'Recepción Directa All Rent Hoteles'

  const platesText =
    booking.vehiclePlates && booking.vehiclePlates.length > 0
      ? booking.vehiclePlates.join(', ')
      : 'Registrar al ingresar en Portería'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Reserva & Pase QR — ${settings.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#050605;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050605;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:#000000;border:1px solid rgba(176,228,84,0.38);border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.9);">
          
          <!-- TOP BRAND HEADER -->
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(180deg,rgba(176,228,84,0.14) 0%,rgba(0,0,0,1) 100%);border-bottom:1px solid rgba(176,228,84,0.25);">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:rgba(176,228,84,0.15);border:1px solid rgba(176,228,84,0.45);color:#B0E454;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
                      ALL RENT HOTELES · QUINTERO
                    </div>
                    <h1 style="margin:12px 0 4px 0;font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:-0.4px;">
                      ¡Gracias por reservar en All Rent Hoteles!
                    </h1>
                    <p style="margin:0;font-size:13px;color:#A1A1AA;">
                      Tu reserva y habitación ya están bloqueadas y confirmadas en nuestro sistema central.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING & SUMMARY -->
          <tr>
            <td style="padding:26px 32px 12px 32px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#E4E4E7;">
                Estimado/a <strong style="color:#FFFFFF;">${booking.clientName}</strong>,
              </p>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#D4D4D8;">
                Hemos recibido y confirmado tu reserva a través de <strong style="color:#B0E454;">${channelLabel}</strong>. A continuación encontrarás tu <strong>Código QR Único de Check-in y Check-out</strong>, el detalle de tu habitación asignada, nuestros horarios oficiales y las normas del hotel.
              </p>
            </td>
          </tr>

          <!-- UNIQUE CRYPTOGRAPHIC QR BOX -->
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#090B08;border:2px solid #B0E454;border-radius:18px;padding:24px;text-align:center;">
                <tr>
                  <td align="center">
                    <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#B0E454;text-transform:uppercase;margin-bottom:6px;">
                      PASE DIGITAL ÚNICO · CHECK-IN ENTRADA &amp; CHECK-OUT SALIDA
                    </div>
                    <div style="font-size:13px;color:#D4D4D8;margin-bottom:16px;">
                      Presenta este código QR en Portería / Recepción al ingresar y al finalizar tu estadía.
                    </div>
                    <div style="display:inline-block;background-color:#FFFFFF;padding:14px;border-radius:16px;border:3px solid #B0E454;">
                      <img src="${qrImgSrc}" alt="Código QR Check-in ${booking.id}" width="220" height="220" style="display:block;width:220px;height:220px;" />
                    </div>
                    <div style="margin-top:14px;font-family:monospace;font-size:12px;color:#B0E454;background-color:#000000;padding:8px 14px;border-radius:8px;border:1px solid rgba(176,228,84,0.3);display:inline-block;word-break:break-all;">
                      ${qrToken}
                    </div>
                    <p style="margin:12px 0 0 0;font-size:11px;color:#A1A1AA;line-height:1.5;">
                      🔒 <strong>Seguridad de Ciclo Único:</strong> Este QR es único e irrepetible. Permite <strong>1 escaneo de Entrada (Check-in)</strong> y <strong>1 escaneo de Salida (Check-out)</strong>, quedando cerrado automáticamente tras tu salida.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- RESERVATION DETAILS TABLE -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#0A0C09;border:1px solid rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="padding:12px 18px;background-color:rgba(176,228,84,0.12);border-bottom:1px solid rgba(176,228,84,0.22);font-size:12px;font-weight:800;color:#B0E454;text-transform:uppercase;letter-spacing:1.2px;">
                    Ficha Oficial de Reserva
                  </td>
                </tr>
                <tr>
                  <td style="padding:11px 18px;font-size:13px;color:#A1A1AA;border-bottom:1px solid rgba(255,255,255,0.06);">Código de Reserva</td>
                  <td style="padding:11px 18px;font-size:13px;font-weight:800;color:#FFFFFF;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
                    ${booking.id}${booking.externalCode ? ` (Airbnb: ${booking.externalCode})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:11px 18px;font-size:13px;color:#A1A1AA;border-bottom:1px solid rgba(255,255,255,0.06);">Habitación Asignada</td>
                  <td style="padding:11px 18px;font-size:13px;font-weight:800;color:#B0E454;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
                    ${booking.assignedRoomNumber ? `Habitación ${booking.assignedRoomNumber} · ` : ''}${booking.roomCategoryName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:11px 18px;font-size:13px;color:#A1A1AA;border-bottom:1px solid rgba(255,255,255,0.06);">Check-in (Entrada)</td>
                  <td style="padding:11px 18px;font-size:13px;font-weight:700;color:#FFFFFF;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
                    ${booking.checkInDate} · Desde las ${settings.checkInTime} hrs
                  </td>
                </tr>
                <tr>
                  <td style="padding:11px 18px;font-size:13px;color:#A1A1AA;border-bottom:1px solid rgba(255,255,255,0.06);">Check-out (Salida)</td>
                  <td style="padding:11px 18px;font-size:13px;font-weight:700;color:#FFFFFF;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
                    ${booking.checkOutDate} · Hasta las ${settings.checkOutTime} hrs (${booking.nightsCount} ${booking.nightsCount === 1 ? 'noche' : 'noches'})
                  </td>
                </tr>
                <tr>
                  <td style="padding:11px 18px;font-size:13px;color:#A1A1AA;border-bottom:1px solid rgba(255,255,255,0.06);">Huéspedes &amp; Matrícula</td>
                  <td style="padding:11px 18px;font-size:13px;font-weight:700;color:#FFFFFF;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
                    ${booking.guestsCount} ${booking.guestsCount === 1 ? 'huésped' : 'huéspedes'} · Patente: ${platesText}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;font-size:13px;color:#A1A1AA;">Monto Total &amp; Estado</td>
                  <td style="padding:12px 18px;font-size:14px;font-weight:900;color:#B0E454;text-align:right;">
                    ${formatCLP(booking.totalAmount)} CLP · ${booking.paymentStatus === 'paid_full' ? '100% PAGADO' : `Abonado ${formatCLP(booking.amountPaid)}`}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- RULES, NORMS & EXTRA NIGHTS AT PORTERIA -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="background-color:#0A0C09;border:1px solid rgba(176,228,84,0.25);border-radius:14px;padding:18px 20px;">
                <div style="font-size:12px;font-weight:800;color:#B0E454;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;">
                  Normas del Hotel, Horarios &amp; Extensión de Estadía
                </div>
                <ul style="margin:0;padding-left:18px;font-size:13px;color:#D4D4D8;line-height:1.65;">
                  <li><strong>Horario Oficial:</strong> Check-in de entrada desde las <strong>12:00 hrs</strong> y Check-out de salida hasta las <strong>12:00 hrs</strong>.</li>
                  <li><strong>Ingreso con QR en Portería:</strong> Al llegar a Av. Bulnes 119, muestra tu QR al administrador para validar tus datos, patente de vehículo y entregarte tu habitación.</li>
                  <li><strong>Estacionamiento Privado Gratuito:</strong> Contamos con estacionamiento cerrado y monitoreado por CCTV dentro del recinto.</li>
                  <li><strong>¿Deseas quedarte más días?</strong> Si durante tu estadía deseas extender noches adicionales, solicítalo directamente en <strong>Portería / Recepción</strong> para realizar la asignación y cobro extra correspondiente.</li>
                  <li><strong>Convivencia &amp; Espacios:</strong> Uso libre de kitchenette (refrigerador y microondas) y patio interior, manteniendo un ambiente tranquilo y respetuoso.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- LOCATION, PORTAL & SOCIAL LINKS -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#090B08;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px 20px;">
                <tr>
                  <td>
                    <div style="font-size:12px;font-weight:800;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                      📍 Ubicación &amp; Portal de Huésped
                    </div>
                    <p style="margin:0 0 14px 0;font-size:13px;color:#A1A1AA;line-height:1.5;">
                      <strong>${settings.address}</strong> (Frente a la playa principal de Quintero, al costado de la Armada de Chile y a 10 minutos caminando de la Plaza).
                    </p>
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right:10px;">
                          <a href="${portalUrl}" style="display:inline-block;padding:11px 18px;background-color:#B0E454;color:#000000;font-size:12px;font-weight:800;text-decoration:none;border-radius:10px;text-transform:uppercase;letter-spacing:0.6px;">
                            Abrir Mi Pase QR Online
                          </a>
                        </td>
                        <td style="padding-right:10px;">
                          <a href="https://maps.google.com/?q=Av.+Bulnes+119,+Quintero,+Chile" style="display:inline-block;padding:11px 16px;background-color:#141712;color:#FFFFFF;border:1px solid rgba(176,228,84,0.35);font-size:12px;font-weight:700;text-decoration:none;border-radius:10px;">
                            Ver en Google Maps
                          </a>
                        </td>
                        <td>
                          <a href="https://wa.me/${settings.whatsapp}" style="display:inline-block;padding:11px 16px;background-color:#141712;color:#B0E454;border:1px solid rgba(176,228,84,0.35);font-size:12px;font-weight:700;text-decoration:none;border-radius:10px;">
                            WhatsApp Recepción
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:18px 32px;background-color:#050605;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:11px;color:#71717A;">
              © 2026 <strong>${settings.name}</strong> · ${settings.address} · Tel/WhatsApp: ${settings.phone}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Generates the QR image, builds the branded HTML confirmation email,
 * attempts live SMTP delivery if any of the 2 configured email accounts has an App Password,
 * and returns an EmailOutboxLog record to store in the database.
 */
export async function dispatchBookingConfirmationEmail(params: {
  booking: Booking
  settings: HotelSettings
  accounts?: AirbnbEmailAccountConfig[]
  triggerSource: 'web_booking' | 'airbnb_auto_sync' | 'manual_reception' | 'admin_resend'
}): Promise<EmailOutboxLog> {
  const { booking, settings, accounts = [], triggerSource } = params
  const qrToken = booking.qrToken || `ARHQR.${booking.id}`
  const qrDataUrl = await generateQrImageDataUrl(qrToken)

  const subject =
    booking.source === 'airbnb_email'
      ? `¡Gracias por reservar en All Rent Hoteles! Tu Pase QR de Check-in (${booking.externalCode || booking.id})`
      : `Confirmación de Reserva & Código QR de Check-in (${booking.id}) — All Rent Hoteles Quintero`

  const htmlBody = buildBookingConfirmationEmailHtml({
    booking,
    settings,
    qrDataUrl,
  })

  // Check if either of the 2 configured email accounts has an appPassword ready for SMTP
  const activeSmtpAccount = accounts.find(
    (acc) => acc.enabled && acc.email && acc.appPassword && acc.appPassword.trim().length >= 8
  )

  let deliveryStatus: 'sent_smtp' | 'stored_outbox_preview' | 'smtp_error' =
    'stored_outbox_preview'
  let senderEmailUsed = settings.email
  let errorDetail: string | undefined

  if (activeSmtpAccount && booking.clientEmail && booking.clientEmail.includes('@')) {
    senderEmailUsed = activeSmtpAccount.email
    try {
      const transporter = nodemailer.createTransport({
        host: activeSmtpAccount.smtpHost || 'smtp.gmail.com',
        port: activeSmtpAccount.smtpPort || 465,
        secure: (activeSmtpAccount.smtpPort || 465) === 465,
        auth: {
          user: activeSmtpAccount.email,
          pass: activeSmtpAccount.appPassword!.replace(/\s+/g, ''),
        },
      })

      await transporter.sendMail({
        from: `"${settings.name} Quintero" <${activeSmtpAccount.email}>`,
        to: booking.clientEmail,
        subject,
        html: htmlBody,
      })
      deliveryStatus = 'sent_smtp'
    } catch (err: unknown) {
      deliveryStatus = 'smtp_error'
      errorDetail = err instanceof Error ? err.message : 'Error SMTP al enviar correo'
    }
  }

  return {
    id: `MAIL-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 89)}`,
    bookingId: booking.id,
    externalCode: booking.externalCode,
    toEmail: booking.clientEmail,
    clientName: booking.clientName,
    fromAccountEmail: senderEmailUsed,
    subject,
    qrToken,
    qrDataUrl,
    assignedRoomNumber: booking.assignedRoomNumber,
    roomCategoryName: booking.roomCategoryName,
    triggerSource,
    deliveryStatus,
    sentAt: new Date().toISOString(),
    htmlBody,
    errorDetail,
  }
}
