# 🏗️ Asphalt Pro - Guia Completo para IAs e Desenvolvedores (Claude / Codex / Gemini)

Este documento foi elaborado para fornecer **contexto técnico completo, padrões de código, decisões arquiteturais e o roadmap exato** do projeto para que qualquer IA (Claude, Codex, GPT, etc.) ou desenvolvedor continue o desenvolvimento no VS Code sem atrito.

---

## 📌 1. Visão Geral do Produto

**Asphalt Pro** é um sistema completo de Gestão Financeira, Controle de Fluxo de Caixa, Orçamentos e Operações voltado especificamente para **Usinas de Asfalto e Pavimentação**.

* **Stack Principal**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons / Material Symbols.
* **Modelo Arquitetural**: **Offline-First Híbrido com Sincronização em Nuvem (Postgres/Supabase/Firebase Ready) & PWA**.
* **Zero Falha no Campo**: Se o operador ou gerente estiver na usina ou na estrada sem internet, o sistema funciona 100% gravando na fila local (`SyncQueue`) com identificadores idempotentes (UUID), sincronizando automaticamente assim que a conexão retornar.

---

## 📂 2. Estrutura do Projeto

```
/
├── ARCHITECTURE.md              # Decisões técnicas e diagrama do SyncEngine
├── HANDOFF_FOR_AI.md            # [ESTE ARQUIVO] Guia mestre para Claude / Codex
├── index.html                   # Entry point com manifesto PWA e fontes
├── package.json                 # Dependências e scripts de build
├── public/
│   ├── manifest.json            # Configuração PWA (standalone, ícones, shortcuts)
│   └── sw.js                    # Service Worker (Stale-While-Revalidate)
├── src/
│   ├── main.tsx                 # Inicialização do React e registro do SW
│   ├── App.tsx                  # Layout mestre, roteamento de views e modais
│   ├── types.ts                 # Tipos TypeScript centralizados (entidades + sync)
│   ├── context/
│   │   └── AppContext.tsx       # Estado global, persistência e integração com SyncManager
│   ├── services/
│   │   └── syncManager.ts       # Motor de sincronização, fila transacional e auditoria
│   ├── hooks/
│   │   └── usePWAInstall.ts     # Hook inteligente para instalação do app nativo
│   ├── components/
│   │   ├── common/              # Componentes base: Button, Modal, Card, Input, etc.
│   │   ├── layout/              # Sidebar, TopHeader, QuickActionBar, MobileDrawer
│   │   ├── sync/                # SyncStatusBadge, SyncDetailsModal
│   │   ├── dashboard/           # KPIs, Gráficos de Fluxo, Resumo Executivo
│   │   ├── lancamentos/         # Entradas/Saídas, Filtros, Exportação CSV
│   │   ├── contas/              # Contas a Pagar e Contas a Receber
│   │   ├── orcamentos/          # Gerador e calculador de propostas de asfalto
│   │   ├── colaboradores/       # Gestão de equipe, salários e funções
│   │   ├── relatorios/          # DRE gerencial, fluxo mensal e métricas
│   │   └── configuracoes/       # Parâmetros da usina, categorias e backup
│   └── utils/                   # Formatadores (BRL, datas, cálculos de tonelagem)
```

---

## ✅ 3. O que JÁ FOI FEITO e COMO FOI FEITO

### A. Core Financeiro e Módulos Operacionais
1. **Painel Dashboard**: KPIs de saldo consolidado, entradas, saídas, previsão de fluxo de caixa e alertas de contas a vencer.
2. **Lançamentos (Entradas & Saídas)**: Cadastro rápido com categorização (CBUQ, Capa Asfáltica, Diesel, Brita, Folha), filtros avançados e exportação de relatórios.
3. **Contas a Pagar & Receber**: Controle de status (Pendente/Pago), cálculo automático de vencimentos e integração direta com o fluxo de caixa ao baixar títulos.
4. **Calculadora e Gerador de Orçamentos**: Cálculo automatizado de toneladas de asfalto (CBUQ) com base em área ($m^2$), espessura e densidade, cálculo de frete por km e geração de propostas prontas para impressão.
5. **Gestão de Equipe / Colaboradores**: Controle de quadro de funcionários da usina e motoristas.
6. **Relatórios Gerenciais**: Gráficos analíticos de despesas por centro de custo e faturamento mensal.

### B. Arquitetura de Sincronização e Resiliência Offline
1. **`src/services/syncManager.ts`**:
   - Fila de mutações transacional com gravação instantânea em `localStorage`.
   - Idempotência: Cada entidade recebe um UUID único. Mesmo que haja reenvios por falha de sinal, os registros não duplicam.
   - Detecção em tempo real de `online`, `offline`, `syncing` e `error`.
   - Modo de simulação offline integrado para testes de campo.
   - Histórico de auditoria com os últimos 50 eventos de sincronização.
2. **Integração no `AppContext.tsx`**:
   - Todas as ações de CRUD (`addTransaction`, `toggleAccountPaid`, `deleteAccount`, `addQuote`, etc.) chamam `syncManager.enqueue(...)` automaticamente de forma transparente.
3. **Componentes de Status**:
   - `SyncStatusBadge`: Exibido no cabeçalho com indicador verde/laranja/animado.
   - `SyncDetailsModal`: Janela com detalhes da fila, botão de sincronização forçada e alternador de teste offline.
4. **PWA Instalável**:
   - `manifest.json` e `sw.js` com suporte para instalação no Windows, macOS, Android e iOS.
   - Botão de instalação nativo no cabeçalho e rodapé da barra lateral.

---

## 🚀 4. O que a IA (Claude / Codex / Você) DEVE FAZER A SEGUIR (Roadmap Prático)

Aqui está a lista ordenada de próximos passos prioritários para serem executados no VS Code:

### 🔹 Fase 1: Conexão Real com Backend / Nuvem (Supabase ou Postgres)
- Criar a tabela no Supabase/PostgreSQL com base no arquivo `ARCHITECTURE.md`.
- No `src/services/syncManager.ts`, substituir a função mock `processQueue()` pela chamada real de **Upsert** na API REST ou cliente do Supabase:
  ```typescript
  // Exemplo de integração no processQueue():
  const { data, error } = await supabase.from(item.entityType).upsert(item.payload);
  ```
- Adicionar autenticação multi-usuário (Login por e-mail/senha com papéis: Gerente, Operador de Balança, Financeiro).

### 🔹 Fase 2: Impressão e Compartilhamento de Orçamentos em PDF
- Criar um componente de exportação visual de PDF para o módulo de Orçamentos (`/src/components/orcamentos/QuotePrintTemplate.tsx`).
- Incluir cabeçalho com logo da usina, CNPJ, dados do cliente, cálculo de área/espessura de CBUQ e condições de pagamento.

### 🔹 Fase 3: Controle de Estoque de Insumos da Usina
- Criar a entidade `InventoryItem` (CAP 50/70, Brita 0, Brita 1, Pó de Pedra, Areia, Óleo BPF/Diesel).
- Abater automaticamente o estoque ao lançar uma venda de tonelada de CBUQ.

### 🔹 Fase 4: Exportação Contábil / Excel Avançada
- Implementar biblioteca leve para gerar arquivos `.xlsx` formatados com cabeçalho corporativo na tela de Relatórios e Lançamentos.

---

## 💡 5. Regras e Boas Práticas para o Claude / Codex

Ao editar ou expandir o código:
1. **Componentização Estrita**: Nunca crie componentes gigantescos em um único arquivo. Isole subcomponentes, tipos em `src/types.ts` e utilitários em `src/utils/`.
2. **Ícones**: Utilize classes do Google Material Symbols (`<span className="material-symbols-outlined">...</span>`) ou ícones do `lucide-react`.
3. **Formatação Monetária**: Sempre utilize a função `formatCurrency(valor)` existente em `src/utils/formatters.ts`.
4. **Respeito ao SyncManager**: Sempre que criar uma nova funcionalidade que salve dados, despache o evento correspondente para o `syncManager.enqueue(...)`.
5. **Tipagem TypeScript**: Mantenha `noImplicitAny: true` e valide sempre com `npm run lint` ou `npx tsc --noEmit`.
