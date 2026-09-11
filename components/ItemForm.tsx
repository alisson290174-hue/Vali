import { Camera, Expand, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDateInput } from '../lib/records';
import { colors } from '../lib/theme';

const REMINDER_SHORTCUTS = [1, 3, 5, 7];

type ItemFormProps = {
  itemName: string;
  onChangeItemName: (value: string) => void;
  expiryDate: string;
  onChangeExpiryDate: (value: string) => void;
  store: string;
  onChangeStore: (value: string) => void;
  quantity: string;
  onChangeQuantity: (value: string) => void;
  brand: string;
  onChangeBrand: (value: string) => void;
  note: string;
  onChangeNote: (value: string) => void;
  alertEnabled: boolean;
  onChangeAlertEnabled: (value: boolean) => void;
  reminderDaysBefore: number | null;
  onChangeReminderDaysBefore: (value: number) => void;
  photoUri: string | null;
  onPickPhoto: () => void;
  autoFocusItem?: boolean;
};

export function ItemForm({
  itemName,
  onChangeItemName,
  expiryDate,
  onChangeExpiryDate,
  store,
  onChangeStore,
  quantity,
  onChangeQuantity,
  brand,
  onChangeBrand,
  note,
  onChangeNote,
  alertEnabled,
  onChangeAlertEnabled,
  reminderDaysBefore,
  onChangeReminderDaysBefore,
  photoUri,
  onPickPhoto,
  autoFocusItem,
}: ItemFormProps) {
  const [reminderText, setReminderText] = useState(reminderDaysBefore ? String(reminderDaysBefore) : '');
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  useEffect(() => {
    setReminderText(reminderDaysBefore ? String(reminderDaysBefore) : '');
  }, [reminderDaysBefore]);

  function handleReminderTextChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setReminderText(digits);
    if (digits) {
      onChangeReminderDaysBefore(Math.max(1, parseInt(digits, 10)));
    }
  }
  return (
    <View>
      <Text style={styles.inputLabel}>Item</Text>
      <TextInput value={itemName} onChangeText={onChangeItemName} placeholder="Ex.: Biscoito recheado" placeholderTextColor={colors.muted} style={styles.input} autoFocus={autoFocusItem} />
      <Text style={styles.inputLabel}>Data de vencimento</Text>
      <TextInput value={expiryDate} onChangeText={(text) => onChangeExpiryDate(formatDateInput(text))} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} style={styles.input} keyboardType="number-pad" maxLength={10} />

      <Text style={styles.inputLabel}>Loja (opcional)</Text>
      <TextInput value={store} onChangeText={onChangeStore} placeholder="Ex.: Supermercado Central" placeholderTextColor={colors.muted} style={styles.input} />

      <Text style={styles.inputLabel}>Quantidade (opcional)</Text>
      <TextInput value={quantity} onChangeText={onChangeQuantity} placeholder="Ex.: 08 un." placeholderTextColor={colors.muted} style={styles.input} />

      <Text style={styles.inputLabel}>Marca (opcional)</Text>
      <TextInput value={brand} onChangeText={onChangeBrand} placeholder="Ex.: Italac" placeholderTextColor={colors.muted} style={styles.input} />

      <Text style={styles.inputLabel}>Observação (opcional)</Text>
      <TextInput value={note} onChangeText={onChangeNote} placeholder="Ex.: Conferir prateleira 3" placeholderTextColor={colors.muted} style={styles.input} multiline />

      {photoUri && (
        <Pressable style={styles.photoPreviewButton} onPress={() => setIsPhotoViewerOpen(true)}>
          <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
          <Text style={styles.photoButtonText}>Ver foto em tela cheia</Text>
          <Expand size={16} color={colors.plum} />
        </Pressable>
      )}
      <Pressable style={styles.photoButton} onPress={onPickPhoto}>
        <Camera size={20} color={colors.plum} />
        <Text style={styles.photoButtonText}>{photoUri ? 'Trocar foto (opcional)' : 'Adicionar foto (opcional)'}</Text>
      </Pressable>

      <Modal visible={isPhotoViewerOpen} transparent animationType="fade" onRequestClose={() => setIsPhotoViewerOpen(false)}>
        <SafeAreaView style={styles.photoViewerBackdrop}>
          <Pressable style={styles.photoViewerClose} onPress={() => setIsPhotoViewerOpen(false)}>
            <X size={24} color={colors.white} />
          </Pressable>
          {photoUri && <Image source={{ uri: photoUri }} style={styles.photoViewerImage} resizeMode="contain" />}
        </SafeAreaView>
      </Modal>

      <View style={styles.alertRow}>
        <View>
          <Text style={styles.inputLabel}>Alerta (opcional)</Text>
          <Text style={styles.alertHint}>Receber lembrete perto do vencimento</Text>
        </View>
        <Switch
          value={alertEnabled}
          onValueChange={onChangeAlertEnabled}
          trackColor={{ false: colors.oliveWash, true: colors.olive }}
          thumbColor={colors.white}
        />
      </View>

      {alertEnabled && (
        <View style={styles.reminderBlock}>
          <Text style={styles.inputLabel}>Avisar com quantos dias de antecedência</Text>
          <View style={styles.reminderChipRow}>
            {REMINDER_SHORTCUTS.map((days) => (
              <Pressable
                key={days}
                onPress={() => onChangeReminderDaysBefore(days)}
                style={[styles.reminderChip, reminderDaysBefore === days && styles.reminderChipActive]}
              >
                <Text style={[styles.reminderChipText, reminderDaysBefore === days && styles.reminderChipTextActive]}>
                  {days} {days === 1 ? 'dia' : 'dias'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={reminderText}
            onChangeText={handleReminderTextChange}
            placeholder="Ou digite outro número de dias"
            placeholderTextColor={colors.muted}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.reminderHint}>
            Além disso, um último aviso sempre chega no dia do vencimento.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { height: 50, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginBottom: 16 },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 13, paddingHorizontal: 15, height: 50, marginBottom: 16 },
  photoPreviewButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 13, paddingHorizontal: 15, height: 50, marginBottom: 10 },
  photoThumbnail: { width: 32, height: 32, borderRadius: 8 },
  photoButtonText: { flex: 1, color: colors.plum, fontSize: 14, fontWeight: '600' },
  photoViewerBackdrop: { flex: 1, backgroundColor: 'rgba(12, 10, 14, 0.95)' },
  photoViewerImage: { flex: 1, width: '100%' },
  photoViewerClose: { alignSelf: 'flex-end', margin: 16, backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 20 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  alertHint: { color: colors.muted, fontSize: 12, maxWidth: 220 },
  reminderBlock: { marginTop: -8, marginBottom: 20 },
  reminderChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  reminderChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white },
  reminderChipActive: { backgroundColor: colors.olive },
  reminderChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  reminderChipTextActive: { color: colors.cream },
  reminderHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -8 },
});
