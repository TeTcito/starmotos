const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const NEW_URL = 'https://nphfdolcupkyvjyglgjx.supabase.co';
const NEW_KEY = 'sb_publishable_CvibSXcrIeikPhwwPqGTAA_nfzgu1pA';
const supabase = createClient(NEW_URL, NEW_KEY);

const OLD_HOST = 'djbvtgjykrkygkdhfhos.supabase.co';
const NEW_HOST = 'nphfdolcupkyvjyglgjx.supabase.co';

const TABLES_WITH_DATA = ['full_alistamientos', 'garantias_plus', 'warranties', 'orders'];

function replaceHostInObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return obj.replace(new RegExp(OLD_HOST, 'g'), NEW_HOST);
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceHostInObject);
  }
  if (typeof obj === 'object') {
    const updated = {};
    for (const [k, v] of Object.entries(obj)) {
      updated[k] = replaceHostInObject(v);
    }
    return updated;
  }
  return obj;
}

async function run() {
  console.log('--- REEMPLAZANDO ENLACES ANTIGUOS POR EL NUEVO PROYECTO ---');

  for (const table of TABLES_WITH_DATA) {
    const { data: rows, error } = await supabase.from(table).select('*');
    if (error || !rows) continue;

    let updatedCount = 0;
    for (const row of rows) {
      const raw = JSON.stringify(row);
      if (raw.includes(OLD_HOST)) {
        const fixedRow = replaceHostInObject(row);
        const { error: upErr } = await supabase.from(table).upsert(fixedRow, { onConflict: 'id' });
        if (!upErr) updatedCount++;
      }
    }
    console.log(`✓ Tabla '${table}': ${updatedCount} registros actualizados con la nueva URL de imágenes.`);
  }

  console.log('✓ Reemplazo de URLs finalizado.');
}

run().catch(console.error);
