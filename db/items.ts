import { getDatabase } from './database';
import type { Item, NewItemInput } from './types';

type ItemRow = {
  id: string;
  item: string;
  expiryDate: string;
  store: string | null;
  photoUri: string | null;
  quantity: string | null;
  brand: string | null;
  note: string | null;
  alertEnabled: number;
  status: Item['status'];
  createdAt: string;
};

function mapRow(row: ItemRow): Item {
  return { ...row, alertEnabled: row.alertEnabled === 1 };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listItems(): Promise<Item[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY expiryDate ASC');
  return rows.map(mapRow);
}

export async function insertItem(input: NewItemInput): Promise<Item> {
  const db = await getDatabase();
  const row: ItemRow = {
    id: generateId(),
    item: input.item,
    expiryDate: input.expiryDate,
    store: input.store ?? null,
    photoUri: input.photoUri ?? null,
    quantity: input.quantity ?? null,
    brand: input.brand ?? null,
    note: input.note ?? null,
    alertEnabled: input.alertEnabled ? 1 : 0,
    status: 'Pendente',
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO items (id, item, expiryDate, store, photoUri, quantity, brand, note, alertEnabled, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.item,
      row.expiryDate,
      row.store,
      row.photoUri,
      row.quantity,
      row.brand,
      row.note,
      row.alertEnabled,
      row.status,
      row.createdAt,
    ]
  );
  return mapRow(row);
}

const SEED_ITEMS: NewItemInput[] = [
  { item: 'Leite integral 1L', expiryDate: '14/09/2026', store: 'Supermercado Central', quantity: '08 un.' },
  { item: 'Biscoito recheado', expiryDate: '18/09/2026', store: 'Mercado do Bairro', quantity: '12 un.' },
  { item: 'Suco de uva 1L', expiryDate: '29/09/2026', store: 'Supermercado Central', quantity: '05 un.' },
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await listItems();
  if (existing.length > 0) return;
  for (const seed of SEED_ITEMS) {
    await insertItem(seed);
  }
}
