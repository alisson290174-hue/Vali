import { parse } from 'date-fns';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { updateItem } from '../db/items';
import { getSetting, setSetting } from '../db/settings';
import type { Item } from '../db/types';
import { daysUntil } from './records';

export const REMINDER_CHANNEL_ID = 'lembretes';
const EARLY_REMINDER_HOUR = 9;
const FINAL_REMINDER_HOUR = 8;
const DAILY_SUMMARY_HOUR = 7;
const DAILY_SUMMARY_MINUTE = 30;
const DAILY_SUMMARY_ENABLED_KEY = 'dailySummaryEnabled';
const DAILY_SUMMARY_NOTIFICATION_ID_KEY = 'dailySummaryNotificationId';

let hasConfiguredHandler = false;

export function configureNotificationHandler(): void {
  if (hasConfiguredHandler) return;
  hasConfiguredHandler = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Lembretes de validade',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseExpiryDate(expiryDate: string): Date {
  return parse(expiryDate, 'dd/MM/yyyy', new Date());
}

function buildTriggerDate(expiryDate: string, daysBefore: number, hour: number): Date {
  const trigger = parseExpiryDate(expiryDate);
  trigger.setDate(trigger.getDate() - daysBefore);
  trigger.setHours(hour, 0, 0, 0);
  return trigger;
}

async function scheduleAt(item: Item, triggerDate: Date, title: string, body: string): Promise<string | null> {
  if (triggerDate.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { itemId: item.id },
      sound: 'default',
    },
    trigger:
      Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: REMINDER_CHANNEL_ID }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

export function scheduleEarlyReminder(item: Item): Promise<string | null> {
  if (!item.reminderDaysBefore) return Promise.resolve(null);
  const triggerDate = buildTriggerDate(item.expiryDate, item.reminderDaysBefore, EARLY_REMINDER_HOUR);
  const days = item.reminderDaysBefore;
  return scheduleAt(
    item,
    triggerDate,
    `${item.item} vence em ${days} ${days === 1 ? 'dia' : 'dias'}`,
    item.store ? `Loja: ${item.store}. Toque para ver os detalhes.` : 'Toque para ver os detalhes.'
  );
}

export function scheduleFinalReminder(item: Item): Promise<string | null> {
  const triggerDate = buildTriggerDate(item.expiryDate, 0, FINAL_REMINDER_HOUR);
  return scheduleAt(
    item,
    triggerDate,
    `${item.item} vence hoje`,
    item.store ? `Loja: ${item.store}. Toque para ver os detalhes.` : 'Toque para ver os detalhes.'
  );
}

export type UpcomingReminder = { date: Date; kind: 'early' | 'final' };

export function getNextReminder(item: Item): UpcomingReminder | null {
  const candidates: UpcomingReminder[] = [];

  if (item.reminderDaysBefore) {
    const early = buildTriggerDate(item.expiryDate, item.reminderDaysBefore, EARLY_REMINDER_HOUR);
    if (early.getTime() > Date.now()) candidates.push({ date: early, kind: 'early' });
  }

  const final = buildTriggerDate(item.expiryDate, 0, FINAL_REMINDER_HOUR);
  if (final.getTime() > Date.now()) candidates.push({ date: final, kind: 'final' });

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // já disparada/cancelada — nada a fazer
  }
}

export async function syncRemindersForItem(item: Item): Promise<{ item: Item; permissionDenied: boolean }> {
  await cancelReminder(item.earlyNotificationId);
  await cancelReminder(item.finalNotificationId);

  if (!item.alertEnabled) {
    const updated = await updateItem(item.id, { earlyNotificationId: null, finalNotificationId: null });
    return { item: updated, permissionDenied: false };
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    const updated = await updateItem(item.id, { earlyNotificationId: null, finalNotificationId: null });
    return { item: updated, permissionDenied: true };
  }

  const [earlyNotificationId, finalNotificationId] = await Promise.all([
    scheduleEarlyReminder(item),
    scheduleFinalReminder(item),
  ]);
  const updated = await updateItem(item.id, { earlyNotificationId, finalNotificationId });
  return { item: updated, permissionDenied: false };
}

export async function isDailySummaryEnabled(): Promise<boolean> {
  return (await getSetting(DAILY_SUMMARY_ENABLED_KEY)) === '1';
}

async function scheduleDailySummary(count: number): Promise<string | null> {
  if (count === 0) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: count === 1 ? 'Você tem 1 item vencendo essa semana' : `Você tem ${count} itens vencendo essa semana`,
      body: 'Toque para ver a lista no Vali.',
      data: { type: 'dailySummary' },
      sound: 'default',
    },
    trigger:
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: DAILY_SUMMARY_HOUR,
            minute: DAILY_SUMMARY_MINUTE,
            channelId: REMINDER_CHANNEL_ID,
          }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: DAILY_SUMMARY_HOUR, minute: DAILY_SUMMARY_MINUTE },
  });
}

// Reagenda o resumo diário com a contagem atual de itens pendentes vencendo
// essa semana. Chamado toda vez que a home carrega, pra manter o número
// razoavelmente atualizado sem precisar de um processo em segundo plano
// (que o app não tem) — a contagem reflete o estado na última vez que o
// app foi aberto, não em tempo real o dia inteiro.
export async function syncDailySummary(items: Item[]): Promise<{ permissionDenied: boolean }> {
  const enabled = await isDailySummaryEnabled();
  const previousId = await getSetting(DAILY_SUMMARY_NOTIFICATION_ID_KEY);
  await cancelReminder(previousId);

  if (!enabled) {
    return { permissionDenied: false };
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await setSetting(DAILY_SUMMARY_NOTIFICATION_ID_KEY, '');
    return { permissionDenied: true };
  }

  const count = items.filter((item) => item.status === 'Pendente' && daysUntil(item.expiryDate) <= 7).length;
  const id = await scheduleDailySummary(count);
  await setSetting(DAILY_SUMMARY_NOTIFICATION_ID_KEY, id ?? '');
  return { permissionDenied: false };
}

export async function setDailySummaryEnabled(enabled: boolean, items: Item[]): Promise<{ permissionDenied: boolean }> {
  await setSetting(DAILY_SUMMARY_ENABLED_KEY, enabled ? '1' : '0');
  return syncDailySummary(items);
}

function extractItemId(response: Notifications.NotificationResponse): string | null {
  const itemId = response.notification.request.content.data?.itemId;
  return typeof itemId === 'string' ? itemId : null;
}

export function useNotificationDeepLink(): void {
  const router = useRouter();

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
      if (response.notification.request.content.data?.type === 'dailySummary') {
        router.push('/all-items?filter=Esta semana');
        return;
      }
      const itemId = extractItemId(response);
      if (itemId) router.push(`/item/${itemId}`);
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [router]);
}
