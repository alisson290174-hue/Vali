import { parse } from 'date-fns';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { updateItem } from '../db/items';
import type { Item } from '../db/types';

export const REMINDER_CHANNEL_ID = 'lembretes';
const EARLY_REMINDER_HOUR = 9;
const FINAL_REMINDER_HOUR = 8;

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

function extractItemId(response: Notifications.NotificationResponse): string | null {
  const itemId = response.notification.request.content.data?.itemId;
  return typeof itemId === 'string' ? itemId : null;
}

export function useNotificationDeepLink(): void {
  const router = useRouter();

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
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
