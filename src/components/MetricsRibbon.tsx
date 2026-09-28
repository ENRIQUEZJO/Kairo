import React from 'react';
import { ClientStats } from '../types/client';
import { Building2, PhoneCall, Users, MapPin, Building } from 'lucide-react';

interface MetricsRibbonProps {
  stats: ClientStats;
  onFilterPreset: (preset: 'todos' | 'con_telefono' | 'srl' | 'sas') => void;
  activePhoneFilter: string;
  activeTipoSociedad: string;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({
  stats,
  onFilterPreset,
  activePhoneFilter,
  activeTipoSociedad,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {/* Total Registros */}
      <button
        onClick={() => onFilterPreset('todos')}
        className={`p-3.5 bg-white border rounded-xl text-left transition-all cursor-pointer hover:border-slate-300 shadow-2xs ${
          activePhoneFilter === 'todos' && activeTipoSociedad === 'todos'
            ? 'border-indigo-400 ring-1 ring-indigo-400'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Empresas ONAPI</span>
          <Building2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {stats.totalClients}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Registros procesados</p>
      </button>

      {/* Con Teléfono Encontrado */}
      <button
        onClick={() => onFilterPreset('con_telefono')}
        className={`p-3.5 bg-white border rounded-xl text-left transition-all cursor-pointer hover:border-blue-300 shadow-2xs ${
          activePhoneFilter === 'con_telefono'
            ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium text-blue-800">Con Teléfono Places</span>
          <PhoneCall className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
          {stats.withPhoneCount}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Contacto corporativo verificado</p>
      </button>

      {/* Sociedades S.R.L. */}
      <button
        onClick={() => onFilterPreset('srl')}
        className={`p-3.5 bg-white border rounded-xl text-left transition-all cursor-pointer hover:border-purple-300 shadow-2xs ${
          activeTipoSociedad === 'S.R.L.'
            ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium text-purple-800">Sociedades S.R.L.</span>
          <Users className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-700 font-mono tabular-nums">
          {stats.srlCount}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Resp. Limitada (DGII)</p>
      </button>

      {/* Sociedades S.A.S. */}
      <button
        onClick={() => onFilterPreset('sas')}
        className={`p-3.5 bg-white border rounded-xl text-left transition-all cursor-pointer hover:border-emerald-300 shadow-2xs ${
          activeTipoSociedad === 'S.A.S.'
            ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium text-emerald-800">Sociedades S.A.S.</span>
          <Building className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
          {stats.sasCount}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Anónimas Simplificadas</p>
      </button>

      {/* Provincias Cubiertas */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Ubicaciones / Prov.</span>
          <MapPin className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {stats.provinciasCount}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Zonas identificadas en RD</p>
      </div>
    </div>
  );
};
