import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Store } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listItems } from '../db/items';
import type { Item } from '../db/types';
import { groupByStore, type StoreGroup } from '../lib/records';
import { colors } from '../lib/theme';

export default function StoresScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<StoreGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items: Item[]) => {
        if (isMounted) setGroups(groupByStore(items));
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    const items = await listItems();
    setGroups(groupByStore(items));
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.store}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.plum} />}
        renderItem={({ item: group }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/all-items', params: { store: group.store } })}
            accessibilityRole="button"
            accessibilityLabel={`${group.store}. ${group.items.length} ${group.items.length === 1 ? 'item' : 'itens'}${
              group.urgentCount > 0 ? `, ${group.urgentCount} urgente${group.urgentCount === 1 ? '' : 's'}` : ''
            }. Toque para ver os itens dessa loja.`}
          >
            <View style={styles.rowIcon}>
              <Store size={18} color={colors.plum} />
            </View>
            <View style={styles.rowMain}>
              <Text style={styles.rowName} numberOfLines={1}>{group.store}</Text>
              <Text style={styles.rowCount}>
                {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>
            {group.urgentCount > 0 && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>{group.urgentCount}</Text>
              </View>
            )}
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma loja cadastrada ainda. Informe a loja ao cadastrar um item.</Text>
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
  rowCount: { color: colors.muted, fontSize: 12 },
  urgentBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.orangeWash, justifyContent: 'center', alignItems: 'center' },
  urgentBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '700' },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25, lineHeight: 20 },
});
