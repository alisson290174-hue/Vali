# Todo: Notificações locais

Ver plano completo em [plan-notificacoes.md](plan-notificacoes.md). **Parte mais importante do app — precisão acima de velocidade.**

## Phase 1: Fundação

### Task 1: Migração de schema

**Description:** Adicionar `reminderDaysBefore INTEGER`, `earlyNotificationId TEXT`, `finalNotificationId TEXT` na tabela `items`, de forma idempotente (`PRAGMA table_info(items)` antes de cada `ALTER TABLE`).

**Acceptance criteria:**
- [x] Banco novo já nasce com as 3 colunas
- [x] Banco existente (sem elas) ganha as 3 sem erro ao abrir o app
- [x] Rodar de novo (app reaberto) não duplica nem quebra nada
- [x] `Item`/`ItemRow`/`NewItemInput` ganham os campos correspondentes (`reminderDaysBefore: number | null`, `earlyNotificationId: string | null`, `finalNotificationId: string | null`)

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: abrir o app com o banco já existente das fatias anteriores, sem crash *(pendente)*

**Dependencies:** None

**Files likely touched:**
- `db/database.ts`, `db/types.ts`, `db/items.ts`

**Estimated scope:** Small: 2-3 files

---

### Task 2: Configuração base do `expo-notifications`

**Description:** `lib/notifications.ts` com `configureNotificationHandler()` (comportamento em foreground) e `requestNotificationPermission(): Promise<boolean>`. Configurar canal Android dedicado (importância alta, som) via `Notifications.setNotificationChannelAsync`. Chamar a configuração uma vez em `app/_layout.tsx`.

**Acceptance criteria:**
- [x] Handler configurado
- [x] Canal Android "lembretes" criado com importância alta
- [x] `requestNotificationPermission` não crasha se negado

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: abrir o app, sem crash *(pendente)*

**Dependencies:** Task 1

**Files likely touched:**
- `lib/notifications.ts`, `app/_layout.tsx`

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Fundação
- [ ] `npx tsc --noEmit` limpo
- [ ] Manual: app abre sem crash, banco migra sem erro

## Phase 2: Campo de antecedência

### Task 3: Campo de antecedência no `ItemForm`

**Description:** Quando o alerta está ligado, mostrar um campo "Avisar com quantos dias de antecedência": atalhos rápidos (chips 1/3/5/7 dias) + entrada manual, default 3 ao ligar o alerta pela primeira vez. Some/reaparece junto com o toggle de alerta.

**Acceptance criteria:**
- [x] Campo só aparece com alerta ligado
- [x] Selecionar um chip preenche o valor; entrada manual também funciona
- [x] Valor mínimo 1 (não aceita 0 ou negativo)
- [x] `reminderDaysBefore` é enviado no cadastro/edição junto com os outros campos

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: ligar/desligar o alerta e ver o campo aparecer/sumir; testar chip e entrada manual *(pendente)*

**Dependencies:** Task 2

**Files likely touched:**
- `components/ItemForm.tsx`, `app/index.tsx`, `app/item/[id].tsx`

**Estimated scope:** Medium: 3 files

---

## Phase 3: Agendamento e deep-link

### Task 4: Motor de agendamento

**Description:** Em `lib/notifications.ts`: `scheduleEarlyReminder(item)` (vencimento - `reminderDaysBefore` dias, 9h; `null` se já passou), `scheduleFinalReminder(item)` (dia do vencimento, 8h; `null` se já passou), `cancelReminder(id)`, e `syncRemindersForItem(item)` (cancela os 2 atuais, agenda os que fizerem sentido conforme `alertEnabled`, salva os novos ids via `updateItem`, retorna o item atualizado). Cada notificação carrega `data: { itemId: item.id }`.

**Acceptance criteria:**
- [x] Os 2 lembretes são independentes (um pode agendar sem o outro)
- [x] Lembrete cujo horário já passou não é agendado (sem erro)
- [x] `syncRemindersForItem` sempre cancela os ids antigos antes de decidir os novos
- [x] `alertEnabled: false` só cancela, não agenda nada

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Teste manual isolado (log dos ids/horários) confirma os cálculos *(será validado na integração, Fase 4)*

**Dependencies:** Task 3

**Files likely touched:**
- `lib/notifications.ts`

**Estimated scope:** Medium: 1 arquivo, lógica bem coberta

---

### Task 5: Deep-link (resposta à notificação)

**Description:** Listener central em `app/_layout.tsx`: `Notifications.addNotificationResponseReceivedListener` (app aberto/background) e checagem de `Notifications.getLastNotificationResponseAsync()` no boot (cold start) — ambos navegam pra `router.push('/item/' + itemId)`.

**Acceptance criteria:**
- [x] Tocar numa notificação com o app aberto navega pro item certo
- [x] Tocar com o app em background navega pro item certo
- [x] Tocar com o app fechado (cold start) abre direto no item certo

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: os 3 cenários acima *(será testado com rigor na Task 9)*

**Dependencies:** Task 4

**Files likely touched:**
- `app/_layout.tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Motor de notificação
- [x] `npx tsc --noEmit` limpo
- [ ] Teste manual isolado: agendar os 2, cancelar, tocar numa notificação de teste navega certo *(validado na Fase 4/Task 9)*

## Phase 4: Integração

### Task 6: Integrar no cadastro

**Description:** `addRecord` em `app/index.tsx` chama `syncRemindersForItem` após `insertItem`.

**Acceptance criteria:**
- [x] Cadastrar com alerta ligado agenda os lembretes cabíveis e persiste os ids
- [x] Cadastrar sem alerta não agenda nada

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: cadastrar item com alerta e antecedência definida *(pendente)*

**Dependencies:** Task 5

**Files likely touched:**
- `app/index.tsx`

**Estimated scope:** Small: 1 file

---

### Task 7: Integrar na edição e exclusão

**Description:** `handleSave` em `app/item/[id].tsx` chama `syncRemindersForItem` após `updateItem` (cobre mudar data, antecedência, ligar/desligar alerta). `handleDelete` chama `cancelReminder` pros 2 ids antes/depois de `deleteItem`.

**Acceptance criteria:**
- [x] Editar data reagenda os 2 lembretes pra nova data
- [x] Editar só a antecedência reagenda só o aviso antecipado
- [x] Desligar o alerta cancela os 2, sem reagendar
- [x] Excluir cancela os 2

**Verification:**
- [x] `npx tsc --noEmit`
- [ ] Manual: os 4 cenários acima *(pendente)*

**Dependencies:** Task 6

**Files likely touched:**
- `app/item/[id].tsx`

**Estimated scope:** Small: 1 file

---

## Checkpoint: Integração
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual: criar/editar/excluir com alerta ligado agenda e cancela certo nos dois lembretes *(pendente)*

## Phase 5: Config nativa e validação

### Task 8: Plugin no `app.json`

**Description:** Adicionar `expo-notifications` em `plugins`, com ícone/cor padrão e configuração do canal Android (se aplicável via plugin).

**Acceptance criteria:**
- [x] Plugin configurado
- [x] `npx expo-doctor` sem novos erros

**Verification:**
- [x] `npx expo-doctor`

**Dependencies:** Task 7

**Files likely touched:**
- `app.json`

**Estimated scope:** Small: 1 file

---

### Task 9: Validação manual minuciosa

**Description:** Rodar o checklist de validação completo do [plan-notificacoes.md](plan-notificacoes.md) (permissão negada/concedida, cálculo dos 2 horários, editar data/antecedência, desligar alerta, excluir, chegada real da notificação, deep-link nos 3 cenários — app aberto/background/fechado, som/vibração).

**Acceptance criteria:**
- [x] Todos os itens do checklist do plano passaram

**Verification:**
- [x] Manual completo no Expo Go, item por item do checklist

**Dependencies:** Task 8

**Files likely touched:**
- Nenhum (só teste)

**Estimated scope:** Small

---

## Checkpoint: Complete
- [x] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [x] Checklist de validação 100% passado
- [x] Vault Obsidian atualizado
- [ ] Review com o usuário
