import { useFocusEffect, useRouter } from 'expo-router';
import { Download, Upload } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyBackup, exportBackup, pickAndParseBackup } from '../lib/backup';
import { colors } from '../lib/theme';
import { listItems } from '../db/items';

export default function BackupScreen() {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      listItems().then((items) => {
        if (isMounted) setItemCount(items.length);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

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
      <View style={styles.content}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 24 },
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
