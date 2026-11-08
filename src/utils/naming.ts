/**
 * Generates the raffle identifier according to the exact specification:
 * "las primeras tres letras del dia, guión, el numero de dia, guion, el numero de mes,
 * guion, el numero de año de dos digitos, seguido de un correlativo de cuatro dígitos
 * para identificar cada sorteo único."
 * 
 * Example: SAB-07-11-26-0001
 */

const DAYS_ES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

export function generateRaffleName(correlative: number, date: Date = new Date()): string {
  const dayName = DAYS_ES[date.getDay()];
  const dayNumber = String(date.getDate()).padStart(2, '0');
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
  const yearTwoDigits = String(date.getFullYear()).slice(-2);
  const correlativeStr = String(correlative).padStart(4, '0');

  return `${dayName}-${dayNumber}-${monthNumber}-${yearTwoDigits}-${correlativeStr}`;
}
