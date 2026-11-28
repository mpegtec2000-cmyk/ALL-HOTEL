---
name: hotel-qr-checkin-engine
description: Motor criptográfico de generación, firma HMAC-SHA256, validación de autenticidad y ciclo de vida de 2 pasos (Check-in de Entrada + Check-out de Salida con cierre definitivo) para códigos QR únicos de reservas hoteleras, con integración automática de correos de confirmación y sincronización dual Airbnb.
---

# Hotel QR Check-in & Check-out Cryptographic Engine

Esta skill estandariza el motor de generación y validación de **Códigos QR únicos e irrepetibles** para sistemas PMS / SaaS hoteleros (como **All Rent Hoteles**). Garantiza que cada reserva confirmada (Web Online, Comprobante de Correo Airbnb o Recepción Manual) reciba un token QR firmado criptográficamente que solo puede utilizarse para **un Check-in de Entrada** y **un Check-out de Salida**, quedando permanentemente cerrado (`redeemed_closed`) tras la salida del huésped.

---

## 1. Arquitectura del Token QR Criptográfico (`ARHQR`)

Cada reserva genera un `qrToken` único con formato determinístico y firma `HMAC-SHA256`:

```text
ARHQR.<BOOKING_ID>.<NONCE_HEX_8>.<HMAC_SHA256_SIG_16>
```

- **Prefijo (`ARHQR`)**: Identificador del motor de QR de All Rent Hoteles.
- **`BOOKING_ID`**: Identificador único de la reserva en la base de datos (ej. `ARH-2026-1042`).
- **`NONCE_HEX_8`**: 8 caracteres hexadecimales generados con `crypto.randomBytes(4)` o derivados de forma única al momento de emitir la reserva, garantizando que ningún QR sea igual a otro.
- **`HMAC_SHA256_SIG_16`**: Primeros 16 caracteres en mayúsculas del `HMAC-SHA256(secret, "${bookingId}:${nonce}:${clientEmail.toLowerCase()}")`.

### Verificación de Autenticidad
Cuando el administrador escanea el QR desde `/admin` (con cámara del smartphone/PC o lector), el backend:
1. Extrae `bookingId`, `nonce` y `sig` del token `ARHQR...` (o desde la URL firmada `/admin?scan=ARHQR...`).
2. Consulta la reserva en la base de datos y verifica que `booking.qrToken === token`.
3. Recalcula el `HMAC-SHA256` con la clave secreta del servidor para confirmar que el QR fue emitido genuinamente por el motor de la plataforma.

---

## 2. Máquina de Estados de Ciclo Único (Entrada + Salida)

Un código QR tiene exactamente **3 estados** en su ciclo de vida (`BookingQrStatus`):

| Estado (`qrStatus`) | Escaneos (`usedCount`) | Acción Permitida al Escanear en `/admin` | Resultado |
| :--- | :---: | :--- | :--- |
| `issued` | `0 / 2` | **1° Uso — Check-in de Entrada** | Valida pago 100%, muestra datos del huésped (nombre, RUT, matrícula/patente, teléfono, correo, habitación asignada), registra ingreso físico, marca habitación como `ocupada` y pasa el QR a `checked_in_active`. |
| `checked_in_active` | `1 / 2` | **2° Uso — Check-out de Salida** | Bloquea cualquier intento de nuevo Check-in de entrada. Habilita únicamente el **Check-out de Salida** con ticket de revisión de habitación, marca la habitación en `aseo_pendiente` y quema/cierra el QR pasando a `redeemed_closed`. |
| `redeemed_closed` | `2 / 2` | **QR Cerrado / Inutilizable** | Rechaza cualquier nuevo uso de entrada o salida con alerta explícita (`"QR YA UTILIZADO Y CERRADO"`), mostrando únicamente el historial de auditoría de cuándo ingresó y cuándo salió el huésped. |

---

## 3. Automatización Multi-Canal (Web + Airbnb Dual-Email -> Correo con QR)

1. **Reserva Web o Manual**:
   - El cliente reserva y paga el **100% del monto total** en `/reservar` (o recepción registra la reserva).
   - Se asigna automáticamente una de las **10 habitaciones físicas (Centros de Coste `Hab. 101` a `Hab. 110`)**.
   - Se genera el `qrToken` único y se envía automáticamente el **Correo Oficial de Confirmación** con logo de la marca, código QR embebido, normas del hotel, horario Check-in 12:00 / Check-out 12:00, ubicación Av. Bulnes 119 y enlace al Portal del Huésped (`/mi-reserva`).
2. **Integración Airbnb con 2 Correos y Contraseñas de Aplicación**:
   - El sistema permite configurar **2 cuentas de correo electrónico con sus respectivas Contraseñas de Aplicación** (`Account 1` y `Account 2`).
   - Al detectar un comprobante de reserva de Airbnb en cualquiera de los 2 correos:
     - Parsea huésped, fechas, categoría de habitación, código `HM...`, teléfono/correo y monto pagado.
     - Bloquea la habitación en el calendario y asigna el ingreso al Centro de Costes de esa habitación.
     - Genera el `qrToken` único y despacha automáticamente el correo de bienvenida con el QR y las normas al correo del huésped.
3. **Extensión de Estadía / Cobro Extra en Portería**:
   - Si el huésped desea quedarse días adicionales, en `/admin` se ejecuta **"Extender Estadía / Cobro Extra en Portería"**, sumando noches y monto al Centro de Costes de la habitación y al Libro de Caja sin invalidar el QR activo hasta su nueva fecha de Check-out.

---

## 4. Referencias y Scripts Incluidos

- `references/qr-lifecycle-spec.md`: Especificación técnica de endpoints, estructura JSON del payload de escaneo y plantilla de correo con QR.
- `scripts/verify_qr_token.mjs`: Script CLI en Node.js para generar y verificar tokens `ARHQR` desde terminal durante pruebas y auditorías.
