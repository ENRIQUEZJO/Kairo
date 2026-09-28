export interface OnapiRawRecord {
  registroNo: string;
  denominacion: string;
  descripcionActividad: string;
  solicitante: string;
  fechaPublicacion: string;
  industriaSugerida: string;
  provinciaSugerida: string;
}

export const SAMPLE_ONAPI_RAW_BULLETIN_TEXT = `OFICINA NACIONAL DE LA PROPIEDAD INDUSTRIAL (ONAPI)
DEPARTAMENTO DE SIGNOS DISTINTIVOS
BOLETÍN OFICIAL DE PUBLICACIONES DE NOMBRES COMERCIALES
EDICIÓN ORDINARIA Nº 248-26 - SANTO DOMINGO, D.N.

================================================================================
SOLICITUD Nº: 2026-08149
Denominación: AGROLOGISTICA DOMINICANA S.R.L.
Actividad: SERVICIOS INTEGRALES DE TRANSPORTE REFRIGERADO, ALMACENAMIENTO EN FRIO Y DISTRIBUCION DE PRODUCTOS AGROPECUARIOS A NIVEL NACIONAL E INTERNACIONAL.
Solicitante: CARLOS RAMON PEÑA GUZMAN
Fecha: 24/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08150
Denominación: NOVA SALUD CLINIC MEDICAL CENTER S.R.L.
Actividad: PRESTACION DE SERVICIOS MEDICOS ESPECIALIZADOS, CONSULTAS AMBULATORIAS, LABORATORIO CLINICO Y PROCEDIMIENTOS DE DIAGNOSTICO POR IMAGENES.
Solicitante: DRA. ALTAGRACIA MERCEDES BATISTA
Fecha: 24/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08151
Denominación: CARIBE TECH SOFTWARE SOLUTIONS S.A.S.
Actividad: DESARROLLO DE SOFTWARE EMPRESARIAL, PLATAFORMAS EN LA NUBE, CONSULTORIA EN CIBERSEGURIDAD Y AUTOMATIZACION DE PROCESOS COMERCIALES.
Solicitante: MANUEL EDUARDO TAVERAS
Fecha: 25/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08152
Denominación: PUNTA CANA LUXURY VILLAS & RESORTS E.I.R.L.
Actividad: GESTION INMOBILIARIA, ALQUILER VACACIONAL DE ALTA GAMA, ADMINISTRACION DE PROPIEDADES TURISTICAS Y SERVICIOS CONCIERGE.
Solicitante: JEAN MARC DELACROIX
Fecha: 25/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08153
Denominación: CONSTRUCTORA MONTE VERDE S.R.L.
Actividad: CONSTRUCCION DE EDIFICACIONES RESIDENCIALES Y COMERCIALES, SUPERVISION DE OBRAS CIVILES, REMODELACIONES Y MOVIMIENTO DE TIERRAS.
Solicitante: ING. LUIS ALBERTO ROSARIO
Fecha: 26/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08154
Denominación: GOURMET DELI EXPRESS S.R.L.
Actividad: IMPORTACION, COMERCIALIZACION Y DISTRIBUCION DE ALIMENTOS SELECTOS, EMBUTIDOS FINOS, QUESOS Y VINOS INTERNACIONALES.
Solicitante: SOFIA BEATRIZ HENRIQUEZ
Fecha: 26/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08155
Denominación: SOLARIS ENERGIA RENOVABLE DOMINICANA S.A.S.
Actividad: INSTALACION DE PANELES SOLARES FOTOVOLTAICOS, BATERIAS DE LITIO, ESTUDIOS DE EFICIENCIA ENERGETICA Y MANTENIMIENTO INDUSTRIAL.
Solicitante: RICARDO JOSE MATOS
Fecha: 26/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08156
Denominación: FARMACIAS POPULARES DEL NORTE S.R.L.
Actividad: VENTA AL POR MAYOR Y AL DETALLE DE PRODUCTOS FARMACEUTICOS, MEDICAMENTOS GENERICOS, ARTICULOS DE CUIDADO PERSONAL Y ORTOPEDICOS.
Solicitante: LIC. ROSAURA MEDINA
Fecha: 27/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08157
Denominación: NEXUS CONSULTING GROUP S.R.L.
Actividad: ASESORIA FINANCIERA, PLANIFICACION FISCAL CORPORATIVA, AUDITORIAS CONTABLES Y VALUACION DE NEGOCIOS.
Solicitante: FRANCISCO XAVIER POLANCO
Fecha: 27/09/2026
--------------------------------------------------------------------------------
SOLICITUD Nº: 2026-08158
Denominación: ECOPACKAGING DOMINICANA E.I.R.L.
Actividad: FABRICACION Y DISTRIBUCION DE EMPAQUES BIODEGRADABLES, BOLSAS DE PAPEL KRAFT Y ENVASES PARA LA INDUSTRIA GASTRONOMICA.
Solicitante: VALERIA SANTANA DIAZ
Fecha: 28/09/2026
`;

export const DOMINICAN_PLACES_DATABASE: Record<
  string,
  {
    telefono: string;
    direccion: string;
    provincia: string;
    rating: number;
    mapsQuery: string;
  }
> = {
  'AGROLOGISTICA DOMINICANA S.R.L.': {
    telefono: '(809) 567-4420',
    direccion: 'Av. Luperón No. 102, Zona Industrial de Herrera, Santo Domingo Oeste',
    provincia: 'Santo Domingo Oeste',
    rating: 4.8,
    mapsQuery: 'Agrologistica Dominicana Herrera Santo Domingo',
  },
  'NOVA SALUD CLINIC MEDICAL CENTER S.R.L.': {
    telefono: '(829) 450-8811',
    direccion: 'Calle Francisco Prats Ramírez No. 45, Piantini, Distrito Nacional',
    provincia: 'Distrito Nacional',
    rating: 4.9,
    mapsQuery: 'Nova Salud Clinic Piantini Santo Domingo',
  },
  'CARIBE TECH SOFTWARE SOLUTIONS S.A.S.': {
    telefono: '(809) 334-9102',
    direccion: 'Torre Acrópolis, Nivel 14, Av. Winston Churchill, Piantini, Distrito Nacional',
    provincia: 'Distrito Nacional',
    rating: 4.7,
    mapsQuery: 'Caribe Tech Torre Acropolis Winston Churchill Santo Domingo',
  },
  'PUNTA CANA LUXURY VILLAS & RESORTS E.I.R.L.': {
    telefono: '(849) 210-5544',
    direccion: 'Boulevard Turístico del Este Km 14, Punta Cana Village, La Altagracia',
    provincia: 'La Altagracia (Punta Cana)',
    rating: 5.0,
    mapsQuery: 'Punta Cana Luxury Villas Punta Cana Village',
  },
  'CONSTRUCTORA MONTE VERDE S.R.L.': {
    telefono: '(809) 582-7790',
    direccion: 'Av. Juan Pablo Duarte No. 88, Los Jardines Metropolitanos, Santiago de los Caballeros',
    provincia: 'Santiago',
    rating: 4.6,
    mapsQuery: 'Constructora Monte Verde Los Jardines Santiago',
  },
  'GOURMET DELI EXPRESS S.R.L.': {
    telefono: '(809) 472-1922',
    direccion: 'Calle Max Henríquez Ureña No. 71, Naco, Distrito Nacional',
    provincia: 'Distrito Nacional',
    rating: 4.8,
    mapsQuery: 'Gourmet Deli Express Naco Santo Domingo',
  },
  'SOLARIS ENERGIA RENOVABLE DOMINICANA S.A.S.': {
    telefono: '(829) 720-3301',
    direccion: 'Autopista Duarte Km 9.5, Plaza Comercial Los Prados, Santo Domingo',
    provincia: 'Distrito Nacional',
    rating: 4.9,
    mapsQuery: 'Solaris Energia Renovable Autopista Duarte',
  },
  'FARMACIAS POPULARES DEL NORTE S.R.L.': {
    telefono: '(809) 573-2100',
    direccion: 'Calle Pedro A. Rivera No. 34, Sector Centro, La Vega',
    provincia: 'La Vega',
    rating: 4.5,
    mapsQuery: 'Farmacias Populares del Norte La Vega',
  },
  'NEXUS CONSULTING GROUP S.R.L.': {
    telefono: '(809) 683-1150',
    direccion: 'Av. Abraham Lincoln No. 1009, Torre Empresarial AIRD, Nivel 8, Distrito Nacional',
    provincia: 'Distrito Nacional',
    rating: 4.9,
    mapsQuery: 'Nexus Consulting Group Torre Empresarial AIRD Lincoln Santo Domingo',
  },
  'ECOPACKAGING DOMINICANA E.I.R.L.': {
    telefono: '(849) 880-9923',
    direccion: 'Av. San Vicente de Paúl No. 204, Alma Rosa I, Santo Domingo Este',
    provincia: 'Santo Domingo Este',
    rating: 4.7,
    mapsQuery: 'Ecopackaging Dominicana Alma Rosa Santo Domingo Este',
  },
  'CARIBE CAPITAL PARTNERS & FINTECH S.A.S.': {
    telefono: '(809) 566-2244',
    direccion: 'Torre Piantini Corporate, Nivel 8, Av. Gustavo Mejía Ricart, Piantini, Distrito Nacional',
    provincia: 'Distrito Nacional',
    rating: 4.9,
    mapsQuery: 'Piantini Corporate Gustavo Mejia Ricart Santo Domingo',
  },
};
