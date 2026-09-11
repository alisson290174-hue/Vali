# Projeto Vali

## Contexto

Vali e um app mobile para promotores de vendas registrarem itens com validade curta por loja. O fluxo deve ser rapido, offline-first e visualmente claro.

## Stack

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- Expo SQLite
- Expo Notifications
- Expo Image Picker
- date-fns
- lucide-react-native

## Regras

- Apenas item e data de vencimento sao obrigatorios.
- Todos os demais dados sao opcionais e podem ser preenchidos depois.
- A interface deve priorizar roxo, verde oliva, creme e coral para urgencias.
- Nao adicionar backend, login ou servicos pagos antes de validar o uso pessoal.
- Testar com `npx tsc --noEmit` e `npx expo-doctor` apos mudancas relevantes.
- Manter mudancas pequenas, testaveis e documentadas.
