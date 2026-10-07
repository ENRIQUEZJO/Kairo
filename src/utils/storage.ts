import { Client, ClientStats } from '../types/client';
import { INITIAL_CLIENTS } from '../data/mockClients';
import { clasificarActividadEmpresarial } from './sectorClassifier';

const STORAGE_KEY = 'kairo_onapi_leads_v6';

export function loadStoredClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('kairo_onapi_leads_v5');
    if (!raw) {
      saveClients(INITIAL_CLIENTS);
      return INITIAL_CLIENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Auto-migrar y asegurar que cada cliente tenga su nombre limpio y sector clasificado
      const sanitized: Client[] = parsed
        .filter((c: Client) => {
          // Filtrar si el nombre era un bloque entero no parseado de más de 200 caracteres
          return !(c.name && c.name.length > 250 && c.name.includes('REG. NO.'));
        })
        .map((c: Client) => {
          let cleanName = c.name?.trim() || 'Empresa Registrada';
          if (cleanName.length > 80) {
            cleanName = (cleanName.split(';')[0] || cleanName.slice(0, 60)).trim();
          }
          return {
            ...c,
            name: cleanName,
            company: cleanName,
            sector: c.sector || clasificarActividadEmpresarial(c.onapi?.descripcionActividad || c.industry || ''),
          };
        });

      // Si falta la nueva empresa financiera, agregarla al listado
      const hasFinancial = sanitized.some((c: Client) => c.sector?.toLowerCase().includes('financ'));
      if (!hasFinancial) {
        const financialLead = INITIAL_CLIENTS.find((c) => c.id === 'onapi-2026-08155');
        if (financialLead) {
          sanitized.push(financialLead);
        }
      }

      saveClients(sanitized);
      return sanitized;
    }
    return INITIAL_CLIENTS;
  } catch (err) {
    console.error('Error reading clients from localStorage:', err);
    return INITIAL_CLIENTS;
  }
}

export function saveClients(clients: Client[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error('Error saving clients to localStorage:', err);
  }
}

export function resetToDemoClients(): Client[] {
  saveClients(INITIAL_CLIENTS);
  return INITIAL_CLIENTS;
}

export function calculateStats(clients: Client[]): ClientStats {
  let withPhone = 0;
  let srlCount = 0;
  let sasCount = 0;
  let eirlCount = 0;
  const provSet = new Set<string>();

  clients.forEach((c) => {
    if (c.phone && c.phone !== 'No disponible' && c.phone.trim().length > 6) {
      withPhone++;
    }
    const siglas = c.dgii?.siglas;
    if (siglas === 'S.R.L.') srlCount++;
    else if (siglas === 'S.A.S.') sasCount++;
    else if (siglas === 'E.I.R.L.') eirlCount++;

    const prov = c.provincia || c.city;
    if (prov) provSet.add(prov);
  });

  return {
    totalClients: clients.length,
    withPhoneCount: withPhone,
    srlCount,
    sasCount,
    eirlCount,
    provinciasCount: provSet.size,
  };
}

export function exportClientsToCSV(clients: Client[], filename = 'nuevas_empresas_rd_completo.csv'): void {
  // Columnas exactas solicitadas por el script
  const headers = [
    'Nombre Comercial',
    'Tipo de Empresa',
    'Descripción Actividad',
    'Teléfono',
    'Dirección',
    'RNC (DGII)',
    'Provincia / Municipio',
    'Solicitante',
    'Fecha de Registro'
  ];

  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = clients.map((c) => [
    escapeCSV(c.name || c.company),
    escapeCSV(c.dgii?.tipoSociedad || 'Sociedad de Responsabilidad Limitada (S.R.L.)'),
    escapeCSV(c.onapi?.descripcionActividad || c.industry || 'Actividad comercial'),
    escapeCSV(c.places?.telefonoCorporativo || c.phone || 'No disponible'),
    escapeCSV(c.places?.direccionExacta || c.city || 'República Dominicana'),
    escapeCSV(c.dgii?.rnc || 'En Proceso'),
    escapeCSV(c.provincia || c.city || 'Santo Domingo'),
    escapeCSV(c.position || 'Titular ONAPI'),
    escapeCSV(new Date(c.createdAt).toLocaleDateString('es-DO'))
  ]);

  // UTF-8 BOM (\uFEFF) para compatibilidad con Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
