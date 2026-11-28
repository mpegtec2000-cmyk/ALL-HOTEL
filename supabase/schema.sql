-- =====================================================================
-- ALL RENT HOTELES QUINTERO - Full-Stack Hotel PMS, QR Engine & Airbnb Sync
-- PostgreSQL / Supabase Production Schema (10 Cost Center Rooms)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hotel Settings
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'All Rent Hoteles',
  slogan TEXT NOT NULL DEFAULT 'Tu estadía, nuestra prioridad.',
  address TEXT NOT NULL DEFAULT 'Av. Bulnes 119, Quintero, Región de Valparaíso',
  phone TEXT NOT NULL DEFAULT '+56 9 9865 1440',
  email TEXT NOT NULL DEFAULT 'reservas@allrenthoteles.cl',
  host_name TEXT NOT NULL DEFAULT 'All Rent Hoteles',
  check_in_time TEXT NOT NULL DEFAULT '12:00',
  check_out_time TEXT NOT NULL DEFAULT '12:00',
  deposit_percentage INTEGER NOT NULL DEFAULT 100,
  payment_gateway_mode TEXT NOT NULL DEFAULT 'sandbox_interactive',
  airbnb_webhook_secret TEXT NOT NULL DEFAULT 'arh_quintero_sync_2026',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Official 5 Room Categories & Pricing (2 units each = 10 rooms total)
CREATE TABLE IF NOT EXISTS public.room_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bathroom_label TEXT NOT NULL,
  bathroom_type TEXT NOT NULL CHECK (bathroom_type IN ('privado_en_suite', 'privado_exterior')),
  price_per_night INTEGER NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 2,
  bed_config TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 2,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.room_categories (slug, name, bathroom_label, bathroom_type, price_per_night, max_guests, bed_config, total_units)
VALUES
  ('superior_matrimonial', 'Superior Matrimonial', 'Baño privado', 'privado_en_suite', 63500, 2, '1 Cama Matrimonial Queen', 2),
  ('standard_matrimonial', 'Standard Matrimonial', 'Baño privado exterior', 'privado_exterior', 53500, 2, '1 Cama Matrimonial', 2),
  ('doble_dos_camas', 'Doble Dos Camas', 'Baño privado exterior', 'privado_exterior', 49500, 2, '2 Camas Individuales', 2),
  ('single_individual', 'Single Individual', 'Baño privado exterior', 'privado_exterior', 39500, 1, '1 Cama Individual', 2),
  ('familiar_terraza', 'Familiar con Terraza', 'Baño privado', 'privado_en_suite', 79500, 4, 'Cama Matrimonial + Camas Adicionales', 2)
ON CONFLICT (slug) DO NOTHING;

-- 3. 10 Physical Room Units Configured as Individual Cost Centers (Hab. 101 to Hab. 110)
CREATE TABLE IF NOT EXISTS public.room_units (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  custom_name TEXT,
  cost_center_code TEXT UNIQUE,
  custom_rate_per_night INTEGER,
  floor INTEGER NOT NULL DEFAULT 1,
  category_slug TEXT NOT NULL REFERENCES public.room_categories(slug),
  status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupada', 'aseo_pendiente', 'mantencion')),
  current_booking_id TEXT,
  notes TEXT,
  last_cleaned_at TIMESTAMP WITH TIME ZONE
);

-- 4. Bookings with Cryptographic Single-Cycle QR Engine & Portería Extensions
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY, -- e.g. ARH-2026-1042 -> infinite sequence
  external_code TEXT UNIQUE, -- e.g. Airbnb Confirmation Code HM8P3K9W2L
  source TEXT NOT NULL DEFAULT 'web_online' CHECK (source IN ('web_online', 'airbnb_email', 'recepcion_directa', 'whatsapp')),
  room_category TEXT NOT NULL REFERENCES public.room_categories(slug),
  room_category_name TEXT NOT NULL,
  assigned_room_number TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_rut TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights_count INTEGER NOT NULL CHECK (nights_count > 0),
  guests_count INTEGER NOT NULL CHECK (guests_count > 0),
  rate_per_night INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  deposit_required INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid_full', 'refunded')),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled')),
  vehicle_plates JSONB DEFAULT '[]'::jsonb,
  special_requests TEXT,
  qr_token TEXT UNIQUE,
  qr_status TEXT NOT NULL DEFAULT 'issued' CHECK (qr_status IN ('issued', 'checked_in_active', 'redeemed_closed')),
  qr_issued_at TIMESTAMP WITH TIME ZONE,
  qr_check_in_at TIMESTAMP WITH TIME ZONE,
  qr_check_out_at TIMESTAMP WITH TIME ZONE,
  qr_scan_logs JSONB DEFAULT '[]'::jsonb,
  extra_days_added INTEGER DEFAULT 0,
  extra_charges_amount INTEGER DEFAULT 0,
  extra_charges_notes TEXT,
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_email_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Cash Transactions & Cost Center Ledger
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id TEXT PRIMARY KEY,
  tx_date TEXT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('ingreso', 'gasto')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  room_number TEXT,
  receipt_number TEXT,
  operator TEXT NOT NULL
);

-- 6. Automated Email Outbox with QR Pass
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  external_code TEXT,
  to_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  from_account_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  qr_token TEXT NOT NULL,
  assigned_room_number TEXT,
  room_category_name TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  html_body TEXT NOT NULL,
  error_detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates_cat ON public.bookings(room_category, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_qr_token ON public.bookings(qr_token);
CREATE INDEX IF NOT EXISTS idx_bookings_external_code ON public.bookings(external_code);
CREATE INDEX IF NOT EXISTS idx_cash_room_number ON public.cash_transactions(room_number);
