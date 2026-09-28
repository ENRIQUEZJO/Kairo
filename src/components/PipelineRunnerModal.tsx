import React, { useState } from 'react';
import { Advisor, Client, PipelineExecutionLog } from '../types/client';
import {
  extraerDatosOnapiTexto,
  obtenerContactoGoogle,
  obtenerTipoEmpresaDgii,
  convertirRegistroACliente,
} from '../utils/pipelineEngine';
import { exportClientsToCSV } from '../utils/storage';
import { SAMPLE_ONAPI_RAW_BULLETIN_TEXT } from '../data/mockOnapiBoletin';
import {
  X,
  Play,
  FileText,
  Building,
  MapPin,
  FileCheck,
  CheckCircle2,
  Terminal,
  Download,
  Database,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Code2,
  Phone,
  RefreshCw,
} from 'lucide-react';

interface PipelineRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToClients: (newClients: Client[]) => void;
  onOpenPythonModal: () => void;
  advisors: Advisor[];
}

export const PipelineRunnerModal: React.FC<PipelineRunnerModalProps> = ({
  isOpen,
  onClose,
  onImportToClients,
  onOpenPythonModal,
  advisors,
}) => {
  if (!isOpen) return null;

  const [inputMode, setInputMode] = useState<'demo' | 'text' | 'file'>('demo');
  const [customText, setCustomText] = useState(SAMPLE_ONAPI_RAW_BULLETIN_TEXT);
  const [fileName, setFileName] = useState<string | null>(null);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedClients, setProcessedClients] = useState<Client[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString('es-DO')}] ${msg}`]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCustomText(content);
        appendLog(`Archivo "${file.name}" cargado (${Math.round(content.length / 1024)} KB)`);
      }
    };
    reader.readAsText(file);
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setIsCompleted(false);
    setProgress(5);
    setCurrentStep(1);
    setLogs([]);
    setProcessedClients([]);

    appendLog('Iniciando infraestructura de datos ONAPI -> Google Places -> DGII...');
    await new Promise((r) => setTimeout(r, 600));

    // ==========================================
    // ETAPA 1: EXTRACCIÓN LOCAL ONAPI (pdfplumber)
    // ==========================================
    appendLog('[+] ETAPA 1: Analizando boletín oficial de ONAPI con expresiones regulares...');
    const registrosBase = extraerDatosOnapiTexto(customText);

    if (registrosBase.length === 0) {
      appendLog('[-] Error: No se encontraron patrones "Denominación:" y "Actividad:".');
      setIsRunning(false);
      return;
    }

    appendLog(`[✓] Extracción ONAPI exitosa: ${registrosBase.length} denominaciones comerciales identificadas.`);
    setProgress(30);
    await new Promise((r) => setTimeout(r, 700));

    // ==========================================
    // ETAPA 2 & 3: ENRIQUECIMIENTO (Google Places + DGII)
    // ==========================================
    setCurrentStep(2);
    appendLog('[+] ETAPA 2: Consultando Google Places API (República Dominicana)...');
    appendLog('[+] ETAPA 3: Consultando API de la DGII / RNC para clasificación societaria...');

    const resultados: Client[] = [];
    const total = registrosBase.length;

    for (let i = 0; i < total; i++) {
      const item = registrosBase[i];
      appendLog(`    -> [${i + 1}/${total}] Procesando: ${item.nombre_comercial}`);

      // Google Places
      const placesInfo = obtenerContactoGoogle(item.nombre_comercial);

      // DGII
      const dgiiInfo = obtenerTipoEmpresaDgii(item.nombre_comercial);

      const clientObj = convertirRegistroACliente(item, placesInfo, dgiiInfo, i);
      resultados.push(clientObj);

      appendLog(`       • Places: Tel ${placesInfo.telefonoCorporativo} | ${placesInfo.direccionExacta.slice(0, 40)}...`);
      appendLog(`       • DGII: ${dgiiInfo.tipoSociedad} | RNC: ${dgiiInfo.rnc}`);

      const stepProgress = 30 + Math.round(((i + 1) / total) * 55);
      setProgress(stepProgress);
      await new Promise((r) => setTimeout(r, 350));
    }

    // ==========================================
    // ETAPA 4: CONSOLIDACIÓN
    // ==========================================
    setCurrentStep(4);
    setProgress(100);
    setProcessedClients(resultados);
    setIsCompleted(true);
    setIsRunning(false);
    appendLog(`[✓] ¡Pipeline completado con éxito! ${resultados.length} empresas listas para prospección.`);
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
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Infraestructura de Datos: ONAPI ➔ Google Places ➔ DGII
                </h3>
                <p className="text-xs text-slate-500">
                  Extracción automatizada de nuevos registros comerciales y enriquecimiento de contacto en República Dominicana
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPythonModal}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ver Script Python</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Pipeline Diagram */}
          <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Flujo del Pipeline de Extracción y Enriquecimiento
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              {/* Step 1 */}
              <div
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  currentStep === 1
                    ? 'border-indigo-400 bg-indigo-950/80 ring-1 ring-indigo-400'
                    : currentStep > 1
                    ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] uppercase tracking-wide">1. ONAPI PDF</span>
                  {currentStep > 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-[11px] leading-tight opacity-90">
                  pdfplumber extrae Nombre Comercial & Actividad
                </p>
              </div>

              {/* Step 2 */}
              <div
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  currentStep === 2
                    ? 'border-indigo-400 bg-indigo-950/80 ring-1 ring-indigo-400'
                    : currentStep > 2
                    ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] uppercase tracking-wide">2. Google Places</span>
                  {currentStep > 2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-[11px] leading-tight opacity-90">
                  Búsqueda RD: Teléfono corporativo & Dirección
                </p>
              </div>

              {/* Step 3 */}
              <div
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  currentStep === 3
                    ? 'border-indigo-400 bg-indigo-950/80 ring-1 ring-indigo-400'
                    : currentStep > 3
                    ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] uppercase tracking-wide">3. API DGII / RNC</span>
                  {currentStep > 3 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-[11px] leading-tight opacity-90">
                  Tipo de Sociedad (S.R.L., S.A.S., E.I.R.L., S.A.)
                </p>
              </div>

              {/* Step 4 */}
              <div
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  currentStep === 4
                    ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] uppercase tracking-wide">4. Base de Datos / CSV</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-[11px] leading-tight opacity-90">
                  Consolidado para CRM y archivo CSV listo
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isRunning && (
              <div className="mt-3">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Center Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Input Selection tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Fuente de Entrada del Boletín ONAPI
                </label>
                <div className="flex items-center p-1 bg-slate-100 rounded-lg gap-1">
                  <button
                    onClick={() => setInputMode('demo')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      inputMode === 'demo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Boletín Demo (2026)
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      inputMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Pegar Texto
                  </button>
                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      inputMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Subir Archivo
                  </button>
                </div>
              </div>

              {inputMode === 'demo' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Boletín oficial precargado con <strong>10 nuevas empresas registradas</strong> en Santo Domingo, Santiago, Punta Cana y La Vega.
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Formato ONAPI Ordinario</span>
                </div>
              )}

              {inputMode === 'text' && (
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={4}
                  placeholder="Pega aquí el extracto del PDF de ONAPI con campos 'Denominación:' y 'Actividad:'..."
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              )}

              {inputMode === 'file' && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <label className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer block">
                    <span>Seleccionar boletín de ONAPI (.txt o .pdf)</span>
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {fileName ? `Archivo cargado: ${fileName}` : 'Formatos admitidos: TXT, texto exportado o PDF'}
                  </span>
                </div>
              )}
            </div>

            {/* Run Action Bar */}
            <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Ejecutar Pipeline Automatizado
                </span>
                <span className="text-[11px] text-indigo-700">
                  Aplica extracción regex, enriquecimiento con Google Places RD y clasificación societaria DGII
                </span>
              </div>

              <button
                disabled={isRunning}
                onClick={runPipeline}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
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

            {/* Terminal Logs */}
            {logs.length > 0 && (
              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800 space-y-1">
                <div className="text-slate-500 pb-1 border-b border-slate-800 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal de Extracción & Enriquecimiento</span>
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
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Vista Previa de Empresas Enriquecidas ({processedClients.length})
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Listo para exportar o importar
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[11px] font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Nombre Comercial</th>
                        <th className="py-2 px-3">Tipo DGII</th>
                        <th className="py-2 px-3">Teléfono</th>
                        <th className="py-2 px-3">Ubicación / Dirección</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedClients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[200px]">
                            {c.name}
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-[11px]">
                            {c.dgii?.siglas}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-800">
                            {c.places?.telefonoCorporativo}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[250px]">
                            {c.places?.direccionExacta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {isCompleted ? (
                <span className="font-semibold text-emerald-700">
                  ✓ Pipeline finalizado: {processedClients.length} registros listos
                </span>
              ) : (
                <span>Haz clic en &quot;Iniciar Pipeline&quot; para ejecutar la extracción.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCompleted && (
                <>
                  <button
                    onClick={handleExportGeneratedCSV}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Descargar CSV (RD)</span>
                  </button>

                  <button
                    onClick={handleCommitToCRM}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Importar al CRM / Base de Clientes</span>
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
