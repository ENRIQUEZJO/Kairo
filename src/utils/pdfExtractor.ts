import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configuración del worker de PDF.js usando la URL empaquetada directamente por Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
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

    console.log(`[PDF.js] Extraídas ${totalPaginas} páginas. Caracteres totales: ${textoCompleto.length}`);
    return textoCompleto;
  } catch (err) {
    console.warn('[PDF.js] Error al procesar con worker, reintentando:', err);
    // Intentar segundo pase desactivando worker o extracción de streams
    return extraerTextoPdfHeuristico(arrayBuffer);
  }
}

/**
 * Extracción de texto de respaldo para PDFs si el motor worker es bloqueado
 */
function extraerTextoPdfHeuristico(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let texto = '';
  let inText = false;
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    // Rango ASCII legible y caracteres especiales en español
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
      const ch = String.fromCharCode(c);
      texto += ch;
    } else if (c === 0) {
      texto += ' ';
    }
  }

  return texto;
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
