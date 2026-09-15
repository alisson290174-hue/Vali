import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'vali.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAndMigrate();
  }
  return dbPromise;
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const existingColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  const hasColumn = existingColumns.some((col) => col.name === column);
  if (!hasColumn) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

async function openDatabaseAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      item TEXT NOT NULL,
      expiryDate TEXT NOT NULL,
      store TEXT,
      photoUri TEXT,
      quantity TEXT,
      brand TEXT,
      note TEXT,
      alertEnabled INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pendente',
      createdAt TEXT NOT NULL
    );
  `);
  await ensureColumn(db, 'items', 'reminderDaysBefore', 'INTEGER');
  await ensureColumn(db, 'items', 'earlyNotificationId', 'TEXT');
  await ensureColumn(db, 'items', 'finalNotificationId', 'TEXT');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
  return db;
}
