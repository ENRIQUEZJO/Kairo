import React from 'react';
import { FilterState } from '../types/client';
import { Search, X, Briefcase, Phone, Building2, MapPin } from 'lucide-react';
import { SECTORES_EMPRESARIALES_RD } from '../utils/sectorClassifier';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalResults: number;
  totalClients: number;
  provincias: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
  totalClients,
  provincias,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.tipoSociedad !== 'todos' ||
    filters.actividadSector !== 'todos' ||
    filters.hasPhone !== 'todos' ||
    filters.provincia !== 'todos' ||
    filters.timeframe !== 'todos';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-2xs">
      {/* Upper row: Search and primary selects */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Buscar por denominación comercial, actividad ONAPI, teléfono, RNC o dirección..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Actividad / Sector Empresarial */}
          <div className="w-full sm:w-auto">
            <select
              value={filters.actividadSector}
              onChange={(e) => onFilterChange({ actividadSector: e.target.value })}
              className="w-full text-xs font-semibold bg-indigo-50/70 border border-indigo-200 text-indigo-950 py-2 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Actividad: Todas</option>
              {SECTORES_EMPRESARIALES_RD.map((sec) => (
                <option key={sec.id} value={sec.nombre}>
                  {sec.icon} {sec.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Empresa DGII */}
          <div className="w-full sm:w-auto">
            <select
              value={filters.tipoSociedad}
              onChange={(e) => onFilterChange({ tipoSociedad: e.target.value as FilterState['tipoSociedad'] })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 py-2 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Tipo DGII: Todos</option>
              <option value="S.R.L.">S.R.L. (Resp. Limitada)</option>
              <option value="S.A.S.">S.A.S. (Simplificada)</option>
              <option value="E.I.R.L.">E.I.R.L. (Individual)</option>
              <option value="S.A.">S.A. (Sociedad Anónima)</option>
              <option value="Persona Física">Persona Física / Pendiente</option>
            </select>
          </div>

          {/* Teléfono Places filter */}
          <div className="w-full sm:w-auto">
            <select
              value={filters.hasPhone}
              onChange={(e) => onFilterChange({ hasPhone: e.target.value as FilterState['hasPhone'] })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Teléfono Places: Todos</option>
              <option value="con_telefono">✓ Con Teléfono Encontrado</option>
              <option value="sin_telefono">Sin Teléfono</option>
            </select>
          </div>

          {/* Provincia RD */}
          <div className="w-full sm:w-auto">
            <select
              value={filters.provincia}
              onChange={(e) => onFilterChange({ provincia: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Provincia: Todas</option>
              {provincias.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full sm:w-auto">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="createdAt_desc">Más recientes primero</option>
              <option value="createdAt_asc">Más antiguos primero</option>
              <option value="name_asc">Alfabético (Empresa A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lower row: Quick Presets & Sector Chips */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span>Filtrar por actividad:</span>
          </span>

          {SECTORES_EMPRESARIALES_RD.slice(0, 7).map((sec) => (
            <button
              key={sec.id}
              onClick={() =>
                onFilterChange({
                  actividadSector: filters.actividadSector === sec.nombre ? 'todos' : sec.nombre,
                })
              }
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filters.actividadSector === sec.nombre
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.nombre.split(',')[0].split('&')[0].trim()}</span>
            </button>
          ))}

          <button
            onClick={() =>
              onFilterChange({
                hasPhone: filters.hasPhone === 'con_telefono' ? 'todos' : 'con_telefono',
              })
            }
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
              filters.hasPhone === 'con_telefono'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            ✓ Con teléfono
          </button>
        </div>

        {/* Counter & Clear Button */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Mostrando <span className="font-semibold text-slate-900">{totalResults}</span> de{' '}
            <span>{totalClients}</span> empresas
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Restablecer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
