# Todo: Ajustes no cadastro de itens

Ver plano completo em [plan-cadastro.md](plan-cadastro.md). Continuação de [todo.md](todo.md) (SQLite, concluído).

## Phase 1: Data layer

### Task 1: `updateItem` e `deleteItem` no repositório

**Description:** Adicionar ao `db/items.ts` as funções que faltam pra editar e remover um registro existente.

**Acceptance criteria:**
- [x] `updateItem(id, patch: Partial<NewItemInput & { status: ItemStatus }>): Promise<Item>` atualiza só os campos informados e retorna o item atualizado
- [x] `deleteItem(id: string): Promise<void>` remove o registro pelo id
- [x] Nenhuma das duas altera `createdAt`

**Verification:**
- [x] `npx tsc --noEmit`

**Dependencies:** None

**Files likely touched:**
- `db/items.ts`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Data layer
- [x] `npx tsc --noEmit` limpo

## Phase 2: Cadastro com campos opcionais

### Task 2: Campos de texto opcionais no modal de cadastro

**Description:** Adicionar inputs opcionais no modal "Registro rápido": loja, quantidade, marca, observação, e um toggle de alerta. `addRecord` passa a enviar esses valores pro `insertItem`.

**Acceptance criteria:**
- [x] Modal mostra os novos campos abaixo de item/data, todos claramente opcionais (sem bloquear o botão Salvar)
- [x] Valores preenchidos são gravados no banco (`store`, `quantity`, `brand`, `note`, `alertEnabled`)
- [x] Campos em branco continuam sendo salvos como `null`/`false`, sem quebrar o cadastro rápido só-item-e-data

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: cadastrar um item preenchendo todos os campos e outro só com item+data *(pendente)*

**Dependencies:** Task 1

**Files likely touched:**
- `App.tsx`

**Estimated scope:** Small: 1 file

---

### Task 3: Seleção de foto no cadastro

**Description:** Botão no modal pra escolher uma foto da galeria via `expo-image-picker`, mostrando uma miniatura antes de salvar e gravando a URI em `photoUri`.

**Acceptance criteria:**
- [x] Botão abre o seletor de imagens do `expo-image-picker`
- [x] Miniatura da foto escolhida aparece no modal antes de salvar
- [x] Permissão negada não quebra o fluxo (mensagem simples, cadastro continua funcionando sem foto)
- [x] `photoUri` é salvo no banco quando uma foto é escolhida

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: cadastrar item com foto e confirmar que persiste *(pendente)*

**Dependencies:** Task 2

**Files likely touched:**
- `App.tsx`

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Cadastro
- [ ] Manual: cadastrar item preenchendo todos os campos opcionais (incluindo foto), confirmar que persistem após reabrir o app

## Phase 3: Editar e excluir

### Task 4: Modal de detalhes do item

**Description:** ~~Tocar numa linha da lista abre um modal de detalhes~~ **[ATUALIZADO]** Tocar numa linha da lista abre a rota `app/item/[id].tsx` (ver [plan-router.md](plan-router.md) — projeto migrou de modais pra Expo Router), com os campos pré-preenchidos reaproveitando o `ItemForm` do cadastro.

**Acceptance criteria:**
- [x] `ExpiryRow` fica tocável (`Pressable`) e navega pra `/item/[id]` com os dados do item selecionado
- [x] Tela mostra todos os campos (obrigatórios e opcionais) já preenchidos
- [x] Voltar sem salvar não altera nada no banco

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: tocar em um item da lista e ver a tela abrir com os dados corretos

**Dependencies:** Task 3

**Files likely touched:**
- `app/item/[id].tsx`, `components/ItemForm.tsx`, `components/ExpiryRow.tsx`

**Estimated scope:** Medium: vários arquivos pequenos

---

### Task 5: Salvar edição

**Description:** Botão "Salvar alterações" na tela de detalhes chama `updateItem` e volta pra tela anterior.

**Acceptance criteria:**
- [x] Editar qualquer campo e salvar atualiza o registro no banco
- [x] Voltar pra lista reflete a mudança (recarrega ao montar a tela)
- [x] Item continua exigindo `item` e `expiryDate` preenchidos pra salvar

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: editar um item, salvar, fechar/reabrir o app, confirmar que a mudança persistiu

**Dependencies:** Task 4

**Files likely touched:**
- `app/item/[id].tsx`, `db/items.ts`

**Estimated scope:** Small: 1 file

---

### Task 6: Excluir item

**Description:** Botão "Excluir" na tela de detalhes, com confirmação (`Alert.alert`) antes de chamar `deleteItem`.

**Acceptance criteria:**
- [x] Excluir pede confirmação antes de apagar
- [x] Confirmando, o item some da lista e do banco (some mesmo após fechar/reabrir o app)
- [x] Cancelar a confirmação não altera nada

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: excluir um item e confirmar que não volta após reabrir o app

**Dependencies:** Task 5

**Files likely touched:**
- `app/item/[id].tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Editar e excluir
- [x] Manual: editar um item existente e confirmar que a mudança persiste; excluir um item e confirmar que ele some de vez

## Phase 4: Status

### Task 7: Seletor de status na tela de detalhes

**Description:** Chips com as 5 opções de status (Pendente, Resolvido, Retirado, Trocado, Vencido) na tela de detalhes. **[ATUALIZADO a pedido do usuário]** grava na hora ao tocar (não depende mais do botão "Salvar alterações"), com cor/ícone por status e confirmação visual — ver [[03 - Decisoes/Registro de decisoes]].

**Acceptance criteria:**
- [x] Chip do status atual do item aparece selecionado ao abrir a tela
- [x] Tocar em outro chip e salvar atualiza o status no banco
- [x] Badge de urgência na lista continua calculada pela data, sem se misturar com o status

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: mudar o status de um item e confirmar que persiste após reabrir o app *(pendente)*

**Dependencies:** Task 6

**Files likely touched:**
- `app/item/[id].tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Complete
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Fluxo completo validado manualmente no Expo Go: cadastrar com campos opcionais → editar → mudar status → excluir *(pendente)*
- [ ] Vault Obsidian atualizado (diário + plano do MVP) *(pendente até validar manualmente)*
- [ ] Review com o usuário antes de seguir para notificações locais
