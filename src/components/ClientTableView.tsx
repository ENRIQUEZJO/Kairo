import React, { useState } from 'react';
import { Client } from '../types/client';
import {
  MessageSquare,
  Phone,
  ChevronRight,
  ExternalLink,
  Trash2,
  MapPin,
  AlertCircle,
  Building2,
  UploadCloud,
} from 'lucide-react';

interface ClientTableViewProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onDeleteClients: (clientIds: string[]) => void;
  onResetFilters: () => void;
  onOpenUploadModal?: () => void;
}

export const ClientTableView: React.FC<ClientTableViewProps> = ({
  clients,
  onSelectClient,
  onDeleteClients,
  onResetFilters,
  onOpenUploadModal,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(clients.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} empresas seleccionadas?`)) {
      onDeleteClients(selectedIds);
      setSelectedIds([]);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Base de datos lista para importar
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          No hay empresas demo precargadas. Sube tu archivo oficial de ONAPI (PDF, CSV o TXT) para extraer y enriquecer automáticamente nuevas empresas.
        </p>
        <div className="flex items-center justify-center gap-2">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Boletín / PDF</span>
            </button>
          )}
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono tabular-nums">{selectedIds.length}</span>
            <span>empresas seleccionadas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-900 rounded text-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar seleccionadas
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center shrink-0">
                <input
                  type="checkbox"
                  checked={selectedIds.length === clients.length && clients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 min-w-[260px] whitespace-nowrap">Denominación Comercial</th>
              <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Tipo DGII</th>
              <th className="py-3 px-4 min-w-[280px]">Actividad ONAPI</th>
              <th className="py-3 px-3 min-w-[150px] whitespace-nowrap">Teléfono (Places)</th>
              <th className="py-3 px-3 min-w-[220px]">Ubicación / Dirección</th>
              <th className="py-3 px-3 min-w-[100px] whitespace-nowrap">Registro</th>
              <th className="py-3 px-4 min-w-[130px] text-right whitespace-nowrap">Contacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client) => {
              const isSelected = selectedIds.includes(client.id);
              const phoneValid = client.phone && client.phone !== 'No disponible';
              const cleanPhone = phoneValid ? client.phone.replace(/[^0-9]/g, '') : '';
              const whatsappPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

              const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                `Saludos cordiales, nos comunicamos con ${client.name}. Vimos su reciente registro de nombre comercial en ONAPI y deseamos presentarles nuestras soluciones empresariales.`
              )}`;

              const mapsUrl =
                client.places?.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${client.name}, Republica Dominicana`
                )}`;

              return (
                <tr
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td
                    className="py-3 px-3 text-center"
                    onClick={(e) => handleToggleSelect(client.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Denominación Comercial */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {client.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {client.position || 'Titular ONAPI'}
                      </span>
                      {client.onapi?.registroNo && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-slate-400">Sol. {client.onapi.registroNo}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Tipo Empresa DGII */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 text-[11px]">
                      {client.dgii?.siglas || 'S.R.L.'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      RNC: {client.dgii?.rnc || 'En Proceso'}
                    </div>
                  </td>

                  {/* Descripción Actividad ONAPI */}
                  <td className="py-3 px-4">
                    {client.sector && (
                      <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                        {client.sector}
                      </span>
                    )}
                    <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed" title={client.onapi?.descripcionActividad || client.industry}>
                      {client.onapi?.descripcionActividad || client.industry || 'Actividad comercial registrada en boletín oficial.'}
                    </p>
                  </td>

                  {/* Teléfono Google Places */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {phoneValid ? (
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-900 font-semibold text-xs">
                        <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">No disponible</span>
                    )}
                  </td>

                  {/* Dirección Exacta */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-1 text-slate-700 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-snug" title={client.places?.direccionExacta || client.city}>
                        {client.places?.direccionExacta || `${client.city}, República Dominicana`}
                      </span>
                    </div>
                  </td>

                  {/* Fecha de Registro */}
                  <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap font-mono tabular-nums">
                    {new Date(client.createdAt).toLocaleDateString('es-DO', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* WhatsApp trigger */}
                      {phoneValid && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Enviar WhatsApp"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Phone call trigger */}
                      {phoneValid && (
                        <a
                          href={`tel:${client.phone}`}
                          title="Llamar teléfono corporativo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Google Maps link */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver ubicación en Google Maps"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Open drawer chevron */}
                      <button
                        onClick={() => onSelectClient(client)}
                        title="Ver expediente"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
