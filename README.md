# Vali

**Vali — validade sob controle**

[![Ultima versao](https://img.shields.io/github/v/release/alisson290174-hue/Vali?label=ultima%20vers%C3%A3o&sort=semver)](https://github.com/alisson290174-hue/Vali/releases/latest)

## Sobre o app

Promotores de vendas costumam cuidar de dezenas de itens de validade curta espalhados por varias lojas, e depender de memoria ou anotacoes soltas pra saber o que esta perto de vencer. O Vali resolve isso: um cadastro rapido (item + data de vencimento e pronto) e o app avisa sozinho, com notificacao local, antes do produto vencer — sem depender de internet, servidor ou login. Tudo fica salvo no proprio celular.

Projeto pessoal com dois objetivos: ser uma ferramenta real de uso diario e servir de estudo pratico de React Native/Expo.

## Como instalar (Android)

A versao mais recente pronta pra instalar fica sempre na pagina de **[Releases](https://github.com/alisson290174-hue/Vali/releases/latest)** deste repositorio, como um arquivo `.apk`.

1. Abra a [pagina de releases](https://github.com/alisson290174-hue/Vali/releases/latest) pelo navegador do celular/tablet Android e baixe o `.apk` da versao mais recente.
2. Ao tentar instalar, o Android pode avisar que a fonte e desconhecida — toque em "Configuracoes" nesse aviso e permita instalar a partir do navegador (so na primeira vez).
3. Conclua a instalacao normalmente. O icone do Vali aparece na tela como qualquer outro app.

Nao precisa de Play Store, conta ou internet pra usar depois de instalado — o app roda 100% local.

> iOS ainda nao tem instalador publico (exige conta paga da Apple Developer Program); esta nos planos para quando o app estiver mais completo.

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
