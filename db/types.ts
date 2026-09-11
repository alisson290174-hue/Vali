export type ItemStatus = 'Pendente' | 'Resolvido' | 'Retirado' | 'Trocado' | 'Vencido';

export type Item = {
  id: string;
  item: string;
  expiryDate: string;
  store: string | null;
  photoUri: string | null;
  quantity: string | null;
  brand: string | null;
  note: string | null;
  alertEnabled: boolean;
  status: ItemStatus;
  createdAt: string;
  reminderDaysBefore: number | null;
  earlyNotificationId: string | null;
  finalNotificationId: string | null;
};

export type NewItemInput = {
  item: string;
  expiryDate: string;
  store?: string;
  photoUri?: string;
  quantity?: string;
  brand?: string;
  note?: string;
  alertEnabled?: boolean;
  reminderDaysBefore?: number | null;
  earlyNotificationId?: string | null;
  finalNotificationId?: string | null;
};
