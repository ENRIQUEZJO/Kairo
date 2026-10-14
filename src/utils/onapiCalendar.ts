/**
 * Utilidades para el cálculo automático y en tiempo real del
 * Calendario de Publicaciones Oficiales de ONAPI y la DGII en República Dominicana.
 *
 * En la República Dominicana, ONAPI publica los Boletines Oficiales
 * de Propiedad Industrial de forma quincenal:
 * - 1ª Quincena: Día 15 de cada mes a las 11:30 AM
 * - 2ª Quincena: Día 30 (o último día del mes) a las 11:30 AM
 */

export interface OnapiPublicationInfo {
  targetDate: Date;
  dayMonthStr: string;
  fullDateStr: string;
  daysRemaining: number;
  badge: string;
  isToday: boolean;
  isTomorrow: boolean;
  editionEstimated: number;
  quincena: '1ra' | '2da';
}

export function getNextOnapiPublication(refDate: Date = new Date()): OnapiPublicationInfo {
  const now = refDate;
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const hours = now.getHours();

  let targetDate: Date;
  let quincena: '1ra' | '2da' = '1ra';

  // Último día hábil del mes actual (30 o 31, o 28/29 en feb)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const targetEndOfMonth = Math.min(30, lastDayOfMonth);

  if (day < 15) {
    targetDate = new Date(year, month, 15, 11, 30, 0);
    quincena = '1ra';
  } else if (day === 15 && hours < 18) {
    targetDate = new Date(year, month, 15, 11, 30, 0);
    quincena = '1ra';
  } else if (day < targetEndOfMonth) {
    targetDate = new Date(year, month, targetEndOfMonth, 11, 30, 0);
    quincena = '2da';
  } else if (day === targetEndOfMonth && hours < 18) {
    targetDate = new Date(year, month, targetEndOfMonth, 11, 30, 0);
    quincena = '2da';
  } else {
    // Siguiente mes, día 15
    targetDate = new Date(year, month + 1, 15, 11, 30, 0);
    quincena = '1ra';
  }

  // Comprobar si es hoy o mañana en hora local
  const isToday =
    now.getFullYear() === targetDate.getFullYear() &&
    now.getMonth() === targetDate.getMonth() &&
    now.getDate() === targetDate.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    tomorrow.getFullYear() === targetDate.getFullYear() &&
    tomorrow.getMonth() === targetDate.getMonth() &&
    tomorrow.getDate() === targetDate.getDate();

  const diffMs = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let badge = '';
  if (isToday) {
    badge = '¡Hoy!';
  } else if (isTomorrow || daysRemaining === 1) {
    badge = 'Mañana';
  } else {
    badge = `En ${daysRemaining} días`;
  }

  const dayMonthStr = targetDate.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
  });

  const fullDateStr = targetDate.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Cálculo de edición quincenal continua
  const baseYear = 2026;
  const baseEdition = 240;
  const monthDiff = (targetDate.getFullYear() - baseYear) * 12 + targetDate.getMonth();
  const editionEstimated = baseEdition + monthDiff * 2 + (quincena === '2da' ? 1 : 0);

  return {
    targetDate,
    dayMonthStr: dayMonthStr.charAt(0).toUpperCase() + dayMonthStr.slice(1).replace('.', ''),
    fullDateStr,
    daysRemaining,
    badge,
    isToday,
    isTomorrow,
    editionEstimated,
    quincena,
  };
}

export interface UpcomingBulletinItem {
  id: string;
  dateStr: string;
  edition: string;
  time: string;
  badge: string;
  status: 'próximo' | 'programado';
  description: string;
}

export function getUpcomingBulletins(refDate: Date = new Date(), count: number = 4): UpcomingBulletinItem[] {
  const list: UpcomingBulletinItem[] = [];
  let currentRef = new Date(refDate);

  for (let i = 0; i < count; i++) {
    const pub = getNextOnapiPublication(currentRef);
    const dateFormatted = pub.targetDate.toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    list.push({
      id: `bulletin-${pub.targetDate.getTime()}`,
      dateStr: dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1),
      edition: `Edición Nº ${pub.editionEstimated} (${pub.quincena} Quincena)`,
      time: '11:30 AM (Hora Oficial Santo Domingo)',
      badge: pub.badge,
      status: i === 0 ? 'próximo' : 'programado',
      description: `Publicación oficial de Nombres Comerciales, S.R.L., S.A.S. y registro societario en ONAPI.`,
    });

    // Mover 16 días adelante para la siguiente quincena
    currentRef = new Date(pub.targetDate);
    currentRef.setDate(currentRef.getDate() + 16);
  }

  return list;
}
