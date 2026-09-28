export const SECTORES_EMPRESARIALES_RD: {
  id: string;
  nombre: string;
  icon: string;
  keywords: string[];
}[] = [
  {
    id: 'financiero',
    nombre: 'Sector Financiero, Inversiones & FinTech',
    icon: '💳',
    keywords: [
      'financ',
      'banc',
      'credit',
      'prestam',
      'inversio',
      'fondo de inversi',
      'capital privado',
      'segur',
      'poliz',
      'fintech',
      'remes',
      'divisas',
      'bolsa',
      'fideicomis',
      'factoring',
      'leasing',
      'cooperativ',
      'patrimon',
      'valores',
    ],
  },
  {
    id: 'construccion',
    nombre: 'Construcción & Obras Civiles',
    icon: '🏗️',
    keywords: ['construcc', 'obras', 'edific', 'ingenier', 'remodel', 'arquitect', 'inmueble', 'tierra', 'vivienda'],
  },
  {
    id: 'tecnologia',
    nombre: 'Tecnología & Software',
    icon: '💻',
    keywords: ['softw', 'cloud', 'tecnolog', 'sistemas', 'ciber', 'digital', 'comput', 'informatic', 'app', 'web', 'plataforma'],
  },
  {
    id: 'salud',
    nombre: 'Salud & Servicios Médicos',
    icon: '🏥',
    keywords: ['medic', 'salud', 'clinic', 'laborat', 'farmac', 'dental', 'quirurg', 'ambulator', 'hospital', 'diagnost'],
  },
  {
    id: 'transporte',
    nombre: 'Transporte & Logística',
    icon: '🚚',
    keywords: ['transp', 'logistic', 'frio', 'carga', 'distribuc', 'flete', 'almacen', 'aduan', 'vehicul', 'envio'],
  },
  {
    id: 'inmobiliaria',
    nombre: 'Inmobiliaria & Turismo',
    icon: '🏖️',
    keywords: ['turism', 'hotel', 'resort', 'villas', 'vacacional', 'inmobil', 'hosped', 'playa', 'bienes raices', 'concierge'],
  },
  {
    id: 'alimentos',
    nombre: 'Alimentos & Gastronomía',
    icon: '🍷',
    keywords: ['aliment', 'gourmet', 'restaur', 'bebida', 'vino', 'queso', 'panader', 'embutid', 'comida', 'snack', 'cafe'],
  },
  {
    id: 'energia',
    nombre: 'Energía Renovable',
    icon: '⚡',
    keywords: ['solar', 'energi', 'fotovolt', 'electr', 'renovab', 'bateri', 'panel', 'potencia', 'eolic'],
  },
  {
    id: 'legal_fiscal',
    nombre: 'Consultoría, Legal & Fiscal',
    icon: '⚖️',
    keywords: ['consult', 'asesor', 'fiscal', 'auditor', 'legal', 'abogad', 'contabl', 'tributar', 'corporativ'],
  },
  {
    id: 'comercio',
    nombre: 'Comercio, Importación & Retail',
    icon: '🛒',
    keywords: ['comerc', 'import', 'export', 'venta', 'tienda', 'distribuid', 'compra', 'mayor', 'detalle'],
  },
];

/**
 * Deduce el sector empresarial automáticamente según la descripción de actividad de ONAPI
 */
export function clasificarActividadEmpresarial(descripcionActividad: string): string {
  if (!descripcionActividad) return 'Comercio, Importación & Retail';

  const texto = descripcionActividad.toLowerCase();

  for (const sector of SECTORES_EMPRESARIALES_RD) {
    if (sector.keywords.some((kw) => texto.includes(kw))) {
      return sector.nombre;
    }
  }

  return 'Comercio, Importación & Retail';
}
