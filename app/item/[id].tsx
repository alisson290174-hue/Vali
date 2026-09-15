import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemForm } from '../../components/ItemForm';
import { StatusIcon } from '../../components/StatusIcon';
import { deleteItem, getItem, listItems, updateItem } from '../../db/items';
import type { ItemStatus } from '../../db/types';
import { cancelReminder, syncRemindersForItem } from '../../lib/notifications';
import { pickPhoto } from '../../lib/photo';
import { daysUntil, isValidExpiryDate, listStoreNames, reminderExceedsRemaining } from '../../lib/records';
import { statusMeta } from '../../lib/status';
import { useTheme, type ThemeColors } from '../../lib/theme';

const STATUS_OPTIONS: ItemStatus[] = ['Pendente', 'Resolvido', 'Retirado', 'Trocado', 'Vencido'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meta = useMemo(() => statusMeta(colors), [colors]);

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
  const [storeNames, setStoreNames] = useState<string[]>([]);
  const statusHintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationIdsRef = useRef<{ early: string | null; final: string | null }>({ early: null, final: null });
  const navigation = useNavigation();
  const isDirtyRef = useRef(false);
  const initialValuesRef = useRef<{
    itemName: string;
    expiryDate: string;
    store: string;
    quantity: string;
    brand: string;
    note: string;
    alertEnabled: boolean;
    reminderDaysBefore: number | null;
    photoUri: string | null;
  } | null>(null);

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
      initialValuesRef.current = {
        itemName: found.item,
        expiryDate: found.expiryDate,
        store: found.store ?? '',
        quantity: found.quantity ?? '',
        brand: found.brand ?? '',
        note: found.note ?? '',
        alertEnabled: found.alertEnabled,
        reminderDaysBefore: found.reminderDaysBefore,
        photoUri: found.photoUri,
      };
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    listItems().then((items) => setStoreNames(listStoreNames(items)));
  }, []);

  useEffect(() => {
    const initial = initialValuesRef.current;
    isDirtyRef.current = Boolean(
      initial &&
        (itemName !== initial.itemName ||
          expiryDate !== initial.expiryDate ||
          store !== initial.store ||
          quantity !== initial.quantity ||
          brand !== initial.brand ||
          note !== initial.note ||
          alertEnabled !== initial.alertEnabled ||
          reminderDaysBefore !== initial.reminderDaysBefore ||
          photoUri !== initial.photoUri)
    );
  });

  // Native-stack não suporta bem cancelar uma remoção de tela já iniciada pelo
  // gesto/botão nativo (usePreventRemove nem está disponível via expo-router).
  // Em vez de interceptar a navegação nativa, assumimos o controle total do
  // "voltar" nessa tela: gesto e header nativos ficam desligados (ver
  // app/_layout.tsx), e este handler decide se pode sair direto ou se precisa
  // confirmar o descarte, tanto pelo botão do cabeçalho quanto pelo botão
  // físico/gesto de voltar do Android.
  const handleBackPress = useCallback(() => {
    if (!isDirtyRef.current) {
      router.back();
      return true;
    }
    Alert.alert('Descartar alterações?', 'Você tem alterações não salvas neste item.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
    return true;
  }, [router]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleBackPress} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel="Voltar">
          <ChevronLeft size={26} color={colors.plum} />
        </Pressable>
      ),
    });
  }, [navigation, handleBackPress, styles, colors]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [handleBackPress]);

  async function handleStatusChange(option: ItemStatus) {
    if (option === status) return;
    if (option === 'Vencido' && !isPastDue) {
      Alert.alert(
        'Ainda não venceu',
        'Esse item ainda está dentro da validade. O status "Vencido" fica disponível depois que a data passar.'
      );
      return;
    }
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
    if (value && reminderDaysBefore === null) setReminderDaysBefore(10);
  }

  const canSave =
    itemName.trim().length > 0 &&
    isValidExpiryDate(expiryDate) &&
    (!alertEnabled || !reminderExceedsRemaining(expiryDate, reminderDaysBefore));
  const isPastDue = isValidExpiryDate(expiryDate) && daysUntil(expiryDate) < 0;

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ItemForm
            itemName={itemName}
            onChangeItemName={setItemName}
            expiryDate={expiryDate}
            onChangeExpiryDate={setExpiryDate}
            store={store}
            onChangeStore={setStore}
            knownStores={storeNames}
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
              const isLockedVencido = option === 'Vencido' && !isPastDue && !isActive;
              const optionMeta = meta[option];
              return (
                <Pressable
                  key={option}
                  onPress={() => handleStatusChange(option)}
                  style={[styles.statusChip, isActive && { backgroundColor: optionMeta.bg }, isLockedVencido && styles.statusChipLocked]}
                  accessibilityRole="button"
                  accessibilityLabel={isLockedVencido ? `Status: ${option}, disponível só depois do vencimento` : `Status: ${option}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <StatusIcon status={option} size={14} color={isActive ? optionMeta.text : colors.muted} />
                  <Text style={[styles.statusChipText, isActive && { color: optionMeta.text }]}>{option}</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.cream },
    flex: { flex: 1 },
    content: { padding: 22, paddingBottom: 40 },
    loadingText: { color: colors.muted, textAlign: 'center', marginTop: 40, marginHorizontal: 22, marginBottom: 20 },
    backButton: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, backgroundColor: colors.plum },
    headerBackButton: { paddingHorizontal: 8, paddingVertical: 6, marginLeft: 4 },
    backButtonText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
    inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
    statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusSavedHint: { color: colors.olive, fontSize: 12, fontWeight: '700', marginBottom: 7 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white },
    statusChipLocked: { opacity: 0.4 },
    statusChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    saveButtonDisabled: { opacity: 0.45 },
    saveButtonText: { color: colors.cream, fontSize: 15, fontWeight: '700' },
    deleteButton: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    deleteButtonText: { color: colors.orange, fontSize: 14, fontWeight: '700' },
  });
}
