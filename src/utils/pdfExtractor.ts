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

export interface PdfExtractionResult {
  texto: string;
  totalPaginas: number;
  paginasConTexto: number;
  caracteresTotales: number;
  esImagenEscaneada: boolean;
}

interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
}

/**
 * Reconstruye las líneas de una página PDF preservando saltos de línea (hasEOL y coordenada Y)
 * y orden de lectura para tablas y columnas oficiales de ONAPI.
 */
export function reconstruirTextoPagina(items: PdfTextItem[]): string {
  const lines: string[] = [];
  let currentLine = '';
  let lastY: number | null = null;
  let lastEndX: number | null = null;

  for (const item of items) {
    const str = typeof item.str === 'string' ? item.str : '';
    const x = Array.isArray(item.transform) ? item.transform[4] : undefined;
    const y = Array.isArray(item.transform) ? item.transform[5] : undefined;
    const width = typeof item.width === 'number' ? item.width : 0;

    // Cambio vertical de línea o salto de columna
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2.5) {
      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      lastEndX = null;
    }

    if (str.length > 0) {
      if (currentLine.length > 0) {
        const needsSpace =
          !currentLine.endsWith(' ') &&
          !str.startsWith(' ') &&
          (lastEndX === null || x === undefined || x - lastEndX > 1.5 || x < lastEndX);
        if (needsSpace) {
          currentLine += ' ';
        }
      }
      currentLine += str;
      if (x !== undefined) {
        lastEndX = x + width;
      }
      if (y !== undefined && str.trim().length > 0) {
        lastY = y;
      }
    }

    if (item.hasEOL) {
      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      lastY = null;
      lastEndX = null;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

/**
 * Extrae todo el contenido de texto de un archivo PDF oficial de ONAPI página por página,
 * devolviendo diagnóstico detallado.
 */
export async function extraerTextoDePdfDetallado(
  file: File | ArrayBuffer,
  onProgress?: (paginaActual: number, totalPaginas: number) => void
): Promise<PdfExtractionResult> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const dataCopy = new Uint8Array(arrayBuffer);

  // Verificar firma %PDF
  const header = String.fromCharCode(...dataCopy.slice(0, Math.min(8, dataCopy.length)));
  if (!header.includes('%PDF')) {
    throw new Error('El archivo seleccionado no tiene una cabecera PDF válida (%PDF).');
  }

  let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: dataCopy,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    pdf = await loadingTask.promise;
  } catch (primaryErr: any) {
    console.warn('[PDF.js] Reintentando lectura con motor legacy:', primaryErr);
    try {
      const legacyPdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (typeof window !== 'undefined' && legacyPdfjs.GlobalWorkerOptions) {
        legacyPdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      }
      const fallbackTask = legacyPdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      pdf = await fallbackTask.promise;
    } catch (fallbackErr: any) {
      const msg = fallbackErr?.message || primaryErr?.message || 'Error desconocido al abrir el PDF';
      if (msg.toLowerCase().includes('password')) {
        throw new Error('El PDF está protegido con contraseña y no puede leerse automáticamente.');
      }
      throw new Error(`No se pudo procesar el PDF con PDF.js: ${msg}`);
    }
  }

  const totalPaginas = pdf.numPages;
  let textoCompleto = '';
  let paginasConTexto = 0;
  let alfanumericosTotales = 0;

  for (let pageNum = 1; pageNum <= totalPaginas; pageNum++) {
    if (onProgress && (pageNum === 1 || pageNum === totalPaginas || pageNum % 5 === 0)) {
      onProgress(pageNum, totalPaginas);
    }

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const textoPagina = reconstruirTextoPagina(content.items as PdfTextItem[]);
    const alphaCount = (textoPagina.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/g) || []).length;

    if (alphaCount > 15) {
      paginasConTexto++;
    }
    alfanumericosTotales += alphaCount;

    if (textoPagina.trim().length > 0) {
      textoCompleto += `\n--- PÁGINA ${pageNum} ---\n${textoPagina}\n`;
    }
  }

  const esImagenEscaneada = totalPaginas > 0 && alfanumericosTotales < Math.max(80, totalPaginas * 15);

  return {
    texto: textoCompleto,
    totalPaginas,
    paginasConTexto,
    caracteresTotales: textoCompleto.length,
    esImagenEscaneada,
  };
}

/**
 * Wrapper compatible que devuelve únicamente el texto extraído.
 */
export async function extraerTextoDePdf(
  file: File | ArrayBuffer,
  onProgress?: (paginaActual: number, totalPaginas: number) => void
): Promise<string> {
  const result = await extraerTextoDePdfDetallado(file, onProgress);
  return result.texto;
}

/**
 * Parsea una línea CSV respetando comillas y el delimitador detectado (, ; o \t)
 */
function parseCsvRow(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

/**
 * Parser de archivos CSV con nombres de columnas comunes y soporte RFC-4180 para comillas
 */
export function extraerEmpresasDeCSV(csvContent: string): ExtractedOnapiRecord[] {
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount >= semiCount ? '\t' : semiCount > commaCount ? ';' : ',';

  const headers = parseCsvRow(headerLine, delimiter).map((h) => h.toLowerCase().replace(/['"]/g, ''));
  const idxNombre = headers.findIndex((h) =>
    h.includes('nombre') || h.includes('denominacion') || h.includes('denominación') || h.includes('empresa') || h.includes('signo') || h.includes('razon')
  );
  const idxActividad = headers.findIndex((h) =>
    h.includes('actividad') || h.includes('objeto') || h.includes('descripcion') || h.includes('descripción') || h.includes('sector')
  );
  const idxSolicitante = headers.findIndex((h) =>
    h.includes('solicitante') || h.includes('titular') || h.includes('propietario') || h.includes('contacto')
  );
  const idxRegistro = headers.findIndex((h) =>
    h.includes('registro') || h.includes('solicitud') || h.includes('expediente') || h === 'no' || h === 'no.'
  );

  if (idxNombre === -1) return [];

  const results: ExtractedOnapiRecord[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i], delimiter);
    const nombre = (row[idxNombre] || '').replace(/^["']|["']$/g, '').trim();
    if (nombre && nombre.length > 2) {
      const key = nombre.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          nombre_comercial: nombre.toUpperCase(),
          descripcion_actividad:
            (idxActividad !== -1 ? row[idxActividad] : '')?.trim() || 'Actividad comercial registrada en ONAPI',
          solicitante: (idxSolicitante !== -1 ? row[idxSolicitante] : '')?.trim() || 'Representante Legal',
          registroNo: (idxRegistro !== -1 ? row[idxRegistro] : '')?.trim() || `2026-${(8200 + i).toString()}`,
        });
      }
    }
  }

  return results;
}
