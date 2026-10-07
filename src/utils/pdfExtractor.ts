import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Configuración del worker de PDF.js
if (typeof window !== 'undefined') {
  try {
    // Intentar resolver worker local con Vite
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback a CDN confiable de PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  }
}

export interface ExtractedOnapiRecord {
  nombre_comercial: string;
  descripcion_actividad: string;
  solicitante?: string;
  registroNo?: string;
}

/**
 * Extrae todo el contenido de texto de un archivo PDF oficial de ONAPI página por página.
 */
export async function extraerTextoDePdf(
  file: File | ArrayBuffer,
  onProgress?: (paginaActual: number, totalPaginas: number) => void
): Promise<string> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const totalPaginas = pdf.numPages;
    let textoCompleto = '';

    for (let pageNum = 1; pageNum <= totalPaginas; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, totalPaginas);
      }

      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const lineasPagina = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      textoCompleto += `\n--- PÁGINA ${pageNum} ---\n` + lineasPagina;
    }

    return textoCompleto;
  } catch (err) {
    console.warn('PDF.js falló o formato binario restringido, intentando extracción heurística:', err);
    // Extracción de emergencia en caso de que el worker falle
    return extraerTextoPdfHeuristico(arrayBuffer);
  }
}

/**
 * Extracción de texto crudo de respaldo para PDFs
 */
function extraerTextoPdfHeuristico(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let ascii = '';
  // Leer cadenas de texto dentro de streams del PDF
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      ascii += String.fromCharCode(b);
    } else if (b === 0) {
      ascii += ' ';
    }
  }
  return ascii;
}

/**
 * Parser de archivos CSV con nombres de columnas comunes
 */
export function extraerEmpresasDeCSV(csvContent: string): ExtractedOnapiRecord[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse cabecera
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const idxNombre = headers.findIndex((h) =>
    h.includes('nombre') || h.includes('denominacion') || h.includes('empresa') || h.includes('signo')
  );
  const idxActividad = headers.findIndex((h) =>
    h.includes('actividad') || h.includes('objeto') || h.includes('descripcion') || h.includes('sector')
  );
  const idxSolicitante = headers.findIndex((h) =>
    h.includes('solicitante') || h.includes('titular') || h.includes('propietario') || h.includes('contacto')
  );
  const idxRegistro = headers.findIndex((h) =>
    h.includes('registro') || h.includes('solicitud') || h.includes('no') || h.includes('expediente')
  );

  if (idxNombre === -1) return [];

  const results: ExtractedOnapiRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/[,;\t]/).map((col) => col.trim().replace(/^["']|["']$/g, ''));
    const nombre = row[idxNombre];
    if (nombre && nombre.length > 2) {
      results.push({
        nombre_comercial: nombre.toUpperCase(),
        descripcion_actividad:
          (idxActividad !== -1 ? row[idxActividad] : '') || 'Actividad comercial registrada en ONAPI',
        solicitante: idxSolicitante !== -1 ? row[idxSolicitante] : 'Representante Legal',
        registroNo: idxRegistro !== -1 ? row[idxRegistro] : `2026-${(8200 + i).toString()}`,
      });
    }
  }

  return results;
}
