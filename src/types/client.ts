export type TipoSociedadRD =
  | 'Sociedad de Responsabilidad Limitada (S.R.L.)'
  | 'Sociedad Anónima Simplificada (S.A.S.)'
  | 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)'
  | 'Sociedad Anónima (S.A.)'
  | 'Pendiente de constitución / Persona Física';

export interface Advisor {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  email: string;
}

export interface ClientActivityNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  type: 'nota' | 'llamada' | 'correo' | 'reunion' | 'whatsapp';
}

export interface OnapiExtraction {
  registroNo?: string;
  denominacion: string;
  descripcionActividad: string;
  solicitante?: string;
  fechaPublicacion?: string;
}

export interface GooglePlacesEnrichment {
  encontrado: boolean;
  direccionExacta: string;
  telefonoCorporativo: string;
  rating?: number;
  googleMapsUrl?: string;
  municipio?: string;
}

export interface DgiiFiscalEnrichment {
  rnc?: string;
  tipoSociedad: TipoSociedadRD;
  siglas: 'S.R.L.' | 'S.A.S.' | 'E.I.R.L.' | 'S.A.' | 'Persona Física';
  estadoTributario: 'Activo' | 'En Proceso' | 'Pendiente';
}

export interface Client {
  id: string;
  name: string; // Nombre comercial o denominación ONAPI
  company: string;
  position: string;
  email: string;
  phone: string;
  city: string;
  country: string; // República Dominicana
  provincia?: string;
  createdAt: string;
  tags: string[];
  notes: ClientActivityNote[];
  website?: string;
  industry?: string;
  sector?: string; // Sector de actividad empresarial (Construcción, Tech, Salud, etc.)

  // Enriquecimiento específico del Pipeline ONAPI / Places / DGII
  onapi?: OnapiExtraction;
  places?: GooglePlacesEnrichment;
  dgii?: DgiiFiscalEnrichment;
  assignedAdvisor?: Advisor;
}

export interface FilterState {
  search: string;
  tipoSociedad: 'todos' | 'S.R.L.' | 'S.A.S.' | 'E.I.R.L.' | 'S.A.' | 'Persona Física';
  actividadSector: 'todos' | string;
  provincia: 'todos' | string;
  hasPhone: 'todos' | 'con_telefono' | 'sin_telefono';
  timeframe: 'todos' | 'hoy' | '7dias' | '30dias';
  sortBy: 'createdAt_desc' | 'createdAt_asc' | 'name_asc';
}

export interface ClientStats {
  totalClients: number;
  withPhoneCount: number;
  srlCount: number;
  sasCount: number;
  eirlCount: number;
  provinciasCount: number;
}

export interface PipelineExecutionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  step: 1 | 2 | 3 | 4;
}
