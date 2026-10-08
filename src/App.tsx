import React, { useState, useMemo, useEffect } from 'react';
import { Client, FilterState } from './types/client';
import { ADVISORS } from './data/mockClients';
import {
  loadStoredClients,
  saveClients,
  resetToDemoClients,
  clearDatabase,
  calculateStats,
  exportClientsToCSV,
} from './utils/storage';
import { TopBar } from './components/TopBar';
import { MetricsRibbon } from './components/MetricsRibbon';
import { FilterBar } from './components/FilterBar';
import { ClientTableView } from './components/ClientTableView';
import { ClientDrawer } from './components/ClientDrawer';
import { NewClientModal } from './components/NewClientModal';
import { PipelineRunnerModal } from './components/PipelineRunnerModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { UpdatesScheduleModal } from './components/UpdatesScheduleModal';
import { clasificarActividadEmpresarial } from './utils/sectorClassifier';
import { CheckCircle2 } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  tipoSociedad: 'todos',
  actividadSector: 'todos',
  provincia: 'todos',
  hasPhone: 'todos',
  timeframe: 'todos',
  sortBy: 'createdAt_desc',
};

export default function App() {
  const [clients, setClients] = useState<Client[]>(() => loadStoredClients());
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isPythonOpen, setIsPythonOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save whenever clients list changes
  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  // Keep selectedClient in sync with updated client data
  useEffect(() => {
    if (selectedClient) {
      const refreshed = clients.find((c) => c.id === selectedClient.id);
      if (refreshed) {
        setSelectedClient(refreshed);
      }
    }
  }, [clients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    showToast('Filtros restablecidos');
  };

  const handlePresetFilter = (preset: 'todos' | 'con_telefono' | 'srl' | 'sas') => {
    if (preset === 'todos') {
      setFilters(INITIAL_FILTERS);
    } else if (preset === 'con_telefono') {
      setFilters({ ...INITIAL_FILTERS, hasPhone: 'con_telefono' });
    } else if (preset === 'srl') {
      setFilters({ ...INITIAL_FILTERS, tipoSociedad: 'S.R.L.' });
    } else if (preset === 'sas') {
      setFilters({ ...INITIAL_FILTERS, tipoSociedad: 'S.A.S.' });
    }
  };

  const handleUpdateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
    showToast('Expediente actualizado');
  };

  const handleDeleteClients = (clientIds: string[]) => {
    setClients((prev) => prev.filter((c) => !clientIds.includes(c.id)));
    if (selectedClient && clientIds.includes(selectedClient.id)) {
      setSelectedClient(null);
    }
    showToast(`${clientIds.length} empresa(s) eliminada(s)`);
  };

  const handleAddClient = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`Empresa "${newClient.name}" registrada con éxito`);
    setSelectedClient(newClient);
  };

  const handleImportFromPipeline = (extractedClients: Client[]) => {
    const existingNames = new Set(clients.map((c) => c.name.toLowerCase().trim()));
    const newItems = extractedClients.filter(
      (c) => !existingNames.has(c.name.toLowerCase().trim())
    );

    if (newItems.length === 0) {
      showToast('Las empresas del boletín ya existen en la base de datos.');
      return;
    }

    setClients((prev) => [...newItems, ...prev]);
    showToast(`¡${newItems.length} empresas enriquecidas añadidas exitosamente!`);
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas vaciar la base de datos por completo para comenzar desde cero con tu propio archivo de ONAPI?')) {
      const reset = clearDatabase();
      setClients(reset);
      setSelectedClient(null);
      setFilters(INITIAL_FILTERS);
      showToast('Base de datos vaciada. Lista para importar tus empresas.');
    }
  };

  const handleExportCSV = () => {
    exportClientsToCSV(filteredClients, 'nuevas_empresas_rd_completo.csv');
    showToast(`Exportando ${filteredClients.length} empresas a "nuevas_empresas_rd_completo.csv"`);
  };

  // Provinces list
  const provincias = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      const p = c.provincia || c.city;
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [clients]);

  // Real statistics
  const stats = useMemo(() => calculateStats(clients), [clients]);

  // Filtered & Sorted clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // 1. Text search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const inName = client.name.toLowerCase().includes(query);
        const inActivity = (client.onapi?.descripcionActividad || client.industry || '').toLowerCase().includes(query);
        const inPhone = (client.phone || '').toLowerCase().includes(query);
        const inAddress = (client.places?.direccionExacta || client.city || '').toLowerCase().includes(query);
        const inRnc = (client.dgii?.rnc || '').toLowerCase().includes(query);
        const inSolicitante = (client.position || '').toLowerCase().includes(query);

        if (!inName && !inActivity && !inPhone && !inAddress && !inRnc && !inSolicitante) {
          return false;
        }
      }

      // 2. Tipo Societario DGII
      if (filters.tipoSociedad !== 'todos') {
        const siglas = client.dgii?.siglas;
        if (siglas !== filters.tipoSociedad) {
          return false;
        }
      }

      // 3. Actividad Empresarial / Sector
      if (filters.actividadSector !== 'todos') {
        const clientSector = client.sector || clasificarActividadEmpresarial(client.onapi?.descripcionActividad || client.industry || '');
        if (clientSector !== filters.actividadSector) {
          return false;
        }
      }

      // 3. Has Phone (Google Places)
      if (filters.hasPhone !== 'todos') {
        const validPhone = client.phone && client.phone !== 'No disponible' && client.phone.trim().length > 6;
        if (filters.hasPhone === 'con_telefono' && !validPhone) return false;
        if (filters.hasPhone === 'sin_telefono' && validPhone) return false;
      }

      // 4. Provincia RD
      if (filters.provincia !== 'todos') {
        const p = client.provincia || client.city;
        if (p !== filters.provincia) return false;
      }

      // 5. Timeframe
      if (filters.timeframe !== 'todos') {
        const createdMs = new Date(client.createdAt).getTime();
        const nowMs = Date.now();
        const diffMs = nowMs - createdMs;
        const oneDay = 1000 * 60 * 60 * 24;

        if (filters.timeframe === 'hoy') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (createdMs < startOfToday.getTime()) return false;
        } else if (filters.timeframe === '7dias') {
          if (diffMs > oneDay * 7) return false;
        } else if (filters.timeframe === '30dias') {
          if (diffMs > oneDay * 30) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'createdAt_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'createdAt_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'es');
      }
      return 0;
    });
  }, [clients, filters]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar with Calendar & Updates Schedule Trigger */}
      <TopBar
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onOpenPipelineModal={() => setIsPipelineOpen(true)}
        onOpenPythonModal={() => setIsPythonOpen(true)}
        onOpenScheduleModal={() => setIsScheduleOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        totalClientsCount={clients.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Data Enrichment Metrics Banner */}
        <MetricsRibbon
          stats={stats}
          onFilterPreset={handlePresetFilter}
          activePhoneFilter={filters.hasPhone}
          activeTipoSociedad={filters.tipoSociedad}
        />

        {/* Filters and Search Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalResults={filteredClients.length}
          totalClients={clients.length}
          provincias={provincias}
        />

        {/* High-density Extracted Companies Table */}
        <ClientTableView
          clients={filteredClients}
          onSelectClient={setSelectedClient}
          onDeleteClients={handleDeleteClients}
          onResetFilters={handleResetFilters}
          onOpenUploadModal={() => setIsPipelineOpen(true)}
        />
      </main>

      {/* Sliding Company Detail Dossier */}
      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={(id) => handleDeleteClients([id])}
        advisors={ADVISORS}
      />

      {/* New Company Registration Modal */}
      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onAddClient={handleAddClient}
        advisors={ADVISORS}
      />

      {/* Pipeline Runner Modal (ONAPI -> Google Places -> DGII -> CSV) */}
      <PipelineRunnerModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onImportToClients={handleImportFromPipeline}
        onOpenPythonModal={() => {
          setIsPipelineOpen(false);
          setIsPythonOpen(true);
        }}
        advisors={ADVISORS}
      />

      {/* Python Code Viewer Modal */}
      <PythonCodeModal
        isOpen={isPythonOpen}
        onClose={() => setIsPythonOpen(false)}
      />

      {/* Updates Schedule & Publication Calendar Modal */}
      <UpdatesScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onRunPipeline={() => setIsPipelineOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
