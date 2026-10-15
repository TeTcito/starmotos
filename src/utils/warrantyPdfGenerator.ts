// src/utils/warrantyPdfGenerator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GeneratePdfOptions {
  element: HTMLElement;
  requestNumber?: string;
  clientName?: string;
}

/**
 * Genera un archivo PDF oficial a partir de la ficha técnica de garantía
 * y lo abre en una nueva pestaña del navegador con el visor nativo de PDF.
 */
export async function generateAndOpenWarrantyPdf({
  element,
  requestNumber = 'StarMotos',
  clientName = 'Cliente',
}: GeneratePdfOptions): Promise<void> {
  const safeReqNum = (requestNumber || 'StarMotos').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeClient = (clientName || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Expediente_Garantia_${safeReqNum}_${safeClient}`;

  // 1. Abrir la pestaña inmediatamente para evitar que los navegadores bloqueen popups
  let newTab: Window | null = null;
  try {
    newTab = window.open('about:blank', '_blank');
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generando PDF • ${requestNumber} • StarMotos</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #09090b;
              color: #f4f4f5;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              box-sizing: border-box;
              padding: 20px;
            }
            .card {
              background: #18181b;
              border: 1px solid #27272a;
              border-radius: 16px;
              padding: 36px 40px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
              max-width: 440px;
              width: 100%;
            }
            .spinner {
              width: 42px;
              height: 42px;
              border: 3px solid #27272a;
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 20px auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h1 { font-size: 17px; font-weight: 700; margin: 0 0 8px 0; color: #ffffff; }
            p { font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5; }
            .badge {
              display: inline-block;
              margin-top: 14px;
              font-size: 11px;
              font-family: monospace;
              color: #60a5fa;
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.2);
              border-radius: 6px;
              padding: 3px 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Generando Expediente Oficial</h1>
            <p>Compilando ficha técnica y evidencias fotográficas para impresión directa...</p>
            <div class="badge">Expediente: ${requestNumber}</div>
          </div>
        </body>
        </html>
      `);
    }
  } catch (tabErr) {
    console.warn('No se pudo pre-abrir pestaña emergente:', tabErr);
  }

  try {
    // 2. Renderizar el elemento en canvas con html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 2x escala para texto nítido y fotos de alta definición
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 820,
      onclone: (_clonedDoc, clonedElement) => {
        // Asegurar que el elemento clonado tenga layout visible y tamaño estándar
        clonedElement.style.position = 'static';
        clonedElement.style.left = 'auto';
        clonedElement.style.top = 'auto';
        clonedElement.style.display = 'block';
        clonedElement.style.visibility = 'visible';
        clonedElement.style.width = '800px';
        clonedElement.style.maxWidth = '800px';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.boxSizing = 'border-box';
      },
    });

    // 3. Crear el documento PDF con jsPDF en tamaño Carta (Letter)
    // Dimensiones Letter estándar: 215.9 mm × 279.4 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidthMm = 215.9;
    const pageHeightMm = 279.4;
    const marginMm = 6;
    const printWidthMm = pageWidthMm - marginMm * 2; // 203.9 mm
    const printHeightMm = pageHeightMm - marginMm * 2; // 267.4 mm

    // Altura en píxeles de canvas que cabe en una sola página física
    const pageHeightPx = Math.floor((canvas.width * printHeightMm) / printWidthMm);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    // 4. Cortar el canvas en páginas limpias para no duplicar datos ni saturar la memoria
    for (let page = 0; page < totalPages; page++) {
      const sourceY = page * pageHeightPx;
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);

      if (sliceHeightPx <= 0) break;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );
      }

      const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.94);
      const sliceHeightMm = (sliceHeightPx * printWidthMm) / canvas.width;

      if (page > 0) {
        pdf.addPage('letter', 'portrait');
      }

      pdf.addImage(
        sliceDataUrl,
        'JPEG',
        marginMm,
        marginMm,
        printWidthMm,
        sliceHeightMm,
        undefined,
        'FAST'
      );
    }

    // 5. Metadatos del PDF
    pdf.setProperties({
      title: `${fileName}.pdf`,
      subject: `Expediente de Garantía ${requestNumber}`,
      author: 'StarMotos S.A.',
      creator: 'Sistema de Gestión StarMotos',
    });

    // 6. Convertir a Blob y asignar a la nueva pestaña
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (newTab && !newTab.closed) {
      newTab.location.href = blobUrl;
    } else {
      // Si la ventana fue bloqueada por el navegador, descargar directamente como respaldo
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Error al generar PDF de garantía:', err);
    if (newTab && !newTab.closed) {
      newTab.close();
    }
    // Si falla la generación por algún motivo inesperado, fallback a impresión nativa
    window.print();
  }
}
