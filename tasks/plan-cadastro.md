# Implementation Plan: Ajustes no cadastro de itens

## Overview

Segunda fatia sobre a base de SQLite (ver [plan.md](plan.md), já concluído). Fecha as lacunas do cadastro antes de partir para notificações: (1) capturar os campos opcionais já suportados pelo schema mas ausentes na UI (loja, foto, quantidade, marca, observação, alerta), (2) permitir editar e excluir um item existente, (3) permitir mudar o `status` do item pelo fluxo definido no AGENTS.md (Pendente, Resolvido, Retirado, Trocado, Vencido).

## Architecture Decisions

- **[ATUALIZADO após [plan-router.md](plan-router.md)]** O app agora usa Expo Router de verdade. A ideia original de "um único modal de Detalhes" reaproveitado pra edição/exclusão/status **muda**: quando essa fase for retomada, o modal vira uma rota (`app/item/[id].tsx`), consistente com `app/all-items.tsx`. Confirmar com o usuário antes de implementar — texto abaixo mantido como registro histórico da decisão original.
- ~~Um único modal de "Detalhes do item" reaproveitado tanto pra edição quanto pra exclusão e troca de status, aberto ao tocar numa linha da lista — evita criar uma tela nova/rota separada nesta fase (app ainda não usa Expo Router para navegação real).~~
- **Campos opcionais entram direto no modal de cadastro** (não um formulário em duas etapas), já que a diretriz do AGENTS.md é "podem ser preenchidos depois" — isso continua verdade porque nenhum é obrigatório, só ficam disponíveis desde já em vez de forçar uma edição posterior pra usá-los.
- **Foto via `expo-image-picker`** (já instalado): apenas selecionar da galeria nesta fatia (sem câmera nem upload), guardando a URI local no campo `photoUri` já existente no schema.
- **Excluir é uma ação destrutiva com confirmação** (`Alert.alert` nativo, sem lib nova) antes de chamar `deleteItem`.
- **Troca de status é um seletor de chips** (Pendente/Resolvido/Retirado/Trocado/Vencido) dentro do modal de detalhes, gravando direto via `updateItem`. Não altera a badge de urgência da lista (decisão já registrada em [[03 - Decisoes/Registro de decisoes]] — status e urgência continuam separados).

## Task List

### Phase 1: Data layer

- [ ] Task 1: `updateItem` e `deleteItem` no repositório

### Checkpoint: Data layer
- [ ] `npx tsc --noEmit` limpo

### Phase 2: Cadastro com campos opcionais

- [ ] Task 2: Campos de texto opcionais no modal de cadastro (loja, quantidade, marca, observação, alerta)
- [ ] Task 3: Seleção de foto no cadastro (`expo-image-picker`)

### Checkpoint: Cadastro
- [ ] Manual: cadastrar item preenchendo todos os campos opcionais, confirmar que persistem

### Phase 3: Editar e excluir

- [ ] Task 4: Modal de detalhes do item (abre ao tocar na linha, campos pré-preenchidos)
- [ ] Task 5: Salvar edição (`updateItem`) a partir do modal de detalhes
- [ ] Task 6: Excluir item (`deleteItem`) com confirmação

### Checkpoint: Editar e excluir
- [ ] Manual: editar um item existente e confirmar mudança persiste; excluir um item e confirmar que some da lista e do banco

### Phase 4: Status

- [ ] Task 7: Seletor de status (chips) no modal de detalhes, gravando via `updateItem`

### Checkpoint: Complete
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Fluxo completo validado manualmente no Expo Go: cadastrar com campos opcionais → editar → mudar status → excluir
- [ ] Vault Obsidian e `tasks/todo-cadastro.md` atualizados
- [ ] Review com o usuário antes de seguir para notificações locais

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Permissão de galeria negada pelo usuário no `expo-image-picker` | Baixo | Tratar retorno de permissão negada sem crashar; foto continua opcional |
| Modal de detalhes ficar grande/confuso reaproveitando o layout do modal de cadastro | Médio | Reaproveitar os mesmos componentes de input, só trocar o texto do cabeçalho e adicionar status/excluir |
| `updateItem` divergir do formato de `insertItem` e duplicar lógica de mapeamento de linha | Baixo | Reaproveitar `mapRow`/tipos já existentes em `db/items.ts` |

## Open Questions

- A UI vai mostrar o `status` (workflow) em algum lugar da lista, ou só fica visível dentro do modal de detalhes? (Assumido: só no modal por enquanto, pra não conflitar com a badge de urgência já existente.)
