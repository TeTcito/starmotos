const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://djbvtgjykrkygkdhfhos.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYnZ0Z2p5a3JreWdrZGhmaG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDg0MjksImV4cCI6MjEwNTU4NDQyOX0.SYX35H7VJxyH-4TZQYv5r_9XOZxMroJcmzzOhG5P3mk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'warranty-media';

async function listAllFiles(folder = '') {
  let all = [];
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    console.error(`Error listando carpeta '${folder}':`, error.message);
    return all;
  }

  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null) {
      // Es una subcarpeta
      const subFiles = await listAllFiles(itemPath);
      all = all.concat(subFiles);
    } else {
      all.push({ ...item, fullPath: itemPath });
    }
  }
  return all;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Status ${res.statusCode} para ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const outDir = path.join(__dirname, '..', 'backup', 'storage');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Listando archivos en storage...');
  const files = await listAllFiles();
  console.log(`Encontrados ${files.length} archivos para respaldar.`);

  let downloaded = 0;
  for (const file of files) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.fullPath);
    const dest = path.join(outDir, file.fullPath);
    try {
      await downloadFile(data.publicUrl, dest);
      downloaded++;
      if (downloaded % 25 === 0 || downloaded === files.length) {
        console.log(`Descargados ${downloaded}/${files.length} archivos...`);
      }
    } catch (e) {
      console.warn(`Error al descargar ${file.fullPath}:`, e.message);
    }
  }

  console.log(`\n✓ Respaldo de Storage finalizado: ${downloaded} archivos descargados en ${outDir}`);
}

run().catch((err) => {
  console.error('Error:', err);
});
