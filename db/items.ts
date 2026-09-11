import { getDatabase } from './database';
import type { Item, ItemStatus, NewItemInput } from './types';

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
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY createdAt DESC');
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

async function getItemById(id: string): Promise<Item | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function updateItem(
  id: string,
  patch: Partial<NewItemInput> & { status?: ItemStatus }
): Promise<Item> {
  const db = await getDatabase();
  const existing = await getItemById(id);
  if (!existing) throw new Error(`Item ${id} não encontrado`);

  const updated: Item = {
    ...existing,
    item: patch.item ?? existing.item,
    expiryDate: patch.expiryDate ?? existing.expiryDate,
    store: patch.store !== undefined ? patch.store ?? null : existing.store,
    photoUri: patch.photoUri !== undefined ? patch.photoUri ?? null : existing.photoUri,
    quantity: patch.quantity !== undefined ? patch.quantity ?? null : existing.quantity,
    brand: patch.brand !== undefined ? patch.brand ?? null : existing.brand,
    note: patch.note !== undefined ? patch.note ?? null : existing.note,
    alertEnabled: patch.alertEnabled ?? existing.alertEnabled,
    status: patch.status ?? existing.status,
  };

  await db.runAsync(
    `UPDATE items SET item = ?, expiryDate = ?, store = ?, photoUri = ?, quantity = ?, brand = ?, note = ?, alertEnabled = ?, status = ?
     WHERE id = ?`,
    [
      updated.item,
      updated.expiryDate,
      updated.store,
      updated.photoUri,
      updated.quantity,
      updated.brand,
      updated.note,
      updated.alertEnabled ? 1 : 0,
      updated.status,
      id,
    ]
  );
  return updated;
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
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
