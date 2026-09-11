import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Store } from 'lucide-react-native';
import type { Item } from '../db/types';
import { colors } from '../lib/theme';
import { daysUntil, urgencyLabel } from '../lib/records';
import { STATUS_META } from '../lib/status';
import { StatusIcon } from './StatusIcon';

export function ExpiryRow({ record }: { record: Item }) {
  const router = useRouter();
  const days = daysUntil(record.expiryDate);
  const isUrgent = days <= 3;
  const statusMeta = STATUS_META[record.status];
  return (
    <Pressable style={styles.recordRow} onPress={() => router.push(`/item/${record.id}`)}>
      <View style={[styles.recordImage, isUrgent && styles.recordImageUrgent]}>
        {record.photoUri ? (
          <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} />
        ) : (
          <Text style={styles.recordImageText}>{record.item.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.recordMain}>
        <Text style={styles.recordName} numberOfLines={1}>{record.item}</Text>
        <View style={styles.storeLine}>
          <Store size={13} color={colors.muted} />
          <Text style={styles.storeText} numberOfLines={1}>{record.store ?? 'Sem loja definida'}</Text>
        </View>
        <Text style={styles.recordQuantity}>{record.quantity ?? 'Não informado'}</Text>
        {record.status !== 'Pendente' && (
          <View style={[styles.statusTag, { backgroundColor: statusMeta.bg }]}>
            <StatusIcon status={record.status} size={11} color={statusMeta.text} />
            <Text style={[styles.statusTagText, { color: statusMeta.text }]}>{record.status}</Text>
          </View>
        )}
      </View>
      <View style={styles.recordRight}>
        <View style={[styles.statusPill, isUrgent ? styles.statusUrgent : styles.statusNormal]}>
          <Text style={[styles.statusText, isUrgent && styles.statusTextUrgent]}>{urgencyLabel(days)}</Text>
        </View>
        <Text style={styles.recordDate}>{record.expiryDate}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recordRow: { backgroundColor: colors.white, borderRadius: 17, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  recordImage: { width: 52, height: 58, borderRadius: 13, backgroundColor: colors.oliveWash, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  recordImageUrgent: { backgroundColor: colors.orangeWash },
  recordImageText: { color: colors.olive, fontSize: 21, fontWeight: '700' },
  recordPhoto: { width: '100%', height: '100%' },
  recordMain: { flex: 1, minWidth: 0 },
  recordName: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 5 },
  storeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 7 },
  storeText: { color: colors.muted, fontSize: 11, flexShrink: 1 },
  recordQuantity: { color: colors.olive, fontSize: 11, fontWeight: '700' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  recordRight: { alignItems: 'flex-end', marginLeft: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginBottom: 8 },
  statusUrgent: { backgroundColor: colors.orangeWash },
  statusNormal: { backgroundColor: colors.oliveWash },
  statusText: { color: colors.olive, fontSize: 10, fontWeight: '700' },
  statusTextUrgent: { color: colors.orange },
  recordDate: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25 },
});
