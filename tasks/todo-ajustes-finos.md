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

**Description:** Em `app/item/[id].tsx`, guardar um snapshot dos valores carregados; comparar com os valores atuais pra saber se há mudança (`isDirty`). Usar `useNavigation().addListener('beforeRemove', ...)` pra interceptar voltar (botão, gesto, header) e mostrar `Alert` com "Continuar editando" / "Descartar" quando `isDirty`. `handleSave` e `handleDelete` sinalizam um bypass antes de chamar `router.back()`, pra não disparar o aviso nessas saídas intencionais.

**Acceptance criteria:**
- [ ] Editar um campo e tentar voltar (botão nativo ou gesto) pede confirmação
- [ ] "Continuar editando" cancela a navegação, nada é perdido
- [ ] "Descartar" navega de volta sem salvar
- [ ] Salvar ou excluir navegam de volta sem pedir confirmação
- [ ] Voltar sem ter mudado nada não pede confirmação

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Manual: os 5 cenários acima

**Dependencies:** None (independente da Fase 1)

**Files likely touched:**
- `app/item/[id].tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Fase 2
- [ ] `npx tsc --noEmit` limpo
- [ ] Manual: os 5 cenários da Task 4 confirmados

## Phase 3: Backup (exportar/importar)

### Task 5: Instalar dependências

**Description:** `npx expo install expo-file-system expo-sharing expo-document-picker`. Validar que o app continua abrindo normalmente antes de escrever qualquer lógica em cima.

**Acceptance criteria:**
- [ ] Dependências instaladas nas versões compatíveis com o SDK do projeto
- [ ] `npx expo-doctor` sem novos erros

**Verification:**
- [ ] `npx expo-doctor`
- [ ] Manual: reiniciar o servidor e abrir o app, sem crash

**Dependencies:** None

**Files likely touched:**
- `package.json`, `package-lock.json`

**Estimated scope:** Small: dependências apenas

---

### Task 6: Exportar dados

**Description:** `lib/backup.ts`: `exportBackup(): Promise<void>` — serializa todos os itens (`listItems()`) num JSON com um cabeçalho simples (versão do formato + data de exportação), escreve num arquivo temporário (`expo-file-system`) e abre a folha de compartilhamento nativa (`expo-sharing`).

**Acceptance criteria:**
- [ ] Gera um arquivo `.json` válido com todos os itens
- [ ] Abre a folha de compartilhamento do sistema
- [ ] Não deixa arquivo temporário obsoleto acumulando (reaproveita o mesmo nome/local a cada exportação)

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Manual: exportar e conferir o conteúdo do arquivo gerado

**Dependencies:** Task 5

**Files likely touched:**
- `lib/backup.ts`

**Estimated scope:** Small: 1 file

---

### Task 7: Importar dados

**Description:** `lib/backup.ts`: `importBackup(): Promise<{ imported: number } | null>` — abre o seletor de arquivos (`expo-document-picker`), lê e valida o JSON (estrutura mínima esperada), insere cada item como um registro novo (id novo, sem sobrescrever nada). Retorna `null` se o usuário cancelar a escolha do arquivo.

**Acceptance criteria:**
- [ ] Arquivo válido: todos os itens são inseridos como novos registros
- [ ] Arquivo inválido/malformado: nada é inserido, erro claro é sinalizado
- [ ] Cancelar a escolha do arquivo não faz nada (sem erro)

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Manual: importar um arquivo exportado pela Task 6, e depois testar um arquivo inválido de propósito

**Dependencies:** Task 6

**Files likely touched:**
- `lib/backup.ts`

**Estimated scope:** Small: 1 file

---

### Task 8: Tela de backup + acesso pela home

**Description:** Nova rota `app/backup.tsx` com dois botões ("Exportar backup" / "Importar backup"), mostrando quantos itens existem hoje e (após importar) quantos foram adicionados. Ícone de engrenagem na home (ao lado do sino) navega pra essa tela. Registrar a rota no `app/_layout.tsx` com header nativo.

**Acceptance criteria:**
- [ ] Ícone de engrenagem visível e tocável na home
- [ ] Tela mostra contagem atual de itens e os dois botões
- [ ] Exportar e importar funcionam a partir da tela (usando `lib/backup.ts`)
- [ ] Importar mostra confirmação antes de inserir ("isso vai adicionar N itens aos seus itens atuais")

**Verification:**
- [ ] `npx tsc --noEmit` e `npx expo-doctor`
- [ ] Manual: fluxo completo exportar → importar de volta, conferir que os itens dobraram (comportamento aditivo esperado) e nenhum dado antigo sumiu

**Dependencies:** Task 7

**Files likely touched:**
- `app/backup.tsx`, `app/_layout.tsx`, `app/index.tsx`

**Estimated scope:** Medium: 3 files

---

## Checkpoint: Complete
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Fluxo completo de backup validado manualmente (exportar → importar)
- [ ] Vault Obsidian atualizado
- [ ] Review com o usuário
