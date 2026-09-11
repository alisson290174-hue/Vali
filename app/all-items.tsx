import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpiryRow } from '../components/ExpiryRow';
import { listItems } from '../db/items';
import type { Item } from '../db/types';
import { filterByCriteria, sortByUrgency } from '../lib/records';
import { colors } from '../lib/theme';

export default function AllItemsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [records, setRecords] = useState<Item[]>([]);

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

  const sorted = sortByUrgency(filterByCriteria(records, filter));

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(record) => record.id}
        renderItem={({ item }) => <ExpiryRow record={item} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item encontrado.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25 },
});
