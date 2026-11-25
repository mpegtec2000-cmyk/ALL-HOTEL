-- =====================================================================
-- ALL RENT HOTELES QUINTERO - Full-Stack Hotel PMS & Airbnb Sync Schema
-- PostgreSQL / Supabase Production Schema
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hotel Settings
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'All Rent Hoteles',
  slogan TEXT NOT NULL DEFAULT 'Tu estadía, nuestra prioridad.',
  address TEXT NOT NULL DEFAULT 'Av. Bulnes 119, Quintero, Valparaíso',
  phone TEXT NOT NULL DEFAULT '+56 9 9865 1440',
  email TEXT NOT NULL DEFAULT 'reservas@allrenthoteles.cl',
  host_name TEXT NOT NULL DEFAULT 'Jorge',
  check_in_time TEXT NOT NULL DEFAULT '12:00',
  check_out_time TEXT NOT NULL DEFAULT '12:00',
  deposit_percentage INTEGER NOT NULL DEFAULT 50,
  payment_gateway_mode TEXT NOT NULL DEFAULT 'sandbox_interactive',
  airbnb_webhook_secret TEXT NOT NULL DEFAULT 'arh_airbnb_wh_2026',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Official Room Categories & Pricing
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
  ('superior_matrimonial', 'Superior Matrimonial', 'Baño privado', 'privado_en_suite', 63500, 2, '1 Cama Matrimonial Queen', 3),
  ('standard_matrimonial', 'Standard Matrimonial', 'Baño privado exterior', 'privado_exterior', 53500, 2, '1 Cama Matrimonial', 3),
  ('doble_dos_camas', 'Doble Dos Camas', 'Baño privado exterior', 'privado_exterior', 49500, 2, '2 Camas Individuales', 2),
  ('single_individual', 'Single Individual', 'Baño privado exterior', 'privado_exterior', 39500, 1, '1 Cama Individual', 2),
  ('familiar_terraza', 'Familiar con Terraza', 'Baño privado', 'privado_en_suite', 79500, 4, 'Cama Matrimonial + Adicionales', 2)
ON CONFLICT (slug) DO NOTHING;

-- 3. Physical Room Units (Room Rack)
CREATE TABLE IF NOT EXISTS public.room_units (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  category_slug TEXT NOT NULL REFERENCES public.room_categories(slug),
  status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupada', 'aseo_pendiente', 'mantencion')),
  current_booking_id TEXT,
  notes TEXT,
  last_cleaned_at TIMESTAMP WITH TIME ZONE
);

-- 4. Bookings (Direct Web, Pasarela Online, Airbnb Email Sync, Walk-in)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY, -- e.g. ARH-2026-1042
  external_code TEXT UNIQUE, -- e.g. Airbnb Confirmation Code HM9X4L7K2P
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Online Payment Gateway Transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('full_100', 'deposit_50', 'balance_50')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'pending', 'failed')),
  authorization_code TEXT,
  card_last4 TEXT,
  card_brand TEXT,
  installments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Airbnb Inbound Email Automation Logs
CREATE TABLE IF NOT EXISTS public.airbnb_sync_logs (
  id TEXT PRIMARY KEY,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  airbnb_code TEXT NOT NULL,
  event_type TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  room_category_detected TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  booking_id_created TEXT,
  status TEXT NOT NULL,
  raw_snippet TEXT
);

-- 7. Digital Check-ins & Parking Security Control
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  estimated_arrival TEXT NOT NULL DEFAULT '12:00',
  vehicle_plates JSONB NOT NULL DEFAULT '[]'::jsonb,
  guest_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules_accepted BOOLEAN NOT NULL DEFAULT true,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates_cat ON public.bookings(room_category, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_external_code ON public.bookings(external_code);
CREATE INDEX IF NOT EXISTS idx_airbnb_logs_code ON public.airbnb_sync_logs(airbnb_code);
