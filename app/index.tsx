import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Bell,
  ChevronRight,
  Clock3,
  Plus,
  Settings,
  Store,
  X,
} from 'lucide-react-native';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpiryRow } from '../components/ExpiryRow';
import { ItemForm } from '../components/ItemForm';
import { insertItem, listItems, seedIfEmpty } from '../db/items';
import type { Item } from '../db/types';
import { colors } from '../lib/theme';
import { countDistinctStores, daysUntil, filterByCriteria, isValidExpiryDate, reminderExceedsRemaining, sortByUrgency } from '../lib/records';
import { pickPhoto } from '../lib/photo';
import { getNextReminder, syncRemindersForItem } from '../lib/notifications';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

const HOME_PREVIEW_LIMIT = 5;
const DEFAULT_REMINDER_DAYS_BEFORE = 10;

export default function IndexScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [store, setStore] = useState('');
  const [quantity, setQuantity] = useState('');
  const [brand, setBrand] = useState('');
  const [note, setNote] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number | null>(DEFAULT_REMINDER_DAYS_BEFORE);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [records, setRecords] = useState<Item[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleAlertToggle(value: boolean) {
    setAlertEnabled(value);
    if (value && reminderDaysBefore === null) setReminderDaysBefore(DEFAULT_REMINDER_DAYS_BEFORE);
  }

  async function loadRecords() {
    await seedIfEmpty();
    const items = await listItems();
    setRecords(items);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadRecords();
    setIsRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function bootstrap() {
        await seedIfEmpty();
        const items = await listItems();
        if (isMounted) setRecords(items);
      }
      bootstrap();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Home foca só no que ainda precisa de atenção (status Pendente). Itens
  // resolvidos/retirados/trocados/vencidos saem daqui e vivem no Histórico
  // ("Ver todos" filtrado), pra não competir visualmente com o que é ativo.
  const activeItems = records.filter((record) => record.status === 'Pendente');
  const historicoCount = records.length - activeItems.length;

  const visibleRecords = filterByCriteria(activeItems, activeFilter);
  const homePreviewRecords = sortByUrgency(visibleRecords).slice(0, HOME_PREVIEW_LIMIT);

  const urgentRecords = activeItems.filter((record) => daysUntil(record.expiryDate) <= 3);
  const urgentCount = urgentRecords.length;
  const storeCount = countDistinctStores(activeItems);
  const urgentStoreCount = countDistinctStores(urgentRecords);
  const hasUpcomingReminder = records.some((record) => record.alertEnabled && getNextReminder(record) !== null);

  const canSave =
    itemName.trim().length > 0 &&
    isValidExpiryDate(expiryDate) &&
    (!alertEnabled || !reminderExceedsRemaining(expiryDate, reminderDaysBefore));

  async function addRecord() {
    if (!canSave) return;
    const created = await insertItem({
      item: itemName.trim(),
      expiryDate: expiryDate.trim(),
      store: store.trim() || undefined,
      quantity: quantity.trim() || undefined,
      brand: brand.trim() || undefined,
      note: note.trim() || undefined,
      alertEnabled,
      reminderDaysBefore: alertEnabled ? reminderDaysBefore ?? undefined : undefined,
      photoUri: photoUri ?? undefined,
    });
    const { item: withReminders, permissionDenied } = await syncRemindersForItem(created);
    setRecords((current) => [withReminders, ...current]);
    resetForm();
    setIsAddOpen(false);
    if (permissionDenied) {
      Alert.alert(
        'Permissão de notificação negada',
        'O item foi salvo com o alerta ligado, mas você não vai receber lembretes até permitir notificações para o Vali nas configurações do celular.'
      );
    }
  }

  function resetForm() {
    setItemName('');
    setExpiryDate('');
    setStore('');
    setQuantity('');
    setBrand('');
    setReminderDaysBefore(DEFAULT_REMINDER_DAYS_BEFORE);
    setNote('');
    setAlertEnabled(true);
    setPhotoUri(null);
  }

  async function handlePickPhoto() {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  }

  // alertEnabled/reminderDaysBefore começam com valor padrão (não em branco), então
  // não entram nessa checagem — só contam como "não salvo" os campos que o usuário
  // realmente preencheu.
  const hasUnsavedInput =
    itemName.trim().length > 0 ||
    expiryDate.length > 0 ||
    store.trim().length > 0 ||
    quantity.trim().length > 0 ||
    brand.trim().length > 0 ||
    note.trim().length > 0 ||
    photoUri !== null;

  function handleCloseAdd() {
    if (!hasUnsavedInput) {
      resetForm();
      setIsAddOpen(false);
      return;
    }
    Alert.alert('Descartar item?', 'Você preencheu informações que ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          resetForm();
          setIsAddOpen(false);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.plum} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BOM DIA, PROMOTOR</Text>
            <Text style={styles.title}>Sua validade{`\n`}sob controle.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.bellButton} accessibilityLabel="Backup" accessibilityRole="button" onPress={() => router.push('/backup')}>
              <Settings size={21} color={colors.plum} strokeWidth={2.2} />
            </Pressable>
            <Pressable style={styles.bellButton} accessibilityLabel="Notificações" accessibilityRole="button" onPress={() => router.push('/notifications')}>
              <Bell size={21} color={colors.plum} strokeWidth={2.2} />
              {hasUpcomingReminder && <View style={styles.notificationDot} />}
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.summaryCard}
          onPress={() => router.push('/all-items?filter=Urgentes')}
          accessibilityRole="button"
          accessibilityLabel={`Atenção hoje: ${urgentCount} ${urgentCount === 1 ? 'item urgente' : 'itens urgentes'}. Toque para ver a lista.`}
        >
          <View style={styles.summaryOrb} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>ATENÇÃO HOJE</Text>
            <Text style={styles.summaryNumber}>{pad2(urgentCount)} itens</Text>
            <Text style={styles.summaryDescription}>
              {urgentCount === 0
                ? 'Nenhum item urgente no momento'
                : `em ${urgentStoreCount} loja${urgentStoreCount === 1 ? '' : 's'} precisam de você`}
            </Text>
          </View>
          <AlertTriangle size={52} color={colors.oliveLight} strokeWidth={1.3} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visão geral</Text>
          <Text style={styles.sectionMeta}>{activeItems.length} ativos</Text>
        </View>
        <View style={styles.metricRow}>
          <Metric icon={<Clock3 size={18} color={colors.orange} />} value={pad2(urgentCount)} label="Urgentes" tone="orange" onPress={() => router.push('/all-items?filter=Urgentes')} />
          <Metric icon={<Archive size={18} color={colors.olive} />} value={pad2(historicoCount)} label="Histórico" tone="olive" onPress={() => router.push('/all-items?filter=Historico')} />
          <Metric icon={<Store size={18} color={colors.plum} />} value={pad2(storeCount)} label="Lojas" tone="plum" onPress={() => router.push('/stores')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registros recentes</Text>
          <Pressable onPress={() => router.push('/all-items')} accessibilityRole="button" accessibilityLabel="Ver todos os itens">
            <Text style={styles.linkText}>Ver todos</Text>
          </Pressable>
        </View>
        <View style={styles.filters}>
          {['Todos', 'Urgentes', 'Esta semana'].map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, activeFilter === filter && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              accessibilityLabel={`Filtrar por ${filter}`}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={homePreviewRecords}
          scrollEnabled={false}
          keyExtractor={(record) => record.id}
          renderItem={({ item }) => <ExpiryRow record={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum registro neste filtro.</Text>}
        />
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setIsAddOpen(true)} accessibilityLabel="Adicionar item" accessibilityRole="button">
        <Plus size={25} color={colors.cream} strokeWidth={2.5} />
        <Text style={styles.fabText}>Novo item</Text>
      </Pressable>

      <Modal visible={isAddOpen} transparent animationType="slide" onRequestClose={handleCloseAdd}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>REGISTRO RÁPIDO</Text>
                <Text style={styles.modalTitle}>O que está perto do prazo?</Text>
              </View>
              <Pressable onPress={handleCloseAdd} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fechar">
                <X size={20} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ItemForm
                itemName={itemName}
                onChangeItemName={setItemName}
                expiryDate={expiryDate}
                onChangeExpiryDate={setExpiryDate}
                store={store}
                onChangeStore={setStore}
                quantity={quantity}
                onChangeQuantity={setQuantity}
                brand={brand}
                onChangeBrand={setBrand}
                note={note}
                onChangeNote={setNote}
                alertEnabled={alertEnabled}
                onChangeAlertEnabled={handleAlertToggle}
                reminderDaysBefore={reminderDaysBefore}
                onChangeReminderDaysBefore={setReminderDaysBefore}
                photoUri={photoUri}
                onPickPhoto={handlePickPhoto}
                autoFocusItem
              />
            </ScrollView>
            <Pressable
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              onPress={addRecord}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="Salvar item"
              accessibilityState={{ disabled: !canSave }}
            >
              <Text style={styles.saveButtonText}>Salvar item</Text>
              <ChevronRight size={19} color={colors.cream} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({
  icon,
  value,
  label,
  tone,
  onPress,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: 'orange' | 'olive' | 'plum';
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.metric}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Toque para ver a lista filtrada.`}
    >
      <View style={[styles.metricIcon, { backgroundColor: colors[`${tone}Wash`] }]}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 110,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  headerActions: { flexDirection: 'row', gap: 10 },
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
  emptyText: { color: colors.muted, textAlign: 'center', padding: 25 },
  fab: { position: 'absolute', bottom: 24, right: 22, borderRadius: 28, backgroundColor: colors.plum, height: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5, shadowColor: colors.plum, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  fabText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(37, 35, 38, 0.35)' },
  modalCard: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 30, maxHeight: '88%' },
  modalScroll: { marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalEyebrow: { color: colors.olive, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  closeButton: { backgroundColor: colors.white, padding: 8, borderRadius: 20 },
  saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.plum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.cream, fontSize: 15, fontWeight: '700' },
});
