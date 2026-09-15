import { useFocusEffect, useRouter } from 'expo-router';
import { Download, Upload } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyBackup, exportBackup, pickAndParseBackup } from '../lib/backup';
import { isDailySummaryEnabled, setDailySummaryEnabled as persistDailySummaryEnabled } from '../lib/notifications';
import { colors } from '../lib/theme';
import { listItems } from '../db/items';

export default function BackupScreen() {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [isTogglingDailySummary, setIsTogglingDailySummary] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items) => {
        if (isMounted) setItemCount(items.length);
      });
      isDailySummaryEnabled().then((enabled) => {
        if (isMounted) setDailySummaryEnabled(enabled);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  async function handleToggleDailySummary(value: boolean) {
    setDailySummaryEnabled(value);
    setIsTogglingDailySummary(true);
    const items = await listItems();
    const { permissionDenied } = await persistDailySummaryEnabled(value, items);
    setIsTogglingDailySummary(false);
    if (value && permissionDenied) {
      setDailySummaryEnabled(false);
      Alert.alert(
        'Permissão de notificação negada',
        'Ative as notificações do Vali nas configurações do celular pra receber o resumo diário.'
      );
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportBackup();
    } catch (error) {
      Alert.alert('Não foi possível exportar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }

  async function finishImport(backup: NonNullable<Awaited<ReturnType<typeof pickAndParseBackup>>>) {
    setIsImporting(true);
    try {
      const { imported, permissionDenied } = await applyBackup(backup);
      const items = await listItems();
      setItemCount(items.length);
      if (permissionDenied) {
        Alert.alert(
          'Itens importados, com um aviso',
          `${imported} ${imported === 1 ? 'item importado' : 'itens importados'}. Alguns tinham alerta ligado, mas você não vai receber lembretes até permitir notificações para o Vali nas configurações do celular.`
        );
      } else {
        Alert.alert('Pronto', `${imported} ${imported === 1 ? 'item importado' : 'itens importados'} com sucesso.`);
      }
    } catch (error) {
      Alert.alert('Não foi possível importar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsImporting(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    let backup: Awaited<ReturnType<typeof pickAndParseBackup>>;
    try {
      backup = await pickAndParseBackup();
    } catch (error) {
      setIsImporting(false);
      Alert.alert('Não foi possível importar', error instanceof Error ? error.message : 'Tente novamente.');
      return;
    }
    setIsImporting(false);
    if (!backup) return;

    Alert.alert(
      'Importar backup',
      `Isso vai adicionar ${backup.items.length} ${backup.items.length === 1 ? 'item' : 'itens'} aos seus itens atuais. Nada é substituído.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', onPress: () => finishImport(backup!) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Resumo diário</Text>
            <Text style={styles.settingHint}>
              Um aviso todo dia de manhã com quantos itens vencem essa semana, além dos lembretes de cada item.
            </Text>
          </View>
          {isTogglingDailySummary ? (
            <ActivityIndicator color={colors.plum} />
          ) : (
            <Switch
              value={dailySummaryEnabled}
              onValueChange={handleToggleDailySummary}
              trackColor={{ false: colors.oliveWash, true: colors.olive }}
              thumbColor={colors.white}
              accessibilityLabel="Resumo diário de itens vencendo essa semana"
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Backup</Text>
        <Text style={styles.count}>
          {itemCount} {itemCount === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </Text>
        <Text style={styles.explainer}>
          O Vali guarda tudo só neste aparelho. Exporte de vez em quando pra não perder seus itens se
          desinstalar o app ou trocar de celular.
        </Text>

        <Pressable
          style={[styles.button, styles.exportButton]}
          onPress={handleExport}
          disabled={isExporting || isImporting}
          accessibilityRole="button"
          accessibilityLabel="Exportar backup"
        >
          {isExporting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Download size={20} color={colors.white} />
              <Text style={styles.buttonText}>Exportar backup</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.importButton]}
          onPress={handleImport}
          disabled={isExporting || isImporting}
          accessibilityRole="button"
          accessibilityLabel="Importar backup"
        >
          {isImporting ? (
            <ActivityIndicator color={colors.plum} />
          ) : (
            <>
              <Upload size={20} color={colors.plum} />
              <Text style={[styles.buttonText, styles.importButtonText]}>Importar backup</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    gap: 12,
  },
  settingText: { flex: 1 },
  settingLabel: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  settingHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  count: { color: colors.ink, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  explainer: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 28 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  exportButton: { backgroundColor: colors.plum },
  importButton: { backgroundColor: colors.plumWash },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  importButtonText: { color: colors.plum },
});
