const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nphfdolcupkyvjyglgjx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CvibSXcrIeikPhwwPqGTAA_nfzgu1pA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const backupData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'backup', 'starmotos_backup.json'), 'utf8')
);

async function run() {
  console.log('--- INICIANDO RESTAURACIÓN DE DATOS VÍA API ---');

  for (const [table, rows] of Object.entries(backupData)) {
    if (!rows || rows.length === 0) {
      console.log(`Tabla '${table}': 0 registros, omitida.`);
      continue;
    }

    console.log(`Restaurando '${table}' (${rows.length} registros)...`);
    
    // Insertar en lotes de 50
    const chunkSize = 50;
    let successCount = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`Error en '${table}' (lote ${i}):`, error.message);
      } else {
        successCount += chunk.length;
      }
    }

    console.log(`✓ '${table}': ${successCount}/${rows.length} insertados correctamente.`);
  }

  console.log('\n✓ ¡RESTAURACIÓN DE BASE DE DATOS FINALIZADA AL 100%!');
}

run().catch((err) => {
  console.error('Error:', err);
});
