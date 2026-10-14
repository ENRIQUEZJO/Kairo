export interface DynamicReleaseInfo {
  id: string;
  entidad: 'ONAPI' | 'DGII';
  titulo: string;
  edicion: string;
  fechaPublicacion: string;
  horaAproximada: string;
  totalEmpresasEstimadas: number;
  estado: 'publicado' | 'proximo' | 'programado';
  descripcion: string;
  diasRestantes: number;
  etiquetaCuentaRegresiva: string;
  enlaceOficial: string;
}

export interface DynamicScheduleSummary {
  proximaFechaTexto: string;
  proximaFechaCorta: string;
  diasRestantes: number;
  etiquetaCapsula: string;
  edicionProxima: number;
  proximaFechaDate: Date;
  historialYProximos: DynamicReleaseInfo[];
}

/**
 * Calcula automáticamente las fechas oficiales de publicación quincenal de ONAPI
 * (Días 15 y último día de cada mes a las 11:30 AM / 2:00 PM)
 */
export function obtenerCalendarioOnapiDinamico(ahora: Date = new Date()): DynamicScheduleSummary {
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth(); // 0-11
  const dia = ahora.getDate();

  // Último día del mes actual
  const ultimoDiaMesActual = new Date(anio, mes + 1, 0).getDate();

  let proximaFecha: Date;
  let proximoDiaNum: number;
  let proximoMesNum: number;
  let proximoAnioNum: number;

  if (dia < 15) {
    // Próxima es el día 15 de este mes
    proximoDiaNum = 15;
    proximoMesNum = mes;
    proximoAnioNum = anio;
  } else if (dia < ultimoDiaMesActual) {
    // Próxima es el último día de este mes
    proximoDiaNum = ultimoDiaMesActual;
    proximoMesNum = mes;
    proximoAnioNum = anio;
  } else {
    // Próxima es el 15 del siguiente mes
    proximoDiaNum = 15;
    proximoMesNum = mes === 11 ? 0 : mes + 1;
    proximoAnioNum = mes === 11 ? anio + 1 : anio;
  }

  proximaFecha = new Date(proximoAnioNum, proximoMesNum, proximoDiaNum, 11, 30, 0);

  // Calcular diferencia en días
  const diffMs = proximaFecha.getTime() - ahora.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let etiquetaCapsula = '';
  if (diasRestantes === 0) {
    etiquetaCapsula = '¡Hoy se publica!';
  } else if (diasRestantes === 1) {
    etiquetaCapsula = 'Mañana';
  } else {
    etiquetaCapsula = `En ${diasRestantes} días`;
  }

  // Nombres de meses en español
  const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mesesLargos = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const proximaFechaCorta = `${proximoDiaNum} ${mesesCortos[proximoMesNum]}`;
  const proximaFechaTexto = `${proximoDiaNum} de ${mesesLargos[proximoMesNum]} de ${proximoAnioNum}`;

  // Cálculo estimativo del número de edición oficial de ONAPI
  // Aproximadamente 24 ediciones por año
  const quincenaDelAnio = proximoMesNum * 2 + (proximoDiaNum === 15 ? 1 : 2);
  const edicionProxima = 230 + quincenaDelAnio;

  // Generar lista dinámica de eventos (pasados y futuros)
  const historialYProximos: DynamicReleaseInfo[] = [];

  // 1. Próximo boletín ONAPI
  historialYProximos.push({
    id: `bol-${edicionProxima}`,
    entidad: 'ONAPI',
    titulo: `Boletín Oficial de Signos Distintivos Nº ${edicionProxima}-${String(proximoAnioNum).slice(-2)}`,
    edicion: `Edición Ordinaria Nº ${edicionProxima}`,
    fechaPublicacion: `${String(proximoDiaNum).padStart(2, '0')}/${String(proximoMesNum + 1).padStart(2, '0')}/${proximoAnioNum}`,
    horaAproximada: '11:30 AM',
    totalEmpresasEstimadas: 320,
    estado: 'proximo',
    descripcion: `Próxima entrega oficial quincenal de ONAPI con nuevas empresas registradas en República Dominicana.`,
    diasRestantes,
    etiquetaCuentaRegresiva: etiquetaCapsula,
    enlaceOficial: 'https://onapi.gob.do/index.php/publicaciones/boletines',
  });

  // 2. Siguiente boletín programado
  let siguienteDiaNum = proximoDiaNum === 15 ? ultimoDiaMesActual : 15;
  let siguienteMesNum = proximoDiaNum === 15 ? proximoMesNum : (proximoMesNum === 11 ? 0 : proximoMesNum + 1);
  let siguienteAnioNum = proximoDiaNum === 15 ? proximoAnioNum : (proximoMesNum === 11 ? proximoAnioNum + 1 : proximoAnioNum);
  const siguienteFecha = new Date(siguienteAnioNum, siguienteMesNum, siguienteDiaNum, 11, 30);
  const diffSig = Math.max(0, Math.ceil((siguienteFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)));

  historialYProximos.push({
    id: `bol-${edicionProxima + 1}`,
    entidad: 'ONAPI',
    titulo: `Boletín Oficial de Signos Distintivos Nº ${edicionProxima + 1}-${String(siguienteAnioNum).slice(-2)}`,
    edicion: `Edición Ordinaria Nº ${edicionProxima + 1}`,
    fechaPublicacion: `${String(siguienteDiaNum).padStart(2, '0')}/${String(siguienteMesNum + 1).padStart(2, '0')}/${siguienteAnioNum}`,
    horaAproximada: '12:00 PM',
    totalEmpresasEstimadas: 340,
    estado: 'programado',
    descripcion: `Segunda tanda quincenal programada para recopilación y enriquecimiento comercial.`,
    diasRestantes: diffSig,
    etiquetaCuentaRegresiva: `En ${diffSig} días`,
    enlaceOficial: 'https://onapi.gob.do/index.php/publicaciones/boletines',
  });

  // 3. Sincronización diaria DGII RNC
  historialYProximos.push({
    id: 'bol-dgii-sync',
    entidad: 'DGII',
    titulo: 'Sincronización Nocturna del Padrón de RNC (DGII)',
    edicion: 'Padrón Oficial Contribuyentes Activos',
    fechaPublicacion: 'Diario (Lunes a Viernes)',
    horaAproximada: '02:00 AM',
    totalEmpresasEstimadas: 1250,
    estado: 'publicado',
    descripcion: 'Actualización diaria de altas tributarias y tipos societarios (S.R.L., S.A.S., E.I.R.L.).',
    diasRestantes: 0,
    etiquetaCuentaRegresiva: 'Hoy en la noche',
    enlaceOficial: 'https://dgii.gov.do/herramientas/consultas/Paginas/rnc.aspx',
  });

  return {
    proximaFechaTexto,
    proximaFechaCorta,
    diasRestantes,
    etiquetaCapsula,
    edicionProxima,
    proximaFechaDate: proximaFecha,
    historialYProximos,
  };
}
