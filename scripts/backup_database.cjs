const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://djbvtgjykrkygkdhfhos.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYnZ0Z2p5a3JreWdrZGhmaG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDg0MjksImV4cCI6MjEwNTU4NDQyOX0.SYX35H7VJxyH-4TZQYv5r_9XOZxMroJcmzzOhG5P3mk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = [
  'warranties',
  'full_alistamientos',
  'clients',
  'alerts',
  'invoices',
  'orders',
  'technicians',
  'garantes',
  'workshop_managers',
  'dictamenes',
  'deleted_tombstones',
  'pendientes',
  'ratings',
  'agendamientos',
  'gps_records',
  'garantias_plus'
];

async function run() {
  const outDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const allData = {};
  console.log('--- INICIANDO EXPORTACIÓN DE BASE DE DATOS ---');

  for (const table of TABLES) {
    let rows = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + batchSize - 1);

      if (error) {
        console.error(`Error en tabla ${table}:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      rows = rows.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    allData[table] = rows;
    console.log(`✓ Tabla '${table}': ${rows.length} registros exportados.`);
  }

  const jsonPath = path.join(outDir, 'starmotos_backup.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2), 'utf8');
  console.log(`\nRespaldo JSON guardado en: ${jsonPath}`);
}

run().catch((err) => {
  console.error('Error fatal al exportar:', err);
  process.exit(1);
});
