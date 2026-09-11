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

export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
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
