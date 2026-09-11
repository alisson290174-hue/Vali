import { Camera } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { formatDateInput } from '../lib/records';
import { colors } from '../lib/theme';

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
  photoUri,
  onPickPhoto,
  autoFocusItem,
}: ItemFormProps) {
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

      <Pressable style={styles.photoButton} onPress={onPickPhoto}>
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
          onValueChange={onChangeAlertEnabled}
          trackColor={{ false: colors.oliveWash, true: colors.olive }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { height: 50, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontSize: 15, marginBottom: 16 },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 13, paddingHorizontal: 15, height: 50, marginBottom: 16 },
  photoThumbnail: { width: 32, height: 32, borderRadius: 8 },
  photoButtonText: { color: colors.plum, fontSize: 14, fontWeight: '600' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  alertHint: { color: colors.muted, fontSize: 12, maxWidth: 220 },
});
