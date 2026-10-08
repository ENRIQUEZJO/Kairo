import React from 'react';
import { Download, Plus, RotateCcw, Database, Code2, Calendar, UploadCloud } from 'lucide-react';

interface TopBarProps {
  onOpenNewClient: () => void;
  onOpenPipelineModal: () => void;
  onOpenPythonModal: () => void;
  onOpenScheduleModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  totalClientsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewClient,
  onOpenPipelineModal,
  onOpenPythonModal,
  onOpenScheduleModal,
  onExportCSV,
  onResetData,
  totalClientsCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Brand title & descriptor */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
              K
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <a href="#" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
                  Kairo
                </a>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                  ONAPI · RD
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block whitespace-nowrap">
                Extractor & Enriquecedor de Empresas
              </span>
            </div>
          </div>

          {/* Zone 2: Single-line Calendar & Next Publication Capsule (Clickable) */}
          <button
            onClick={onOpenScheduleModal}
            className="hidden md:flex items-center gap-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 group"
            title="Ver calendario y frecuencia de actualización oficial en ONAPI y DGII"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-slate-600 whitespace-nowrap">
              Próximo Boletín: <strong className="text-slate-900 group-hover:text-indigo-600">30 Sep</strong>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              En 2 días
            </span>
          </button>

          {/* Zone 3: Primary Actions (Single-line, no wraps) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Calendar button on mobile only */}
            <button
              onClick={onOpenScheduleModal}
              title="Ver calendario de subidas ONAPI / DGII"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
            </button>

            {/* Main Upload / Pipeline CTA */}
            <button
              onClick={onOpenPipelineModal}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              title="Cargar boletín oficial de ONAPI en formato PDF, CSV o TXT"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>Subir Boletín / PDF</span>
            </button>

            {/* Python code button */}
            <button
              onClick={onOpenPythonModal}
              title="Ver código Python y automatización con GitHub Actions"
              className="p-2 sm:px-2.5 sm:py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Code2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden xl:inline font-medium">Python</span>
            </button>

            {/* Export CSV button */}
            <button
              onClick={onExportCSV}
              title="Descargar nuevas_empresas_rd_completo.csv"
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden lg:inline">Exportar CSV</span>
            </button>

            {/* New Client manual */}
            <button
              onClick={onOpenNewClient}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[2] shrink-0 text-slate-600" />
              <span className="hidden sm:inline">Manual</span>
            </button>

            {/* Clear Database */}
            <button
              onClick={onResetData}
              title="Vaciar base de datos (Comenzar desde cero)"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
