import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { configureNotificationHandler, useNotificationDeepLink } from '../lib/notifications';

configureNotificationHandler();

export default function RootLayout() {
  useNotificationDeepLink();
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="all-items"
          options={{
            headerShown: true,
            title: 'Todos os itens',
            headerBackTitle: 'Voltar',
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.plum,
            headerTitleStyle: { color: colors.ink },
          }}
        />
        <Stack.Screen
          name="item/[id]"
          options={{
            headerShown: true,
            title: 'Detalhes do item',
            headerBackTitle: 'Voltar',
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.plum,
            headerTitleStyle: { color: colors.ink },
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: 'Notificações',
            headerBackTitle: 'Voltar',
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.plum,
            headerTitleStyle: { color: colors.ink },
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
