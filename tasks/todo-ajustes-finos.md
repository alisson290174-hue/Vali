# Todo: Ajustes finos (pós-v0.1.0)

Ver plano completo em [plan-ajustes-finos.md](plan-ajustes-finos.md).

## Phase 1: Melhorias isoladas

### Task 1: Validação real de data

**Description:** `lib/records.ts` ganha `isValidExpiryDate(value: string): boolean` (constrói `Date` nativo e confere se dia/mês/ano batem — pega casos como 31/02). `ItemForm` mostra um erro inline quando o campo está completo (10 caracteres) e a data é inválida; `app/index.tsx` e `app/item/[id].tsx` bloqueiam salvar nesse caso.

**Acceptance criteria:**
- [x] `isValidExpiryDate('31/02/2026')` retorna `false`; `isValidExpiryDate('28/02/2026')` retorna `true`
- [x] Erro só aparece com o campo completo (não incomoda no meio da digitação)
- [x] Botão salvar fica desabilitado quando a data está incompleta ou inválida

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: digitar uma data inválida no cadastro e na edição

**Dependencies:** None

**Files likely touched:**
- `lib/records.ts`, `components/ItemForm.tsx`, `app/index.tsx`, `app/item/[id].tsx`

**Estimated scope:** Medium: 4 files

---

### Task 2: Pull-to-refresh

**Description:** `RefreshControl` nos `FlatList` de `app/index.tsx` (preview), `app/all-items.tsx` e `app/notifications.tsx`, reaproveitando a função de carregamento já usada no `useFocusEffect`.

**Acceptance criteria:**
- [x] Puxar pra baixo em cada uma das 3 listas mostra o indicador de carregamento e recarrega os dados
- [x] Não quebra o comportamento existente de recarregar ao focar a tela

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: puxar pra atualizar nas 3 telas

**Dependencies:** None

**Files likely touched:**
- `app/index.tsx`, `app/all-items.tsx`, `app/notifications.tsx`

**Estimated scope:** Small: 3 files

---

### Task 3: Acessibilidade

**Description:** Adicionar `accessibilityLabel`/`accessibilityRole="button"` nos elementos tocáveis que ainda não têm: chips de filtro e de status, cards da Visão Geral, card "Atenção hoje", botões de foto/salvar/excluir/fechar, linhas da lista (`ExpiryRow`, com rótulo combinando nome + urgência + data).

**Acceptance criteria:**
- [x] Todo `Pressable` interativo relevante tem `accessibilityLabel` descritivo
- [x] `ExpiryRow` anuncia nome do item, urgência e data de vencimento num rótulo só

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: ativar VoiceOver (iOS) e navegar pela home e por um item, conferir se os rótulos fazem sentido *(pendente)*

**Dependencies:** None

**Files likely touched:**
- `app/index.tsx`, `app/all-items.tsx`, `app/notifications.tsx`, `app/item/[id].tsx`, `components/ExpiryRow.tsx`, `components/ItemForm.tsx`

**Estimated scope:** Medium: 6 files, mudanças pequenas e repetitivas

---

## Checkpoint: Fase 1
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Manual: data inválida bloqueada; pull-to-refresh nas 3 telas; editar data de item existente funciona (apagar tudo/apagar do final)

## Phase 2: Confirmar descarte

### Task 4: Interceptar saída com alterações não salvas

**Description:** Em `app/item/[id].tsx`, guardar um snapshot dos valores carregados; comparar com os valores atuais pra saber se há mudança (`isDirty`). **[REESCRITO]** A abordagem original (`useNavigation().addListener('beforeRemove', ...)`) causava um erro real do native-stack ("removed natively but didn't get removed from JS state") quando cancelado via gesto/header nativos. Trocado por controle total do "voltar" nessa tela: gesto nativo desligado (`gestureEnabled: false` em `app/_layout.tsx`), header customizado via `navigation.setOptions({ headerLeft: ... })`, e `BackHandler` pro botão físico do Android — tudo passando pelo mesmo `handleBackPress`, que decide se sai direto ou confirma descarte.

**Acceptance criteria:**
- [x] Editar um campo e tentar voltar (botão do cabeçalho ou físico do Android) pede confirmação
- [x] "Continuar editando" cancela a navegação, nada é perdido
- [x] "Descartar" navega de volta sem salvar
- [x] Salvar ou excluir navegam de volta sem pedir confirmação
- [x] Voltar sem ter mudado nada não pede confirmação

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: os 5 cenários acima (confirmado pelo usuário, sem o erro do native-stack)

**Dependencies:** None (independente da Fase 1)

**Files likely touched:**
- `app/item/[id].tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Fase 2
- [x] `npx tsc --noEmit` limpo
- [x] Manual: os 5 cenários da Task 4 confirmados

## Ajustes extras (fora do plano original, pedidos durante os testes)

- [x] Quantidade no cadastro/edição: campo só aceita número, sem "un." fixo (seeds corrigidos, placeholder atualizado)
- [x] Status "Vencido" só fica selecionável quando o item já passou da data (antes dava pra marcar Vencido num item ainda dentro da validade)
- [x] Modal de "Novo item" (X e botão físico) também confirma descarte se já tiver algo preenchido — mesma proteção da Fase 2, mas pro cadastro
- [x] Alerta liga por padrão ao cadastrar, com antecedência padrão de 10 dias (chip "10 dias" adicionado)
- [x] Aviso quando a antecedência escolhida é maior que os dias restantes (o aviso antecipado não chegaria a tempo) — e isso agora **bloqueia** salvar, não só avisa
- [x] Aviso ao tentar digitar mais de 99 dias de antecedência
- [x] Antecedência padrão se ajusta sozinha quando a data cadastrada é mais curta que o padrão (evita travar o salvar sem o usuário entender por quê)

## Phase 3: Backup (exportar/importar)

### Task 5: Instalar dependências

**Description:** `npx expo install expo-file-system expo-sharing expo-document-picker`. Validar que o app continua abrindo normalmente antes de escrever qualquer lógica em cima.

**Acceptance criteria:**
- [x] Dependências instaladas nas versões compatíveis com o SDK do projeto
- [x] `npx expo-doctor` sem novos erros

**Verification:**
- [x] `npx expo-doctor`
- [x] Manual: reiniciar o servidor e abrir o app, sem crash

**Dependencies:** None

**Files likely touched:**
- `package.json`, `package-lock.json`

**Estimated scope:** Small: dependências apenas

---

### Task 6: Exportar dados

**Description:** `lib/backup.ts`: `exportBackup(): Promise<void>` — serializa todos os itens (`listItems()`) num JSON com um cabeçalho simples (versão do formato + data de exportação), escreve num arquivo temporário (`expo-file-system`) e abre a folha de compartilhamento nativa (`expo-sharing`).

**Acceptance criteria:**
- [x] Gera um arquivo `.json` válido com todos os itens
- [x] Abre a folha de compartilhamento do sistema
- [x] Não deixa arquivo temporário obsoleto acumulando (reaproveita o mesmo nome/local a cada exportação)

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: exportar e conferir o conteúdo do arquivo gerado

**Dependencies:** Task 5

**Files likely touched:**
- `lib/backup.ts`

**Estimated scope:** Small: 1 file

---

### Task 7: Importar dados

**Description:** `lib/backup.ts`: **[AJUSTADO]** separado em `pickAndParseBackup(): Promise<BackupFile | null>` (escolhe o arquivo, lê e valida a estrutura, retorna `null` se cancelado) e `applyBackup(backup): Promise<{ imported: number; permissionDenied: boolean }>` (insere de fato) — split necessário pra tela poder mostrar "vai adicionar N itens" antes de confirmar (Task 8). Cada item importado também é resincronizado com `syncRemindersForItem`, então as notificações reais são reagendadas nesse aparelho, não só os dados copiados.

**Acceptance criteria:**
- [x] Arquivo válido: todos os itens são inseridos como novos registros
- [x] Arquivo inválido/malformado: nada é inserido, erro claro é sinalizado
- [x] Cancelar a escolha do arquivo não faz nada (sem erro)

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: importar um arquivo exportado pela Task 6, e depois testar um arquivo inválido de propósito

**Dependencies:** Task 6

**Files likely touched:**
- `lib/backup.ts`

**Estimated scope:** Small: 1 file

---

### Task 8: Tela de backup + acesso pela home

**Description:** Nova rota `app/backup.tsx` com dois botões ("Exportar backup" / "Importar backup"), mostrando quantos itens existem hoje e (após importar) quantos foram adicionados. Ícone de engrenagem na home (ao lado do sino) navega pra essa tela. Registrar a rota no `app/_layout.tsx` com header nativo.

**Acceptance criteria:**
- [x] Ícone de engrenagem visível e tocável na home
- [x] Tela mostra contagem atual de itens e os dois botões
- [x] Exportar e importar funcionam a partir da tela (usando `lib/backup.ts`)
- [x] Importar mostra confirmação antes de inserir ("isso vai adicionar N itens aos seus itens atuais")

**Verification:**
- [x] `npx tsc --noEmit` e `npx expo-doctor`
- [x] Manual: fluxo completo exportar → importar de volta, conferir que os itens dobraram (comportamento aditivo esperado) e nenhum dado antigo sumiu — confirmado pelo usuário

**Dependencies:** Task 7

**Files likely touched:**
- `app/backup.tsx`, `app/_layout.tsx`, `app/index.tsx`

**Estimated scope:** Medium: 3 files

---

## Checkpoint: Complete
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Fluxo completo de backup validado manualmente (exportar → importar) — "deu certo"
- [x] Vault Obsidian atualizado
- [x] Review com o usuário
