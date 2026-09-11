import { differenceInCalendarDays, parse } from 'date-fns';
import type { Item } from '../db/types';

export function daysUntil(expiryDate: string): number {
  const parsed = parse(expiryDate, 'dd/MM/yyyy', new Date());
  return differenceInCalendarDays(parsed, new Date());
}

export function urgencyLabel(days: number): string {
  if (days <= 3) return 'Urgente';
  if (days <= 7) return 'Atenção';
  return 'No prazo';
}

/**
 * Formata dígitos brutos de data como DD/MM/AAAA. `expandYear` só deve ser `true`
 * quando o usuário está digitando pra frente (adicionando dígitos) — nesse caso,
 * um ano de 2 dígitos vira 20XX assim que completa. Ao apagar (editando uma data
 * já existente), passar `false` evita reinterpretar os 2 dígitos restantes do ano
 * como se fossem um ano novo sendo digitado.
 */
export function formatDateDigits(digits: string, expandYear: boolean): string {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const yearDigits = digits.slice(4, 8);
  const year = expandYear && yearDigits.length === 2 ? `20${yearDigits}` : yearDigits;
  return [day, month, year].filter(Boolean).join('/');
}

export function isValidExpiryDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function sortByUrgency(records: Item[]): Item[] {
  return [...records].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
}

export function countDistinctStores(records: Item[]): number {
  const stores = records
    .map((record) => record.store?.trim())
    .filter((store): store is string => !!store);
  return new Set(stores).size;
}

export function filterByCriteria(records: Item[], filter: string | undefined): Item[] {
  return records.filter((record) => {
    const days = daysUntil(record.expiryDate);
    if (filter === 'Urgentes') return days <= 3;
    if (filter === 'Esta semana') return days <= 7;
    if (filter === 'Pendentes') return record.status === 'Pendente';
    return true;
  });
}
