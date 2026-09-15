import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { configureNotificationHandler, useNotificationDeepLink } from '../lib/notifications';

configureNotificationHandler();

export default function RootLayout() {
  useNotificationDeepLink();
  const colors = useTheme();
  return (
    <SafeAreaProvider>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Voltar',
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.plum,
          headerTitleStyle: { color: colors.ink },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="all-items" options={{ headerShown: true, title: 'Todos os itens' }} />
        <Stack.Screen
          name="item/[id]"
          options={{
            headerShown: true,
            title: 'Detalhes do item',
            // Gesto nativo desligado de propósito: essa tela controla o próprio
            // "voltar" (ver app/item/[id].tsx) pra poder confirmar descarte de
            // alterações não salvas — o native-stack não suporta bem cancelar
            // uma remoção de tela já iniciada pelo gesto.
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notificações' }} />
        <Stack.Screen name="stores" options={{ headerShown: true, title: 'Lojas' }} />
        <Stack.Screen name="stats" options={{ headerShown: true, title: 'Estatísticas' }} />
        <Stack.Screen name="backup" options={{ headerShown: true, title: 'Configurações' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
