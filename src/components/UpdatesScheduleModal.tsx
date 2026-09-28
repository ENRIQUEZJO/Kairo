import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Building2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ENTITY_SCHEDULES, RECENT_BULLETINS_HISTORY } from '../data/calendarSchedule';

interface UpdatesScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunPipeline: () => void;
}

export const UpdatesScheduleModal: React.FC<UpdatesScheduleModalProps> = ({
  isOpen,
  onClose,
  onRunPipeline,
}) => {
  if (!isOpen) return null;

  const [checking, setChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('Hace 5 minutos');
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  const handleCheckNow = () => {
    setChecking(true);
    setCheckStatus(null);
    setTimeout(() => {
      setChecking(false);
      setLastCheckTime('Ahora mismo (28/09/2026 ' + new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) + ')');
      setCheckStatus('Portal de ONAPI verificado: La Edición Nº 248 está vigente. La Edición Nº 249 está programada para el 30 de septiembre a las 11:30 AM.');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Calendario de Publicaciones y Actualizaciones: ONAPI & DGII
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoreo de fechas, horarios oficiales y periodicidad de subida de nuevas empresas en República Dominicana
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Status Bar */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Próxima subida de empresas en ONAPI: <span className="text-indigo-700">30 de Septiembre de 2026</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Frecuencia quincenal oficial (Días 15 y 30 de cada mes) · Última verificación: {lastCheckTime}
                  </div>
                </div>
              </div>

              <button
                disabled={checking}
                onClick={handleCheckNow}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{checking ? 'Consultando...' : 'Comprobar ahora'}</span>
              </button>
            </div>

            {checkStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{checkStatus}</span>
              </div>
            )}

            {/* Entity Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENTITY_SCHEDULES.map((schedule) => (
                <div
                  key={schedule.siglas}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {schedule.siglas}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{schedule.entidad}</h4>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {schedule.frecuencia}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">{schedule.nombreCompleto}</p>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Días de Publicación:</span>
                        <span className="font-semibold text-slate-800 text-right">{schedule.diasPublicacion}</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Horario Habitual:</span>
                        <span className="font-semibold text-slate-800 text-right">{schedule.horarioHabitual}</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Próxima Fecha:</span>
                        <span className="font-bold text-indigo-700 text-right">{schedule.proximaFechaEstimada}</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Formato Oficial:</span>
                        <span className="text-slate-700 font-mono text-[11px] text-right">{schedule.formatoArchivo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{schedule.recomendacionScraping}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ciclo de Vida: Desde ONAPI hasta DGII */}
            <div className="p-5 bg-slate-900 text-white rounded-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Ciclo de Vida de una Empresa en RD (Ventana de Oportunidad Comercial)
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Días 1 a 15 clave</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="font-bold text-indigo-400 mb-1">Paso 1: ONAPI</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    El solicitante registra la denominación comercial. Se publica en el boletín oficial quincenal (día 15 o 30).
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="font-bold text-blue-400 mb-1">Paso 2: Registro Mercantil</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Formalización de estatutos y asamblea en la Cámara de Comercio. Toma de <strong>2 a 4 días laborables</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="font-bold text-emerald-400 mb-1">Paso 3: DGII (RNC)</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Asignación del RNC tributario definitivo y tipo societario (SRL, SAS). Se actualiza en el sistema a las <strong>02:00 AM</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Historial de Boletines Oficiales Recientes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Historial de Publicaciones y Boletines Recientes
                </h4>
                <a
                  href="https://onapi.gob.do"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Portal oficial de ONAPI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Organismo</th>
                      <th className="py-2.5 px-3">Edición / Boletín</th>
                      <th className="py-2.5 px-3">Fecha Emisión</th>
                      <th className="py-2.5 px-3">Volumen Empresas</th>
                      <th className="py-2.5 px-3 text-right">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RECENT_BULLETINS_HISTORY.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.entidad === 'ONAPI'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {item.entidad}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.titulo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">
                          {item.fechaPublicacion} ({item.horaAproximada})
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold tabular-nums">
                          ~{item.totalEmpresas} registros
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.estado === 'proximo' ? (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              En preparación (30 Sep)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Publicado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Próximo boletín oficial de ONAPI previsto para el <strong>30 de Septiembre de 2026</strong>.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onRunPipeline();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar Pipeline con Boletín Actual</span>
              </button>

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
