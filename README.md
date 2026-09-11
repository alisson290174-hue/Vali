# Vali

**Vali - validade sob controle**

Aplicativo mobile para promotores de vendas registrarem itens com validade curta por loja e receberem lembretes locais.

## Direcao do MVP

- Uso inicial individual.
- iOS e Android com React Native + Expo.
- Cadastro rapido: somente item e data de vencimento obrigatorios.
- Loja, foto, quantidade, marca, observacao e alerta sao opcionais.
- Funcionamento offline com armazenamento local (SQLite).
- Status: Pendente, Resolvido, Retirado, Trocado e Vencido (com transicao automatica pra Vencido quando a data passa).
- Notificacoes locais: aviso antecipado com antecedencia configuravel por item + aviso no dia do vencimento, com deep-link direto pro item.
- Identidade visual em roxo, verde oliva, creme e coral.

## Funcionalidades implementadas

- Cadastro rapido com todos os campos opcionais (loja, quantidade, marca, observacao, foto, alerta).
- Persistencia local em SQLite (sobrevive a fechar o app).
- Editar e excluir itens existentes.
- Mudar o status do item (Pendente, Resolvido, Retirado, Trocado, Vencido).
- Vencimento automatico: item pendente com data passada vira "Vencido" sozinho.
- Navegacao real com Expo Router (home, lista completa filtravel, tela de detalhes) com botao/gesto de voltar nativo.
- Notificacoes locais com dois lembretes por item e deep-link pro item certo.

## Desenvolvimento

```powershell
npm install
npx expo start
```

Abra o QR code com o Expo Go no celular conectado a mesma rede.

## Validacao

```powershell
npx tsc --noEmit
npx expo-doctor
```

A primeira versao nao usa servidor, login ou servicos pagos.
