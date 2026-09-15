import { differenceInCalendarDays, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

export function reminderExceedsRemaining(expiryDate: string, reminderDaysBefore: number | null): boolean {
  if (reminderDaysBefore === null || !isValidExpiryDate(expiryDate)) return false;
  const remaining = daysUntil(expiryDate);
  return remaining >= 0 && reminderDaysBefore > remaining;
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

export function listStoreNames(records: Item[]): string[] {
  const names = records
    .map((record) => record.store?.trim())
    .filter((store): store is string => !!store);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export type StoreGroup = {
  store: string;
  items: Item[];
  urgentCount: number;
};

export function groupByStore(records: Item[]): StoreGroup[] {
  const groups = new Map<string, Item[]>();
  for (const record of records) {
    const store = record.store?.trim();
    if (!store) continue;
    const existing = groups.get(store);
    if (existing) existing.push(record);
    else groups.set(store, [record]);
  }
  return Array.from(groups.entries())
    .map(([store, items]) => ({
      store,
      items,
      urgentCount: items.filter((item) => item.status === 'Pendente' && daysUntil(item.expiryDate) <= 3).length,
    }))
    .sort((a, b) => a.store.localeCompare(b.store, 'pt-BR'));
}

export type Stats = {
  total: number;
  pendentes: number;
  resolvidos: number;
  retirados: number;
  trocados: number;
  vencidos: number;
  lojas: number;
  taxaResolvidosATempo: number | null;
};

export function computeStats(records: Item[]): Stats {
  const pendentes = records.filter((record) => record.status === 'Pendente').length;
  const resolvidos = records.filter((record) => record.status === 'Resolvido').length;
  const retirados = records.filter((record) => record.status === 'Retirado').length;
  const trocados = records.filter((record) => record.status === 'Trocado').length;
  const vencidos = records.filter((record) => record.status === 'Vencido').length;
  const concluidos = resolvidos + retirados + trocados;
  const finalizados = concluidos + vencidos;
  return {
    total: records.length,
    pendentes,
    resolvidos,
    retirados,
    trocados,
    vencidos,
    lojas: countDistinctStores(records),
    taxaResolvidosATempo: finalizados > 0 ? concluidos / finalizados : null,
  };
}

export function buildStoreShareText(store: string, pendingItems: Item[]): string {
  const today = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
  const header = `Itens pendentes — ${store} (${today})`;

  if (pendingItems.length === 0) {
    return `${header}\n\nNenhum item pendente nessa loja no momento.`;
  }

  const sorted = sortByUrgency(pendingItems);
  const lines = sorted.map(
    (item) => `• ${item.item} — vence ${item.expiryDate} (${urgencyLabel(daysUntil(item.expiryDate))})`
  );
  const footer = `${pendingItems.length} ${pendingItems.length === 1 ? 'item' : 'itens'} no total.`;
  return [header, '', ...lines, '', footer].join('\n');
}

export function filterByCriteria(records: Item[], filter: string | undefined): Item[] {
  return records.filter((record) => {
    const days = daysUntil(record.expiryDate);
    if (filter === 'Urgentes') return days <= 3;
    if (filter === 'Esta semana') return days <= 7;
    if (filter === 'Pendentes') return record.status === 'Pendente';
    if (filter === 'Historico') return record.status !== 'Pendente';
    return true;
  });
}
