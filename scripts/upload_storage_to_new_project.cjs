const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nphfdolcupkyvjyglgjx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CvibSXcrIeikPhwwPqGTAA_nfzgu1pA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'warranty-media';

function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      results.push({ fullPath: filePath, storagePath: relativePath });
    }
  }
  return results;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webp': return 'image/webp';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    default: return 'application/octet-stream';
  }
}

async function run() {
  const storageDir = path.join(__dirname, '..', 'backup', 'storage');
  if (!fs.existsSync(storageDir)) {
    console.error('No se encontró la carpeta backup/storage');
    return;
  }

  const files = getFilesRecursively(storageDir);
  console.log(`Subiendo ${files.length} archivos al nuevo proyecto...`);

  let uploaded = 0;
  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.fullPath);
    const mimeType = getMimeType(file.fullPath);

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(file.storagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    });

    if (error) {
      console.warn(`Error al subir ${file.storagePath}:`, error.message);
    } else {
      uploaded++;
      if (uploaded % 25 === 0 || uploaded === files.length) {
        console.log(`Subidos ${uploaded}/${files.length} archivos...`);
      }
    }
  }

  console.log(`\n✓ Subida finalizada: ${uploaded} de ${files.length} subidos con éxito.`);
}

run().catch((err) => {
  console.error('Error fatal al subir storage:', err);
});
