# Asphalt Pro - Sistema de Gestão para Usina de Asfalto

Sistema integrado de controle financeiro, fluxo de caixa, orçamentos em folha timbrada A4, contas a pagar e receber, folha de pagamento e gestão de clientes e fornecedores.

---

## 🚀 Como Executar no VS Code

### 1. Pré-requisitos
- **Node.js**: versão 18 ou superior instalada (recomendado: Node 20 LTS ou 22).
  - Verifique digitando no terminal: `node -v` e `npm -v`.
- **VS Code**: [Download do Visual Studio Code](https://code.visualstudio.com/).

### 2. Instalação das Dependências
Abra a pasta do projeto no VS Code (`File > Open Folder...`) e abra o terminal integrado (`Ctrl + \`` ou `Terminal > New Terminal`):

```bash
npm install
```

*(Também é compatível com `pnpm install` ou `bun install` se preferir).*

### 3. Variáveis de Ambiente (Opcional)
Se for utilizar funcionalidades de inteligência artificial com a API Gemini:
1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adicione sua chave em `GEMINI_API_KEY` caso utilize chamadas de IA.
*(Para a execução de todas as funcionalidades de fluxo de caixa, orçamentos, folha timbrada, cadastros e relatórios locais, o arquivo `.env` é opcional).*

### 4. Iniciar o Servidor de Desenvolvimento
No terminal do VS Code, execute:

```bash
npm run dev
```

O terminal exibirá o link de acesso local:
```
  ➜  Local:   http://localhost:3000/
```
Basta segurar `Ctrl` e clicar no link ou abrir seu navegador em `http://localhost:3000`.

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR). |
| `npm run build` | Compila o projeto otimizado para produção na pasta `dist/`. |
| `npm run preview` | Executa localmente o build de produção para testes prévios. |
| `npm run lint` | Valida erros de tipagem TypeScript (`tsc --noEmit`). |

---

## 🔌 Extensões Recomendadas no VS Code

Ao abrir o projeto, o VS Code sugerirá instalar as extensões configuradas em `.vscode/extensions.json`:
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`): Autocompletar classes de utilitários Tailwind.
- **Prettier - Code formatter** (`esbenp.prettier-vscode`): Formatação automática de código.
- **ES7+ React/Redux/React-Native snippets**: Atalhos rápidos para componentes React.

---

## 📁 Estrutura do Projeto

- `/src/components/`: Telas e componentes modulares (Orçamentos, Contas, Fluxo de Caixa, Folha, Cadastros).
- `/src/context/AppContext.tsx`: Gerenciamento de estado global reativo com persistência local (`localStorage`) e fila de sincronização.
- `/src/data/initialData.ts`: Dados iniciais de demonstração da usina de asfalto.
- `/src/types.ts`: Tipos TypeScript rigorosos do sistema.
- `/src/utils/`: Utilitários de formatação de moeda (BRL), datas e relatórios.
