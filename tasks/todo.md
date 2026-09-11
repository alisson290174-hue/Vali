# Todo: Persistência local com Expo SQLite

Ver plano completo em [plan.md](plan.md).

## Phase 1: Foundation

### Task 1: Schema e conexão SQLite

**Description:** Criar o módulo de banco que abre a conexão SQLite e garante a tabela `items` (via `CREATE TABLE IF NOT EXISTS`), com `status` default `Pendente`.

**Acceptance criteria:**
- [x] `db/database.ts` exporta uma função `getDatabase()` que abre/retorna a instância via `expo-sqlite` (`openDatabaseAsync`)
- [x] Tabela `items` criada com colunas: `id`, `item` (NOT NULL), `expiryDate` (NOT NULL), `store`, `photoUri`, `quantity`, `brand`, `note`, `alertEnabled`, `status` (default `'Pendente'`), `createdAt`
- [x] Rodar o app não gera erro no console ao inicializar o banco *(confirmado no Expo Go, iPhone)*

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: `npx expo start`, abrir no Expo Go, checar log/console sem erro de SQLite

**Dependencies:** None

**Files likely touched:**
- `db/database.ts`
- `db/schema.ts` (ou inline em `database.ts`)

**Estimated scope:** Small: 1-2 files

---

### Task 2: Repositório de itens (CRUD)

**Description:** Criar funções de acesso a dados sobre a tabela `items`: listar todos, inserir um novo, (deixar update/delete como stubs tipados para fatia futura de status).

**Acceptance criteria:**
- [x] `listItems(): Promise<Item[]>` retorna todos os registros ordenados por `expiryDate`
- [x] `insertItem(input): Promise<Item>` grava um novo registro com `item` e `expiryDate` obrigatórios, resto opcional, `status` default `Pendente`
- [x] Tipo `Item` exportado e usado tanto no repositório quanto no App.tsx

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Teste manual isolado confirma dado persiste entre chamadas

**Dependencies:** Task 1

**Files likely touched:**
- `db/items.ts`
- `db/types.ts` (ou tipo dentro de `items.ts`)

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Foundation
- [x] `npx tsc --noEmit` limpo
- [x] `npx expo-doctor` sem erros novos
- [x] Banco abre e cria tabela sem crash

## Phase 2: Core Integration

### Task 3: Carregar itens do banco no boot do app

**Description:** Substituir `initialRecords`/`useState` fixo por carregamento assíncrono via `listItems()` num `useEffect`, com estado de loading simples.

**Acceptance criteria:**
- [x] `records` no App.tsx vem de `listItems()`, não mais de `initialRecords` hardcoded
- [x] Tela mostra estado vazio ou loading enquanto o banco não respondeu (sem crash/flash de dado fantasma)
- [x] Cálculo de urgência (`days`, badge Urgente/Atenção/No prazo) continua funcionando a partir de `expiryDate` real do banco

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: abrir app, lista carrega do banco

**Dependencies:** Task 2

**Files likely touched:**
- `App.tsx`

**Estimated scope:** Small: 1-2 files

---

### Task 4: Persistir criação de item no banco

**Description:** `addRecord` no App.tsx passa a chamar `insertItem` e atualizar a lista local a partir do retorno (ou recarregando via `listItems`), em vez de só mexer no `useState`.

**Acceptance criteria:**
- [x] Salvar um item no modal grava no SQLite (`insertItem`)
- [x] Lista na tela reflete o novo item sem precisar reabrir o app
- [x] Campos obrigatórios (`item`, `expiryDate`) continuam bloqueando o botão Salvar quando vazios (comportamento já existente preservado)

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: cadastrar item → aparece na lista → fechar e reabrir o Expo Go → item continua lá *(confirmado 2x pelo usuário, incluindo com múltiplos itens)*

**Dependencies:** Task 3

**Files likely touched:**
- `App.tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Core Integration
- [x] Fluxo manual completo: cadastrar → persistir → sobreviver a reload do app

## Phase 3: Polish

### Task 5: Seed controlado + remoção do estado fixo antigo

**Description:** Se a tabela `items` estiver vazia no primeiro boot, popular com os 3 registros de exemplo atuais (como seed único), em vez de mantê-los hardcoded no componente.

**Acceptance criteria:**
- [x] Seed roda só quando `listItems()` retorna vazio
- [x] Seed não roda de novo em boots subsequentes (não duplica registros)
- [x] `initialRecords` como array fixo é removido do App.tsx

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: apagar o app do Expo Go (ou limpar storage), reabrir, confirma seed aparece uma vez só *(não testado — cenário de baixo risco, seed já se comportou corretamente na primeira abertura)*

**Dependencies:** Task 4

**Files likely touched:**
- `db/items.ts` ou `db/seed.ts`
- `App.tsx`

**Estimated scope:** Small: 1-2 files

---

### Task 6: Atualizar README.md

**Description:** Atualizar a seção de status do README para refletir que SQLite está integrado e notificações locais continuam pendentes.

**Acceptance criteria:**
- [x] Frase "o dashboard e o cadastro rapido funcionam em memoria; SQLite... na proxima fatia" atualizada para refletir a nova realidade

**Verification:**
- [x] Leitura manual do README atualizado

**Dependencies:** Task 5

**Files likely touched:**
- `README.md`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Complete
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Fluxo end-to-end validado manualmente no Expo Go (usuário testou no iPhone via VS Code + túnel de porta corrigido no firewall)
- [x] README reflete o estado real do projeto
- [ ] Review com o usuário antes de seguir para notificações locais
