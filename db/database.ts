import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'vali.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAndMigrate();
  }
  return dbPromise;
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
  return db;
}
