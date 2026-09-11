import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';

export default function RootLayout() {
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
      </Stack>
    </SafeAreaProvider>
  );
}
