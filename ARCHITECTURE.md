# Arquitetura do Sistema Asphalt Pro
## Estrutura Híbrida: Nuvem com Sincronização Offline-First & PWA

Este documento detalha o planejamento técnico, padrões de código, componentização e estratégias de contingência implementadas no **Asphalt Pro**.

---

### 1. Visão Geral da Arquitetura

O sistema opera no modelo **Offline-First com Nuvem Primária**:
- **Ambiente Online (Padrão)**: Cada ação (criação de lançamento, alteração de título a pagar/receber, geração de orçamento) é persistida no cache local para renderização em tempo zero (< 16ms) e sincronizada instantaneamente com a Nuvem.
- **Ambiente Offline (Contingência na Usina/Campo)**: As operações continuam funcionando normalmente. As transações são alocadas em uma **Fila de Sincronização Transacional (Sync Queue)** com criptografia e validação local.
- **Retorno da Conectividade**: O `SyncEngine` detecta automaticamente a conexão (via eventos nativos `online`/`offline` e *heartbeat*) e despacha a fila em lote ordenado cronologicamente.

```
                    ┌─────────────────────────┐
                    │    Interface do Usuário │
                    │   (React 18 + Tailwind) │
                    └────────────┬────────────┘
                                 │
                   ┌─────────────▼─────────────┐
                   │    Application Context    │
                   │ (Estado Global + Storage) │
                   └─────────────┬─────────────┘
                                 │
                   ┌─────────────▼─────────────┐
                   │    Sync Manager Engine    │
                   │ (Fila, Retry & Idempotência)│
                   └──────┬─────────────┬──────┘
                          │             │
              [Online]    │             │ [Offline]
                          ▼             ▼
               ┌─────────────┐   ┌─────────────┐
               │ Nuvem / API │   │ LocalStorage│
               │ (Postgres/  │   │ + SyncQueue │
               │  Supabase)  │   │  (Idempot.) │
               └─────────────┘   └─────────────┘
```

---

### 2. Estratégia Anti-Duplicidade e Idempotência

Para eliminar qualquer risco de registros duplicados em conexões instáveis:

1. **UUIDv4 Gerado no Cliente**:
   - Todo registro (`Transaction`, `AccountItem`, `Quote`) recebe um identificador universal único (`id: uuidv4()`) no momento exato do clique do usuário.
   - Se o navegador tentar enviar o mesmo registro 3 vezes por oscilação de rede, a Nuvem executa a operação como **Upsert** (`INSERT ... ON CONFLICT (id) DO UPDATE`), garantindo que não existam registros duplicados.

2. **Ordenação Cronológica com Timestamps ISO (UTC)**:
   - Todo registro contém `createdAt` e `updatedAt`.
   - A fila processa alterações respeitando a ordem temporal exata do evento original na usina.

3. **Resolução de Conflitos (LWW - Last Write Wins)**:
   - Em caso de edições concorrentes (ex: escritório e usina editando o mesmo orçamento), o registro com o `updatedAt` mais recente prevalece, e uma entrada de auditoria é gravada no log de sincronização.

---

### 3. Progressive Web App (PWA) & Armazenamento

1. **Instalação Nativa**:
   - `manifest.json` configurado para execução em modo `standalone` (sem barras do navegador).
   - Hook de instalação inteligente (`usePWAInstall`) para alertar o usuário sobre a instalação no Windows, macOS, Android e iOS.

2. **Service Worker Caching**:
   - Estratégia **Stale-While-Revalidate** para recursos estáticos (fontes, ícones, CSS, JS).
   - Carregamento instantâneo mesmo com sinal zero de rede.

---

### 4. Boas Práticas e Componentização

- **Modularidade Estrita**: Todo componente possui responsabilidade única.
- **Tipagem Segura (TypeScript)**: Enums e interfaces centralizados em `/src/types.ts`.
- **Feedback Visual Claro**: Indicador de status de rede em tempo real no cabeçalho (Conectado, Sincronizando, Fila Offline) com modal de auditoria para inspeção.
