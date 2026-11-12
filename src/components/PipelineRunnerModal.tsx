import React, { useState, useRef } from 'react';
import { Advisor, Client } from '../types/client';
import {
  extraerDatosOnapiTexto,
  obtenerContactoGoogle,
  obtenerTipoEmpresaDgii,
  convertirRegistroACliente,
} from '../utils/pipelineEngine';
import {
  extraerTextoDePdfDetallado,
  extraerEmpresasDeCSV,
  ExtractedOnapiRecord,
} from '../utils/pdfExtractor';
import { exportClientsToCSV } from '../utils/storage';
import {
  X,
  Play,
  FileText,
  Building,
  CheckCircle2,
  Terminal,
  Download,
  Database,
  ArrowRight,
  UploadCloud,
  Code2,
  Phone,
  RefreshCw,
  FileSpreadsheet,
  FileType,
  AlertCircle,
  FileCheck2,
  Bot,
} from 'lucide-react';

interface PipelineRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToClients: (newClients: Client[]) => void;
  onOpenPythonModal: () => void;
  advisors: Advisor[];
  initialMode?: 'file' | 'text' | 'sync';
}

interface SyncPayload {
  updatedAt?: string;
  bulletinTitle?: string;
  totalRecords?: number;
  records?: ExtractedOnapiRecord[];
}

export const PipelineRunnerModal: React.FC<PipelineRunnerModalProps> = ({
  isOpen,
  onClose,
  onImportToClients,
  onOpenPythonModal,
  initialMode = 'file',
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'text' | 'sync'>(initialMode);
  const [customText, setCustomText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<string | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ExtractedOnapiRecord[] | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState<{ status: 'idle' | 'ok' | 'empty'; message: string } | null>(null);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedClients, setProcessedClients] = useState<Client[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString('es-DO')}] ${msg}`]);
  };

  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setParsedRecords(null);
    setFileWarning(null);
    setIsCompleted(false);
    setProcessedClients([]);
    setLogs([]);
    appendLog(`Leyendo archivo seleccionado: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      // 1. Archivo PDF
      if (ext === 'pdf' || file.type.includes('pdf')) {
        appendLog('📄 Detectado archivo PDF oficial de ONAPI. Extrayendo texto con preservación de filas...');
        setParsingProgress('Iniciando lector PDF.js...');

        const pdfResult = await extraerTextoDePdfDetallado(file, (paginaActual, totalPaginas) => {
          setParsingProgress(`Analizando página ${paginaActual} de ${totalPaginas}...`);
          if (paginaActual === 1 || paginaActual === totalPaginas || paginaActual % 20 === 0) {
            appendLog(`    -> Página ${paginaActual}/${totalPaginas} procesada`);
          }
        });

        appendLog(
          `[i] Páginas leídas: ${pdfResult.totalPaginas} (${pdfResult.paginasConTexto} con texto) · ${pdfResult.caracteresTotales.toLocaleString('es-DO')} caracteres extraídos.`
        );

        if (pdfResult.esImagenEscaneada) {
          const aviso =
            'El PDF parece estar escaneado como imágenes sin capa de texto seleccionable. Descarga el PDF digital oficial de onapi.gob.do o exporta el texto antes de subirlo.';
          setFileWarning(aviso);
          appendLog(`[!] ${aviso}`);
          setParsedRecords([]);
          setCustomText(pdfResult.texto);
          return;
        }

        setCustomText(pdfResult.texto);
        const empresas = extraerDatosOnapiTexto(pdfResult.texto);
        setParsedRecords(empresas);

        if (empresas.length > 0) {
          appendLog(`[✓] Extracción del PDF finalizada. Se detectaron ${empresas.length} empresas.`);
        } else {
          const muestra = pdfResult.texto
            .replace(/---\s*PÁGINA\s+\d+\s*---/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 220);
          setFileWarning(
            'Se leyó el texto del PDF pero no coincidió con registros empresariales estándar. Revisa la muestra en la terminal.'
          );
          appendLog('[!] 0 empresas detectadas tras analizar el texto extraído.');
          if (muestra) {
            appendLog(`[i] Muestra del texto leído: "${muestra}..."`);
          }
        }
      }
      // 2. Archivo CSV
      else if (ext === 'csv' || file.type.includes('csv')) {
        appendLog('📊 Detectado archivo CSV. Procesando columnas de denominación y actividad...');
        const texto = await file.text();
        const empresasCSV = extraerEmpresasDeCSV(texto);
        if (empresasCSV.length > 0) {
          setParsedRecords(empresasCSV);
          setCustomText(texto);
          appendLog(`[✓] Archivo CSV procesado: ${empresasCSV.length} empresas identificadas.`);
        } else {
          const fallback = extraerDatosOnapiTexto(texto);
          setParsedRecords(fallback);
          setCustomText(texto);
          appendLog(`[✓] Procesado como texto delimitado: ${fallback.length} empresas encontradas.`);
        }
      }
      // 3. Archivo TXT o JSON
      else if (ext === 'json' || file.type.includes('json')) {
        appendLog('📦 Detectado archivo JSON sincronizado...');
        const texto = await file.text();
        const parsed = JSON.parse(texto);
        const arr: ExtractedOnapiRecord[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.records) ? parsed.records : [];
        setParsedRecords(arr);
        setCustomText(texto);
        appendLog(`[✓] Archivo JSON procesado: ${arr.length} empresas identificadas.`);
      } else {
        appendLog('📝 Leyendo contenido de texto...');
        const texto = await file.text();
        setCustomText(texto);
        const empresas = extraerDatosOnapiTexto(texto);
        setParsedRecords(empresas);
        appendLog(`[✓] Archivo de texto procesado: ${empresas.length} empresas identificadas.`);
      }
    } catch (err: any) {
      console.error('Error procesando archivo:', err);
      const errMsg = err?.message || 'Formato no soportado o archivo dañado';
      setFileWarning(errMsg);
      appendLog(`[!] Error al procesar archivo: ${errMsg}`);
    } finally {
      setIsParsingFile(false);
      setParsingProgress(null);
    }
  };

  const handleSyncFromServer = async () => {
    setIsSyncing(true);
    setSyncInfo(null);
    setFileWarning(null);
    setLogs([]);
    appendLog('Consultando boletín sincronizado automáticamente (/data/boletin_actual.json)...');

    try {
      const resp = await fetch(`/data/boletin_actual.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!resp.ok) {
        const msg =
          'Aún no hay un boletín sincronizado automáticamente en el servidor. Ejecuta el workflow en GitHub Actions o sube tu archivo PDF manualmente en la pestaña "Subir Archivo".';
        setSyncInfo({ status: 'empty', message: msg });
        appendLog(`[!] ${msg}`);
        return;
      }

      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const msg =
          'El servidor aún no contiene un boletín JSON generado por GitHub Actions. Usa "Subir Archivo (PDF/CSV/TXT)" o ejecuta el Action en GitHub.';
        setSyncInfo({ status: 'empty', message: msg });
        appendLog(`[!] ${msg}`);
        return;
      }

      const data: SyncPayload = await resp.json();
      const records = Array.isArray(data.records) ? data.records : [];

      if (records.length === 0) {
        const msg = 'El archivo de sincronización automática no tiene empresas nuevas todavía.';
        setSyncInfo({ status: 'empty', message: msg });
        appendLog(`[!] ${msg}`);
        return;
      }

      setParsedRecords(records);
      const fechaFmt = data.updatedAt ? new Date(data.updatedAt).toLocaleString('es-DO') : 'Reciente';
      const okMsg = `Boletín "${data.bulletinTitle || 'ONAPI'}" listo (${records.length} empresas · Actualizado: ${fechaFmt}).`;
      setSyncInfo({ status: 'ok', message: okMsg });
      appendLog(`[✓] ${okMsg}`);
    } catch (err: any) {
      const msg = `No se pudo comprobar la sincronización automática (${err?.message || 'red'}).`;
      setSyncInfo({ status: 'empty', message: msg });
      appendLog(`[!] ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setIsCompleted(false);
    setProgress(5);
    setCurrentStep(1);
    setProcessedClients([]);

    appendLog('Iniciando infraestructura de datos ONAPI -> Google Places -> DGII...');
    await new Promise((r) => setTimeout(r, 150));

    // ==========================================
    // ETAPA 1: OBTENCIÓN DE REGISTROS
    // ==========================================
    appendLog('[+] ETAPA 1: Parseando denominaciones y actividades de ONAPI...');
    let registrosBase: ExtractedOnapiRecord[] = [];

    if ((inputMode === 'file' || inputMode === 'sync') && parsedRecords && parsedRecords.length > 0) {
      registrosBase = parsedRecords;
    } else if (customText.trim().length > 0) {
      registrosBase = extraerDatosOnapiTexto(customText);
    }

    if (registrosBase.length === 0) {
      appendLog('[-] Error: No se encontraron registros de empresas en el archivo o texto proporcionado.');
      appendLog(
        '[-] Verifica que el PDF tenga texto seleccionable con nombres comerciales (E/2026-..., Denominación:, REG. NO., o S.R.L./S.A.S./E.I.R.L.).'
      );
      setIsRunning(false);
      return;
    }

    appendLog(`[✓] Extracción ONAPI exitosa: ${registrosBase.length} empresas dominicanas identificadas.`);
    setProgress(25);
    await new Promise((r) => setTimeout(r, 150));

    // ==========================================
    // ETAPA 2 & 3: ENRIQUECIMIENTO POR LOTES (Google Places + DGII)
    // ==========================================
    setCurrentStep(2);
    appendLog('[+] ETAPA 2: Enriqueciendo ubicaciones y teléfonos corporativos (RD)...');
    appendLog('[+] ETAPA 3: Clasificando tipo societario DGII y RNC...');

    const resultados: Client[] = [];
    const total = registrosBase.length;
    const chunkSize = total > 100 ? 75 : 10;

    for (let start = 0; start < total; start += chunkSize) {
      const end = Math.min(start + chunkSize, total);
      for (let i = start; i < end; i++) {
        const item = registrosBase[i];
        const placesInfo = obtenerContactoGoogle(item.nombre_comercial);
        const dgiiInfo = obtenerTipoEmpresaDgii(item.nombre_comercial);
        const clientObj = convertirRegistroACliente(item, placesInfo, dgiiInfo, i);
        resultados.push(clientObj);

        if (i < 3) {
          appendLog(`    -> [${i + 1}/${total}] ${item.nombre_comercial} · ${dgiiInfo.siglas}`);
        }
      }

      if (end > 3 && (end === total || end % (chunkSize * 2) === 0)) {
        appendLog(`    -> Procesadas ${end}/${total} empresas...`);
      }

      setProgress(25 + Math.round((end / total) * 68));
      await new Promise((r) => setTimeout(r, 12));
    }

    // ==========================================
    // ETAPA 4: CONSOLIDACIÓN
    // ==========================================
    setCurrentStep(4);
    setProgress(100);
    setProcessedClients(resultados);
    setIsCompleted(true);
    setIsRunning(false);
    appendLog(`[✓] ¡Pipeline completado con éxito! ${resultados.length} empresas listas para importar al CRM.`);
  };

  const handleExportGeneratedCSV = () => {
    exportClientsToCSV(processedClients, 'nuevas_empresas_rd_completo.csv');
  };

  const handleCommitToCRM = () => {
    onImportToClients(processedClients);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Extractor Oficial de Boletines ONAPI
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-400/30">
                    PDF · CSV · TXT · AUTO
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Carga el PDF oficial de ONAPI o sincroniza el boletín automatizado hacia la plataforma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPythonModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Script Python</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Input Selection Tabs */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span>Fuente de los datos:</span>
                </label>

                <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'file' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Subir Archivo (PDF/CSV/TXT)</span>
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Pegar Texto</span>
                  </button>
                  <button
                    onClick={() => {
                      setInputMode('sync');
                      if (!syncInfo) handleSyncFromServer();
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'sync' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Sync Automático</span>
                  </button>
                </div>
              </div>

              {/* Informative Guidance Banner */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 block">
                    ¿Cuál documento descargar en ONAPI (onapi.gob.do)?
                  </span>
                  <span className="text-[11px] text-amber-800 leading-relaxed block">
                    Sube el PDF oficial quincenal (ej: <strong>Internet ONAPI DD-MM-YYYY.pdf</strong> o{' '}
                    <strong>Nombres Comerciales</strong>). El motor reconstruye las filas de las tablas, detecta códigos{' '}
                    <code className="bg-amber-100 px-1 rounded">E/2026-...</code>, etiquetas{' '}
                    <code className="bg-amber-100 px-1 rounded">Denominación:</code>, <code className="bg-amber-100 px-1 rounded">REG. NO.</code> y razones sociales dominicanas (<code className="bg-amber-100 px-1 rounded">S.R.L.</code>, <code className="bg-amber-100 px-1 rounded">S.A.S.</code>, <code className="bg-amber-100 px-1 rounded">E.I.R.L.</code>).
                  </span>
                </div>
              </div>

              {/* Mode 1: File Upload (PDF, CSV, TXT) */}
              {inputMode === 'file' && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.csv,.json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                        : fileName && parsedRecords && parsedRecords.length > 0
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : fileWarning
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    {isParsingFile ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                        <span className="text-sm font-bold text-slate-800">
                          {parsingProgress || 'Extrayendo contenido del documento...'}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Esto puede tomar unos segundos para boletines de múltiples páginas
                        </span>
                      </div>
                    ) : fileName ? (
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            parsedRecords && parsedRecords.length > 0
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          <FileCheck2 className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{fileName}</span>
                        <span className="text-xs text-slate-500 mt-0.5">
                          Tamaño: {fileSize} ·{' '}
                          {parsedRecords !== null
                            ? `${parsedRecords.length} empresas detectadas`
                            : 'Listo para procesar'}
                        </span>
                        <div className="mt-3 flex items-center gap-2">
                          {parsedRecords && parsedRecords.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                              ✓ {parsedRecords.length} empresas listas para importar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                              ⚠ 0 registros detectados
                            </span>
                          )}
                          <span className="text-xs text-indigo-600 underline font-medium">
                            Haz clic para cambiar archivo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                        <span className="text-sm font-bold text-slate-800 block">
                          Haz clic aquí para seleccionar tu archivo o arrástralo y suéltalo
                        </span>
                        <span className="text-xs text-slate-500 mt-1 block">
                          Soporta archivos oficiales de ONAPI en formato <strong>.PDF</strong>, <strong>.CSV</strong> o{' '}
                          <strong>.TXT</strong>
                        </span>
                        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            <FileType className="w-3.5 h-3.5 text-rose-500" /> PDF Oficial
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> CSV Delimitado
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            <FileText className="w-3.5 h-3.5 text-blue-500" /> Texto Plano
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {fileWarning && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{fileWarning}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Raw Text */}
              {inputMode === 'text' && (
                <div>
                  <textarea
                    value={customText}
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      setParsedRecords(null);
                    }}
                    rows={5}
                    placeholder="Pega aquí el extracto de texto del boletín ONAPI (con E/2026-..., Denominación: y Actividad:, o listado de empresas)..."
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Copia y pega cualquier fragmento de texto del PDF o de la página de publicaciones de ONAPI.
                  </span>
                </div>
              )}

              {/* Mode 3: Automatic Sync (GitHub Actions -> Netlify) */}
              {inputMode === 'sync' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Sincronización Automática desde GitHub Actions
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        Descarga el boletín procesado automáticamente por <code className="bg-slate-200 px-1 rounded">onapi_scraper.yml</code> hacia la plataforma.
                      </span>
                    </div>
                    <button
                      onClick={handleSyncFromServer}
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Verificando...' : 'Buscar Boletín Sincronizado'}</span>
                    </button>
                  </div>

                  {syncInfo && (
                    <div
                      className={`p-3 rounded-lg text-xs border ${
                        syncInfo.status === 'ok'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      {syncInfo.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Ejecutar Pipeline Automatizado
                </span>
                <span className="text-[11px] text-indigo-700 block">
                  Aplica extracción multi-formato, enriquecimiento RD y clasificación societaria DGII
                </span>
              </div>

              <button
                disabled={isRunning || isParsingFile}
                onClick={runPipeline}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  currentStep >= 1
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Extracción ONAPI</span>
                </div>
                <span className="text-[11px] text-slate-600 block">Lectura PDF / Regex</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  currentStep >= 2
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Google Places</span>
                </div>
                <span className="text-[11px] text-slate-600 block">Teléfono corporativo RD</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  currentStep >= 3 || currentStep >= 2
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Filtro DGII</span>
                </div>
                <span className="text-[11px] text-slate-600 block">S.R.L. / S.A.S. / RNC</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  currentStep >= 4
                    ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>4. Base de Datos</span>
                </div>
                <span className="text-[11px] text-slate-600 block">Exportar a CRM / CSV</span>
              </div>
            </div>

            {/* Progress bar */}
            {isRunning && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Terminal Logs */}
            {logs.length > 0 && (
              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800 space-y-1">
                <div className="text-slate-500 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Terminal de Extracción & Enriquecimiento</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{logs.length} eventos</span>
                </div>
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Output Preview Table (When completed) */}
            {isCompleted && processedClients.length > 0 && (
              <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {processedClients.length} empresas procesadas y listas para prospección
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportGeneratedCSV}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar CSV</span>
                    </button>

                    <button
                      onClick={handleCommitToCRM}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Agregar a Base de Datos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Empresa</th>
                        <th className="py-2 px-3">Sector</th>
                        <th className="py-2 px-3">Teléfono</th>
                        <th className="py-2 px-3">Tipo DGII</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedClients.slice(0, 100).map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{client.name}</td>
                          <td className="py-2 px-3 text-slate-600">{client.sector || client.industry}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{client.phone}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {client.dgii?.siglas || 'S.R.L.'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {processedClients.length > 100 && (
                    <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200">
                      Mostrando las primeras 100 de {processedClients.length} empresas extraídas (todas se importarán al CRM).
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Compatible con boletines oficiales quincenales de ONAPI República Dominicana</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
