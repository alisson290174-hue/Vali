# Vali

**Vali - validade sob controle**

Aplicativo mobile para promotores de vendas registrarem itens com validade curta por loja e receberem lembretes locais.

## Direcao do MVP

- Uso inicial individual.
- iOS e Android com React Native + Expo.
- Cadastro rapido: somente item e data de vencimento obrigatorios.
- Loja, foto, quantidade, marca, observacao e alerta sao opcionais.
- Funcionamento offline com armazenamento local.
- Status: Pendente, Resolvido, Retirado, Trocado e Vencido.
- Identidade visual em roxo, verde oliva, creme e coral.

## Desenvolvimento

```powershell
npm install
npx expo start
```

Abra o QR code com o Expo Go no iPhone conectado a mesma rede. O app ainda esta na fase de prototipo visual: o dashboard e o cadastro rapido funcionam em memoria; SQLite e notificacoes locais serao integrados na proxima fatia.

## Validacao

```powershell
npx tsc --noEmit
npx expo-doctor
```

A primeira versao nao usa servidor, login ou servicos pagos.
