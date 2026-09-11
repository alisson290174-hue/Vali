import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemForm } from '../../components/ItemForm';
import { StatusIcon } from '../../components/StatusIcon';
import { deleteItem, getItem, updateItem } from '../../db/items';
import type { ItemStatus } from '../../db/types';
import { cancelReminder, syncRemindersForItem } from '../../lib/notifications';
import { pickPhoto } from '../../lib/photo';
import { isValidExpiryDate } from '../../lib/records';
import { STATUS_META } from '../../lib/status';
import { colors } from '../../lib/theme';

const STATUS_OPTIONS: ItemStatus[] = ['Pendente', 'Resolvido', 'Retirado', 'Trocado', 'Vencido'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [itemName, setItemName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [store, setStore] = useState('');
  const [quantity, setQuantity] = useState('');
  const [brand, setBrand] = useState('');
  const [note, setNote] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ItemStatus>('Pendente');
  const [statusSavedHint, setStatusSavedHint] = useState(false);
  const statusHintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationIdsRef = useRef<{ early: string | null; final: string | null }>({ early: null, final: null });

  useEffect(() => {
    return () => {
      if (statusHintTimeout.current) clearTimeout(statusHintTimeout.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    getItem(id).then((found) => {
      if (!isMounted) return;
      if (!found) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setItemName(found.item);
      setExpiryDate(found.expiryDate);
      setStore(found.store ?? '');
      setQuantity(found.quantity ?? '');
      setBrand(found.brand ?? '');
      setNote(found.note ?? '');
      setAlertEnabled(found.alertEnabled);
      setReminderDaysBefore(found.reminderDaysBefore);
      notificationIdsRef.current = { early: found.earlyNotificationId, final: found.finalNotificationId };
      setPhotoUri(found.photoUri);
      setStatus(found.status);
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleStatusChange(option: ItemStatus) {
    if (option === status) return;
    const previous = status;
    setStatus(option);
    try {
      await updateItem(id, { status: option });
      setStatusSavedHint(true);
      if (statusHintTimeout.current) clearTimeout(statusHintTimeout.current);
      statusHintTimeout.current = setTimeout(() => setStatusSavedHint(false), 1500);
    } catch {
      setStatus(previous);
    }
  }

  function handleAlertToggle(value: boolean) {
    setAlertEnabled(value);
    if (value && reminderDaysBefore === null) setReminderDaysBefore(3);
  }

  const canSave = itemName.trim().length > 0 && isValidExpiryDate(expiryDate);

  async function handlePickPhoto() {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleSave() {
    if (!canSave) return;
    const updated = await updateItem(id, {
      item: itemName.trim(),
      expiryDate: expiryDate.trim(),
      store: store.trim() || undefined,
      quantity: quantity.trim() || undefined,
      brand: brand.trim() || undefined,
      note: note.trim() || undefined,
      alertEnabled,
      reminderDaysBefore: alertEnabled ? reminderDaysBefore ?? undefined : null,
      photoUri: photoUri ?? undefined,
      status,
    });
    const { permissionDenied } = await syncRemindersForItem(updated);
    router.back();
    if (permissionDenied) {
      Alert.alert(
        'Permissão de notificação negada',
        'O item foi salvo com o alerta ligado, mas você não vai receber lembretes até permitir notificações para o Vali nas configurações do celular.'
      );
    }
  }

  function handleDelete() {
    Alert.alert('Excluir item', `Excluir "${itemName}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(notificationIdsRef.current.early);
          await cancelReminder(notificationIdsRef.current.final);
          await deleteItem(id);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Text style={styles.loadingText}>Esse item não existe mais (já foi excluído).</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          />

          <View style={styles.statusHeader}>
            <Text style={styles.inputLabel}>Status</Text>
            {statusSavedHint && <Text style={styles.statusSavedHint}>Status atualizado ✓</Text>}
          </View>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => {
              const isActive = status === option;
              const meta = STATUS_META[option];
              return (
                <Pressable
                  key={option}
                  onPress={() => handleStatusChange(option)}
                  style={[styles.statusChip, isActive && { backgroundColor: meta.bg }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Status: ${option}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <StatusIcon status={option} size={14} color={isActive ? meta.text : colors.muted} />
                  <Text style={[styles.statusChipText, isActive && { color: meta.text }]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Salvar alterações"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveButtonText}>Salvar alterações</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Excluir item">
            <Text style={styles.deleteButtonText}>Excluir item</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  loadingText: { color: colors.muted, textAlign: 'center', marginTop: 40, marginHorizontal: 22, marginBottom: 20 },
  backButton: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, backgroundColor: colors.plum },
  backButtonText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusSavedHint: { color: colors.olive, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white },
  statusChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  deleteButton: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: colors.orange, fontSize: 14, fontWeight: '700' },
});
