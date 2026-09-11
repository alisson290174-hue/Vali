# Todo: Migrar para Expo Router

Ver plano completo em [plan-router.md](plan-router.md).

## Phase 1: Fundação do router

### Task 1: Scaffold mínimo do Expo Router

**Description:** Trocar o entry point pra `expo-router/entry`, criar `app/_layout.tsx` com um `Stack` raiz e uma `app/index.tsx` provisória (placeholder), só pra validar que a migração de mecanismo funciona antes de portar a UI real.

**Acceptance criteria:**
- [x] `package.json > main` é `expo-router/entry`
- [x] `app/_layout.tsx` existe com `<Stack>` da `expo-router`
- [x] `app/index.tsx` provisória renderiza algo simples (ex.: um texto) sem crash

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: app abre no Expo Go mostrando a rota provisória

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `app/_layout.tsx`
- `app/index.tsx`

**Estimated scope:** Small: 2-3 files

---

## Checkpoint: Fundação
- [x] `npx tsc --noEmit` limpo
- [x] Manual: app abre no Expo Go mostrando a rota provisória, sem crash

## Phase 2: Portar a tela inicial

### Task 2: Mover o dashboard pra `app/index.tsx`

**Description:** Mover todo o conteúdo atual de `App.tsx` (header, card Atenção hoje, cards de Visão geral, preview de registros, modal de cadastro rápido) pra `app/index.tsx`, trocando `SafeAreaView` de `react-native` pra `react-native-safe-area-context`. Sem mudar comportamento — só trocando onde o código mora. A parte do modal "Ver todos" fica de fora (vai pra Task 4).

**Acceptance criteria:**
- [x] `app/index.tsx` renderiza a mesma home de antes (cadastro rápido com todos os campos opcionais, preview de registros, filtros)
- [x] `SafeAreaView` vem de `react-native-safe-area-context`, sem o aviso de depreciação no log

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: home funciona igual a antes

**Dependencies:** Task 1

**Files likely touched:**
- `app/index.tsx`

**Estimated scope:** Medium: 1 arquivo grande (bloco de JSX portado)

---

### Task 3: Remover `App.tsx` e `index.ts` antigos

**Description:** Depois que `app/index.tsx` estiver funcionando, apagar os arquivos que não são mais usados.

**Acceptance criteria:**
- [x] `App.tsx` e `index.ts` removidos
- [x] Nada mais referencia esses arquivos

**Verification:**
- [x] `npx tsc --noEmit`
- [x] `npx expo-doctor`

**Dependencies:** Task 2

**Files likely touched:**
- `App.tsx` (removido)
- `index.ts` (removido)

**Estimated scope:** Small: 2 files

---

## Checkpoint: Home portada
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Manual: home funciona igual a antes rodando via Expo Router

## Phase 3: Tela "Todos os itens" como rota

### Task 4: Criar `app/all-items.tsx`

**Description:** Portar o conteúdo do modal "Ver todos" pra uma rota de verdade, com header nativo (título + botão voltar do `Stack`) em vez de um `X` manual. Aceita filtro via `useLocalSearchParams<{ filter?: string }>()`.

**Acceptance criteria:**
- [x] Rota `/all-items` lista os itens ordenados por vencimento mais próximo
- [x] Parâmetro `filter` (`Todos`, `Urgentes`, `Esta semana`, `Pendentes`) filtra a lista corretamente; sem parâmetro, mostra tudo
- [x] Botão/gesto de voltar nativo volta pra home

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: abrir `/all-items` com cada filtro e conferir o resultado; voltar funciona

**Dependencies:** Task 3

**Files likely touched:**
- `app/all-items.tsx`

**Estimated scope:** Small: 1 file

---

### Task 5: Conectar os cards da home à navegação

**Description:** Cards de Visão geral (Urgentes, Pendentes, Lojas) e o card Atenção hoje ficam tocáveis, navegando pra `/all-items` com o filtro correspondente (Lojas e Atenção hoje mapeiam pra `Todos` e `Urgentes` respectivamente, ver decisão no plano). O link "Ver todos" também passa a usar `router.push` em vez do modal antigo.

**Acceptance criteria:**
- [x] Tocar em "Urgentes" abre `/all-items?filter=Urgentes`
- [x] Tocar em "Pendentes" abre `/all-items?filter=Pendentes`
- [x] Tocar em "Lojas" abre `/all-items` (sem filtro)
- [x] Tocar no card "Atenção hoje" abre `/all-items?filter=Urgentes`
- [x] "Ver todos" abre `/all-items` (sem filtro)

**Verification:**
- [x] `npx tsc --noEmit`
- [x] Manual: tocar em cada card e conferir que abre a lista certa

**Dependencies:** Task 4

**Files likely touched:**
- `app/index.tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Complete
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Manual no Expo Go: todos os cards navegam certo; voltar nativo funciona em todas as telas; cadastro rápido continua funcionando
- [x] Vault Obsidian atualizado
- [x] Nota adicionada em `tasks/todo-cadastro.md` sobre a Fase 3 (detalhes do item) virar rota
- [ ] Review com o usuário antes de retomar editar/excluir/status
