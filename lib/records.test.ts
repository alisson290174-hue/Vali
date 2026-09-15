import type { Item } from '../db/types';
import {
  buildStoreShareText,
  computeStats,
  countDistinctStores,
  daysUntil,
  filterByCriteria,
  formatDateDigits,
  groupByStore,
  isValidExpiryDate,
  listStoreNames,
  reminderExceedsRemaining,
  sortByUrgency,
  urgencyLabel,
} from './records';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    item: 'Item de teste',
    expiryDate: '20/09/2026',
    store: null,
    photoUri: null,
    quantity: null,
    brand: null,
    note: null,
    alertEnabled: false,
    status: 'Pendente',
    createdAt: '2026-09-15T00:00:00.000Z',
    reminderDaysBefore: null,
    earlyNotificationId: null,
    finalNotificationId: null,
    ...overrides,
  };
}

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-15T12:00:00'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('daysUntil', () => {
  it('conta dias positivos pra uma data futura', () => {
    expect(daysUntil('20/09/2026')).toBe(5);
  });

  it('conta dias negativos pra uma data passada', () => {
    expect(daysUntil('10/09/2026')).toBe(-5);
  });

  it('retorna 0 pra hoje', () => {
    expect(daysUntil('15/09/2026')).toBe(0);
  });
});

describe('urgencyLabel', () => {
  it('classifica 3 dias ou menos como Urgente', () => {
    expect(urgencyLabel(0)).toBe('Urgente');
    expect(urgencyLabel(3)).toBe('Urgente');
  });

  it('classifica entre 4 e 7 dias como Atenção', () => {
    expect(urgencyLabel(4)).toBe('Atenção');
    expect(urgencyLabel(7)).toBe('Atenção');
  });

  it('classifica mais de 7 dias como No prazo', () => {
    expect(urgencyLabel(8)).toBe('No prazo');
  });
});

describe('formatDateDigits', () => {
  it('monta dia/mes/ano conforme os digitos vão chegando', () => {
    expect(formatDateDigits('1', true)).toBe('1');
    expect(formatDateDigits('12', true)).toBe('12');
    expect(formatDateDigits('1209', true)).toBe('12/09');
  });

  it('expande ano de 2 digitos pra 20XX quando expandYear e true', () => {
    expect(formatDateDigits('120926', true)).toBe('12/09/2026');
  });

  it('nao expande o ano quando expandYear e false (apagando)', () => {
    expect(formatDateDigits('120926', false)).toBe('12/09/26');
  });

  it('nao mexe num ano ja com 4 digitos', () => {
    expect(formatDateDigits('12092026', false)).toBe('12/09/2026');
    expect(formatDateDigits('12092026', true)).toBe('12/09/2026');
  });

  it('retorna vazio sem digitos', () => {
    expect(formatDateDigits('', true)).toBe('');
  });
});

describe('isValidExpiryDate', () => {
  it('aceita uma data valida', () => {
    expect(isValidExpiryDate('15/09/2026')).toBe(true);
  });

  it('rejeita dia impossivel pro mes (31 de fevereiro)', () => {
    expect(isValidExpiryDate('31/02/2026')).toBe(false);
  });

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(isValidExpiryDate('29/02/2024')).toBe(true);
  });

  it('rejeita 29 de fevereiro fora de ano bissexto', () => {
    expect(isValidExpiryDate('29/02/2023')).toBe(false);
  });

  it('rejeita formato fora do padrao DD/MM/AAAA', () => {
    expect(isValidExpiryDate('2026-09-15')).toBe(false);
    expect(isValidExpiryDate('1/9/2026')).toBe(false);
    expect(isValidExpiryDate('')).toBe(false);
  });
});

describe('reminderExceedsRemaining', () => {
  it('acusa quando a antecedencia e maior que os dias restantes', () => {
    expect(reminderExceedsRemaining('20/09/2026', 10)).toBe(true);
  });

  it('nao acusa quando a antecedencia cabe nos dias restantes', () => {
    expect(reminderExceedsRemaining('20/09/2026', 5)).toBe(false);
  });

  it('nao acusa sem antecedencia definida', () => {
    expect(reminderExceedsRemaining('20/09/2026', null)).toBe(false);
  });

  it('nao acusa com data invalida', () => {
    expect(reminderExceedsRemaining('31/02/2026', 5)).toBe(false);
  });

  it('nao acusa quando o item ja venceu', () => {
    expect(reminderExceedsRemaining('10/09/2026', 5)).toBe(false);
  });
});

describe('sortByUrgency', () => {
  it('ordena por data mais proxima primeiro, sem alterar o array original', () => {
    const records = [
      makeItem({ id: 'a', expiryDate: '30/09/2026' }),
      makeItem({ id: 'b', expiryDate: '16/09/2026' }),
      makeItem({ id: 'c', expiryDate: '20/09/2026' }),
    ];
    const sorted = sortByUrgency(records);
    expect(sorted.map((item) => item.id)).toEqual(['b', 'c', 'a']);
    expect(records.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('countDistinctStores', () => {
  it('conta lojas distintas ignorando espacos e itens sem loja', () => {
    const records = [
      makeItem({ store: 'Mercado Central' }),
      makeItem({ store: ' Mercado Central ' }),
      makeItem({ store: 'Loja B' }),
      makeItem({ store: null }),
      makeItem({ store: '   ' }),
    ];
    expect(countDistinctStores(records)).toBe(2);
  });
});

describe('listStoreNames', () => {
  it('retorna nomes distintos, ordenados, sem itens sem loja', () => {
    const records = [
      makeItem({ store: 'Zeta Mercado' }),
      makeItem({ store: 'Alfa Center' }),
      makeItem({ store: 'Alfa Center' }),
      makeItem({ store: null }),
    ];
    expect(listStoreNames(records)).toEqual(['Alfa Center', 'Zeta Mercado']);
  });
});

describe('groupByStore', () => {
  it('agrupa itens por loja e conta urgentes so entre os Pendentes', () => {
    const records = [
      makeItem({ store: 'Loja A', expiryDate: '16/09/2026', status: 'Pendente' }), // urgente (1 dia)
      makeItem({ store: 'Loja A', expiryDate: '30/09/2026', status: 'Pendente' }), // nao urgente
      makeItem({ store: 'Loja A', expiryDate: '17/09/2026', status: 'Resolvido' }), // urgente mas resolvido, nao conta
      makeItem({ store: 'Loja B', expiryDate: '16/09/2026', status: 'Pendente' }),
      makeItem({ store: null }),
    ];
    const groups = groupByStore(records);
    expect(groups.map((group) => group.store)).toEqual(['Loja A', 'Loja B']);
    const lojaA = groups.find((group) => group.store === 'Loja A')!;
    expect(lojaA.items).toHaveLength(3);
    expect(lojaA.urgentCount).toBe(1);
  });
});

describe('computeStats', () => {
  it('conta cada status e calcula a taxa de itens tratados a tempo', () => {
    const records = [
      makeItem({ status: 'Pendente' }),
      makeItem({ status: 'Pendente' }),
      makeItem({ status: 'Resolvido' }),
      makeItem({ status: 'Retirado' }),
      makeItem({ status: 'Trocado' }),
      makeItem({ status: 'Vencido' }),
      makeItem({ store: 'Loja A' }),
      makeItem({ store: 'Loja B' }),
    ];
    const stats = computeStats(records);
    expect(stats.total).toBe(8);
    expect(stats.pendentes).toBe(4); // as duas primeiras + as duas com loja (status default Pendente)
    expect(stats.resolvidos).toBe(1);
    expect(stats.retirados).toBe(1);
    expect(stats.trocados).toBe(1);
    expect(stats.vencidos).toBe(1);
    expect(stats.lojas).toBe(2);
    // finalizados = 3 concluidos + 1 vencido = 4; taxa = 3/4
    expect(stats.taxaResolvidosATempo).toBeCloseTo(0.75);
  });

  it('retorna taxa nula quando nenhum item foi finalizado ainda', () => {
    const stats = computeStats([makeItem({ status: 'Pendente' })]);
    expect(stats.taxaResolvidosATempo).toBeNull();
  });

  it('lida com lista vazia', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.taxaResolvidosATempo).toBeNull();
  });
});

describe('buildStoreShareText', () => {
  it('lista os itens ordenados por urgencia, com data e rotulo de urgencia', () => {
    const items = [
      makeItem({ item: 'Item B', expiryDate: '30/09/2026' }),
      makeItem({ item: 'Item A', expiryDate: '16/09/2026' }),
    ];
    const text = buildStoreShareText('Loja X', items);
    expect(text).toContain('Itens pendentes — Loja X');
    expect(text).toContain('2 itens no total.');
    const indexA = text.indexOf('Item A');
    const indexB = text.indexOf('Item B');
    expect(indexA).toBeGreaterThan(-1);
    expect(indexB).toBeGreaterThan(indexA);
    expect(text).toContain('Item A — vence 16/09/2026 (Urgente)');
  });

  it('usa singular quando so tem 1 item', () => {
    const text = buildStoreShareText('Loja X', [makeItem({ item: 'Item Unico' })]);
    expect(text).toContain('1 item no total.');
  });

  it('avisa quando nao ha itens pendentes', () => {
    const text = buildStoreShareText('Loja X', []);
    expect(text).toContain('Nenhum item pendente nessa loja no momento.');
  });
});

describe('filterByCriteria', () => {
  const records = [
    makeItem({ id: 'urgente', expiryDate: '16/09/2026', status: 'Pendente' }),
    makeItem({ id: 'semana', expiryDate: '21/09/2026', status: 'Pendente' }),
    makeItem({ id: 'resolvido', expiryDate: '30/09/2026', status: 'Resolvido' }),
  ];

  it('filtra Urgentes por dias restantes', () => {
    expect(filterByCriteria(records, 'Urgentes').map((r) => r.id)).toEqual(['urgente']);
  });

  it('filtra Esta semana por dias restantes', () => {
    expect(filterByCriteria(records, 'Esta semana').map((r) => r.id)).toEqual(['urgente', 'semana']);
  });

  it('filtra Pendentes por status', () => {
    expect(filterByCriteria(records, 'Pendentes').map((r) => r.id)).toEqual(['urgente', 'semana']);
  });

  it('filtra Historico por status diferente de Pendente', () => {
    expect(filterByCriteria(records, 'Historico').map((r) => r.id)).toEqual(['resolvido']);
  });

  it('sem filtro retorna tudo', () => {
    expect(filterByCriteria(records, undefined)).toHaveLength(3);
  });
});
