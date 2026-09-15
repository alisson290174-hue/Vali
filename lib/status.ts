import type { ItemStatus } from '../db/types';
import type { ThemeColors } from './theme';

export function statusMeta(colors: ThemeColors): Record<ItemStatus, { bg: string; text: string }> {
  return {
    Pendente: { bg: colors.white, text: colors.muted },
    Resolvido: { bg: colors.oliveWash, text: colors.olive },
    Retirado: { bg: colors.plumWash, text: colors.plum },
    Trocado: { bg: colors.orangeWash, text: colors.orange },
    Vencido: { bg: colors.orange, text: colors.cream },
  };
}
