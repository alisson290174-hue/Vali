import type { ItemStatus } from '../db/types';
import { colors } from './theme';

export const STATUS_META: Record<ItemStatus, { bg: string; text: string }> = {
  Pendente: { bg: colors.white, text: colors.muted },
  Resolvido: { bg: colors.oliveWash, text: colors.olive },
  Retirado: { bg: colors.plumWash, text: colors.plum },
  Trocado: { bg: colors.orangeWash, text: colors.orange },
  Vencido: { bg: colors.orange, text: colors.cream },
};
