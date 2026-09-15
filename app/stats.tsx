import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listItems } from '../db/items';
import { computeStats, type Stats } from '../lib/records';
import { colors } from '../lib/theme';

const EMPTY_STATS: Stats = {
  total: 0,
  pendentes: 0,
  resolvidos: 0,
  retirados: 0,
  trocados: 0,
  vencidos: 0,
  lojas: 0,
  taxaResolvidosATempo: null,
};

function Card({ label, value, tone }: { label: string; value: number | string; tone?: 'orange' }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardValue, tone === 'orange' && styles.cardValueOrange]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items) => {
        if (isMounted) setStats(computeStats(items));
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    const items = await listItems();
    setStats(computeStats(items));
    setIsRefreshing(false);
  }

  const taxaLabel =
    stats.taxaResolvidosATempo === null ? '—' : `${Math.round(stats.taxaResolvidosATempo * 100)}%`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.plum} />}
      >
        <Text style={styles.sectionTitle}>Visão geral</Text>
        <View style={styles.grid}>
          <Card label="Itens cadastrados" value={stats.total} />
          <Card label="Pendentes agora" value={stats.pendentes} />
          <Card label="Lojas cadastradas" value={stats.lojas} />
          <Card label="Vencidos sem ação" value={stats.vencidos} tone={stats.vencidos > 0 ? 'orange' : undefined} />
        </View>

        <Text style={styles.sectionTitle}>Como os itens terminaram</Text>
        <View style={styles.grid}>
          <Card label="Resolvidos" value={stats.resolvidos} />
          <Card label="Retirados" value={stats.retirados} />
          <Card label="Trocados" value={stats.trocados} />
          <Card label="Vencidos" value={stats.vencidos} tone={stats.vencidos > 0 ? 'orange' : undefined} />
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateValue}>{taxaLabel}</Text>
          <Text style={styles.rateLabel}>
            dos itens finalizados foram tratados antes de vencer (resolvidos, retirados ou trocados — em vez de
            vencer sem ação)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 17,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardValue: { color: colors.plum, fontSize: 28, fontWeight: '700', marginBottom: 4 },
  cardValueOrange: { color: colors.orange },
  cardLabel: { color: colors.muted, fontSize: 12 },
  rateCard: { backgroundColor: colors.plumWash, borderRadius: 17, padding: 18, marginTop: 12 },
  rateValue: { color: colors.plum, fontSize: 32, fontWeight: '700', marginBottom: 6 },
  rateLabel: { color: colors.ink, fontSize: 12, lineHeight: 18 },
});
