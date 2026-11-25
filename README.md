# All Rent Hoteles — Quintero (Full-Stack Web + Motor Reservas & Pagos + Sync Airbnb + PMS SaaS)

> *"Tu estadía, nuestra prioridad."* — **Av. Bulnes 119, Quintero, Valparaíso** · **Fono/WhatsApp:** `+56 9 9865 1440`

Plataforma hotelera Full-Stack construida en **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**.

## Identidad de Marca Aplicada
- **Verde Lima Neón:** `#39FF14` (RGB `57, 255, 20`)
- **Negro Obsidiana:** `#0B0B0B` (RGB `11, 11, 11`)
- **Blanco Puro:** `#FFFFFF` (RGB `255, 255, 255`)
- **Tipografía:** `Montserrat` + detalles script y barras geométricas diagonales oficiales.

## Tarifas Oficiales y Horario (Check-in 12:00 a Check-out 12:00)
1. **Superior Matrimonial (Baño privado en suite):** `$63.500` / noche
2. **Standard Matrimonial (Baño privado exterior):** `$53.500` / noche
3. **Doble Dos Camas (Baño privado exterior):** `$49.500` / noche
4. **Single Individual (Baño privado exterior):** `$39.500` / noche
5. **Familiar con Terraza (Baño privado):** `$79.500` / noche

## Rutas Principales
- `/` — Landing oficial con Hero de fondos automáticos, buscador rápido, habitaciones, servicios, galería con lightbox, reseñas, formulario de contacto, mapa oficial y Concierge Virtual.
- `/reservar` — Motor de reservas online en 4 pasos con validación multi-habitación, **Pasarela de Pago Online** (Webpay / Tarjetas Débito & Crédito, Mercado Pago, Transferencia; opción 100% o Abono 50%) y generación instantánea de Pase QR.
- `/mi-reserva` — Portal de autogestión de huéspedes (búsqueda por código `ARH-2026-XXXX` o código Airbnb `HM...`), pago de saldo pendiente y Check-in Digital con registro de patente vehicular.
- `/admin` — Sistema SaaS PMS Administrativo Completo (PIN de acceso: `2026` o `1234`).

## Automatización Airbnb por Correo (`Airbnb → Correo → Base de Datos`)
Desde `/admin` → pestaña **Airbnb Correo Sync**:
1. **Conector Gmail Automático (Sin costo):** Copia el Google Apps Script incluido en un clic, pégalo en `script.google.com` en el correo del hotel, y cada comprobante de `@airbnb.com` se registrará solo en la base de datos asignando habitación y sumando a Caja.
2. **Sincronización IMAP Directa:** Compatible con cualquier correo corporativo o Gmail mediante Contraseña de Aplicación (`POST /api/v1/integrations/airbnb/imap-sync`).
3. **Simulador / Procesador en Vivo:** Prueba al instante pegando o cargando comprobantes reales de confirmación o cancelación de Airbnb.

## Ejecución Local
```bash
npm install
npm run dev
```
Abrir `http://localhost:3000`.
