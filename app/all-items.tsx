import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Search, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpiryRow } from '../components/ExpiryRow';
import { listItems } from '../db/items';
import type { Item } from '../db/types';
import { buildStoreShareText, filterByCriteria, sortByUrgency } from '../lib/records';
import { colors } from '../lib/theme';

export default function AllItemsScreen() {
  const { filter, store } = useLocalSearchParams<{ filter?: string; store?: string }>();
  const navigation = useNavigation();
  const [records, setRecords] = useState<Item[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  function handleShareStore() {
    if (!store) return;
    const pending = records.filter((record) => record.store?.trim() === store && record.status === 'Pendente');
    Share.share({ message: buildStoreShareText(store, pending) });
  }

  useEffect(() => {
    navigation.setOptions({
      title: store ? store : filter === 'Historico' ? 'Histórico' : 'Todos os itens',
      headerRight: store
        ? () => (
            <Pressable
              onPress={handleShareStore}
              accessibilityRole="button"
              accessibilityLabel={`Compartilhar itens pendentes de ${store}`}
              hitSlop={8}
            >
              <Share2 size={20} color={colors.plum} />
            </Pressable>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, filter, store, records]);

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
  const byCriteria = filterByCriteria(byStore, filter);
  const trimmedQuery = query.trim().toLowerCase();
  const searched = trimmedQuery ? byCriteria.filter((record) => record.item.toLowerCase().includes(trimmedQuery)) : byCriteria;
  const sorted = sortByUrgency(searched);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.searchBar}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome do item"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          accessibilityLabel="Buscar por nome do item"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Limpar busca">
            <X size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(record) => record.id}
        renderItem={({ item }) => <ExpiryRow record={item} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.plum} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {trimmedQuery
              ? `Nenhum item encontrado para "${query.trim()}".`
              : store
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 22,
    marginTop: 12,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, height: '100%' },
});
