---
name: hotel-pms-copilot-agent
description: Agente Copiloto IA Hotelero con arquitectura de Agent Skills y Tool-Calling conectado en tiempo real a la base de datos PMS (auditoría de clientes en deuda y saldos por cobrar, búsqueda 360° de reservas/huéspedes/patentes, rentabilidad P&L de los 10 Centros de Coste Hab. 101-110, ciclo de códigos QR criptográficos, sincronización dual Airbnb, estacionamiento CCTV, caja y ejecución de comandos operativos).
---

# Hotel PMS Copilot Agent Skills Architecture

Esta skill dota al **Copiloto IA Ejecutivo de All Rent Hoteles** de una arquitectura modular basada en **10 Agent Skills / Tools** que consultan y operan sobre la base de datos en tiempo real (`src/lib/copilot-agent-engine.ts`).

---

## 1. Catálogo de Agent Skills del Copiloto IA

| Skill ID | Nombre de la Skill | Disparadores / Consultas que Resuelve | Datos & Acciones que Devuelve |
| :--- | :--- | :--- | :--- |
| `debt_and_collections` | **Auditoría de Clientes en Deuda & Saldos por Cobrar** | *"clientes en deuda"*, *"quién debe"*, *"saldo pendiente"*, *"por cobrar"*, *"abonos 50%"*, *"morosos"* | Lista exacta de reservas con saldo pendiente (`totalAmount - amountPaid > 0`) o pendientes de pago, monto adeudado por cliente, teléfono/WhatsApp, habitación e historial de cobros extra en Portería. |
| `guest_and_booking_lookup` | **Búsqueda 360° de Reserva, Huésped o Patente** | Nombre de cliente, RUT, código `ARH-2026-XXXX`, código Airbnb `HM...`, patente `PBYR-94` o `Hab. 101..110` | Ficha completa del huésped, estado de pago, token QR criptográfico (`0/2`, `1/2`, `2/2`), habitación asignada, patente y botones de acción directa. |
| `cost_centers_10_rooms` | **Rentabilidad P&L de los 10 Centros de Coste** | *"centros de coste"*, *"10 habitaciones"*, *"rentabilidad por pieza"*, *"qué habitación vende más"*, *"gastos por habitación"* | Ranking financiero de `Hab. 101` a `Hab. 110`: ingresos, costos imputados, margen neto, noches ocupadas y estado físico actual. |
| `qr_lifecycle_audit` | **Auditoría de Códigos QR Criptográficos** | *"estado de los QR"*, *"QR activos"*, *"QR cerrados"*, *"quién falta por escanear QR"* | Desglose de tokens `ARHQR` en estado `issued (0/2)`, `checked_in_active (1/2)` y `redeemed_closed (2/2)` más bitácora de escaneos. |
| `reservations_and_occupancy` | **Reservas Activas, Llegadas, Salidas & Disponibilidad** | *"reservas"*, *"ocupación"*, *"quién llega hoy"*, *"habitaciones libres"*, *"disponibilidad"* | Estado de las 10 habitaciones en vivo, huéspedes actualmente en el hotel (`checked_in`), próximas llegadas (`confirmed`) y tarifas oficiales. |
| `cash_and_finances` | **Libro de Caja, Flujo por Canal & Finanzas** | *"caja"*, *"ingresos"*, *"gastos"*, *"webpay"*, *"finanzas"*, *"balance"* | Balance disponible, ingresos por canal (Web Online, Airbnb Sync, Portería), gastos operativos, ADR, RevPAR y últimos movimientos. |
| `airbnb_and_email_outbox` | **Sincronización Dual Airbnb & Correos QR Enviados** | *"airbnb"*, *"correos enviados"*, *"comprobantes"*, *"bandeja de salida"* | Estado de `Cuenta Airbnb #1` y `Cuenta Airbnb #2`, reservas importadas desde Airbnb y correos HTML con QR enviados a clientes. |
| `parking_and_security` | **Control de Estacionamiento & Matrículas CCTV** | *"estacionamiento"*, *"autos"*, *"patentes"*, *"matrículas"*, *"vehículos"* | Vehículos estacionados actualmente, patente, conductor, habitación asignada y hora de ingreso. |
| `crm_leads_and_clients` | **Solicitudes Web Pendientes & Clientes CRM** | *"solicitudes"*, *"cotizaciones"*, *"clientes frecuentes"*, *"crm"* | Leads web pendientes de respuesta con presupuesto estimado y ranking de huéspedes con mayor gasto histórico. |
| `system_operational_command` | **Ejecución de Comandos Operativos desde el Chat** | *"poner Hab. 105 disponible"*, *"marcar Hab. 103 en aseo"*, *"registrar gasto de 15000 en Hab. 107 por..."* | Ejecuta la mutación real en `db` (cambio de estado de habitación o registro de movimiento en Centro de Coste) y confirma el resultado. |
