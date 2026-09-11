import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleCheck,
  Clock3,
  Plus,
  Store,
  X,
} from 'lucide-react-native';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function App() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [records, setRecords] = useState(initialRecords);

  const visibleRecords = records.filter((record) => {
    if (activeFilter === 'Urgentes') return record.days <= 3;
    if (activeFilter === 'Esta semana') return record.days <= 7;
    return true;
  });

  function addRecord() {
    if (!itemName.trim() || !expiryDate.trim()) return;
    setRecords((current) => [
      {
        id: String(Date.now()),
        item: itemName.trim(),
        store: 'Sem loja definida',
        date: expiryDate.trim(),
        days: 7,
        quantity: 'Não informado',
        status: 'Atenção',
      },
      ...current,
    ]);
    setItemName('');
    setExpiryDate('');
    setIsAddOpen(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BOM DIA, PROMOTOR</Text>
            <Text style={styles.title}>Sua validade{`\n`}sob controle.</Text>
          </View>
          <Pressable style={styles.bellButton} accessibilityLabel="Notificações">
            <Bell size={21} color={colors.plum} strokeWidth={2.2} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryOrb} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>ATENÇÃO HOJE</Text>
            <Text style={styles.summaryNumber}>03 itens</Text>
            <Text style={styles.summaryDescription}>em 2 lojas precisam de você</Text>
          </View>
          <AlertTriangle size={52} color={colors.oliveLight} strokeWidth={1.3} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visão geral</Text>
          <Text style={styles.sectionMeta}>12 registros</Text>
        </View>
        <View style={styles.metricRow}>
          <Metric icon={<Clock3 size={18} color={colors.orange} />} value="03" label="Urgentes" tone="orange" />
          <Metric icon={<CircleCheck size={18} color={colors.olive} />} value="06" label="Pendentes" tone="olive" />
          <Metric icon={<Store size={18} color={colors.plum} />} value="04" label="Lojas" tone="plum" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registros recentes</Text>
          <Pressable><Text style={styles.linkText}>Ver todos</Text></Pressable>
        </View>
        <View style={styles.filters}>
          {['Todos', 'Urgentes', 'Esta semana'].map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, activeFilter === filter && styles.filterActive]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={visibleRecords}
          scrollEnabled={false}
          keyExtractor={(record) => record.id}
          renderItem={({ item }) => <ExpiryRow record={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum registro neste filtro.</Text>}
        />
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setIsAddOpen(true)} accessibilityLabel="Adicionar item">
        <Plus size={25} color={colors.cream} strokeWidth={2.5} />
        <Text style={styles.fabText}>Novo item</Text>
      </Pressable>

      <Modal visible={isAddOpen} transparent animationType="slide" onRequestClose={() => setIsAddOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>REGISTRO RÁPIDO</Text>
                <Text style={styles.modalTitle}>O que está perto do prazo?</Text>
              </View>
              <Pressable onPress={() => setIsAddOpen(false)} style={styles.closeButton}>
                <X size={20} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Item</Text>
            <TextInput value={itemName} onChangeText={setItemName} placeholder="Ex.: Biscoito recheado" placeholderTextColor={colors.muted} style={styles.input} autoFocus />
            <Text style={styles.inputLabel}>Data de vencimento</Text>
            <TextInput value={expiryDate} onChangeText={setExpiryDate} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} style={styles.input} keyboardType="numbers-and-punctuation" />
            <Text style={styles.optionalHint}>Loja, foto, quantidade e alerta podem ser adicionados depois.</Text>
            <Pressable style={[styles.saveButton, (!itemName.trim() || !expiryDate.trim()) && styles.saveButtonDisabled]} onPress={addRecord} disabled={!itemName.trim() || !expiryDate.trim()}>
              <Text style={styles.saveButtonText}>Salvar item</Text>
              <ChevronRight size={19} color={colors.cream} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

type Record = typeof initialRecords[number];

const initialRecords = [
  { id: '1', item: 'Leite integral 1L', store: 'Supermercado Central', date: '14/09/2026', days: 3, quantity: '08 un.', status: 'Urgente' },
  { id: '2', item: 'Biscoito recheado', store: 'Mercado do Bairro', date: '18/09/2026', days: 7, quantity: '12 un.', status: 'Atenção' },
  { id: '3', item: 'Suco de uva 1L', store: 'Supermercado Central', date: '29/09/2026', days: 18, quantity: '05 un.', status: 'No prazo' },
];

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: 'orange' | 'olive' | 'plum' }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: colors[`${tone}Wash`] }]}>{icon}</View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function ExpiryRow({ record }: { record: Record }) {
  const isUrgent = record.days <= 3;
  return <View style={styles.recordRow}><View style={[styles.recordImage, isUrgent && styles.recordImageUrgent]}><Text style={styles.recordImageText}>{record.item.charAt(0)}</Text></View><View style={styles.recordMain}><Text style={styles.recordName} numberOfLines={1}>{record.item}</Text><View style={styles.storeLine}><Store size={13} color={colors.muted} /><Text style={styles.storeText} numberOfLines={1}>{record.store}</Text></View><Text style={styles.recordQuantity}>{record.quantity}</Text></View><View style={styles.recordRight}><View style={[styles.statusPill, isUrgent ? styles.statusUrgent : styles.statusNormal]}><Text style={[styles.statusText, isUrgent && styles.statusTextUrgent]}>{record.status}</Text></View><Text style={styles.recordDate}>{record.date}</Text></View></View>;
}

const colors = {
  cream: '#F7F3EA', white: '#FFFFFF', ink: '#29262B', muted: '#8B858C', plum: '#4C2B52', plumLight: '#8A648F', olive: '#697548', oliveLight: '#C0C98C', orange: '#CE704F', orangeWash: '#FBE5DB', oliveWash: '#E9EBD9', plumWash: '#EDE4EF',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 110,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  eyebrow: { color: colors.olive, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 35, fontWeight: '700', letterSpacing: -0.5 },
  bellButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 10, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange, borderWidth: 1.5, borderColor: colors.white },
  summaryCard: { height: 148, backgroundColor: colors.plum, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 28 },
  summaryOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.plumLight, opacity: 0.25, right: -75, top: -85 },
  summaryContent: { zIndex: 1 },
  summaryLabel: { color: colors.oliveLight, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
  summaryNumber: { color: colors.cream, fontSize: 28, fontWeight: '700', marginBottom: 3 },
  summaryDescription: { color: '#DCCCDC', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' },
  sectionMeta: { color: colors.muted, fontSize: 12 },
  linkText: { color: colors.plum, fontSize: 13, fontWeight: '700' },
  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  metric: { flex: 1, backgroundColor: colors.white, borderRadius: 17, padding: 13, minHeight: 102 },
  metricIcon: { width: 33, height: 33, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 1 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.olive },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.cream },
  recordRow: { backgroundColor: colors.white, borderRadius: 17, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  recordImage: { width: 52, height: 58, borderRadius: 13, backgroundColor: colors.oliveWash, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordImageUrgent: { backgroundColor: colors.orangeWash },
  recordImageText: { color: colors.olive, fontSize: 21, fontWeight: '700' },
  recordMain: { flex: 1, minWidth: 0 },
  recordName: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 5 },
  storeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 7 },
  storeText: { color: colors.muted, fontSize: 11, flexShrink: 1 },
  recordQuantity: { color: colors.olive, fontSize: 11, fontWeight: '700' },
  recordRight: { alignItems: 'flex-end', marginLeft: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginBottom: 8 },
  statusUrgent: { backgroundColor: colors.orangeWash },
  statusNormal: { backgroundColor: colors.oliveWash },
  statusText: { color: colors.olive, fontSize: 10, fontWeight: '700' },
  statusTextUrgent: { color: colors.orange },
  recordDate: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25 },
  fab: { position: 'absolute', bottom: 24, right: 22, borderRadius: 28, backgroundColor: colors.plum, height: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5, shadowColor: colors.plum, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  fabText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(37, 35, 38, 0.35)' },
  modalCard: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalEyebrow: { color: colors.olive, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  closeButton: { backgroundColor: colors.white, padding: 8, borderRadius: 20 },
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { height: 50, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginBottom: 16 },
  optionalHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 20 },
  saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.plum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.cream, fontSize: 15, fontWeight: '700' },
});
