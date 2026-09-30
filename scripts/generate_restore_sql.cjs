const fs = require('fs');
const path = require('path');

const backupData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'backup', 'starmotos_backup.json'), 'utf8')
);

// Metadata of all tables
const tableSchemas = {
  agendamientos: `
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
);`,
  alerts: `
CREATE TABLE IF NOT EXISTS public.alerts (
  id text PRIMARY KEY,
  type text,
  title text,
  message text,
  read boolean DEFAULT false,
  related_id text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);`,
  clients: `
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
);`,
  deleted_tombstones: `
CREATE TABLE IF NOT EXISTS public.deleted_tombstones (
  id text PRIMARY KEY,
  record_type text DEFAULT 'warranty',
  created_at timestamptz DEFAULT now()
);`,
  dictamenes: `
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
);`,
  full_alistamientos: `
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
);`,
  garantes: `
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
);`,
  garantias_plus: `
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
);`,
  gps_records: `
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
);`,
  invoices: `
CREATE TABLE IF NOT EXISTS public.invoices (
  id text PRIMARY KEY,
  invoice_number text,
  client_name text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);`,
  orders: `
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  ot_number text,
  status text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`,
  pendientes: `
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
);`,
  ratings: `
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
);`,
  technicians: `
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
);`,
  warranties: `
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
);`,
  workshop_managers: `
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
);`
};

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const arrayElements = val.map((item) => `"${String(item).replace(/"/g, '\\"')}"`).join(',');
    return `'${arrayElements}'`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- =========================================================================
-- SCRIPT DE RESTAURACIÓN COMPLETA STARMOTOS
-- Generado el: ${new Date().toISOString()}
-- =========================================================================

-- 1. HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREACIÓN DE TABLAS
`;

for (const [table, ddl] of Object.entries(tableSchemas)) {
  sql += ddl + '\n';
  sql += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
  sql += `DROP POLICY IF EXISTS "Public ${table} access" ON public.${table};\n`;
  sql += `CREATE POLICY "Public ${table} access" ON public.${table} FOR ALL TO public USING (true) WITH CHECK (true);\n\n`;
}

sql += `-- 3. CONFIGURACIÓN DEL BUCKET DE ALMACENAMIENTO (warranty-media)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('warranty-media', 'warranty-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL TO public USING (bucket_id = 'warranty-media') WITH CHECK (bucket_id = 'warranty-media');

-- 4. INSERCIÓN DE DATOS
`;

for (const [table, rows] of Object.entries(backupData)) {
  if (!rows || rows.length === 0) continue;
  sql += `-- Datos para la tabla: ${table} (${rows.length} registros)\n`;
  
  for (const row of rows) {
    const cols = Object.keys(row);
    const colNames = cols.map((c) => `"${c}"`).join(', ');
    const values = cols.map((c) => escapeSqlString(row[c])).join(', ');
    sql += `INSERT INTO public.${table} (${colNames}) VALUES (${values}) ON CONFLICT ("id") DO UPDATE SET ${cols.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')};\n`;
  }
  sql += '\n';
}

const outputPath = path.join(__dirname, '..', 'backup', 'restore_full.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`✓ Archivo de restauración SQL completo generado con éxito en: ${outputPath}`);
console.log(`✓ Tamaño del script: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
