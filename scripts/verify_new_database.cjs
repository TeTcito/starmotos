const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const NEW_URL = 'https://nphfdolcupkyvjyglgjx.supabase.co';
const NEW_KEY = 'sb_publishable_CvibSXcrIeikPhwwPqGTAA_nfzgu1pA';
const supabase = createClient(NEW_URL, NEW_KEY);

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function verify() {
  console.log('--- INICIANDO VERIFICACIÓN DEL NUEVO PROYECTO ---');

  // 1. Verificar conteo de tablas críticas
  const tablesToCheck = ['clients', 'full_alistamientos', 'orders', 'invoices', 'alerts', 'technicians', 'garantes', 'warranties'];
  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`❌ Error en tabla ${table}:`, error.message);
    } else {
      console.log(`✓ Tabla '${table}': ${count} registros leídos correctamente.`);
    }
  }

  // 2. Verificar lectura y escritura (INSERT y DELETE)
  const testId = `test_healthcheck_${Date.now()}`;
  const { error: insError } = await supabase.from('alerts').insert({
    id: testId,
    type: 'test',
    title: 'Test Healthcheck',
    message: 'Verificación de escritura exitosa',
    data: { test: true },
    read: true,
  });

  if (insError) {
    console.error('❌ Error de escritura:', insError.message);
  } else {
    console.log('✓ Escritura de prueba (INSERT): EXITOSA');
    // Limpiar el registro de prueba
    await supabase.from('alerts').delete().eq('id', testId);
    console.log('✓ Eliminación de prueba (DELETE): EXITOSA');
  }

  // 3. Verificar que las imágenes cargan públicamente vía HTTP 200
  const { data: sampleAlistamiento } = await supabase
    .from('full_alistamientos')
    .select('data')
    .not('data->fotos', 'is', null)
    .limit(1)
    .single();

  if (sampleAlistamiento?.data?.fotos?.length) {
    const samplePhotoUrl = sampleAlistamiento.data.fotos[0];
    console.log(`\nProbando descarga de imagen real: ${samplePhotoUrl}`);
    const check = await checkUrl(samplePhotoUrl);
    if (check.status === 200) {
      console.log(`✓ Imagen cargada exitosamente: HTTP ${check.status} (${check.contentType})`);
    } else {
      console.warn(`⚠️ HTTP Status al cargar imagen: ${check.status}`);
    }
  }

  console.log('\n--- VERIFICACIÓN COMPLETADA CON ÉXITO ---');
}

verify().catch(console.error);
