# Implementation Plan: Migrar para Expo Router (navegação real)

## Overview

Hoje o Vali é um componente único (`App.tsx`, montado via `registerRootComponent` em `index.ts`) com tudo resolvido por `<Modal>` internos — cadastro e "ver todos" são overlays, sem rota, sem botão de voltar nativo, e vários elementos da home (cards de Visão geral, card Atenção hoje) não fazem nada ao tocar. Esta fatia migra pra Expo Router (já instalado, já listado em `app.json > plugins`, mas sem nenhuma rota criada ainda), dando telas de verdade com header e voltar nativos, e conecta os cards da home à lista completa já filtrada.

## Architecture Decisions

- **`app/` com Expo Router substitui `App.tsx` + `index.ts`.** `package.json > main` passa a ser `expo-router/entry`; o arquivo antigo `index.ts` e o `App.tsx` monolítico são removidos depois que o conteúdo for portado — não ficam como código morto.
- **Rotas desta fatia:** `app/_layout.tsx` (Stack raiz), `app/index.tsx` (home/dashboard, conteúdo atual do `App.tsx` menos o modal "ver todos"), `app/all-items.tsx` (a lista completa, hoje um `<Modal>`, vira rota push com header nativo e botão voltar).
- **Modal de "Novo item" continua sendo um `<Modal>` React Native dentro de `app/index.tsx`, não uma rota.** É um bottom-sheet de cadastro rápido, já tem X pra fechar e `onRequestClose` (fecha com o botão físico de voltar no Android) — comportamento equivalente a "voltar" pra esse caso. Vira rota só se isso incomodar na prática depois.
- **Filtro na tela "Todos os itens" via parâmetro de rota** (`useLocalSearchParams<{ filter?: string }>()`), reaproveitando os filtros que já existem (`Todos`, `Urgentes`, `Esta semana`) e adicionando `Pendentes` (por `status === 'Pendente'` no banco). Os cards da home navegam com `router.push('/all-items?filter=...')`.
- **Card "Lojas" não tem um filtro equivalente ainda** (não existe tela/conceito de loja separado, só o campo texto opcional). Por ora ele abre a lista completa sem filtro (`Todos`) — uma tela de lojas de verdade é a Fase 3 do `Plano do MVP` no vault, fora do escopo aqui.
- **Card "Atenção hoje" mapeia pro filtro `Urgentes`** (mesma semântica de urgência que já existe), em vez de criar um critério "vence hoje" novo nesta fatia.
- **Troca `SafeAreaView` de `react-native` pra `react-native-safe-area-context`** (já é dependência) nas telas migradas — resolve de graça o aviso de depreciação que já aparecia no log do Metro, e é o padrão esperado quando se usa Expo Router com `SafeAreaProvider`.
- **`tasks/todo-cadastro.md` (Fase 3, modal de detalhes de item) precisa ser revisitado**: como a decisão agora é navegação real, aquele modal de editar/excluir provavelmente vira uma rota (`app/item/[id].tsx`) quando chegarmos lá — não implementado nesta fatia, só anotado como decisão pendente pra não contradizer o plano anterior sem avisar.

## Task List

### Phase 1: Fundação do router

- [ ] Task 1: Scaffold mínimo do Expo Router (entry point, layout raiz, rota índice provisória)

### Checkpoint: Fundação
- [ ] `npx tsc --noEmit` limpo
- [ ] Manual: app abre no Expo Go mostrando a rota provisória, sem crash

### Phase 2: Portar a tela inicial

- [ ] Task 2: Mover o dashboard (header, cards, preview de registros, modal de cadastro) pra `app/index.tsx`
- [ ] Task 3: Remover `App.tsx` e `index.ts` antigos

### Checkpoint: Home portada
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual: home funciona igual a antes (cadastro rápido, preview, filtros) rodando via Expo Router

### Phase 3: Tela "Todos os itens" como rota

- [ ] Task 4: Criar `app/all-items.tsx` com header nativo e botão voltar, portando a lista completa
- [ ] Task 5: Conectar cards da home (Urgentes, Pendentes, Lojas, Atenção hoje) e o link "Ver todos" pra navegar com `router.push` e o filtro certo

### Checkpoint: Complete
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual no Expo Go: tocar em cada card leva pra lista certa, filtrada; botão/gesto de voltar nativo funciona em todas as telas; cadastro rápido continua funcionando
- [ ] Vault Obsidian e `tasks/todo-cadastro.md` (nota sobre Fase 3 virar rota) atualizados
- [ ] Review com o usuário antes de voltar pra editar/excluir/status

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Migração de entry point (`main`) quebrar o boot do app inteiro | Alto | Task 1 isolada só pra validar o scaffold mínimo antes de portar qualquer UI real; testável no Expo Go rapidamente |
| Perder o preview/filtro da home ao portar às pressas | Médio | Task 2 é só mover código, sem reescrever lógica — mesmo comportamento, arquivo novo |
| `SafeAreaView` trocado quebrar o layout visual (padding diferente) | Baixo | Conferir visualmente no Expo Go depois da troca, ajustar padding se necessário |

## Open Questions

- Quando a Fase 3 do `todo-cadastro.md` (editar/excluir) for retomada, o modal de detalhes vira rota `app/item/[id].tsx` — confirmar com o usuário nessa hora, não decidir sozinho agora.
