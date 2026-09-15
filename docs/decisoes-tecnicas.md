# Decisões técnicas

Registro cronológico das decisões, bugs relevantes e o raciocínio por trás deles durante o desenvolvimento do Vali. Este projeto também serve como estudo prático de React Native/Expo, então o objetivo aqui não é só dizer *o que* foi feito, mas *por quê* — inclusive os caminhos errados que geraram retrabalho.

Para o dia a dia do desenvolvimento (o quê foi implementado, critérios de aceite) ver a pasta [`tasks/`](../tasks). Este arquivo é o complemento: o histórico de decisões e problemas resolvidos que não cabem num checklist de tarefa.

## Nome e escopo do MVP

Nome escolhido: **Vali**. Escopo definido cedo e mantido: cadastro sem burocracia (só item e data de vencimento são obrigatórios; loja, foto, quantidade, marca, observação e alerta são opcionais), uso individual, offline-first (sem backend, sem custo recorrente) até validar o uso real.

## Stack

React Native + Expo + TypeScript, pra atender iOS e Android com uma única base de código. Persistência local em SQLite (`expo-sqlite`) e notificações locais (`expo-notifications`) — nenhuma dependência de servidor.

## Status do item vs. urgência visual

O status (Pendente, Resolvido, Retirado, Trocado, Vencido) fica salvo no banco. A urgência mostrada na lista (Urgente, Atenção, No prazo) **nunca é persistida** — é sempre calculada em tempo real a partir da data de vencimento. O protótipo inicial misturava os dois num campo só, o que gerava dessincronização (um item podia ficar com urgência errada depois de editado). Separar os dois conceitos resolveu isso de vez.

## Migração de modais para navegação real (Expo Router)

A primeira versão usava tudo dentro de um componente só, com modais — vários elementos não eram clicáveis e não existia botão/gesto de voltar nativo. Migrado para [Expo Router](https://docs.expo.dev/router/introduction/) (rotas baseadas em arquivo sobre um `Stack`): `app/_layout.tsx` (raiz), `app/index.tsx` (home), `app/all-items.tsx` (lista completa filtrável) e `app/item/[id].tsx` (detalhes/edição/exclusão/status).

## Troca de status é imediata, não fica pendente de "Salvar"

Tocar num chip de status já grava no banco na hora (com confirmação visual), sem esperar o botão "Salvar alterações" do formulário. Motivo: status é uma ação de workflow (o que aconteceu com o item no mundo real), não um dado de texto — não faz sentido ficar "pendente de salvar" misturado com o resto do formulário.

## Vencimento automático sem servidor

Item "Pendente" cuja data já passou vira "Vencido" sozinho — mas a checagem só roda quando a lista é carregada ou um item é aberto, porque o app não tem processo em background nem servidor. Status definidos manualmente (Resolvido/Retirado/Trocado) nunca são sobrescritos por essa checagem, só o "Pendente" default. As notificações locais cobrem o caso do app fechado (ver próxima seção).

## Notificações locais: a parte mais crítica do app

Decisão explícita de priorizar precisão sobre velocidade aqui, porque é a funcionalidade central do produto (um lembrete que não dispara na hora certa invalida o app inteiro). O plano inicial (1 lembrete fixo, sem deep-link) foi descartado e refeito com escopo maior:

- **Dois lembretes por item**: aviso antecipado com antecedência escolhida pelo usuário (atalhos de 1/3/5/7/10 dias ou valor digitado) às 9h, e um último aviso fixo no dia do vencimento às 8h, não configurável.
- **Deep-link obrigatório**: tocar na notificação abre direto no item certo, cobrindo os 3 cenários possíveis (app aberto, em background, e cold start — app totalmente fechado).
- Cada lembrete guarda o próprio id de notificação (`earlyNotificationId`, `finalNotificationId`) pra poder cancelar/reagendar de forma independente quando só um dos dois fatores muda (data ou antecedência).
- Toda a lógica de agendamento fica isolada em `lib/notifications.ts`; `db/items.ts` só persiste os IDs, sem importar `expo-notifications` — mesma separação usada no resto do projeto (camada de dados não conhece a camada de efeitos colaterais).
- Validado com um checklist de 12 cenários (permissão negada/concedida, cálculo dos horários, editar/desligar/excluir o alerta, disparo real, deep-link nos 3 cenários, som/vibração) num iPhone real via Expo Go.

## Bug real: `beforeRemove` do React Navigation não é confiável no native-stack

**Sintoma:** ao tentar confirmar descarte de uma edição não salva usando `navigation.addListener('beforeRemove', ...)` (a API "oficial" recomendada pela documentação do React Navigation), um teste em produção gerou um erro real: *"The screen 'item/[id]' was removed natively but didn't get removed from JS state... beforeRemove listener, which is not fully supported in native-stack."*

**Investigação:** a solução recomendada pela própria documentação, `usePreventRemove`, não está disponível publicamente via `expo-router` — existe só internamente, vendorizada, sem export público (confirmado direto na documentação oficial do React Navigation e do Expo Router). Ou seja: nem toda API "recomendada" pela documentação está de fato acessível pelo caminho que o projeto usa — vale sempre checar antes de depender dela.

**Solução:** assumir controle total do "voltar" na tela de detalhes, evitando o `beforeRemove` por completo:
- Gesto nativo de voltar desligado (`gestureEnabled: false` em `app/_layout.tsx`);
- Header customizado via `navigation.setOptions({ headerLeft: ... })`;
- `BackHandler` do React Native pro botão físico/gesto do Android;
- Tudo passando pelo mesmo handler (`handleBackPress`), que decide se sai direto ou pede confirmação de descarte com base num snapshot dos valores originais.

Validado com 5 cenários manuais (editar e tentar sair pelos 3 caminhos, confirmar e cancelar o descarte, salvar/excluir sem perguntar nada).

## Build nativo: por que Android primeiro

Depois da v0.2.0, decidimos gerar um instalador nativo de verdade (fora do Expo Go) pra testar em um aparelho físico. Duas plataformas, duas realidades:

- **Android**: gratuito. [EAS Build](https://docs.expo.dev/build/introduction/) compila na nuvem da Expo e devolve um `.apk` pronto pra instalar direto no aparelho (`eas.json`, profile `preview` com `android.buildType: "apk"`).
- **iOS**: exige a Apple Developer Program (US$ 99/ano, cobrança anual única, sem opção mensal). O caminho gratuito de 7 dias via Xcode exige um Mac, que não está disponível. Decisão: adiar a assinatura da Apple pro mês seguinte, quando o app estiver com o essencial pronto — não faz sentido pagar antes disso.

## Bug real: build nativo abria na tela errada

**Sintoma:** o primeiro `.apk` gerado abria direto na tela "Todos os itens" em vez da Home — sem nenhum botão de voltar (ou seja, virava a própria raiz da pilha de navegação). O mesmo código nunca apresentou esse problema rodando via Expo Go.

**Diagnóstico:** por eliminação junto com o usuário testando no aparelho real — não era um deep link do instalador nem de notificação (reproduzia mesmo abrindo pelo ícone do app, toda vez). A causa: o `Stack` em `app/_layout.tsx` nunca declarava explicitamente qual rota era a inicial. O Metro (usado em dev/Expo Go) tolera essa ambiguidade e resolve certo por convenção; o bundle estático gerado pra produção resolveu diferente.

**Correção:** declarar a rota inicial de forma explícita:

```tsx
<Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  {/* ...demais rotas */}
</Stack>
```

**Lição:** bugs de navegação podem só aparecer no build nativo de produção — testar exclusivamente pelo Expo Go não é garantia suficiente antes de publicar um build pra outra pessoa usar.

## Bug real: permissão de microfone pedida sem necessidade

Ao configurar o build, o Android passou a listar a permissão `android.permission.RECORD_AUDIO`, mesmo o app nunca gravando áudio. Causa: o plugin de configuração do `expo-image-picker` adiciona essa permissão por padrão, porque a biblioteca também suporta captura de vídeo (que precisaria de microfone) — mesmo o Vali usando só seleção de fotos da galeria. Corrigido desligando explicitamente essa opção no plugin:

```json
["expo-image-picker", { "photosPermission": "...", "microphonePermission": false }]
```

**Lição:** plugins de configuração do Expo costumam assumir o caso de uso mais amplo da biblioteca por padrão. Vale sempre revisar as permissões geradas (`app.json` após `eas init`/build) contra o que o app realmente faz.

## Distribuição do `.apk`: por que não vai pro Git

Binários grandes (um `.apk` costuma pesar dezenas de MB) não fazem sentido versionados no Git: não há diff útil entre duas versões, e cada build novo infla o histórico do repositório pra sempre. Decisão: publicar cada build relevante como asset de uma [GitHub Release](https://github.com/alisson290174-hue/Vali/releases), amarrada à tag de versão — fica acessível por link público e versionado, mas fora do histórico de commits.

## Local storage: implicações pro usuário

O app não tem nuvem, servidor, login ou sincronização — é 100% local, isolado no sandbox de armazenamento do próprio app no Android/iOS. Implicações verificadas e documentadas:
- Sobrevive a atualizações do app instaladas por cima da versão anterior.
- Funciona 100% offline, sempre.
- **Não sobrevive** a desinstalar o app, formatar o aparelho, ou trocar de aparelho sem um backup manual.

Essa é a motivação direta da Fase 3 do roadmap (exportar/importar backup, ver [`tasks/todo-ajustes-finos.md`](../tasks/todo-ajustes-finos.md)): como é a única rede de segurança contra perda de dados, o fluxo precisa ser o mais simples possível — idealmente um toque só pra exportar (direto pra folha de compartilhamento nativa) e um toque só pra importar (escolher arquivo, confirmar).
