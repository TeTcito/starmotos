-- =========================================================================
-- 01: CREACIÓN DE TABLAS, POLÍTICAS Y STORAGE PARA STARMOTOS
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS public.agendamientos (
  id text PRIMARY KEY,
  ticket_number text,
  client_name text,
  client_cedula text,
  client_phone text,
  client_email text,
  moto_plate text,
  moto_model text,
  workshop_id text,
  workshop_name text,
  scheduled_date text,
  scheduled_time text,
  service_id text,
  service_title text,
  status text DEFAULT 'confirmado',
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.agendamientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public agendamientos access" ON public.agendamientos;
CREATE POLICY "Public agendamientos access" ON public.agendamientos FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.alerts (
  id text PRIMARY KEY,
  type text,
  title text,
  message text,
  read boolean DEFAULT false,
  related_id text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public alerts access" ON public.alerts;
CREATE POLICY "Public alerts access" ON public.alerts FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.clients (
  id text PRIMARY KEY,
  id_number text,
  full_name text,
  phone text,
  workshop_id text,
  workshop_name text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  motorcycle_plate text,
  motorcycle_vin text
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public clients access" ON public.clients;
CREATE POLICY "Public clients access" ON public.clients FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.deleted_tombstones (
  id text PRIMARY KEY,
  record_type text DEFAULT 'warranty',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.deleted_tombstones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public deleted_tombstones access" ON public.deleted_tombstones;
CREATE POLICY "Public deleted_tombstones access" ON public.deleted_tombstones FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.dictamenes (
  id text PRIMARY KEY,
  warranty_id text NOT NULL,
  request_number text,
  decision text NOT NULL,
  resolution_type text,
  motorcycle_brand text,
  motorcycle_model text,
  motorcycle_plate text,
  motorcycle_vin text,
  client_name text,
  client_id_number text,
  garante_id text,
  garante_name text,
  garante_company text,
  garante_notes text,
  rejection_reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dictamenes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public dictamenes access" ON public.dictamenes;
CREATE POLICY "Public dictamenes access" ON public.dictamenes FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.full_alistamientos (
  id text PRIMARY KEY,
  cedula_ruc text,
  nombres text,
  apellidos text,
  sede text,
  sede_id text,
  placa text,
  chasis text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  evidencia_transferencia text
);
ALTER TABLE public.full_alistamientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full_alistamientos access" ON public.full_alistamientos;
CREATE POLICY "Public full_alistamientos access" ON public.full_alistamientos FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.garantes (
  id text PRIMARY KEY,
  company_name text,
  ruc text,
  contact_name text,
  role_title text,
  email text,
  phone text,
  address text,
  brands_represented text[],
  data jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.garantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public garantes access" ON public.garantes;
CREATE POLICY "Public garantes access" ON public.garantes FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.garantias_plus (
  id text PRIMARY KEY,
  numero_ticket text,
  cedula_ruc text,
  nombres text,
  apellidos text,
  placa text,
  chasis text,
  fecha_servicio text,
  fecha_vencimiento text,
  estado text,
  sede_id text,
  sede text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.garantias_plus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public garantias_plus access" ON public.garantias_plus;
CREATE POLICY "Public garantias_plus access" ON public.garantias_plus FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.gps_records (
  id text PRIMARY KEY,
  ticket_number text,
  cedula_ruc text,
  nombres text,
  apellidos text,
  placa text,
  chasis text,
  serie_gps text,
  serie_chip text,
  estado text DEFAULT 'pendiente',
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.gps_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public gps_records access" ON public.gps_records;
CREATE POLICY "Public gps_records access" ON public.gps_records FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.invoices (
  id text PRIMARY KEY,
  invoice_number text,
  client_name text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public invoices access" ON public.invoices;
CREATE POLICY "Public invoices access" ON public.invoices FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  ot_number text,
  status text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public orders access" ON public.orders;
CREATE POLICY "Public orders access" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.pendientes (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text DEFAULT 'repuesto',
  priority text DEFAULT 'media',
  due_date text,
  estimated_cost numeric DEFAULT 0,
  workshop_id text,
  workshop_name text,
  completed boolean DEFAULT false,
  completed_at text,
  created_by text,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.pendientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public pendientes access" ON public.pendientes;
CREATE POLICY "Public pendientes access" ON public.pendientes FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.ratings (
  id text PRIMARY KEY,
  order_id text,
  ot_number text,
  client_id_number text,
  client_name text,
  workshop_id text,
  workshop_name text,
  stars integer DEFAULT 5,
  comment text,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public ratings access" ON public.ratings;
CREATE POLICY "Public ratings access" ON public.ratings FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.technicians (
  id text PRIMARY KEY,
  name text,
  specialty text,
  phone text,
  workshop_id text,
  workshop_name text,
  status text DEFAULT 'activo',
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public technicians access" ON public.technicians;
CREATE POLICY "Public technicians access" ON public.technicians FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.warranties (
  id text PRIMARY KEY,
  request_number text,
  client_name text,
  client_id_number text,
  status text DEFAULT 'en_revision',
  taller_origin text,
  taller_origin_id text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public warranties access" ON public.warranties;
CREATE POLICY "Public warranties access" ON public.warranties FOR ALL TO public USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.workshop_managers (
  id text PRIMARY KEY,
  name text,
  workshop_id text,
  workshop_name text,
  email text,
  phone text,
  data jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.workshop_managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public workshop_managers access" ON public.workshop_managers;
CREATE POLICY "Public workshop_managers access" ON public.workshop_managers FOR ALL TO public USING (true) WITH CHECK (true);

-- CREACIÓN DEL BUCKET WARRANTY-MEDIA
INSERT INTO storage.buckets (id, name, public) 
VALUES ('warranty-media', 'warranty-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL TO public USING (bucket_id = 'warranty-media') WITH CHECK (bucket_id = 'warranty-media');
