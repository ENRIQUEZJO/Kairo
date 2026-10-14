/**
 * Utilidades para la generación precisa de enlaces a Google Maps
 * y limpieza de prefijos oficiales de registro de ONAPI.
 */

/**
 * Limpia prefijos como "REGISTRO NO. 345699", "REG. NO. 85744", "SOLICITUD NO. 12345"
 * y extrae el número de expediente oficial.
 */
export function limpiarNombreYRegistro(rawNombre: string): {
  nombreLimpio: string;
  registroExtraido?: string;
} {
  let nombre = (rawNombre || '').trim();
  let registroExtraido: string | undefined;

  // Caso 1: Inicia con REGISTRO NO. 345699, REG. NO. 12345, SOLICITUD NO. 12345, etc.
  const prefixMatch = nombre.match(
    /^(?:REGISTRO|REG|SOLICITUD|EXPEDIENTE|EXP)\.?\s*(?:N[ºo]?|NUMERO|NO\.)?\s*[:\-]?\s*([0-9\-\/]{3,14})\s*[:\-]?\s+(.+)$/i
  );
  if (prefixMatch) {
    registroExtraido = prefixMatch[1].trim();
    nombre = prefixMatch[2].trim();
  }

  // Caso 2: Inicia con REGISTRO 12345 o SOLICITUD 12345 sin "NO."
  const prefixDirect = nombre.match(
    /^(?:REGISTRO|SOLICITUD|EXPEDIENTE)\s*[:\-]?\s*([0-9\-\/]{3,14})\s*[:\-]?\s+(.+)$/i
  );
  if (prefixDirect) {
    if (!registroExtraido) registroExtraido = prefixDirect[1].trim();
    nombre = prefixDirect[2].trim();
  }

  // Caso 3: Inicia con "NO. 12345 EMPRESA..."
  const prefixNo = nombre.match(
    /^(?:N[ºo]?|NUMERO|NO\.)\s*[:\-]?\s*([0-9\-\/]{3,14})\s*[:\-]?\s+(.+)$/i
  );
  if (prefixNo) {
    if (!registroExtraido) registroExtraido = prefixNo[1].trim();
    nombre = prefixNo[2].trim();
  }

  // Limpieza final de signos de puntuación iniciales o finales
  nombre = nombre
    .replace(/^[\s\.\:\;\-\,\*#\(\)\/]+/, '')
    .replace(/[\s\.\:\;\-\,\*#\(\)\/]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    nombreLimpio: nombre || rawNombre,
    registroExtraido,
  };
}

/**
 * Genera un enlace a Google Maps que ubica la empresa o su dirección real en República Dominicana.
 * Remueve sufijos legales (S.A., S.R.L.) que confunden el algoritmo de búsqueda de Google Maps.
 */
export function generateGoogleMapsUrl(
  companyName: string,
  exactAddress?: string,
  provinceOrCity?: string
): string {
  const { nombreLimpio } = limpiarNombreYRegistro(companyName);

  // Nombre comercial sin sufijos societarios dominicanos (ej: "PASTEURIZADORA RICA" en vez de "PASTEURIZADORA RICA, S.A.")
  const nombreParaBusqueda = nombreLimpio
    .replace(/[,\.\-]/g, ' ')
    .replace(/\b(S\s*R\s*L|S\s*A\s*S|E\s*I\s*R\s*L|S\s*A|INC|LLC)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const queryParts: string[] = [];

  if (nombreParaBusqueda && nombreParaBusqueda.length > 2) {
    queryParts.push(nombreParaBusqueda);
  } else if (nombreLimpio) {
    queryParts.push(nombreLimpio);
  }

  // Si tiene dirección física exacta, la añadimos para asegurar el pin en Google Maps
  if (
    exactAddress &&
    exactAddress.length > 5 &&
    !exactAddress.toLowerCase().includes('no disponible')
  ) {
    queryParts.push(exactAddress);
  } else if (provinceOrCity && provinceOrCity.length > 2) {
    queryParts.push(provinceOrCity);
  }

  queryParts.push('República Dominicana');

  const query = queryParts.join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
