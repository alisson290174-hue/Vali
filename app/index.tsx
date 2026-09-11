import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  Bell,
  Camera,
  ChevronRight,
  CircleCheck,
  Clock3,
  Plus,
  Store,
  X,
} from 'lucide-react-native';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpiryRow } from '../components/ExpiryRow';
import { insertItem, listItems, seedIfEmpty } from '../db/items';
import type { Item } from '../db/types';
import { colors } from '../lib/theme';
import { filterByCriteria, formatDateInput, sortByUrgency } from '../lib/records';

const HOME_PREVIEW_LIMIT = 5;

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
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [records, setRecords] = useState<Item[]>([]);

  useEffect(() => {
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
  }, []);

  const visibleRecords = filterByCriteria(records, activeFilter);
  const homePreviewRecords = sortByUrgency(visibleRecords).slice(0, HOME_PREVIEW_LIMIT);

  async function addRecord() {
    if (!itemName.trim() || !expiryDate.trim()) return;
    const created = await insertItem({
      item: itemName.trim(),
      expiryDate: expiryDate.trim(),
      store: store.trim() || undefined,
      quantity: quantity.trim() || undefined,
      brand: brand.trim() || undefined,
      note: note.trim() || undefined,
      alertEnabled,
      photoUri: photoUri ?? undefined,
    });
    setRecords((current) => [created, ...current]);
    resetForm();
    setIsAddOpen(false);
  }

  function resetForm() {
    setItemName('');
    setExpiryDate('');
    setStore('');
    setQuantity('');
    setBrand('');
    setNote('');
    setAlertEnabled(false);
    setPhotoUri(null);
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem ao item.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
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

        <Pressable style={styles.summaryCard} onPress={() => router.push('/all-items?filter=Urgentes')}>
          <View style={styles.summaryOrb} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>ATENÇÃO HOJE</Text>
            <Text style={styles.summaryNumber}>03 itens</Text>
            <Text style={styles.summaryDescription}>em 2 lojas precisam de você</Text>
          </View>
          <AlertTriangle size={52} color={colors.oliveLight} strokeWidth={1.3} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visão geral</Text>
          <Text style={styles.sectionMeta}>12 registros</Text>
        </View>
        <View style={styles.metricRow}>
          <Metric icon={<Clock3 size={18} color={colors.orange} />} value="03" label="Urgentes" tone="orange" onPress={() => router.push('/all-items?filter=Urgentes')} />
          <Metric icon={<CircleCheck size={18} color={colors.olive} />} value="06" label="Pendentes" tone="olive" onPress={() => router.push('/all-items?filter=Pendentes')} />
          <Metric icon={<Store size={18} color={colors.plum} />} value="04" label="Lojas" tone="plum" onPress={() => router.push('/all-items')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registros recentes</Text>
          <Pressable onPress={() => router.push('/all-items')}>
            <Text style={styles.linkText}>Ver todos</Text>
          </Pressable>
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
          data={homePreviewRecords}
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

      <Modal
        visible={isAddOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetForm();
          setIsAddOpen(false);
        }}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>REGISTRO RÁPIDO</Text>
                <Text style={styles.modalTitle}>O que está perto do prazo?</Text>
              </View>
              <Pressable
                onPress={() => {
                  resetForm();
                  setIsAddOpen(false);
                }}
                style={styles.closeButton}
              >
                <X size={20} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Item</Text>
              <TextInput value={itemName} onChangeText={setItemName} placeholder="Ex.: Biscoito recheado" placeholderTextColor={colors.muted} style={styles.input} autoFocus />
              <Text style={styles.inputLabel}>Data de vencimento</Text>
              <TextInput value={expiryDate} onChangeText={(text) => setExpiryDate(formatDateInput(text))} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} style={styles.input} keyboardType="number-pad" maxLength={10} />

              <Text style={styles.inputLabel}>Loja (opcional)</Text>
              <TextInput value={store} onChangeText={setStore} placeholder="Ex.: Supermercado Central" placeholderTextColor={colors.muted} style={styles.input} />

              <Text style={styles.inputLabel}>Quantidade (opcional)</Text>
              <TextInput value={quantity} onChangeText={setQuantity} placeholder="Ex.: 08 un." placeholderTextColor={colors.muted} style={styles.input} />

              <Text style={styles.inputLabel}>Marca (opcional)</Text>
              <TextInput value={brand} onChangeText={setBrand} placeholder="Ex.: Italac" placeholderTextColor={colors.muted} style={styles.input} />

              <Text style={styles.inputLabel}>Observação (opcional)</Text>
              <TextInput value={note} onChangeText={setNote} placeholder="Ex.: Conferir prateleira 3" placeholderTextColor={colors.muted} style={styles.input} multiline />

              <Pressable style={styles.photoButton} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                ) : (
                  <Camera size={20} color={colors.plum} />
                )}
                <Text style={styles.photoButtonText}>{photoUri ? 'Trocar foto (opcional)' : 'Adicionar foto (opcional)'}</Text>
              </Pressable>

              <View style={styles.alertRow}>
                <View>
                  <Text style={styles.inputLabel}>Alerta (opcional)</Text>
                  <Text style={styles.alertHint}>Receber lembrete perto do vencimento</Text>
                </View>
                <Switch
                  value={alertEnabled}
                  onValueChange={setAlertEnabled}
                  trackColor={{ false: colors.oliveWash, true: colors.olive }}
                  thumbColor={colors.white}
                />
              </View>
            </ScrollView>
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
    <Pressable style={styles.metric} onPress={onPress}>
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
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { height: 50, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginBottom: 16 },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 13, paddingHorizontal: 15, height: 50, marginBottom: 16 },
  photoThumbnail: { width: 32, height: 32, borderRadius: 8 },
  photoButtonText: { color: colors.plum, fontSize: 14, fontWeight: '600' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  alertHint: { color: colors.muted, fontSize: 12, maxWidth: 220 },
  saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.plum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.cream, fontSize: 15, fontWeight: '700' },
});
