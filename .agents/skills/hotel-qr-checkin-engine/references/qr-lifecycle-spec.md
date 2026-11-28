# Especificación Técnica: Ciclo de Vida QR & Automatización Dual Airbnb

## 1. Payload de Respuesta al Escanear QR (`POST /api/v1/qr/scan`)

### Request
```json
{
  "qrInput": "ARHQR.ARH-2026-1043.8F4A9C12.E9B14D08A2F7C310",
  "action": "inspect",
  "operatorName": "Portería All Rent Hoteles",
  "notes": "Ingreso verificado en portería con estacionamiento interior"
}
```
- `action`:
  - `"inspect"`: Verifica firma criptográfica del QR, consulta la base de datos y devuelve todos los datos del cliente + la siguiente acción permitida (`checkin_entry`, `checkout_exit` o `already_closed`).
  - `"checkin_entry"`: Ejecuta el Check-in de Entrada (solo permitido cuando `qrStatus === "issued"`). Pasa a `checked_in_active`.
  - `"checkout_exit"`: Ejecuta el Check-out de Salida (solo permitido cuando `qrStatus === "checked_in_active"`). Pasa a `redeemed_closed` y quema definitivamente el QR.

## 2. Regla de Oro de No Reutilización
- Un token QR con `qrStatus === "checked_in_active"` **jamás** puede volver a ejecutar `checkin_entry`.
- Un token QR con `qrStatus === "redeemed_closed"` **jamás** puede ejecutar `checkin_entry` ni `checkout_exit`. Cualquier intento devuelve HTTP `409 Conflict` con `qrRejectedReason: "Este código QR ya completó su ciclo único de Entrada y Salida y se encuentra cerrado permanentemente."`.
