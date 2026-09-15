import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpiryRow } from '../components/ExpiryRow';
import { listItems } from '../db/items';
import type { Item } from '../db/types';
import { filterByCriteria, sortByUrgency } from '../lib/records';
import { colors } from '../lib/theme';

export default function AllItemsScreen() {
  const { filter, store } = useLocalSearchParams<{ filter?: string; store?: string }>();
  const navigation = useNavigation();
  const [records, setRecords] = useState<Item[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: store ? store : filter === 'Historico' ? 'Histórico' : 'Todos os itens' });
  }, [navigation, filter, store]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items) => {
        if (isMounted) setRecords(items);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    const items = await listItems();
    setRecords(items);
    setIsRefreshing(false);
  }

  const byStore = store ? records.filter((record) => record.store?.trim() === store) : records;
  const sorted = sortByUrgency(filterByCriteria(byStore, filter));

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(record) => record.id}
        renderItem={({ item }) => <ExpiryRow record={item} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.plum} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {store
              ? 'Nenhum item dessa loja encontrado.'
              : filter === 'Historico'
                ? 'Nenhum item no histórico ainda.'
                : 'Nenhum item encontrado.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25 },
});
