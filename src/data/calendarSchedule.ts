export interface BulletinRelease {
  id: string;
  entidad: 'ONAPI' | 'DGII' | 'CAMARA_COMERCIO';
  titulo: string;
  edicion: string;
  fechaPublicacion: string;
  horaAproximada: string;
  totalEmpresas: number;
  estado: 'publicado' | 'proximo' | 'programado';
  descripcion: string;
  enlaceOficial: string;
}

export interface EntityScheduleInfo {
  entidad: string;
  siglas: 'ONAPI' | 'DGII';
  nombreCompleto: string;
  frecuencia: string;
  diasPublicacion: string;
  horarioHabitual: string;
  tiempoProcesamiento: string;
  proximaFechaEstimada: string;
  diasRestantes: number;
  formatoArchivo: string;
  urlPortal: string;
  recomendacionScraping: string;
}

export const ENTITY_SCHEDULES: EntityScheduleInfo[] = [
  {
    entidad: 'Oficina Nacional de la Propiedad Industrial',
    siglas: 'ONAPI',
    nombreCompleto: 'Departamento de Signos Distintivos (Nombres Comerciales)',
    frecuencia: 'Quincenal (Bimensual)',
    diasPublicacion: 'Días 15 y 30 de cada mes (o siguiente día laborable)',
    horarioHabitual: 'Entre 10:00 AM y 2:00 PM',
    tiempoProcesamiento: 'Las empresas recién constituidas tienen hasta 45 días de vigencia de publicación legal',
    proximaFechaEstimada: '30 de Septiembre de 2026',
    diasRestantes: 2,
    formatoArchivo: 'Documento PDF Oficial (Boletín de Signos Distintivos)',
    urlPortal: 'https://onapi.gob.do',
    recomendacionScraping: 'Ejecutar el script extractor el día 16 y el día 1 de cada mes a partir de las 3:00 PM para capturar las empresas con 100% de frescura.',
  },
  {
    entidad: 'Dirección General de Impuestos Internos',
    siglas: 'DGII',
    nombreCompleto: 'Registro Nacional de Contribuyentes (RNC)',
    frecuencia: 'Diaria (Lunes a Viernes) y Cierre Mensual',
    diasPublicacion: 'Diario a las 02:00 AM (Altas nuevas) / Día 1 de cada mes (Padrón RNC)',
    horarioHabitual: 'Madrugadas (00:00 - 02:30 AM)',
    tiempoProcesamiento: 'Una empresa con nombre en ONAPI tarda de 3 a 5 días hábiles en tener RNC activo tras pasar por la Cámara de Comercio',
    proximaFechaEstimada: '29 de Septiembre de 2026 (02:00 AM)',
    diasRestantes: 1,
    formatoArchivo: 'Fichero masivo TXT / ZIP de RNC y Consulta Web en tiempo real',
    urlPortal: 'https://dgii.gov.do',
    recomendacionScraping: 'La asignación de RNC y tipo societario (SRL, SAS) se puede enriquecer 3 a 5 días después de que la empresa sale en el boletín de ONAPI.',
  },
];

export const RECENT_BULLETINS_HISTORY: BulletinRelease[] = [
  {
    id: 'bol-249',
    entidad: 'ONAPI',
    titulo: 'Boletín Oficial de Signos Distintivos Nº 249-26',
    edicion: 'Edición Ordinaria Nº 249',
    fechaPublicacion: '30/09/2026',
    horaAproximada: '11:30 AM',
    totalEmpresas: 340,
    estado: 'proximo',
    descripcion: 'Próxima edición programada para fin de mes. Contendrá solicitudes depositadas entre el 15 y el 29 de septiembre.',
    enlaceOficial: 'https://onapi.gob.do/index.php/publicaciones/boletines',
  },
  {
    id: 'bol-248',
    entidad: 'ONAPI',
    titulo: 'Boletín Oficial de Signos Distintivos Nº 248-26',
    edicion: 'Edición Ordinaria Nº 248',
    fechaPublicacion: '24/09/2026',
    horaAproximada: '12:15 PM',
    totalEmpresas: 285,
    estado: 'publicado',
    descripcion: 'Edición actual procesada en el sistema. Incluye empresas de Santo Domingo, Santiago, Punta Cana y La Vega.',
    enlaceOficial: 'https://onapi.gob.do/index.php/publicaciones/boletines',
  },
  {
    id: 'bol-247',
    entidad: 'ONAPI',
    titulo: 'Boletín Oficial de Signos Distintivos Nº 247-26',
    edicion: 'Edición Ordinaria Nº 247',
    fechaPublicacion: '15/09/2026',
    horaAproximada: '01:00 PM',
    totalEmpresas: 310,
    estado: 'publicado',
    descripcion: 'Publicación de mitad de mes con alta concentración de empresas turísticas e inmobiliarias.',
    enlaceOficial: 'https://onapi.gob.do/index.php/publicaciones/boletines',
  },
  {
    id: 'bol-dgii-sep',
    entidad: 'DGII',
    titulo: 'Actualización Nocturna del Padrón de RNC de la DGII',
    edicion: 'Sincronización Diaria Diurno/Nocturno',
    fechaPublicacion: '28/09/2026',
    horaAproximada: '02:05 AM',
    totalEmpresas: 1420,
    estado: 'publicado',
    descripcion: 'Actualización diaria de contribuyentes societarios y personas físicas con actividad comercial.',
    enlaceOficial: 'https://dgii.gov.do/herramientas/consultas/Paginas/rnc.aspx',
  },
];
