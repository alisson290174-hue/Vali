# Implementation Plan: Notificações locais

**Esta é a parte mais importante do app** (definição do usuário) — prioridade em cima de tudo é acerto, não velocidade. Plano revisado depois de decisões explícitas do usuário (substitui a v1, que ainda não tinha nada implementado).

## Overview

O toggle "Alerta" já existe no cadastro/edição (`alertEnabled`), mas é um campo morto. Esta fatia usa `expo-notifications` (já instalado) pra agendar **dois** lembretes locais por item: um aviso antecipado (antecedência escolhida pelo usuário) e um último aviso no próprio dia do vencimento. Tocar na notificação leva direto pro item. É também a peça que cobre o caso "app fechado" — o vencimento automático (`applyAutoExpiry`) só roda com o app aberto.

## Architecture Decisions

- **Dois lembretes por item:**
  - **Aviso antecipado** — `reminderDaysBefore` dias antes do vencimento, às 9h. Configurável pelo usuário no cadastro/edição (campo novo), com atalhos rápidos (1/3/5/7 dias) e entrada manual. Default 3 dias quando o alerta é ligado pela primeira vez.
  - **Último aviso** — sempre no dia do vencimento, às 8h (fixo, não configurável — é o "hoje vence", não faz sentido variar).
  - Cada um guarda seu próprio id de notificação agendada (`earlyNotificationId`, `finalNotificationId`) pra poder cancelar/reagendar independentemente.
- **`lib/notifications.ts` concentra toda a lógica** (permissão, canal Android, agendar os 2, cancelar, ressincronizar, deep-link). `db/items.ts` continua só persistindo os campos novos (`reminderDaysBefore`, `earlyNotificationId`, `finalNotificationId`) sem saber que `expo-notifications` existe — quem orquestra é a UI, chamando `syncRemindersForItem`.
- **Migração idempotente** de 3 colunas novas na tabela `items` (`ALTER TABLE` só se a coluna não existir, via `PRAGMA table_info`), porque a tabela já existe em instalações atuais.
- **Se a data calculada de um lembrete (antecipado ou final) já passou**, esse lembrete específico não é agendado — sem erro, sem notificação atrasada disparando na hora. Os dois são independentes: pode faltar o antecipado mas o final ainda ser agendado (ex.: usuário liga o alerta faltando 1 dia pro vencimento).
- **Deep-link:** notificação carrega `data: { itemId }`. Um listener central em `app/_layout.tsx` escuta resposta a notificação (app aberto/background) **e** verifica `getLastNotificationResponseAsync()` no boot (cobre o caso do app estar fechado e abrir pelo toque na notificação) — ambos os casos levam pra `/item/[id]`.
- **Canal de notificação Android configurado explicitamente** (importância alta, com som) — sem isso o Android pode silenciar/atrasar a notificação, o que seria inaceitável pra "a parte mais importante do app".
- **Expo Go suporta notificação local normalmente.** A restrição do Expo Go (desde SDK 53) é só push remoto via serviço da Expo — não é o nosso caso.

## Task List

### Phase 1: Fundação (schema + permissão + canal)

- [ ] Task 1: Migração de schema (`reminderDaysBefore`, `earlyNotificationId`, `finalNotificationId`)
- [ ] Task 2: Configuração base do `expo-notifications` (handler, permissão, canal Android)

### Checkpoint: Fundação
- [ ] `npx tsc --noEmit` limpo
- [ ] Manual: app abre sem crash, banco migra sem erro, permissão é pedida

### Phase 2: Campo de antecedência na UI

- [ ] Task 3: Campo "avisar com quantos dias de antecedência" no `ItemForm` (visível só com alerta ligado)

### Phase 3: Agendamento (2 lembretes) + deep-link

- [ ] Task 4: `scheduleEarlyReminder` / `scheduleFinalReminder` / `cancelReminder` / `syncRemindersForItem` em `lib/notifications.ts`
- [ ] Task 5: Listener de resposta à notificação (deep-link, app aberto + cold start) em `app/_layout.tsx`

### Checkpoint: Motor de notificação
- [ ] `npx tsc --noEmit` limpo
- [ ] Teste manual isolado: agendar os 2, cancelar, tocar numa notificação de teste e confirmar que navega pro item certo

### Phase 4: Integração no cadastro/edição/exclusão

- [ ] Task 6: Integrar no cadastro (`app/index.tsx`)
- [ ] Task 7: Integrar na edição e exclusão (`app/item/[id].tsx`)

### Checkpoint: Integração
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual: criar/editar (data e antecedência)/excluir com alerta ligado agenda e cancela certo nos dois lembretes

### Phase 5: Config nativa e validação minuciosa

- [ ] Task 8: Plugin `expo-notifications` no `app.json` (ícone, cor, canal Android)
- [ ] Task 9: Validação manual minuciosa (checklist detalhado abaixo)

### Checkpoint: Complete
- [ ] Todos os itens do checklist de validação da Task 9 passaram
- [ ] Vault Obsidian atualizado
- [ ] Review com o usuário

## Checklist de validação (Task 9) — 100% passado

- [x] Permissão negada: app não crasha, aviso claro pro usuário ("notificações estão desligadas")
- [x] Permissão concedida: os 2 lembretes agendam certo
- [x] Item cadastrado com vencimento distante + antecedência: horários calculados corretamente
- [x] Editar a data do item: reagenda sem erro
- [x] Desligar o alerta: cancela, sem reagendar
- [x] Excluir o item: cancela os lembretes
- [x] Notificação chega de verdade no celular (validado com um botão de teste temporário, removido depois)
- [x] Tocar na notificação com o app aberto: navega pro item certo
- [x] Tocar na notificação com o app em background: navega pro item certo
- [x] Tocar na notificação com o app fechado (cold start): abre direto no item certo
- [x] Som/vibração da notificação funciona

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Migração de 3 colunas falhar ou duplicar em reaberturas | Médio | `PRAGMA table_info(items)` antes de cada `ALTER TABLE`, uma checagem por coluna, idempotente |
| Cold start (notificação abre o app do zero) não navegar corretamente porque o Router ainda não montou | Alto | Checar `getLastNotificationResponseAsync()` só depois do layout raiz montar, com um pequeno delay/retry se necessário; testar explicitamente esse caso (item do checklist) |
| Usuário negar permissão de notificação | Baixo | Tratado sem crash; aviso visível, não silencioso |
| Testar "dias de antecedência" sem esperar dias de verdade | Médio | Validar o **horário calculado** (log) em vez de esperar o disparo real pro caso de dias; só o teste de "chega de verdade" usa um item com vencimento em minutos |

## Open Questions

- Nenhuma pendente — antecedência configurável, deep-link e dois lembretes foram decisões explícitas do usuário nesta conversa.
