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

## Backup: exportar/importar (v0.3.0)

Implementado em `lib/backup.ts` + `app/backup.tsx`, acessível por um ícone na home:

- **Exportar** (`exportBackup`) serializa todos os itens num JSON (com número de versão do formato e data de exportação), escreve num arquivo local via a API `File`/`Paths` do `expo-file-system`, e abre a folha de compartilhamento nativa (`expo-sharing`) — um toque, sem tela intermediária. O arquivo usa sempre o mesmo nome dentro do diretório de cache, então cada exportação sobrescreve a anterior em vez de acumular lixo.
- **Importar** foi dividido em duas funções (`pickAndParseBackup` + `applyBackup`) em vez de uma função só. Motivo: a tela precisa mostrar "isso vai adicionar N itens" *antes* de perguntar se o usuário confirma — e só dá pra saber o N depois de já ter lido e validado o arquivo. Separar "ler e validar" de "efetivamente inserir" resolve isso sem duas idas ao seletor de arquivos.
- A importação é **sempre aditiva**: cada item do backup vira um registro novo (id novo gerado na hora), nunca sobrescreve nada que já existia no aparelho. Um arquivo inválido/malformado é rejeitado por inteiro antes de qualquer inserção começar (a validação roda sobre o arquivo todo primeiro) — ou importa tudo, ou não importa nada.
- Detalhe fácil de esquecer: os campos `earlyNotificationId`/`finalNotificationId` guardados no backup **não** significam nada no aparelho de destino (são referências a notificações agendadas no sistema operacional de outro momento/aparelho). Por isso, depois de inserir cada item, o import chama `syncRemindersForItem` (a mesma função usada ao cadastrar/editar um item manualmente) pra agendar notificações de verdade nesse aparelho, em vez de só copiar ids que não apontam pra nada.

## Tela de lojas: agrupamento derivado, sem tabela nova

`store` sempre foi um campo de texto livre no item, não uma entidade própria (sem tabela `stores`, sem chave estrangeira). A tela de lojas (`app/stores.tsx`) segue a mesma filosofia já usada pra urgência e contagem de lojas: em vez de normalizar o dado no banco, agrupa os itens em memória a partir do texto (`lib/records.ts`: `groupByStore`), na hora de exibir. "Detalhes da loja" reaproveita `app/all-items.tsx` com um novo parâmetro de rota (`?store=Nome`), no mesmo padrão já usado pelo filtro `Historico` — evita criar uma tela de detalhe duplicada só pra repetir a mesma lista filtrada.

Efeito colateral aceito conscientemente: texto livre sem normalização permite duplicação por digitação inconsistente (`"Mercado Central"` vs `"mercado central"` viram grupos diferentes). Resolvido no nível de UX, não de schema: autocompletar (abaixo).

## Autocompletar loja com nomes já cadastrados

`ItemForm` ganhou um prop `knownStores: string[]` (calculado com `lib/records.ts`: `listStoreNames`, a partir dos itens já carregados nas telas de cadastro/edição). Ao focar ou digitar no campo Loja, aparecem até 5 sugestões que contêm o texto digitado (case-insensitive); tocar numa sugestão substitui o texto pelo nome exato já usado, evitando criar uma variação nova.

## Bug real: sugestão aparecia mas não recebia toque

**Sintoma:** a lista de sugestões renderizava normalmente, mas tocar numa sugestão não fazia nada — nem sempre, só quando o teclado estava aberto (o que é sempre o caso nesse fluxo, já que a sugestão só aparece enquanto o campo está focado).

**Causa:** comportamento padrão do `ScrollView` do React Native — com o teclado aberto, o primeiro toque em qualquer elemento que não seja o campo de texto focado é interceptado pra fechar o teclado, em vez de ser repassado ao componente tocado (`keyboardShouldPersistTaps` tem valor padrão `"never"`).

**Correção:** `keyboardShouldPersistTaps="handled"` nos `ScrollView` que envolvem o `ItemForm` (cadastro e edição) — faz o toque em qualquer elemento que já trata o próprio toque (como o `Pressable` da sugestão) ser repassado normalmente, sem fechar o teclado primeiro.

**Lição:** qualquer elemento tocável colocado dentro de um formulário com campos de texto (autocompletar, chips, botões próximos a um input) precisa ser testado com o teclado aberto — o comportamento padrão do scroll pode silenciosamente engolir o toque sem nenhum erro aparente.

## Testes automatizados (v0.4.0)

Configurado [`jest-expo`](https://github.com/expo/expo/tree/main/packages/jest-expo) (`npm test`). Escopo deliberadamente contido: cobre só `lib/records.ts` (funções puras — cálculo de urgência, máscara/validação de data, ordenação, agrupamento por loja, estatísticas, texto de compartilhamento, filtros) e a validação de arquivo de backup em `lib/backup.ts` (`isBackupFile`, exportada especificamente pra ser testável sem precisar mockar sistema de arquivos).

Não cobre telas nem as funções que mexem direto em SQLite/notificações/sistema de arquivos (`exportBackup`, `applyBackup`, `syncRemindersForItem`) — mockar esses módulos nativos teria um retorno pequeno perto do esforço pra um app pessoal; a validação dessas partes continua sendo o teste manual em dispositivo real, como sempre foi nesse projeto.

## Busca por nome

Campo de busca fixo no topo de `app/all-items.tsx`, filtrando por nome (case-insensitive) por cima do filtro/loja que já estava ativo na tela — não é uma tela nova nem uma rota nova, só mais uma camada de filtro client-side sobre os dados já carregados.

## Tela de estatísticas

`lib/records.ts`: `computeStats(records)` calcula contagens por status e uma taxa de "itens tratados a tempo" — definida como `(resolvidos + retirados + trocados) / (resolvidos + retirados + trocados + vencidos)`. Decisão deliberada de **não** tentar calcular métricas por período (ex.: "resolvidos este mês"): o schema não guarda quando um item mudou de status (só `createdAt`), então qualquer estatística "este mês" sobre resolução seria uma suposição sem lastro nos dados. Preferi uma métrica honesta e sempre correta a uma aproximação enganosa.

## Compartilhar itens pendentes de uma loja

Usa o `Share` do próprio React Native (não o `expo-sharing`, que exige um arquivo) pra compartilhar texto puro direto, sem precisar escrever um arquivo temporário. `lib/records.ts`: `buildStoreShareText` monta a mensagem a partir dos itens pendentes daquela loja, ordenados por urgência.

## Resumo diário por notificação: por que a contagem não é 100% ao vivo

Notificações locais recorrentes (`Notifications.SchedulableTriggerInputTypes.DAILY`, disparando todo dia no mesmo horário) têm o **conteúdo fixado no momento em que são agendadas** — não existe execução em segundo plano nesse app que recalcule o texto exatamente na hora do disparo. Solução adotada: reagendar a notificação (cancelar a anterior, recalcular a contagem, agendar de novo) toda vez que a home carrega (`lib/notifications.ts`: `syncDailySummary`), em vez de tentar manter um número perfeitamente ao vivo o dia inteiro. Isso significa que o número mostrado reflete o estado da última vez que o app foi aberto, não o momento exato do disparo — uma limitação aceita conscientemente, documentada no código.

A preferência e o id da notificação agendada ficam guardados numa tabela nova (`settings`, chave/valor genérica — `db/settings.ts`), com a mesma migração idempotente (`CREATE TABLE IF NOT EXISTS`) já usada pro resto do schema.

Tocar na notificação abre `/all-items?filter=Esta semana` em vez de um item específico — o deep-link (`useNotificationDeepLink` em `lib/notifications.ts`) agora distingue esse caso pelo campo `data.type` da notificação.

## Modo escuro: de cores estáticas pra um hook de tema

Antes, `lib/theme.ts` exportava um objeto `colors` fixo, importado e lido uma única vez por cada arquivo, no momento em que `StyleSheet.create({...})` rodava no escopo do módulo (fora de qualquer componente). Isso funciona bem pra um tema só, mas não reage a mudanças: trocar o tema em tempo de execução exige que os estilos sejam recalculados, o que só é possível se esse cálculo acontecer *dentro* do componente, a cada render.

**Mudança de arquitetura:** `lib/theme.ts` virou um hook, `useTheme()`, que escolhe entre `lightColors`/`darkColors` com base no `useColorScheme()` do sistema (sem interruptor manual — decisão deliberada, ver `docs` do vault). Isso exigiu tocar em praticamente toda tela/componente do app (10 arquivos): cada um passou a chamar `const colors = useTheme()` e mover seu `StyleSheet.create` pra dentro de uma função `createStyles(colors)`, memoizada com `useMemo(() => createStyles(colors), [colors])` — recalcula só quando o tema muda, não a cada render. `lib/status.ts` (que derivava cores de status a partir do `colors` estático) virou uma função `statusMeta(colors)` pelo mesmo motivo.

**Detalhe fácil de esquecer:** `app.json` tinha `"userInterfaceStyle": "light"`, uma configuração nativa que trava o app inteiro no modo claro *independente* do que `useColorScheme()` reportaria no JS. Sem mudar isso pra `"automatic"`, nada do trabalho acima teria efeito nenhum — o app simplesmente nunca veria o sistema estar no modo escuro. `StatusBar` também precisou trocar de `style="dark"` fixo pra `style="auto"` (deixa a própria biblioteca decidir claro/escuro).
