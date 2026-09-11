# Implementation Plan: Ajustes finos (pós-v0.1.0)

## Overview

Cinco melhorias confirmadas pelo usuário depois da v0.1.0 (teste em Android fica pra outra hora): validação real de data, confirmação ao descartar edição, exportar/importar dados como backup, pull-to-refresh nas listas, e acessibilidade. Sem mudança de arquitetura — tudo em cima do que já existe.

## Architecture Decisions

- **Validação de data**: em vez de confiar no `date-fns parse` (que pode "rolar" datas inválidas silenciosamente, ex. 31/02 virar 03/03), valido construindo um `Date` nativo e conferindo se dia/mês/ano batem com o que foi digitado. Erro só aparece quando o campo está completo (10 caracteres) — não incomoda no meio da digitação.
- **Descartar edição**: uso o padrão do React Navigation (`navigation.addListener('beforeRemove', ...)`, acessível via `useNavigation()` do `expo-router`) pra interceptar o voltar (botão, gesto, header) só na tela de detalhes do item, comparando os valores atuais com os carregados originalmente. Salvar ou excluir passam por um "flag de bypass" pra não disparar o aviso nessas saídas intencionais.
- **Backup local (sem servidor)**: exportar = serializar os itens pra um arquivo JSON e abrir a folha de compartilhamento nativa (`expo-sharing`) — o usuário decide onde salvar (Arquivos, iCloud, e-mail pra si mesmo, etc.). Importar = escolher um arquivo JSON (`expo-document-picker`) e **adicionar** os itens como novos registros (nunca substitui/apaga o que já existe) — evita perda de dados por engano. Cada item importado ganha um id novo.
- **Nova tela `app/backup.tsx`**, acessada por um ícone de engrenagem na home (ao lado do sino) — primeiro lugar natural pra configurações no app.
- **Pull-to-refresh**: `RefreshControl` nas 3 listas (home, "Ver todos", central de notificações), reaproveitando a mesma função de carregamento que já roda no `useFocusEffect`.
- **Acessibilidade**: `accessibilityLabel`/`accessibilityRole="button"` em todo elemento tocável que ainda não tem — chips de filtro, cards da Visão Geral, chips de status, botões de foto/salvar/excluir/fechar, linhas da lista (rótulo combinando nome + status + prazo).

## Task List

### Phase 1: Melhorias isoladas de baixo risco

- [ ] Task 1: Validação real de data no formulário
- [ ] Task 2: Pull-to-refresh nas 3 listas
- [ ] Task 3: Acessibilidade nos elementos interativos

### Checkpoint: Fase 1
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual: data inválida mostra erro e bloqueia salvar; puxar pra atualizar funciona nas 3 telas; leitor de tela (VoiceOver/TalkBack) anuncia os elementos principais

### Phase 2: Confirmar descarte de edição

- [ ] Task 4: Interceptar saída da tela de detalhes com alterações não salvas

### Checkpoint: Fase 2
- [ ] `npx tsc --noEmit` limpo
- [ ] Manual: editar e tentar voltar sem salvar pede confirmação; salvar ou excluir não pedem

### Phase 3: Backup (exportar/importar)

- [ ] Task 5: Instalar `expo-file-system`, `expo-sharing`, `expo-document-picker`
- [ ] Task 6: `lib/backup.ts` — exportar dados
- [ ] Task 7: `lib/backup.ts` — importar dados
- [ ] Task 8: Tela `app/backup.tsx` + ícone de acesso na home

### Checkpoint: Complete
- [ ] `npx tsc --noEmit` e `npx expo-doctor` limpos
- [ ] Manual: exportar gera um arquivo válido e abre a folha de compartilhamento; importar esse mesmo arquivo adiciona os itens de volta sem duplicar nem apagar nada
- [ ] Vault Obsidian atualizado
- [ ] Review com o usuário

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Dependências novas (`expo-sharing`, `expo-document-picker`) darem problema de compatibilidade no Expo Go | Médio | Instalar e validar com `expo-doctor` + boot do app logo na Task 5, antes de escrever qualquer lógica em cima |
| `beforeRemove` não disparar em todo cenário de saída (ex. deep-link de notificação abrindo por cima) | Baixo | Escopo só cobre navegação normal (botão/gesto/header); casos exóticos ficam como limitação conhecida |
| Importar duplicar itens se o usuário importar o mesmo arquivo duas vezes | Baixo | Comportamento esperado e documentado (importar sempre adiciona) — usuário decide se quer excluir duplicatas depois |
| JSON de backup malformado/de outra origem quebrar o import | Médio | Validar estrutura mínima (campos obrigatórios presentes) antes de inserir; mostrar erro claro se inválido, sem inserir nada parcialmente |

## Open Questions

- Nenhuma pendente — todas as decisões de design foram assumidas com a opção mais segura (import aditivo, não destrutivo) e serão confirmadas com o usuário nos testes manuais de cada fase.
