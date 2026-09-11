# Implementation Plan: Persistência local com Expo SQLite

## Overview

Migrar o Vali de protótipo visual (dados em `useState` no [App.tsx](../App.tsx)) para persistência local real usando `expo-sqlite` (já instalado). Escopo: apenas a camada de dados e a integração no App.tsx existente. Notificações locais, Expo Router e novas telas ficam fora desta fatia.

## Architecture Decisions

- **Módulo de banco isolado** em `db/` (schema + repositório), para manter App.tsx focado em UI e permitir testar a camada de dados sem renderizar componentes.
- **Separar `status` (fluxo) de `urgency` (derivado da data).** Hoje o protótipo usa rótulos de urgência ("Urgente", "Atenção", "No prazo") calculados a partir de `days` como se fossem status. O AGENTS.md define o enum de status oficial (Pendente, Resolvido, Retirado, Trocado, Vencido). Schema vai persistir `status` (default `Pendente`) como coluna própria; a badge de urgência continua sendo calculada em runtime a partir da data de vencimento, sem persistir. Isso resolve a inconsistência sem inventar UI nova.
- **`item` e `expiryDate` como únicos campos `NOT NULL`**; todo o resto (loja, foto, quantidade, marca, observação, alerta) é `NULL`-ável, conforme AGENTS.md.
- **`expo-sqlite` API assíncrona** (`openDatabaseAsync` + `execAsync`/`runAsync`/`getAllAsync`), rodando `CREATE TABLE IF NOT EXISTS` no boot — sem lib de migração externa, já que é MVP single-table.
- **`initialRecords` vira seed opcional**, não dado fixo em memória — só populado se a tabela estiver vazia, para o app não nascer vazio na demo, mas sem mascarar que os dados agora vêm do banco.

## Task List

### Phase 1: Foundation

- [ ] Task 1: Schema e conexão SQLite
- [ ] Task 2: Repositório de itens (CRUD)

### Checkpoint: Foundation
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx expo-doctor` sem erros novos
- [ ] Banco abre e cria tabela sem crash (log manual via `expo start`)

### Phase 2: Core Integration

- [ ] Task 3: Carregar itens do banco no boot do app
- [ ] Task 4: Persistir criação de item no banco

### Checkpoint: Core Integration
- [ ] Fluxo manual: abrir app → cadastrar item → fechar/recarregar app → item continua lá

### Phase 3: Polish

- [ ] Task 5: Seed controlado + remoção do estado fixo antigo
- [ ] Task 6: Atualizar README.md

### Checkpoint: Complete
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Fluxo end-to-end validado manualmente (Expo Go)
- [ ] README reflete o estado real (SQLite integrado, notificações ainda pendentes)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| API do `expo-sqlite` (sync vs async) mudar comportamento entre plataformas | Médio | Usar só a API assíncrona documentada para SDK 57, testar em Android e iOS via Expo Go |
| Inconsistência status vs urgência já embutida na UI atual | Baixo | Resolvida na Task 1/3 via decisão de arquitetura acima; revisitar UI de status em fatia futura |
| Perda de dados ao trocar schema depois (sem migração formal) | Baixo (MVP local) | Documentar no README que é dado local de protótipo; migração formal fica para quando houver mais de uma versão de schema em uso real |

## Open Questions

- A UI vai ganhar uma ação explícita para mudar `status` (Pendente → Resolvido/Retirado/Trocado/Vencido) nesta fatia, ou isso é uma fatia futura separada? (Assumido: fatia futura — esta fatia só persiste o campo.)
