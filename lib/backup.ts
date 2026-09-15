import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { insertItem, listItems, updateItem } from '../db/items';
import type { Item } from '../db/types';
import { syncRemindersForItem } from './notifications';

const BACKUP_FORMAT_VERSION = 1;
const BACKUP_FILE_NAME = 'vali-backup.json';

export type BackupFile = {
  formatVersion: number;
  exportedAt: string;
  items: Item[];
};

export function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.formatVersion === 'number' &&
    Array.isArray(candidate.items) &&
    candidate.items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Item).item === 'string' &&
        typeof (item as Item).expiryDate === 'string'
    )
  );
}

export async function exportBackup(): Promise<void> {
  const items = await listItems();
  const backup: BackupFile = {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  };

  const file = new File(Paths.cache, BACKUP_FILE_NAME);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Compartilhamento não está disponível neste dispositivo.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Salvar backup do Vali',
    UTI: 'public.json',
  });
}

export async function pickAndParseBackup(): Promise<BackupFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (picked.canceled || !picked.assets || picked.assets.length === 0) return null;

  const pickedFile = new File(picked.assets[0].uri);
  const raw = await pickedFile.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido.');
  }

  if (!isBackupFile(parsed)) {
    throw new Error('Arquivo inválido: não é um backup do Vali reconhecível.');
  }

  return parsed;
}

export async function applyBackup(backup: BackupFile): Promise<{ imported: number; permissionDenied: boolean }> {
  let permissionDenied = false;
  for (const item of backup.items) {
    const created = await insertItem({
      item: item.item,
      expiryDate: item.expiryDate,
      store: item.store ?? undefined,
      photoUri: item.photoUri ?? undefined,
      quantity: item.quantity ?? undefined,
      brand: item.brand ?? undefined,
      note: item.note ?? undefined,
      alertEnabled: item.alertEnabled,
      reminderDaysBefore: item.reminderDaysBefore ?? undefined,
    });
    const withStatus = item.status === created.status ? created : await updateItem(created.id, { status: item.status });
    const { permissionDenied: denied } = await syncRemindersForItem(withStatus);
    if (denied) permissionDenied = true;
  }

  return { imported: backup.items.length, permissionDenied };
}
