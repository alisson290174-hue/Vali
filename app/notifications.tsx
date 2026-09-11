import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronRight, Clock3 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listItems } from '../db/items';
import type { Item } from '../db/types';
import { getNextReminder } from '../lib/notifications';
import { colors } from '../lib/theme';

type ReminderRow = {
  item: Item;
  date: Date | null;
  kind: 'early' | 'final' | null;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ReminderRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items) => {
        if (!isMounted) return;
        const withAlert = items.filter((item) => item.alertEnabled);
        const withReminders = withAlert.map((item) => {
          const next = getNextReminder(item);
          return { item, date: next?.date ?? null, kind: next?.kind ?? null };
        });
        withReminders.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.getTime() - b.date.getTime();
        });
        setRows(withReminders);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item: row }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/item/${row.item.id}`)}>
            <View style={styles.rowIcon}>
              <Bell size={18} color={colors.plum} />
            </View>
            <View style={styles.rowMain}>
              <Text style={styles.rowName} numberOfLines={1}>{row.item.item}</Text>
              {row.date ? (
                <View style={styles.rowDateLine}>
                  <Clock3 size={12} color={colors.muted} />
                  <Text style={styles.rowDate}>
                    {row.kind === 'final' ? 'Último aviso' : 'Aviso antecipado'}: {format(row.date, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                </View>
              ) : (
                <Text style={styles.rowDate}>Nenhum lembrete futuro agendado</Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum item com alerta ligado ainda. Ative o alerta ao cadastrar ou editar um item.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  row: { backgroundColor: colors.white, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.plumWash, justifyContent: 'center', alignItems: 'center' },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rowDateLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowDate: { color: colors.muted, fontSize: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25, lineHeight: 20 },
});
