import { CircleCheck, CircleX, Clock3, PackageCheck, RefreshCw } from 'lucide-react-native';
import type { ItemStatus } from '../db/types';

const STATUS_ICONS: Record<ItemStatus, typeof Clock3> = {
  Pendente: Clock3,
  Resolvido: CircleCheck,
  Retirado: PackageCheck,
  Trocado: RefreshCw,
  Vencido: CircleX,
};

export function StatusIcon({ status, size, color }: { status: ItemStatus; size: number; color: string }) {
  const Icon = STATUS_ICONS[status];
  return <Icon size={size} color={color} />;
}
